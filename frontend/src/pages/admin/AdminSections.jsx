import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { Pagination } from '../../components/shared/Pagination';
import { BookMarked, Plus, Edit2 } from 'lucide-react';

function SectionForm({ initial={}, onSubmit, loading }) {
  const deptQ    = useQuery({ queryKey:['depts-dd'], queryFn:()=>adminAPI.getDepartments({limit:100}) });
  const sessionQ = useQuery({ queryKey:['sessions-dd'], queryFn:()=>adminAPI.getSessions({limit:50}) });
  const [form, setForm] = useState({ name:initial.name||'', department:initial.department?._id||initial.department||'', academicSession:initial.academicSession?._id||initial.academicSession||'', year:initial.year||1, semester:initial.semester||1, maxStrength:initial.maxStrength||60 });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(form);}} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Section Name</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)} required placeholder="A"/></div>
        <div><label className="label">Max Strength</label><input type="number" className="input" value={form.maxStrength} onChange={e=>set('maxStrength',e.target.value)} min={1}/></div>
      </div>
      <div><label className="label">Department</label>
        <select className="select" value={form.department} onChange={e=>set('department',e.target.value)} required>
          <option value="">Select…</option>
          {(deptQ.data?.data||[]).map(d=><option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
        </select>
      </div>
      <div><label className="label">Academic Session</label>
        <select className="select" value={form.academicSession} onChange={e=>set('academicSession',e.target.value)} required>
          <option value="">Select…</option>
          {(sessionQ.data?.data||[]).map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Year</label><input type="number" className="input" min={1} max={5} value={form.year} onChange={e=>set('year',e.target.value)} required/></div>
        <div><label className="label">Semester</label><input type="number" className="input" min={1} max={10} value={form.semester} onChange={e=>set('semester',e.target.value)} required/></div>
      </div>
      <div className="flex justify-end"><button type="submit" disabled={loading} className="btn-primary">{loading&&<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}{initial._id?'Update':'Create'}</button></div>
    </form>
  );
}

export default function AdminSections() {
  const qc=useQueryClient();
  const [page,setPage]=useState(1);
  const [modal,setModal]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [filters,setFilters]=useState({});

  const deptQ=useQuery({queryKey:['depts-dd'],queryFn:()=>adminAPI.getDepartments({limit:100})});
  const {data,isLoading,error,refetch}=useQuery({queryKey:['admin-sections',page,filters],queryFn:()=>adminAPI.getSections({page,limit:15,...filters})});
  const inv=()=>qc.invalidateQueries(['admin-sections']);
  const createMut=useMutation({mutationFn:adminAPI.createSection,onSuccess:()=>{toast.success('Section created');inv();setModal(false);},onError:e=>toast.error(e.message)});
  const updateMut=useMutation({mutationFn:({id,d})=>adminAPI.updateSection(id,d),onSuccess:()=>{toast.success('Updated');inv();setModal(false);setEditItem(null);},onError:e=>toast.error(e.message)});

  const sections=data?.data||[];
  const pg=data?.pagination||{};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Sections</h1><p className="page-subtitle">Manage class sections</p></div>
        <button onClick={()=>{setEditItem(null);setModal(true);}} className="btn-primary"><Plus className="w-4 h-4"/>New Section</button>
      </div>
      {/* Filter bar */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="select w-44" value={filters.department||''} onChange={e=>setFilters(f=>({...f,department:e.target.value}))}>
          <option value="">All Departments</option>
          {(deptQ.data?.data||[]).map(d=><option key={d._id} value={d._id}>{d.code}</option>)}
        </select>
        <select className="select w-28" value={filters.year||''} onChange={e=>setFilters(f=>({...f,year:e.target.value}))}>
          <option value="">All Years</option>
          {[1,2,3,4,5].map(y=><option key={y} value={y}>Year {y}</option>)}
        </select>
      </div>
      {isLoading?<PageLoader/>:error?<ErrorAlert message={error.message} onRetry={refetch}/>:(
        <div className="card">
          {sections.length===0?<EmptyState icon={BookMarked} title="No sections"/>:(
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Section</th><th>Department</th><th>Session</th><th>Year/Sem</th><th>Max</th><th>Actions</th></tr></thead>
                  <tbody>
                    {sections.map((s,i)=>(
                      <tr key={i}>
                        <td className="font-bold text-lg">{s.name}</td>
                        <td><span className="badge badge-blue">{s.department?.code}</span></td>
                        <td className="text-xs text-gray-500">{s.academicSession?.name}</td>
                        <td>Yr {s.year} · Sem {s.semester}</td>
                        <td>{s.maxStrength}</td>
                        <td><button onClick={()=>{setEditItem(s);setModal(true);}} className="btn-secondary btn-sm"><Edit2 className="w-3.5 h-3.5"/>Edit</button></td>
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
      <Modal open={modal} onClose={()=>{setModal(false);setEditItem(null);}} title={editItem?'Edit Section':'New Section'}>
        <SectionForm initial={editItem||{}} loading={createMut.isPending||updateMut.isPending}
          onSubmit={form=>editItem?updateMut.mutate({id:editItem._id,d:form}):createMut.mutate(form)}/>
      </Modal>
    </div>
  );
}
