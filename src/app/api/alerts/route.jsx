import { NextResponse } from 'next/server';
import { createAlert, getActiveAlerts } from '@/lib/mongodb';
import { geocodeAddress } from '@/lib/location-service';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Get coordinates for the location
    let position = null;
    if (data.location) {
      position = await geocodeAddress(data.location);
    }
    
    const alert = await createAlert({
      ...data,
      position,
    });
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const alerts = await getActiveAlerts();
    // Return in the format expected by AlertDashboard
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}