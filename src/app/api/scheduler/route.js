import { NextResponse } from 'next/server';
import { startScraping } from '@/lib/scraper';

let isScrapingStarted = false;

export async function GET() {
  try {
    if (!isScrapingStarted) {
      // Start scraping every 15 minutes
      await startScraping(15);
      isScrapingStarted = true;
      return NextResponse.json({ message: 'Scraping service started successfully' });
    }
    
    return NextResponse.json({ message: 'Scraping service is already running' });
  } catch (error) {
    console.error('Error starting scraping service:', error);
    return NextResponse.json(
      { error: 'Failed to start scraping service' },
      { status: 500 }
    );
  }
}