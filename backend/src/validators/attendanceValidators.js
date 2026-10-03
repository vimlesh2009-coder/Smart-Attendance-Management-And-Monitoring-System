const { body, param, query } = require('express-validator');

const markAttendanceValidators = [
  body('subject').isMongoId().withMessage('Valid subject ID is required'),
  body('section').isMongoId().withMessage('Valid section ID is required'),
  body('academicSession').isMongoId().withMessage('Valid academic session ID is required'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid date'),
  body('periodNumber')
    .isInt({ min: 1 }).withMessage('Period number must be a positive integer'),
  body('records')
    .isArray({ min: 1 }).withMessage('Records must be a non-empty array'),
  body('records.*.student')
    .isMongoId().withMessage('Each record must have a valid student ID'),
  body('records.*.status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Status must be present, absent, late, or excused'),
];

const correctAttendanceValidators = [
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('newStatus')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Status must be present, absent, late, or excused'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason for correction is required')
    .isLength({ max: 300 }).withMessage('Reason cannot exceed 300 characters'),
];

module.exports = { markAttendanceValidators, correctAttendanceValidators };
