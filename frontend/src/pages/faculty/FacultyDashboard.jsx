import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { facultyAPI } from '../../api/faculty';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { fmtDate } from '../../utils/helpers';
import { BookOpen, Users, ClipboardList, Clock, ArrowRight, CheckCircle } from 'lucide-react';

export default function FacultyDashboard() {
  const profileQ = useQuery({ queryKey: ['faculty-profile'], queryFn: facultyAPI.getProfile });
  const assignQ  = useQuery({ queryKey: ['faculty-assignments'], queryFn: () => facultyAPI.getAssignments() });
  const recordsQ = useQuery({ queryKey: ['faculty-records-recent'], queryFn: () => facultyAPI.getAttendanceRecords({ limit: 5 }) });

  if (profileQ.isLoading) return <PageLoader />;
  if (profileQ.error) return <ErrorAlert message={profileQ.error.message} onRetry={profileQ.refetch} />;

  const profile     = profileQ.data?.data || {};
  const assignments = assignQ.data?.data || [];
  const records     = recordsQ.data?.data?.records || [];

  // Unique sections
  const sections = [...new Map(assignments.map(a => [a.section?._id, a.section])).values()].filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Welcome, {profile.user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">{profile.designation} · {profile.department?.name}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Subjects Assigned', value: assignments.length, icon: BookOpen,      color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Sections',          value: sections.length,    icon: Users,          color: 'text-green-600',   bg: 'bg-green-50' },
          { label: 'Lectures Marked',   value: recordsQ.data?.data?.total || 0, icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Employee ID',       value: profile.employeeId, icon: Clock,          color: 'text-orange-600',  bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assigned subjects */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="section-title">Assigned Subjects</h2>
            <Link to="/faculty/attendance" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Mark Attendance <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No assignments yet</p>
            ) : assignments.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.subject?.name}</p>
                  <p className="text-xs text-gray-500">{a.subject?.code} · Section {a.section?.name} · Year {a.section?.year}</p>
                </div>
                <span className="badge badge-blue">{a.subject?.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent attendance */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="section-title">Recent Attendance</h2>
            <Link to="/faculty/records" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              All records <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {records.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No attendance marked yet</p>
            ) : records.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{r.subject?.name}</p>
                  <p className="text-xs text-gray-500">{fmtDate(r.date)} · Period {r.periodNumber} · Sec {r.section?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{r.presentCount}/{r.totalStudents}</p>
                  <p className="text-xs text-gray-400">present</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
