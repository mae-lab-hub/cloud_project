import boto3
from botocore.exceptions import ClientError

class ComprehendDetect:
    def __init__(self):
        self.comprehend_client = boto3.client('comprehendmedical')

    def detect_entities(self, text):

        try:
            response = self.comprehend_client.detect_entities_v2(Text=text)
            entities = response['Entities']
            return entities
        except ClientError as err:
            response = err.response['Error']['Message']
            return response
