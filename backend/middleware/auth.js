const firebaseConfig = require('../config/firebase');

/**
 * Middleware to authenticate Firebase tokens
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const admin = firebaseConfig.admin;
    
    // Check if Firebase is initialized
    if (!admin.apps.length) {
      return res.status(503).json({ 
        message: 'Authentication service not configured. Please set up Firebase credentials.' 
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };
