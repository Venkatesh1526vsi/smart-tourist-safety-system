const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/risk-zones';

// Test data
let adminToken = '';
let userToken = '';
let createdZoneId = '';

// Sample risk zone data
const sampleZone = {
  name: 'Downtown High Crime Area',
  description: 'Known theft hotspot near train station',
  riskLevel: 'high',
  polygon: [
    [40.7128, -74.0060],
    [40.7135, -74.0055],
    [40.7140, -74.0065],
    [40.7133, -74.0070]
  ],
  center: {
    latitude: 40.7134,
    longitude: -74.0060
  },
  radius: 1.5
};

const criticalZone = {
  name: 'Airport Security Zone',
  description: 'High-security area',
  riskLevel: 'critical',
  polygon: [
    [40.7700, -73.8700],
    [40.7750, -73.8650],
    [40.7800, -73.8700],
    [40.7750, -73.8750]
  ],
  center: {
    latitude: 40.7750,
    longitude: -73.8700
  },
  radius: 2
};

// Helper function to authenticate and get tokens
async function authenticate() {
  try {
    console.log('\n--- AUTHENTICATION ---\n');
    
    // Login as admin
    const adminRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    adminToken = adminRes.data.token;
    console.log('✓ Admin token obtained');
    
    // Login as regular user
    const userRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'user@example.com',
      password: 'user123'
    });
    
    userToken = userRes.data.token;
    console.log('✓ User token obtained');
    
  } catch (error) {
    console.error('✗ Authentication failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Test 1: GET all risk zones
async function testGetAllZones() {
  try {
    console.log('\n--- TEST 1: GET ALL RISK ZONES ---\n');
    
    const response = await axios.get(API_BASE);
    console.log('✓ GET /api/risk-zones - Success');
    console.log(`  Count: ${response.data.count}`);
    console.log(`  Zones: ${response.data.data.map(z => z.name).join(', ') || 'None'}`);
    
  } catch (error) {
    console.error('✗ GET all zones failed:', error.response?.data || error.message);
  }
}

// Test 2: GET zones by risk level
async function testGetZonesByRiskLevel() {
  try {
    console.log('\n--- TEST 2: GET ZONES BY RISK LEVEL ---\n');
    
    const response = await axios.get(`${API_BASE}?riskLevel=high`);
    console.log('✓ GET /api/risk-zones?riskLevel=high - Success');
    console.log(`  Found: ${response.data.count} high-risk zones`);
    
  } catch (error) {
    console.error('✗ GET by risk level failed:', error.response?.data || error.message);
  }
}

// Test 3: CREATE new risk zone (admin)
async function testCreateZone() {
  try {
    console.log('\n--- TEST 3: CREATE RISK ZONE (ADMIN) ---\n');
    
    const response = await axios.post(API_BASE, sampleZone, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    createdZoneId = response.data.data._id;
    console.log('✓ POST /api/risk-zones - Success');
    console.log(`  Created: ${response.data.data.name}`);
    console.log(`  ID: ${createdZoneId}`);
    console.log(`  Risk Level: ${response.data.data.riskLevel}`);
    
  } catch (error) {
    console.error('✗ CREATE zone failed:', error.response?.data || error.message);
  }
}

// Test 4: CREATE second zone
async function testCreateSecondZone() {
  try {
    console.log('\n--- TEST 4: CREATE SECOND ZONE (CRITICAL) ---\n');
    
    const response = await axios.post(API_BASE, criticalZone, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✓ POST /api/risk-zones - Success');
    console.log(`  Created: ${response.data.data.name}`);
    console.log(`  Risk Level: ${response.data.data.riskLevel}`);
    
  } catch (error) {
    console.error('✗ CREATE second zone failed:', error.response?.data || error.message);
  }
}

// Test 5: GET single zone by ID
async function testGetZoneById() {
  try {
    console.log('\n--- TEST 5: GET SINGLE ZONE BY ID ---\n');
    
    const response = await axios.get(`${API_BASE}/${createdZoneId}`);
    console.log('✓ GET /api/risk-zones/:id - Success');
    console.log(`  Retrieved: ${response.data.data.name}`);
    console.log(`  Description: ${response.data.data.description}`);
    
  } catch (error) {
    console.error('✗ GET zone by ID failed:', error.response?.data || error.message);
  }
}

// Test 6: UPDATE risk zone (admin)
async function testUpdateZone() {
  try {
    console.log('\n--- TEST 6: UPDATE RISK ZONE (ADMIN) ---\n');
    
    const updateData = {
      riskLevel: 'critical',
      description: 'UPDATED: Extremely dangerous area - avoid at all costs'
    };
    
    const response = await axios.put(`${API_BASE}/${createdZoneId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✓ PUT /api/risk-zones/:id - Success');
    console.log(`  Updated: ${response.data.data.name}`);
    console.log(`  New Risk Level: ${response.data.data.riskLevel}`);
    console.log(`  New Description: ${response.data.data.description}`);
    
  } catch (error) {
    console.error('✗ UPDATE zone failed:', error.response?.data || error.message);
  }
}

// Test 7: Check location safety
async function testCheckLocation() {
  try {
    console.log('\n--- TEST 7: CHECK LOCATION SAFETY ---\n');
    
    const location = {
      latitude: 40.7134,
      longitude: -74.0060
    };
    
    const response = await axios.post(`${API_BASE}/check-location`, location, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log('✓ POST /api/risk-zones/check-location - Success');
    console.log(`  Location: ${response.data.location.latitude}, ${response.data.location.longitude}`);
    console.log(`  Safe: ${response.data.isSafe}`);
    console.log(`  Nearby Zones: ${response.data.nearbyZones.length}`);
    if (response.data.nearbyZones.length > 0) {
      response.data.nearbyZones.forEach(zone => {
        console.log(`    - ${zone.name} (${zone.riskLevel})`);
      });
    }
    
  } catch (error) {
    console.error('✗ CHECK location failed:', error.response?.data || error.message);
  }
}

// Test 8: GET statistics (admin)
async function testGetStats() {
  try {
    console.log('\n--- TEST 8: GET STATISTICS (ADMIN) ---\n');
    
    const response = await axios.get(`${API_BASE}/stats/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✓ GET /api/risk-zones/stats/summary - Success');
    console.log(`  Total Zones: ${response.data.total}`);
    console.log(`  By Risk Level:`);
    response.data.byRiskLevel.forEach(item => {
      console.log(`    ${item._id}: ${item.count}`);
    });
    
  } catch (error) {
    console.error('✗ GET stats failed:', error.response?.data || error.message);
  }
}

// Test 9: Unauthorized access (user trying to create zone)
async function testUnauthorizedCreate() {
  try {
    console.log('\n--- TEST 9: UNAUTHORIZED CREATE (USER) ---\n');
    
    await axios.post(API_BASE, sampleZone, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log('✗ Should have failed - user created zone!');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ POST /api/risk-zones (user) - Correctly rejected');
      console.log(`  Message: ${error.response.data.message}`);
    } else {
      console.error('✗ Unexpected error:', error.message);
    }
  }
}

// Test 10: Validation errors
async function testValidationErrors() {
  try {
    console.log('\n--- TEST 10: VALIDATION ERRORS ---\n');
    
    const invalidData = {
      name: 'Invalid Zone',
      riskLevel: 'invalid',
      polygon: [[40.7128, -74.0060], [40.7135, -74.0055]], // Only 2 points
      center: { latitude: 40.7134, longitude: -74.0060 }
    };
    
    await axios.post(API_BASE, invalidData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✗ Should have failed - invalid data accepted!');
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ POST /api/risk-zones (invalid data) - Correctly rejected');
      console.log(`  Message: ${error.response.data.message}`);
    } else {
      console.error('✗ Unexpected error:', error.message);
    }
  }
}

// Test 11: DELETE risk zone (admin)
async function testDeleteZone() {
  try {
    console.log('\n--- TEST 11: DELETE RISK ZONE (ADMIN) ---\n');
    
    const response = await axios.delete(`${API_BASE}/${createdZoneId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✓ DELETE /api/risk-zones/:id - Success');
    console.log(`  Deleted: ${response.data.data.name}`);
    
  } catch (error) {
    console.error('✗ DELETE zone failed:', error.response?.data || error.message);
  }
}

// Test 12: Verify deletion
async function testVerifyDeletion() {
  try {
    console.log('\n--- TEST 12: VERIFY DELETION ---\n');
    
    await axios.get(`${API_BASE}/${createdZoneId}`);
    console.log('✗ Zone still exists after deletion!');
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✓ GET /api/risk-zones/:id (deleted) - Correctly not found');
      console.log(`  Message: ${error.response.data.message}`);
    } else {
      console.error('✗ Unexpected error:', error.message);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('     RISK ZONE API TEST SUITE');
  console.log('═══════════════════════════════════════════════════');
  
  try {
    await authenticate();
    await testGetAllZones();
    await testGetZonesByRiskLevel();
    await testCreateZone();
    await testCreateSecondZone();
    await testGetZoneById();
    await testUpdateZone();
    await testCheckLocation();
    await testGetStats();
    await testUnauthorizedCreate();
    await testValidationErrors();
    await testDeleteZone();
    await testVerifyDeletion();
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('     TEST SUITE COMPLETED');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('Test suite error:', error.message);
  }
}

// Run tests
runAllTests();
