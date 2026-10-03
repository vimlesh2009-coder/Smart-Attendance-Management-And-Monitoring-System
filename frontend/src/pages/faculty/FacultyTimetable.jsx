import { useQuery } from '@tanstack/react-query';
import { facultyAPI } from '../../api/faculty';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Clock } from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TYPE_COLORS = { lecture:'bg-blue-100 text-blue-700', practical:'bg-purple-100 text-purple-700', tutorial:'bg-green-100 text-green-700' };

export default function FacultyTimetable() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['faculty-timetable'],
    queryFn: () => facultyAPI.getTimetable(),
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorAlert message={error.message} onRetry={refetch} />;

  const timetable = data?.data || [];
  if (!timetable.length) return (
    <div className="space-y-6">
      <h1 className="page-title">My Timetable</h1>
      <div className="card"><EmptyState icon={Clock} title="No timetable" description="No timetable entries found for your assigned sections." /></div>
    </div>
  );

  // Group by section
  const bySec = timetable.reduce((acc, tt) => {
    const k = tt.section?._id;
    if (!acc[k]) acc[k] = { section: tt.section, days: {} };
    acc[k].days[tt.day] = tt.periods || [];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">My Timetable</h1><p className="page-subtitle">Periods assigned to you per section</p></div>
      {Object.values(bySec).map(({ section, days }) => (
        <div key={section?._id} className="card overflow-hidden">
          <div className="px-5 py-3 bg-primary-50 border-b border-primary-100">
            <h2 className="text-sm font-semibold text-primary-700">Section {section?.name} — Year {section?.year} Sem {section?.semester}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {DAYS.filter(d => days[d]?.length).map(day => (
              <div key={day} className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{day}</p>
                <div className="flex flex-wrap gap-3">
                  {days[day].map((p, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 min-w-[200px]">
                      <div className="text-center min-w-[36px]">
                        <p className="text-xs font-bold text-gray-500">P{p.periodNumber}</p>
                        <p className="text-xs text-gray-400">{p.startTime}</p>
                        <p className="text-xs text-gray-400">{p.endTime}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.subject?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{p.room || '—'}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-500'}`}>{p.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
