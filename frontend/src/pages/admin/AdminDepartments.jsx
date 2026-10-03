import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { Building2, Plus, Edit2, UserCog } from 'lucide-react';

function DeptForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({ name: initial.name||'', code: initial.code||'', description: initial.description||'', establishedYear: initial.establishedYear||'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(form);}} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Department Name</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)} required /></div>
        <div><label className="label">Code</label><input className="input uppercase" value={form.code} onChange={e=>set('code',e.target.value.toUpperCase())} required placeholder="CSE" maxLength={10} /></div>
      </div>
      <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e=>set('description',e.target.value)} /></div>
      <div><label className="label">Established Year</label><input type="number" className="input" value={form.establishedYear} onChange={e=>set('establishedYear',e.target.value)} /></div>
      <div className="flex justify-end"><button type="submit" disabled={loading} className="btn-primary">{loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}{initial._id?'Update':'Create'}</button></div>
    </form>
  );
}

function HodAssignModal({ deptId, open, onClose }) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState('');
  const facQ = useQuery({ queryKey:['all-faculty-users'], queryFn:()=>adminAPI.getFaculty({limit:100}), enabled:open });
  const mut  = useMutation({ mutationFn:()=>adminAPI.assignHOD(deptId,{userId}), onSuccess:()=>{toast.success('HOD assigned');qc.invalidateQueries(['admin-departments']);onClose();}, onError:e=>toast.error(e.message) });
  return (
    <Modal open={open} onClose={onClose} title="Assign HOD" size="sm">
      <div className="space-y-4">
        <div><label className="label">Select Faculty</label>
          <select className="select" value={userId} onChange={e=>setUserId(e.target.value)}>
            <option value="">Choose…</option>
            {(facQ.data?.data||[]).map(f=><option key={f.user?._id} value={f.user?._id}>{f.user?.name} ({f.employeeId})</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={()=>mut.mutate()} disabled={!userId||mut.isPending} className="btn-primary">{mut.isPending&&<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}Assign</button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminDepartments() {
  const qc = useQueryClient();
  const [modal,    setModal]    = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [hodDept,  setHodDept]  = useState(null);

  const { data, isLoading, error, refetch } = useQuery({ queryKey:['admin-departments'], queryFn:()=>adminAPI.getDepartments() });
  const inv = ()=>qc.invalidateQueries(['admin-departments']);
  const createMut = useMutation({ mutationFn:adminAPI.createDepartment, onSuccess:()=>{toast.success('Department created');inv();setModal(false);}, onError:e=>toast.error(e.message) });
  const updateMut = useMutation({ mutationFn:({id,d})=>adminAPI.updateDepartment(id,d), onSuccess:()=>{toast.success('Updated');inv();setModal(false);setEditItem(null);}, onError:e=>toast.error(e.message) });

  const depts = data?.data||[];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Departments</h1><p className="page-subtitle">Manage academic departments</p></div>
        <button onClick={()=>{setEditItem(null);setModal(true);}} className="btn-primary"><Plus className="w-4 h-4"/>New Department</button>
      </div>
      {isLoading?<PageLoader/>:error?<ErrorAlert message={error.message} onRetry={refetch}/>:(
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.length===0?<div className="card sm:col-span-3"><EmptyState icon={Building2} title="No departments"/></div>:
            depts.map((d,i)=>(
              <div key={i} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold text-gray-800">{d.name}</p>
                    <span className="badge badge-blue">{d.code}</span>
                  </div>
                  <span className={`badge ${d.isActive?'badge-green':'badge-gray'}`}>{d.isActive?'Active':'Inactive'}</span>
                </div>
                {d.hod && <p className="text-xs text-gray-500 mb-1">HOD: <span className="font-medium text-gray-700">{d.hod.name||d.hod.email}</span></p>}
                {d.establishedYear && <p className="text-xs text-gray-400">Est. {d.establishedYear}</p>}
                <div className="flex gap-2 mt-4">
                  <button onClick={()=>{setEditItem(d);setModal(true);}} className="btn-secondary btn-sm"><Edit2 className="w-3.5 h-3.5"/>Edit</button>
                  <button onClick={()=>setHodDept(d._id)} className="btn-secondary btn-sm"><UserCog className="w-3.5 h-3.5"/>Assign HOD</button>
                </div>
              </div>
            ))}
        </div>
      )}
      <Modal open={modal} onClose={()=>{setModal(false);setEditItem(null);}} title={editItem?'Edit Department':'New Department'}>
        <DeptForm initial={editItem||{}} loading={createMut.isPending||updateMut.isPending}
          onSubmit={form=>editItem?updateMut.mutate({id:editItem._id,d:form}):createMut.mutate(form)}/>
      </Modal>
      <HodAssignModal deptId={hodDept} open={!!hodDept} onClose={()=>setHodDept(null)}/>
    </div>
  );
}
