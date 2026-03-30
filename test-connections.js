const http = require('http');

console.log('Testing SAFEYATRA System Connections...\n');

// Test backend on port 3001
console.log('1. Testing Backend (port 3001):');
const backendOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const backendReq = http.request(backendOptions, (res) => {
  console.log('   ✓ Backend is running (Status:', res.statusCode, ')');
});

backendReq.on('error', (e) => {
  console.log('   ✗ Backend is NOT accessible:', e.message);
});

backendReq.on('timeout', () => {
  console.log('   ✗ Backend connection timed out');
  backendReq.destroy();
});

backendReq.end();

// Test MongoDB on port 27017
console.log('\n2. Testing MongoDB (port 27017):');
const net = require('net');
const mongodbClient = new net.Socket();

mongodbClient.setTimeout(5000);

mongodbClient.connect(27017, 'localhost', () => {
  console.log('   ✓ MongoDB is running');
  mongodbClient.destroy();
});

mongodbClient.on('error', (err) => {
  console.log('   ✗ MongoDB is NOT accessible:', err.message);
});

mongodbClient.on('timeout', () => {
  console.log('   ✗ MongoDB connection timed out');
  mongodbClient.destroy();
});

// Wait a bit and then exit
setTimeout(() => {
  console.log('\nTest completed. If any services show "✗", please start them.');
  process.exit(0);
}, 6000);