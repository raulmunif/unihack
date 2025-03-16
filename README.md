# Alert System

A real-time alert system that aggregates emergency alerts from various sources and provides location-based search capabilities.

## New Features

- MongoDB integration for improved vector search capabilities
- Web scraping of emergency services websites
- Automated alert collection from multiple sources
- Local embeddings generation using Transformers.js

## Prerequisites

- Node.js 18+
- MongoDB 6.0+
- npm or yarn

## Setup

1. Install MongoDB:
   ```bash
   # macOS (using Homebrew)
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. Create data directory:
   ```bash
   mkdir -p data/db
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   Create a `.env.local` file with the following:
   ```
   MONGODB_URI=mongodb://localhost:27017/alert-system
   NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_key
   ENABLE_SCRAPER_SCHEDULER=true
   SCRAPER_SCHEDULE=0 * * * *
   SCRAPER_API_KEY=your_scraper_key
   SCHEDULER_API_KEY=your_scheduler_key
   ```

5. Initialize MongoDB:
   ```bash
   npm run init-db
   ```

6. If migrating from DataStax:
   ```bash
   npm run migrate
   ```

## Running the Application

1. Start MongoDB:
   ```bash
   npm run init-db
   ```

2. In a new terminal, start the development server:
   ```bash
   npm run dev
   ```

3. Start the scraper service:
   ```bash
   npm run scrape
   ```

The application will be available at http://localhost:3000

## Architecture

### Database
- MongoDB for storing alerts and vector embeddings
- Local embedding generation using Transformers.js
- Geospatial indexing for location-based queries

### Web Scraping
- Automated scraping of emergency services websites
- Configurable sources in `src/lib/scraper.js`
- Scheduled updates via API endpoint

### API Routes
- `/api/alerts`: CRUD operations for alerts
- `/api/query`: Vector similarity search with location awareness
- `/api/scheduler`: Controls the web scraper service

## APIs and AI Components

### APIs Used
- Mapbox API: For map rendering and geocoding services
- MongoDB Atlas: Database and vector search capabilities
- Web Scraping APIs: For automated collection of emergency alerts

### AI/ML Components
- Transformers.js: Local embedding generation for semantic search
- Vector Similarity Search: Powered by MongoDB's vector search capabilities
- Natural Language Processing: Used for processing and understanding alert descriptions
- Semantic Search: Implemented using vector embeddings for intelligent alert querying
- Claude Sonnet assistant when coding 

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
