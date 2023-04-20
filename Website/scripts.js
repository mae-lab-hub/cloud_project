"use strict";

const serverUrl = "http://127.0.0.1:8000";
//const serverUrl = " https://vpbzktcaxf.execute-api.us-east-1.amazonaws.com/api/";
let userId = "";
let imageUserId =""
async function uploadImage() {
    // encode input file as base64 string for upload
    let file = document.getElementById("file").files[0];
    let converter = new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result
            .toString().replace(/^data:(.*,)?/, ''));
        reader.onerror = (error) => reject(error);
    });
    let encodedString = await converter;

    // clear file upload input field
    document.getElementById("file").value = "";

    // make server call to upload image
    // and return the server upload promise



    return fetch(serverUrl + "/images", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({filename: file.name, filebytes: encodedString, userid: userId})
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new HttpError(response);
        }
    })

    
}

function updateImage(data) {

    image = data[0]
    console.log(data[1])

    document.getElementById("view").style.display = "block";

    let imageElem = document.getElementById("image");
    imageElem.src = image["fileUrl"];
    imageElem.alt = image["fileId"];

    return data;
}


function upload() {
    uploadImage()
        .then(data => updateImage(data))
        .then(data => annotateImage(data))
        .catch(error => {
            alert("Error: " + error);
        })
}


function annotateImage(data) {


    let entities = data[1]

    let email = document.getElementById("email");
    let name = document.getElementById("name");
    let address = document.getElementById("address");
    let url = document.getElementById("url");
    let phone = document.getElementById("phone");

    name.value =entities['name'].toLowerCase();
    email.value =entities['email'];
    address.value =entities['address'];
    url.value =entities['url'];
    phone.value =entities['phone'];
}

function generateId(){
    //const imageId = 'image_' + new Date().getTime(); // Generate a new image ID
    console.log("here")
    const newUserId = 'user_' + new Date().getTime(); // Generate a new user ID
   // localStorage.setItem('user_id', newUserId); // Update the localStorage with the new user ID
    userId = newUserId; // Update the global variable userId
    let userIdElement = document.getElementById("user_id");
    userIdElement.value = userId;

}

function saveContact() {
    //sending the edited contact info to the backend


    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();


    let userIdElement = document.getElementById("user_id").value;

    let email = document.getElementById("email").value;
    let name = document.getElementById("name").value;
    let address = document.getElementById("address").value;
    let url = document.getElementById("url").value;
    let phone = document.getElementById("phone").value;

    if (name == "" || userIdElement == ""){
        alert("Id and lead name cannot be empty!");
        return
    }


    
    let entity_data = { 
                    "user_id":userIdElement,
                    "lead_name":name,
                    "email":email,
                    "address":address,
                    "phone_number":phone,
                    "site":url}

                    
    console.log(entity_data)
    alert("Contsact Saved!");
    return fetch(serverUrl + "/submit", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(entity_data)
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new HttpError(response);
        }
    })
}



function search() {
    //sending the edited contact info to the backend
    let name_search = document.getElementById("name_search").value;

    let data ={'user_id':userId,"lead_name":name_search}
    
    console.log(data)
    return fetch(serverUrl + "/search", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new HttpError(response);
        }
    })
}



function  edit_info(contact){

    console.log("here")
    imageUserId = contact['user_id']
    let email = document.getElementById("email");
    let name = document.getElementById("name");
    let address = document.getElementById("address");
    let url = document.getElementById("url");
    let phone = document.getElementById("phone");
   // let user_id_element = document.getElementById("userid");


    let data = contact[0]
    name.value =data['lead_name'];
    email.value =data['email'];
    address.value =data['address'];
    url.value =data['site'];
    phone.value =data['phone_number'];
   // user_id_element.value = data['user_id']

    console.log( data['user_id'])


}

function searchAndUpdate() {
    search()
        .then(data => edit_info(data))
        //.then(data => annotateImage(data))
        .catch(error => {
            alert("Error: " + error);
        })
}

function updateContact(){
    let user_id_element = document.getElementById("user_id").value;

    let email = document.getElementById("email").value;
    let name = document.getElementById("name").value;
    let address = document.getElementById("address").value;
    let url = document.getElementById("url").value;
    let phone = document.getElementById("phone").value;
    console.log("in update contact js")
    
    let entity_data = {// "user_id":userId,
                    "lead_name":name,
                    //"creation_date":newdate,
                    "email":email,
                    "address":address,
                    "phone_number":phone,
                    "site":url}

                    console.log("Image id:")
                    console.log(user_id_element)
                    console.log("User id")
                    console.log(userId)
    console.log(entity_data)
    return fetch(serverUrl + "/update", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({entity_data,user_id_element})
    }).then(response => {
        if (response.ok) {
            console.log(response)
            return response.json();
        } else {
            throw new HttpError(response);
        }
    })
}


function checkUser(data){
    if (data['message'] != ""){

        console.log(data)

        alert(data['message']);

        
    }
}



function updateAndCheckUser() {
    updateContact()
        .then(data => checkUser(data))
        .catch(error => {
            alert("Error: " + error);
        })
}


function deleteContact(){
    
    let name = document.getElementById("name").value;
    let user_id_element = document.getElementById("user_id").value;

    
    let entity_data = { "lead_name":name, "current_user_id": user_id_element}

    console.log(entity_data)
    return fetch(serverUrl + "/delete", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(entity_data)
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new HttpError(response);
        }
    })
}


function deleteAndCheckUser() {
    deleteContact()
        .then(data => checkUser(data))
        .catch(error => {
            alert("Error: " + error);
        })
}


class HttpError extends Error {
    constructor(response) {
        super(`${response.status} for ${response.url}`);
        this.name = "HttpError";
        this.response = response;
    }
}