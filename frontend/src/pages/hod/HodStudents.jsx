import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hodAPI } from '../../api/hod';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Pagination } from '../../components/shared/Pagination';
import { Users } from 'lucide-react';

export default function HodStudents() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hod-students', page],
    queryFn:  () => hodAPI.getStudents({ page, limit: 20 }),
  });
  if (isLoading) return <PageLoader />;
  if (error)     return <ErrorAlert message={error.message} onRetry={refetch} />;
  const students = data?.data || [];
  const pg       = data?.pagination || {};
  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Students</h1><p className="page-subtitle">All students in your department</p></div>
      {students.length === 0 ? <div className="card"><EmptyState icon={Users} title="No students" /></div> : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>Name</th><th>Roll No</th><th>Enrollment</th><th>Section</th><th>Email</th></tr></thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i}>
                    <td className="text-gray-400">{(page-1)*20+i+1}</td>
                    <td className="font-medium">{s.user?.name}</td>
                    <td>{s.rollNo || '—'}</td>
                    <td className="font-mono text-xs">{s.enrollmentNo}</td>
                    <td><span className="badge badge-blue">Sec {s.section?.name} Yr {s.section?.year}</span></td>
                    <td className="text-gray-500 text-xs">{s.user?.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pg.pages} total={pg.total} limit={20} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
