import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { fmtDate } from '../../utils/helpers';
import { Users, UserCheck, Building2, BookOpen, GraduationCap, Bell, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminAPI.getDashboard,
  });

  if (isLoading) return <PageLoader />;
  if (error)     return <ErrorAlert message={error.message} onRetry={refetch} />;

  const d = data?.data || {};

  const stats = [
    { label: 'Students',    value: d.totalStudents,    icon: Users,          color: 'text-primary-600', bg: 'bg-primary-50',  to: '/admin/students' },
    { label: 'Faculty',     value: d.totalFaculty,     icon: UserCheck,      color: 'text-green-600',   bg: 'bg-green-50',    to: '/admin/faculty' },
    { label: 'Departments', value: d.totalDepartments, icon: Building2,      color: 'text-purple-600',  bg: 'bg-purple-50',   to: '/admin/departments' },
    { label: 'Subjects',    value: d.totalSubjects,    icon: BookOpen,       color: 'text-orange-600',  bg: 'bg-orange-50',   to: '/admin/subjects' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">
          {d.currentSession
            ? `Current session: ${d.currentSession.name}`
            : 'No active session — set one in Sessions'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} className="stat-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? 0}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-xs text-primary-600 mt-3 flex items-center gap-1">Manage <ArrowRight className="w-3 h-3" /></p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current session */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary-600" /> Active Session</h2>
            <Link to="/admin/sessions" className="text-xs text-primary-600 hover:underline flex items-center gap-1">Manage <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {d.currentSession ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold">{d.currentSession.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Year</span><span className="font-semibold">{d.currentSession.academicYear}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Semester</span><span className="font-semibold capitalize">{d.currentSession.semester}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">From</span><span className="font-semibold">{fmtDate(d.currentSession.startDate)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">To</span><span className="font-semibold">{fmtDate(d.currentSession.endDate)}</span></div>
            </div>
          ) : <p className="text-sm text-gray-400">No current session set.</p>}
        </div>

        {/* Recent announcements */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title flex items-center gap-2"><Bell className="w-4 h-4 text-primary-600" /> Recent Announcements</h2>
            <Link to="/admin/announcements" className="text-xs text-primary-600 hover:underline flex items-center gap-1">Manage <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {(d.recentAnnouncements || []).map((a, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm">
                <span className="font-medium text-gray-700 truncate flex-1 mr-2">{a.title}</span>
                <span className="text-xs text-gray-400 shrink-0">{fmtDate(a.publishedAt)}</span>
              </div>
            ))}
            {!d.recentAnnouncements?.length && <p className="text-sm text-gray-400">No announcements yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
