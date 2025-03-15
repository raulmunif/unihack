// app/api/query/route.js
import { NextResponse } from 'next/server';
import { queryAlerts } from '@/lib/datastax';

export async function POST(request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    const result = await queryAlerts(query);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing query:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}