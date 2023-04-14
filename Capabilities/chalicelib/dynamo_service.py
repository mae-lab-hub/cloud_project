import boto3
from boto3.dynamodb.conditions import Key
class DynamoService:
    def __init__(self):
        dynamodb = boto3.resource('dynamodb')
        self.table = dynamodb.Table('contact_table')

    def save_item(self,data):

        response = self.table.put_item(
        Item=data)
    
    
    def delete_contact(self, lead_name):

            self.table.delete_item(Key={'lead_name': lead_name, 'creation_date':'04-14-2023'})
        
    def update_contact(self, data):

        response = self.table.update_item(
                        Key={'lead_name': data['lead_name'], 'creation_date': data['creation_date']},
                        UpdateExpression="set address=:a, phone_number=:p, site=:u,email=:e",
                        ExpressionAttributeValues={
                            ':a': data['address'], ':p': data['phone_number'],':u':data['site'],':e':data['email']},
                        ReturnValues="UPDATED_NEW")

    def query_contacts(self, lead_name):

        response = self.table.query(KeyConditionExpression=Key("lead_name").eq(lead_name))
        
        items = response['Items']
        print(items)
