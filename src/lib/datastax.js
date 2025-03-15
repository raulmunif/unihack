// Update to lib/datastax.js to support location-based queries

import { createClient } from '@astrajs/collections';
import OpenAI from 'openai';
import { geocodeAddress, calculateDistance } from './location-service';

// Setup DataStax Astra DB client
let astraClient = null;

export const getAstraClient = async () => {
  if (astraClient === null) {
    astraClient = await createClient({
      astraDatabaseId: process.env.ASTRA_DB_ID,
      astraDatabaseRegion: process.env.ASTRA_DB_REGION,
      applicationToken: process.env.ASTRA_DB_APPLICATION_TOKEN,
    });
  }
  return astraClient;
};

// Get alerts collection
export const getAlertsCollection = async () => {
  const client = await getAstraClient();
  return client.namespace(process.env.ASTRA_DB_NAMESPACE).collection('alerts');
};

// Create a new alert with location data
export const createAlert = async (alertData) => {
  const collection = await getAlertsCollection();
  
  // Convert location string to coordinates
  let position = null;
  if (alertData.location) {
    position = await geocodeAddress(alertData.location);
  }
  
  // Add metadata
  const alert = {
    ...alertData,
    timeIssued: new Date().toISOString(),
    active: true,
    position: position || null,
    // Generate embeddings for vector search with OpenAI
    embedding: await generateEmbedding(`${alertData.title} ${alertData.description} ${alertData.location}`),
  };
  
  return await collection.create(alert);
};

// Get all active alerts
export const getActiveAlerts = async () => {
  const collection = await getAlertsCollection();
  const { data } = await collection.find({ active: true });
  return data;
};

// Get alerts near a specific location
export const getNearbyAlerts = async (latitude, longitude, radiusKm = 10) => {
  const allAlerts = await getActiveAlerts();
  
  // Filter alerts by distance
  return allAlerts.filter(alert => {
    if (!alert.position) return false;
    
    const distance = calculateDistance(
      { lat: latitude, lng: longitude },
      { lat: alert.position.lat, lng: alert.position.lng }
    );
    
    return distance <= radiusKm;
  });
};

// Get alert by ID
export const getAlertById = async (id) => {
  const collection = await getAlertsCollection();
  return await collection.get(id);
};

// Update an alert
export const updateAlert = async (id, updateData) => {
  const collection = await getAlertsCollection();
  return await collection.update(id, updateData);
};

// Deactivate an alert
export const deactivateAlert = async (id) => {
  const collection = await getAlertsCollection();
  return await collection.update(id, { active: false });
};

// Setup OpenAI for embeddings and queries
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate embeddings for vector search
export const generateEmbedding = async (text) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  
  return response.data[0].embedding;
};

// AI query function for natural language search that considers location
export const queryAlerts = async (query, userLocation = null) => {
  const collection = await getAlertsCollection();
  
  // Generate embedding for the query
  const embedding = await generateEmbedding(query);
  
  // Vector search in Astra DB
  const { data } = await collection.find(
    { active: true },
    {
      sort: { $vector: embedding },
      limit: 10, // Get top 10 most relevant results
    }
  );
  
  // If user location is provided, sort by distance and relevance
  let results = [...data];
  
  if (userLocation && userLocation.lat && userLocation.lng) {
    // Calculate distance for each alert
    results = results.map(alert => {
      if (!alert.position) return { ...alert, distance: null };
      
      const distance = calculateDistance(
        userLocation,
        { lat: alert.position.lat, lng: alert.position.lng }
      );
      
      return { ...alert, distance };
    });
    
    // Sort by a combination of vector relevance and distance
    // This is a simplified approach - you can customize the sorting algorithm
    results.sort((a, b) => {
      // If both have distance, consider both relevance and distance
      if (a.distance !== null && b.distance !== null) {
        const relevanceWeight = 0.7;
        const distanceWeight = 0.3;
        
        // Already sorted by relevance, so index is a proxy for relevance
        const aRelevanceScore = results.indexOf(a) / results.length;
        const bRelevanceScore = results.indexOf(b) / results.length;
        
        // Normalize distances between 0 and 1
        const maxDistance = Math.max(...results.filter(r => r.distance !== null).map(r => r.distance));
        const aDistanceScore = a.distance / maxDistance;
        const bDistanceScore = b.distance / maxDistance;
        
        const aScore = (aRelevanceScore * relevanceWeight) + (aDistanceScore * distanceWeight);
        const bScore = (bRelevanceScore * relevanceWeight) + (bDistanceScore * distanceWeight);
        
        return aScore - bScore;
      }
      
      // If only one has distance, prioritize the one with distance
      if (a.distance !== null && b.distance === null) return -1;
      if (a.distance === null && b.distance !== null) return 1;
      
      // If neither has distance, maintain original order (relevance)
      return 0;
    });
  }
  
  // If we have relevant alerts, pass them to OpenAI for natural language response
  if (results.length > 0) {
    // Prepare user context for location-aware responses
    let locationContext = '';
    if (userLocation) {
      locationContext = `The user is located at coordinates ${userLocation.lat}, ${userLocation.lng}.`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that provides concise information about public alerts. 
                    Summarize the information provided to answer the user's query. 
                    Be direct and factual. ${locationContext}
                    If distance information is available, mention the closest alerts first.
                    Always indicate how far away each alert is from the user when that information is available.`
        },
        {
          role: "user",
          content: `Question: ${query}\n\nRelevant alerts: ${JSON.stringify(results)}`
        }
      ],
    });
    
    return {
      answer: response.choices[0].message.content,
      relevantAlerts: results
    };
  }
  
  return {
    answer: "No relevant information found for your query. Please try another question or check the current alerts.",
    relevantAlerts: []
  };
};