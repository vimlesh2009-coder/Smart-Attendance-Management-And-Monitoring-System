import api from './axios';

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== '') p.append(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),

  // Academic Sessions
  getSessions:       (p) => api.get(`/admin/sessions${qs(p)}`),
  getSessionById:    (id) => api.get(`/admin/sessions/${id}`),
  createSession:     (d) => api.post('/admin/sessions', d),
  updateSession:     (id, d) => api.put(`/admin/sessions/${id}`, d),
  setCurrentSession: (id) => api.patch(`/admin/sessions/${id}/set-current`),

  // Departments
  getDepartments:   (p) => api.get(`/admin/departments${qs(p)}`),
  getDepartmentById:(id) => api.get(`/admin/departments/${id}`),
  createDepartment: (d) => api.post('/admin/departments', d),
  updateDepartment: (id, d) => api.put(`/admin/departments/${id}`, d),
  assignHOD:        (id, d) => api.patch(`/admin/departments/${id}/assign-hod`, d),

  // Sections
  getSections:      (p) => api.get(`/admin/sections${qs(p)}`),
  getSectionById:   (id) => api.get(`/admin/sections/${id}`),
  createSection:    (d) => api.post('/admin/sections', d),
  updateSection:    (id, d) => api.put(`/admin/sections/${id}`, d),

  // Students
  getStudents:      (p) => api.get(`/admin/students${qs(p)}`),
  getStudentById:   (id) => api.get(`/admin/students/${id}`),
  createStudent:    (d) => api.post('/admin/students', d),
  updateStudent:    (id, d) => api.put(`/admin/students/${id}`, d),
  deleteStudent:    (id) => api.delete(`/admin/students/${id}`),

  // Faculty
  getFaculty:       (p) => api.get(`/admin/faculty${qs(p)}`),
  getFacultyById:   (id) => api.get(`/admin/faculty/${id}`),
  createFaculty:    (d) => api.post('/admin/faculty', d),
  updateFaculty:    (id, d) => api.put(`/admin/faculty/${id}`, d),
  deleteFaculty:    (id) => api.delete(`/admin/faculty/${id}`),

  // Subjects
  getSubjects:      (p) => api.get(`/admin/subjects${qs(p)}`),
  getSubjectById:   (id) => api.get(`/admin/subjects/${id}`),
  createSubject:    (d) => api.post('/admin/subjects', d),
  updateSubject:    (id, d) => api.put(`/admin/subjects/${id}`, d),

  // Assignments
  getAssignments:   (p) => api.get(`/admin/assignments${qs(p)}`),
  createAssignment: (d) => api.post('/admin/assignments', d),
  deleteAssignment: (id) => api.delete(`/admin/assignments/${id}`),

  // Timetable
  getTimetable:       (p) => api.get(`/admin/timetable${qs(p)}`),
  upsertTimetable:    (d) => api.post('/admin/timetable', d),
  deleteTimetableDay: (id) => api.delete(`/admin/timetable/${id}`),

  // Fees
  getFeeRecords:    (p) => api.get(`/admin/fees${qs(p)}`),
  getFeeById:       (id) => api.get(`/admin/fees/${id}`),
  createFeeRecord:  (d) => api.post('/admin/fees', d),
  updateFeeRecord:  (id, d) => api.put(`/admin/fees/${id}`, d),

  // Announcements
  getAnnouncements:   (p) => api.get(`/admin/announcements${qs(p)}`),
  createAnnouncement: (d) => api.post('/admin/announcements', d),
  updateAnnouncement: (id, d) => api.put(`/admin/announcements/${id}`, d),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),

  // Calendar
  getCalendarEvents:   (p) => api.get(`/admin/calendar${qs(p)}`),
  createCalendarEvent: (d) => api.post('/admin/calendar', d),
  updateCalendarEvent: (id, d) => api.put(`/admin/calendar/${id}`, d),
  deleteCalendarEvent: (id) => api.delete(`/admin/calendar/${id}`),

  // Audit
  getAuditLogs: (p) => api.get(`/admin/audit-logs${qs(p)}`),

  // User Management
  getAllUsers:        (p)      => api.get(`/admin/users${qs(p)}`),
  resetUserPassword: (id, d)  => api.put(`/admin/users/${id}/reset-password`, d),
  updateUserDetails: (id, d)  => api.put(`/admin/users/${id}/update-details`, d),
};
