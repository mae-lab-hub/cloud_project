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
  localStorage.setItem('userId', newUserId); // Update the localStorage with the new user ID
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
  const imageId = document.getElementById('image_id').value; // Add this line

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
  })
  .catch(error => {
    console.error('Error:', error);
  });
}


async function searchLead() {
  const leadName = document.getElementById('search_lead_name').value;

  const response = await fetch(apiUrl + '/search_lead', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: `lead_name=${encodeURIComponent(leadName)}&user_id=${encodeURIComponent(userId)}`
});


  const data = await response.json();
  const results = data.results || [];
  displayResults(results);
}

function displayResults(results) {
  const resultsContainer = document.getElementById('search_results');
  resultsContainer.innerHTML = '';

  results.forEach(result => {
    const resultDiv = document.createElement('div');
    resultDiv.innerHTML = `
      <p><strong>Name:</strong> ${result.name}</p>
      <p><strong>Phone Numbers:</strong> ${result.phone_numbers.join(', ')}</p>
      <p><strong>Email:</strong> ${result.email}</p>
      <p><strong>Website:</strong> ${result.website}</p>
      <p><strong>Address:</strong> ${result.address}</p>
      <button onclick="editLead('${result.lead_id}')">Update</button>
    `;
    resultsContainer.appendChild(resultDiv);
  });
}

function editLead(leadId) {
  // Fetch the lead data using the provided leadId
  fetch(apiUrl + '/get_lead/' + encodeURIComponent(leadId), {
    method: 'GET'
  })
    .then(response => response.json())
    .then(data => {
      // Pre-fill the form with the existing data
      fillForm(data);
      // Add an event listener to the submit button to call submitForm with the leadId when updating
      document.getElementById('submit_button').addEventListener('click', () => {
        submitForm(leadId);
      });
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

