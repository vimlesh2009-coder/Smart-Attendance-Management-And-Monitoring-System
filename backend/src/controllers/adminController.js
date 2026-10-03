const User = require('../models/User');
const AcademicSession = require('../models/AcademicSession');
const Department = require('../models/Department');
const Section = require('../models/Section');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const SubjectAssignment = require('../models/SubjectAssignment');
const Timetable = require('../models/Timetable');
const FeeRecord = require('../models/FeeRecord');
const Announcement = require('../models/Announcement');
const CalendarEvent = require('../models/CalendarEvent');
const AuditLog = require('../models/AuditLog');
const { createAuditLog } = require('../middleware/auditLogger');
const {
  sendSuccess, sendCreated, sendError, sendNotFound, sendBadRequest, sendPaginated,
} = require('../utils/apiResponse');
const { getPagination, buildSort } = require('../utils/helpers');

// ═══════════════════════════════════════════════════════════════════════════════
// ACADEMIC SESSIONS
// ═══════════════════════════════════════════════════════════════════════════════

const getSessions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.isCurrent) filter.isCurrent = req.query.isCurrent === 'true';
    const [sessions, total] = await Promise.all([
      AcademicSession.find(filter).populate('createdBy', 'name').sort({ startDate: -1 }).skip(skip).limit(limit),
      AcademicSession.countDocuments(filter),
    ]);
    return sendPaginated(res, sessions, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

const createSession = async (req, res) => {
  try {
    const session = await AcademicSession.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({ action: 'SESSION_CREATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'AcademicSession', targetId: session._id, description: `Created session: ${session.name}`, ipAddress: req.ip });
    return sendCreated(res, session, 'Academic session created');
  } catch (err) { return sendError(res, err.message); }
};

const updateSession = async (req, res) => {
  try {
    const session = await AcademicSession.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!session) return sendNotFound(res, 'Academic session not found');
    await createAuditLog({ action: 'SESSION_UPDATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'AcademicSession', targetId: session._id, description: `Updated session: ${session.name}`, ipAddress: req.ip });
    return sendSuccess(res, session, 'Session updated');
  } catch (err) { return sendError(res, err.message); }
};

const setCurrentSession = async (req, res) => {
  try {
    // Unset all current sessions first
    await AcademicSession.updateMany({}, { isCurrent: false });
    const session = await AcademicSession.findByIdAndUpdate(req.params.id, { isCurrent: true }, { new: true });
    if (!session) return sendNotFound(res, 'Academic session not found');
    return sendSuccess(res, session, 'Current session updated');
  } catch (err) { return sendError(res, err.message); }
};

const getSessionById = async (req, res) => {
  try {
    const session = await AcademicSession.findById(req.params.id).populate('createdBy', 'name');
    if (!session) return sendNotFound(res, 'Session not found');
    return sendSuccess(res, session);
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const getDepartments = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.isActive) filter.isActive = req.query.isActive === 'true';
    const [depts, total] = await Promise.all([
      Department.find(filter).populate('hod', 'name email').populate('createdBy', 'name').sort({ name: 1 }).skip(skip).limit(limit),
      Department.countDocuments(filter),
    ]);
    return sendPaginated(res, depts, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

const getDepartmentById = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id).populate('hod', 'name email').populate('createdBy', 'name');
    if (!dept) return sendNotFound(res, 'Department not found');
    return sendSuccess(res, dept);
  } catch (err) { return sendError(res, err.message); }
};

const createDepartment = async (req, res) => {
  try {
    const dept = await Department.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({ action: 'DEPARTMENT_CREATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'Department', targetId: dept._id, description: `Created department: ${dept.name}`, ipAddress: req.ip });
    return sendCreated(res, dept, 'Department created');
  } catch (err) { return sendError(res, err.message); }
};

const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) return sendNotFound(res, 'Department not found');
    return sendSuccess(res, dept, 'Department updated');
  } catch (err) { return sendError(res, err.message); }
};

const assignHOD = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return sendBadRequest(res, 'userId is required');

    const user = await User.findById(userId);
    if (!user) return sendNotFound(res, 'User not found');
    if (!['hod', 'faculty'].includes(user.role)) return sendBadRequest(res, 'User must have hod or faculty role');

    // Ensure role is hod
    await User.findByIdAndUpdate(userId, { role: 'hod' });

    const dept = await Department.findByIdAndUpdate(req.params.id, { hod: userId }, { new: true }).populate('hod', 'name email');
    if (!dept) return sendNotFound(res, 'Department not found');

    return sendSuccess(res, dept, 'HOD assigned successfully');
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const getSections = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.year) filter.year = parseInt(req.query.year);
    const [sections, total] = await Promise.all([
      Section.find(filter).populate('department', 'name code').populate('academicSession', 'name academicYear').sort({ name: 1 }).skip(skip).limit(limit),
      Section.countDocuments(filter),
    ]);
    return sendPaginated(res, sections, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

const getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id).populate('department', 'name code').populate('academicSession', 'name').populate('classTeacher');
    if (!section) return sendNotFound(res, 'Section not found');
    return sendSuccess(res, section);
  } catch (err) { return sendError(res, err.message); }
};

const createSection = async (req, res) => {
  try {
    const section = await Section.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({ action: 'SECTION_CREATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'Section', targetId: section._id, description: `Created section`, ipAddress: req.ip });
    return sendCreated(res, section, 'Section created');
  } catch (err) { return sendError(res, err.message); }
};

const updateSection = async (req, res) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!section) return sendNotFound(res, 'Section not found');
    return sendSuccess(res, section, 'Section updated');
  } catch (err) { return sendError(res, err.message); }
};

// ─── PUT /api/admin/users/:id/reset-password ─────────────────────────────────
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return sendBadRequest(res, 'New password must be at least 6 characters');
    }
    const user = await User.findById(req.params.id);
    if (!user) return sendNotFound(res, 'User not found');

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    // Invalidate existing tokens
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      action: 'PASSWORD_CHANGE',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      targetModel: 'User',
      targetId: user._id,
      description: `Admin reset password for user: ${user.email}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, {}, `Password reset successfully for ${user.name}`);
  } catch (err) { return sendError(res, err.message); }
};

// ─── PUT /api/admin/users/:id/update-details ──────────────────────────────────
const updateUserDetails = async (req, res) => {
  try {
    const { name, email, phone, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return sendNotFound(res, 'User not found');

    if (name)   user.name   = name;
    if (email)  user.email  = email;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    await createAuditLog({
      action: 'USER_UPDATED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      targetModel: 'User', targetId: user._id,
      description: `Admin updated details for: ${user.email}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive }, 'User details updated');
  } catch (err) { return sendError(res, err.message); }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const [users, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return sendPaginated(res, users, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};



const getStudents = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.section) filter.section = req.query.section;
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('user', 'name email phone')
        .populate('department', 'name code')
        .populate('section', 'name year semester')
        .populate('academicSession', 'name academicYear')
        .sort({ 'rollNo': 1 }).skip(skip).limit(limit),
      Student.countDocuments(filter),
    ]);
    return sendPaginated(res, students, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email phone isActive')
      .populate('department', 'name code')
      .populate('section', 'name year semester')
      .populate('academicSession', 'name');
    if (!student) return sendNotFound(res, 'Student not found');
    return sendSuccess(res, student);
  } catch (err) { return sendError(res, err.message); }
};

const createStudent = async (req, res) => {
  try {
    const { name, email, password, phone, enrollmentNo, rollNo, department, section, academicSession, year, semester, dateOfBirth, gender, parentName, parentPhone, address } = req.body;

    // Create user account
    const user = await User.create({ name, email, password, phone, role: 'student' });

    // Create student profile
    const student = await Student.create({
      user: user._id, enrollmentNo, rollNo, department, section, academicSession,
      year, semester, dateOfBirth, gender, parentName, parentPhone, address,
    });

    const populated = await Student.findById(student._id)
      .populate('user', 'name email phone')
      .populate('department', 'name code')
      .populate('section', 'name');

    await createAuditLog({ action: 'STUDENT_CREATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'Student', targetId: student._id, description: `Created student: ${name} (${enrollmentNo})`, ipAddress: req.ip });

    return sendCreated(res, populated, 'Student created successfully');
  } catch (err) { return sendError(res, err.message); }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return sendNotFound(res, 'Student not found');
    // Delete user account + student profile
    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);
    await createAuditLog({ action: 'STUDENT_UPDATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'Student', targetId: req.params.id, description: `Deleted student`, ipAddress: req.ip });
    return sendSuccess(res, {}, 'Student deleted successfully');
  } catch (err) { return sendError(res, err.message); }
};

const updateStudent = async (req, res) => {
  try {
    const { name, phone, rollNo, section, year, semester, parentName, parentPhone, address, isActive, requiredAttendance } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) return sendNotFound(res, 'Student not found');

    // Update user fields
    if (name || phone !== undefined || isActive !== undefined) {
      await User.findByIdAndUpdate(student.user, { name, phone, isActive });
    }

    // Update student fields
    const updates = { rollNo, section, year, semester, parentName, parentPhone, address, requiredAttendance };
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
    await Student.findByIdAndUpdate(req.params.id, updates);

    const updated = await Student.findById(req.params.id).populate('user', 'name email phone').populate('section', 'name');
    await createAuditLog({ action: 'STUDENT_UPDATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'Student', targetId: student._id, ipAddress: req.ip });

    return sendSuccess(res, updated, 'Student updated');
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FACULTY
// ═══════════════════════════════════════════════════════════════════════════════

const getFaculty = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const [faculty, total] = await Promise.all([
      Faculty.find(filter)
        .populate('user', 'name email phone role')
        .populate('department', 'name code')
        .sort({ 'user.name': 1 }).skip(skip).limit(limit),
      Faculty.countDocuments(filter),
    ]);
    return sendPaginated(res, faculty, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('user', 'name email phone role')
      .populate('department', 'name code');
    if (!faculty) return sendNotFound(res, 'Faculty not found');
    return sendSuccess(res, faculty);
  } catch (err) { return sendError(res, err.message); }
};

const createFaculty = async (req, res) => {
  try {
    const { name, email, password, phone, employeeId, department, designation, qualification, specialization, joiningDate, role } = req.body;

    const userRole = role === 'hod' ? 'hod' : 'faculty';
    const user = await User.create({ name, email, password, phone, role: userRole });

    const faculty = await Faculty.create({
      user: user._id, employeeId, department, designation, qualification, specialization,
      joiningDate: new Date(joiningDate),
    });

    const populated = await Faculty.findById(faculty._id)
      .populate('user', 'name email phone')
      .populate('department', 'name code');

    await createAuditLog({ action: 'FACULTY_CREATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'Faculty', targetId: faculty._id, description: `Created faculty: ${name} (${employeeId})`, ipAddress: req.ip });

    return sendCreated(res, populated, 'Faculty created successfully');
  } catch (err) { return sendError(res, err.message); }
};

const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return sendNotFound(res, 'Faculty not found');
    await User.findByIdAndDelete(faculty.user);
    await Faculty.findByIdAndDelete(req.params.id);
    await createAuditLog({ action: 'FACULTY_UPDATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'Faculty', targetId: req.params.id, description: `Deleted faculty`, ipAddress: req.ip });
    return sendSuccess(res, {}, 'Faculty deleted successfully');
  } catch (err) { return sendError(res, err.message); }
};

const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return sendNotFound(res, 'Faculty not found');

    const { name, phone, designation, qualification, specialization, isActive } = req.body;

    if (name || phone !== undefined || isActive !== undefined) {
      await User.findByIdAndUpdate(faculty.user, { name, phone, isActive });
    }

    const updates = { designation, qualification, specialization };
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
    await Faculty.findByIdAndUpdate(req.params.id, updates);

    const updated = await Faculty.findById(req.params.id).populate('user', 'name email phone').populate('department', 'name code');
    await createAuditLog({ action: 'FACULTY_UPDATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'Faculty', targetId: faculty._id, ipAddress: req.ip });

    return sendSuccess(res, updated, 'Faculty updated');
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUBJECTS
// ═══════════════════════════════════════════════════════════════════════════════

const getSubjects = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.semester) filter.semester = parseInt(req.query.semester);
    if (req.query.type) filter.type = req.query.type;

    const [subjects, total] = await Promise.all([
      Subject.find(filter).populate('department', 'name code').sort({ name: 1 }).skip(skip).limit(limit),
      Subject.countDocuments(filter),
    ]);
    return sendPaginated(res, subjects, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('department', 'name code');
    if (!subject) return sendNotFound(res, 'Subject not found');
    return sendSuccess(res, subject);
  } catch (err) { return sendError(res, err.message); }
};

const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create({ ...req.body, createdBy: req.user._id });
    return sendCreated(res, subject, 'Subject created');
  } catch (err) { return sendError(res, err.message); }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return sendNotFound(res, 'Subject not found');
    return sendSuccess(res, subject, 'Subject updated');
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUBJECT ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const getAssignments = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.faculty) filter.faculty = req.query.faculty;
    if (req.query.section) filter.section = req.query.section;
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.department) filter.department = req.query.department;

    const [assignments, total] = await Promise.all([
      SubjectAssignment.find(filter)
        .populate({ path: 'faculty', populate: { path: 'user', select: 'name email' } })
        .populate('subject', 'name code type')
        .populate('section', 'name year semester')
        .populate('academicSession', 'name')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      SubjectAssignment.countDocuments(filter),
    ]);
    return sendPaginated(res, assignments, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

const createAssignment = async (req, res) => {
  try {
    const { faculty, subject, section, academicSession } = req.body;

    // Get department from section
    const sectionDoc = await Section.findById(section);
    if (!sectionDoc) return sendNotFound(res, 'Section not found');

    const assignment = await SubjectAssignment.create({
      faculty, subject, section, academicSession,
      department: sectionDoc.department,
      assignedBy: req.user._id,
    });

    const populated = await SubjectAssignment.findById(assignment._id)
      .populate({ path: 'faculty', populate: { path: 'user', select: 'name' } })
      .populate('subject', 'name code')
      .populate('section', 'name year');

    await createAuditLog({ action: 'SUBJECT_ASSIGNED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'SubjectAssignment', targetId: assignment._id, ipAddress: req.ip });

    return sendCreated(res, populated, 'Faculty assigned to subject');
  } catch (err) { return sendError(res, err.message); }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignment = await SubjectAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) return sendNotFound(res, 'Assignment not found');
    await createAuditLog({ action: 'SUBJECT_UNASSIGNED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'SubjectAssignment', targetId: assignment._id, ipAddress: req.ip });
    return sendSuccess(res, {}, 'Assignment removed');
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIMETABLE
// ═══════════════════════════════════════════════════════════════════════════════

const getTimetable = async (req, res) => {
  try {
    const filter = {};
    if (req.query.section) filter.section = req.query.section;
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.department) filter.department = req.query.department;

    const timetable = await Timetable.find(filter)
      .populate({ path: 'periods.subject', select: 'name code' })
      .populate({ path: 'periods.faculty', populate: { path: 'user', select: 'name' } })
      .populate('section', 'name year semester')
      .sort({ day: 1 });

    return sendSuccess(res, timetable);
  } catch (err) { return sendError(res, err.message); }
};

const upsertTimetable = async (req, res) => {
  try {
    const { section, academicSession, day, periods } = req.body;

    // Get department from section
    const sectionDoc = await Section.findById(section);
    if (!sectionDoc) return sendNotFound(res, 'Section not found');

    const timetable = await Timetable.findOneAndUpdate(
      { section, academicSession, day },
      { section, academicSession, day, periods, department: sectionDoc.department, createdBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate({ path: 'periods.subject', select: 'name code' })
      .populate({ path: 'periods.faculty', populate: { path: 'user', select: 'name' } });

    await createAuditLog({ action: 'TIMETABLE_CREATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'Timetable', targetId: timetable._id, ipAddress: req.ip });

    return sendCreated(res, timetable, 'Timetable saved');
  } catch (err) { return sendError(res, err.message); }
};

const deleteTimetableDay = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) return sendNotFound(res, 'Timetable entry not found');
    return sendSuccess(res, {}, 'Timetable entry deleted');
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FEE RECORDS
// ═══════════════════════════════════════════════════════════════════════════════

const getFeeRecords = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.feeType) filter.feeType = req.query.feeType;
    if (req.query.status) filter.status = req.query.status;

    const [fees, total] = await Promise.all([
      FeeRecord.find(filter)
        .populate({ path: 'student', populate: { path: 'user', select: 'name' }, select: 'enrollmentNo user' })
        .populate('academicSession', 'name')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      FeeRecord.countDocuments(filter),
    ]);
    return sendPaginated(res, fees, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

const getFeeById = async (req, res) => {
  try {
    const fee = await FeeRecord.findById(req.params.id)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('academicSession', 'name');
    if (!fee) return sendNotFound(res, 'Fee record not found');
    return sendSuccess(res, fee);
  } catch (err) { return sendError(res, err.message); }
};

const createFeeRecord = async (req, res) => {
  try {
    const fee = await FeeRecord.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({ action: 'FEE_CREATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'FeeRecord', targetId: fee._id, ipAddress: req.ip });
    return sendCreated(res, fee, 'Fee record created');
  } catch (err) { return sendError(res, err.message); }
};

const updateFeeRecord = async (req, res) => {
  try {
    const fee = await FeeRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    if (!fee) return sendNotFound(res, 'Fee record not found');
    await createAuditLog({ action: 'FEE_UPDATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'FeeRecord', targetId: fee._id, ipAddress: req.ip });
    return sendSuccess(res, fee, 'Fee record updated');
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const getAnnouncements = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.isPublished !== undefined) filter.isPublished = req.query.isPublished === 'true';

    const [announcements, total] = await Promise.all([
      Announcement.find(filter).populate('publishedBy', 'name role').sort({ publishedAt: -1 }).skip(skip).limit(limit),
      Announcement.countDocuments(filter),
    ]);
    return sendPaginated(res, announcements, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

const createAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.create({ ...req.body, publishedBy: req.user._id, publishedAt: new Date() });
    await createAuditLog({ action: 'ANNOUNCEMENT_CREATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'Announcement', targetId: announcement._id, description: `Created: ${announcement.title}`, ipAddress: req.ip });
    return sendCreated(res, announcement, 'Announcement created');
  } catch (err) { return sendError(res, err.message); }
};

const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!announcement) return sendNotFound(res, 'Announcement not found');
    return sendSuccess(res, announcement, 'Announcement updated');
  } catch (err) { return sendError(res, err.message); }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return sendNotFound(res, 'Announcement not found');
    return sendSuccess(res, {}, 'Announcement deleted');
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

const getCalendarEvents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.academicSession) filter.academicSession = req.query.academicSession;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.startDate && req.query.endDate) {
      filter.startDate = { $lte: new Date(req.query.endDate) };
      filter.endDate = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.isHoliday !== undefined) filter.isHoliday = req.query.isHoliday === 'true';

    const events = await CalendarEvent.find(filter).populate('createdBy', 'name').sort({ startDate: 1 });
    return sendSuccess(res, events);
  } catch (err) { return sendError(res, err.message); }
};

const createCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({ action: 'CALENDAR_EVENT_CREATED', performedBy: req.user._id, performedByRole: req.user.role, targetModel: 'CalendarEvent', targetId: event._id, description: `Created event: ${event.title}`, ipAddress: req.ip });
    return sendCreated(res, event, 'Calendar event created');
  } catch (err) { return sendError(res, err.message); }
};

const updateCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return sendNotFound(res, 'Calendar event not found');
    return sendSuccess(res, event, 'Event updated');
  } catch (err) { return sendError(res, err.message); }
};

const deleteCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!event) return sendNotFound(res, 'Calendar event not found');
    return sendSuccess(res, {}, 'Event deleted');
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════════════

const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.performedBy) filter.performedBy = req.query.performedBy;
    if (req.query.targetModel) filter.targetModel = req.query.targetModel;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).populate('performedBy', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ]);
    return sendPaginated(res, logs, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════════════════

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents, totalFaculty, totalDepartments,
      totalSubjects, currentSession, recentAnnouncements,
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Faculty.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      Subject.countDocuments({ isActive: true }),
      AcademicSession.findOne({ isCurrent: true }),
      Announcement.find({ isPublished: true }).sort({ publishedAt: -1 }).limit(5).select('title type publishedAt'),
    ]);

    return sendSuccess(res, {
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalSubjects,
      currentSession,
      recentAnnouncements,
    });
  } catch (err) { return sendError(res, err.message); }
};

module.exports = {
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
};
