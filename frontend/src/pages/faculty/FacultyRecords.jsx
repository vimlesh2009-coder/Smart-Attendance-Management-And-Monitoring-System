import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { facultyAPI } from '../../api/faculty';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { Pagination } from '../../components/shared/Pagination';
import { fmtDate, statusBadge } from '../../utils/helpers';
import { ClipboardList, Eye, Edit2, ChevronDown, ChevronUp } from 'lucide-react';

function CorrectionModal({ open, onClose, attendanceId, records }) {
  const qc = useQueryClient();
  const [studentId, setStudentId] = useState('');
  const [newStatus, setNewStatus] = useState('present');
  const [reason,    setReason]    = useState('');

  const mut = useMutation({
    mutationFn: () => facultyAPI.correctAttendance(attendanceId, { studentId, newStatus, reason }),
    onSuccess: () => {
      toast.success('Attendance corrected');
      qc.invalidateQueries(['faculty-records']);
      onClose();
      setStudentId(''); setNewStatus('present'); setReason('');
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Modal open={open} onClose={onClose} title="Correct Attendance" size="sm">
      <div className="space-y-4">
        <div>
          <label className="label">Student</label>
          <select className="select" value={studentId} onChange={e => setStudentId(e.target.value)}>
            <option value="">Select student…</option>
            {(records || []).map(r => (
              <option key={r._id} value={r.student?._id || r.student}>
                {r.student?.user?.name || r.student?.enrollmentNo || r.student} — current: {r.status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">New Status</label>
          <select className="select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            {['present','absent','late','excused'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Reason (required)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            className="input resize-none" placeholder="State the reason for correction…" />
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => mut.mutate()} disabled={!studentId || !reason.trim() || mut.isPending} className="btn-primary">
            {mut.isPending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Save Correction
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DetailRow({ record }) {
  const [open, setOpen] = useState(false);
  const detailQ = useQuery({
    queryKey: ['att-detail', record._id],
    queryFn: () => facultyAPI.getAttendanceDetail(record._id),
    enabled: open,
  });
  const [correcting, setCorrecting] = useState(false);

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-4 py-3 font-medium">{fmtDate(record.date)}</td>
        <td className="px-4 py-3">{record.subject?.name}</td>
        <td className="px-4 py-3">P{record.periodNumber}</td>
        <td className="px-4 py-3">Sec {record.section?.name}</td>
        <td className="px-4 py-3">
          <span className="text-green-600 font-semibold">{record.presentCount}</span>
          <span className="text-gray-400">/{record.totalStudents}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button onClick={() => setOpen(v => !v)} className="btn-secondary btn-sm">
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Details
            </button>
            <button onClick={() => setCorrecting(true)} className="btn-secondary btn-sm">
              <Edit2 className="w-3.5 h-3.5" /> Correct
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="bg-gray-50 px-4 py-3">
            {detailQ.isLoading ? <span className="text-xs text-gray-400">Loading…</span> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {(detailQ.data?.data?.records || []).map((r, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-100 text-xs">
                    <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
                    <span className="text-gray-700 truncate">{r.student?.user?.name || r.student?.enrollmentNo || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
      <CorrectionModal open={correcting} onClose={() => setCorrecting(false)}
        attendanceId={record._id} records={detailQ.data?.data?.records} />
    </>
  );
}

export default function FacultyRecords() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['faculty-records', page],
    queryFn: () => facultyAPI.getAttendanceRecords({ page, limit: 15 }),
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorAlert message={error.message} onRetry={refetch} />;

  const records = data?.data?.records || [];
  const total   = data?.data?.total || 0;
  const pages   = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Attendance Records</h1>
        <p className="page-subtitle">All lectures marked — expand to view details or make corrections</p>
      </div>

      <div className="card">
        {records.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No records" description="You haven't marked any attendance yet." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Subject</th><th>Period</th><th>Section</th><th>Present</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {records.map(r => <DetailRow key={r._id} record={r} />)}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} total={total} limit={15} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
