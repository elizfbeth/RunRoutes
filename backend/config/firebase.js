const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let initialized = false;

// Lazy initialization function
function initializeFirebase() {
  if (initialized || admin.apps.length > 0) {
    return admin;
  }

  try {
    // Try to use service account file path first
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Resolve path relative to backend directory
      const filePath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        : path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      if (fs.existsSync(filePath)) {
        const serviceAccount = require(filePath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        initialized = true;
        console.log('Firebase Admin initialized with service account file');
      } else {
        throw new Error(`Firebase service account file not found: ${filePath}`);
      }
    }
    // Try to use service account from environment variable (JSON string)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Handle both quoted and unquoted JSON strings
      let jsonString = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      // Remove surrounding quotes if present
      if ((jsonString.startsWith('"') && jsonString.endsWith('"')) || 
          (jsonString.startsWith("'") && jsonString.endsWith("'"))) {
        jsonString = jsonString.slice(1, -1);
      }
      // Unescape escaped quotes
      jsonString = jsonString.replace(/\\"/g, '"').replace(/\\'/g, "'");
      const serviceAccount = JSON.parse(jsonString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      initialized = true;
      console.log('Firebase Admin initialized with service account');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Use default credentials (for Google Cloud environments)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      initialized = true;
      console.log('Firebase Admin initialized with project ID');
    } else {
      // In development, allow server to start but warn
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Firebase Admin not configured. Authentication endpoints will fail.');
        console.warn('   Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID in .env file');
        return admin; // Return admin object but don't initialize
      } else {
        throw new Error('Firebase configuration not found. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID');
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('⚠️  Error initializing Firebase Admin:', error.message);
      console.warn('   Server will start but authentication will not work');
      return admin;
    } else {
      console.error('Error initializing Firebase Admin:', error);
      throw error;
    }
  }

  return admin;
}

// Initialize immediately if credentials are available, otherwise lazy load
// Wrap in try-catch to prevent server crash if JSON is malformed
if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_PROJECT_ID) {
  try {
    initializeFirebase();
  } catch (error) {
    // Error already logged in initializeFirebase, just continue
    console.warn('Firebase initialization deferred - will initialize on first use');
  }
}

// Export both the admin object and the init function
module.exports = {
  get admin() {
    return initializeFirebase();
  },
  initialize: initializeFirebase
};

// For backward compatibility, also export admin directly
module.exports.default = module.exports.admin;

