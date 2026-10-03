import { Inbox } from 'lucide-react';

export const EmptyState = ({ icon: Icon = Inbox, title = 'No data found', description = '', action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-gray-400" />
    </div>
    <p className="text-base font-medium text-gray-700">{title}</p>
    {description && <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
