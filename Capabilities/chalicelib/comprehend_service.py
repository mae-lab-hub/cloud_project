import boto3
from botocore.exceptions import ClientError

class ComprehendDetect:
    """Encapsulates Comprehend detection functions."""
    def __init__(self):
        self.comprehend_client = boto3.client('comprehendmedical')

    def detect_entities(self, text):
       
        #text = "Asmae Allou aallou@my.centennialcollege.ca (416) 345 234 266 King Street M7C9F3 Toronto Ontario Centennial college"

        response = self.comprehend_client.detect_entities_v2(Text=text)
        entities = response['Entities']

        return entities
