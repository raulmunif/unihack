import { getActiveAlerts as getDatastaxAlerts } from '../src/lib/datastax';
import { connectToDatabase, createAlert } from '../src/lib/mongodb';

async function migrateData() {
  try {
    console.log('Starting migration from DataStax to MongoDB...');
    
    // Get all alerts from DataStax
    console.log('Fetching alerts from DataStax...');
    const datastaxAlerts = await getDatastaxAlerts();
    console.log(`Found ${datastaxAlerts.length} alerts in DataStax`);
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectToDatabase();
    
    // Migrate each alert
    console.log('Migrating alerts...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const alert of datastaxAlerts) {
      try {
        // Create new alert in MongoDB
        // Remove DataStax specific fields and ID
        const { _id, embedding, ...alertData } = alert;
        
        await createAlert(alertData);
        successCount++;
        console.log(`Migrated alert: ${alert.title}`);
      } catch (error) {
        errorCount++;
        console.error(`Error migrating alert ${alert.title}:`, error.message);
      }
    }
    
    console.log('\nMigration completed:');
    console.log(`Successfully migrated: ${successCount} alerts`);
    console.log(`Failed to migrate: ${errorCount} alerts`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run migration
migrateData();