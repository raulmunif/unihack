import { NextResponse } from 'next/server';
import { queryAlerts } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { query, location } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    const results = await queryAlerts(query, location);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error querying alerts:', error);
    return NextResponse.json(
      { error: 'Failed to query alerts' },
      { status: 500 }
    );
  }
}