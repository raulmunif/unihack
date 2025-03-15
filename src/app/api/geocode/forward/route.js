// app/api/geocode/forward/route.js
import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/location-service';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    const coordinates = await geocodeAddress(address);
    
    if (!coordinates) {
      return NextResponse.json(
        { error: 'Could not geocode the provided address' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ coordinates });
  } catch (error) {
    console.error('Error geocoding address:', error);
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
}

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