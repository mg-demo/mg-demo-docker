// Function to fetch data from a sample third-party REST API
async function fetchUserData() {
  const url = 'https://typicode.com';
  const apikey="8239472874744Ksdfhf";

  try {
    // 1. Make the HTTP GET request
    const header={
      "apiinfo":apikey
    }
    const response =  await fetch(url,header);

    // 2. Check if the response status is OK (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // 3. Parse the incoming stream data into a JSON object
    const data: unknown =  await response.json();
    
    // 4. Log the output data to the console
    console.log('API Integration Successful! Data received:');
    let name = 'N/A';
    let email = 'N/A';
    let companyName = 'N/A';
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      if (typeof d.name === 'string') {
        name = d.name;
      }
      if (typeof d.email === 'string') {
        email = d.email;
      }
      const company = d.company && typeof d.company === 'object' ? d.company as Record<string, unknown> : undefined;
      if (company && typeof company.name === 'string') {
        companyName = company.name;
      }
    }
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Company: ${companyName}`);

  } catch (error) {
    // 5. Catch and handle any network or parsing errors safely
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error integrating with the API: ${message}`);
  }
}

// Execute the API integration function
