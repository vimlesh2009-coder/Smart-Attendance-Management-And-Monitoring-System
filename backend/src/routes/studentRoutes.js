const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyProfile,
  getMyTimetable,
  getMySubjects,
  getMyAttendance,
  getSubjectAttendance,
  whatIfAnalysis,
  getAttendanceTrends,
  getMyFees,
  getMyAnnouncements,
  getCalendar,
  getDashboard,
} = require('../controllers/studentController');

// All student routes require authentication + student role
router.use(protect, authorize('student'));

// ── Dashboard ──────────────────────────────────────────────────────────────────
// GET /api/student/dashboard
router.get('/dashboard', getDashboard);

// ── Profile ────────────────────────────────────────────────────────────────────
// GET /api/student/profile
router.get('/profile', getMyProfile);

// ── Academic ───────────────────────────────────────────────────────────────────
// GET /api/student/timetable?academicSession=<id>
router.get('/timetable', getMyTimetable);

// GET /api/student/subjects?academicSession=<id>
router.get('/subjects', getMySubjects);

// ── Attendance ─────────────────────────────────────────────────────────────────
// GET /api/student/attendance?academicSession=<id>
//     → Full session summary across all subjects (with risk indicators)
router.get('/attendance', getMyAttendance);

// GET /api/student/attendance/:subjectId?academicSession=<id>
//     → Detailed per-lecture history + analytics for one subject
router.get('/attendance/:subjectId', getSubjectAttendance);

// GET /api/student/attendance/:subjectId/whatif?attend=5&skip=3&academicSession=<id>
//     → What-if analysis (attend N more / skip N classes)
router.get('/attendance/:subjectId/whatif', whatIfAnalysis);

// GET /api/student/attendance/:subjectId/trend?groupBy=week|month&academicSession=<id>
//     → Weekly or monthly attendance trend
router.get('/attendance/:subjectId/trend', getAttendanceTrends);

// ── Fees ───────────────────────────────────────────────────────────────────────
// GET /api/student/fees?academicSession=<id>&feeType=<type>&status=<status>
router.get('/fees', getMyFees);

// ── Announcements ──────────────────────────────────────────────────────────────
// GET /api/student/announcements?page=1&limit=10
router.get('/announcements', getMyAnnouncements);

// ── Calendar ───────────────────────────────────────────────────────────────────
// GET /api/student/calendar?startDate=&endDate=&academicSession=<id>
router.get('/calendar', getCalendar);

module.exports = router;
