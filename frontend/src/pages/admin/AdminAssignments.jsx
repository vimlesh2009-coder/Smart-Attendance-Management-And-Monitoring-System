import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Pagination } from '../../components/shared/Pagination';
import { UserCog, Plus, Trash2 } from 'lucide-react';

function AssignForm({ onSubmit, loading }) {
  const deptQ    = useQuery({ queryKey: ['depts-dd'],    queryFn: () => adminAPI.getDepartments({ limit: 100 }) });
  const sessionQ = useQuery({ queryKey: ['sessions-dd'], queryFn: () => adminAPI.getSessions({ limit: 50 }) });
  const [dept, setDept]       = useState('');
  const [session, setSession] = useState('');
  const sectQ    = useQuery({ queryKey: ['sections-dd', dept, session], queryFn: () => adminAPI.getSections({ department: dept, academicSession: session, limit: 100 }), enabled: !!dept && !!session });
  const facQ     = useQuery({ queryKey: ['faculty-dd', dept],           queryFn: () => adminAPI.getFaculty({ department: dept, limit: 100 }), enabled: !!dept });
  const subQ     = useQuery({ queryKey: ['subjects-dd', dept],          queryFn: () => adminAPI.getSubjects({ department: dept, limit: 100 }), enabled: !!dept });

  const [form, setForm] = useState({ faculty: '', subject: '', section: '', academicSession: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, academicSession: session }); }} className="space-y-4">
      <div><label className="label">Department</label>
        <select className="select" value={dept} onChange={e => { setDept(e.target.value); setForm({ faculty:'', subject:'', section:'', academicSession:'' }); }} required>
          <option value="">Select department…</option>
          {(deptQ.data?.data||[]).map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
        </select>
      </div>
      <div><label className="label">Academic Session</label>
        <select className="select" value={session} onChange={e => setSession(e.target.value)} required>
          <option value="">Select session…</option>
          {(sessionQ.data?.data||[]).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>
      <div><label className="label">Faculty</label>
        <select className="select" value={form.faculty} onChange={e => set('faculty', e.target.value)} required disabled={!dept}>
          <option value="">Select faculty…</option>
          {(facQ.data?.data||[]).map(f => <option key={f._id} value={f._id}>{f.user?.name} ({f.employeeId})</option>)}
        </select>
      </div>
      <div><label className="label">Subject</label>
        <select className="select" value={form.subject} onChange={e => set('subject', e.target.value)} required disabled={!dept}>
          <option value="">Select subject…</option>
          {(subQ.data?.data||[]).map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
        </select>
      </div>
      <div><label className="label">Section</label>
        <select className="select" value={form.section} onChange={e => set('section', e.target.value)} required disabled={!dept || !session}>
          <option value="">Select section…</option>
          {(sectQ.data?.data||[]).map(s => <option key={s._id} value={s._id}>Sec {s.name} — Yr {s.year} Sem {s.semester}</option>)}
        </select>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
          Assign
        </button>
      </div>
    </form>
  );
}

export default function AdminAssignments() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [modal, setModal]     = useState(false);
  const [delTarget, setDel]   = useState(null);
  const [sessionFilter, setSF] = useState('');

  const sessionQ = useQuery({ queryKey:['sessions-dd'], queryFn:()=>adminAPI.getSessions({limit:50}) });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-assignments', page, sessionFilter],
    queryFn:  () => adminAPI.getAssignments({ page, limit: 15, academicSession: sessionFilter }),
  });

  const inv = () => qc.invalidateQueries(['admin-assignments']);
  const createMut = useMutation({ mutationFn: adminAPI.createAssignment, onSuccess: ()=>{toast.success('Assigned');inv();setModal(false);}, onError: e=>toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn: adminAPI.deleteAssignment,  onSuccess: ()=>{toast.success('Removed');inv();setDel(null);},    onError: e=>toast.error(e.message) });

  const assignments = data?.data || [];
  const pg = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Subject Assignments</h1><p className="page-subtitle">Assign faculty to subjects and sections</p></div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus className="w-4 h-4"/> New Assignment</button>
      </div>

      <div className="card p-4">
        <select className="select w-60" value={sessionFilter} onChange={e=>{setSF(e.target.value);setPage(1);}}>
          <option value="">All Sessions</option>
          {(sessionQ.data?.data||[]).map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {isLoading ? <PageLoader/> : error ? <ErrorAlert message={error.message} onRetry={refetch}/> : (
        <div className="card">
          {assignments.length === 0
            ? <EmptyState icon={UserCog} title="No assignments" description="Assign faculty to subjects using the button above."/>
            : <>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Faculty</th><th>Subject</th><th>Section</th><th>Session</th><th>Actions</th></tr></thead>
                  <tbody>
                    {assignments.map((a,i) => (
                      <tr key={i}>
                        <td>
                          <p className="font-medium">{a.faculty?.user?.name}</p>
                          <p className="text-xs text-gray-400">{a.faculty?.employeeId}</p>
                        </td>
                        <td>
                          <p className="font-medium">{a.subject?.name}</p>
                          <span className="badge badge-gray text-xs">{a.subject?.code}</span>
                        </td>
                        <td><span className="badge badge-blue">Sec {a.section?.name} Yr{a.section?.year}</span></td>
                        <td className="text-xs text-gray-500">{a.academicSession?.name}</td>
                        <td>
                          <button onClick={()=>setDel(a._id)} className="btn-danger btn-sm"><Trash2 className="w-3.5 h-3.5"/> Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={pg.pages} total={pg.total} limit={15} onPage={setPage}/>
            </>
          }
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="New Assignment">
        <AssignForm loading={createMut.isPending} onSubmit={form=>createMut.mutate(form)}/>
      </Modal>
      <ConfirmDialog open={!!delTarget} onClose={()=>setDel(null)} onConfirm={()=>deleteMut.mutate(delTarget)}
        loading={deleteMut.isPending} title="Remove Assignment"
        message="This will remove the faculty assignment. Existing attendance records are not affected."/>
    </div>
  );
}
