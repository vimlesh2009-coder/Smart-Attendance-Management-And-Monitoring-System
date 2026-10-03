import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { fmtDate } from '../../utils/helpers';
import { GraduationCap, Plus, Edit2, Star } from 'lucide-react';

function SessionForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    academicYear: initial.academicYear || '',
    semester: initial.semester || 'odd',
    startDate: initial.startDate ? initial.startDate.split('T')[0] : '',
    endDate:   initial.endDate   ? initial.endDate.split('T')[0]   : '',
    description: initial.description || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div><label className="label">Session Name</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="2025-2026 Odd Semester" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Academic Year</label><input className="input" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} required placeholder="2025-2026" /></div>
        <div><label className="label">Semester</label>
          <select className="select" value={form.semester} onChange={e => set('semester', e.target.value)}>
            <option value="odd">Odd</option><option value="even">Even</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Start Date</label><input type="date" className="input" value={form.startDate} onChange={e => set('startDate', e.target.value)} required /></div>
        <div><label className="label">End Date</label><input type="date" className="input" value={form.endDate} onChange={e => set('endDate', e.target.value)} required /></div>
      </div>
      <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {initial._id ? 'Update' : 'Create'} Session
        </button>
      </div>
    </form>
  );
}

export default function AdminSessions() {
  const qc = useQueryClient();
  const [modal,    setModal]    = useState(false);
  const [editItem, setEditItem] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin-sessions'], queryFn: () => adminAPI.getSessions() });
  const inv = () => qc.invalidateQueries(['admin-sessions']);

  const createMut = useMutation({ mutationFn: adminAPI.createSession, onSuccess: () => { toast.success('Session created'); inv(); setModal(false); }, onError: e => toast.error(e.message) });
  const updateMut = useMutation({ mutationFn: ({ id, d }) => adminAPI.updateSession(id, d), onSuccess: () => { toast.success('Session updated'); inv(); setModal(false); setEditItem(null); }, onError: e => toast.error(e.message) });
  const setCurMut = useMutation({ mutationFn: adminAPI.setCurrentSession, onSuccess: () => { toast.success('Current session updated'); inv(); }, onError: e => toast.error(e.message) });

  const sessions = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Academic Sessions</h1><p className="page-subtitle">Manage semesters and academic years</p></div>
        <button onClick={() => { setEditItem(null); setModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> New Session</button>
      </div>

      {isLoading ? <PageLoader /> : error ? <ErrorAlert message={error.message} onRetry={refetch} /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.length === 0 ? <div className="card sm:col-span-3"><EmptyState icon={GraduationCap} title="No sessions" /></div> :
            sessions.map((s, i) => (
              <div key={i} className={`card p-5 ${s.isCurrent ? 'ring-2 ring-primary-500' : ''}`}>
                {s.isCurrent && <div className="flex items-center gap-1 text-xs text-primary-600 font-semibold mb-2"><Star className="w-3.5 h-3.5 fill-primary-600" /> Current</div>}
                <p className="text-base font-bold text-gray-800">{s.name}</p>
                <p className="text-sm text-gray-500 mt-0.5 capitalize">{s.academicYear} · {s.semester} Semester</p>
                <div className="text-xs text-gray-400 mt-2 space-y-0.5">
                  <p>{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setEditItem(s); setModal(true); }} className="btn-secondary btn-sm"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                  {!s.isCurrent && <button onClick={() => setCurMut.mutate(s._id)} disabled={setCurMut.isPending} className="btn-primary btn-sm"><Star className="w-3.5 h-3.5" /> Set Current</button>}
                </div>
              </div>
            ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditItem(null); }} title={editItem ? 'Edit Session' : 'New Session'}>
        <SessionForm initial={editItem || {}}
          loading={createMut.isPending || updateMut.isPending}
          onSubmit={(form) => editItem
            ? updateMut.mutate({ id: editItem._id, d: form })
            : createMut.mutate(form)} />
      </Modal>
    </div>
  );
}
