import api from './axios';
const qs = (p) => { const s = new URLSearchParams(Object.fromEntries(Object.entries(p||{}).filter(([,v])=>v!==undefined&&v!==''))).toString(); return s?`?${s}`:''; };

export const facultyAPI = {
  getProfile:          ()      => api.get('/faculty/profile'),
  getAssignments:      (p)     => api.get(`/faculty/assignments${qs(p)}`),
  getTimetable:        (p)     => api.get(`/faculty/timetable${qs(p)}`),
  getSections:         (p)     => api.get(`/faculty/sections${qs(p)}`),
  getSectionStudents:  (secId) => api.get(`/faculty/sections/${secId}/students`),
  getAttendanceRecords:(p)     => api.get(`/faculty/attendance${qs(p)}`),
  getAttendanceDetail: (id)    => api.get(`/faculty/attendance/${id}`),
  markAttendance:      (d)     => api.post('/faculty/attendance', d),
  correctAttendance:   (id, d) => api.put(`/faculty/attendance/${id}/correct`, d),
};
