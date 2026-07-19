import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HiOutlineCalculator, 
  HiOutlineCalendar, 
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineSparkles,
  HiOutlineChevronRight,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineTrendingUp,
  HiOutlineLockClosed
} from 'react-icons/hi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

export default function AcademicTools() {
  const [activeTab, setActiveTab] = useState('gpa'); // gpa, attendance, trackers

  // --- SGPA State ---
  const [sgpaSubjects, setSgpaSubjects] = useState([
    { subject: 'Calculus and Linear Algebra', credits: 4, grade: 'O' },
    { subject: 'Physics for Engineers', credits: 3, grade: 'A+' },
    { subject: 'Programming in C', credits: 3, grade: 'A' },
    { subject: 'Engineering Graphics', credits: 2, grade: 'B' }
  ]);
  const [sgpaResult, setSgpaResult] = useState(null);

  // --- CGPA State ---
  const [semesters, setSemesters] = useState([
    { semester: 1, sgpa: 8.5, credits: 20 },
    { semester: 2, sgpa: 8.2, credits: 22 },
    { semester: 3, sgpa: 8.8, credits: 21 },
    { semester: 4, sgpa: 0, credits: 20 } // Current
  ]);
  const [targetCgpa, setTargetCgpa] = useState(8.5);
  const [cgpaResult, setCgpaResult] = useState(null);

  // --- Attendance Calculator State ---
  const [attendance, setAttendance] = useState({
    attended: 45,
    total: 55,
    target: 75
  });
  const [attendanceResult, setAttendanceResult] = useState(null);

  // --- Backlog State ---
  const [backlogs, setBacklogs] = useState([
    { subject: 'Basic Electrical Engineering', code: 'EE101', credits: 3, status: 'Pending' }
  ]);
  const [newBacklog, setNewBacklog] = useState({ subject: '', code: '', credits: 3 });

  // Grade point mapping
  const GRADE_POINTS = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'F': 0
  };

  // --- Calculations ---
  useEffect(() => {
    calculateSgpa();
  }, [sgpaSubjects]);

  useEffect(() => {
    calculateCgpa();
  }, [semesters, targetCgpa]);

  useEffect(() => {
    calculateAttendanceDetails();
  }, [attendance]);

  const calculateSgpa = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    sgpaSubjects.forEach(sub => {
      const gp = GRADE_POINTS[sub.grade] || 0;
      totalPoints += (gp * sub.credits);
      totalCredits += sub.credits;
    });
    if (totalCredits === 0) return;
    const sgpaVal = totalPoints / totalCredits;
    const percentage = (sgpaVal - 0.75) * 10;
    setSgpaResult({
      sgpa: sgpaVal.toFixed(2),
      credits: totalCredits,
      percentage: percentage > 0 ? percentage.toFixed(1) : 0
    });
  };

  const calculateCgpa = () => {
    let totalScore = 0;
    let totalCredits = 0;
    let completedSemesters = 0;

    semesters.forEach(sem => {
      if (sem.sgpa > 0) {
        totalScore += (sem.sgpa * sem.credits);
        totalCredits += sem.credits;
        completedSemesters++;
      }
    });

    if (totalCredits === 0) return;
    const currentCgpa = totalScore / totalCredits;

    // GPA Predictor for upcoming semester to hit Target CGPA
    const nextSem = semesters.find(sem => sem.sgpa === 0);
    let gpaNeeded = null;
    if (nextSem) {
      const combinedCredits = totalCredits + nextSem.credits;
      gpaNeeded = ((targetCgpa * combinedCredits) - totalScore) / nextSem.credits;
    }

    setCgpaResult({
      cgpa: currentCgpa.toFixed(2),
      totalCredits,
      completedSemesters,
      gpaNeeded: gpaNeeded ? Math.max(0, Math.min(10, gpaNeeded)).toFixed(2) : null
    });
  };

  const calculateAttendanceDetails = () => {
    const { attended, total, target } = attendance;
    if (total === 0 || attended > total) return;

    const currentPct = (attended / total) * 100;
    let message = '';
    let status = 'neutral';
    let classesDiff = 0;

    if (currentPct >= target) {
      // Safe Leave: how many classes can be skipped
      const maxTotal = Math.floor((attended * 100) / target);
      classesDiff = Math.max(0, maxTotal - total);
      status = 'success';
      message = `You are safe. You can skip up to ${classesDiff} upcoming classes without falling below ${target}%.`;
    } else {
      // Required Attendance: how many consecutive classes to attend
      if (target >= 100) {
        classesDiff = 999;
      } else {
        classesDiff = Math.ceil((target * total - 100 * attended) / (100 - target));
      }
      status = 'danger';
      message = `Attendance critically low! You must attend the next ${classesDiff} consecutive classes to reach ${target}%.`;
    }

    setAttendanceResult({
      percentage: currentPct.toFixed(1),
      message,
      status,
      classesDiff
    });
  };

  const addSgpaSubject = () => {
    setSgpaSubjects([...sgpaSubjects, { subject: 'New Subject', credits: 3, grade: 'A' }]);
  };

  const removeSgpaSubject = (index) => {
    const list = [...sgpaSubjects];
    list.splice(index, 1);
    setSgpaSubjects(list);
  };

  const updateSgpaSubject = (index, key, val) => {
    const list = [...sgpaSubjects];
    list[index][key] = val;
    setSgpaSubjects(list);
  };

  const updateSemesterSgpa = (index, key, val) => {
    const list = [...semesters];
    list[index][key] = Number(val);
    setSemesters(list);
  };

  const addBacklog = (e) => {
    e.preventDefault();
    if (!newBacklog.subject || !newBacklog.code) {
      toast.error('Please enter subject details');
      return;
    }
    setBacklogs([...backlogs, { ...newBacklog, status: 'Pending' }]);
    setNewBacklog({ subject: '', code: '', credits: 3 });
    toast.success('Backlog tracked!');
  };

  const toggleBacklogStatus = (index) => {
    const list = [...backlogs];
    list[index].status = list[index].status === 'Pending' ? 'Cleared' : 'Pending';
    setBacklogs(list);
    toast.success('Backlog status updated!');
  };

  const COUNTDOWNS = [
    { title: 'End Semester Theory Exams', date: 'Dec 12, 2026', days: 154 },
    { title: 'Next Assignment Deadline (MATH)', date: 'Jul 25, 2026', days: 14 },
    { title: 'Semester Practical Assessments', date: 'Nov 18, 2026', days: 130 }
  ];

  // Recharts derived GPA trend data
  const chartGpaData = semesters
    .filter(s => s.sgpa > 0)
    .map(s => ({
      name: `Sem ${s.semester}`,
      SGPA: s.sgpa
    }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 fade-in-up text-left text-slate-100">
      {/* Header info */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <HiOutlineCalculator className="text-[#4F8CFF] h-6.5 w-6.5" />
          <span>Academic Performance Tools</span>
        </h1>
        <p className="text-xs text-[#94A3B8] mt-1 font-medium">Predict CGPA/SGPA indices, calculate class attendance safety parameters, and inspect graduation targets.</p>
      </div>

      {/* Modern Tabs selector */}
      <div className="flex gap-1.5 bg-[#111827] border border-slate-800 p-1 rounded-xl w-fit">
        {[
          { key: 'gpa', label: 'GPA Calculator' },
          { key: 'attendance', label: 'Leave Safety' },
          { key: 'trackers', label: 'Countdowns & Backlogs' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab.key 
                ? 'bg-[#1E293B] text-[#4F8CFF] shadow border border-slate-850' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'gpa' && (
        <div className="space-y-6 w-full">
          {/* Institution Integration Warning Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#7C3AED]/5 border-[#7C3AED]/10 p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-[#7C3AED] shrink-0 border border-slate-800 shadow-glass">
              <HiOutlineLockClosed className="h-5 w-5 animate-pulse" />
            </div>
            <div className="space-y-1 text-left">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Institution Integration Required</h4>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                This feature will become available once academic data is integrated by the college administration. Hand-calculated GPA predictions can be simulated below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SGPA Calculator */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
                  SGPA Subject Calculator
                </h2>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Add course credits and target grades to calculate Semester GPA.</p>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {sgpaSubjects.map((sub, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-[#0B1220]/60 p-2 border border-slate-800/80 rounded-xl">
                  <input
                    value={sub.subject}
                    onChange={(e) => updateSgpaSubject(idx, 'subject', e.target.value)}
                    placeholder="Subject Name"
                    className="flex-1 text-xs bg-[#111827] border border-slate-800 text-white rounded-lg px-2.5 py-1.5"
                  />
                  <select
                    value={sub.credits}
                    onChange={(e) => updateSgpaSubject(idx, 'credits', Number(e.target.value))}
                    className="w-20 text-xs bg-[#111827] border border-slate-800 rounded-lg py-1.5 text-center font-semibold text-slate-300"
                  >
                    {[1, 2, 3, 4, 5].map(c => (
                      <option key={c} value={c}>{c} Cr</option>
                    ))}
                  </select>
                  <select
                    value={sub.grade}
                    onChange={(e) => updateSgpaSubject(idx, 'grade', e.target.value)}
                    className="w-16 text-xs bg-[#111827] border border-slate-800 rounded-lg py-1.5 text-center font-bold text-[#4F8CFF]"
                  >
                    {Object.keys(GRADE_POINTS).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeSgpaSubject(idx)}
                    className="text-xs text-[#EF4444] hover:text-[#EF4444]/80 p-1.5"
                    title="Remove Subject"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addSgpaSubject}
              className="py-2 bg-[#0B1220]/80 hover:bg-[#0b1220] border border-slate-800 text-xs font-bold text-[#4F8CFF] rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <HiOutlinePlus className="h-3.5 w-3.5" />
              <span>Add Subject</span>
            </button>

            {sgpaResult && (
              <div className="mt-2 p-4 bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-2xl flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#7C3AED]">Calculated SGPA</span>
                  <div className="text-3xl font-black text-white mt-1">{sgpaResult.sgpa}</div>
                </div>
                <div className="text-right text-[10px] text-[#94A3B8] font-semibold space-y-1">
                  <p>Total Credits: {sgpaResult.credits}</p>
                  <p>Percentage Eq: {sgpaResult.percentage}%</p>
                </div>
              </div>
            )}
          </div>

          {/* CGPA & Semester Target Predictor */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#4F8CFF]" />
                CGPA & Target GPA Predictor
              </h2>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Map past SGPAs and predict grades required in upcoming semesters to hit your targets.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
              {semesters.map((sem, idx) => (
                <div key={idx} className="bg-[#0B1220]/60 p-3 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-[#94A3B8] block uppercase">Sem {sem.semester} {sem.sgpa === 0 && '(Current)'}</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={sem.sgpa || ''}
                      onChange={(e) => updateSemesterSgpa(idx, 'sgpa', e.target.value)}
                      placeholder="SGPA (0 if active)"
                      className="w-full text-xs bg-[#111827] border border-slate-800 rounded-lg p-1.5"
                    />
                    <input
                      type="number"
                      value={sem.credits || ''}
                      onChange={(e) => updateSemesterSgpa(idx, 'credits', e.target.value)}
                      placeholder="Credits"
                      className="w-16 text-xs bg-[#111827] border border-slate-800 rounded-lg p-1.5 text-center"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recharts Area GPA Trend */}
            {chartGpaData.length > 0 && (
              <div className="border border-slate-800 bg-[#0B1220]/45 p-3.5 rounded-xl">
                <span className="text-[10px] text-[#94A3B8] font-bold block uppercase mb-3 flex items-center gap-1.5">
                  <HiOutlineTrendingUp className="h-4 w-4 text-[#4F8CFF]" />
                  <span>SGPA Progression Curve</span>
                </span>
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartGpaData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gpaGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F8CFF" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#4F8CFF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={8} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={8} tickLine={false} domain={[5, 10]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC', borderRadius: '6px', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="SGPA" stroke="#4F8CFF" strokeWidth={2} fillOpacity={1} fill="url(#gpaGlow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-[#0B1220]/80 p-4 border border-slate-800 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#94A3B8]">Target Graduation CGPA:</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(Number(e.target.value))}
                  className="w-16 text-xs text-center border-slate-800 bg-[#111827] rounded-lg p-1.5 focus:border-[#4F8CFF] font-bold text-[#4F8CFF]"
                />
              </div>

              {cgpaResult && (
                <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-3">
                  <div>
                    <span className="text-[9px] text-[#94A3B8] uppercase font-bold">Current CGPA</span>
                    <div className="text-2xl font-black text-[#22C55E] mt-0.5">{cgpaResult.cgpa}</div>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#94A3B8] uppercase font-bold">GPA Required Next Sem</span>
                    <div className="text-2xl font-black text-[#4F8CFF] mt-0.5">
                      {cgpaResult.gpaNeeded ? cgpaResult.gpaNeeded : 'N/A'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto flex flex-col gap-6 shadow-premium">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              Leave Safety Calculator
            </h2>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Verify leave safety constraints and calculate how many classes to attend consecutively to clear thresholds.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#94A3B8] font-bold uppercase">Attended Slots</label>
              <input
                type="number"
                value={attendance.attended}
                onChange={(e) => setAttendance({ ...attendance, attended: Number(e.target.value) })}
                className="w-full text-center bg-[#0B1220] border border-slate-800 rounded-xl py-2 font-semibold text-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#94A3B8] font-bold uppercase">Total Slots Held</label>
              <input
                type="number"
                value={attendance.total}
                onChange={(e) => setAttendance({ ...attendance, total: Number(e.target.value) })}
                className="w-full text-center bg-[#0B1220] border border-slate-800 rounded-xl py-2 font-semibold text-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#94A3B8] font-bold uppercase">Target Pct (%)</label>
              <input
                type="number"
                value={attendance.target}
                onChange={(e) => setAttendance({ ...attendance, target: Number(e.target.value) })}
                className="w-full text-center bg-[#0B1220] border border-slate-800 rounded-xl py-2 font-bold text-[#4F8CFF]"
              />
            </div>
          </div>

          {attendanceResult && (
            <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${
              attendanceResult.status === 'success' 
                ? 'bg-[#22C55E]/5 border-[#22C55E]/20 text-[#22C55E]' 
                : 'bg-[#EF4444]/5 border-[#EF4444]/20 text-[#EF4444]'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold">Estimated Ratio</span>
                <span className="text-3xl font-black">{attendanceResult.percentage}%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">{attendanceResult.message}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'trackers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Backlog Tracker */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                Backlog & Credits Tracker
              </h2>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Inspect backlog courses and track cumulative credit progress metrics.</p>
            </div>

            <form onSubmit={addBacklog} className="flex gap-2 bg-[#0B1220]/60 p-2 border border-slate-800/80 rounded-xl">
              <input
                placeholder="Course Title"
                value={newBacklog.subject}
                onChange={(e) => setNewBacklog({ ...newBacklog, subject: e.target.value })}
                className="flex-1 text-xs bg-[#111827] border border-slate-800 rounded-lg px-2.5 py-1.5"
              />
              <input
                placeholder="Code"
                value={newBacklog.code}
                onChange={(e) => setNewBacklog({ ...newBacklog, code: e.target.value })}
                className="w-20 text-xs text-center bg-[#111827] border border-slate-800 rounded-lg py-1.5"
              />
              <button
                type="submit"
                className="px-4 bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] hover:opacity-95 text-white font-bold text-xs rounded-lg transition"
              >
                Track
              </button>
            </form>

            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {backlogs.map((b, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-[#0B1220]/40 border border-slate-800 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{b.subject}</h4>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">{b.code} · {b.credits} Credits</p>
                  </div>
                  <button
                    onClick={() => toggleBacklogStatus(idx)}
                    className={`px-3 py-1 text-[9px] font-black rounded-full uppercase border ${
                      b.status === 'Cleared' 
                        ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20' 
                        : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                    }`}
                  >
                    {b.status}
                  </button>
                </div>
              ))}
              {backlogs.length === 0 && (
                <p className="text-center py-6 text-slate-500 text-xs font-medium">No backlogs reported. Perfect record! 🌟</p>
              )}
            </div>
          </div>

          {/* Countdowns list */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                University Exam Countdowns
              </h2>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Timetable countdown markers for University milestones.</p>
            </div>

            <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1">
              {COUNTDOWNS.map((c, idx) => (
                <div key={idx} className="p-3.5 bg-[#0B1220]/45 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-200">{c.title}</h3>
                    <span className="text-[9px] font-black text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 px-2 py-0.5 rounded-full uppercase">
                      {c.days} days left
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-[#94A3B8] font-semibold">
                    <span>Target Date: {c.date}</span>
                    <span>Progress: {Math.max(0, 100 - Math.round(c.days / 2))}%</span>
                  </div>
                  <div className="w-full bg-[#1E293B] rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-[#EF4444] to-[#F59E0B] h-1.5 rounded-full" 
                      style={{ width: `${Math.max(10, 100 - Math.round(c.days / 2))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
