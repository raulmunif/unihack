import axios from 'axios';
import * as cheerio from 'cheerio';
import { createAlert } from './mongodb';
import { geocodeAddress } from './location-service';

// List of sources to scrape
const SOURCES = [
  {
    name: 'NSW Rural Fire Service',
    url: 'https://www.rfs.nsw.gov.au/fire-information/fires-near-me',
    type: 'fire',
  },
  {
    name: 'NSW SES',
    url: 'https://www.ses.nsw.gov.au/news-and-media/latest-news/',
    type: 'emergency',
  },
  // Add more sources as needed
];

// Main scraping function
export async function scrapeAlerts() {
  console.log('Starting alert scraping...');
  
  for (const source of SOURCES) {
    try {
      console.log(`Scraping ${source.name}...`);
      const alerts = await scrapeSource(source);
      
      for (const alert of alerts) {
        try {
          // Check if alert already exists (based on title and source)
          const position = await geocodeAddress(alert.location);
          
          await createAlert({
            ...alert,
            position,
            source: source.name,
            sourceUrl: alert.url,
          });
          
          console.log(`Created alert: ${alert.title}`);
        } catch (error) {
          console.error(`Error creating alert: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error scraping ${source.name}: ${error.message}`);
    }
  }
  
  console.log('Scraping completed');
}

// Source-specific scraping functions
async function scrapeSource(source) {
  switch (source.name) {
    case 'NSW Rural Fire Service':
      return scrapeRFS();
    case 'NSW SES':
      return scrapeSES();
    default:
      return [];
  }
}

async function scrapeRFS() {
  try {
    const response = await axios.get('https://www.rfs.nsw.gov.au/fire-information/fires-near-me');
    const $ = cheerio.load(response.data);
    const alerts = [];

    // Example scraping logic - adjust based on actual website structure
    $('.incident-list .incident').each((_, element) => {
      const title = $(element).find('.incident-title').text().trim();
      const description = $(element).find('.incident-description').text().trim();
      const location = $(element).find('.incident-location').text().trim();
      const url = $(element).find('a').attr('href');

      if (title && description && location) {
        alerts.push({
          title,
          description,
          location,
          url: url ? new URL(url, 'https://www.rfs.nsw.gov.au').toString() : null,
          type: 'fire',
        });
      }
    });

    return alerts;
  } catch (error) {
    console.error('Error scraping RFS:', error.message);
    return [];
  }
}

async function scrapeSES() {
  try {
    const response = await axios.get('https://www.ses.nsw.gov.au/news-and-media/latest-news/');
    const $ = cheerio.load(response.data);
    const alerts = [];

    // Example scraping logic - adjust based on actual website structure
    $('.news-list .news-item').each((_, element) => {
      const title = $(element).find('.news-title').text().trim();
      const description = $(element).find('.news-description').text().trim();
      const location = $(element).find('.news-location').text().trim();
      const url = $(element).find('a').attr('href');

      if (title && description && location) {
        alerts.push({
          title,
          description,
          location,
          url: url ? new URL(url, 'https://www.ses.nsw.gov.au').toString() : null,
          type: 'emergency',
        });
      }
    });

    return alerts;
  } catch (error) {
    console.error('Error scraping SES:', error.message);
    return [];
  }
}

// Export a function to start scraping
export async function startScraping(intervalMinutes = 15) {
  // Initial scrape
  await scrapeAlerts();
  
  // Set up interval for regular scraping
  setInterval(scrapeAlerts, intervalMinutes * 60 * 1000);
}