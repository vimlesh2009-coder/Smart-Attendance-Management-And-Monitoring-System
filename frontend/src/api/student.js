import api from './axios';
const qs = (p) => { const s = new URLSearchParams(Object.fromEntries(Object.entries(p||{}).filter(([,v])=>v!==undefined&&v!==''))).toString(); return s?`?${s}`:''; };

export const studentAPI = {
  getDashboard:         ()          => api.get('/student/dashboard'),
  getProfile:           ()          => api.get('/student/profile'),
  getTimetable:         (p)         => api.get(`/student/timetable${qs(p)}`),
  getSubjects:          (p)         => api.get(`/student/subjects${qs(p)}`),
  getAttendance:        (p)         => api.get(`/student/attendance${qs(p)}`),
  getSubjectAttendance: (subId, p)  => api.get(`/student/attendance/${subId}${qs(p)}`),
  getWhatIf:            (subId, p)  => api.get(`/student/attendance/${subId}/whatif${qs(p)}`),
  getTrend:             (subId, p)  => api.get(`/student/attendance/${subId}/trend${qs(p)}`),
  getFees:              (p)         => api.get(`/student/fees${qs(p)}`),
  getAnnouncements:     (p)         => api.get(`/student/announcements${qs(p)}`),
  getCalendar:          (p)         => api.get(`/student/calendar${qs(p)}`),
};
