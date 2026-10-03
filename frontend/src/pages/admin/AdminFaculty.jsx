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
import { getInitials } from '../../utils/helpers';
import { UserCheck, Plus, Edit2, Search, Trash2 } from 'lucide-react';

const DESIGNATIONS = ['Professor','Associate Professor','Assistant Professor','Lecturer','Lab Instructor','HOD'];

function FacultyForm({ initial = {}, onSubmit, loading }) {
  const deptQ = useQuery({ queryKey: ['depts-dd'], queryFn: () => adminAPI.getDepartments({ limit: 100 }) });
  const isEdit = !!initial._id;
  const [form, setForm] = useState({
    name: initial.user?.name || '', email: initial.user?.email || '',
    password: '', phone: initial.user?.phone || '',
    employeeId: initial.employeeId || '',
    department: initial.department?._id || initial.department || '',
    designation: initial.designation || 'Assistant Professor',
    qualification: initial.qualification || '',
    specialization: initial.specialization || '',
    joiningDate: initial.joiningDate ? initial.joiningDate.split('T')[0] : '',
    role: initial.user?.role === 'hod' ? 'hod' : 'faculty',
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
        <div><label className="label">Employee ID</label><input className="input" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} required={!isEdit} disabled={isEdit} /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
      </div>
      <div><label className="label">Department</label>
        <select className="select" value={form.department} onChange={e => set('department', e.target.value)} required>
          <option value="">Select…</option>
          {(deptQ.data?.data || []).map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Designation</label>
          <select className="select" value={form.designation} onChange={e => set('designation', e.target.value)}>
            {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div><label className="label">Role</label>
          <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="faculty">Faculty</option><option value="hod">HOD</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Qualification</label><input className="input" value={form.qualification} onChange={e => set('qualification', e.target.value)} placeholder="M.Tech, Ph.D…" /></div>
        <div><label className="label">Specialization</label><input className="input" value={form.specialization} onChange={e => set('specialization', e.target.value)} /></div>
      </div>
      <div><label className="label">Joining Date</label><input type="date" className="input" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} required={!isEdit} /></div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {isEdit ? 'Update Faculty' : 'Create Faculty'}
        </button>
      </div>
    </form>
  );
}

export default function AdminFaculty() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [modal, setModal]     = useState(false);
  const [editItem, setEdit]   = useState(null);
  const [search, setSearch]   = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [delTarget, setDel]   = useState(null); // { id, name }

  const deptQ = useQuery({ queryKey: ['depts-dd'], queryFn: () => adminAPI.getDepartments({ limit: 100 }) });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-faculty', page, deptFilter],
    queryFn:  () => adminAPI.getFaculty({ page, limit: 15, department: deptFilter }),
  });

  const inv = () => qc.invalidateQueries(['admin-faculty']);
  const createMut = useMutation({ mutationFn: adminAPI.createFaculty, onSuccess: () => { toast.success('Faculty created'); inv(); setModal(false); }, onError: e => toast.error(e.message) });
  const updateMut = useMutation({ mutationFn: ({ id, d }) => adminAPI.updateFaculty(id, d), onSuccess: () => { toast.success('Updated'); inv(); setModal(false); setEdit(null); }, onError: e => toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn: (id) => adminAPI.deleteFaculty(id), onSuccess: () => { toast.success('Faculty deleted'); inv(); setDel(null); }, onError: e => toast.error(e.message) });

  const faculty = (data?.data || []).filter(f =>
    !search || f.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.employeeId?.toLowerCase().includes(search.toLowerCase())
  );
  const pg = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Faculty</h1><p className="page-subtitle">Total: {pg.total ?? '…'}</p></div>
        <button onClick={() => { setEdit(null); setModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Add Faculty</button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search name or employee ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select w-44" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {(deptQ.data?.data || []).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      {isLoading ? <PageLoader /> : error ? <ErrorAlert message={error.message} onRetry={refetch} /> : (
        <div className="card">
          {faculty.length === 0 ? <EmptyState icon={UserCheck} title="No faculty found" /> : (
            <>
              <div className="divide-y divide-gray-100">
                {faculty.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                      {getInitials(f.user?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{f.user?.name}</p>
                        <span className="badge badge-gray">{f.employeeId}</span>
                        <span className={`badge ${f.user?.role === 'hod' ? 'badge-green' : 'badge-blue'}`}>{f.user?.role?.toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-gray-500">{f.designation} · {f.department?.name}</p>
                      <p className="text-xs text-gray-400">{f.user?.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => { setEdit(f); setModal(true); }} className="btn-secondary btn-sm">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => setDel({ id: f._id, name: f.user?.name })} className="btn-danger btn-sm">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} pages={pg.pages} total={pg.total} limit={15} onPage={setPage} />
            </>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEdit(null); }} title={editItem ? 'Edit Faculty' : 'Add Faculty'} size="lg">
        <FacultyForm initial={editItem || {}} loading={createMut.isPending || updateMut.isPending}
          onSubmit={form => editItem ? updateMut.mutate({ id: editItem._id, d: form }) : createMut.mutate(form)} />
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDel(null)}
        onConfirm={() => deleteMut.mutate(delTarget?.id)}
        loading={deleteMut.isPending}
        title="Delete Faculty"
        message={`Are you sure you want to delete "${delTarget?.name}"? This will permanently remove their account and all subject assignments.`}
        variant="danger"
      />
    </div>
  );
}
