"use strict";

const serverUrl = "http://127.0.0.1:8000";
//const serverUrl = "https://a69yh7mtx3.execute-api.us-east-1.amazonaws.com/api/";

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



class HttpError extends Error {
    constructor(response) {
        super(`${response.status} for ${response.url}`);
        this.name = "HttpError";
        this.response = response;
    }
}