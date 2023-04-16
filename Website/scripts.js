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

async function searchLead() {
    const searchName = document.getElementById("search_name").value;
    const searchUserId = document.getElementById("search_user_id").value;

    const searchCriteria = {
        searchName,
        searchUserId,
    };

    console.log("Search criteria: ", searchCriteria);

    const response = await fetch(`${apiUrl}/search_lead`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: new URLSearchParams({
            lead_name: searchName,
        }).toString(),
    });

    const leads = await response.json();

    displayLeads(leads, searchUserId);
}


function displayLeads(results, searchUserId) {
  const resultsContainer = document.getElementById('search_results');
  resultsContainer.innerHTML = '';

  results.forEach(result => {
    const resultDiv = document.createElement('div');
    resultDiv.id = `lead_${result.id}`; // Add an ID to the result div
    resultDiv.innerHTML = `
      <p><strong>Name:</strong> ${result.name}</p>
      <p><strong>Telephone number (s):</strong> ${result.phone_numbers.join(', ')}</p>
      <p><strong>Email address:</strong> ${result.email}</p>
      <p><strong>Company website:</strong> ${result.website}</p>
      <p><strong>Company address:</strong> ${result.address}</p>
    `;
    // Check if both the user ID and name match the search criteria
    if (result.user_id === searchUserId && result.name.toLowerCase() === document.getElementById("search_name").value.toLowerCase()) {
      resultDiv.innerHTML += `<button onclick="editLead('${result.id}')">Update</button>`;
      resultDiv.innerHTML += `<button onclick="deleteLead('${result.id}')">Delete</button>`;
    }

    resultsContainer.appendChild(resultDiv);
  });
}


function editLead(leadId) {
  // Fetch the lead data using the provided leadId
  console.log("editLead called with leadId:", leadId);
  fetch(apiUrl + '/get_lead/' + encodeURIComponent(leadId), {
    method: 'GET'
  })
    .then(response => response.json())
    .then(data => {
      // Pre-fill the form with only the required data
      fillForm({
        name: data.name,
        phone_numbers: data.phone_numbers,
        email: data.email,
        website: data.website,
        address: data.address,
        image_id: data.image_id
      });
      // Add an event listener to the submit button to call submitForm with the leadId when updating
      document.getElementById('submit_button').addEventListener('click', () => {
        submitForm(leadId);
      });
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
function deleteLead(leadId) {
  console.log("deleteLead called with leadId:", leadId);
  const userId = document.getElementById("search_user_id").value; // Retrieve the user_id from the search form

  if (!userId || userId === "null") {
    console.error("User ID is not set");
    return;
  }
  fetch(apiUrl + '/delete_lead/' + encodeURIComponent(leadId) + '?user_id=' + encodeURIComponent(userId), {
    method: 'DELETE'
  })
    .then(response => {
      if (response.ok) {
        console.log('Lead deleted successfully');
        // Remove the lead element from the search results
        const leadElement = document.getElementById(`lead_${leadId}`);
        leadElement.parentNode.removeChild(leadElement);
      } else {
        console.error('Failed to delete the lead, status:', response.status, 'text:', response.statusText);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
