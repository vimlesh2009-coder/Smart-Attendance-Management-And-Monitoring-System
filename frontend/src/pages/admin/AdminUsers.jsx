import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { Pagination } from '../../components/shared/Pagination';
import { getInitials, fmtDate } from '../../utils/helpers';
import { Users, Key, Edit2, Search, Eye, EyeOff, ShieldCheck } from 'lucide-react';

// ── Password Reset Modal ───────────────────────────────────────────────────────
function ResetPasswordModal({ open, onClose, user }) {
  const qc = useQueryClient();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [error,       setError]       = useState('');

  const mut = useMutation({
    mutationFn: () => adminAPI.resetUserPassword(user._id, { newPassword }),
    onSuccess: () => {
      toast.success(`Password reset for ${user.name}`);
      setNewPassword(''); setConfirmPwd(''); setError('');
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const handle = (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPwd) return setError('Passwords do not match');
    mut.mutate();
  };

  return (
    <Modal open={open} onClose={() => { onClose(); setNewPassword(''); setConfirmPwd(''); setError(''); }} title="Reset Password" size="sm">
      <div className="mb-4 p-3 rounded-xl bg-gray-50 flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
          {getInitials(user?.name)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email} · <span className="capitalize">{user?.role}</span></p>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handle} className="space-y-4">
        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'} value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input pr-10" placeholder="Min 6 characters" required
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Confirm Password</label>
          <input
            type="password" value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            className="input" placeholder="Re-enter password" required
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mut.isPending} className="btn-primary">
            {mut.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <Key className="w-4 h-4" /> Reset Password
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Details Modal ─────────────────────────────────────────────────────────
function EditDetailsModal({ open, onClose, user }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name:     user?.name     || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
    isActive: user?.isActive !== false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () => adminAPI.updateUserDetails(user._id, form),
    onSuccess: () => {
      toast.success('Details updated');
      qc.invalidateQueries(['admin-users']);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Modal open={open} onClose={onClose} title="Edit User Details" size="sm">
      <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} required />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile" />
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <input type="checkbox" id="active" checked={form.isActive}
            onChange={e => set('isActive', e.target.checked)} className="w-4 h-4" />
          <label htmlFor="active" className="text-sm text-gray-700 select-none">
            Account Active (uncheck to deactivate login)
          </label>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mut.isPending} className="btn-primary">
            {mut.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Role color helper ──────────────────────────────────────────────────────────
const ROLE_CLS = {
  admin:   'bg-purple-100 text-purple-700',
  hod:     'bg-green-100 text-green-700',
  faculty: 'bg-blue-100 text-blue-700',
  student: 'bg-orange-100 text-orange-700',
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [page,        setPage]   = useState(1);
  const [search,      setSearch] = useState('');
  const [roleFilter,  setRole]   = useState('');
  const [pwdTarget,   setPwd]    = useState(null);
  const [editTarget,  setEdit]   = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', page, roleFilter],
    queryFn:  () => adminAPI.getAllUsers({ page, limit: 15, role: roleFilter }),
  });

  const users = (data?.data || []).filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const pg = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary-600" /> User Management
        </h1>
        <p className="page-subtitle">Change username, password, and account status for all roles</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-2">
        <Key className="w-4 h-4 mt-0.5 shrink-0" />
        <span>As admin you can reset <b>anyone's password</b> and update their name/email/phone/status. Users will be logged out after a password reset.</span>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search name or email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select w-36" value={roleFilter} onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="hod">HOD</option>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
        </select>
      </div>

      {isLoading ? <PageLoader /> : error ? <ErrorAlert message={error.message} onRetry={refetch} /> : (
        <div className="card">
          {users.length === 0
            ? <EmptyState icon={Users} title="No users found" />
            : (
              <>
                <div className="divide-y divide-gray-100">
                  {users.map((u, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                        {getInitials(u.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_CLS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                            {u.role?.toUpperCase()}
                          </span>
                          <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                        {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                        <p className="text-xs text-gray-400">Last login: {u.lastLogin ? fmtDate(u.lastLogin) : 'Never'}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setEdit(u)} className="btn-secondary btn-sm">
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => setPwd(u)} className="btn-primary btn-sm">
                          <Key className="w-3.5 h-3.5" /> Reset Password
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

      {/* Reset Password Modal */}
      {pwdTarget && (
        <ResetPasswordModal
          open={!!pwdTarget}
          onClose={() => setPwd(null)}
          user={pwdTarget}
        />
      )}

      {/* Edit Details Modal */}
      {editTarget && (
        <EditDetailsModal
          open={!!editTarget}
          onClose={() => setEdit(null)}
          user={editTarget}
        />
      )}
    </div>
  );
}
