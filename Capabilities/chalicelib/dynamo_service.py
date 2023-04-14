import boto3

class DynamoService:
    def __init__(self):
        dynamodb = boto3.resource('dynamodb')
        self.table = dynamodb.Table('contact_table')

    def save_item(self,data):

        print('hiuhi')

        response = self.table.put_item(
        Item=data)





       #response = self.table.put_item(
       # Item={
        #    'lead_name': 'Canada',
         #   'creation_date': '04-14-2023',
          #  'address':"100 CLoucester",
           # 'email':'email@email.com',
            #'phone_number':'666-999-666',
           # 'url':'www.site.com'

        #})

        print("sucess??")
    




