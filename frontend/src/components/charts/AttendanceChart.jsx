import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const TrendAreaChart = ({ data = [], required = 75 }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
      <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
      <ReferenceLine y={required} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `${required}%`, position: 'right', fontSize: 10, fill: '#ef4444' }} />
      <Area type="monotone" dataKey="percentage" stroke="#3b82f6" fill="url(#attGrad)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
    </AreaChart>
  </ResponsiveContainer>
);

export const SubjectBarChart = ({ data = [], required = 75 }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
      <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
      <ReferenceLine y={required} stroke="#ef4444" strokeDasharray="4 4" />
      <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
        {data.map((entry, i) => (
          <Cell key={i} fill={entry.percentage >= required ? '#10b981' : entry.percentage >= required - 10 ? '#f59e0b' : '#ef4444'} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const AttendancePieChart = ({ attended, absent }) => {
  const d = [{ name: 'Present', value: attended }, { name: 'Absent', value: absent }];
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={d} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
          <Cell fill="#10b981" />
          <Cell fill="#ef4444" />
        </Pie>
        <Tooltip formatter={(v, n) => [v, n]} />
        <Legend iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const SectionBarChart = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height={240}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
      <Tooltip formatter={(v) => [`${v}%`, 'Avg Attendance']} />
      <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" />
      <Bar dataKey="avgAttendancePct" fill="#3b82f6" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export const DateRangeLineChart = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
      <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
      <Area type="monotone" dataKey="attendancePct" stroke="#8b5cf6" fill="url(#grad2)" strokeWidth={2} />
    </AreaChart>
  </ResponsiveContainer>
);
