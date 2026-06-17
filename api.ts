// Function to fetch data from a sample third-party REST API
async function fetchUserData() {
  const url = 'https://typicode.com';

  try {
    // 1. Make the HTTP GET request
    const response = await fetch(url);

    // 2. Check if the response status is OK (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // 3. Parse the incoming stream data into a JSON object
    const data = await response.json();
    
    // 4. Log the output data to the console
    console.log('API Integration Successful! Data received:');
    console.log(`Name: ${data.name}`);
    console.log(`Email: ${data.email}`);
    console.log(`Company: ${data.company.name}`);

  } catch (error) {
    // 5. Catch and handle any network or parsing errors safely
    console.error('Error integrating with the API');
  }
}

// Execute the API integration function
fetchUserData();
