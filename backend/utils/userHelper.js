const pool = require('../config/database');

/**
 * Get user database ID from Firebase UID
 */
async function getUserIdFromUid(uid) {
  const result = await pool.query(
    'SELECT id FROM users WHERE uid = $1',
    [uid]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0].id;
}

module.exports = { getUserIdFromUid };

