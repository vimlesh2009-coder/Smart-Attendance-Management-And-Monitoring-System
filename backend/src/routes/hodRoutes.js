const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyProfile,
  getDashboard,
  getDepartmentSections,
  getDepartmentFaculty,
  getDepartmentStudents,
  getAttendanceSummary,
  getSectionAttendanceDetail,
  getLowAttendanceReport,
  getDateRangeReport,
  getSubjectAttendanceSummary,
  getDeptAnnouncements,
  getDeptSubjects,
} = require('../controllers/hodController');

// All HOD routes require authentication + hod role
router.use(protect, authorize('hod'));

// ── Profile & Dashboard ────────────────────────────────────────────────────────
// GET /api/hod/profile
router.get('/profile', getMyProfile);

// GET /api/hod/dashboard?academicSession=<id>
router.get('/dashboard', getDashboard);

// ── Department Resources ───────────────────────────────────────────────────────
// GET /api/hod/sections?academicSession=<id>&year=<n>
router.get('/sections', getDepartmentSections);

// GET /api/hod/faculty?page=1&limit=20
router.get('/faculty', getDepartmentFaculty);

// GET /api/hod/students?section=<id>&year=<n>&academicSession=<id>
router.get('/students', getDepartmentStudents);

// GET /api/hod/subjects?year=<n>&semester=<n>
router.get('/subjects', getDeptSubjects);

// ── Attendance Reports ─────────────────────────────────────────────────────────

// GET /api/hod/attendance/summary?academicSession=<id>
//     → Section × Subject grid with average attendance %
router.get('/attendance/summary', getAttendanceSummary);

// GET /api/hod/attendance/low?academicSession=<id>&required=75&threshold=75
//     → All students in dept below threshold; worst first
router.get('/attendance/low', getLowAttendanceReport);

// GET /api/hod/attendance/date-range?startDate=&endDate=
//     → Day-by-day attendance counts across department
router.get('/attendance/date-range', getDateRangeReport);

// GET /api/hod/attendance/section/:sectionId?academicSession=<id>&required=75
//     → Per-student, per-subject matrix for one section
router.get('/attendance/section/:sectionId', getSectionAttendanceDetail);

// GET /api/hod/attendance/subject/:subjectId?academicSession=<id>
//     → Subject-level summary across all sections
router.get('/attendance/subject/:subjectId', getSubjectAttendanceSummary);

// ── Announcements ──────────────────────────────────────────────────────────────
// GET /api/hod/announcements?page=1&limit=10
router.get('/announcements', getDeptAnnouncements);

module.exports = router;
