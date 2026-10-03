import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { hodAPI } from '../../api/hod';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { SectionBarChart } from '../../components/charts/AttendanceChart';
import { Users, BookMarked, UserCheck, BookOpen, TrendingDown, ArrowRight } from 'lucide-react';
import { pctColor } from '../../utils/helpers';

export default function HodDashboard() {
  const dashQ  = useQuery({ queryKey: ['hod-dashboard'],  queryFn: () => hodAPI.getDashboard() });
  const lowQ   = useQuery({ queryKey: ['hod-low-quick'], queryFn: () => hodAPI.getLowAttendanceReport({ threshold: 75 }) });
  const summQ  = useQuery({ queryKey: ['hod-summary'],    queryFn: () => hodAPI.getAttendanceSummary() });

  if (dashQ.isLoading) return <PageLoader />;
  if (dashQ.error)     return <ErrorAlert message={dashQ.error.message} onRetry={dashQ.refetch} />;

  const d     = dashQ.data?.data   || {};
  const stats = d.stats            || {};
  const low   = lowQ.data?.data    || {};
  const summ  = summQ.data?.data   || [];

  // Build chart data from section summary
  const chartData = summ.map(s => ({
    name: `Sec ${s.section?.name}`,
    avgAttendancePct: parseFloat((s.subjects?.reduce((a,b) => a + b.avgAttendancePct, 0) / (s.subjects?.length || 1)).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">HOD Dashboard</h1>
        <p className="page-subtitle">{d.department?.name} · {d.currentSession?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Students', value:stats.totalStudents,  icon:Users,      color:'text-primary-600', bg:'bg-primary-50' },
          { label:'Faculty',        value:stats.totalFaculty,   icon:UserCheck,   color:'text-green-600',   bg:'bg-green-50' },
          { label:'Sections',       value:stats.totalSections,  icon:BookMarked,  color:'text-purple-600',  bg:'bg-purple-50' },
          { label:'Subjects',       value:stats.totalSubjects,  icon:BookOpen,    color:'text-orange-600',  bg:'bg-orange-50' },
        ].map(({ label, value, icon:Icon, color, bg }) => (
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
        {/* Section chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Section Attendance Overview</h2>
            <Link to="/hod/attendance" className="text-sm text-primary-600 hover:underline flex items-center gap-1">Full report <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {chartData.length > 0
            ? <SectionBarChart data={chartData} />
            : <p className="text-sm text-gray-400 text-center py-10">No attendance data yet</p>}
        </div>

        {/* Low attendance */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> Low Attendance
              {low.lowAttendanceCount > 0 && (
                <span className="badge badge-red ml-1">{low.lowAttendanceCount}</span>
              )}
            </h2>
            <Link to="/hod/low-attendance" className="text-sm text-primary-600 hover:underline flex items-center gap-1">Full list <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {lowQ.isLoading ? <p className="text-xs text-gray-400">Loading…</p> : (
            <div className="space-y-2">
              {(low.students || []).slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.enrollmentNo} · Sec {s.section?.name}</p>
                  </div>
                  <span className={`text-sm font-bold ${pctColor(s.overallPercentage, 75)}`}>{s.overallPercentage}%</span>
                </div>
              ))}
              {!low.students?.length && <p className="text-sm text-gray-400 text-center py-6">No low-attendance students 🎉</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
