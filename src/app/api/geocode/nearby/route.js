// app/api/alerts/nearby/route.js
import { NextResponse } from 'next/server';
import { getNearbyAlerts } from '@/lib/datastax';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || 10; // Default 10km radius
  
  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Both lat and lng parameters are required' },
      { status: 400 }
    );
  }
  
  try {
    const alerts = await getNearbyAlerts(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
    );
    
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching nearby alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nearby alerts' },
      { status: 500 }
    );
  }
}