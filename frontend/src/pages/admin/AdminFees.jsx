import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { Pagination } from '../../components/shared/Pagination';
import { fmtDate, currency } from '../../utils/helpers';
import { DollarSign, Plus, Edit2 } from 'lucide-react';

const FEE_TYPES = ['tuition','examination','library','laboratory','hostel','transport','sports','miscellaneous'];
const STATUS_CLS = { paid:'badge-green', partial:'badge-yellow', unpaid:'badge-red', overdue:'badge-red' };

function FeeForm({ initial={}, onSubmit, loading }) {
  const sessionQ = useQuery({ queryKey:['sessions-dd'], queryFn:()=>adminAPI.getSessions({limit:50}) });
  const [sessionId, setSession] = useState(initial.academicSession?._id||initial.academicSession||'');
  const studQ = useQuery({ queryKey:['students-search', sessionId], queryFn:()=>adminAPI.getStudents({academicSession:sessionId, limit:200}), enabled:!!sessionId });
  const isEdit = !!initial._id;
  const [form, setForm] = useState({
    student: initial.student?._id||initial.student||'',
    feeType: initial.feeType||'tuition',
    totalAmount: initial.totalAmount||'',
    paidAmount: initial.paidAmount||0,
    discount: initial.discount||0,
    fine: initial.fine||0,
    remarks: initial.remarks||'',
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit({...form,academicSession:sessionId});}} className="space-y-4">
      <div><label className="label">Academic Session</label>
        <select className="select" value={sessionId} onChange={e=>{setSession(e.target.value);set('student','');}} required>
          <option value="">Select…</option>
          {(sessionQ.data?.data||[]).map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>
      {!isEdit && <div><label className="label">Student</label>
        <select className="select" value={form.student} onChange={e=>set('student',e.target.value)} required disabled={!sessionId}>
          <option value="">Select…</option>
          {(studQ.data?.data||[]).map(s=><option key={s._id} value={s._id}>{s.user?.name} — {s.enrollmentNo}</option>)}
        </select>
      </div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Fee Type</label>
          <select className="select" value={form.feeType} onChange={e=>set('feeType',e.target.value)}>
            {FEE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="label">Total Amount (₹)</label><input type="number" className="input" value={form.totalAmount} onChange={e=>set('totalAmount',e.target.value)} required min={0}/></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="label">Paid (₹)</label><input type="number" className="input" value={form.paidAmount} onChange={e=>set('paidAmount',e.target.value)} min={0}/></div>
        <div><label className="label">Discount (₹)</label><input type="number" className="input" value={form.discount} onChange={e=>set('discount',e.target.value)} min={0}/></div>
        <div><label className="label">Fine (₹)</label><input type="number" className="input" value={form.fine} onChange={e=>set('fine',e.target.value)} min={0}/></div>
      </div>
      <div><label className="label">Remarks</label><textarea className="input resize-none" rows={2} value={form.remarks} onChange={e=>set('remarks',e.target.value)}/></div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading&&<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
          {isEdit?'Update':'Create'} Fee Record
        </button>
      </div>
    </form>
  );
}

export default function AdminFees() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editItem, setEdit] = useState(null);
  const [sessionFilter, setSF] = useState('');
  const [statusFilter, setStF] = useState('');

  const sessionQ = useQuery({ queryKey:['sessions-dd'], queryFn:()=>adminAPI.getSessions({limit:50}) });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-fees', page, sessionFilter, statusFilter],
    queryFn:  () => adminAPI.getFeeRecords({ page, limit:15, academicSession:sessionFilter, status:statusFilter }),
  });

  const inv = () => qc.invalidateQueries(['admin-fees']);
  const createMut = useMutation({ mutationFn:adminAPI.createFeeRecord, onSuccess:()=>{toast.success('Created');inv();setModal(false);}, onError:e=>toast.error(e.message) });
  const updateMut = useMutation({ mutationFn:({id,d})=>adminAPI.updateFeeRecord(id,d), onSuccess:()=>{toast.success('Updated');inv();setModal(false);setEdit(null);}, onError:e=>toast.error(e.message) });

  const fees = data?.data || [];
  const pg   = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Fee Records</h1><p className="page-subtitle">Informational only — no online payments</p></div>
        <button onClick={()=>{setEdit(null);setModal(true);}} className="btn-primary"><Plus className="w-4 h-4"/> Add Record</button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="select w-56" value={sessionFilter} onChange={e=>{setSF(e.target.value);setPage(1);}}>
          <option value="">All Sessions</option>
          {(sessionQ.data?.data||[]).map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select className="select w-36" value={statusFilter} onChange={e=>{setStF(e.target.value);setPage(1);}}>
          <option value="">All Status</option>
          {['paid','partial','unpaid','overdue'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? <PageLoader/> : error ? <ErrorAlert message={error.message} onRetry={refetch}/> : (
        <div className="card">
          {fees.length===0 ? <EmptyState icon={DollarSign} title="No fee records"/> : (
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Student</th><th>Fee Type</th><th>Session</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {fees.map((f,i)=>(
                      <tr key={i}>
                        <td>
                          <p className="font-medium">{f.student?.user?.name}</p>
                          <p className="text-xs text-gray-400">{f.student?.enrollmentNo}</p>
                        </td>
                        <td className="capitalize">{f.feeType}</td>
                        <td className="text-xs text-gray-500">{f.academicSession?.name}</td>
                        <td className="font-medium">{currency(f.totalAmount)}</td>
                        <td className="text-green-600">{currency(f.paidAmount)}</td>
                        <td className={f.balanceDue>0?'text-red-600 font-semibold':'text-green-600'}>{currency(f.balanceDue)}</td>
                        <td><span className={`badge ${STATUS_CLS[f.status]||'badge-gray'}`}>{f.status}</span></td>
                        <td><button onClick={()=>{setEdit(f);setModal(true);}} className="btn-secondary btn-sm"><Edit2 className="w-3.5 h-3.5"/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={pg.pages} total={pg.total} limit={15} onPage={setPage}/>
            </>
          )}
        </div>
      )}

      <Modal open={modal} onClose={()=>{setModal(false);setEdit(null);}} title={editItem?'Update Fee Record':'New Fee Record'} size="lg">
        <FeeForm initial={editItem||{}} loading={createMut.isPending||updateMut.isPending}
          onSubmit={form=>editItem?updateMut.mutate({id:editItem._id,d:form}):createMut.mutate(form)}/>
      </Modal>
    </div>
  );
}
