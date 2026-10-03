import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/shared/ProtectedRoute';
import { Layout } from './components/shared/Layout';

// Auth
import Login from './pages/auth/Login';

// Student
import StudentDashboard        from './pages/student/StudentDashboard';
import StudentAttendance       from './pages/student/StudentAttendance';
import StudentAttendanceDetail from './pages/student/StudentAttendanceDetail';
import StudentTimetable        from './pages/student/StudentTimetable';
import StudentFees             from './pages/student/StudentFees';
import StudentAnnouncements    from './pages/student/StudentAnnouncements';
import StudentCalendar         from './pages/student/StudentCalendar';

// Faculty
import FacultyDashboard       from './pages/faculty/FacultyDashboard';
import FacultyMarkAttendance  from './pages/faculty/FacultyMarkAttendance';
import FacultyRecords         from './pages/faculty/FacultyRecords';
import FacultyTimetable       from './pages/faculty/FacultyTimetable';

// HOD
import HodDashboard      from './pages/hod/HodDashboard';
import HodAttendance     from './pages/hod/HodAttendance';
import HodSectionDetail  from './pages/hod/HodSectionDetail';
import HodLowAttendance  from './pages/hod/HodLowAttendance';
import HodSections       from './pages/hod/HodSections';
import HodFaculty        from './pages/hod/HodFaculty';
import HodStudents       from './pages/hod/HodStudents';
import HodAnnouncements  from './pages/hod/HodAnnouncements';

// Admin
import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminSessions      from './pages/admin/AdminSessions';
import AdminDepartments   from './pages/admin/AdminDepartments';
import AdminSections      from './pages/admin/AdminSections';
import AdminStudents      from './pages/admin/AdminStudents';
import AdminFaculty       from './pages/admin/AdminFaculty';
import AdminSubjects      from './pages/admin/AdminSubjects';
import AdminAssignments   from './pages/admin/AdminAssignments';
import AdminTimetable     from './pages/admin/AdminTimetable';
import AdminFees          from './pages/admin/AdminFees';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminCalendar      from './pages/admin/AdminCalendar';
import AdminAuditLogs     from './pages/admin/AdminAuditLogs';
import AdminUsers         from './pages/admin/AdminUsers';

const wrap = (roles, Page) => (
  <ProtectedRoute roles={roles}>
    <Layout><Page /></Layout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* ── Student ─────────────────────────────────────────────────── */}
      <Route path="/student/dashboard"              element={wrap(['student'], StudentDashboard)} />
      <Route path="/student/attendance"             element={wrap(['student'], StudentAttendance)} />
      <Route path="/student/attendance/:subjectId"  element={wrap(['student'], StudentAttendanceDetail)} />
      <Route path="/student/timetable"              element={wrap(['student'], StudentTimetable)} />
      <Route path="/student/fees"                   element={wrap(['student'], StudentFees)} />
      <Route path="/student/announcements"          element={wrap(['student'], StudentAnnouncements)} />
      <Route path="/student/calendar"               element={wrap(['student'], StudentCalendar)} />

      {/* ── Faculty ─────────────────────────────────────────────────── */}
      <Route path="/faculty/dashboard"   element={wrap(['faculty','hod'], FacultyDashboard)} />
      <Route path="/faculty/attendance"  element={wrap(['faculty','hod'], FacultyMarkAttendance)} />
      <Route path="/faculty/records"     element={wrap(['faculty','hod'], FacultyRecords)} />
      <Route path="/faculty/timetable"   element={wrap(['faculty','hod'], FacultyTimetable)} />

      {/* ── HOD ─────────────────────────────────────────────────────── */}
      <Route path="/hod/dashboard"                          element={wrap(['hod'], HodDashboard)} />
      <Route path="/hod/attendance"                         element={wrap(['hod'], HodAttendance)} />
      <Route path="/hod/attendance/section/:sectionId"      element={wrap(['hod'], HodSectionDetail)} />
      <Route path="/hod/low-attendance"                     element={wrap(['hod'], HodLowAttendance)} />
      <Route path="/hod/sections"                           element={wrap(['hod'], HodSections)} />
      <Route path="/hod/faculty"                            element={wrap(['hod'], HodFaculty)} />
      <Route path="/hod/students"                           element={wrap(['hod'], HodStudents)} />
      <Route path="/hod/announcements"                      element={wrap(['hod'], HodAnnouncements)} />

      {/* ── Admin ───────────────────────────────────────────────────── */}
      <Route path="/admin/dashboard"     element={wrap(['admin'], AdminDashboard)} />
      <Route path="/admin/sessions"      element={wrap(['admin'], AdminSessions)} />
      <Route path="/admin/departments"   element={wrap(['admin'], AdminDepartments)} />
      <Route path="/admin/sections"      element={wrap(['admin'], AdminSections)} />
      <Route path="/admin/students"      element={wrap(['admin'], AdminStudents)} />
      <Route path="/admin/faculty"       element={wrap(['admin'], AdminFaculty)} />
      <Route path="/admin/subjects"      element={wrap(['admin'], AdminSubjects)} />
      <Route path="/admin/assignments"   element={wrap(['admin'], AdminAssignments)} />
      <Route path="/admin/timetable"     element={wrap(['admin'], AdminTimetable)} />
      <Route path="/admin/fees"          element={wrap(['admin'], AdminFees)} />
      <Route path="/admin/announcements" element={wrap(['admin'], AdminAnnouncements)} />
      <Route path="/admin/calendar"      element={wrap(['admin'], AdminCalendar)} />
      <Route path="/admin/audit-logs"    element={wrap(['admin'], AdminAuditLogs)} />
      <Route path="/admin/users"         element={wrap(['admin'], AdminUsers)} />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  const homes = { admin:'/admin/dashboard', faculty:'/faculty/dashboard', hod:'/hod/dashboard', student:'/student/dashboard' };
  return <Navigate to={user ? (homes[user.role] || '/login') : '/login'} replace />;
}
