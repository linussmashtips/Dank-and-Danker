const { Pool } = require('pg');
require('dotenv').config();

// Local database setup for testing
const localDbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'dank_and_darker_test',
  password: 'password', // Change this to your local password
  port: 5432,
};

async function setupLocalDatabase() {
  console.log('🔧 Setting up local test database...');
  
  try {
    // Connect to PostgreSQL
    const pool = new Pool(localDbConfig);
    
    // Create test database if it doesn't exist
    try {
      await pool.query('CREATE DATABASE dank_and_darker_test');
      console.log('✅ Created test database');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('✅ Test database already exists');
      } else {
        throw error;
      }
    }
    
    // Close connection to test database
    await pool.end();
    
    // Connect to test database and run schema
    const testPool = new Pool({
      ...localDbConfig,
      database: 'dank_and_darker_test'
    });
    
    // Import and run the models init function
    const models = require('../src/db/models');
    
    // Temporarily override the pool
    const originalQuery = require('../src/db/connect').query;
    const testQuery = (text, params) => testPool.query(text, params);
    
    // Run database initialization
    await models.initDatabase();
    
    await testPool.end();
    
    console.log('✅ Local test database setup complete!');
    console.log('\n📝 To use local testing:');
    console.log('1. Update your .env file:');
    console.log('   DATABASE_URL=postgresql://postgres:password@localhost:5432/dank_and_darker_test');
    console.log('2. Run: npm test');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Tips:');
    console.log('- Make sure PostgreSQL is running locally');
    console.log('- Update the password in this file if needed');
    console.log('- Or use an online PostgreSQL service for testing');
  }
}

if (require.main === module) {
  setupLocalDatabase();
}

module.exports = setupLocalDatabase;
