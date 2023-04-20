import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
class DynamoService:
    def __init__(self):
        dynamodb = boto3.resource('dynamodb')
        self.table = dynamodb.Table('contacts')
        self.dynamodb_client = boto3.client('dynamodb')
        self.user_id = ""

    def save_item(self,data):

        """ Check if the contact already exists. If it does send error message, else save contact. If there is a client error send error message."""

        try:
            response = self.query_contacts(data['lead_name']) #see if contact exists

            if response['message'] != "Contact not found.":
            #if contact!=[]:
                response =  {'message':f"{data['lead_name']} already exists"}
                return response
            else:
                self.table.put_item(Item=data) #save contact
                response = {'message':"Contact Saved"}
                return response

        except ClientError as err:
            response = (
                "Couldn't add contact %s to table %s. Here's why: %s: %s",
                data['lead_name'], self.table.name,
                err.response['Error']['Code'], err.response['Error']['Message'])
            return response
    
    def delete_contact(self, data):

        try:
            lead_name = data['lead_name']
            current_user_id = data['current_user_id']

            record_user_id = self.query_contacts(data['lead_name'])['items'][0]['user_id']

            if record_user_id != current_user_id:
                data = {'message':"Cannot delete record made by another user."}
                return data

            self.table.delete_item(Key={'lead_name': lead_name})
            data = {'message':"Contact deleted"}
            return data

        except ClientError as err:
            response = (
                "Couldn't delete contact %s from table %s. Here's why: %s: %s",
                data['lead_name'], self.table.name,
                err.response['Error']['Code'], err.response['Error']['Message'])
            return response
        
    def update_contact(self, contact_data):

        """ Only allow update if current user if and record user id are the same. """

        try:
            data = contact_data['entity_data']
            current_user_id = contact_data['user_id_element']

            record_user_id = self.query_contacts(data['lead_name'])['items'][0]['user_id'] #get record user token

            if record_user_id != current_user_id: #if record user token and current user token arent the same dont let them edit
                response = {'message':"Cannot edit record made by another user."}
                return response
            
            self.table.update_item(
                            Key={'lead_name': data['lead_name']},
                            UpdateExpression="set address=:a, phone_number=:p, site=:u,email=:e",
                            ExpressionAttributeValues={
                                ':a': data['address'], ':p': data['phone_number'],':u':data['site'],':e':data['email']},
                            ReturnValues="UPDATED_NEW")

            response = {'message':"Contact Updated"}
            return response

        except ClientError as err:
            response = (
                "Couldn't update contact %s to table %s. Here's why: %s: %s",
                data['lead_name'], self.table.name,
                err.response['Error']['Code'], err.response['Error']['Message'])
            return response



    def query_contacts(self, lead_name):

        try:
            response = self.table.query(KeyConditionExpression=Key("lead_name").eq(lead_name))
            items = response['Items']

            if items == []:
                response ={'message':"Contact not found."}
                return response

            response = {'message':'Contact found.', 'items':items}
            return response

        except ClientError as err:
            response = (
                "Couldn't find contact %s in table %s. Here's why: %s: %s",
                data['lead_name'], self.table.name,
                err.response['Error']['Code'], err.response['Error']['Message'])
            return response
