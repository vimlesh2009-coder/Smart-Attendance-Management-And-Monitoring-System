import { useQuery } from '@tanstack/react-query';
import { studentAPI } from '../../api/student';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { fmtDate } from '../../utils/helpers';
import { Calendar } from 'lucide-react';

const TYPE_LABELS = {
  holiday:'Holiday', exam:'Exam', internal_exam:'Internal Exam', result:'Result',
  enrollment:'Enrollment', fee_deadline:'Fee Deadline', event:'Event',
  workshop:'Workshop', seminar:'Seminar', sports:'Sports', cultural:'Cultural',
  working_day:'Working Day', other:'Other',
};

export default function StudentCalendar() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student-calendar'],
    queryFn: () => studentAPI.getCalendar(),
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorAlert message={error.message} onRetry={refetch} />;

  const events = data?.data || [];

  // Group by month
  const grouped = events.reduce((acc, ev) => {
    const key = fmtDate(ev.startDate, 'MMMM yyyy');
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Academic Calendar</h1>
        <p className="page-subtitle">Important dates for the current semester</p>
      </div>

      {events.length === 0 ? (
        <div className="card"><EmptyState icon={Calendar} title="No events" description="No calendar events scheduled." /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, evs]) => (
            <div key={month} className="card overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700">{month}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {evs.map((ev, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-1 h-12 rounded-full shrink-0" style={{ backgroundColor: ev.color || '#3b82f6' }} />
                    <div className="w-16 text-center shrink-0">
                      <p className="text-xs font-bold text-gray-500">{fmtDate(ev.startDate, 'dd')}</p>
                      <p className="text-xs text-gray-400">{fmtDate(ev.startDate, 'EEE')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{ev.title}</p>
                        {ev.isHoliday && <span className="badge badge-red text-xs">Holiday</span>}
                        <span className="badge badge-gray text-xs">{TYPE_LABELS[ev.type] || ev.type}</span>
                      </div>
                      {ev.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.description}</p>}
                      {ev.venue && <p className="text-xs text-gray-400">📍 {ev.venue}</p>}
                    </div>
                    <div className="text-right text-xs text-gray-400 shrink-0">
                      {fmtDate(ev.startDate, 'dd MMM')}
                      {ev.endDate !== ev.startDate && ` – ${fmtDate(ev.endDate, 'dd MMM')}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
