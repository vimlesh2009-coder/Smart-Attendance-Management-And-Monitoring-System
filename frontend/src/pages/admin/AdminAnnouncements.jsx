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
import { fmtDate } from '../../utils/helpers';
import { Bell, Plus, Edit2, Trash2 } from 'lucide-react';

const A_TYPES    = ['general','academic','exam','holiday','fee','event','urgent'];
const AUDIENCES  = ['all','students','faculty','department','section'];
const PRIORITIES = ['low','medium','high','urgent'];
const TYPE_CLS   = { general:'badge-gray', academic:'badge-blue', exam:'badge-purple', holiday:'badge-green', fee:'badge-yellow', event:'badge-blue', urgent:'badge-red' };

function AnnouncementForm({ initial={}, onSubmit, loading }) {
  const [form, setForm] = useState({
    title:          initial.title||'',
    content:        initial.content||'',
    type:           initial.type||'general',
    priority:       initial.priority||'medium',
    targetAudience: initial.targetAudience||'all',
    expiresAt:      initial.expiresAt ? initial.expiresAt.split('T')[0] : '',
    isPublished:    initial.isPublished !== false,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(form);}} className="space-y-4">
      <div><label className="label">Title</label><input className="input" value={form.title} onChange={e=>set('title',e.target.value)} required/></div>
      <div><label className="label">Content</label><textarea className="input resize-none" rows={4} value={form.content} onChange={e=>set('content',e.target.value)} required/></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Type</label>
          <select className="select" value={form.type} onChange={e=>set('type',e.target.value)}>
            {A_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="label">Priority</label>
          <select className="select" value={form.priority} onChange={e=>set('priority',e.target.value)}>
            {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Target Audience</label>
          <select className="select" value={form.targetAudience} onChange={e=>set('targetAudience',e.target.value)}>
            {AUDIENCES.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div><label className="label">Expires At (optional)</label><input type="date" className="input" value={form.expiresAt} onChange={e=>set('expiresAt',e.target.value)}/></div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pub" checked={form.isPublished} onChange={e=>set('isPublished',e.target.checked)} className="w-4 h-4"/>
        <label htmlFor="pub" className="text-sm text-gray-700">Published immediately</label>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading&&<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
          {initial._id?'Update':'Publish'} Announcement
        </button>
      </div>
    </form>
  );
}

export default function AdminAnnouncements() {
  const qc = useQueryClient();
  const [page, setPage]      = useState(1);
  const [modal, setModal]    = useState(false);
  const [editItem, setEdit]  = useState(null);
  const [delTarget, setDel]  = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-announcements', page],
    queryFn:  () => adminAPI.getAnnouncements({ page, limit:10 }),
  });
  const inv = () => qc.invalidateQueries(['admin-announcements']);
  const createMut = useMutation({ mutationFn:adminAPI.createAnnouncement, onSuccess:()=>{toast.success('Published');inv();setModal(false);}, onError:e=>toast.error(e.message) });
  const updateMut = useMutation({ mutationFn:({id,d})=>adminAPI.updateAnnouncement(id,d), onSuccess:()=>{toast.success('Updated');inv();setModal(false);setEdit(null);}, onError:e=>toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn:adminAPI.deleteAnnouncement, onSuccess:()=>{toast.success('Deleted');inv();setDel(null);}, onError:e=>toast.error(e.message) });

  const items = data?.data||[];
  const pg    = data?.pagination||{};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Announcements</h1></div>
        <button onClick={()=>{setEdit(null);setModal(true);}} className="btn-primary"><Plus className="w-4 h-4"/> New Announcement</button>
      </div>
      {isLoading?<PageLoader/>:error?<ErrorAlert message={error.message} onRetry={refetch}/>:(
        <div className="card">
          {items.length===0?<EmptyState icon={Bell} title="No announcements"/>:(
            <>
              <div className="divide-y divide-gray-100">
                {items.map((a,i)=>(
                  <div key={i} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                          <span className={`badge ${TYPE_CLS[a.type]||'badge-gray'}`}>{a.type}</span>
                          <span className={`badge ${a.isPublished?'badge-green':'badge-gray'}`}>{a.isPublished?'Published':'Draft'}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{fmtDate(a.publishedAt)} · Audience: {a.targetAudience}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={()=>{setEdit(a);setModal(true);}} className="btn-secondary btn-sm"><Edit2 className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>setDel(a._id)} className="btn-danger btn-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} pages={pg.pages} total={pg.total} limit={10} onPage={setPage}/>
            </>
          )}
        </div>
      )}
      <Modal open={modal} onClose={()=>{setModal(false);setEdit(null);}} title={editItem?'Edit Announcement':'New Announcement'}>
        <AnnouncementForm initial={editItem||{}} loading={createMut.isPending||updateMut.isPending}
          onSubmit={form=>editItem?updateMut.mutate({id:editItem._id,d:form}):createMut.mutate(form)}/>
      </Modal>
      <ConfirmDialog open={!!delTarget} onClose={()=>setDel(null)} onConfirm={()=>deleteMut.mutate(delTarget)}
        loading={deleteMut.isPending} title="Delete Announcement" message="This will permanently delete the announcement."/>
    </div>
  );
}
