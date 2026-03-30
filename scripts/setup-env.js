#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const services = [
  { name: 'backend-api', envFile: '.env' },
  { name: 'frontend', envFile: '.env.local' },
];

console.log('🔧 Setting up environment files...\n');

services.forEach(service => {
  const rootDir = path.join(__dirname, '..', service.name);
  const exampleFile = path.join(rootDir, '.env.example');
  const envFile = path.join(rootDir, service.envFile);

  if (fs.existsSync(exampleFile) && !fs.existsSync(envFile)) {
    try {
      fs.copyFileSync(exampleFile, envFile);
      console.log(`✅ Created ${service.name}/${service.envFile} from .env.example`);
    } catch (err) {
      console.error(`❌ Failed to create ${service.name}/${service.envFile}:`, err.message);
    }
  } else if (fs.existsSync(envFile)) {
    console.log(`ℹ️  ${service.name}/${service.envFile} already exists (skipping)`);
  } else {
    console.log(`⚠️  No .env.example found in ${service.name}`);
  }
});

console.log('\n📝 Next steps:');
console.log('1. Edit backend-api/.env with your actual credentials');
console.log('2. Edit frontend/.env.local with your API URLs');
console.log('3. Run: npm run start:all');
