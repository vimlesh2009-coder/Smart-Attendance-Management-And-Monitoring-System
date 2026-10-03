const { validationResult } = require('express-validator');
const { sendBadRequest } = require('../utils/apiResponse');

/**
 * Runs after express-validator checks — collects errors and returns 400 if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return sendBadRequest(res, 'Validation failed', formatted);
  }
  next();
};

module.exports = validate;
