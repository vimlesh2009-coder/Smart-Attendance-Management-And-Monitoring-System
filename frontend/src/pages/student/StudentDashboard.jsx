import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../api/student';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { SubjectBarChart } from '../../components/charts/AttendanceChart';
import { riskColor, riskLabel, pctColor, fmtDate, currency } from '../../utils/helpers';
import {
  TrendingUp, AlertTriangle, CheckCircle, BookOpen,
  DollarSign, Bell, Calendar, ArrowRight, Clock,
} from 'lucide-react';

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary-600" />
      </div>
    </div>
  </div>
);

const RiskBadge = ({ risk }) => {
  const cls = {
    safe: 'bg-green-100 text-green-700', moderate: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700', critical: 'bg-orange-100 text-orange-700',
    shortage: 'bg-red-100 text-red-700',
  }[risk] || 'bg-gray-100 text-gray-600';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{riskLabel(risk)}</span>;
};

export default function StudentDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => studentAPI.getDashboard(),
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorAlert message={error.message} onRetry={refetch} />;

  const d = data?.data || {};
  const att = d.attendance || {};
  const fees = d.fees || {};
  const required = att.requiredPercentage || 75;
  const overall = att.percentage || 0;
  const buf = parseFloat((overall - required).toFixed(2));

  const chartData = (att.atRiskSubjects || []).map(s => ({
    name: s.subject?.code || s.subject?.name,
    percentage: s.percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Welcome back, {d.student?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">{d.student?.department?.name} · {d.student?.section?.name} · {d.student?.session?.name}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Attendance" value={`${overall}%`}
          sub={`${att.attendedClasses || 0} / ${att.totalClasses || 0} classes`}
          icon={TrendingUp} color={pctColor(overall, required)} />
        <StatCard label="Buffer" value={`${buf > 0 ? '+' : ''}${buf}%`}
          sub={`Required: ${required}%`}
          icon={CheckCircle} color={buf >= 0 ? 'text-green-600' : 'text-red-600'} />
        <StatCard label="At-Risk Subjects" value={att.atRiskCount || 0}
          sub={`of ${att.subjectCount || 0} subjects`}
          icon={AlertTriangle} color={att.atRiskCount > 0 ? 'text-orange-600' : 'text-green-600'} />
        <StatCard label="Fee Balance" value={currency(fees.balance)}
          sub={`Paid: ${currency(fees.paid)}`}
          icon={DollarSign} color={fees.balance > 0 ? 'text-red-600' : 'text-green-600'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At-risk subjects */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Subject Attendance</h2>
            <Link to="/student/attendance" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {att.atRiskSubjects?.length > 0 ? (
            <>
              <SubjectBarChart data={chartData} required={required} />
              <div className="mt-4 space-y-2">
                {att.atRiskSubjects.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.subject?.name}</p>
                      <p className="text-xs text-gray-500">{s.classesRequired > 0 ? `Need ${s.classesRequired} more classes` : 'On track'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${pctColor(s.percentage, required)}`}>{s.percentage}%</span>
                      <RiskBadge risk={s.risk} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
              <p className="text-sm font-medium text-gray-700">All subjects on track</p>
              <p className="text-xs text-gray-500">Your attendance is above the required threshold</p>
            </div>
          )}
        </div>

        {/* Quick info panel */}
        <div className="space-y-4">
          {/* Announcements */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Bell className="w-4 h-4 text-primary-500" />Announcements</h3>
              <Link to="/student/announcements" className="text-xs text-primary-600 hover:underline">All</Link>
            </div>
            <div className="space-y-2">
              {(d.recentAnnouncements || []).slice(0, 3).map((a, i) => (
                <div key={i} className="text-xs p-2 rounded-lg bg-gray-50">
                  <p className="font-medium text-gray-700 line-clamp-1">{a.title}</p>
                  <p className="text-gray-400 mt-0.5">{fmtDate(a.publishedAt)}</p>
                </div>
              ))}
              {!d.recentAnnouncements?.length && <p className="text-xs text-gray-400">No announcements</p>}
            </div>
          </div>
          {/* Upcoming events */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-500" />Upcoming</h3>
              <Link to="/student/calendar" className="text-xs text-primary-600 hover:underline">All</Link>
            </div>
            <div className="space-y-2">
              {(d.upcomingEvents || []).slice(0, 4).map((ev, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-gray-50">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ev.color || '#3b82f6' }} />
                  <div>
                    <p className="font-medium text-gray-700">{ev.title}</p>
                    <p className="text-gray-400">{fmtDate(ev.startDate)}</p>
                  </div>
                </div>
              ))}
              {!d.upcomingEvents?.length && <p className="text-xs text-gray-400">No upcoming events</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
