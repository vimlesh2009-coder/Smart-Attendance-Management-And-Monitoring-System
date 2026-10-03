import { format, parseISO, isValid } from 'date-fns';

export const fmtDate = (d, fmt = 'dd MMM yyyy') => {
  if (!d) return '—';
  try { const dt = typeof d === 'string' ? parseISO(d) : new Date(d); return isValid(dt) ? format(dt, fmt) : '—'; }
  catch { return '—'; }
};

export const fmtDateTime = (d) => fmtDate(d, 'dd MMM yyyy, hh:mm a');

export const pct = (attended, total) =>
  total > 0 ? parseFloat(((attended / total) * 100).toFixed(2)) : 0;

export const buffer = (current, required) =>
  parseFloat((current - required).toFixed(2));

export const riskColor = (risk) => ({
  safe:     'badge-green',
  moderate: 'badge-blue',
  warning:  'badge-yellow',
  critical: 'badge-orange',
  shortage: 'badge-red',
}[risk] || 'badge-gray');

export const riskLabel = (risk) => ({
  safe:     'Safe',
  moderate: 'Moderate',
  warning:  'Warning',
  critical: 'Critical',
  shortage: 'Shortage',
}[risk] || risk);

export const riskBg = (risk) => ({
  safe:     'risk-safe',
  moderate: 'risk-moderate',
  warning:  'risk-warning',
  critical: 'risk-critical',
  shortage: 'risk-shortage',
}[risk] || '');

export const pctColor = (p, required = 75) => {
  if (p >= required + 10) return 'text-green-600';
  if (p >= required)      return 'text-blue-600';
  if (p >= required - 5)  return 'text-orange-600';
  return 'text-red-600';
};

export const statusBadge = (status) => ({
  present: 'badge-green',
  absent:  'badge-red',
  late:    'badge-yellow',
  excused: 'badge-blue',
}[status] || 'badge-gray');

export const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const currency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
