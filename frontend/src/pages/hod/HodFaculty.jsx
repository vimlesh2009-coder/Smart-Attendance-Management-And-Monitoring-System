import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hodAPI } from '../../api/hod';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Pagination } from '../../components/shared/Pagination';
import { getInitials } from '../../utils/helpers';
import { UserCheck } from 'lucide-react';

export default function HodFaculty() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hod-faculty', page],
    queryFn:  () => hodAPI.getFaculty({ page, limit: 20 }),
  });
  if (isLoading) return <PageLoader />;
  if (error)     return <ErrorAlert message={error.message} onRetry={refetch} />;
  const faculty = data?.data || [];
  const pg      = data?.pagination || {};
  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Faculty</h1><p className="page-subtitle">All faculty members in your department</p></div>
      {faculty.length === 0 ? <div className="card"><EmptyState icon={UserCheck} title="No faculty" /></div> : (
        <div className="card">
          <div className="divide-y divide-gray-100">
            {faculty.map((f, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                  {getInitials(f.user?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{f.user?.name}</p>
                  <p className="text-xs text-gray-500">{f.designation} · {f.employeeId}</p>
                  <p className="text-xs text-gray-400">{f.user?.email}</p>
                </div>
                <div className="text-right">
                  <span className="badge badge-blue">{f.designation}</span>
                  {f.specialization && <p className="text-xs text-gray-400 mt-1">{f.specialization}</p>}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pg.pages} total={pg.total} limit={20} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
