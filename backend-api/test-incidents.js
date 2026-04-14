const http = require('http');

// Simple test for incident creation
const testIncidentCreation = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/incidents',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // This will fail auth but test the route
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response:', data);
      console.log('--- Incident Creation Test Complete ---');
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  // Test data
  const incidentData = {
    title: 'Test Incident',
    description: 'This is a test incident',
    type: 'theft',
    severity: 'high',
    category: 'crime',
    latitude: '40.7128',
    longitude: '-74.0060'
  };

  req.write(JSON.stringify(incidentData));
  req.end();
};

console.log('Testing incident creation...');
testIncidentCreation();