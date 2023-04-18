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
    
    
    def delete_contact(self, lead_name):

            self.table.delete_item(Key={'user_id':user_id,'lead_name': lead_name})
        
    def update_contact(self, data):

        user_id = data['user_id']
        #if user_id == to user_id in da
        #if user_id 

        print("In update contact")
        response = self.table.update_item(
                        Key={'lead_name': data['lead_name']},
                        UpdateExpression="set address=:a, phone_number=:p, site=:u,email=:e",
                        ExpressionAttributeValues={
                            ':a': data['address'], ':p': data['phone_number'],':u':data['site'],':e':data['email']},
                        ReturnValues="UPDATED_NEW")

    def query_contacts(self, lead_name):

        response = self.table.query(KeyConditionExpression=Key("lead_name").eq(lead_name))

        items = response['Items']
        print(items)
        return(items)
