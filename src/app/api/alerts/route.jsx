// File: app/api/alerts/route.js (Next.js App Router)
// or: pages/api/alerts.js (Next.js Pages Router)

import { MongoClient } from 'mongodb';

// Your MongoDB connection string
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'alert-system-database';
const collectionName = process.env.MONGODB_COLLECTION || 'alerts'; // The collection name where alerts are stored

export async function GET(request) {
  // For Next.js App Router
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    
    // Fetch alerts
    const alerts = await collection.find({}).toArray();
    
    await client.close();
    
    return new Response(JSON.stringify({ alerts }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching alerts from MongoDB:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch alerts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// If you're using Pages API Routes (pages/api/alerts.js), use this handler instead:
/*
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    
    // Fetch alerts
    const alerts = await collection.find({}).toArray();
    
    await client.close();
    
    return res.status(200).json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts from MongoDB:', error);
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
}
*/