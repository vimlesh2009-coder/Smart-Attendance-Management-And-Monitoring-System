const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
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
} = require('../validators/adminValidators');
const {
  getSessions, createSession, updateSession, setCurrentSession, getSessionById,
  getDepartments, getDepartmentById, createDepartment, updateDepartment, assignHOD,
  getSections, getSectionById, createSection, updateSection,
  getStudents, getStudentById, createStudent, updateStudent, deleteStudent,
  getFaculty, getFacultyById, createFaculty, updateFaculty, deleteFaculty,
  getSubjects, getSubjectById, createSubject, updateSubject,
  getAssignments, createAssignment, deleteAssignment,
  getTimetable, upsertTimetable, deleteTimetableDay,
  getFeeRecords, getFeeById, createFeeRecord, updateFeeRecord,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
  getAuditLogs, getDashboardStats,
  resetUserPassword, updateUserDetails, getAllUsers,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboardStats);

// ── Academic Sessions ─────────────────────────────────────────────────────────
router.route('/sessions')
  .get(getSessions)
  .post(sessionValidators, validate, createSession);

router.route('/sessions/:id')
  .get(getSessionById)
  .put(updateSession);

router.patch('/sessions/:id/set-current', setCurrentSession);

// ── Departments ────────────────────────────────────────────────────────────────
router.route('/departments')
  .get(getDepartments)
  .post(departmentValidators, validate, createDepartment);

router.route('/departments/:id')
  .get(getDepartmentById)
  .put(updateDepartment);

router.patch('/departments/:id/assign-hod', assignHOD);

// ── Sections ───────────────────────────────────────────────────────────────────
router.route('/sections')
  .get(getSections)
  .post(sectionValidators, validate, createSection);

router.route('/sections/:id')
  .get(getSectionById)
  .put(updateSection);

// ── Students ───────────────────────────────────────────────────────────────────
router.route('/students')
  .get(getStudents)
  .post(studentValidators, validate, createStudent);

router.route('/students/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

// ── Faculty ────────────────────────────────────────────────────────────────────
router.route('/faculty')
  .get(getFaculty)
  .post(facultyValidators, validate, createFaculty);

router.route('/faculty/:id')
  .get(getFacultyById)
  .put(updateFaculty)
  .delete(deleteFaculty);

// ── Subjects ───────────────────────────────────────────────────────────────────
router.route('/subjects')
  .get(getSubjects)
  .post(subjectValidators, validate, createSubject);

router.route('/subjects/:id')
  .get(getSubjectById)
  .put(updateSubject);

// ── Subject Assignments ────────────────────────────────────────────────────────
router.route('/assignments')
  .get(getAssignments)
  .post(assignmentValidators, validate, createAssignment);

router.delete('/assignments/:id', deleteAssignment);

// ── Timetable ──────────────────────────────────────────────────────────────────
router.route('/timetable')
  .get(getTimetable)
  .post(timetableValidators, validate, upsertTimetable);

router.delete('/timetable/:id', deleteTimetableDay);

// ── Fee Records ────────────────────────────────────────────────────────────────
router.route('/fees')
  .get(getFeeRecords)
  .post(feeRecordValidators, validate, createFeeRecord);

router.route('/fees/:id')
  .get(getFeeById)
  .put(updateFeeRecord);

// ── Announcements ──────────────────────────────────────────────────────────────
router.route('/announcements')
  .get(getAnnouncements)
  .post(announcementValidators, validate, createAnnouncement);

router.route('/announcements/:id')
  .put(updateAnnouncement)
  .delete(deleteAnnouncement);

// ── Calendar Events ────────────────────────────────────────────────────────────
router.route('/calendar')
  .get(getCalendarEvents)
  .post(calendarEventValidators, validate, createCalendarEvent);

router.route('/calendar/:id')
  .put(updateCalendarEvent)
  .delete(deleteCalendarEvent);

// ── Audit Logs ─────────────────────────────────────────────────────────────────
router.get('/audit-logs', getAuditLogs);

// ── User Management (password reset, details update) ──────────────────────────
router.get('/users', getAllUsers);
router.put('/users/:id/reset-password', resetUserPassword);
router.put('/users/:id/update-details', updateUserDetails);

module.exports = router;
