import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { Pagination } from '../../components/shared/Pagination';
import { BookOpen, Plus, Edit2 } from 'lucide-react';

function SubjectForm({ initial = {}, onSubmit, loading }) {
  const deptQ = useQuery({ queryKey: ['depts-dd'], queryFn: () => adminAPI.getDepartments({ limit: 100 }) });
  const [form, setForm] = useState({
    name: initial.name || '', code: initial.code || '',
    department: initial.department?._id || initial.department || '',
    type: initial.type || 'theory', credits: initial.credits || 4,
    weeklyLectures: initial.weeklyLectures || 3,
    year: initial.year || 2, semester: initial.semester || 3,
    description: initial.description || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Subject Name</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
        <div><label className="label">Code</label><input className="input uppercase" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} required placeholder="CSE301" /></div>
      </div>
      <div><label className="label">Department</label>
        <select className="select" value={form.department} onChange={e => set('department', e.target.value)} required>
          <option value="">Select…</option>
          {(deptQ.data?.data || []).map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Type</label>
          <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
            {['theory','practical','elective','lab'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="label">Credits</label><input type="number" className="input" min={0} max={10} step={0.5} value={form.credits} onChange={e => set('credits', e.target.value)} required /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="label">Year</label><input type="number" className="input" min={1} max={5} value={form.year} onChange={e => set('year', e.target.value)} required /></div>
        <div><label className="label">Semester</label><input type="number" className="input" min={1} max={10} value={form.semester} onChange={e => set('semester', e.target.value)} required /></div>
        <div><label className="label">Weekly Lectures</label><input type="number" className="input" min={0} value={form.weeklyLectures} onChange={e => set('weeklyLectures', e.target.value)} /></div>
      </div>
      <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {initial._id ? 'Update' : 'Create'} Subject
        </button>
      </div>
    </form>
  );
}

export default function AdminSubjects() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editItem, setEdit] = useState(null);
  const [deptFilter, setDeptFilter] = useState('');

  const deptQ = useQuery({ queryKey: ['depts-dd'], queryFn: () => adminAPI.getDepartments({ limit: 100 }) });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-subjects', page, deptFilter],
    queryFn:  () => adminAPI.getSubjects({ page, limit: 15, department: deptFilter }),
  });

  const inv = () => qc.invalidateQueries(['admin-subjects']);
  const createMut = useMutation({ mutationFn: adminAPI.createSubject, onSuccess: () => { toast.success('Subject created'); inv(); setModal(false); }, onError: e => toast.error(e.message) });
  const updateMut = useMutation({ mutationFn: ({ id, d }) => adminAPI.updateSubject(id, d), onSuccess: () => { toast.success('Updated'); inv(); setModal(false); setEdit(null); }, onError: e => toast.error(e.message) });

  const subjects = data?.data || [];
  const pg = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Subjects</h1><p className="page-subtitle">Total: {pg.total ?? '…'}</p></div>
        <button onClick={() => { setEdit(null); setModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Add Subject</button>
      </div>
      <div className="card p-4 flex gap-3">
        <select className="select w-52" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {(deptQ.data?.data || []).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>
      {isLoading ? <PageLoader /> : error ? <ErrorAlert message={error.message} onRetry={refetch} /> : (
        <div className="card">
          {subjects.length === 0 ? <EmptyState icon={BookOpen} title="No subjects" /> : (
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Name</th><th>Code</th><th>Dept</th><th>Type</th><th>Credits</th><th>Year/Sem</th><th>Actions</th></tr></thead>
                  <tbody>
                    {subjects.map((s, i) => (
                      <tr key={i}>
                        <td className="font-medium">{s.name}</td>
                        <td><span className="font-mono text-xs badge badge-gray">{s.code}</span></td>
                        <td><span className="badge badge-blue">{s.department?.code}</span></td>
                        <td><span className="badge badge-gray capitalize">{s.type}</span></td>
                        <td>{s.credits}</td>
                        <td>Yr {s.year} Sem {s.semester}</td>
                        <td><button onClick={() => { setEdit(s); setModal(true); }} className="btn-secondary btn-sm"><Edit2 className="w-3.5 h-3.5" /> Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={pg.pages} total={pg.total} limit={15} onPage={setPage} />
            </>
          )}
        </div>
      )}
      <Modal open={modal} onClose={() => { setModal(false); setEdit(null); }} title={editItem ? 'Edit Subject' : 'Add Subject'}>
        <SubjectForm initial={editItem || {}} loading={createMut.isPending || updateMut.isPending}
          onSubmit={form => editItem ? updateMut.mutate({ id: editItem._id, d: form }) : createMut.mutate(form)} />
      </Modal>
    </div>
  );
}
