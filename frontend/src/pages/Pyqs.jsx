import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  HiOutlineSearch, 
  HiOutlineCollection,
  HiOutlineUser,
  HiOutlineAcademicCap,
  HiOutlineFolderOpen,
  HiOutlineChevronRight,
  HiOutlineLightningBolt
} from 'react-icons/hi';
import { fetchSubjects } from '../services/academicService';
import { SelectInput } from '../components/SelectInput';
import { SkeletonCard } from '../components/SkeletonLoader';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CHEM', 'MATH', 'BIOTECH', 'HUM'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function Pyqs() {
  const navigate = useNavigate();
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [search, setSearch] = useState('');

  // Fetch subjects with counts
  const { data: subjectsData, isLoading } = useQuery({
    queryKey: ['student-subjects-pyqs', department, semester],
    queryFn: () => fetchSubjects({ department, semester })
  });

  const handleSubjectClick = (sub) => {
    navigate(`/subjects/${encodeURIComponent(sub.subject)}/Previous%20Year%20Questions?department=${sub.department}&semester=${sub.semester}`);
  };

  // Filter local search
  const filteredSubjects = subjectsData?.data?.filter((sub) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      sub.subject.toLowerCase().includes(term) ||
      sub.department.toLowerCase().includes(term) ||
      sub.faculty.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="p-6 min-h-screen text-slate-100 text-left">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Title and stats welcome banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#1E293B] via-[#111827] to-[#0B1220] border border-slate-800 p-6 md:p-8 shadow-premium relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute right-0 top-0 h-40 w-40 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-3 py-0.5 text-[9px] font-extrabold tracking-wider text-red-400 uppercase">
              University PYQ Archive
            </span>
            <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight">Previous Year Question Papers</h1>
            <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
              Find historical board papers, cycle tests templates, model exams, and solved solution keys mapped by course directories.
            </p>
          </div>

          <div className="bg-[#0B1220]/80 p-4 rounded-2xl border border-slate-800/80 shrink-0 min-w-[180px] text-center shadow-glass relative z-10">
            <span className="text-[9px] text-[#94A3B8] font-bold block uppercase tracking-wider">Indexed Archives</span>
            <span className="text-2xl font-black text-red-400 block mt-1">{subjectsData?.data?.length || 0} Subjects</span>
            <span className="text-[8px] text-[#22C55E] uppercase font-bold block mt-1">Mock analytics enabled</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-glass">
          <div className="relative md:col-span-2">
            <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search papers or courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 pl-10 pr-3.5 text-xs text-slate-200 placeholder-slate-500 focus:border-red-500 focus:outline-none transition"
            />
          </div>

          <SelectInput
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={DEPARTMENTS}
            placeholder="All Departments"
          />

          <SelectInput
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            options={SEMESTERS}
            placeholder="All Semesters"
          />
        </div>

        {/* Subjects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-[#111827] border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-[#111827]/40 p-12 text-center text-[#94A3B8] flex flex-col items-center justify-center gap-3">
            <HiOutlineFolderOpen className="h-10 w-10 text-slate-600" />
            <div>
              <p className="text-sm font-bold text-white">No subjects indexed yet</p>
              <p className="text-[11px] text-slate-500 mt-1">Please try modifying your search filters or check back later.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredSubjects.map((sub, index) => (
              <div
                key={`${sub.department}-${sub.semester}-${index}`}
                onClick={() => handleSubjectClick(sub)}
                className="cursor-pointer rounded-2xl border border-slate-800 bg-[#111827] hover:border-red-500/25 hover:bg-[#1E293B]/20 p-5 shadow-glass flex flex-col justify-between hover-glow transition text-left group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-full bg-slate-900 border border-slate-800 px-2.5 py-0.5 text-[9px] font-bold text-slate-400 uppercase">
                      {sub.department} · Sem {sub.semester}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] text-[#EF4444] font-black bg-[#EF4444]/10 px-2.5 py-0.5 rounded-full uppercase border border-[#EF4444]/15">
                      <HiOutlineCollection className="h-3.5 w-3.5" />
                      {sub.pyqCount || 0} PYQs
                    </span>
                  </div>

                  <h3 className="font-black text-slate-100 text-sm mt-4 group-hover:text-red-400 transition line-clamp-2 leading-relaxed">
                    {sub.subject}
                  </h3>

                  <div className="flex flex-col gap-1.5 mt-4 text-[11px] text-[#94A3B8] border-t border-slate-800/60 pt-3.5">
                    <div className="flex items-center gap-2">
                      <HiOutlineUser className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate font-semibold">{sub.faculty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiOutlineAcademicCap className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{sub.credits} Course Credits</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 flex items-center justify-between border-t border-slate-800/40 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>Open PYQ Folder</span>
                  <div className="rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-450 group-hover:text-red-400 group-hover:border-red-500/20 transition duration-200">
                    <HiOutlineChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
