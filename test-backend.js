const http = require('http');

// Test if backend is running on port 3001
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  res.on('data', (data) => {
    console.log(`Body: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();

// Also test the health endpoint
const healthOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
  console.log(`Health Status: ${res.statusCode}`);
  res.on('data', (data) => {
    console.log(`Health Body: ${data}`);
  });
});

healthReq.on('error', (e) => {
  console.error(`Health check error: ${e.message}`);
});

healthReq.end();