const { Pool } = require('pg');

// Check if we should use SQLite (no DATABASE_URL or force local)
const useSQLite = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';

if (useSQLite) {
  console.log('Using SQLite for local development');
  const sqlitePool = require('./database-sqlite');
  module.exports = sqlitePool;
} else {
  console.log('Using PostgreSQL database');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Supabase requires SSL
    ssl: { rejectUnauthorized: false },
    // Connection timeout settings
    connectionTimeoutMillis: 5000,
    // Add keepalive to prevent connection drops
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    // Limit pool size for development
    max: 10,
    idleTimeoutMillis: 30000,
    // Set statement timeout to prevent hanging queries
    statement_timeout: 10000
  });

  let connectionFailed = false;
  let sqliteFallback = null;

  // Test connection
  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
    connectionFailed = false;
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL error:', err.message);
    connectionFailed = true;

    // Don't exit in development, just log the error
    if (process.env.NODE_ENV === 'production') {
      process.exit(-1);
    }
  });

  // Graceful connection with retry and SQLite fallback
  const testConnection = async () => {
    try {
      const client = await pool.connect();
      console.log('PostgreSQL connection test successful');
      client.release();
      connectionFailed = false;
    } catch (err) {
      console.error('WARNING: PostgreSQL connection failed:', err.message);
      console.error('Falling back to SQLite for local development');
      connectionFailed = true;

      // Initialize SQLite fallback
      if (!sqliteFallback) {
        sqliteFallback = require('./database-sqlite');
      }
    }
  };

  // Test connection on startup
  testConnection();

  // Create wrapper that uses SQLite fallback if Postgres fails
  const poolWrapper = {
    query: async (...args) => {
      if (connectionFailed && sqliteFallback) {
        console.log('🔄 Using SQLite fallback');
        return sqliteFallback.query(...args);
      }

      try {
        return await pool.query(...args);
      } catch (error) {
        if (error.message.includes('timeout') || error.message.includes('terminated')) {
          console.error('WARNING: PostgreSQL query failed, using SQLite fallback');
          connectionFailed = true;

          if (!sqliteFallback) {
            sqliteFallback = require('./database-sqlite');
          }

          return sqliteFallback.query(...args);
        }
        throw error;
      }
    },

    connect: async () => {
      if (connectionFailed && sqliteFallback) {
        return sqliteFallback.connect();
      }

      try {
        return await pool.connect();
      } catch (error) {
        console.error('WARNING: PostgreSQL connect failed, using SQLite fallback');
        connectionFailed = true;

        if (!sqliteFallback) {
          sqliteFallback = require('./database-sqlite');
        }

        return sqliteFallback.connect();
      }
    },

    on: (event, callback) => pool.on(event, callback),
    end: () => pool.end()
  };

  module.exports = poolWrapper;
}

