"use strict";

const serverUrl = "http://127.0.0.1:8000";
//const serverUrl = "https://a69yh7mtx3.execute-api.us-east-1.amazonaws.com/api/";

// Define  variables 
const homePage = document.querySelector('.home-container');
const searchPage = document.querySelector('.search-container');
const uploadPage = document.querySelector('.upload-container');

const homeLink = document.querySelector('.home-text2');
const searchLink = document.querySelector('.home-text4');
const uploadLink = document.querySelector('.home-text6');

// Define any functions 
function showHomePage() {
  homePage.style.display = 'block';
  searchPage.style.display = 'none';
  uploadPage.style.display = 'none';
}

function showSearchPage() {
  homePage.style.display = 'none';
  searchPage.style.display = 'block';
  uploadPage.style.display = 'none';
}

function showUploadPage() {
  homePage.style.display = 'none';
  searchPage.style.display = 'none';
  uploadPage.style.display = 'block';
}

// Attach event listeners to elements on the page
homeLink.addEventListener('click', showHomePage);
searchLink.addEventListener('click', showSearchPage);
uploadLink.addEventListener('click', showUploadPage);



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
        body: JSON.stringify({filename: file.name, filebytes: encodedString})
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


function uploadAndTranslate() {
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

    name.value =entities['name'];
    email.value =entities['email'];
    address.value =entities['address'];
    url.value =entities['url'];
    phone.value =entities['phone'];
}

function saveContact() {
    //sending the edited contact info to the backend


    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    var newdate = year + "/" + month + "/" + day;



    let email = document.getElementById("email").value;
    let name = document.getElementById("name").value;
    let address = document.getElementById("address").value;
    let url = document.getElementById("url").value;
    let phone = document.getElementById("phone").value;

    
    let entity_data = { "lead_name":name,
                    //"creation_date":newdate,
                    "email":email,
                    "address":address,
                    "phone_number":phone,
                    "site":url}

    console.log(entity_data)
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

    let data ={"lead_name":name_search}

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


function fill_table(data){

     //fill the table with he information
     let table = document.querySelector("table");
     table.style.border = "1px solid #000"
 
     for (let i = 0; i < data.length; i++) {
         let row = table.insertRow();

         let name = row.insertCell(0);
         name.innerHTML = data[i]["lead_name"];
 
       
         let address = row.insertCell(1);
         address.innerHTML = data[i]["address"];
         console.log(data[i]["address"])

         let email = row.insertCell(2);
         email.innerHTML = data[i]["email"];

         let phone_number = row.insertCell(3);
         phone_number.innerHTML = data[i]["phone_number"];

         let site = row.insertCell(4);
         site.innerHTML = data[i]["site"];

     }

}

function  edit_info(contact){

    let email = document.getElementById("email");
    let name = document.getElementById("name");
    let address = document.getElementById("address");
    let url = document.getElementById("url");
    let phone = document.getElementById("phone");

    let data = contact[0]
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
    
    let email = document.getElementById("email").value;
    let name = document.getElementById("name").value;
    let address = document.getElementById("address").value;
    let url = document.getElementById("url").value;
    let phone = document.getElementById("phone").value;
    console.log("in update contact js")
    
    let entity_data = { "lead_name":name,
                    //"creation_date":newdate,
                    "email":email,
                    "address":address,
                    "phone_number":phone,
                    "site":url}

    console.log(entity_data)
    return fetch(serverUrl + "/update", {
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


function deleteContact(){
    
    let name = document.getElementById("name").value;
 
    
    let entity_data = { "lead_name":name}

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


class HttpError extends Error {
    constructor(response) {
        super(`${response.status} for ${response.url}`);
        this.name = "HttpError";
        this.response = response;
    }
}