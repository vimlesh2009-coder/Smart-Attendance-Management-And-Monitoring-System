import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../api/student';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { SubjectBarChart } from '../../components/charts/AttendanceChart';
import { riskColor, riskLabel, pctColor, buffer } from '../../utils/helpers';
import { ClipboardList, ArrowRight, TrendingUp } from 'lucide-react';

const RiskPill = ({ risk }) => {
  const cls = {
    safe: 'bg-green-100 text-green-700', moderate: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700', critical: 'bg-orange-100 text-orange-700',
    shortage: 'bg-red-100 text-red-700',
  }[risk] || 'bg-gray-100 text-gray-600';
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{riskLabel(risk)}</span>;
};

export default function StudentAttendance() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => studentAPI.getAttendance(),
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorAlert message={error.message} onRetry={refetch} />;

  const d = data?.data || {};
  const subjects = d.subjectWise || [];
  const overall = d.overall || {};
  const required = d.requiredPercentage || 75;
  const buf = buffer(overall.overallPercentage || 0, required);

  const chartData = subjects.map(s => ({
    name: s.subject?.code || s.subject?.name?.slice(0, 8),
    percentage: s.attendancePercentage,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">Subject-wise breakdown for current semester</p>
      </div>

      {/* Overall summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Overall', v: `${overall.overallPercentage || 0}%`, color: pctColor(overall.overallPercentage || 0, required) },
          { l: 'Buffer', v: `${buf >= 0 ? '+' : ''}${buf}%`, color: buf >= 0 ? 'text-green-600' : 'text-red-600' },
          { l: 'Required', v: `${required}%`, color: 'text-gray-700' },
          { l: 'Classes', v: `${overall.attendedClasses || 0}/${overall.totalClasses || 0}`, color: 'text-gray-700' },
        ].map(({ l, v, color }) => (
          <div key={l} className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{l}</p>
            <p className={`text-2xl font-bold ${color}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {subjects.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-4">Subject-wise Overview</h2>
          <SubjectBarChart data={chartData} required={required} />
        </div>
      )}

      {/* Subject list */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="section-title">Subject Details</h2>
        </div>
        {subjects.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No attendance data" description="Attendance has not been recorded yet for this semester." />
        ) : (
          <div className="divide-y divide-gray-100">
            {subjects.map((s, i) => {
              const subBuf = buffer(s.attendancePercentage, required);
              return (
                <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{s.subject?.name}</p>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{s.subject?.code}</span>
                        <RiskPill risk={s.risk} />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Attended: <b className="text-gray-700">{s.attendedClasses}/{s.totalClasses}</b></span>
                        <span>Absent: <b className="text-gray-700">{s.absentClasses}</b></span>
                        {s.lateClasses > 0 && <span>Late: <b className="text-gray-700">{s.lateClasses}</b></span>}
                        <span>Buffer: <b className={subBuf >= 0 ? 'text-green-600' : 'text-red-600'}>{subBuf >= 0 ? '+' : ''}{subBuf}%</b></span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${s.attendancePercentage >= required ? 'bg-green-500' : s.attendancePercentage >= required - 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(s.attendancePercentage, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xl font-bold ${pctColor(s.attendancePercentage, required)}`}>
                        {s.attendancePercentage}%
                      </span>
                      {s.classesRequiredToReach > 0 && (
                        <div className="text-right text-xs">
                          <p className="text-orange-600 font-medium">Need {s.classesRequiredToReach} more</p>
                        </div>
                      )}
                      {s.classesCanSkip > 0 && (
                        <div className="text-right text-xs">
                          <p className="text-green-600 font-medium">Can skip {s.classesCanSkip}</p>
                        </div>
                      )}
                      <Link to={`/student/attendance/${s.subject?._id}`}
                        className="btn-secondary btn-sm">
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
