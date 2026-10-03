import { useQuery } from '@tanstack/react-query';
import { studentAPI } from '../../api/student';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Clock } from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TYPE_COLORS = { lecture:'bg-blue-100 text-blue-700', practical:'bg-purple-100 text-purple-700', tutorial:'bg-green-100 text-green-700', break:'bg-gray-100 text-gray-500', free:'bg-gray-50 text-gray-400' };

export default function StudentTimetable() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student-timetable'],
    queryFn: () => studentAPI.getTimetable(),
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorAlert message={error.message} onRetry={refetch} />;

  const timetable = data?.data || [];
  const byDay = Object.fromEntries(DAYS.map(d => [d, timetable.find(t => t.day === d)]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Timetable</h1>
        <p className="page-subtitle">Weekly class schedule</p>
      </div>

      {timetable.length === 0 ? (
        <div className="card"><EmptyState icon={Clock} title="No timetable" description="Timetable has not been set for your section yet." /></div>
      ) : (
        <div className="space-y-4">
          {DAYS.filter(d => byDay[d]).map(day => {
            const tt = byDay[day];
            return (
              <div key={day} className="card overflow-hidden">
                <div className="px-5 py-3 bg-primary-50 border-b border-primary-100">
                  <h2 className="text-sm font-semibold text-primary-700">{day}</h2>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(tt.periods || []).filter(p => p.type !== 'break' && p.type !== 'free').map((p, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-center min-w-[40px]">
                        <p className="text-xs font-bold text-gray-500">P{p.periodNumber}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.startTime}</p>
                        <p className="text-xs text-gray-400">{p.endTime}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{p.subject?.name || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{p.faculty?.user?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{p.room || '—'}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-500'}`}>{p.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
