import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hodAPI } from '../../api/hod';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { pctColor, riskLabel } from '../../utils/helpers';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const RISK_CLS = { safe:'badge-green', moderate:'badge-blue', warning:'badge-yellow', critical:'badge-orange', shortage:'badge-red' };

export default function HodLowAttendance() {
  const [threshold, setThreshold] = useState(75);
  const [expand,    setExpand]    = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hod-low', threshold],
    queryFn:  () => hodAPI.getLowAttendanceReport({ required: 75, threshold }),
  });

  const d        = data?.data || {};
  const students = d.students || [];

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Low Attendance Report</h1><p className="page-subtitle">Students below the attendance threshold — worst first</p></div>

      {/* Controls */}
      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Threshold (%)</label>
          <input type="number" min={1} max={100} value={threshold}
            onChange={e => setThreshold(parseInt(e.target.value) || 75)} className="input w-24" />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">Checked: <b>{d.totalStudentsChecked || 0}</b></span>
          <span className="text-red-600 font-semibold">Below threshold: <b>{d.lowAttendanceCount || 0}</b></span>
        </div>
      </div>

      {isLoading ? <PageLoader /> : error ? <ErrorAlert message={error.message} onRetry={refetch} /> : (
        <div className="card">
          {students.length === 0 ? (
            <EmptyState icon={CheckCircle} title="All clear!" description={`No students below ${threshold}% attendance.`} />
          ) : (
            <div className="divide-y divide-gray-100">
              {students.map((s, i) => (
                <div key={i}>
                  <div
                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpand(expand === i ? null : i)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.enrollmentNo} · Sec {s.section?.name} · Yr {s.section?.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${RISK_CLS[s.overallRisk] || 'badge-gray'}`}>{riskLabel(s.overallRisk)}</span>
                      <span className={`text-lg font-bold ${pctColor(s.overallPercentage, 75)}`}>{s.overallPercentage}%</span>
                      <span className="text-xs text-gray-400">{expand===i ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {expand === i && (
                    <div className="px-4 pb-4 bg-gray-50">
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <table className="table text-xs">
                          <thead><tr><th>Subject</th><th>Attended</th><th>Total</th><th>%</th><th>Risk</th><th>Need</th></tr></thead>
                          <tbody>
                            {(s.shortageSubjects || []).map((sub, j) => (
                              <tr key={j}>
                                <td>{sub.subjectCode || sub.subject}</td>
                                <td>{sub.attended}</td>
                                <td>{sub.total}</td>
                                <td className={`font-bold ${pctColor(sub.percentage, 75)}`}>{sub.percentage}%</td>
                                <td><span className={`badge ${RISK_CLS[sub.risk] || 'badge-gray'}`}>{riskLabel(sub.risk)}</span></td>
                                <td className="text-orange-600 font-medium">{sub.classesRequired > 0 ? `+${sub.classesRequired}` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
