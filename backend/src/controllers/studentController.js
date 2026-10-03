const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');
const Announcement = require('../models/Announcement');
const CalendarEvent = require('../models/CalendarEvent');
const Attendance = require('../models/Attendance');
const SubjectAssignment = require('../models/SubjectAssignment');
const Timetable = require('../models/Timetable');
const AcademicSession = require('../models/AcademicSession');
const {
  sendSuccess, sendError, sendNotFound, sendBadRequest,
} = require('../utils/apiResponse');
const {
  getStudentSessionSummary,
  calculateAttendanceStats,
  whatIfAttend,
  whatIfAbsent,
  classesRequiredToReach,
  classesCanSkip,
  getShortageRisk,
  getAttendanceTrend,
} = require('../services/attendanceService');

// ─── Helper: get student doc from req.user ─────────────────────────────────
const getStudentDoc = async (userId) => {
  return Student.findOne({ user: userId })
    .populate('department', 'name code')
    .populate('section', 'name year semester')
    .populate('academicSession', 'name academicYear isCurrent');
};

// ─── GET /api/student/profile ─────────────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'name email phone lastLogin')
      .populate('department', 'name code')
      .populate('section', 'name year semester')
      .populate('academicSession', 'name academicYear isCurrent');
    if (!student) return sendNotFound(res, 'Student profile not found');
    return sendSuccess(res, student);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/student/timetable ───────────────────────────────────────────────
const getMyTimetable = async (req, res) => {
  try {
    const student = await getStudentDoc(req.user._id);
    if (!student) return sendNotFound(res, 'Student profile not found');

    const sessionId = req.query.academicSession || student.academicSession._id;

    const timetable = await Timetable.find({
      section: student.section._id,
      academicSession: sessionId,
      isActive: true,
    })
      .populate({ path: 'periods.subject', select: 'name code type' })
      .populate({ path: 'periods.faculty', populate: { path: 'user', select: 'name' } })
      .sort({ day: 1 });

    return sendSuccess(res, timetable);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/student/subjects ────────────────────────────────────────────────
const getMySubjects = async (req, res) => {
  try {
    const student = await getStudentDoc(req.user._id);
    if (!student) return sendNotFound(res, 'Student profile not found');

    const sessionId = req.query.academicSession || student.academicSession._id;

    const assignments = await SubjectAssignment.find({
      section: student.section._id,
      academicSession: sessionId,
      isActive: true,
    })
      .populate('subject', 'name code type credits weeklyLectures')
      .populate({ path: 'faculty', populate: { path: 'user', select: 'name' } });

    return sendSuccess(res, assignments);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/student/attendance ──────────────────────────────────────────────
// Full attendance summary across all subjects for current session
const getMyAttendance = async (req, res) => {
  try {
    const student = await getStudentDoc(req.user._id);
    if (!student) return sendNotFound(res, 'Student profile not found');

    const sessionId = req.query.academicSession || student.academicSession._id;
    const requiredPct = student.requiredAttendance
      || parseInt(process.env.DEFAULT_REQUIRED_ATTENDANCE)
      || 75;

    const summary = await getStudentSessionSummary(student._id, sessionId, requiredPct);

    // Overall aggregate
    const overall = summary.reduce(
      (acc, s) => {
        acc.totalClasses += s.totalClasses;
        acc.attendedClasses += s.attendedClasses;
        return acc;
      },
      { totalClasses: 0, attendedClasses: 0 }
    );
    overall.overallPercentage =
      overall.totalClasses > 0
        ? parseFloat(((overall.attendedClasses / overall.totalClasses) * 100).toFixed(2))
        : 0;
    overall.buffer = parseFloat((overall.overallPercentage - requiredPct).toFixed(2));
    overall.risk = getShortageRisk(overall.overallPercentage, requiredPct);

    return sendSuccess(res, { requiredPercentage: requiredPct, overall, subjectWise: summary });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/student/attendance/:subjectId ───────────────────────────────────
// Detailed attendance for one subject
const getSubjectAttendance = async (req, res) => {
  try {
    const student = await getStudentDoc(req.user._id);
    if (!student) return sendNotFound(res, 'Student profile not found');

    const sessionId = req.query.academicSession || student.academicSession._id;
    const { subjectId } = req.params;
    const requiredPct = student.requiredAttendance
      || parseInt(process.env.DEFAULT_REQUIRED_ATTENDANCE)
      || 75;

    const stats = await calculateAttendanceStats(student._id, subjectId, sessionId);

    // Fetch per-lecture history
    const lectureHistory = await Attendance.find({
      'records.student': student._id,
      subject: subjectId,
      academicSession: sessionId,
    })
      .select('date periodNumber startTime endTime topic lectureType presentCount totalStudents records')
      .sort({ date: 1 });

    const history = lectureHistory.map((lec) => {
      const record = lec.records.find(
        (r) => r.student.toString() === student._id.toString()
      );
      return {
        date: lec.date,
        periodNumber: lec.periodNumber,
        startTime: lec.startTime,
        endTime: lec.endTime,
        topic: lec.topic,
        lectureType: lec.lectureType,
        status: record ? record.status : 'absent',
        sectionPresent: lec.presentCount,
        sectionTotal: lec.totalStudents,
      };
    });

    const buffer = parseFloat((stats.attendancePercentage - requiredPct).toFixed(2));
    const risk = getShortageRisk(stats.attendancePercentage, requiredPct);
    const required = classesRequiredToReach(stats.totalClasses, stats.attendedClasses, requiredPct);
    const canSkip = classesCanSkip(stats.totalClasses, stats.attendedClasses, requiredPct);

    return sendSuccess(res, {
      stats,
      buffer,
      risk,
      requiredPercentage: requiredPct,
      classesRequiredToReach: required,
      classesCanSkip: canSkip,
      lectureHistory: history,
    });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/student/attendance/:subjectId/whatif ────────────────────────────
const whatIfAnalysis = async (req, res) => {
  try {
    const student = await getStudentDoc(req.user._id);
    if (!student) return sendNotFound(res, 'Student profile not found');

    const sessionId = req.query.academicSession || student.academicSession._id;
    const { subjectId } = req.params;
    const requiredPct = student.requiredAttendance
      || parseInt(process.env.DEFAULT_REQUIRED_ATTENDANCE)
      || 75;

    const stats = await calculateAttendanceStats(student._id, subjectId, sessionId);

    // What if I attend next N classes?
    const scenarios = [];
    for (let n = 0; n <= 20; n += (n < 5 ? 1 : 5)) {
      scenarios.push({
        ...whatIfAttend(stats.totalClasses, stats.attendedClasses, n),
        type: 'attend',
        risk: getShortageRisk(
          ((stats.attendedClasses + n) / (stats.totalClasses + n)) * 100,
          requiredPct
        ),
      });
    }

    // What if I skip next N classes?
    const skipScenarios = [];
    for (let n = 1; n <= 10; n++) {
      const proj = whatIfAbsent(stats.totalClasses, stats.attendedClasses, n);
      skipScenarios.push({
        ...proj,
        type: 'skip',
        risk: getShortageRisk(proj.projectedPercentage, requiredPct),
      });
    }

    // Custom: user-specified
    const customAttend = req.query.attend ? parseInt(req.query.attend) : null;
    const customSkip = req.query.skip ? parseInt(req.query.skip) : null;

    const customResult = {};
    if (customAttend !== null && customAttend >= 0) {
      customResult.attend = {
        ...whatIfAttend(stats.totalClasses, stats.attendedClasses, customAttend),
        risk: getShortageRisk(
          ((stats.attendedClasses + customAttend) / (stats.totalClasses + customAttend)) * 100,
          requiredPct
        ),
      };
    }
    if (customSkip !== null && customSkip >= 0) {
      customResult.skip = {
        ...whatIfAbsent(stats.totalClasses, stats.attendedClasses, customSkip),
        risk: getShortageRisk(
          (stats.attendedClasses / (stats.totalClasses + customSkip)) * 100,
          requiredPct
        ),
      };
    }

    return sendSuccess(res, {
      current: {
        totalClasses: stats.totalClasses,
        attendedClasses: stats.attendedClasses,
        currentPercentage: stats.attendancePercentage,
        requiredPercentage: requiredPct,
        classesRequiredToReach: classesRequiredToReach(stats.totalClasses, stats.attendedClasses, requiredPct),
        classesCanSkip: classesCanSkip(stats.totalClasses, stats.attendedClasses, requiredPct),
      },
      attendScenarios: scenarios,
      skipScenarios,
      custom: customResult,
    });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/student/attendance/:subjectId/trend ─────────────────────────────
const getAttendanceTrends = async (req, res) => {
  try {
    const student = await getStudentDoc(req.user._id);
    if (!student) return sendNotFound(res, 'Student profile not found');

    const sessionId = req.query.academicSession || student.academicSession._id;
    const { subjectId } = req.params;
    const groupBy = req.query.groupBy === 'month' ? 'month' : 'week';

    const trend = await getAttendanceTrend(student._id, subjectId, sessionId, groupBy);
    return sendSuccess(res, { groupBy, trend });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/student/fees ────────────────────────────────────────────────────
const getMyFees = async (req, res) => {
  try {
    const student = await getStudentDoc(req.user._id);
    if (!student) return sendNotFound(res, 'Student profile not found');

    const filter = { student: student._id };
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.feeType) filter.feeType = req.query.feeType;
    if (req.query.status) filter.status = req.query.status;

    const fees = await FeeRecord.find(filter)
      .populate('academicSession', 'name academicYear')
      .sort({ createdAt: -1 });

    // Summary
    const summary = fees.reduce(
      (acc, f) => {
        acc.totalAmount += f.totalAmount;
        acc.paidAmount += f.paidAmount;
        acc.discount += f.discount;
        acc.fine += f.fine;
        return acc;
      },
      { totalAmount: 0, paidAmount: 0, discount: 0, fine: 0 }
    );
    summary.balanceDue = Math.max(0, summary.totalAmount + summary.fine - summary.discount - summary.paidAmount);

    return sendSuccess(res, { summary, records: fees });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/student/announcements ──────────────────────────────────────────
const getMyAnnouncements = async (req, res) => {
  try {
    const student = await getStudentDoc(req.user._id);
    if (!student) return sendNotFound(res, 'Student profile not found');

    const now = new Date();
    const filter = {
      isPublished: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      $and: [
        {
          $or: [
            { targetAudience: 'all' },
            { targetAudience: 'students' },
            {
              targetAudience: 'department',
              targetDepartments: student.department._id,
            },
            {
              targetAudience: 'section',
              targetSections: student.section._id,
            },
          ],
        },
      ],
    };

    const { page, limit, skip } = require('../utils/helpers').getPagination(req.query);
    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('publishedBy', 'name role')
        .sort({ publishedAt: -1 })
        .skip(skip).limit(limit),
      Announcement.countDocuments(filter),
    ]);

    return require('../utils/apiResponse').sendPaginated(res, announcements, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/student/calendar ───────────────────────────────────────────────
const getCalendar = async (req, res) => {
  try {
    const filter = { isPublished: true };
    if (req.query.startDate && req.query.endDate) {
      filter.startDate = { $lte: new Date(req.query.endDate) };
      filter.endDate = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;

    const events = await CalendarEvent.find(filter).sort({ startDate: 1 });
    return sendSuccess(res, events);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/student/dashboard ──────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const student = await getStudentDoc(req.user._id);
    if (!student) return sendNotFound(res, 'Student profile not found');

    const sessionId = student.academicSession._id;
    const requiredPct = student.requiredAttendance
      || parseInt(process.env.DEFAULT_REQUIRED_ATTENDANCE)
      || 75;

    const [summary, feeRecords, recentAnnouncements, upcomingEvents] = await Promise.all([
      getStudentSessionSummary(student._id, sessionId, requiredPct),
      FeeRecord.find({ student: student._id, academicSession: sessionId }),
      Announcement.find({ isPublished: true }).sort({ publishedAt: -1 }).limit(3).select('title type priority publishedAt'),
      CalendarEvent.find({
        startDate: { $gte: new Date() },
        isPublished: true,
      }).sort({ startDate: 1 }).limit(5).select('title type startDate endDate isHoliday'),
    ]);

    // Attendance overview
    const overall = summary.reduce(
      (acc, s) => { acc.totalClasses += s.totalClasses; acc.attendedClasses += s.attendedClasses; return acc; },
      { totalClasses: 0, attendedClasses: 0 }
    );
    overall.percentage = overall.totalClasses > 0
      ? parseFloat(((overall.attendedClasses / overall.totalClasses) * 100).toFixed(2)) : 0;

    // At-risk subjects
    const atRisk = summary.filter((s) => s.risk === 'shortage' || s.risk === 'critical');

    // Fee summary
    const feeSummary = feeRecords.reduce(
      (acc, f) => { acc.total += f.totalAmount; acc.paid += f.paidAmount; return acc; },
      { total: 0, paid: 0 }
    );
    feeSummary.balance = Math.max(0, feeSummary.total - feeSummary.paid);

    return sendSuccess(res, {
      student: {
        name: req.user.name,
        enrollmentNo: student.enrollmentNo,
        section: student.section,
        department: student.department,
        session: student.academicSession,
      },
      attendance: {
        ...overall,
        requiredPercentage: requiredPct,
        subjectCount: summary.length,
        atRiskCount: atRisk.length,
        atRiskSubjects: atRisk.map((s) => ({
          subject: s.subject,
          percentage: s.attendancePercentage,
          risk: s.risk,
          classesRequired: s.classesRequiredToReach,
        })),
      },
      fees: feeSummary,
      recentAnnouncements,
      upcomingEvents,
    });
  } catch (err) { return sendError(res, err.message); }
};

module.exports = {
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
};
