const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
const { helmetConfig, sanitizeData, xssProtection, requestLimits } = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const { logAuthAttempt, logSuspiciousActivity } = require('./middleware/securityLogger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Apply security headers
app.use(helmetConfig);

// Enable trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Compress responses
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing with size limits
app.use(express.json(requestLimits.json));
app.use(express.urlencoded(requestLimits.urlencoded));

// Data sanitization
app.use(sanitizeData);
app.use(xssProtection);

// Security logging
app.use(logAuthAttempt);
app.use(logSuspiciousActivity);

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/favorites', require('./routes/favorites'));

// Health check (no rate limiting)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Run Routes API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ============================================
// ERROR HANDLING
// ============================================
// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// PORT CONFIGURATION
// ============================================
// Backend runs on PORT 5001
// Port 5000 is used by macOS Control Center (system process)
// Change this in .env file if needed: PORT=5001
// ============================================
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    console.error(`Try killing the process: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`Or change the port in .env file: PORT=5001`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

module.exports = app;

