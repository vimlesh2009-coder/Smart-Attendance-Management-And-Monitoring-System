import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hodAPI } from '../../api/hod';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Pagination } from '../../components/shared/Pagination';
import { fmtDate } from '../../utils/helpers';
import { Bell, AlertCircle } from 'lucide-react';

const TYPE_COLOR = { general:'badge-gray', academic:'badge-blue', exam:'badge-purple', holiday:'badge-green', fee:'badge-yellow', event:'badge-blue', urgent:'badge-red' };

export default function HodAnnouncements() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hod-announcements', page],
    queryFn:  () => hodAPI.getAnnouncements({ page, limit: 10 }),
  });
  if (isLoading) return <PageLoader />;
  if (error)     return <ErrorAlert message={error.message} onRetry={refetch} />;
  const items = data?.data || [];
  const pg    = data?.pagination || {};
  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Announcements</h1></div>
      <div className="card">
        {items.length === 0 ? <EmptyState icon={Bell} title="No announcements" /> : (
          <>
            <div className="divide-y divide-gray-100">
              {items.map((a, i) => (
                <div key={i} className={`p-5 ${a.priority==='urgent' ? 'bg-red-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.priority==='urgent' ? 'bg-red-100' : 'bg-primary-50'}`}>
                      {a.priority==='urgent' ? <AlertCircle className="w-4 h-4 text-red-600" /> : <Bell className="w-4 h-4 text-primary-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                        <span className={`badge ${TYPE_COLOR[a.type] || 'badge-gray'}`}>{a.type}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{fmtDate(a.publishedAt)} · by {a.publishedBy?.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pages={pg.pages} total={pg.total} limit={10} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
