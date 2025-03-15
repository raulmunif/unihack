// app/api/alerts/route.js
import { NextResponse } from 'next/server';
import { 
  getActiveAlerts, 
  createAlert
} from '@/lib/datastax';

// Get all active alerts
export async function GET() {
  try {
    const alerts = await getActiveAlerts();
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// Create a new alert
export async function POST(request) {
  try {
    const alertData = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'severity', 'location', 'expectedResolution', 'issuer'];
    for (const field of requiredFields) {
      if (!alertData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create the alert
    const newAlert = await createAlert(alertData);
    
    return NextResponse.json({ alert: newAlert }, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}