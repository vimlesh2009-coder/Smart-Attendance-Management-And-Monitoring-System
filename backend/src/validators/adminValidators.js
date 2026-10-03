const { body, param, query } = require('express-validator');

// ─── Academic Session ────────────────────────────────────────────────────────
const sessionValidators = [
  body('name').trim().notEmpty().withMessage('Session name is required'),
  body('academicYear')
    .trim()
    .notEmpty().withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/).withMessage('Academic year must be YYYY-YYYY'),
  body('semester')
    .isIn(['odd', 'even']).withMessage('Semester must be odd or even'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid date'),
];

// ─── Department ──────────────────────────────────────────────────────────────
const departmentValidators = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('code')
    .trim()
    .notEmpty().withMessage('Department code is required')
    .isAlphanumeric().withMessage('Department code must be alphanumeric')
    .isLength({ max: 10 }).withMessage('Code cannot exceed 10 characters'),
];

// ─── Section ─────────────────────────────────────────────────────────────────
const sectionValidators = [
  body('name').trim().notEmpty().withMessage('Section name is required'),
  body('department').isMongoId().withMessage('Valid department ID is required'),
  body('academicSession').isMongoId().withMessage('Valid academic session ID is required'),
  body('year')
    .isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
  body('semester')
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
];

// ─── Student ─────────────────────────────────────────────────────────────────
const studentValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('enrollmentNo').trim().notEmpty().withMessage('Enrollment number is required'),
  body('department').isMongoId().withMessage('Valid department ID is required'),
  body('section').isMongoId().withMessage('Valid section ID is required'),
  body('academicSession').isMongoId().withMessage('Valid academic session ID is required'),
  body('year')
    .isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
  body('semester')
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
];

// ─── Faculty ─────────────────────────────────────────────────────────────────
const facultyValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('department').isMongoId().withMessage('Valid department ID is required'),
  body('designation')
    .isIn(['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Instructor', 'HOD'])
    .withMessage('Invalid designation'),
  body('joiningDate')
    .notEmpty().withMessage('Joining date is required')
    .isISO8601().withMessage('Joining date must be a valid date'),
];

// ─── Subject ─────────────────────────────────────────────────────────────────
const subjectValidators = [
  body('name').trim().notEmpty().withMessage('Subject name is required'),
  body('code').trim().notEmpty().withMessage('Subject code is required'),
  body('department').isMongoId().withMessage('Valid department ID is required'),
  body('type')
    .isIn(['theory', 'practical', 'elective', 'lab']).withMessage('Invalid subject type'),
  body('credits')
    .isFloat({ min: 0, max: 10 }).withMessage('Credits must be between 0 and 10'),
  body('year').isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
  body('semester').isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
];

// ─── Subject Assignment ───────────────────────────────────────────────────────
const assignmentValidators = [
  body('faculty').isMongoId().withMessage('Valid faculty ID is required'),
  body('subject').isMongoId().withMessage('Valid subject ID is required'),
  body('section').isMongoId().withMessage('Valid section ID is required'),
  body('academicSession').isMongoId().withMessage('Valid academic session ID is required'),
];

// ─── Timetable ────────────────────────────────────────────────────────────────
const timetableValidators = [
  body('section').isMongoId().withMessage('Valid section ID is required'),
  body('academicSession').isMongoId().withMessage('Valid academic session ID is required'),
  body('day')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
    .withMessage('Invalid day'),
  body('periods').isArray().withMessage('Periods must be an array'),
  body('periods.*.periodNumber').isInt({ min: 1 }).withMessage('Period number must be positive'),
  body('periods.*.startTime').notEmpty().withMessage('Start time is required'),
  body('periods.*.endTime').notEmpty().withMessage('End time is required'),
];

// ─── Fee Record ───────────────────────────────────────────────────────────────
const feeRecordValidators = [
  body('student').isMongoId().withMessage('Valid student ID is required'),
  body('academicSession').isMongoId().withMessage('Valid academic session ID is required'),
  body('feeType')
    .isIn(['tuition', 'examination', 'library', 'laboratory', 'hostel', 'transport', 'sports', 'miscellaneous'])
    .withMessage('Invalid fee type'),
  body('totalAmount')
    .isFloat({ min: 0 }).withMessage('Total amount must be non-negative'),
];

// ─── Announcement ─────────────────────────────────────────────────────────────
const announcementValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('type')
    .isIn(['general', 'academic', 'exam', 'holiday', 'fee', 'event', 'urgent'])
    .withMessage('Invalid announcement type'),
  body('targetAudience')
    .isIn(['all', 'students', 'faculty', 'department', 'section'])
    .withMessage('Invalid target audience'),
];

// ─── Calendar Event ────────────────────────────────────────────────────────────
const calendarEventValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type')
    .isIn(['holiday', 'exam', 'internal_exam', 'result', 'enrollment', 'fee_deadline', 'event', 'workshop', 'seminar', 'sports', 'cultural', 'working_day', 'other'])
    .withMessage('Invalid event type'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid date'),
];

module.exports = {
  sessionValidators,
  departmentValidators,
  sectionValidators,
  studentValidators,
  facultyValidators,
  subjectValidators,
  assignmentValidators,
  timetableValidators,
  feeRecordValidators,
  announcementValidators,
  calendarEventValidators,
};
