const apiUrl = 'http://127.0.0.1:8000';
const userId = 'user1';

async function processImage() {
  const imageInput = document.getElementById('image');
  const formData = new FormData();
  formData.append('image', imageInput.files[0]);

  const response = await fetch(apiUrl + '/process_image', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  fillForm(data);
}

function fillForm(data) {
  document.getElementById('name').value = data.name || '';
  document.getElementById('phone_numbers').value = data.phone_numbers.join(', ') || '';
  document.getElementById('email').value = data.email || '';
  document.getElementById('website').value = data.website || '';
  document.getElementById('address').value = data.address || '';
}

function submitForm() {
  const name = document.getElementById('name').value;
  const phoneNumbers = document.getElementById('phone_numbers').value;
  const email = document.getElementById('email').value;
  const website = document.getElementById('website').value;
  const address = document.getElementById('address').value;

  const phoneNumbersArray = phoneNumbers.split(',').map(phoneNumber => phoneNumber.trim());

 const requestData = {
    name: name, 
    phone_numbers: phoneNumbersArray,
    email: email,
    website: website,
    address: address,
    user_id: 'user1' 
  };

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

  const requestData = {
    lead_name: leadName,
    user_id: userId
  };

  const response = await fetch(apiUrl + '/search_lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
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
    `;
    resultsContainer.appendChild(resultDiv);
  });
}
