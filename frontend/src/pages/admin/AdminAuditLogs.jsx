import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Pagination } from '../../components/shared/Pagination';
import { fmtDateTime } from '../../utils/helpers';
import { FileText } from 'lucide-react';

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-audit', page],
    queryFn:  () => adminAPI.getAuditLogs({ page, limit: 20 }),
  });
  const logs = data?.data || [];
  const pg   = data?.pagination || {};

  const statusCls = { success:'badge-green', failure:'badge-red' };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Audit Logs</h1><p className="page-subtitle">System activity trail</p></div>
      {isLoading?<PageLoader/>:error?<ErrorAlert message={error.message} onRetry={refetch}/>:(
        <div className="card">
          {logs.length===0?<EmptyState icon={FileText} title="No logs"/>:(
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Time</th><th>Action</th><th>Performed By</th><th>Role</th><th>Description</th><th>Status</th></tr></thead>
                  <tbody>
                    {logs.map((l,i)=>(
                      <tr key={i}>
                        <td className="text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
                        <td><span className="badge badge-blue text-xs font-mono">{l.action}</span></td>
                        <td className="text-sm">{l.performedBy?.name||'—'}</td>
                        <td><span className="badge badge-gray capitalize">{l.performedByRole}</span></td>
                        <td className="text-xs text-gray-600 max-w-xs truncate">{l.description||'—'}</td>
                        <td><span className={`badge ${statusCls[l.status]||'badge-gray'}`}>{l.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={pg.pages} total={pg.total} limit={20} onPage={setPage}/>
            </>
          )}
        </div>
      )}
    </div>
  );
}
