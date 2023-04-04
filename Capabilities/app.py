from chalice import Chalice
from chalicelib import storage_service
from chalicelib import recognition_service
import base64
import json
from chalicelib import comprehend_service



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
comprehend_service = comprehend_service.ComprehendDetect()
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
    text_lines = recognition_service.detect_text(file_name)

    #since the api can detect multiple of the same entities, we will add them all to a list

    name = []
    email = []
    address = []
    phone=[]
    website =[]


    for line in text_lines:

        print("TEXT:", line['text'])
        entity = comprehend_service.detect_entities(line['text'])

        for en in entity:
            print("ENTITY: ", en['Type'])

            if en['Type'] == "NAME":
                name.append(en['Text'])
            
            elif en['Type'] == "EMAIL":
                email.append(en['Text'])   
            
            elif en['Type'] == "ADDRESS":
                address.append(en['Text'])

            elif en['Type'] == "PHONE_OR_FAX":
                phone.append(en['Text'])
            
            elif en['Type'] == "URL":
                website.append(en['Text'])
        

    #for now we just join all the same entities together and the user can remove the one they want
    #possible changes: each of the same entity is an option in a dropdown menu, but then if the user wants both entities saved together it wil be complicated to edit, example: New York and Florence st.
    
    name = "  ".join(name)
    email  = " ".join(email)
    phone = " ".join(phone)
    address = " ".join(address)
    website = " ".join(website)

    entity_data = { "name":name,
                    "email":email,
                    "address":address,
                    "phone":phone,
                    "website":website}

    return image_info , entity_data
