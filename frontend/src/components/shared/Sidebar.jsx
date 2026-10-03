import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import {
  LayoutDashboard, Users, BookOpen, Calendar, Bell, DollarSign,
  ClipboardList, Settings, LogOut, GraduationCap, Building2,
  BookMarked, UserCheck, BarChart3, AlertTriangle, Clock, X,
  FileText, UserCog, ChevronRight, ShieldCheck,
} from 'lucide-react';

const NAV = {
  student: [
    { to: '/student/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/attendance',   icon: ClipboardList,   label: 'Attendance' },
    { to: '/student/timetable',    icon: Clock,           label: 'Timetable' },
    { to: '/student/fees',         icon: DollarSign,      label: 'Fees' },
    { to: '/student/announcements',icon: Bell,            label: 'Announcements' },
    { to: '/student/calendar',     icon: Calendar,        label: 'Calendar' },
  ],
  faculty: [
    { to: '/faculty/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/faculty/attendance',  icon: ClipboardList,   label: 'Mark Attendance' },
    { to: '/faculty/records',     icon: BarChart3,       label: 'Records' },
    { to: '/faculty/timetable',   icon: Clock,           label: 'Timetable' },
  ],
  hod: [
    { to: '/hod/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hod/attendance',      icon: BarChart3,       label: 'Attendance' },
    { to: '/hod/low-attendance',  icon: AlertTriangle,   label: 'Low Attendance' },
    { to: '/hod/sections',        icon: BookMarked,      label: 'Sections' },
    { to: '/hod/faculty',         icon: UserCheck,       label: 'Faculty' },
    { to: '/hod/students',        icon: Users,           label: 'Students' },
    { to: '/hod/announcements',   icon: Bell,            label: 'Announcements' },
  ],
  admin: [
    { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/students',      icon: Users,           label: 'Students' },
    { to: '/admin/faculty',       icon: UserCheck,       label: 'Faculty' },
    { to: '/admin/departments',   icon: Building2,       label: 'Departments' },
    { to: '/admin/sections',      icon: BookMarked,      label: 'Sections' },
    { to: '/admin/subjects',      icon: BookOpen,        label: 'Subjects' },
    { to: '/admin/sessions',      icon: GraduationCap,   label: 'Sessions' },
    { to: '/admin/assignments',   icon: UserCog,         label: 'Assignments' },
    { to: '/admin/timetable',     icon: Clock,           label: 'Timetable' },
    { to: '/admin/fees',          icon: DollarSign,      label: 'Fees' },
    { to: '/admin/announcements', icon: Bell,            label: 'Announcements' },
    { to: '/admin/calendar',      icon: Calendar,        label: 'Calendar' },
    { to: '/admin/users',         icon: ShieldCheck,     label: 'User Management' },
    { to: '/admin/audit-logs',    icon: FileText,        label: 'Audit Logs' },
  ],
};

const ROLE_LABELS = { admin: 'Administrator', faculty: 'Faculty', hod: 'Head of Dept', student: 'Student' };
const ROLE_COLORS = { admin: 'bg-purple-100 text-purple-700', faculty: 'bg-blue-100 text-blue-700', hod: 'bg-green-100 text-green-700', student: 'bg-orange-100 text-orange-700' };

export const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">SmartAttend</p>
              <p className="text-xs text-gray-400 mt-0.5">ERP System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user?.role]}`}>
                {ROLE_LABELS[user?.role]}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
              }>
              {({ isActive }) => (
                <>
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} style={{ width: 18, height: 18 }} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200 shrink-0">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};
