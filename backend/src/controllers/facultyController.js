const Faculty = require('../models/Faculty');
const SubjectAssignment = require('../models/SubjectAssignment');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Section = require('../models/Section');
const { createAuditLog } = require('../middleware/auditLogger');
const {
  sendSuccess, sendCreated, sendError, sendNotFound, sendBadRequest, sendForbidden,
} = require('../utils/apiResponse');
const { getPagination } = require('../utils/helpers');

// ─── Helper: get faculty doc from req.user ────────────────────────────────────
const getFacultyDoc = async (userId) => {
  return Faculty.findOne({ user: userId });
};

// ─── GET /api/faculty/profile ─────────────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id })
      .populate('user', 'name email phone role lastLogin')
      .populate('department', 'name code');
    if (!faculty) return sendNotFound(res, 'Faculty profile not found');
    return sendSuccess(res, faculty);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/faculty/assignments ─────────────────────────────────────────────
const getMyAssignments = async (req, res) => {
  try {
    const faculty = await getFacultyDoc(req.user._id);
    if (!faculty) return sendNotFound(res, 'Faculty profile not found');

    const filter = { faculty: faculty._id, isActive: true };
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;

    const assignments = await SubjectAssignment.find(filter)
      .populate('subject', 'name code type credits weeklyLectures')
      .populate('section', 'name year semester')
      .populate('academicSession', 'name academicYear')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    return sendSuccess(res, assignments);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/faculty/timetable ───────────────────────────────────────────────
const getMyTimetable = async (req, res) => {
  try {
    const faculty = await getFacultyDoc(req.user._id);
    if (!faculty) return sendNotFound(res, 'Faculty profile not found');

    const filter = { 'periods.faculty': faculty._id };
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.section) filter.section = req.query.section;

    const timetable = await Timetable.find(filter)
      .populate({ path: 'periods.subject', select: 'name code' })
      .populate({ path: 'periods.faculty', populate: { path: 'user', select: 'name' } })
      .populate('section', 'name year semester')
      .populate('academicSession', 'name')
      .sort({ day: 1 });

    // Filter periods to only show this faculty's periods
    const filtered = timetable.map((tt) => ({
      ...tt.toObject(),
      periods: tt.periods.filter(
        (p) => p.faculty && p.faculty._id.toString() === faculty._id.toString()
      ),
    }));

    return sendSuccess(res, filtered);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/faculty/sections ────────────────────────────────────────────────
const getMySections = async (req, res) => {
  try {
    const faculty = await getFacultyDoc(req.user._id);
    if (!faculty) return sendNotFound(res, 'Faculty profile not found');

    const filter = { faculty: faculty._id, isActive: true };
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;

    const assignments = await SubjectAssignment.find(filter)
      .populate('section', 'name year semester maxStrength')
      .populate('academicSession', 'name');

    // Unique sections
    const sectionMap = {};
    assignments.forEach((a) => {
      const key = a.section._id.toString();
      if (!sectionMap[key]) sectionMap[key] = { section: a.section, session: a.academicSession };
    });

    return sendSuccess(res, Object.values(sectionMap));
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/faculty/sections/:sectionId/students ───────────────────────────
const getSectionStudents = async (req, res) => {
  try {
    const faculty = await getFacultyDoc(req.user._id);
    if (!faculty) return sendNotFound(res, 'Faculty profile not found');

    // Verify faculty has at least one assignment for this section
    const assignment = await SubjectAssignment.findOne({
      faculty: faculty._id,
      section: req.params.sectionId,
      isActive: true,
    });
    if (!assignment) return sendForbidden(res, 'You are not assigned to this section');

    const students = await Student.find({ section: req.params.sectionId, isActive: true })
      .populate('user', 'name email phone')
      .sort({ rollNo: 1 });

    return sendSuccess(res, students);
  } catch (err) { return sendError(res, err.message); }
};

// ─── POST /api/faculty/attendance ─────────────────────────────────────────────
const markAttendance = async (req, res) => {
  try {
    const faculty = await getFacultyDoc(req.user._id);
    if (!faculty) return sendNotFound(res, 'Faculty profile not found');

    const { subject, section, academicSession, date, periodNumber, lectureType, startTime, endTime, topic, records } = req.body;

    // Verify this faculty is assigned to this subject+section
    const assignment = await SubjectAssignment.findOne({
      faculty: faculty._id, subject, section, academicSession, isActive: true,
    });
    if (!assignment) return sendForbidden(res, 'You are not assigned to teach this subject for this section');

    // Get section's department
    const sectionDoc = await Section.findById(section);
    if (!sectionDoc) return sendNotFound(res, 'Section not found');

    // Check if attendance already marked for this period
    const existing = await Attendance.findOne({ subject, section, date: new Date(date), periodNumber, faculty: faculty._id });
    if (existing) return sendBadRequest(res, 'Attendance already marked for this period. Use the correction endpoint to update.');

    // Validate all students belong to this section
    const sectionStudentIds = (await Student.find({ section, isActive: true }).select('_id')).map((s) => s._id.toString());
    for (const r of records) {
      if (!sectionStudentIds.includes(r.student.toString())) {
        return sendBadRequest(res, `Student ${r.student} does not belong to section ${section}`);
      }
    }

    const attendance = await Attendance.create({
      subject, faculty: faculty._id, section,
      department: sectionDoc.department,
      academicSession, date: new Date(date),
      lectureType, periodNumber, startTime, endTime, topic,
      records: records.map((r) => ({
        student: r.student,
        status: r.status,
        markedBy: req.user._id,
        markedAt: new Date(),
      })),
      markedBy: req.user._id,
    });

    await createAuditLog({
      action: 'ATTENDANCE_MARKED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      targetModel: 'Attendance',
      targetId: attendance._id,
      description: `Marked attendance for ${records.length} students - Period ${periodNumber} on ${date}`,
      ipAddress: req.ip,
    });

    return sendCreated(res, {
      attendanceId: attendance._id,
      date: attendance.date,
      periodNumber: attendance.periodNumber,
      totalStudents: attendance.totalStudents,
      presentCount: attendance.presentCount,
      absentCount: attendance.absentCount,
    }, 'Attendance marked successfully');
  } catch (err) { return sendError(res, err.message); }
};

// ─── PUT /api/faculty/attendance/:attendanceId/correct ────────────────────────
const correctAttendance = async (req, res) => {
  try {
    const faculty = await getFacultyDoc(req.user._id);
    if (!faculty) return sendNotFound(res, 'Faculty profile not found');

    const { studentId, newStatus, reason } = req.body;

    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) return sendNotFound(res, 'Attendance record not found');

    // Only the faculty who marked it can correct (or admin)
    if (attendance.faculty.toString() !== faculty._id.toString()) {
      return sendForbidden(res, 'You can only correct attendance records you marked');
    }

    if (attendance.isLocked) {
      return sendBadRequest(res, 'This attendance record is locked and cannot be modified');
    }

    // Find student record
    const recordIndex = attendance.records.findIndex(
      (r) => r.student.toString() === studentId
    );
    if (recordIndex === -1) return sendNotFound(res, 'Student record not found in this attendance');

    const previousStatus = attendance.records[recordIndex].status;
    if (previousStatus === newStatus) return sendBadRequest(res, 'New status is same as current status');

    // Apply correction with audit trail
    attendance.records[recordIndex].correctionHistory.push({
      previousStatus,
      newStatus,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason,
    });
    attendance.records[recordIndex].status = newStatus;
    attendance.records[recordIndex].markedBy = req.user._id;
    attendance.records[recordIndex].markedAt = new Date();

    await attendance.save();

    await createAuditLog({
      action: 'ATTENDANCE_CORRECTED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      targetModel: 'Attendance',
      targetId: attendance._id,
      description: `Corrected attendance for student ${studentId}: ${previousStatus} → ${newStatus}. Reason: ${reason}`,
      changes: { student: studentId, from: previousStatus, to: newStatus, reason },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { previousStatus, newStatus, reason }, 'Attendance corrected successfully');
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/faculty/attendance ─────────────────────────────────────────────
const getMyAttendanceRecords = async (req, res) => {
  try {
    const faculty = await getFacultyDoc(req.user._id);
    if (!faculty) return sendNotFound(res, 'Faculty profile not found');

    const { page, limit, skip } = getPagination(req.query);
    const filter = { faculty: faculty._id };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.section) filter.section = req.query.section;
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.date) filter.date = new Date(req.query.date);
    if (req.query.startDate && req.query.endDate) {
      filter.date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('subject', 'name code')
        .populate('section', 'name year')
        .sort({ date: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(filter),
    ]);

    return sendSuccess(res, { records, total, page, limit });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/faculty/attendance/:id ──────────────────────────────────────────
const getAttendanceDetail = async (req, res) => {
  try {
    const faculty = await getFacultyDoc(req.user._id);
    if (!faculty) return sendNotFound(res, 'Faculty profile not found');

    const attendance = await Attendance.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('section', 'name year')
      .populate({ path: 'records.student', populate: { path: 'user', select: 'name' }, select: 'enrollmentNo rollNo user' })
      .populate('records.markedBy', 'name');

    if (!attendance) return sendNotFound(res, 'Attendance record not found');
    if (attendance.faculty.toString() !== faculty._id.toString()) return sendForbidden(res, 'Access denied');

    return sendSuccess(res, attendance);
  } catch (err) { return sendError(res, err.message); }
};

module.exports = {
  getMyProfile, getMyAssignments, getMyTimetable, getMySections,
  getSectionStudents, markAttendance, correctAttendance,
  getMyAttendanceRecords, getAttendanceDetail,
};
