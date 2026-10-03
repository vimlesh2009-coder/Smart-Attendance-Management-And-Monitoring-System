import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Generic CRUD hook.
 * @param {string}   queryKey   - React Query key prefix
 * @param {function} listFn     - (params) => promise
 * @param {function} createFn  - (data)   => promise
 * @param {function} updateFn  - (id, data) => promise
 * @param {function} deleteFn  - (id)     => promise
 */
export function useCrud(queryKey, { listFn, createFn, updateFn, deleteFn }) {
  const qc = useQueryClient();
  const [page,        setPage]        = useState(1);
  const [filters,     setFilters]     = useState({});
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editItem,    setEditItem]     = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [queryKey, page, filters],
    queryFn:  () => listFn({ page, limit: 15, ...filters }),
  });

  const invalidate = () => qc.invalidateQueries([queryKey]);

  const createMut = useMutation({
    mutationFn: createFn,
    onSuccess: () => { toast.success('Created successfully'); invalidate(); setModalOpen(false); },
    onError:   (e) => toast.error(e.message || 'Create failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateFn(id, data),
    onSuccess: () => { toast.success('Updated successfully'); invalidate(); setModalOpen(false); setEditItem(null); },
    onError:   (e) => toast.error(e.message || 'Update failed'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => { toast.success('Deleted successfully'); invalidate(); setDeleteTarget(null); },
    onError:   (e) => toast.error(e.message || 'Delete failed'),
  });

  const openCreate = ()       => { setEditItem(null);  setModalOpen(true); };
  const openEdit   = (item)   => { setEditItem(item);  setModalOpen(true); };
  const closeModal = ()       => { setModalOpen(false); setEditItem(null); };

  return {
    data: data?.data || [],
    pagination: data?.pagination || {},
    isLoading, error, refetch,
    page, setPage,
    filters, setFilters,
    modalOpen, editItem,
    openCreate, openEdit, closeModal,
    deleteTarget, setDeleteTarget,
    createMut, updateMut, deleteMut,
  };
}
