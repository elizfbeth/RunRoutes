const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Security middleware configuration
 */

// Helmet configuration for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.googleapis.com", "https://*.gstatic.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com", "https://*.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Google Maps
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  frameguard: {
    action: 'deny'
  }
});

// Sanitize data to prevent MongoDB injection
// (also helps prevent NoSQL injection patterns in PostgreSQL)
const sanitizeData = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized potentially malicious input: ${key}`);
  }
});

// Custom XSS protection middleware
const xssProtection = (req, res, next) => {
  // Sanitize common XSS patterns
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// Request size limits
const requestLimits = {
  json: { limit: '10mb' }, // Adjust based on your needs
  urlencoded: { limit: '10mb', extended: true }
};

module.exports = {
  helmetConfig,
  sanitizeData,
  xssProtection,
  requestLimits
};

