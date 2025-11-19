const Database = require('better-sqlite3');
const path = require('path');

// Create SQLite database in backend directory
const dbPath = path.join(__dirname, '..', 'runroutes.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const initTables = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      profile_picture_url TEXT,
      preferences TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Routes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      route_name TEXT NOT NULL,
      distance REAL NOT NULL,
      estimated_time INTEGER,
      terrain_type TEXT,
      elevation_gain INTEGER DEFAULT 0,
      waypoints TEXT NOT NULL,
      visibility TEXT DEFAULT 'private',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Favorites table
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      route_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
      UNIQUE(user_id, route_id)
    )
  `);

  console.log('SQLite tables initialized');
};

// Initialize tables
initTables();

// Wrapper to make SQLite queries look like pg Pool queries
const sqlitePool = {
  query: (text, params = []) => {
    try {
      // Convert PostgreSQL placeholders ($1, $2) to SQLite placeholders (?)
      let convertedText = text;
      const paramCount = (text.match(/\$\d+/g) || []).length;

      if (paramCount > 0) {
        // Replace $1, $2, etc. with ?
        for (let i = paramCount; i >= 1; i--) {
          convertedText = convertedText.replace(new RegExp(`\\$${i}`, 'g'), '?');
        }
      }

      // Handle different query types
      if (convertedText.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = db.prepare(convertedText);
        const rows = stmt.all(...params);
        return Promise.resolve({ rows, rowCount: rows.length });
      } else if (convertedText.trim().toUpperCase().startsWith('INSERT')) {
        const stmt = db.prepare(convertedText);
        const info = stmt.run(...params);

        // For INSERT ... RETURNING *, fetch the inserted row
        if (text.toUpperCase().includes('RETURNING')) {
          const lastId = info.lastInsertRowid;
          const tableName = text.match(/INSERT INTO (\w+)/i)[1];
          const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
          const rows = [selectStmt.get(lastId)];
          return Promise.resolve({ rows, rowCount: 1 });
        }

        return Promise.resolve({ rows: [], rowCount: info.changes });
      } else if (convertedText.trim().toUpperCase().startsWith('UPDATE')) {
        const stmt = db.prepare(convertedText);
        const info = stmt.run(...params);

        // For UPDATE ... RETURNING *, fetch the updated row
        if (convertedText.toUpperCase().includes('RETURNING')) {
          // Extract WHERE clause to find the updated row
          const whereMatch = convertedText.match(/WHERE\s+id\s*=\s*\?/i);
          if (whereMatch) {
            // Find the parameter index for id by counting ? placeholders before WHERE
            const beforeWhere = convertedText.substring(0, convertedText.toUpperCase().indexOf('WHERE'));
            const paramsBeforeWhere = (beforeWhere.match(/\?/g) || []).length;
            const id = params[paramsBeforeWhere];
            const tableName = convertedText.match(/UPDATE (\w+)/i)[1];
            const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
            const rows = [selectStmt.get(id)];
            return Promise.resolve({ rows, rowCount: 1 });
          }
        }

        return Promise.resolve({ rows: [], rowCount: info.changes });
      } else if (convertedText.trim().toUpperCase().startsWith('DELETE')) {
        const stmt = db.prepare(convertedText);
        const info = stmt.run(...params);
        return Promise.resolve({ rows: [], rowCount: info.changes });
      } else {
        // Generic query
        const stmt = db.prepare(convertedText);
        const rows = stmt.all(...params);
        return Promise.resolve({ rows, rowCount: rows.length });
      }
    } catch (error) {
      console.error('SQLite query error:', error);
      console.error('Original Query:', text);
      console.error('Converted Query:', convertedText);
      console.error('Params:', params);
      return Promise.reject(error);
    }
  },

  connect: () => {
    // Return a mock client for compatibility
    return Promise.resolve({
      query: sqlitePool.query,
      release: () => {}
    });
  }
};

module.exports = sqlitePool;
