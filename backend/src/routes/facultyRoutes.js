const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { markAttendanceValidators, correctAttendanceValidators } = require('../validators/attendanceValidators');
const {
  getMyProfile,
  getMyAssignments,
  getMyTimetable,
  getMySections,
  getSectionStudents,
  markAttendance,
  correctAttendance,
  getMyAttendanceRecords,
  getAttendanceDetail,
} = require('../controllers/facultyController');

// All faculty routes require authentication + faculty or hod role
router.use(protect, authorize('faculty', 'hod'));

// ── Profile ────────────────────────────────────────────────────────────────────
router.get('/profile', getMyProfile);

// ── Assignments ────────────────────────────────────────────────────────────────
// GET /api/faculty/assignments?academicSession=<id>
router.get('/assignments', getMyAssignments);

// ── Timetable ──────────────────────────────────────────────────────────────────
// GET /api/faculty/timetable?academicSession=<id>&section=<id>
router.get('/timetable', getMyTimetable);

// ── Sections & Students ────────────────────────────────────────────────────────
// GET /api/faculty/sections?academicSession=<id>
router.get('/sections', getMySections);

// GET /api/faculty/sections/:sectionId/students
router.get('/sections/:sectionId/students', getSectionStudents);

// ── Attendance ─────────────────────────────────────────────────────────────────
// GET  /api/faculty/attendance?subject=&section=&date=&startDate=&endDate=&academicSession=
router.get('/attendance', getMyAttendanceRecords);

// GET  /api/faculty/attendance/:id  — full detail with student records
router.get('/attendance/:id', getAttendanceDetail);

// POST /api/faculty/attendance  — mark new attendance
router.post('/attendance', markAttendanceValidators, validate, markAttendance);

// PUT  /api/faculty/attendance/:attendanceId/correct  — correct a student's status
router.put(
  '/attendance/:attendanceId/correct',
  correctAttendanceValidators,
  validate,
  correctAttendance
);

module.exports = router;
