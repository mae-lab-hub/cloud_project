import re
import boto3
import uuid
from chalice import Chalice, BadRequestError, CORSConfig
from requests_toolbelt.multipart import decoder
from boto3.dynamodb.conditions import Key
from urllib.parse import parse_qs


app = Chalice(app_name='business-card')
app.api.binary_types.append('*/*')
app.api.cors = True
cors_config = CORSConfig(
    allow_origin='*',
    allow_headers=['Content-Type', 'X-Requested-With', 'X-Amz-Date', 'X-Amz-Security-Token', 'Authorization', 'X-Api-Key', 'X-Amz-User-Agent'],
    max_age=600,
    expose_headers=['Content-Type', 'X-Requested-With', 'X-Amz-Date', 'X-Amz-Security-Token', 'Authorization', 'X-Api-Key', 'X-Amz-User-Agent']
)

BUCKET_NAME = ''
TABLE_NAME = 'leads-contact'


s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')
textract = boto3.client('textract')
comprehend = boto3.client('comprehend')
dynamodb = boto3.resource('dynamodb')
leads_table = dynamodb.Table(TABLE_NAME)



leads_table = dynamodb.Table(TABLE_NAME)




@app.route('/process_image', methods=['POST'], content_types=['multipart/form-data'], cors=cors_config)
def process_image():
    content_type = app.current_request.headers['content-type']

    file = None
    multipart_data = decoder.MultipartDecoder(app.current_request.raw_body, content_type)
    for part in multipart_data.parts:
        if part.headers[b'Content-Disposition'].decode().find('filename') > 0:
            file = part
            break

    if not file:
        raise BadRequestError("No image found in the request")

    object_name = file.headers[b'Content-Disposition'].decode().split('filename="')[1].split('"')[0]
    s3.put_object(Bucket=BUCKET_NAME, Key=object_name, Body=file.content,
                  ContentType=file.headers[b'Content-Type'].decode())

    # Amazon Rekognition
    rekognition_response = rekognition.detect_text(
        Image={
            'S3Object': {
                'Bucket': BUCKET_NAME,
                'Name': object_name
            }
        }
    )

    rekognition_text_list = [text_detection['DetectedText'] for text_detection in rekognition_response['TextDetections']]

    # Amazon Textract
    textract_response = textract.analyze_document(
        Document={
            'S3Object': {
                'Bucket': BUCKET_NAME,
                'Name': object_name
            }
        },
        FeatureTypes=['TABLES', 'FORMS']
    )

    textract_text_list = [block['Text'] for block in textract_response['Blocks'] if block['BlockType'] == 'WORD']

    # Combine text from both Rekognition and Textract
    text_list = list(set(rekognition_text_list + textract_text_list))
    combined_text = ' '.join(text_list)
    extracted_info = extract_info(text_list, combined_text)
    return extracted_info


def extract_info(text_list, combined_text):
    # Use Comprehend to detect entities in the combined text
    comprehend_response = comprehend.detect_entities(Text=combined_text, LanguageCode='en')
    entities = comprehend_response['Entities']

    extracted_info = {
        'name': '',
        'phone_numbers': [],
        'email': '',
        'website': '',
        'address': ''
    }

    # Use regular expressions to extract information from text_list
    for text in text_list:
        if re.match(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text):
            extracted_info['email'] = text
        elif re.match(r'(?:http|ftp|https)://(?:[\w_-]+(?:(?:\.[\w_-]+)+))(?:[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?', text):
            extracted_info['website'] = text
        elif re.match(r'\+?[0-9\s-]{8,15}', text):
            extracted_info['phone_numbers'].append(text)
        elif re.match(r'(?:(?:[A-Z][a-z]+\s*){1,3})', text) and not extracted_info['name']:
            extracted_info['name'] = text
        elif re.match(r'\d{1,5}\s\w+\s(\w+\s){0,4}\w+(\s\w+)?', text) and not extracted_info['address']:
            extracted_info['address'] = text

    # Use Comprehend to extract information from the combined text
    for entity in entities:
        if entity['Type'] == 'PERSON' and not extracted_info['name']:
            extracted_info['name'] = entity['Text']
        elif entity['Type'] == 'EMAIL' and not extracted_info['email']:
            extracted_info['email'] = entity['Text']
        elif entity['Type'] == 'PHONE' and entity['Text'] not in extracted_info['phone_numbers']:
            extracted_info['phone_numbers'].append(entity['Text'])
        elif entity['Type'] == 'URL' and not extracted_info['website']:
            extracted_info['website'] = entity['Text']
        elif entity['Type'] == 'LOCATION' and not extracted_info['address']:
            extracted_info['address'] = entity['Text']

    return extracted_info




@app.route('/save_data', methods=['POST'], content_types=['application/json'], cors=cors_config)
def save_data():
    data = app.current_request.json_body
    user_id = data.get('user_id')  # Get user_id from the request
    image_id = data.get('image_id')  # Get image_id from the request

    if not user_id:
        raise BadRequestError("User ID is required")

    if not image_id:
        raise BadRequestError("Image ID is required")

    data['user_id'] = user_id

    # Check if the lead with the same user_id and image_id already exists
    existing_lead = leads_table.query(
        IndexName='user_id-image_id-index',
        KeyConditionExpression=Key('user_id').eq(user_id) & Key('image_id').eq(image_id)
    ).get('Items')

    if existing_lead:
        # Update the existing lead
        lead_id = existing_lead[0]['id']
        data['lead_id'] = lead_id

    if 'lead_id' in data:
        # Update existing lead
        lead_id = data['lead_id']
        lead = leads_table.get_item(Key={'user_id': user_id, 'id': lead_id}).get('Item')
        if not lead:
            raise BadRequestError("Lead not found")

        if lead['user_id'] != user_id:
            raise BadRequestError("You can only update records you created")

        update_expression = "SET "
        expression_attribute_values = {}
        expression_attribute_names = {}
        for key, value in data.items():
            if key not in ['user_id', 'lead_id']:
                update_expression += f"#{key} = :{key}, "
                expression_attribute_values[f":{key}"] = value
                expression_attribute_names[f"#{key}"] = key

        update_expression = update_expression.rstrip(', ')

        leads_table.update_item(
            Key={'user_id': user_id, 'id': lead_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names
        )
    else:
        # Create new lead
        data['id'] = str(uuid.uuid4())  # Generate a unique ID for the lead

        # Save the item to DynamoDB
        leads_table.put_item(Item=data)

    return {'status': 'success'}


@app.route('/get_lead/{lead_id}', methods=['GET'], cors=cors_config)
def get_lead(lead_id):
    user_id = app.current_request.query_params.get('user_id')
    if not user_id:
        raise BadRequestError("User ID is required.")

    lead = leads_table.get_item(Key={'user_id': user_id, 'id': lead_id}).get('Item')
    # Add user_id to the response
    return {
        'name': lead['name'],
        'phone_numbers': lead['phone_numbers'],
        'email': lead['email'],
        'website': lead['website'],
        'address': lead['address'],
        'user_id': lead['user_id']
    }


@app.route('/search_lead', methods=['GET', 'POST'], cors=cors_config, content_types=['application/x-www-form-urlencoded'])
def search_lead():
    parsed_body = parse_qs(app.current_request.raw_body.decode(), keep_blank_values=True)
    search_name = parsed_body.get('lead_name', [''])[0]
    if not search_name:
        raise BadRequestError("Name is required for search")

    response = leads_table.scan()
    leads = response['Items']

    filtered_leads = [
        lead for lead in leads
        if lead['name'].lower() == search_name.lower()
    ]

    return filtered_leads

@app.route('/update_lead/{lead_id}', methods=['PUT'], content_types=['application/json'], cors=cors_config)
def update_lead(lead_id):
    data = app.current_request.json_body
    user_id = data.get('user_id')  # Get user_id from the request

    if not user_id:
        raise BadRequestError("User ID is required")

    lead = leads_table.get_item(Key={'user_id': user_id, 'id': lead_id}).get('Item')
    if not lead:
        raise BadRequestError("Lead not found")

    if lead['user_id'] != user_id:
        raise BadRequestError("You can only update records you created")

    update_expression = "SET "
    expression_attribute_values = {}
    expression_attribute_names = {}
    for key, value in data.items():
        if key not in ['user_id', 'lead_id']:
            update_expression += f"#{key} = :{key}, "
            expression_attribute_values[f":{key}"] = value
            expression_attribute_names[f"#{key}"] = key

    update_expression = update_expression.rstrip(', ')

    leads_table.update_item(
        Key={'user_id': user_id, 'id': lead_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ExpressionAttributeNames=expression_attribute_names
    )

    return {'status': 'success'}

@app.route('/delete_lead/{lead_id}', methods=['DELETE', 'POST', 'GET'], cors=cors_config)
def delete_lead(lead_id):
    user_id = app.current_request.query_params.get('user_id')  # Get the user_id from the query parameters
    if not user_id:
        raise BadRequestError("User ID is required")

    lead = leads_table.get_item(Key={'id': lead_id, 'user_id': user_id}).get('Item')

    if not lead:
        app.log.error(f"Lead not found for lead_id: {lead_id}, user_id: {user_id}")
        raise BadRequestError("Lead not found")

    leads_table.delete_item(Key={'user_id': lead['user_id'], 'id': lead_id})

    return {'status': 'success'}