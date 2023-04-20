"use strict";

//const serverUrl = " https://vpbzktcaxf.execute-api.us-east-1.amazonaws.com/api/";
const serverUrl = "https://vpbzktcaxf.execute-api.us-east-1.amazonaws.com/api/";
let userId = "";

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
    email.value =entities['email'].toLowerCase();;
    address.value =entities['address'].toLowerCase();;
    url.value =entities['website'];
    phone.value =entities['phone'];
    downloadCsv(entities)
}

function generateId(){
    //User will generate an authentication token in order to use the service

  
    const newUserId = 'user_' + new Date().getTime(); // Generate a new user ID
    userId = newUserId; // Update the global variable userId

    let userIdElement = document.getElementById("user_id");
    userIdElement.value = userId;

}

//ref: https://www.w3schools.com/howto/howto_js_copy_clipboard.asp
function myFunction() {
    // Get the text field
    var copyText = document.getElementById("user_id");
  
    // Select the text field
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
  
     // Copy the text inside the text field
    navigator.clipboard.writeText(copyText.value);
  } 

function saveContact() {
    //sending the edited contact info to the backend

    let userIdElement = document.getElementById("user_id").value;
    let userIdFormatCorrect = /^user_\d{1,13}$/.test(userIdElement)

    if (!userIdFormatCorrect){
        alert("Authentication code requires:\n 1. Start with: user_\n 2. 1 to 13 digits\n Ex. user_111111111")
        return
    }

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


function saveAndGetMessage() {
    saveContact()
        .then(data => GetMessage(data))
        .catch(error => {
            alert("Error: " + error);
        })
}

function downloadCsv(data){
    const csvRows = [];
    const headers = ["name", "email", "address", "phone", "website"];
    csvRows.push(headers.join(","));
    const values = [
        data.name,
        data.email,
        `"${data.address}"`, 
        data.phone,
        data.website
      ];
    csvRows.push(values.join(","));
    const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(csvBlob);
    downloadLink.download = "data.csv";
    downloadLink.textContent = "Download CSV";
    document.body.appendChild(downloadLink);

    downloadLink.addEventListener("click", function(event) {
    event.preventDefault();
    downloadLink.style.display = "none";
    document.body.removeChild(downloadLink);
    window.location.href = downloadLink.href;

    })
}



function search() {
    //sending the edited contact info to the backend
    let name_search = document.getElementById("name_search").value.toLowerCase();

    let data ={'user_id':userId,"lead_name":name_search}
    
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

    if (contact["message"]=="Contact not found.") {
        alert(contact['message']);

        return
    }


    let email = document.getElementById("email");
    let name = document.getElementById("name");
    let address = document.getElementById("address");
    let url = document.getElementById("url");
    let phone = document.getElementById("phone");
   // let user_id_element = document.getElementById("userid");


    let data = contact['items'][0]
    name.value =data['lead_name'];
    email.value =data['email'];
    address.value =data['address'];
    url.value =data['site'];
    phone.value =data['phone_number'];



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
    
    let entity_data = {// "user_id":userId,
                    "lead_name":name,
                    //"creation_date":newdate,
                    "email":email,
                    "address":address,
                    "phone_number":phone,
                    "site":url}

    return fetch(serverUrl + "/update", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({entity_data,user_id_element})
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new HttpError(response);
        }
    })
}


function GetMessage(data){
    if (data['message'] != ""){
        alert(data['message']);   
    }
}



function updateAndGetMessage() {
    updateContact()
        .then(data => GetMessage(data))
        .catch(error => {
            alert("Error: " + error);
        })
}


function deleteContact(){
    
    let name = document.getElementById("name").value;
    let user_id_element = document.getElementById("user_id").value;

    
    let entity_data = { "lead_name":name, "current_user_id": user_id_element}

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


function deleteAndGetMessage() {
    deleteContact()
        .then(data => GetMessage(data))
        .then(resetInputs())
        .catch(error => {
            alert("Error: " + error);
        })
}

function resetInputs(){

    let email = document.getElementById("email");
    let name = document.getElementById("name");
    let address = document.getElementById("address");
    let url = document.getElementById("url");
    let phone = document.getElementById("phone");

    name.value = "";
    email.value ="";
    address.value ="";
    url.value ="";
    phone.value ="";
}

class HttpError extends Error {
    constructor(response) {
        super(`${response.status} for ${response.url}`);
        this.name = "HttpError";
        this.response = response;
    }
}