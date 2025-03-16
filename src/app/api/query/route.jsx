// File: app/api/query/route.js (Next.js App Router)
// or: pages/api/query.js (Next.js Pages Router)

import { MongoClient } from 'mongodb';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// MongoDB connection
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'alertsystem';
const alertsCollection = 'alerts';
const embeddingsCollection = 'alertEmbeddings';

// Function to generate embeddings for a text
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

// Function to compute similarity using cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(request) {
  // For Next.js App Router
  try {
    const body = await request.json();
    const { query, userLocation } = body;
    
    // Connect to MongoDB
    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db(dbName);
    const alertsColl = database.collection(alertsCollection);
    const embeddingsColl = database.collection(embeddingsCollection);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Fetch all alerts
    const alerts = await alertsColl.find({}).toArray();
    
    // Fetch or generate embeddings for alerts
    let alertsWithEmbeddings = [];
    
    for (const alert of alerts) {
      // Create the text representation of the alert
      const alertText = `${alert.title}. ${alert.description}. Category: ${alert.category}. Location: ${alert.location}. Severity: ${alert.severity}.`;
      
      // Check if we already have an embedding for this alert
      let embeddingDoc = await embeddingsColl.findOne({ alertId: alert.id });
      
      if (!embeddingDoc) {
        // Generate new embedding
        const embedding = await generateEmbedding(alertText);
        
        // Store the embedding
        embeddingDoc = {
          alertId: alert.id,
          embedding: embedding,
          lastUpdated: new Date()
        };
        
        await embeddingsColl.insertOne(embeddingDoc);
      }
      
      // Calculate similarity score
      const similarity = cosineSimilarity(queryEmbedding, embeddingDoc.embedding);
      
      alertsWithEmbeddings.push({
        ...alert,
        similarity: similarity
      });
    }
    
    // Sort by similarity and get top results
    const topResults = alertsWithEmbeddings
      .sort((a, b) => b.similarity - a.similarity)
      .filter(alert => alert.similarity > 0.7) // Only include relevant results
      .slice(0, 3); // Get top 3 results
    
    // If there are no relevant results
    if (topResults.length === 0) {
      await client.close();
      return new Response(JSON.stringify({ 
        answer: "I couldn't find any alerts matching your query. Please try asking a different question or check all current alerts." 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Format top results for the AI
    const resultsContext = topResults.map(alert => `
      ID: ${alert.id}
      Title: ${alert.title}
      Description: ${alert.description}
      Category: ${alert.category}
      Severity: ${alert.severity}
      Location: ${alert.location}
      Issued: ${new Date(alert.timeIssued).toLocaleString()}
      Expected Resolution: ${new Date(alert.expectedResolution).toLocaleString()}
      Issuer: ${alert.issuer}
      Relevance Score: ${(alert.similarity * 100).toFixed(2)}%
    `).join('\n');
    
    // Get AI to generate a response based on the relevant alerts
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a smaller model since context is now filtered
      messages: [
        {
          role: "system", 
          content: `You are an alert system assistant. Answer questions based on the most relevant alerts provided. 
                    Prioritize higher severity alerts in your responses.
                    Be concise and informative. Current date: ${new Date().toLocaleString()}`
        },
        {
          role: "user",
          content: `Here are the most relevant alerts for the query "${query}":\n${resultsContext}\n${
            userLocation ? `\nUser is located at: Latitude ${userLocation.lat}, Longitude ${userLocation.lng}` : ''
          }\n\nPlease provide a helpful response to the user's query.`
        }
      ],
      max_tokens: 300
    });
    
    const answer = completion.choices[0].message.content;
    
    await client.close();
    
    return new Response(JSON.stringify({ answer, relevantAlerts: topResults }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error processing query:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process query',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}