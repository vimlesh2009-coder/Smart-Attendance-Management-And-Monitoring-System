import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorAlert = ({ message = 'Something went wrong', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
      <AlertTriangle className="w-7 h-7 text-red-500" />
    </div>
    <p className="text-base font-medium text-gray-700">Error</p>
    <p className="text-sm text-gray-500 mt-1 max-w-md">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary mt-4">
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    )}
  </div>
);
