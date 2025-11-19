const { body, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Validation rules for user registration (Firebase handles auth, we just create profile)
 */
const validateRegister = [
  body('uid').notEmpty().withMessage('UID is required'),
  body('email').isEmail().normalizeEmail(),
  body('name').trim().notEmpty().withMessage('Name is required'),
  handleValidationErrors
];

/**
 * Validation rules for route creation
 */
const validateRoute = [
  body('route_name').trim().notEmpty().withMessage('Route name is required'),
  body('distance').isFloat({ min: 0 }).withMessage('Distance must be a positive number'),
  body('waypoints').isArray({ min: 2 }).withMessage('At least 2 waypoints are required'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateRoute,
  handleValidationErrors
};

