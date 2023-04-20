const apiUrl = 'http://127.0.0.1:8000';

async function processImage() {
    const imageInput = document.getElementById('image');
    const formData = new FormData();
    formData.append('image', imageInput.files[0]);

    const response = await fetch(apiUrl + '/process_image', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    const imageId = 'image_' + new Date().getTime(); // Generate a new image ID
    const newUserId = 'user_' + new Date().getTime(); // Generate a new user ID
    localStorage.setItem('user_id', newUserId); // Update the localStorage with the new user ID
    userId = newUserId; // Update the global variable userId
    fillForm({ ...data, image_id: imageId }); // Pass the image ID to the fillForm function
}


function fillForm(data) {
    document.getElementById('name').value = data.name || '';
    document.getElementById('phone_numbers').value = data.phone_numbers.join(', ') || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('website').value = data.website || '';
    document.getElementById('address').value = data.address || '';
    document.getElementById('image_id').value = data.image_id || '';
}

function submitForm(leadId) {
    const name = document.getElementById('name').value;
    const phoneNumbers = document.getElementById('phone_numbers').value;
    const email = document.getElementById('email').value;
    const website = document.getElementById('website').value;
    const address = document.getElementById('address').value;
    const imageId = document.getElementById('image_id').value;
    const userId = localStorage.getItem('user_id');
    const phoneNumbersArray = phoneNumbers.split(',').map(phoneNumber => phoneNumber.trim());

    const requestData = {
        name: name,
        phone_numbers: phoneNumbersArray,
        email: email,
        website: website,
        address: address,
        user_id: userId,
        image_id: imageId
    };

    // Add leadId to the requestData object if it's provided
    if (leadId) {
        requestData.lead_id = leadId;
    }

    fetch(apiUrl + '/save_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Response:', data);
            alert("Data submitted successfully. Please save your user id: " + userId);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


document.addEventListener('DOMContentLoaded', () => {
    const queryParams = new URLSearchParams(window.location.search);

    if (queryParams.has('name')) {
        fillForm({
            name: queryParams.get('name'),
            phone_numbers: queryParams.get('phone_numbers').split(', '),
            email: queryParams.get('email'),
            website: queryParams.get('website'),
            address: queryParams.get('address'),
            image_id: queryParams.get('image_id'),
            lead_id: queryParams.get('lead_id')
        });

        document.getElementById('submit_button').addEventListener('click', () => {
            submitForm(queryParams.get('lead_id'));
        });
    }
});
