// scripts/test-data.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createAlert, connectToDatabase } from '../src/lib/mongodb.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - look for .env in parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate environment setup
if (!process.env.MONGODB_URI) {
  console.error('\x1b[31mERROR: MONGODB_URI environment variable is not defined\x1b[0m');
  console.error('Please create a .env file in the project root with the following content:');
  console.error('\x1b[33mMONGODB_URI=mongodb://your-connection-string\x1b[0m');
  console.error('For local development, you can use:');
  console.error('\x1b[33mMONGODB_URI=mongodb://localhost:27017/alert-system\x1b[0m');
  process.exit(1);
}

const testAlerts = [
  {
    title: 'Test Fire Alert',
    description: 'Large bushfire in Blue Mountains area. Residents advised to monitor conditions.',
    location: 'Blue Mountains, NSW',
    category: 'fire',
    severity: 'high',
    position: {
      lat: -33.7,
      lng: 150.3
    },
    source: 'Test Data',
    sourceUrl: 'https://example.com/fire-alert',
    timeIssued: new Date().toISOString(),
    expectedResolution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    issuer: 'Test System'
  },
  {
    title: 'Test Flood Warning',
    description: 'Minor flooding expected along Parramatta River. Low-lying areas may be affected.',
    location: 'Parramatta, NSW',
    category: 'weather',
    severity: 'medium',
    position: {
      lat: -33.8148,
      lng: 151.0017
    },
    source: 'Test Data',
    sourceUrl: 'https://example.com/flood-warning',
    timeIssued: new Date().toISOString(),
    expectedResolution: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    issuer: 'Test System'
  },
  {
    title: 'Test Transport Delay',
    description: 'Major delays on T1 North Shore Line due to signal failure at North Sydney.',
    location: 'North Sydney, NSW',
    category: 'transport',
    severity: 'low',
    position: {
      lat: -33.8399,
      lng: 151.2072
    },
    source: 'Test Data',
    sourceUrl: 'https://example.com/transport-delay',
    timeIssued: new Date().toISOString(),
    expectedResolution: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    issuer: 'Test System'
  }
];

async function insertTestData() {
  try {
    console.log('Connecting to MongoDB...');
    console.log(`Using MongoDB URI: ${process.env.MONGODB_URI ? '✓ defined' : '✗ undefined'}`);
    
    await connectToDatabase();
    
    console.log('Inserting test alerts...');
    
    for (const alert of testAlerts) {
      try {
        const result = await createAlert(alert);
        console.log(`✓ Created alert: ${result.title}`);
      } catch (alertError) {
        console.error(`✗ Failed to create alert "${alert.title}":`, alertError.message);
      }
    }
    
    console.log('\nTest data insertion summary:');
    console.log(`- Attempted to insert ${testAlerts.length} alerts`);
    console.log('- Check above for success/failure of each alert');
    
    console.log('\nTest data insertion complete!');
    
    // Close the connection
    if (mongoose.connection.readyState >= 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31mError inserting test data:\x1b[0m', error);
    console.error('\nPlease check:');
    console.error('1. MongoDB is running and accessible');
    console.error('2. Your MONGODB_URI is correct in the .env file');
    console.error('3. Network connectivity to your MongoDB instance');
    
    process.exit(1);
  }
}

// Run the insertion function
insertTestData();