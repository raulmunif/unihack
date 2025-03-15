# Alert System

A real-time alert notification system built with Next.js that allows users to submit, view, and query alerts based on location and relevance.

## Features

- Submit new alerts with location data
- View alerts on an interactive map
- Search for alerts using natural language queries
- Get alerts near your current location
- AI-powered search and relevance ranking

## Required Services

To run this application, you'll need to sign up for the following services and obtain API keys:

### 1. DataStax Astra DB

This application uses DataStax Astra DB for database storage with vector search capabilities.

1. Sign up for a free account at [https://astra.datastax.com](https://astra.datastax.com)
2. Create a new database (the free tier is sufficient)
3. Create a collection called `alerts` in your database
4. Generate an application token with the "Database Administrator" role
5. Note your database ID, region, and application token

### 2. OpenAI API

The application uses OpenAI for embeddings and natural language processing.

1. Sign up for an account at [https://platform.openai.com](https://platform.openai.com)
2. Create an API key in the OpenAI dashboard
3. Note your API key

### 3. Mapbox API

Mapbox is used for the interactive map visualization.

1. Sign up for a free account at [https://www.mapbox.com](https://www.mapbox.com)
2. Create a new access token in the Mapbox dashboard
3. Note your public access token

### 4. Nominatim OpenStreetMap API

The application uses the free Nominatim OpenStreetMap API for geocoding. No signup is required, but be aware of the [usage policy](https://operations.osmfoundation.org/policies/nominatim/) which limits requests to 1 per second.

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
ASTRA_DB_ID=your_astra_db_id
ASTRA_DB_REGION=your_astra_db_region
ASTRA_DB_APPLICATION_TOKEN=your_astra_db_token
ASTRA_DB_NAMESPACE=your_astra_db_namespace
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_public_token
```

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
