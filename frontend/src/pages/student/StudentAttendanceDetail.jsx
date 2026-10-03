import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studentAPI } from '../../api/student';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { TrendAreaChart, AttendancePieChart } from '../../components/charts/AttendanceChart';
import { fmtDate, pctColor, buffer, riskLabel, statusBadge } from '../../utils/helpers';
import { Calculator, TrendingUp, History, AlertTriangle } from 'lucide-react';

const Tab = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${active ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
    {children}
  </button>
);

export default function StudentAttendanceDetail() {
  const { subjectId } = useParams();
  const [tab, setTab] = useState('overview');
  const [attendN, setAttendN] = useState(5);
  const [skipN, setSkipN]     = useState(3);
  const [groupBy, setGroupBy] = useState('week');

  const detailQ = useQuery({
    queryKey: ['subject-detail', subjectId],
    queryFn: () => studentAPI.getSubjectAttendance(subjectId),
  });
  const whatifQ = useQuery({
    queryKey: ['whatif', subjectId, attendN, skipN],
    queryFn: () => studentAPI.getWhatIf(subjectId, { attend: attendN, skip: skipN }),
    enabled: tab === 'whatif',
  });
  const trendQ = useQuery({
    queryKey: ['trend', subjectId, groupBy],
    queryFn: () => studentAPI.getTrend(subjectId, { groupBy }),
    enabled: tab === 'trend',
  });

  if (detailQ.isLoading) return <PageLoader />;
  if (detailQ.error) return <ErrorAlert message={detailQ.error.message} onRetry={detailQ.refetch} />;

  const d   = detailQ.data?.data || {};
  const stats = d.stats || {};
  const req = d.requiredPercentage || 75;
  const buf = buffer(stats.attendancePercentage || 0, req);

  const riskCls = {
    safe: 'risk-safe', moderate: 'risk-moderate', warning: 'risk-warning',
    critical: 'risk-critical', shortage: 'risk-shortage',
  }[d.risk] || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Attendance Detail</h1>
        <p className="page-subtitle">Subject-wise analysis and what-if calculator</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { l: 'Attendance', v: `${stats.attendancePercentage || 0}%`, c: pctColor(stats.attendancePercentage || 0, req) },
          { l: 'Buffer', v: `${buf >= 0 ? '+' : ''}${buf}%`, c: buf >= 0 ? 'text-green-600' : 'text-red-600' },
          { l: 'Attended', v: stats.attendedClasses || 0, c: 'text-gray-800' },
          { l: 'Absent', v: stats.absentClasses || 0, c: stats.absentClasses > 0 ? 'text-red-600' : 'text-gray-600' },
          { l: 'Total', v: stats.totalClasses || 0, c: 'text-gray-800' },
        ].map(({ l, v, c }) => (
          <div key={l} className="card p-4 text-center">
            <p className="text-xs text-gray-500">{l}</p>
            <p className={`text-xl font-bold mt-1 ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Risk indicator */}
      {d.risk && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${riskCls}`}>
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{riskLabel(d.risk)} Status</p>
            <p className="text-xs mt-0.5">
              {d.classesRequiredToReach > 0
                ? `Attend ${d.classesRequiredToReach} more consecutive classes to reach ${req}%`
                : d.classesCanSkip > 0
                ? `You can skip up to ${d.classesCanSkip} more classes and stay above ${req}%`
                : `You are exactly at the required threshold`}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200 px-2">
          <Tab active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</Tab>
          <Tab active={tab === 'history'}  onClick={() => setTab('history')}>History</Tab>
          <Tab active={tab === 'whatif'}   onClick={() => setTab('whatif')}>What-If</Tab>
          <Tab active={tab === 'trend'}    onClick={() => setTab('trend')}>Trend</Tab>
        </div>

        <div className="p-5">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Attendance Distribution</h3>
                <AttendancePieChart attended={stats.attendedClasses || 0} absent={stats.absentClasses || 0} />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Summary</h3>
                {[
                  ['Present', stats.attendedClasses, 'text-green-600'],
                  ['Absent', stats.absentClasses, 'text-red-600'],
                  ['Late', stats.lateClasses, 'text-yellow-600'],
                  ['Excused', stats.excusedClasses, 'text-blue-600'],
                  ['Total', stats.totalClasses, 'text-gray-700'],
                ].map(([l, v, c]) => (
                  <div key={l} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600">{l}</span>
                    <span className={`text-sm font-semibold ${c}`}>{v || 0}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Can still skip</span>
                  <span className="text-sm font-bold text-green-600">{d.classesCanSkip || 0} classes</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Need to attend</span>
                  <span className="text-sm font-bold text-orange-600">{d.classesRequiredToReach || 0} classes</span>
                </div>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {tab === 'history' && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Period</th><th>Time</th><th>Topic</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {(d.lectureHistory || []).map((lec, i) => (
                    <tr key={i}>
                      <td className="font-medium">{fmtDate(lec.date)}</td>
                      <td>P{lec.periodNumber}</td>
                      <td>{lec.startTime}–{lec.endTime}</td>
                      <td className="max-w-[200px] truncate">{lec.topic || '—'}</td>
                      <td>
                        <span className={`badge ${statusBadge(lec.status)}`}>
                          {lec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!d.lectureHistory?.length && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* WHAT-IF */}
          {tab === 'whatif' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> If I attend next…
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="number" min={0} max={50} value={attendN}
                      onChange={e => setAttendN(parseInt(e.target.value) || 0)}
                      className="input w-20 text-center" />
                    <span className="text-sm text-green-700">consecutive classes</span>
                  </div>
                  {whatifQ.data?.data?.custom?.attend && (
                    <div className="space-y-1 text-sm">
                      <p>New %: <b className={pctColor(whatifQ.data.data.custom.attend.projectedPercentage, req)}>
                        {whatifQ.data.data.custom.attend.projectedPercentage}%
                      </b></p>
                      <p>Total: <b>{whatifQ.data.data.custom.attend.projectedTotal} classes</b></p>
                    </div>
                  )}
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> If I skip next…
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="number" min={0} max={30} value={skipN}
                      onChange={e => setSkipN(parseInt(e.target.value) || 0)}
                      className="input w-20 text-center" />
                    <span className="text-sm text-red-700">classes</span>
                  </div>
                  {whatifQ.data?.data?.custom?.skip && (
                    <div className="space-y-1 text-sm">
                      <p>New %: <b className={pctColor(whatifQ.data.data.custom.skip.projectedPercentage, req)}>
                        {whatifQ.data.data.custom.skip.projectedPercentage}%
                      </b></p>
                      <p>Risk: <b>{riskLabel(whatifQ.data.data.custom.skip.risk)}</b></p>
                    </div>
                  )}
                </div>
              </div>
              {/* Attend scenarios table */}
              {whatifQ.data?.data?.attendScenarios && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Attend Scenarios</h3>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead><tr><th>Attend N more</th><th>Projected %</th><th>Risk</th></tr></thead>
                      <tbody>
                        {whatifQ.data.data.attendScenarios.slice(0, 8).map((s, i) => (
                          <tr key={i}>
                            <td>{s.additionalClasses}</td>
                            <td className={`font-semibold ${pctColor(s.projectedPercentage, req)}`}>{s.projectedPercentage}%</td>
                            <td><span className={`badge ${s.projectedPercentage >= req ? 'badge-green' : 'badge-red'}`}>{riskLabel(s.risk)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TREND */}
          {tab === 'trend' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Attendance Trend</h3>
                <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="select w-28 text-sm">
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
              {trendQ.isLoading ? <PageLoader /> :
                trendQ.data?.data?.trend?.length > 0 ? (
                  <TrendAreaChart data={trendQ.data.data.trend} required={req} />
                ) : <p className="text-sm text-gray-400 text-center py-10">No trend data available yet</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
