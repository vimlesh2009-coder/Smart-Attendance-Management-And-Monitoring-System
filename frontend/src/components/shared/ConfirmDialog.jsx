import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Confirm', message, loading, variant = 'danger' }) => (
  <Modal open={open} onClose={onClose} size="sm">
    <div className="text-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100'}`}>
        <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-red-600' : 'text-yellow-600'}`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={onClose} className="btn-secondary px-6">Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className={variant === 'danger' ? 'btn-danger px-6' : 'btn-primary px-6'}>
          {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
          Confirm
        </button>
      </div>
    </div>
  </Modal>
);
