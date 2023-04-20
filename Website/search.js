    const apiUrl = 'http://127.0.0.1:8000';


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

function canEditLead(lead, searchUserId, searchName) {
        return lead.user_id === searchUserId && lead.name.toLowerCase() === searchName.toLowerCase();
      
    }



    async function submitForm() {
        const leadId = document.getElementById('lead_id').value;
        const userId = document.getElementById('user_id').value;

        if (!userId || userId === "null") {
            console.error("User ID is not set");
            return;
        }

        const leadData = {
            name: document.getElementById('lead_name').value,
            phone_numbers: document.getElementById('lead_phone_numbers').value.split(',').map(number => number.trim()),
            email: document.getElementById('lead_email').value,
            website: document.getElementById('lead_website').value,
            address: document.getElementById('lead_address').value,
            user_id: userId,
        };

        const url = leadId ? `${apiUrl}/update_lead/${encodeURIComponent(leadId)}` : `${apiUrl}/create_lead`;
        const method = leadId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leadData),
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('Lead saved successfully:', responseData);
            } else {
                console.error('Failed to save the lead, status:', response.status, 'text:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }




    function displayLeads(results, searchUserId) {
        const searchName = document.getElementById("search_name").value;
        const resultsContainer = document.getElementById('search_results');
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            alert('No leads found.');
            return;
        }

        const result = results[0];
        const submitButton = document.querySelector('#lead_form button[type="button"]');

        if (canEditLead(result, searchUserId, searchName)) {
            document.getElementById('lead_name').readOnly = false;
            document.getElementById('lead_phone_numbers').readOnly = false;
            document.getElementById('lead_email').readOnly = false;
            document.getElementById('lead_website').readOnly = false;
            document.getElementById('lead_address').readOnly = false;

            const deleteButton = createDeleteButton(result.id);
            const formElement = document.getElementById('lead_form');
            if (formElement.contains(deleteButton)) {
                formElement.removeChild(deleteButton);
            }
            formElement.appendChild(deleteButton);

            submitButton.textContent = 'Update';
            submitButton.style.display = 'inline-block';
        } else {
            document.getElementById('lead_name').readOnly = true;
            document.getElementById('lead_phone_numbers').readOnly = true;
            document.getElementById('lead_email').readOnly = true;
            document.getElementById('lead_website').readOnly = true;
            document.getElementById('lead_address').readOnly = true;

            submitButton.style.display = 'none';
        }

        fillForm(result);
    }




    function fillForm(data) {
        document.getElementById('lead_name').value = data.name;
        document.getElementById('lead_phone_numbers').value = data.phone_numbers.join(', ');
        document.getElementById('lead_email').value = data.email;
        document.getElementById('lead_website').value = data.website;
        document.getElementById('lead_address').value = data.address;
        document.getElementById('lead_id').value = data.id;
        document.getElementById('user_id').value = data.user_id;
    }


function displayLeads(results, searchUserId) {
    const searchName = document.getElementById("search_name").value;
    const resultsContainer = document.getElementById('search_results');
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        alert('No leads found.');
        return;
    }

    const result = results[0];
    const submitButton = document.querySelector('#lead_form button[type="button"]');

    if (canEditLead(result, searchUserId, searchName)) {
        document.getElementById('lead_name').readOnly = false;
        document.getElementById('lead_phone_numbers').readOnly = false;
        document.getElementById('lead_email').readOnly = false;
        document.getElementById('lead_website').readOnly = false;
        document.getElementById('lead_address').readOnly = false;

        submitButton.textContent = 'Update';
        submitButton.style.display = 'inline-block';

        const deleteButtonHtml = `<button onclick="deleteLead('${result.id}')">Delete</button>`;
        submitButton.insertAdjacentHTML('afterend', deleteButtonHtml);
    } else {
        document.getElementById('lead_name').readOnly = true;
        document.getElementById('lead_phone_numbers').readOnly = true;
        document.getElementById('lead_email').readOnly = true;
        document.getElementById('lead_website').readOnly = true;
        document.getElementById('lead_address').readOnly = true;

        const deleteButton = document.querySelector('#lead_form button.delete');
        if (deleteButton) {
            deleteButton.remove();
        }

        submitButton.style.display = 'none';
    }

    fillForm(result);
}


    function editLead(leadId) {
        // Fetch the lead data using the provided leadId
        console.log("editLead called with leadId:", leadId);
        const userId = document.getElementById("search_user_id").value; // Get the user_id from the search form
        fetch(apiUrl + '/get_lead/' + encodeURIComponent(leadId) + '?user_id=' + encodeURIComponent(userId), {
            method: 'GET'
        })
            .then(response => response.json())
            .then(data => {
                fillForm(data); // Call the fillForm function
            })
            .catch(error => console.error('Error:', error));
    }



async function deleteLead(leadId) {
    try {
        const searchUserId = document.getElementById("search_user_id").value;
        const searchName = document.getElementById("search_name").value;

        if (!searchUserId || !searchName) {
            alert("Both User ID and Lead Name are required for deletion.");
            return;
        }

        const response = await fetch(`http://127.0.0.1:8000/search_lead`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `lead_name=${encodeURIComponent(searchName)}&user_id=${encodeURIComponent(searchUserId)}`,
        });

        const leads = await response.json();

        if (leads.length === 0) {
            alert("No lead found with the given User ID and Lead Name.");
            return;
        }

        if (leads.length > 1) {
            alert("Multiple leads found with the same name. Please delete them one by one using their Lead IDs.");
            return;
        }

        const leadToDeleteId = leads[0].id;

        const deleteResponse = await fetch(`http://127.0.0.1:8000/delete_lead/${leadToDeleteId}?user_id=${encodeURIComponent(searchUserId)}`, {
            method: "DELETE",
        });

        if (!deleteResponse.ok) {
            throw new Error("Error deleting lead");
        }

        const deleteResult = await deleteResponse.json();

        if (deleteResult.status === "success") {
            alert("Lead deleted successfully");
        } else {
            alert("Error deleting lead");
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        alert(`Error: ${error}`);
    }
}
