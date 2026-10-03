import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { hodAPI } from '../../api/hod';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { SectionBarChart, DateRangeLineChart } from '../../components/charts/AttendanceChart';
import { pctColor } from '../../utils/helpers';
import { BarChart3, Calendar, ArrowRight } from 'lucide-react';

const Tab = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${active ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{children}</button>
);

export default function HodAttendance() {
  const [tab, setTab]         = useState('summary');
  const [startDate, setStart] = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0]; });
  const [endDate,   setEnd]   = useState(new Date().toISOString().split('T')[0]);

  const summQ  = useQuery({ queryKey: ['hod-summary'],       queryFn: () => hodAPI.getAttendanceSummary() });
  const rangeQ = useQuery({
    queryKey: ['hod-range', startDate, endDate],
    queryFn:  () => hodAPI.getDateRangeReport({ startDate, endDate }),
    enabled:  tab === 'range',
  });

  const summ = summQ.data?.data || [];

  // For section chart
  const chartData = summ.map(s => ({
    name: `Sec ${s.section?.name}`,
    avgAttendancePct: parseFloat((
      s.subjects?.reduce((a, b) => a + (b.avgAttendancePct || 0), 0) / (s.subjects?.length || 1)
    ).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Attendance Reports</h1><p className="page-subtitle">Department-wide attendance analysis</p></div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200 px-2 overflow-x-auto">
          <Tab active={tab==='summary'} onClick={() => setTab('summary')}>Section Summary</Tab>
          <Tab active={tab==='detail'}  onClick={() => setTab('detail')}>Section Detail</Tab>
          <Tab active={tab==='range'}   onClick={() => setTab('range')}>Date Range</Tab>
        </div>

        <div className="p-5">
          {/* SUMMARY */}
          {tab === 'summary' && (
            summQ.isLoading ? <PageLoader /> :
            summQ.error ? <ErrorAlert message={summQ.error.message} onRetry={summQ.refetch} /> :
            summ.length === 0 ? <EmptyState icon={BarChart3} title="No data" /> : (
              <div className="space-y-6">
                <SectionBarChart data={chartData} />
                {summ.map((s, si) => (
                  <div key={si} className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-800">
                        Section {s.section?.name} — Year {s.section?.year} Sem {s.section?.semester}
                      </h3>
                      <Link to={`/hod/attendance/section/${s.section?._id}`} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                        Student detail <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead><tr><th>Subject</th><th>Code</th><th>Lectures</th><th>Avg Attendance</th></tr></thead>
                        <tbody>
                          {s.subjects?.map((sub, i) => (
                            <tr key={i}>
                              <td className="font-medium">{sub.subject?.name}</td>
                              <td><span className="badge badge-gray">{sub.subject?.code}</span></td>
                              <td>{sub.totalLectures}</td>
                              <td><span className={`font-bold ${pctColor(sub.avgAttendancePct, 75)}`}>{sub.avgAttendancePct}%</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* SECTION DETAIL links */}
          {tab === 'detail' && (
            summQ.isLoading ? <PageLoader /> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summ.map((s, i) => (
                  <Link key={i} to={`/hod/attendance/section/${s.section?._id}`}
                    className="block p-4 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all group">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-700">Section {s.section?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Year {s.section?.year} · Sem {s.section?.semester}</p>
                    <p className="text-xs text-gray-400 mt-2">{s.subjects?.length} subjects</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-primary-600">
                      View student matrix <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                ))}
                {!summ.length && <EmptyState icon={BarChart3} title="No sections" />}
              </div>
            )
          )}

          {/* DATE RANGE */}
          {tab === 'range' && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-4 items-end">
                <div><label className="label">From</label><input type="date" value={startDate} onChange={e => setStart(e.target.value)} className="input w-40" /></div>
                <div><label className="label">To</label><input type="date" value={endDate}   onChange={e => setEnd(e.target.value)}   className="input w-40" /></div>
              </div>
              {rangeQ.isLoading ? <PageLoader /> : rangeQ.error ? <ErrorAlert message={rangeQ.error.message} /> :
                rangeQ.data?.data?.records?.length > 0 ? (
                  <DateRangeLineChart data={rangeQ.data.data.records} />
                ) : <EmptyState icon={Calendar} title="No data for range" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
