// app/api/geocode/reverse/route.js
import { NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/location-service';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Both lat and lng parameters are required' },
      { status: 400 }
    );
  }
  
  try {
    const locationData = await reverseGeocode({
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    });
    
    if (!locationData) {
      return NextResponse.json(
        { error: 'Could not reverse geocode the provided coordinates' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(locationData);
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode coordinates' },
      { status: 500 }
    );
  }
}