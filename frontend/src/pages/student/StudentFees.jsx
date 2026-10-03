import { useQuery } from '@tanstack/react-query';
import { studentAPI } from '../../api/student';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { fmtDate, currency } from '../../utils/helpers';
import { DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const statusIcon = { paid: <CheckCircle className="w-4 h-4 text-green-500" />, partial: <Clock className="w-4 h-4 text-yellow-500" />, unpaid: <AlertTriangle className="w-4 h-4 text-red-500" />, overdue: <AlertTriangle className="w-4 h-4 text-red-600" /> };
const statusCls  = { paid: 'badge-green', partial: 'badge-yellow', unpaid: 'badge-red', overdue: 'badge-red' };

export default function StudentFees() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student-fees'],
    queryFn: () => studentAPI.getFees(),
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorAlert message={error.message} onRetry={refetch} />;

  const d = data?.data || {};
  const summary = d.summary || {};
  const records = d.records || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Fee Information</h1>
        <p className="page-subtitle">Current semester fee status (informational only)</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Total Amount', v: currency(summary.totalAmount), color: 'text-gray-800' },
          { l: 'Paid', v: currency(summary.paidAmount), color: 'text-green-600' },
          { l: 'Discount', v: currency(summary.discount), color: 'text-blue-600' },
          { l: 'Balance Due', v: currency(summary.balanceDue), color: summary.balanceDue > 0 ? 'text-red-600' : 'text-green-600' },
        ].map(({ l, v, color }) => (
          <div key={l} className="card p-5 text-center">
            <p className="text-xs text-gray-500 mb-1">{l}</p>
            <p className={`text-xl font-bold ${color}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="section-title">Fee Records</h2>
        </div>
        {records.length === 0 ? (
          <EmptyState icon={DollarSign} title="No fee records" />
        ) : (
          <div className="divide-y divide-gray-100">
            {records.map((rec, i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  {statusIcon[rec.status]}
                  <div>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{rec.feeType.replace(/_/g, ' ')} Fee</p>
                    <p className="text-xs text-gray-500">{rec.academicSession?.name} · Added {fmtDate(rec.createdAt)}</p>
                    {rec.remarks && <p className="text-xs text-gray-400 italic mt-0.5">{rec.remarks}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right text-xs text-gray-500">
                    <p>Total: <span className="font-medium text-gray-700">{currency(rec.totalAmount)}</span></p>
                    <p>Paid: <span className="font-medium text-green-600">{currency(rec.paidAmount)}</span></p>
                    {rec.fine > 0 && <p>Fine: <span className="font-medium text-red-500">{currency(rec.fine)}</span></p>}
                    {rec.discount > 0 && <p>Discount: <span className="font-medium text-blue-500">{currency(rec.discount)}</span></p>}
                    <p>Balance: <span className="font-bold text-gray-900">{currency(rec.balanceDue || (rec.totalAmount + rec.fine - rec.discount - rec.paidAmount))}</span></p>
                  </div>
                  <span className={`badge ${statusCls[rec.status]}`}>{rec.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
