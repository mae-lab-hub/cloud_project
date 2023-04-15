import re
import boto3
import uuid
from chalice import Chalice, BadRequestError, CORSConfig
from requests_toolbelt.multipart import decoder
from boto3.dynamodb.conditions import Key
from urllib.parse import unquote

app = Chalice(app_name='business-card-ocr')
app.api.cors = True
cors_config = CORSConfig(
    allow_origin='*',
    allow_headers=['Content-Type', 'Authorization'],
    max_age=600,
    expose_headers=['Content-Type', 'Authorization']
)
s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')
dynamodb = boto3.resource('dynamodb')
comprehend = boto3.client('comprehend')

BUCKET_NAME = 'contentcen301217825.aws.ai'
TABLE_NAME = 'leads-contact'
REGION = 'us-east-1'

leads_table = dynamodb.Table(TABLE_NAME)


@app.route('/process_image', methods=['POST'], content_types=['multipart/form-data'])
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

    response = rekognition.detect_text(
        Image={
            'S3Object': {
                'Bucket': BUCKET_NAME,
                'Name': object_name
            }
        }
    )

    extracted_info = extract_info(response)
    return extracted_info


def extract_info(rekognition_response):
    text_list = [text_detection['DetectedText'] for text_detection in rekognition_response['TextDetections']]

    extracted_info = {
        'name': '',
        'phone_numbers': [],
        'email': '',
        'website': '',
        'address': ''
    }
    for text in text_list:
        if re.match(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text):
            extracted_info['email'] = text
        elif re.match(r'(?:http|ftp|https)://(?:[\w_-]+(?:(?:\.[\w_-]+)+))(?:[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?',
                      text):
            extracted_info['website'] = text
        elif re.match(r'\+?[0-9\s-]{8,15}', text):
            extracted_info['phone_numbers'].append(text)
        # Try to detect the name based on the assumption that it is in title case (e.g., John Doe)
        elif re.match(r'(?:(?:[A-Z][a-z]+\s*){1,3})', text) and not extracted_info['name']:
            extracted_info['name'] = text
        # Detect the address based on the assumption that it contains a combination of alphanumeric characters, spaces, and commas
        elif re.match(r'\d{1,5}\s\w+\s(\w+\s){0,4}\w+(\s\w+)?', text) and not extracted_info['address']:
            extracted_info['address'] = text

    return extracted_info


@app.route('/save_data', methods=['POST'], content_types=['application/json'])
def save_data():
    data = app.current_request.json_body
    data['user_id'] = 'user1'  # Hardcoded user ID for now
    data['id'] = str(uuid.uuid4())  # Generate a unique ID for the lead

    # Save the item to DynamoDB
    leads_table.put_item(Item=data)

    return {'status': 'success'}


@app.route('/get_lead/{lead_name}', methods=['GET'])
def get_lead(lead_name):
    response = leads_table.scan(
        FilterExpression="contains(#name, :lead_name)",
        ExpressionAttributeNames={"#name": "name"},
        ExpressionAttributeValues={":lead_name": lead_name}
    )
    return response['Items']


@app.route('/update_lead/{lead_id}', methods=['PUT'])
def update_lead(lead_id):
    data = app.current_request.json_body
    user_id = data.get('user_id')

    if not user_id:
        raise BadRequestError("Missing user_id")

    lead = leads_table.get_item(Key={'id': lead_id}).get('Item')
    if not lead:
        raise BadRequestError("Lead not found")

    if lead['user_id'] != user_id:
        raise BadRequestError("You can only update records you created")

    update_expression = "SET "
    expression_attribute_values = {}
    expression_attribute_names = {}
    for key, value in data.items():
        if key != 'user_id':
            update_expression += f"#{key} = :{key}, "
            expression_attribute_values[f":{key}"] = value
            expression_attribute_names[f"#{key}"] = key

    update_expression = update_expression.rstrip(', ')

    leads_table.update_item(
        Key={'id': lead_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ExpressionAttributeNames=expression_attribute_names
    )
    return {'status': 'success'}

@app.route('/search_lead', methods=['POST'], content_types=['application/x-www-form-urlencoded'])
def search_lead():
    data = app.current_request.raw_body.decode('utf-8').split('&')
    data = dict(item.split('=') for item in data)
    lead_name = unquote(data['lead_name']).replace('+', ' ')

    # Query using the Global Secondary Index "user_id-name-index"
    response = leads_table.query(
        IndexName='user_id-name-index',
        KeyConditionExpression=Key('user_id').eq('user1') & Key('name').eq(lead_name)
    )

    return {'results': response['Items']}
