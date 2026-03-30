const http = require('http');

// Test registration with missing data (should trigger validation error)
const testValidation = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
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
      console.log('--- Test 1 Complete ---\n');
      testSuccess(); // Run next test
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  // Send empty body to trigger validation error
  req.write(JSON.stringify({}));
  req.end();
};

// Test successful registration
const testSuccess = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
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
      console.log('--- Test 2 Complete ---\n');
      testLogin(); // Run next test
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  // Send valid registration data
  const userData = {
    name: 'Test User ' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    password: 'password123'
  };
  
  req.write(JSON.stringify(userData));
  req.end();
};

// Test login
const testLogin = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
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
      console.log('--- Test 3 Complete ---\n');
      testNotFound(); // Run next test
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  // Send login data
  const loginData = {
    email: 'test@example.com',
    password: 'password123'
  };
  
  req.write(JSON.stringify(loginData));
  req.end();
};

// Test 404 error
const testNotFound = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/nonexistent',
    method: 'GET'
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
      console.log('--- Test 4 Complete ---\n');
      console.log('All tests completed!');
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.end();
};

// Start the tests
console.log('Starting API Tests...\n');
testValidation();