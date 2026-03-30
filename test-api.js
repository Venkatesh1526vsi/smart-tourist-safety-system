#!/usr/bin/env node

/**
 * Smart Tourist Safety System - Configuration & Testing Helper
 * Helps with admin setup and feature testing
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAllEndpoints() {
  log('\n🧪 COMPREHENSIVE API TEST SUITE\n', 'cyan');

  // Test 1: Health Check
  log('1️⃣  Health Check', 'blue');
  try {
    const healthRes = await makeRequest('GET', '/');
    log(`   ✅ Status: ${healthRes.status} - ${healthRes.data}`, 'green');
  } catch (e) {
    log(`   ❌ Failed: ${e.message}`, 'red');
    return;
  }

  // Test 2: Risk Zones
  log('\n2️⃣  Risk Zones Endpoint', 'blue');
  try {
    const zoneRes = await makeRequest('GET', '/api/risk-zones');
    log(`   ✅ Status: ${zoneRes.status} - Found ${zoneRes.data.count} zones`, 'green');
    zoneRes.data.data.forEach(zone => {
      log(`      • ${zone.name} (${zone.riskLevel})`, 'green');
    });
  } catch (e) {
    log(`   ❌ Failed: ${e.message}`, 'red');
  }

  // Test 3: Register Admin User
  log('\n3️⃣  Register Admin User', 'blue');
  const adminEmail = 'admin@example.com';
  const adminPass = 'AdminPass123!';
  try {
    const regRes = await makeRequest('POST', '/api/register', {
      name: 'System Admin',
      email: adminEmail,
      password: adminPass
    });
    if (regRes.status === 201) {
      log(`   ✅ Admin registered: ${adminEmail}`, 'green');
    } else if (regRes.status === 400 && regRes.data.error.includes('already')) {
      log(`   ℹ️  Admin already exists: ${adminEmail}`, 'yellow');
    } else {
      log(`   ❌ Failed: ${regRes.data.error}`, 'red');
    }
  } catch (e) {
    log(`   ❌ Failed: ${e.message}`, 'red');
  }

  // Test 4: Login
  log('\n4️⃣  User Login', 'blue');
  let authToken = null;
  try {
    const loginRes = await makeRequest('POST', '/api/login', {
      email: adminEmail,
      password: adminPass
    });
    if (loginRes.status === 200) {
      authToken = loginRes.data.token;
      log(`   ✅ Login successful`, 'green');
      log(`   🔑 Token: ${authToken.substring(0, 30)}...`, 'green');
    } else {
      log(`   ❌ Login failed: ${loginRes.data.error}`, 'red');
    }
  } catch (e) {
    log(`   ❌ Failed: ${e.message}`, 'red');
  }

  if (!authToken) {
    log('\n❌ Cannot continue without auth token', 'red');
    return;
  }

  // Test 5: Profile
  log('\n5️⃣  Get Profile', 'blue');
  try {
    const profRes = await makeRequest('GET', '/profile', null, authToken);
    if (profRes.status === 200) {
      log(`   ✅ Profile retrieved`, 'green');
      log(`      Name: ${profRes.data.name}`, 'green');
      log(`      Email: ${profRes.data.email}`, 'green');
    } else {
      log(`   ❌ Failed: ${profRes.data.error}`, 'red');
    }
  } catch (e) {
    log(`   ❌ Failed: ${e.message}`, 'red');
  }

  // Test 6: Update Location
  log('\n6️⃣  Update Location', 'blue');
  try {
    const locRes = await makeRequest('POST', '/location/update', {
      latitude: 18.5204,
      longitude: 73.8567
    }, authToken);
    if (locRes.status === 200) {
      log(`   ✅ Location updated`, 'green');
      log(`      Lat: ${locRes.data.location.latitude}, Lon: ${locRes.data.location.longitude}`, 'green');
    } else {
      log(`   ❌ Failed: ${locRes.data.error}`, 'red');
    }
  } catch (e) {
    log(`   ❌ Failed: ${e.message}`, 'red');
  }

  // Test 7: Check Location in Risk Zone
  log('\n7️⃣  Check Location in Risk Zone', 'blue');
  try {
    const checkRes = await makeRequest('POST', '/api/risk-zones/check-location', {
      latitude: 18.5204,
      longitude: 73.8567
    }, authToken);
    if (checkRes.status === 200) {
      log(`   ✅ Risk check complete`, 'green');
      log(`      Safe: ${checkRes.data.isSafe}, Nearby Zones: ${checkRes.data.nearbyZones.length}`, 'green');
    } else {
      log(`   ❌ Failed: ${checkRes.data.error}`, 'red');
    }
  } catch (e) {
    log(`   ❌ Failed: ${e.message}`, 'red');
  }

  // Test 8: Report Incident
  log('\n8️⃣  Report Incident', 'blue');
  try {
    const incRes = await makeRequest('POST', '/incident/report', {
      type: 'accident',
      description: 'Test incident',
      latitude: 18.5204,
      longitude: 73.8567
    }, authToken);
    if (incRes.status === 201) {
      log(`   ✅ Incident reported`, 'green');
      log(`      ID: ${incRes.data.incident._id}`, 'green');
    } else {
      log(`   ⚠️  Status: ${incRes.status}`, 'yellow');
      log(`      Response: ${JSON.stringify(incRes.data)}`, 'yellow');
    }
  } catch (e) {
    log(`   ❌ Failed: ${e.message}`, 'red');
  }

  // Test 9: Get User Incidents
  log('\n9️⃣  Get User Incidents', 'blue');
  try {
    const myIncRes = await makeRequest('GET', '/incident/my', null, authToken);
    if (incRes.status === 200) {
      log(`   ✅ Incidents retrieved`, 'green');
      log(`      Count: ${myIncRes.data.length}`, 'green');
    } else {
      log(`   ❌ Failed: ${myIncRes.data.error}`, 'red');
    }
  } catch (e) {
    log(`   ❌ Failed: ${e.message}`, 'red');
  }

  log('\n✅ TEST SUITE COMPLETE\n', 'green');
}

// Run tests
testAllEndpoints().catch(err => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
