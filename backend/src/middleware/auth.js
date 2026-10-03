const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendUnauthorized, sendForbidden } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Protect route: verify JWT and attach user to req
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Accept token from Authorization header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendUnauthorized(res, 'No authentication token provided');
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendUnauthorized(res, 'Token has expired. Please log in again');
      }
      return sendUnauthorized(res, 'Invalid token');
    }

    // Fetch user
    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) {
      return sendUnauthorized(res, 'User no longer exists');
    }

    if (!user.isActive) {
      return sendUnauthorized(res, 'Your account has been deactivated');
    }

    // Check if password was changed after token was issued
    if (user.wasPasswordChangedAfter(decoded.iat)) {
      return sendUnauthorized(res, 'Password was recently changed. Please log in again');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return sendUnauthorized(res, 'Authentication failed');
  }
};

/**
 * Restrict access to specific roles
 * Usage: authorize('admin', 'hod')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      return sendForbidden(
        res,
        `Role '${req.user.role}' does not have access to this resource`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
