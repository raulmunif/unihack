// lib/datastax.js
import OpenAI from 'openai';

// In-memory database for development
let alertsDb = [
  {
    id: '1',
    title: 'Train Delays',
    description: 'Signal issues at Ashfield station causing delays up to 30 minutes on all Western line services.',
    category: 'transport',
    severity: 'medium',
    location: 'Western Sydney',
    timeIssued: '2025-03-15T08:30:00',
    expectedResolution: '2025-03-15T11:00:00',
    issuer: 'Transport NSW',
    active: true
  },
  {
    id: '2',
    title: 'Planned Power Outage',
    description: 'Scheduled maintenance will affect power supply in North Sydney suburbs.',
    category: 'electricity',
    severity: 'low',
    location: 'North Sydney',
    timeIssued: '2025-03-14T17:00:00',
    expectedResolution: '2025-03-15T14:00:00',
    issuer: 'Ausgrid',
    active: true
  },
  {
    id: '3',
    title: 'Flash Flooding Alert',
    description: 'Heavy rainfall expected to cause flash flooding in low-lying areas near Parramatta River.',
    category: 'weather',
    severity: 'high',
    location: 'Parramatta',
    timeIssued: '2025-03-15T06:15:00',
    expectedResolution: '2025-03-16T00:00:00',
    issuer: 'NSW Emergency Services',
    active: true
  }
];

// Create a new alert
export const createAlert = async (alertData) => {
  const id = (alertsDb.length + 1).toString();
  
  // Add metadata
  const alert = {
    id,
    ...alertData,
    timeIssued: new Date().toISOString(),
    active: true
  };
  
  alertsDb.push(alert);
  return alert;
};

// Get all active alerts
export const getActiveAlerts = async () => {
  return alertsDb.filter(alert => alert.active);
};

// Get alert by ID
export const getAlertById = async (id) => {
  return alertsDb.find(alert => alert.id === id) || null;
};

// Update an alert
export const updateAlert = async (id, updateData) => {
  const index = alertsDb.findIndex(alert => alert.id === id);
  
  if (index === -1) {
    return null;
  }
  
  alertsDb[index] = {
    ...alertsDb[index],
    ...updateData
  };
  
  return alertsDb[index];
};

// Deactivate an alert
export const deactivateAlert = async (id) => {
  const index = alertsDb.findIndex(alert => alert.id === id);
  
  if (index === -1) {
    return false;
  }
  
  alertsDb[index].active = false;
  return true;
};

// Setup OpenAI for queries
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI query function for natural language search
export const queryAlerts = async (query) => {
  // For development, we'll do a simple keyword search
  const keywords = query.toLowerCase().split(' ');
  
  const relevantAlerts = alertsDb.filter(alert => {
    const alertText = `${alert.title} ${alert.description} ${alert.location} ${alert.category}`.toLowerCase();
    return keywords.some(keyword => alertText.includes(keyword)) && alert.active;
  });
  
  // If we have relevant alerts, pass them to OpenAI for natural language response
  if (relevantAlerts.length > 0) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides concise information about public alerts. Summarize the information provided to answer the user's query. Be direct and factual."
          },
          {
            role: "user",
            content: `Question: ${query}\n\nRelevant alerts: ${JSON.stringify(relevantAlerts)}`
          }
        ],
      });
      
      return {
        answer: response.choices[0].message.content,
        relevantAlerts
      };
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      
      // Fallback response if OpenAI call fails
      return {
        answer: `Found ${relevantAlerts.length} relevant alerts that match your query about "${query}". Please check the alerts below for more information.`,
        relevantAlerts
      };
    }
  }
  
  return {
    answer: "No relevant information found for your query. Please try another question or check the current alerts.",
    relevantAlerts: []
  };
};