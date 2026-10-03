import api from './axios';
const qs = (p) => { const s = new URLSearchParams(Object.fromEntries(Object.entries(p||{}).filter(([,v])=>v!==undefined&&v!==''))).toString(); return s?`?${s}`:''; };

export const hodAPI = {
  getProfile:                 ()         => api.get('/hod/profile'),
  getDashboard:               (p)        => api.get(`/hod/dashboard${qs(p)}`),
  getSections:                (p)        => api.get(`/hod/sections${qs(p)}`),
  getFaculty:                 (p)        => api.get(`/hod/faculty${qs(p)}`),
  getStudents:                (p)        => api.get(`/hod/students${qs(p)}`),
  getSubjects:                (p)        => api.get(`/hod/subjects${qs(p)}`),
  getAttendanceSummary:       (p)        => api.get(`/hod/attendance/summary${qs(p)}`),
  getSectionAttendanceDetail: (secId, p) => api.get(`/hod/attendance/section/${secId}${qs(p)}`),
  getLowAttendanceReport:     (p)        => api.get(`/hod/attendance/low${qs(p)}`),
  getDateRangeReport:         (p)        => api.get(`/hod/attendance/date-range${qs(p)}`),
  getSubjectAttendance:       (subId, p) => api.get(`/hod/attendance/subject/${subId}${qs(p)}`),
  getAnnouncements:           (p)        => api.get(`/hod/announcements${qs(p)}`),
};
