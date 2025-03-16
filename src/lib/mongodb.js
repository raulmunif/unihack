import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { pipeline } from '@xenova/transformers';

// Load environment variables
dotenv.config();

// Check for MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined in environment variables');
  console.error('Please create a .env file with MONGODB_URI=mongodb://your-connection-string');
  // Don't exit process here to allow for better error handling
}

let embeddingPipeline;

// Initialize the embedding pipeline
const getEmbeddingPipeline = async () => {
  if (!embeddingPipeline) {
    try {
      embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true
      });
    } catch (error) {
      console.error('Error initializing embedding pipeline:', error);
      throw error;
    }
  }
  return embeddingPipeline;
};

// Alert Schema
const AlertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: String,
  category: { type: String, enum: ['fire', 'weather', 'transport', 'other'], default: 'other' },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  position: {
    lat: Number,
    lng: Number,
  },
  source: String,
  sourceUrl: String,
  timeIssued: { type: Date, default: Date.now },
  expectedResolution: Date,
  issuer: String,
  active: { type: Boolean, default: true },
  embedding: { type: [Number], index: true }, // Store embeddings for vector search
});

// Create standard indexes
AlertSchema.index({ active: 1, timeIssued: -1 }); // Index for active alerts sorted by time
AlertSchema.index({ 'position.lat': 1, 'position.lng': 1 }); // Geospatial index for location queries

// Create model only if it doesn't exist
export const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

// Connect to MongoDB with improved error handling
export const connectToDatabase = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log('Using existing MongoDB connection');
      return mongoose.connection;
    }
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    
    const connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Generate embeddings using local transformer
export const generateEmbedding = async (text) => {
  try {
    const pipeline = await getEmbeddingPipeline();
    const output = await pipeline(text, { pooling: 'mean' });
    return Array.from(output.data);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return []; // Return empty array as fallback to prevent broader application failure
  }
};

// Create a new alert
export const createAlert = async (alertData) => {
  try {
    await connectToDatabase();
    
    let embedding = [];
    try {
      embedding = await generateEmbedding(
        `${alertData.title} ${alertData.description} ${alertData.location || ''}`
      );
    } catch (embeddingError) {
      console.warn('Warning: Could not generate embedding, continuing without it:', embeddingError);
    }
    
    const alert = new Alert({
      ...alertData,
      embedding,
    });
    
    return alert.save();
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
};

// Get all active alerts
export const getActiveAlerts = async () => {
  try {
    await connectToDatabase();
    return Alert.find({ active: true }).sort('-timeIssued');
  } catch (error) {
    console.error('Error getting active alerts:', error);
    throw error;
  }
};

// Get alerts near a location
export const getNearbyAlerts = async (latitude, longitude, radiusKm = 10) => {
  try {
    await connectToDatabase();
    
    // Convert radius to degrees (approximate)
    const radiusDegrees = radiusKm / 111.12; // 1 degree ≈ 111.12 km at the equator
    
    return Alert.find({
      active: true,
      'position.lat': { $gte: latitude - radiusDegrees, $lte: latitude + radiusDegrees },
      'position.lng': { $gte: longitude - radiusDegrees, $lte: longitude + radiusDegrees },
    }).sort('-timeIssued');
  } catch (error) {
    console.error('Error getting nearby alerts:', error);
    throw error;
  }
};

// Get alert by ID
export const getAlertById = async (id) => {
  try {
    await connectToDatabase();
    return Alert.findById(id);
  } catch (error) {
    console.error('Error getting alert by ID:', error);
    throw error;
  }
};

// Update an alert
export const updateAlert = async (id, updateData) => {
  try {
    await connectToDatabase();
    return Alert.findByIdAndUpdate(id, updateData, { new: true });
  } catch (error) {
    console.error('Error updating alert:', error);
    throw error;
  }
};

// Deactivate an alert
export const deactivateAlert = async (id) => {
  try {
    await connectToDatabase();
    return Alert.findByIdAndUpdate(id, { active: false }, { new: true });
  } catch (error) {
    console.error('Error deactivating alert:', error);
    throw error;
  }
};

// Get filtered alerts
export const getFilteredAlerts = async (filters = {}) => {
  try {
    await connectToDatabase();
    const query = { active: true };
    
    // Add category filter if provided
    if (filters.categories?.length) {
      query.category = { $in: filters.categories };
    }
    
    // Add severity filter if provided
    if (filters.severities?.length) {
      query.severity = { $in: filters.severities };
    }
    
    return Alert.find(query).sort('-timeIssued');
  } catch (error) {
    console.error('Error getting filtered alerts:', error);
    throw error;
  }
};

// Query alerts using vector similarity
export const queryAlerts = async (query, userLocation = null) => {
  try {
    await connectToDatabase();
    
    let embedding = [];
    try {
      embedding = await generateEmbedding(query);
    } catch (embeddingError) {
      console.warn('Warning: Could not generate embedding for query, falling back to text search:', embeddingError);
      
      // Fallback to text search if embedding fails
      const textResults = await Alert.find({
        active: true,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } }
        ]
      }).sort('-timeIssued').limit(10).lean();
      
      return {
        relevantAlerts: textResults,
        answer: generateNaturalLanguageResponse(query, textResults, userLocation)
      };
    }
    
    // Find similar alerts using vector similarity
    let alerts = await Alert.find({ active: true }).lean();
    
    // Calculate similarity scores (only for alerts with embeddings)
    const scores = alerts
      .filter(alert => alert.embedding && alert.embedding.length > 0)
      .map(alert => ({
        ...alert,
        score: cosineSimilarity(embedding, alert.embedding),
      }));
    
    // Sort by similarity score
    scores.sort((a, b) => b.score - a.score);
    
    // Take top 10 results
    const results = scores.slice(0, 10);
    
    // If user location is provided, include distance information
    if (userLocation && userLocation.lat && userLocation.lng) {
      results.forEach(alert => {
        if (alert.position && alert.position.lat && alert.position.lng) {
          alert.distance = calculateDistance(
            userLocation,
            alert.position
          );
        }
      });
    }
    
    return {
      relevantAlerts: results,
      answer: generateNaturalLanguageResponse(query, results, userLocation)
    };
  } catch (error) {
    console.error('Error querying alerts:', error);
    throw error;
  }
};

// Helper function to calculate cosine similarity
function cosineSimilarity(a, b) {
  if (!a || !a.length || !b || !b.length || a.length !== b.length) {
    return 0; // Handle missing or mismatched vectors
  }
  
  try {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0;
  }
}

// Helper function to calculate distance between two points
function calculateDistance(point1, point2) {
  try {
    if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
      return null;
    }
    
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lng - point1.lng);
    const lat1 = toRad(point1.lat);
    const lat2 = toRad(point2.lat);
  
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

// Generate natural language response
function generateNaturalLanguageResponse(query, results, userLocation) {
  try {
    if (!results || results.length === 0) {
      return "No relevant alerts found for your query.";
    }
    
    let response = `Found ${results.length} relevant alert${results.length === 1 ? '' : 's'}.\n\n`;
    
    results.forEach((alert, index) => {
      response += `${index + 1}. ${alert.title}\n`;
      
      if (alert.severity) {
        response += `   Severity: ${alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}\n`;
      }
      
      if (alert.location) {
        response += `   Location: ${alert.location}\n`;
      }
      
      if (alert.distance !== undefined && alert.distance !== null) {
        response += `   Distance: ${alert.distance.toFixed(1)} km away\n`;
      }
      
      response += `   ${alert.description}\n`;
      
      if (alert.timeIssued) {
        const date = new Date(alert.timeIssued);
        response += `   Issued: ${date.toLocaleString()}\n`;
      }
      
      response += '\n';
    });
    
    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    return "An error occurred while generating the response.";
  }
}