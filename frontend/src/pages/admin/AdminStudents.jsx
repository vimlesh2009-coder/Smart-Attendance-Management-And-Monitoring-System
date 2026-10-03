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
import { Users, Plus, Edit2, Search, Trash2 } from 'lucide-react';

function StudentForm({ initial = {}, onSubmit, loading }) {
  const deptQ    = useQuery({ queryKey: ['depts-dd'],    queryFn: () => adminAPI.getDepartments({ limit: 100 }) });
  const sessionQ = useQuery({ queryKey: ['sessions-dd'], queryFn: () => adminAPI.getSessions({ limit: 50 }) });
  const [dept, setDept] = useState(initial.department?._id || initial.department || '');
  const sectQ = useQuery({ queryKey: ['sections-dd', dept], queryFn: () => adminAPI.getSections({ department: dept, limit: 100 }), enabled: !!dept });

  const isEdit = !!initial._id;
  const [form, setForm] = useState({
    name: initial.user?.name || '', email: initial.user?.email || '',
    password: '', phone: initial.user?.phone || '',
    enrollmentNo: initial.enrollmentNo || '', rollNo: initial.rollNo || '',
    department: dept, section: initial.section?._id || initial.section || '',
    academicSession: initial.academicSession?._id || initial.academicSession || '',
    year: initial.year || 2, semester: initial.semester || 3,
    gender: initial.gender || '', parentName: initial.parentName || '',
    parentPhone: initial.parentPhone || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
        <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} required={!isEdit} disabled={isEdit} /></div>
      </div>
      {!isEdit && <div><label className="label">Password</label><input type="password" className="input" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} /></div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Enrollment No.</label><input className="input font-mono" value={form.enrollmentNo} onChange={e => set('enrollmentNo', e.target.value)} required={!isEdit} disabled={isEdit} /></div>
        <div><label className="label">Roll No.</label><input className="input" value={form.rollNo} onChange={e => set('rollNo', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
        <div><label className="label">Gender</label>
          <select className="select" value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </div>
      </div>
      <div><label className="label">Department</label>
        <select className="select" value={form.department} onChange={e => { set('department', e.target.value); setDept(e.target.value); set('section', ''); }} required>
          <option value="">Select…</option>
          {(deptQ.data?.data || []).map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Section</label>
          <select className="select" value={form.section} onChange={e => set('section', e.target.value)} required>
            <option value="">Select…</option>
            {(sectQ.data?.data || []).map(s => <option key={s._id} value={s._id}>Sec {s.name} Yr{s.year}</option>)}
          </select>
        </div>
        <div><label className="label">Session</label>
          <select className="select" value={form.academicSession} onChange={e => set('academicSession', e.target.value)} required>
            <option value="">Select…</option>
            {(sessionQ.data?.data || []).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Year</label><input type="number" className="input" min={1} max={5} value={form.year} onChange={e => set('year', e.target.value)} required /></div>
        <div><label className="label">Semester</label><input type="number" className="input" min={1} max={10} value={form.semester} onChange={e => set('semester', e.target.value)} required /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Parent Name</label><input className="input" value={form.parentName} onChange={e => set('parentName', e.target.value)} /></div>
        <div><label className="label">Parent Phone</label><input className="input" value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} /></div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {isEdit ? 'Update Student' : 'Create Student'}
        </button>
      </div>
    </form>
  );
}

export default function AdminStudents() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [modal, setModal]     = useState(false);
  const [editItem, setEdit]   = useState(null);
  const [search, setSearch]   = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [delTarget, setDel]   = useState(null); // { id, name }

  const deptQ = useQuery({ queryKey: ['depts-dd'], queryFn: () => adminAPI.getDepartments({ limit: 100 }) });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-students', page, deptFilter],
    queryFn:  () => adminAPI.getStudents({ page, limit: 15, department: deptFilter }),
  });

  const inv = () => qc.invalidateQueries(['admin-students']);
  const createMut = useMutation({ mutationFn: adminAPI.createStudent, onSuccess: () => { toast.success('Student created'); inv(); setModal(false); }, onError: e => toast.error(e.message) });
  const updateMut = useMutation({ mutationFn: ({ id, d }) => adminAPI.updateStudent(id, d), onSuccess: () => { toast.success('Updated'); inv(); setModal(false); setEdit(null); }, onError: e => toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn: (id) => adminAPI.deleteStudent(id), onSuccess: () => { toast.success('Student deleted'); inv(); setDel(null); }, onError: e => toast.error(e.message) });

  const students = (data?.data || []).filter(s =>
    !search || s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollmentNo?.toLowerCase().includes(search.toLowerCase())
  );
  const pg = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Students</h1><p className="page-subtitle">Total: {pg.total ?? '…'}</p></div>
        <button onClick={() => { setEdit(null); setModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Add Student</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search name or enrollment…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select w-44" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {(deptQ.data?.data || []).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      {isLoading ? <PageLoader /> : error ? <ErrorAlert message={error.message} onRetry={refetch} /> : (
        <div className="card">
          {students.length === 0 ? <EmptyState icon={Users} title="No students found" /> : (
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>#</th><th>Name</th><th>Enrollment No.</th><th>Roll No</th><th>Section</th><th>Dept</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i}>
                        <td className="text-gray-400">{(page-1)*15+i+1}</td>
                        <td>
                          <div>
                            <p className="font-medium text-gray-800">{s.user?.name}</p>
                            <p className="text-xs text-gray-400">{s.user?.email}</p>
                          </div>
                        </td>
                        <td className="font-mono text-xs">{s.enrollmentNo}</td>
                        <td>{s.rollNo || '—'}</td>
                        <td><span className="badge badge-blue">Sec {s.section?.name} Yr{s.section?.year}</span></td>
                        <td><span className="badge badge-gray">{s.department?.code}</span></td>
                        <td><span className={`badge ${s.isActive ? 'badge-green' : 'badge-red'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEdit(s); setModal(true); }} className="btn-secondary btn-sm">
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => setDel({ id: s._id, name: s.user?.name })} className="btn-danger btn-sm">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
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

      <Modal open={modal} onClose={() => { setModal(false); setEdit(null); }} title={editItem ? 'Edit Student' : 'Add Student'} size="lg">
        <StudentForm initial={editItem || {}} loading={createMut.isPending || updateMut.isPending}
          onSubmit={form => editItem ? updateMut.mutate({ id: editItem._id, d: form }) : createMut.mutate(form)} />
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDel(null)}
        onConfirm={() => deleteMut.mutate(delTarget?.id)}
        loading={deleteMut.isPending}
        title="Delete Student"
        message={`Are you sure you want to delete "${delTarget?.name}"? This will permanently remove their account and all associated data.`}
        variant="danger"
      />
    </div>
  );
}
