const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

/**
 * Calculate attendance statistics for a student in a subject/session
 */
const calculateAttendanceStats = async (studentId, subjectId, sessionId) => {
  const records = await Attendance.find({
    'records.student': studentId,
    subject: subjectId,
    academicSession: sessionId,
  }).select('records date');

  let totalClasses = 0;
  let attendedClasses = 0;
  let absentClasses = 0;
  let lateClasses = 0;
  let excusedClasses = 0;

  records.forEach((attendance) => {
    const studentRecord = attendance.records.find(
      (r) => r.student.toString() === studentId.toString()
    );
    if (studentRecord) {
      totalClasses++;
      if (studentRecord.status === 'present') attendedClasses++;
      else if (studentRecord.status === 'absent') absentClasses++;
      else if (studentRecord.status === 'late') lateClasses++;
      else if (studentRecord.status === 'excused') excusedClasses++;
    }
  });

  const attendancePercentage =
    totalClasses > 0 ? parseFloat(((attendedClasses / totalClasses) * 100).toFixed(2)) : 0;

  return {
    totalClasses,
    attendedClasses,
    absentClasses,
    lateClasses,
    excusedClasses,
    attendancePercentage,
  };
};

/**
 * Calculate buffer (how far above/below required %)
 */
const calculateBuffer = (currentPercentage, requiredPercentage) => {
  return parseFloat((currentPercentage - requiredPercentage).toFixed(2));
};

/**
 * What-if analysis: if student attends next N classes, what would % be?
 */
const whatIfAttend = (totalClasses, attendedClasses, additionalClasses) => {
  if (additionalClasses < 0) return null;
  const newTotal = totalClasses + additionalClasses;
  const newAttended = attendedClasses + additionalClasses;
  const newPercentage =
    newTotal > 0 ? parseFloat(((newAttended / newTotal) * 100).toFixed(2)) : 0;
  return {
    additionalClasses,
    projectedTotal: newTotal,
    projectedAttended: newAttended,
    projectedPercentage: newPercentage,
  };
};

/**
 * What-if analysis: if student skips next N classes, what would % be?
 */
const whatIfAbsent = (totalClasses, attendedClasses, skipClasses) => {
  if (skipClasses < 0) return null;
  const newTotal = totalClasses + skipClasses;
  const newPercentage =
    newTotal > 0 ? parseFloat(((attendedClasses / newTotal) * 100).toFixed(2)) : 0;
  return {
    skipClasses,
    projectedTotal: newTotal,
    projectedAttended: attendedClasses,
    projectedPercentage: newPercentage,
  };
};

/**
 * How many consecutive classes must a student attend to reach target %?
 */
const classesRequiredToReach = (totalClasses, attendedClasses, targetPercentage) => {
  if (targetPercentage <= 0 || targetPercentage > 100) return 0;

  // current % already >= target
  const currentPercentage =
    totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
  if (currentPercentage >= targetPercentage) return 0;

  // Solve: (attended + x) / (total + x) >= target/100
  // attended + x >= (target/100) * (total + x)
  // attended + x >= (target/100)*total + (target/100)*x
  // x - (target/100)*x >= (target/100)*total - attended
  // x * (1 - target/100) >= (target/100)*total - attended
  // x >= [(target/100)*total - attended] / (1 - target/100)
  const t = targetPercentage / 100;
  if (t >= 1) return Infinity; // 100% target, impossible if any absent

  const numerator = t * totalClasses - attendedClasses;
  if (numerator <= 0) return 0;

  const classesNeeded = Math.ceil(numerator / (1 - t));
  return classesNeeded;
};

/**
 * How many classes can a student skip and still remain at/above target %?
 */
const classesCanSkip = (totalClasses, attendedClasses, targetPercentage) => {
  if (targetPercentage <= 0) return Infinity;

  // Solve: attended / (total + x) >= target/100
  // attended >= (target/100) * (total + x)
  // attended >= (target/100)*total + (target/100)*x
  // attended - (target/100)*total >= (target/100)*x
  // x <= [attended - (target/100)*total] / (target/100)
  const t = targetPercentage / 100;
  if (t <= 0) return Infinity;

  const numerator = attendedClasses - t * totalClasses;
  if (numerator <= 0) return 0;

  return Math.floor(numerator / t);
};

/**
 * Shortage risk categories based on buffer
 */
const getShortageRisk = (percentage, requiredPercentage) => {
  const buffer = percentage - requiredPercentage;

  if (percentage === 0 && requiredPercentage > 0) return 'critical';
  if (buffer < 0) return 'shortage'; // already below required
  if (buffer < 5) return 'critical'; // within 5% of required
  if (buffer < 10) return 'warning'; // within 10%
  if (buffer < 20) return 'moderate'; // within 20%
  return 'safe';
};

/**
 * Get attendance trend for a student in a subject (monthly/weekly)
 */
const getAttendanceTrend = async (studentId, subjectId, sessionId, groupBy = 'week') => {
  const records = await Attendance.find({
    'records.student': studentId,
    subject: subjectId,
    academicSession: sessionId,
  })
    .sort({ date: 1 })
    .select('date records');

  const groups = {};

  records.forEach((attendance) => {
    const studentRecord = attendance.records.find(
      (r) => r.student.toString() === studentId.toString()
    );
    if (!studentRecord) return;

    const date = new Date(attendance.date);
    let key;

    if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // week: use ISO week number
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const weekNo = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      key = `${date.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }

    if (!groups[key]) {
      groups[key] = { total: 0, attended: 0, period: key };
    }
    groups[key].total++;
    if (studentRecord.status === 'present' || studentRecord.status === 'late') {
      groups[key].attended++;
    }
  });

  return Object.values(groups).map((g) => ({
    period: g.period,
    totalClasses: g.total,
    attendedClasses: g.attended,
    percentage:
      g.total > 0 ? parseFloat(((g.attended / g.total) * 100).toFixed(2)) : 0,
  }));
};

/**
 * Get full attendance summary for a student across all subjects in a session
 */
const getStudentSessionSummary = async (studentId, sessionId, requiredPercentage = 75) => {
  // Get all unique subjects for this student in the session
  const attendanceRecords = await Attendance.find({
    'records.student': studentId,
    academicSession: sessionId,
  })
    .populate('subject', 'name code type credits')
    .select('subject date records');

  // Group by subject
  const subjectMap = {};
  attendanceRecords.forEach((record) => {
    const subjectKey = record.subject._id.toString();
    if (!subjectMap[subjectKey]) {
      subjectMap[subjectKey] = {
        subject: record.subject,
        total: 0,
        attended: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };
    }
    const studentRecord = record.records.find(
      (r) => r.student.toString() === studentId.toString()
    );
    if (studentRecord) {
      subjectMap[subjectKey].total++;
      if (studentRecord.status === 'present') subjectMap[subjectKey].attended++;
      else if (studentRecord.status === 'absent') subjectMap[subjectKey].absent++;
      else if (studentRecord.status === 'late') subjectMap[subjectKey].late++;
      else if (studentRecord.status === 'excused') subjectMap[subjectKey].excused++;
    }
  });

  return Object.values(subjectMap).map((s) => {
    const percentage =
      s.total > 0 ? parseFloat(((s.attended / s.total) * 100).toFixed(2)) : 0;
    const buffer = calculateBuffer(percentage, requiredPercentage);
    const risk = getShortageRisk(percentage, requiredPercentage);
    const required = classesRequiredToReach(s.total, s.attended, requiredPercentage);
    const canSkip = classesCanSkip(s.total, s.attended, requiredPercentage);

    return {
      subject: s.subject,
      totalClasses: s.total,
      attendedClasses: s.attended,
      absentClasses: s.absent,
      lateClasses: s.late,
      excusedClasses: s.excused,
      attendancePercentage: percentage,
      buffer,
      risk,
      classesRequiredToReach: required,
      classesCanSkip: canSkip,
    };
  });
};

/**
 * Section-level attendance summary for a subject
 */
const getSectionSubjectSummary = async (subjectId, sectionId, sessionId) => {
  const records = await Attendance.find({
    subject: subjectId,
    section: sectionId,
    academicSession: sessionId,
  }).select('date records presentCount totalStudents');

  if (records.length === 0) return null;

  const totalLectures = records.length;
  const avgPresent =
    records.reduce((sum, r) => sum + r.presentCount, 0) / totalLectures;
  const avgTotal =
    records.reduce((sum, r) => sum + r.totalStudents, 0) / totalLectures;
  const avgPercentage =
    avgTotal > 0 ? parseFloat(((avgPresent / avgTotal) * 100).toFixed(2)) : 0;

  // Per student totals
  const studentStats = {};
  records.forEach((record) => {
    record.records.forEach((r) => {
      const key = r.student.toString();
      if (!studentStats[key]) studentStats[key] = { total: 0, attended: 0 };
      studentStats[key].total++;
      if (r.status === 'present' || r.status === 'late') studentStats[key].attended++;
    });
  });

  return {
    totalLectures,
    averageAttendancePercentage: avgPercentage,
    studentStats,
  };
};

module.exports = {
  calculateAttendanceStats,
  calculateBuffer,
  whatIfAttend,
  whatIfAbsent,
  classesRequiredToReach,
  classesCanSkip,
  getShortageRisk,
  getAttendanceTrend,
  getStudentSessionSummary,
  getSectionSubjectSummary,
};
