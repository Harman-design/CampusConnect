import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineClipboardList,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineUserCircle,
  HiOutlineLogout,
  HiOutlineBell,
  HiOutlineExclamationCircle,
  HiOutlineSupport,
  HiOutlineSpeakerphone,
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineBookOpen,
  HiOutlineCreditCard
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/attendance', label: 'My Attendance', icon: HiOutlineClipboardList },
  { to: '/notes', label: 'Notes', icon: HiOutlineDocumentText },
  { to: '/pyqs', label: 'PYQs', icon: HiOutlineClipboardList },
  { to: '/assignments', label: 'Assignments', icon: HiOutlineClipboardList },
  { to: '/timetable', label: 'Timetable', icon: HiOutlineCalendar },
  { to: '/resume-builder', label: 'Resume Builder', icon: HiOutlineSparkles },
  { to: '/academic-tools', label: 'GPA & Attendance Tools', icon: HiOutlineChartBar },
  { to: '/fees', label: 'Fees & Payments', icon: HiOutlineCreditCard },
  { to: '/exams', label: 'Exam Results', icon: HiOutlineBookOpen },
  { to: '/marks', label: 'Internal Marks', icon: HiOutlineChartBar },
  { to: '/placements', label: 'Placements & Jobs', icon: HiOutlineBriefcase },
  { to: '/events', label: 'Events & Fests', icon: HiOutlineCalendar },
  { to: '/ai-assistant', label: 'AI Assistant', icon: HiOutlineSparkles },
  { to: '/complaints', label: 'Complaints', icon: HiOutlineExclamationCircle },
  { to: '/support-tickets', label: 'Support Tickets', icon: HiOutlineSupport },
  { to: '/profile', label: 'Profile', icon: HiOutlineUserCircle },
];

const facultyLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/faculty/attendance', label: 'Mark Attendance', icon: HiOutlineClipboardList },
  { to: '/faculty/assignments', label: 'Manage Assignments', icon: HiOutlineDocumentText },
  { to: '/faculty/notes', label: 'Upload Notes & PYQs', icon: HiOutlineClipboardList },
  { to: '/faculty/timetable', label: 'Schedule Classes', icon: HiOutlineCalendar },
  { to: '/ai-assistant', label: 'AI Assistant', icon: HiOutlineSparkles },
  { to: '/profile', label: 'Profile', icon: HiOutlineUserCircle },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/admin/academic', label: 'Academic Resources', icon: HiOutlineBookOpen },
  { to: '/admin/analytics', label: 'Analytics', icon: HiOutlineChartBar },
  { to: '/admin/users', label: 'Manage Users', icon: HiOutlineUserCircle },
  { to: '/admin/subjects', label: 'Manage Subjects', icon: HiOutlineClipboardList },
  { to: '/admin/notes', label: 'Manage Notes', icon: HiOutlineDocumentText },
  { to: '/admin/pyqs', label: 'Manage PYQs', icon: HiOutlineClipboardList },
  { to: '/admin/placements', label: 'Manage Placements', icon: HiOutlineBriefcase },
  { to: '/admin/events', label: 'Manage Events', icon: HiOutlineCalendar },
  { to: '/admin/fees', label: 'Manage Fees', icon: HiOutlineCreditCard },
  { to: '/admin/complaints', label: 'Complaints', icon: HiOutlineExclamationCircle },
  { to: '/admin/support-tickets', label: 'Support Tickets', icon: HiOutlineSupport },
  { to: '/admin/settings', label: 'System Settings', icon: HiOutlineSupport },
  { to: '/admin/notifications/send', label: 'Send Notification', icon: HiOutlineSpeakerphone },
];

export default function AppLayout() {
  const { user, isAdmin, isFaculty, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isCollapsed, setIsCollapsed] = useState(false);

  let links = studentLinks;
  if (isAdmin) {
    links = adminLinks;
  } else if (isFaculty) {
    links = facultyLinks;
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CC';

  return (
    <div className="flex min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      {/* Collapsible Sidebar */}
      <aside
        className={`hidden flex-col border-r border-slate-800/60 bg-[#111827] p-4 sm:flex transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between mb-6 px-1.5">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-black">CC</span>
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-100 tracking-wider">
                  CampusConnect
                </h1>
                <p className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">SRM Ramapuram</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] flex items-center justify-center shadow-md mx-auto">
              <span className="text-white text-sm font-black">CC</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-100 transition duration-200"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* User profile card section */}
        {user && (
          <div className={`mb-6 rounded-2xl bg-gradient-to-b from-[#1E293B] to-[#111827] border border-slate-800 p-3 shadow-md relative ${isCollapsed ? 'flex flex-col items-center justify-center' : ''}`}>
            <div className="flex items-center gap-3 w-full">
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#4F8CFF] to-[#7C3AED] flex items-center justify-center text-xs font-extrabold text-white shadow-lg border border-slate-800">
                  {initials}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#22C55E] border-2 border-[#111827] animate-pulse" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#F8FAFC] truncate flex items-center gap-1.5">
                    {user.name}
                  </h4>
                  <p className="text-[9px] text-[#94A3B8] font-medium truncate mt-0.5">
                    {user.department || 'B.Tech CSE'}
                  </p>
                  {user.semester && (
                    <p className="text-[9px] text-[#4F8CFF] font-semibold mt-0.5">Sem {user.semester}</p>
                  )}
                </div>
              )}

              {!isCollapsed && (
                <NavLink
                  to="/notifications"
                  className="p-1 text-slate-400 hover:text-[#4F8CFF] transition relative"
                  title="Notifications"
                >
                  <HiOutlineBell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[8px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              )}
            </div>

            {/* Role Badge inside the sidebar */}
            {!isCollapsed && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/40 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-slate-900 border border-slate-800 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  {user.role}
                </span>
                <span className="text-[8px] text-[#22C55E] font-semibold flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-[#22C55E]" />
                  Online
                </span>
              </div>
            )}

            {isCollapsed && (
              <NavLink to="/notifications" className="relative p-1 text-slate-400 hover:text-[#4F8CFF] transition mt-2">
                <HiOutlineBell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-[#EF4444]" />
                )}
              </NavLink>
            )}
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1 select-none">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard' || to === '/admin'}
              title={isCollapsed ? label : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${isActive
                  ? 'bg-[#1E293B] text-[#4F8CFF] border border-slate-800 shadow-md font-bold'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-100 border border-transparent'
                } ${isCollapsed ? 'justify-center px-2' : ''}`
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!isCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Log out */}
        <div className="mt-auto border-t border-slate-800/80 pt-4 flex flex-col gap-2">
          <button
            onClick={logout}
            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-red-400 hover:bg-red-950/20 hover:text-red-300 border border-transparent hover:border-red-900/20 transition-all duration-200 ${isCollapsed ? 'justify-center px-2' : ''
              }`}
            title={isCollapsed ? "Log out" : ""}
          >
            <HiOutlineLogout className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Logout Account</span>}
          </button>
        </div>
      </aside>

      {/* Main content pane */}
      <main className="flex-1 overflow-y-auto flex flex-col min-h-screen">
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Subtle, premium, non-flashy footer */}
        <footer className="mt-auto border-t border-slate-800/60 bg-[#111827]/40 py-6 px-6 text-slate-500 text-xs font-medium font-sans">
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-3 text-center">
            <hr className="w-full border-slate-800/60 mb-2" />
            <span className="text-[10px] text-slate-400 tracking-wider">
              Designed & Developed with ❤️ by
            </span>
            <span className="font-extrabold text-slate-300 text-sm">
              Harmanpreet Kaur
            </span>
            <span className="text-[11px] text-[#94A3B8]">
              B.Tech Computer Science Engineering
            </span>
            <span className="text-[10px] text-slate-400">
              SRM Institute of Science and Technology – Ramapuram
            </span>
            <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 mt-1">
              CampusConnect v1.0.0 Beta
            </span>
            <div className="flex items-center gap-3 mt-1 font-semibold text-[11px]">
              <a href="https://github.com/Harman-design" target="_blank" rel="noopener noreferrer" className="hover:text-[#4F8CFF] transition-colors">
                GitHub
              </a>
              <span className="text-slate-800">•</span>
              <a href="https://www.linkedin.com/in/harmanpreet-kaur-9b70ab32b/" target="_blank" rel="noopener noreferrer" className="hover:text-[#4F8CFF] transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
