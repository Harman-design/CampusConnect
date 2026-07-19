import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  HiOutlineClipboardList,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineArrowNarrowRight,
  HiOutlineDocumentText,
  HiOutlineSupport,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Dashboard() {
  const { user } = useAuth();
  const currentHour = new Date().getHours();
  const todayDayOfWeek = DAYS[new Date().getDay() - 1] || 'Monday';

  let greeting = 'Welcome back';
  if (currentHour < 12) greeting = 'Good Morning';
  else if (currentHour < 18) greeting = 'Good Afternoon';
  else greeting = 'Good Evening';

  // Fetch student specific queries
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['dashboard-attendance'],
    queryFn: async () => {
      const { data } = await api.get('/attendance/student/me');
      return data.data;
    },
    enabled: user.role === 'student'
  });

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['dashboard-assignments'],
    queryFn: async () => {
      const { data } = await api.get('/assignments/student/me');
      return data.data;
    },
    enabled: user.role === 'student'
  });

  const { data: placementsData, isLoading: placementsLoading } = useQuery({
    queryKey: ['dashboard-placements'],
    queryFn: async () => {
      const { data } = await api.get('/placements/my-applications');
      return data.data;
    },
    enabled: user.role === 'student'
  });

  const { data: timetableData, isLoading: timetableLoading } = useQuery({
    queryKey: ['dashboard-timetable'],
    queryFn: async () => {
      const { data } = await api.get('/timetable');
      return data.data;
    },
    enabled: user.role === 'student'
  });

  const todaySlots = (timetableData || [])
    .filter(s => s.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const pendingAssignments = assignmentsData?.pending || [];

  // Faculty Dashboard
  if (user.role === 'faculty') {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8 fade-in-up">
        {/* Welcome Header */}
        <div className="rounded-2xl bg-gradient-to-r from-[#1e293b] to-[#0f172a] border border-slate-800 p-8 shadow-xl relative overflow-hidden text-left">
          <div className="absolute right-0 top-0 h-40 w-40 bg-purple-500/10 rounded-full blur-3xl" />
          <span className="inline-block rounded-full bg-purple-500/10 border border-purple-500/25 px-3 py-1 text-[10px] font-bold tracking-wider text-purple-400 uppercase">
            Faculty Access
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-white tracking-tight">
            {greeting}, {user.name.split(' ')[0]} 🎓
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Welcome to the SRM Ramapuram Faculty Portal. Access courses, track attendance logs, and evaluate pending assignments.
          </p>
        </div>

        {/* Faculty Grid of Tools */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: '/faculty/attendance',
              title: '📝 Mark Attendance',
              desc: 'Log and update daily student session presence details.',
              color: 'hover:border-purple-500/30'
            },
            {
              href: '/faculty/assignments',
              title: '📁 Manage Assignments',
              desc: 'Create, review, and grade class project submissions.',
              color: 'hover:border-blue-500/30'
            },
            {
              href: '/faculty/notes',
              title: '📘 Upload Notes & PYQs',
              desc: 'Share learning resources, past papers, and slides.',
              color: 'hover:border-emerald-500/30'
            },
            {
              href: '/faculty/timetable',
              title: '📅 Schedule Classes',
              desc: 'Review weekly session timetable constraints.',
              color: 'hover:border-amber-500/30'
            },
            {
              href: '/ai-assistant',
              title: '✨ AI Study Copilot',
              desc: 'Leverage Gemini for syllabus notes and class test questions.',
              color: 'hover:border-brand-500/30'
            },
            {
              href: '/profile',
              title: '👤 My Profile',
              desc: 'Access your professional info and records.',
              color: 'hover:border-slate-500/30'
            }
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className={`block bg-[#111827] border border-slate-800 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-950/40 text-left ${item.color}`}
            >
              <h3 className="text-sm font-bold text-slate-100 mb-1.5">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 fade-in-up text-left text-slate-100">
      {/* Premium SaaS Hero Welcome */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1E293B] via-[#111827] to-[#0B1220] border border-slate-800 p-6 md:p-8 shadow-premium relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 h-48 w-48 bg-[#4F8CFF]/5 rounded-full blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-32 w-32 bg-[#7C3AED]/5 rounded-full blur-2xl" />
        
        <div className="space-y-3 relative z-10">
          <span className="inline-flex items-center rounded-full bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 px-3 py-1 text-[10px] font-extrabold tracking-wider text-[#4F8CFF] uppercase">
            Student Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            {greeting}, {user?.name?.split(' ')[0] || 'Harman'} 👋
          </h1>
          <p className="text-xs text-[#94A3B8] max-w-lg leading-relaxed">
            Welcome back to CampusConnect. Here is your overview for today at SRM Ramapuram. Track your studies, view syllabus documents, and optimize academic achievements.
          </p>
        </div>

        {/* Department Info Widget */}
        <div className="bg-[#0B1220]/80 p-5 rounded-2xl border border-slate-800 shrink-0 min-w-[240px] shadow-glass relative z-10 backdrop-blur-md">
          <span className="text-[9px] text-[#94A3B8] font-bold block uppercase tracking-wider">Academic Track</span>
          <span className="text-sm font-black text-white block mt-1.5">{user?.department || 'Computer Science Engineering'}</span>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/60">
            <span className="text-[10px] text-[#4F8CFF] font-extrabold uppercase">Semester {user?.semester || 4}</span>
            <span className="text-[10px] text-[#22C55E] font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              Active Status
            </span>
          </div>
        </div>
      </div>

      {/* Today's Summary Row (6 Metrics Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            title: 'Attendance',
            val: attendanceLoading ? '...' : `${attendanceData?.overallStats?.percentage ?? 100}%`,
            desc: 'Requirement: 75%',
            color: 'text-[#22C55E]',
            bg: 'from-[#22C55E]/5 to-transparent border-[#22C55E]/10'
          },
          {
            title: 'CGPA',
            val: user?.cgpa || '9.28',
            desc: 'Credits: 72',
            color: 'text-[#7C3AED]',
            bg: 'from-[#7C3AED]/5 to-transparent border-[#7C3AED]/10'
          },
          {
            title: 'Assignments',
            val: assignmentsLoading ? '...' : pendingAssignments.length,
            desc: 'Due items pending',
            color: 'text-[#F59E0B]',
            bg: 'from-[#F59E0B]/5 to-transparent border-[#F59E0B]/10'
          },
          {
            title: 'Job Status',
            val: placementsLoading ? '...' : (placementsData?.length ?? 0),
            desc: 'Active applications',
            color: 'text-[#4F8CFF]',
            bg: 'from-[#4F8CFF]/5 to-transparent border-[#4F8CFF]/10'
          },
          {
            title: 'Exams Scheduled',
            val: '3',
            desc: 'Cycle Test/Semester',
            color: 'text-[#EF4444]',
            bg: 'from-[#EF4444]/5 to-transparent border-[#EF4444]/10'
          },
          {
            title: 'Backlogs',
            val: user?.backlogs ?? '0',
            desc: 'Cleared / Outstanding',
            color: 'text-slate-400',
            bg: 'from-slate-800/5 to-transparent border-slate-800/40'
          }
        ].map((met, i) => (
          <div key={i} className={`bg-[#111827] border p-4 rounded-2xl shadow-sm bg-gradient-to-b ${met.bg} flex flex-col justify-between hover-lift`}>
            <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">{met.title}</span>
            <div className="my-2.5">
              <span className={`text-2xl font-black ${met.color}`}>{met.val}</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium">{met.desc}</span>
          </div>
        ))}
      </div>

      {/* Main Grid: Left (Today's schedule, Attendance details) & Right (Quick panels, deadlines) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Timetable */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
                <HiOutlineClock className="h-4.5 w-4.5 text-[#4F8CFF]" />
                <span>Today's Academic Timetable</span>
              </h3>
              <a href="/timetable" className="text-[10px] font-bold text-[#4F8CFF] hover:text-[#4F8CFF]/85 transition flex items-center gap-0.5">
                View Calendar <HiOutlineArrowNarrowRight className="h-3 w-3" />
              </a>
            </div>

            {timetableLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-14 rounded-xl shimmer-load" />
                ))}
              </div>
            ) : todaySlots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todaySlots.map(slot => (
                  <div key={slot._id} className="p-3.5 rounded-xl bg-[#1E293B]/40 border border-slate-800/80 hover:border-slate-700 hover:bg-[#1E293B]/60 transition flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{slot.subject}</h4>
                        {slot.faculty && (
                          <span className="text-[8px] bg-slate-800/80 text-[#94A3B8] px-2 py-0.5 rounded font-bold shrink-0 uppercase tracking-wide">
                            {slot.faculty.name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#94A3B8] mt-1.5">{slot.startTime} - {slot.endTime}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/30 flex justify-between items-center text-[9px] text-slate-500 font-semibold">
                      <span>Room: {slot.classroom || 'TBD'}</span>
                      <span className="text-[#4F8CFF]">B.Tech Lecture</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#0B1220]/40 border border-dashed border-slate-800 rounded-xl text-[#94A3B8] text-xs">
                No classes scheduled for today. Focus on independent revision! 🚀
              </div>
            )}
          </div>

          {/* Attendance Overview Chart widget */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
              <HiOutlineClipboardList className="h-4.5 w-4.5 text-[#22C55E]" />
              <span>Attendance Progress Review</span>
            </h3>
            
            {attendanceLoading ? (
              <div className="h-40 rounded-xl shimmer-load" />
            ) : attendanceData?.subjectStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex flex-col items-center justify-center p-3 border border-slate-800 bg-[#0B1220]/40 rounded-xl">
                  <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-2">Overall Ratio</span>
                  <div className="text-3xl font-black text-[#22C55E]">{attendanceData?.overallStats?.percentage}%</div>
                  <span className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">Requirement 75%</span>
                </div>
                
                <div className="md:col-span-2 space-y-2.5">
                  <span className="text-[10px] text-[#94A3B8] font-extrabold block uppercase tracking-wider">Subject Standings</span>
                  <div className="space-y-2">
                    {attendanceData.subjectStats.slice(0, 3).map((sub, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-300">
                          <span className="truncate max-w-[180px]">{sub.subject}</span>
                          <span>{sub.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${sub.percentage >= 75 ? 'from-[#22C55E] to-teal-400' : 'from-[#EF4444] to-[#F59E0B]'}`}
                            style={{ width: `${sub.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No attendance logs found on file.
              </div>
            )}
          </div>

          {/* AI study planner recommendations */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2 mb-4">
              <HiOutlineSparkles className="h-4.5 w-4.5 text-[#7C3AED]" />
              <span>AI Study Planner Suggestions</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Summarize Notes',
                  desc: 'Run a Gemini summary on recently downloaded PDF notes.',
                  action: '/notes',
                  color: 'hover:border-[#7C3AED]/30'
                },
                {
                  title: 'Interview Preparation',
                  desc: 'Generate common viva/mock exam questions from study subjects.',
                  action: '/ai-assistant',
                  color: 'hover:border-[#4F8CFF]/30'
                }
              ].map((sug, i) => (
                <a
                  key={i}
                  href={sug.action}
                  className={`block p-4 rounded-xl bg-[#0B1220]/45 border border-slate-800 hover:bg-[#0B1220] transition duration-200 text-left ${sug.color} hover-glow`}
                >
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{sug.title}</span>
                    <HiOutlineArrowNarrowRight className="h-3 w-3 text-[#7C3AED]" />
                  </h4>
                  <p className="text-[10px] text-[#94A3B8] mt-1.5 leading-relaxed">{sug.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns (Span 1) */}
        <div className="space-y-6">
          
          {/* Quick Action Navigation Grid */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2 mb-2">
              <HiOutlineCalendar className="h-4.5 w-4.5 text-[#4F8CFF]" />
              <span>Quick Actions</span>
            </h3>

            {[
              { to: '/notes', title: '📘 Browse Study Notes', icon: HiOutlineDocumentText },
              { to: '/pyqs', title: '📄 Prep with Past Papers', icon: HiOutlineClipboardList },
              { to: '/academic-tools', title: '📊 GPA & Target Planners', icon: HiOutlineAcademicCap },
              { to: '/resume-builder', title: '💼 ATS Resume Optimizer', icon: HiOutlineBriefcase },
              { to: '/support-tickets', title: '🎫 Campus Support Desk', icon: HiOutlineSupport },
              { to: '/complaints', title: '📢 Grievance Box', icon: HiOutlineExclamationCircle }
            ].map((lnk, idx) => (
              <a
                key={idx}
                href={lnk.to}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0B1220]/30 border border-slate-800/80 hover:border-[#4F8CFF]/30 hover:bg-[#1E293B]/40 transition text-left text-xs font-semibold text-slate-300 hover:text-[#4F8CFF]"
              >
                <span className="flex items-center gap-2.5">
                  <lnk.icon className="h-4 w-4 text-[#94A3B8] shrink-0" />
                  {lnk.title}
                </span>
                <HiOutlineArrowNarrowRight className="h-3.5 w-3.5 text-slate-600" />
              </a>
            ))}
          </div>

          {/* Calendar countdown list widget */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
              <HiOutlineCalendar className="h-4.5 w-4.5 text-[#EF4444]" />
              <span>Upcoming Milestones</span>
            </h3>

            <div className="space-y-3">
              {[
                { title: 'CT-2 Model Exams', date: 'Jul 28, 2026', days: 17, color: 'border-l-[#F59E0B]' },
                { title: 'Semester Practical Assessments', date: 'Nov 18, 2026', days: 130, color: 'border-l-[#4F8CFF]' },
                { title: 'End Semester Theory Exams', date: 'Dec 12, 2026', days: 154, color: 'border-l-[#EF4444]' }
              ].map((item, idx) => (
                <div key={idx} className={`p-3 bg-[#0B1220]/40 border border-slate-800 border-l-2 rounded-xl flex items-center justify-between gap-2 ${item.color}`}>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-200 leading-snug">{item.title}</h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">{item.date}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-400 shrink-0 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                    {item.days}d left
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
