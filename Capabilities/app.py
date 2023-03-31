from chalice import Chalice
from chalicelib import storage_service
from chalicelib import recognition_service
import base64
import json




#####
# chalice app configuration
#####
app = Chalice(app_name='Capabilities')
app.debug = True

#####
# services initialization
#####
storage_location = 'contentcen301159608.aws.ai'
storage_service = storage_service.StorageService(storage_location)
recognition_service = recognition_service.RecognitionService(storage_service)

#####
# RESTful endpoints
#####
@app.route('/images', methods = ['POST'], cors = True)
def upload_image():
    """processes file upload and saves file to storage service"""
    request_data = json.loads(app.current_request.raw_body)
    file_name = request_data['filename']
    file_bytes = base64.b64decode(request_data['filebytes'])

    image_info = storage_service.upload_file(file_bytes, file_name)

    return image_info



 
