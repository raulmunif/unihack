// scripts/generate-embeddings.js

const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env.local' });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// MongoDB connection
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'alertsystem';
const alertsCollection = 'alerts';
const embeddingsCollection = 'alertEmbeddings';

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function generateAllEmbeddings() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db(dbName);
    const alertsColl = database.collection(alertsCollection);
    const embeddingsColl = database.collection(embeddingsCollection);
    
    // Get all alerts
    const alerts = await alertsColl.find({}).toArray();
    console.log(`Found ${alerts.length} alerts to process`);
    
    // Create the embeddings collection if it doesn't exist
    const collections = await database.listCollections().toArray();
    if (!collections.some(c => c.name === embeddingsCollection)) {
      await database.createCollection(embeddingsCollection);
      console.log(`Created ${embeddingsCollection} collection`);
    }
    
    // Process each alert
    for (const alert of alerts) {
      console.log(`Processing alert ${alert.id}: ${alert.title}`);
      
      // Create the text representation of the alert
      const alertText = `${alert.title}. ${alert.description}. Category: ${alert.category}. Location: ${alert.location}. Severity: ${alert.severity}.`;
      
      // Check if we already have an embedding for this alert
      const existingEmbedding = await embeddingsColl.findOne({ alertId: alert.id });
      
      if (existingEmbedding) {
        console.log(`Embedding for alert ${alert.id} already exists, skipping...`);
        continue;
      }
      
      // Generate new embedding
      console.log(`Generating embedding for alert ${alert.id}...`);
      const embedding = await generateEmbedding(alertText);
      
      // Store the embedding
      await embeddingsColl.insertOne({
        alertId: alert.id,
        embedding: embedding,
        text: alertText,
        lastUpdated: new Date()
      });
      
      console.log(`Embedding for alert ${alert.id} stored successfully`);
    }
    
    console.log('All embeddings generated and stored successfully');
    
  } catch (error) {
    console.error('Error generating embeddings:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

generateAllEmbeddings();