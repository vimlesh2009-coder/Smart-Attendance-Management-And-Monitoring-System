const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Creates an audit log entry
 */
const createAuditLog = async ({
  action,
  performedBy,
  performedByRole,
  targetModel = null,
  targetId = null,
  description = '',
  changes = null,
  ipAddress = null,
  userAgent = null,
  status = 'success',
}) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      performedByRole,
      targetModel,
      targetId,
      description,
      changes,
      ipAddress,
      userAgent,
      status,
    });
  } catch (err) {
    // Audit log failures should never break main operation
    logger.error(`Audit log creation failed: ${err.message}`);
  }
};

/**
 * Express middleware factory for automatic audit logging on routes
 */
const auditMiddleware = (action, getDescription = null) => {
  return (req, res, next) => {
    // Capture original json to intercept response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only log on success responses
      if (res.statusCode < 400 && req.user) {
        const description =
          typeof getDescription === 'function'
            ? getDescription(req, body)
            : `${action} by ${req.user.role}`;

        createAuditLog({
          action,
          performedBy: req.user._id,
          performedByRole: req.user.role,
          description,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'],
          status: 'success',
        });
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = { createAuditLog, auditMiddleware };
