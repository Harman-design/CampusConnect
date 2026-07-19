import { HiOutlineLockClosed, HiOutlineAcademicCap, HiOutlineDocumentText, HiOutlineCalendar } from 'react-icons/hi';

export default function Exams() {
  return (
    <div className="p-6 min-h-screen text-slate-100 text-left space-y-6 flex items-center justify-center">
      <div className="max-w-xl w-full rounded-3xl border border-slate-800 bg-[#111827] p-8 shadow-premium text-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#7C3AED]/2 blur-3xl pointer-events-none" />
        
        {/* Animated Locker Illustration */}
        <div className="relative mx-auto h-24 w-24 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 shadow-glass">
          <HiOutlineLockClosed className="h-10 w-10 text-[#7C3AED] animate-pulse" />
          <div className="absolute inset-0 rounded-full border border-[#7C3AED]/20 animate-ping opacity-25" style={{ animationDuration: '3s' }} />
        </div>

        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-3 py-0.5 text-[9px] font-extrabold tracking-wider text-[#7C3AED] uppercase">
            Exam Controller Notice
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">Institution Integration Required</h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
            This feature will become available once academic data is integrated by the college administration.
          </p>
        </div>

        <div className="border-t border-slate-800 pt-5 space-y-4 text-left">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expected Exam Features</h4>
          
          <div className="grid grid-cols-1 gap-3.5">
            {[
              {
                icon: HiOutlineDocumentText,
                title: 'Official Semester Grade Cards',
                desc: 'Download accredited PDF transcripts and mark sheets.'
              },
              {
                icon: HiOutlineAcademicCap,
                title: 'GPA & CGPA Official Audit',
                desc: 'Consolidated records directly verified by the SRM controller office.'
              },
              {
                icon: HiOutlineCalendar,
                title: 'Hall Ticket & Seating Allocations',
                desc: 'View dates, schedules, venues, and seat registry keys.'
              }
            ].map((feature, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[#7C3AED] shrink-0">
                  <feature.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-200">{feature.title}</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
