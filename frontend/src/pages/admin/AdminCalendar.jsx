import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/admin';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { fmtDate } from '../../utils/helpers';
import { Calendar, Plus, Edit2, Trash2 } from 'lucide-react';

const EVENT_TYPES = ['holiday','exam','internal_exam','result','enrollment','fee_deadline','event','workshop','seminar','sports','cultural','working_day','other'];
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

function EventForm({ initial={}, onSubmit, loading }) {
  const sessionQ = useQuery({ queryKey:['sessions-dd'], queryFn:()=>adminAPI.getSessions({limit:50}) });
  const [form, setForm] = useState({
    title:       initial.title||'',
    description: initial.description||'',
    type:        initial.type||'event',
    startDate:   initial.startDate ? initial.startDate.split('T')[0] : '',
    endDate:     initial.endDate   ? initial.endDate.split('T')[0]   : '',
    isHoliday:   initial.isHoliday||false,
    venue:       initial.venue||'',
    color:       initial.color||'#3b82f6',
    academicSession: initial.academicSession?._id||initial.academicSession||'',
    isAllDepartments: true,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(form);}} className="space-y-4">
      <div><label className="label">Event Title</label><input className="input" value={form.title} onChange={e=>set('title',e.target.value)} required/></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Type</label>
          <select className="select" value={form.type} onChange={e=>set('type',e.target.value)}>
            {EVENT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div><label className="label">Session (optional)</label>
          <select className="select" value={form.academicSession} onChange={e=>set('academicSession',e.target.value)}>
            <option value="">None</option>
            {(sessionQ.data?.data||[]).map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Start Date</label><input type="date" className="input" value={form.startDate} onChange={e=>set('startDate',e.target.value)} required/></div>
        <div><label className="label">End Date</label><input type="date" className="input" value={form.endDate} onChange={e=>set('endDate',e.target.value)} required/></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Venue (optional)</label><input className="input" value={form.venue} onChange={e=>set('venue',e.target.value)}/></div>
        <div><label className="label">Color</label>
          <div className="flex gap-2 mt-1">
            {COLORS.map(c=>(
              <button key={c} type="button" onClick={()=>set('color',c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${form.color===c?'border-gray-800 scale-110':'border-transparent'}`}
                style={{backgroundColor:c}}/>
            ))}
          </div>
        </div>
      </div>
      <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e=>set('description',e.target.value)}/></div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="hol" checked={form.isHoliday} onChange={e=>set('isHoliday',e.target.checked)} className="w-4 h-4"/>
        <label htmlFor="hol" className="text-sm text-gray-700">Mark as Holiday (non-working day)</label>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading&&<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
          {initial._id?'Update':'Create'} Event
        </button>
      </div>
    </form>
  );
}

export default function AdminCalendar() {
  const qc = useQueryClient();
  const [modal, setModal]    = useState(false);
  const [editItem, setEdit]  = useState(null);
  const [delTarget, setDel]  = useState(null);
  const [sessionFilter, setSF] = useState('');

  const sessionQ = useQuery({ queryKey:['sessions-dd'], queryFn:()=>adminAPI.getSessions({limit:50}) });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-calendar', sessionFilter],
    queryFn:  () => adminAPI.getCalendarEvents({ academicSession:sessionFilter }),
  });

  const inv = () => qc.invalidateQueries(['admin-calendar']);
  const createMut = useMutation({ mutationFn:adminAPI.createCalendarEvent, onSuccess:()=>{toast.success('Event created');inv();setModal(false);}, onError:e=>toast.error(e.message) });
  const updateMut = useMutation({ mutationFn:({id,d})=>adminAPI.updateCalendarEvent(id,d), onSuccess:()=>{toast.success('Updated');inv();setModal(false);setEdit(null);}, onError:e=>toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn:adminAPI.deleteCalendarEvent, onSuccess:()=>{toast.success('Deleted');inv();setDel(null);}, onError:e=>toast.error(e.message) });

  const events = data?.data||[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Academic Calendar</h1></div>
        <button onClick={()=>{setEdit(null);setModal(true);}} className="btn-primary"><Plus className="w-4 h-4"/> Add Event</button>
      </div>
      <div className="card p-4">
        <select className="select w-56" value={sessionFilter} onChange={e=>setSF(e.target.value)}>
          <option value="">All Sessions</option>
          {(sessionQ.data?.data||[]).map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>
      {isLoading?<PageLoader/>:error?<ErrorAlert message={error.message} onRetry={refetch}/>:(
        <div className="card">
          {events.length===0?<EmptyState icon={Calendar} title="No calendar events"/>:(
            <div className="divide-y divide-gray-100">
              {events.map((ev,i)=>(
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-1 h-12 rounded-full shrink-0" style={{backgroundColor:ev.color||'#3b82f6'}}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{ev.title}</p>
                      {ev.isHoliday&&<span className="badge badge-red">Holiday</span>}
                      <span className="badge badge-gray capitalize">{ev.type?.replace(/_/g,' ')}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtDate(ev.startDate)} → {fmtDate(ev.endDate)}</p>
                    {ev.venue&&<p className="text-xs text-gray-400">📍 {ev.venue}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={()=>{setEdit(ev);setModal(true);}} className="btn-secondary btn-sm"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>setDel(ev._id)} className="btn-danger btn-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <Modal open={modal} onClose={()=>{setModal(false);setEdit(null);}} title={editItem?'Edit Event':'New Calendar Event'}>
        <EventForm initial={editItem||{}} loading={createMut.isPending||updateMut.isPending}
          onSubmit={form=>editItem?updateMut.mutate({id:editItem._id,d:form}):createMut.mutate(form)}/>
      </Modal>
      <ConfirmDialog open={!!delTarget} onClose={()=>setDel(null)} onConfirm={()=>deleteMut.mutate(delTarget)}
        loading={deleteMut.isPending} title="Delete Event" message="This will permanently delete the calendar event."/>
    </div>
  );
}
