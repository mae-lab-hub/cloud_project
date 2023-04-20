import boto3
from boto3.dynamodb.conditions import Key
class DynamoService:
    def __init__(self):
        dynamodb = boto3.resource('dynamodb')
        self.table = dynamodb.Table('contacts')
        self.dynamodb_client = boto3.client('dynamodb')
        self.user_id = ""

    def save_item(self,data):

        response = self.table.put_item(
        Item=data)
    
    
    def delete_contact(self, data):
            lead_name = data['lead_name']
            current_user_id = data['current_user_id']

            record_user_id = self.query_contacts(data['lead_name'])[0]['user_id']
            print('record_user_id',record_user_id)

            if record_user_id != current_user_id:
                data = {'message':"Cannot delete record made by another user."}
                return data


            self.table.delete_item(Key={'lead_name': lead_name})

            data = {'message':"Contact deleted"}
            return data
        
    def update_contact(self, response):

        data = response['entity_data']

        current_user_id = response['user_id_element']
        #user_id = data[]
        print('current_user_id:', current_user_id)
        #if user_id == to user_id in da
        #if user_id 

        record_user_id = self.query_contacts(data['lead_name'])[0]['user_id']
        print('record_user_id',record_user_id)

        if record_user_id != current_user_id:
            data = {'message':"Cannot edit record made by another user."}
            return data


        

        print("In update contact")
        response = self.table.update_item(
                        Key={'lead_name': data['lead_name']},
                        UpdateExpression="set address=:a, phone_number=:p, site=:u,email=:e",
                        ExpressionAttributeValues={
                            ':a': data['address'], ':p': data['phone_number'],':u':data['site'],':e':data['email']},
                        ReturnValues="UPDATED_NEW")

        data = {'message':"Contact Updated"}
        return data

    def query_contacts(self, lead_name):

        response = self.table.query(KeyConditionExpression=Key("lead_name").eq(lead_name))

        items = response['Items']
        print(items)
        return(items)
