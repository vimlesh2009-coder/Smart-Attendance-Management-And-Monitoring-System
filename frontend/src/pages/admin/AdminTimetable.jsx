import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { Clock, Plus, Trash2, Edit2 } from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const PERIOD_TYPES = ['lecture','practical','tutorial','break','free'];

function PeriodEditor({ periods, onChange, subjects, faculty }) {
  const addPeriod = () => onChange([...periods, { periodNumber: periods.length+1, startTime:'09:00', endTime:'09:50', subject:'', faculty:'', room:'', type:'lecture' }]);
  const rem = (i) => onChange(periods.filter((_,j)=>j!==i));
  const upd = (i, k, v) => { const p=[...periods]; p[i]={...p[i],[k]:v}; onChange(p); };

  return (
    <div className="space-y-3">
      {periods.map((p, i) => (
        <div key={i} className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div><label className="label text-xs">Period #</label><input type="number" min={1} className="input text-sm" value={p.periodNumber} onChange={e=>upd(i,'periodNumber',e.target.value)}/></div>
          <div><label className="label text-xs">Start</label><input type="time" className="input text-sm" value={p.startTime} onChange={e=>upd(i,'startTime',e.target.value)}/></div>
          <div><label className="label text-xs">End</label><input type="time" className="input text-sm" value={p.endTime} onChange={e=>upd(i,'endTime',e.target.value)}/></div>
          <div><label className="label text-xs">Type</label>
            <select className="select text-sm" value={p.type} onChange={e=>upd(i,'type',e.target.value)}>
              {PERIOD_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label text-xs">Subject</label>
            <select className="select text-sm" value={p.subject} onChange={e=>upd(i,'subject',e.target.value)}>
              <option value="">None</option>
              {(subjects||[]).map(s=><option key={s._id} value={s._id}>{s.code} — {s.name}</option>)}
            </select>
          </div>
          <div><label className="label text-xs">Faculty</label>
            <select className="select text-sm" value={p.faculty} onChange={e=>upd(i,'faculty',e.target.value)}>
              <option value="">None</option>
              {(faculty||[]).map(f=><option key={f._id} value={f._id}>{f.user?.name}</option>)}
            </select>
          </div>
          <div><label className="label text-xs">Room</label><input className="input text-sm" value={p.room} onChange={e=>upd(i,'room',e.target.value)} placeholder="e.g. CSE-101"/></div>
          <div className="flex items-end">
            <button type="button" onClick={()=>rem(i)} className="btn-danger btn-sm w-full"><Trash2 className="w-3.5 h-3.5"/> Remove</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addPeriod} className="btn-secondary btn-sm"><Plus className="w-3.5 h-3.5"/> Add Period</button>
    </div>
  );
}

function TimetableForm({ initial={}, onSubmit, loading, sessionId }) {
  const deptQ = useQuery({ queryKey:['depts-dd'], queryFn:()=>adminAPI.getDepartments({limit:100}) });
  const [dept, setDept] = useState(initial.department?._id||initial.department||'');
  const sectQ = useQuery({ queryKey:['sections-dd',dept,sessionId], queryFn:()=>adminAPI.getSections({department:dept,academicSession:sessionId,limit:100}), enabled:!!dept&&!!sessionId });
  const subQ  = useQuery({ queryKey:['subjects-dd',dept], queryFn:()=>adminAPI.getSubjects({department:dept,limit:100}), enabled:!!dept });
  const facQ  = useQuery({ queryKey:['faculty-dd',dept],  queryFn:()=>adminAPI.getFaculty({department:dept,limit:100}),  enabled:!!dept });

  const [form, setForm] = useState({ section: initial.section?._id||initial.section||'', day: initial.day||'Monday', periods: initial.periods||[] });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <form onSubmit={e=>{e.preventDefault(); onSubmit({...form, academicSession:sessionId});}} className="space-y-4">
      <div><label className="label">Department</label>
        <select className="select" value={dept} onChange={e=>{setDept(e.target.value);set('section','');}} required>
          <option value="">Select…</option>
          {(deptQ.data?.data||[]).map(d=><option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Section</label>
          <select className="select" value={form.section} onChange={e=>set('section',e.target.value)} required disabled={!dept}>
            <option value="">Select…</option>
            {(sectQ.data?.data||[]).map(s=><option key={s._id} value={s._id}>Sec {s.name} Yr{s.year}</option>)}
          </select>
        </div>
        <div><label className="label">Day</label>
          <select className="select" value={form.day} onChange={e=>set('day',e.target.value)}>
            {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Periods</label>
        <PeriodEditor periods={form.periods} onChange={p=>set('periods',p)} subjects={subQ.data?.data||[]} faculty={facQ.data?.data||[]}/>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading||!form.section} className="btn-primary">
          {loading&&<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
          Save Timetable
        </button>
      </div>
    </form>
  );
}

export default function AdminTimetable() {
  const qc = useQueryClient();
  const [modal, setModal]   = useState(false);
  const [editItem, setEdit] = useState(null);
  const [sessionFilter, setSF] = useState('');
  const [sectionFilter, setSecF] = useState('');

  const sessionQ = useQuery({ queryKey:['sessions-dd'], queryFn:()=>adminAPI.getSessions({limit:50}) });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-timetable', sessionFilter, sectionFilter],
    queryFn:  () => adminAPI.getTimetable({ academicSession:sessionFilter, section:sectionFilter }),
    enabled:  !!sessionFilter,
  });

  const inv = () => qc.invalidateQueries(['admin-timetable']);
  const upsertMut = useMutation({ mutationFn:adminAPI.upsertTimetable, onSuccess:()=>{toast.success('Timetable saved');inv();setModal(false);setEdit(null);}, onError:e=>toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn:adminAPI.deleteTimetableDay, onSuccess:()=>{toast.success('Deleted');inv();}, onError:e=>toast.error(e.message) });

  const entries = data?.data || [];
  // Group by section
  const bySection = entries.reduce((acc,tt)=>{
    const k = tt.section?._id;
    if(!acc[k]) acc[k]={section:tt.section, days:[]};
    acc[k].days.push(tt);
    return acc;
  },{});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Timetable</h1><p className="page-subtitle">Manage weekly class schedules</p></div>
        <button onClick={()=>{setEdit(null);setModal(true);}} disabled={!sessionFilter} className="btn-primary"><Plus className="w-4 h-4"/> Add Entry</button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="select w-64" value={sessionFilter} onChange={e=>{setSF(e.target.value);setSecF('');}}>
          <option value="">Select session to view…</option>
          {(sessionQ.data?.data||[]).map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {!sessionFilter
        ? <div className="card p-10 text-center text-sm text-gray-400">Select an academic session to view timetables</div>
        : isLoading ? <PageLoader/>
        : error ? <ErrorAlert message={error.message} onRetry={refetch}/>
        : entries.length===0 ? <div className="card"><EmptyState icon={Clock} title="No timetable entries" description="Create entries using the Add Entry button."/></div>
        : Object.values(bySection).map(({section, days}) => (
          <div key={section?._id} className="card overflow-hidden">
            <div className="px-5 py-3 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary-700">Section {section?.name} — Year {section?.year} Sem {section?.semester}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {days.sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day)).map((tt,i)=>(
                <div key={i} className="px-5 py-3 flex items-start justify-between gap-4">
                  <div className="w-28 shrink-0">
                    <p className="text-sm font-semibold text-gray-700">{tt.day}</p>
                    <p className="text-xs text-gray-400">{tt.periods?.length} periods</p>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {(tt.periods||[]).map((p,j)=>(
                      <div key={j} className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                        <span className="font-semibold">P{p.periodNumber}</span> {p.subject?.code||'—'}
                        <span className="text-gray-400 ml-1">{p.startTime}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={()=>{setEdit(tt);setModal(true);}} className="btn-secondary btn-sm"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>deleteMut.mutate(tt._id)} disabled={deleteMut.isPending} className="btn-danger btn-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      }

      <Modal open={modal} onClose={()=>{setModal(false);setEdit(null);}} title={editItem?'Edit Timetable Entry':'New Timetable Entry'} size="xl">
        <TimetableForm initial={editItem||{}} loading={upsertMut.isPending} sessionId={sessionFilter}
          onSubmit={form=>upsertMut.mutate(form)}/>
      </Modal>
    </div>
  );
}
