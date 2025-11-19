const fs = require('fs');
const path = require('path');

/**
 * Security event logger
 * Logs security-related events to a dedicated log file
 */

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'security.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

/**
 * Format log entry
 */
const formatLogEntry = (level, eventType, details, req) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    eventType,
    ip: req?.ip || req?.connection?.remoteAddress || 'unknown',
    userAgent: req?.get('user-agent') || 'unknown',
    user: req?.user?.email || req?.user?.uid || 'anonymous',
    path: req?.path,
    method: req?.method,
    ...details
  };

  return JSON.stringify(entry) + '\n';
};

/**
 * Write log entry to file
 */
const writeLog = (entry) => {
  fs.appendFile(LOG_FILE, entry, (err) => {
    if (err) {
      console.error('Failed to write to security log:', err);
    }
  });
};

/**
 * Log security event
 */
const logSecurityEvent = (req, eventType, details = {}, level = LOG_LEVELS.INFO) => {
  const entry = formatLogEntry(level, eventType, details, req);
  writeLog(entry);

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY ${level}]`, eventType, details);
  }
};

/**
 * Middleware to log authentication attempts
 */
const logAuthAttempt = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Log after response is sent
    const statusCode = res.statusCode;
    
    if (req.path.includes('/auth/') || req.path.includes('/login')) {
      const level = statusCode >= 400 ? LOG_LEVELS.WARNING : LOG_LEVELS.INFO;
      const eventType = statusCode >= 400 ? 'AUTH_FAILED' : 'AUTH_SUCCESS';
      
      logSecurityEvent(req, eventType, {
        statusCode,
        endpoint: req.path
      }, level);
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log suspicious activity
 */
const logSuspiciousActivity = (req, res, next) => {
  // Check for common attack patterns
  const suspiciousPatterns = [
    /(\.\.|%2e%2e)/i, // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec(\s|\+)*(s|x)p\w+/i, // SQL execution
    /javascript:/i, // JavaScript injection
    /on\w+\s*=/i // Event handler injection
  ];

  const checkString = JSON.stringify({
    query: req.query,
    body: req.body,
    params: req.params
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', {
        pattern: pattern.toString(),
        payload: checkString.substring(0, 200) // Log first 200 chars only
      }, LOG_LEVELS.WARNING);
      break;
    }
  }

  next();
};

/**
 * Middleware to log rate limit violations
 */
const logRateLimitViolation = (req, res, next) => {
  if (res.statusCode === 429) {
    logSecurityEvent(req, 'RATE_LIMIT_EXCEEDED', {
      endpoint: req.path,
      limit: req.rateLimit?.limit,
      current: req.rateLimit?.current
    }, LOG_LEVELS.WARNING);
  }
  next();
};

module.exports = {
  logSecurityEvent,
  logAuthAttempt,
  logSuspiciousActivity,
  logRateLimitViolation,
  LOG_LEVELS
};

