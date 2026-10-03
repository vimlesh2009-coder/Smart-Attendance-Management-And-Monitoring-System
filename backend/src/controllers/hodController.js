const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Section = require('../models/Section');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const SubjectAssignment = require('../models/SubjectAssignment');
const Attendance = require('../models/Attendance');
const AcademicSession = require('../models/AcademicSession');
const Announcement = require('../models/Announcement');
const {
  sendSuccess, sendError, sendNotFound, sendBadRequest, sendPaginated,
} = require('../utils/apiResponse');
const { getPagination } = require('../utils/helpers');
const {
  getShortageRisk,
  classesRequiredToReach,
  classesCanSkip,
} = require('../services/attendanceService');

// ─── Helper: resolve HOD's department ────────────────────────────────────────
const getHodDepartment = async (userId) => {
  const faculty = await Faculty.findOne({ user: userId }).populate('department');
  if (!faculty) return null;
  return faculty.department;
};

// ─── GET /api/hod/profile ─────────────────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id })
      .populate('user', 'name email phone role lastLogin')
      .populate('department', 'name code description');
    if (!faculty) return sendNotFound(res, 'HOD profile not found');
    return sendSuccess(res, faculty);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/dashboard ───────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const currentSession = await AcademicSession.findOne({ isCurrent: true });
    const sessionId = req.query.academicSession || currentSession?._id;

    const [totalStudents, totalFaculty, totalSections, totalSubjects] = await Promise.all([
      Student.countDocuments({ department: dept._id, isActive: true }),
      Faculty.countDocuments({ department: dept._id, isActive: true }),
      Section.countDocuments({ department: dept._id, ...(sessionId ? { academicSession: sessionId } : {}) }),
      Subject.countDocuments({ department: dept._id, isActive: true }),
    ]);

    // Overall attendance rate for today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.aggregate([
      { $match: { department: dept._id, date: { $gte: today, $lte: todayEnd } } },
      { $group: { _id: null, totalPresent: { $sum: '$presentCount' }, totalStudents: { $sum: '$totalStudents' } } },
    ]);

    const todayRate = todayAttendance.length > 0 && todayAttendance[0].totalStudents > 0
      ? parseFloat(((todayAttendance[0].totalPresent / todayAttendance[0].totalStudents) * 100).toFixed(2))
      : null;

    return sendSuccess(res, {
      department: dept,
      currentSession,
      stats: { totalStudents, totalFaculty, totalSections, totalSubjects },
      todayAttendanceRate: todayRate,
    });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/sections ────────────────────────────────────────────────────
const getDepartmentSections = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const filter = { department: dept._id };
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.year) filter.year = parseInt(req.query.year);

    const sections = await Section.find(filter)
      .populate('academicSession', 'name academicYear')
      .populate('classTeacher', 'employeeId')
      .sort({ year: 1, name: 1 });

    // Attach student count to each section
    const sectionsWithCount = await Promise.all(
      sections.map(async (sec) => {
        const count = await Student.countDocuments({ section: sec._id, isActive: true });
        return { ...sec.toObject(), studentCount: count };
      })
    );

    return sendSuccess(res, sectionsWithCount);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/faculty ─────────────────────────────────────────────────────
const getDepartmentFaculty = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const { page, limit, skip } = getPagination(req.query);
    const [faculty, total] = await Promise.all([
      Faculty.find({ department: dept._id, isActive: true })
        .populate('user', 'name email phone role')
        .sort({ designation: 1 }).skip(skip).limit(limit),
      Faculty.countDocuments({ department: dept._id, isActive: true }),
    ]);

    return sendPaginated(res, faculty, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/students ────────────────────────────────────────────────────
const getDepartmentStudents = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const { page, limit, skip } = getPagination(req.query);
    const filter = { department: dept._id, isActive: true };
    if (req.query.section) filter.section = req.query.section;
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('user', 'name email phone')
        .populate('section', 'name year semester')
        .sort({ rollNo: 1 }).skip(skip).limit(limit),
      Student.countDocuments(filter),
    ]);

    return sendPaginated(res, students, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/attendance/summary ─────────────────────────────────────────
// Department-wide attendance summary grouped by section + subject
const getAttendanceSummary = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const currentSession = await AcademicSession.findOne({ isCurrent: true });
    const sessionId = req.query.academicSession || currentSession?._id;
    if (!sessionId) return sendBadRequest(res, 'No active academic session found. Pass ?academicSession=<id>');

    // Aggregate attendance per section per subject
    const pipeline = [
      {
        $match: {
          department: dept._id,
          academicSession: new mongoose.Types.ObjectId(sessionId.toString()),
        },
      },
      {
        $group: {
          _id: { section: '$section', subject: '$subject' },
          totalLectures: { $sum: 1 },
          totalPresent: { $sum: '$presentCount' },
          totalStudents: { $avg: '$totalStudents' },
        },
      },
      {
        $lookup: { from: 'sections', localField: '_id.section', foreignField: '_id', as: 'section' },
      },
      {
        $lookup: { from: 'subjects', localField: '_id.subject', foreignField: '_id', as: 'subject' },
      },
      { $unwind: '$section' },
      { $unwind: '$subject' },
      {
        $project: {
          section: { _id: '$section._id', name: '$section.name', year: '$section.year', semester: '$section.semester' },
          subject: { _id: '$subject._id', name: '$subject.name', code: '$subject.code', type: '$subject.type' },
          totalLectures: 1,
          totalPresent: 1,
          avgStudents: { $round: ['$totalStudents', 0] },
          avgAttendancePct: {
            $cond: [
              { $gt: ['$totalStudents', 0] },
              { $round: [{ $multiply: [{ $divide: ['$totalPresent', { $multiply: ['$totalLectures', '$totalStudents'] }] }, 100] }, 2] },
              0,
            ],
          },
        },
      },
      { $sort: { 'section.year': 1, 'section.name': 1, 'subject.name': 1 } },
    ];

    const summary = await Attendance.aggregate(pipeline);

    // Group by section for cleaner response
    const bySectionMap = {};
    summary.forEach((item) => {
      const key = item.section._id.toString();
      if (!bySectionMap[key]) {
        bySectionMap[key] = { section: item.section, subjects: [] };
      }
      bySectionMap[key].subjects.push({
        subject: item.subject,
        totalLectures: item.totalLectures,
        avgAttendancePct: item.avgAttendancePct,
        avgStudents: item.avgStudents,
      });
    });

    return sendSuccess(res, Object.values(bySectionMap));
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/attendance/section/:sectionId ───────────────────────────────
// Per-student attendance for a section, all subjects
const getSectionAttendanceDetail = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const section = await Section.findOne({ _id: req.params.sectionId, department: dept._id });
    if (!section) return sendNotFound(res, 'Section not found in your department');

    const currentSession = await AcademicSession.findOne({ isCurrent: true });
    const sessionId = req.query.academicSession || currentSession?._id;
    const requiredPct = parseInt(req.query.required) || parseInt(process.env.DEFAULT_REQUIRED_ATTENDANCE) || 75;

    // Get all students in this section
    const students = await Student.find({ section: section._id, isActive: true })
      .populate('user', 'name')
      .sort({ rollNo: 1 });

    // Get all subjects taught in this section this session
    const assignments = await SubjectAssignment.find({
      section: section._id, academicSession: sessionId, isActive: true,
    }).populate('subject', 'name code type');

    const subjects = assignments.map((a) => a.subject);

    // For each student, compute per-subject attendance
    const studentRows = await Promise.all(
      students.map(async (student) => {
        const subjectStats = await Promise.all(
          subjects.map(async (sub) => {
            const records = await Attendance.find({
              subject: sub._id,
              section: section._id,
              academicSession: sessionId,
              'records.student': student._id,
            }).select('records');

            let total = 0, attended = 0;
            records.forEach((att) => {
              const r = att.records.find((x) => x.student.toString() === student._id.toString());
              if (r) {
                total++;
                if (r.status === 'present' || r.status === 'late') attended++;
              }
            });

            const pct = total > 0 ? parseFloat(((attended / total) * 100).toFixed(2)) : 0;
            return {
              subjectId: sub._id,
              subjectName: sub.name,
              subjectCode: sub.code,
              total,
              attended,
              percentage: pct,
              risk: getShortageRisk(pct, requiredPct),
              classesRequired: classesRequiredToReach(total, attended, requiredPct),
            };
          })
        );

        const totals = subjectStats.reduce(
          (acc, s) => { acc.total += s.total; acc.attended += s.attended; return acc; },
          { total: 0, attended: 0 }
        );
        const overallPct = totals.total > 0
          ? parseFloat(((totals.attended / totals.total) * 100).toFixed(2)) : 0;

        return {
          studentId: student._id,
          enrollmentNo: student.enrollmentNo,
          rollNo: student.rollNo,
          name: student.user.name,
          overallPercentage: overallPct,
          overallRisk: getShortageRisk(overallPct, requiredPct),
          subjects: subjectStats,
        };
      })
    );

    return sendSuccess(res, {
      section: { _id: section._id, name: section.name, year: section.year, semester: section.semester },
      requiredPercentage: requiredPct,
      subjects: subjects.map((s) => ({ _id: s._id, name: s.name, code: s.code })),
      students: studentRows,
    });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/attendance/low ──────────────────────────────────────────────
// Low-attendance report — students below required threshold
const getLowAttendanceReport = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const currentSession = await AcademicSession.findOne({ isCurrent: true });
    const sessionId = req.query.academicSession || currentSession?._id;
    if (!sessionId) return sendBadRequest(res, 'No active session. Pass ?academicSession=<id>');

    const requiredPct = parseInt(req.query.required) || parseInt(process.env.DEFAULT_REQUIRED_ATTENDANCE) || 75;
    const threshold = parseFloat(req.query.threshold) || requiredPct; // Can filter by custom threshold

    // Get all students in this department
    const students = await Student.find({ department: dept._id, isActive: true })
      .populate('user', 'name email')
      .populate('section', 'name year semester');

    // For each student, compute attendance across all subjects
    const lowAttendanceStudents = [];

    await Promise.all(
      students.map(async (student) => {
        // Get unique subjects for this student's section
        const assignments = await SubjectAssignment.find({
          section: student.section._id,
          academicSession: sessionId,
          isActive: true,
        }).select('subject');

        const shortageSubjects = [];
        let totalClasses = 0, totalAttended = 0;

        await Promise.all(
          assignments.map(async (assign) => {
            const records = await Attendance.find({
              subject: assign.subject,
              section: student.section._id,
              academicSession: sessionId,
              'records.student': student._id,
            }).select('records');

            let total = 0, attended = 0;
            records.forEach((att) => {
              const r = att.records.find((x) => x.student.toString() === student._id.toString());
              if (r) {
                total++;
                if (r.status === 'present' || r.status === 'late') attended++;
              }
            });

            totalClasses += total;
            totalAttended += attended;

            const pct = total > 0 ? parseFloat(((attended / total) * 100).toFixed(2)) : 0;
            if (pct < threshold) {
              shortageSubjects.push({
                subject: assign.subject,
                total,
                attended,
                percentage: pct,
                risk: getShortageRisk(pct, requiredPct),
                classesRequired: classesRequiredToReach(total, attended, requiredPct),
              });
            }
          })
        );

        const overallPct = totalClasses > 0
          ? parseFloat(((totalAttended / totalClasses) * 100).toFixed(2)) : 0;

        if (shortageSubjects.length > 0 || overallPct < threshold) {
          lowAttendanceStudents.push({
            studentId: student._id,
            enrollmentNo: student.enrollmentNo,
            rollNo: student.rollNo,
            name: student.user.name,
            email: student.user.email,
            section: student.section,
            overallPercentage: overallPct,
            overallRisk: getShortageRisk(overallPct, requiredPct),
            shortageSubjectCount: shortageSubjects.length,
            shortageSubjects,
          });
        }
      })
    );

    // Sort by overall percentage ascending (worst first)
    lowAttendanceStudents.sort((a, b) => a.overallPercentage - b.overallPercentage);

    return sendSuccess(res, {
      department: { _id: dept._id, name: dept.name, code: dept.code },
      requiredPercentage: requiredPct,
      threshold,
      totalStudentsChecked: students.length,
      lowAttendanceCount: lowAttendanceStudents.length,
      students: lowAttendanceStudents,
    });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/attendance/date-range ───────────────────────────────────────
// Attendance summary for a department over a date range
const getDateRangeReport = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return sendBadRequest(res, 'startDate and endDate are required');

    const pipeline = [
      {
        $match: {
          department: dept._id,
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, section: '$section' },
          totalPresent: { $sum: '$presentCount' },
          totalStudents: { $sum: '$totalStudents' },
          lectureCount: { $sum: 1 },
        },
      },
      {
        $project: {
          date: '$_id.date',
          section: '$_id.section',
          totalPresent: 1,
          totalStudents: 1,
          lectureCount: 1,
          attendancePct: {
            $cond: [
              { $gt: ['$totalStudents', 0] },
              { $round: [{ $multiply: [{ $divide: ['$totalPresent', '$totalStudents'] }, 100] }, 2] },
              0,
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ];

    const result = await Attendance.aggregate(pipeline);
    return sendSuccess(res, { startDate, endDate, records: result });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/attendance/subject/:subjectId ───────────────────────────────
// Subject-wise attendance across all sections in dept
const getSubjectAttendanceSummary = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const currentSession = await AcademicSession.findOne({ isCurrent: true });
    const sessionId = req.query.academicSession || currentSession?._id;

    const subjectDoc = await Subject.findOne({ _id: req.params.subjectId, department: dept._id });
    if (!subjectDoc) return sendNotFound(res, 'Subject not found in your department');

    const records = await Attendance.find({
      subject: subjectDoc._id,
      academicSession: sessionId,
    })
      .populate('section', 'name year semester')
      .select('section date presentCount totalStudents records');

    // Per-section aggregation
    const sectionMap = {};
    records.forEach((r) => {
      const key = r.section._id.toString();
      if (!sectionMap[key]) {
        sectionMap[key] = { section: r.section, lectures: 0, totalPresent: 0, totalStudents: 0 };
      }
      sectionMap[key].lectures++;
      sectionMap[key].totalPresent += r.presentCount;
      sectionMap[key].totalStudents += r.totalStudents;
    });

    const sectionStats = Object.values(sectionMap).map((s) => ({
      section: s.section,
      totalLectures: s.lectures,
      avgAttendancePct:
        s.totalStudents > 0
          ? parseFloat(((s.totalPresent / s.totalStudents) * 100).toFixed(2))
          : 0,
    }));

    return sendSuccess(res, {
      subject: { _id: subjectDoc._id, name: subjectDoc.name, code: subjectDoc.code },
      totalLectures: records.length,
      sectionStats,
    });
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/announcements ──────────────────────────────────────────────
const getDeptAnnouncements = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const now = new Date();
    const filter = {
      isPublished: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      $and: [{
        $or: [
          { targetAudience: 'all' },
          { targetAudience: 'department', targetDepartments: dept._id },
          { targetAudience: 'faculty' },
        ],
      }],
    };

    const { page, limit, skip } = getPagination(req.query);
    const [announcements, total] = await Promise.all([
      Announcement.find(filter).populate('publishedBy', 'name role').sort({ publishedAt: -1 }).skip(skip).limit(limit),
      Announcement.countDocuments(filter),
    ]);

    return sendPaginated(res, announcements, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/hod/subjects ────────────────────────────────────────────────────
const getDeptSubjects = async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return sendNotFound(res, 'Department not found for this HOD');

    const filter = { department: dept._id, isActive: true };
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.semester) filter.semester = parseInt(req.query.semester);

    const subjects = await Subject.find(filter).sort({ year: 1, semester: 1, name: 1 });
    return sendSuccess(res, subjects);
  } catch (err) { return sendError(res, err.message); }
};

module.exports = {
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
};
