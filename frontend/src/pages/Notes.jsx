import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  HiOutlineSearch, 
  HiOutlineBookOpen,
  HiOutlineUser,
  HiOutlineAcademicCap,
  HiOutlineFolderOpen,
  HiOutlineChevronRight,
  HiOutlineBookOpen as HiBookOpen,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineGlobeAlt,
  HiOutlineEye
} from 'react-icons/hi';
import { fetchSubjects, fetchAcademicResources } from '../services/academicService';
import { SelectInput } from '../components/SelectInput';
import { SkeletonCard } from '../components/SkeletonLoader';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CHEM', 'MATH', 'BIOTECH', 'HUM'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function Notes() {
  const navigate = useNavigate();
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'global_search'

  // Fetch subjects with counts
  const { data: subjectsData, isLoading } = useQuery({
    queryKey: ['student-subjects', department, semester],
    queryFn: () => fetchSubjects({ department, semester })
  });

  // Global search across all providers
  const { data: globalSearchData, isLoading: isGlobalSearching } = useQuery({
    queryKey: ['global-resource-search', search],
    queryFn: () => fetchAcademicResources({ search }),
    enabled: activeTab === 'global_search' && search.trim().length > 0
  });

  const handleSubjectClick = (sub) => {
    navigate(`/subjects/${encodeURIComponent(sub.subject)}?department=${sub.department}&semester=${sub.semester}`);
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

  // Group search files dynamically by categories
  const globalFiles = globalSearchData?.data || [];
  const grouped = {
    Notes: globalFiles.filter(f => ['notes', 'lecture ppts', 'syllabus', 'cheat sheets', 'formula sheets', 'tutorial sheets', 'important questions', 'question banks', 'lab manuals', 'lab records'].includes((f.category || '').toLowerCase())),
    PYQs: globalFiles.filter(f => ['previous year questions', 'pyq'].includes((f.category || '').toLowerCase())),
    Assignments: globalFiles.filter(f => (f.category || '').toLowerCase() === 'assignments'),
    Books: globalFiles.filter(f => (f.category || '').toLowerCase() === 'reference books')
  };

  return (
    <div className="p-6 min-h-screen text-slate-100 text-left">
      <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
        
        {/* Title and stats welcome banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#1E293B] via-[#111827] to-[#0B1220] border border-slate-800 p-6 md:p-8 shadow-premium relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute right-0 top-0 h-40 w-40 bg-[#4F8CFF]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="inline-flex items-center rounded-full bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 px-3 py-0.5 text-[9px] font-extrabold tracking-wider text-[#4F8CFF] uppercase">
              Syllabus Catalog
            </span>
            <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight">Academic Syllabus & Notes</h1>
            <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
              Select your department and semester to browse courses, lecture slides, reference documents, and AI study resources.
            </p>
          </div>

          <div className="bg-[#0B1220]/80 p-4 rounded-2xl border border-slate-800/80 shrink-0 min-w-[180px] text-center shadow-glass relative z-10">
            <span className="text-[9px] text-[#94A3B8] font-bold block uppercase tracking-wider">Indexed Classes</span>
            <span className="text-2xl font-black text-[#4F8CFF] block mt-1">{subjectsData?.data?.length || 0} Subjects</span>
            <span className="text-[8px] text-[#22C55E] uppercase font-bold block mt-1">Ready for download</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 border-b border-slate-800 pb-px">
          <button
            onClick={() => { setActiveTab('catalog'); setSearch(''); }}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${activeTab === 'catalog' ? 'border-[#4F8CFF] text-[#4F8CFF]' : 'border-transparent text-slate-500 hover:text-slate-350'}`}
          >
            Browse Course Catalog
          </button>
          <button
            onClick={() => { setActiveTab('global_search'); setSearch(''); }}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${activeTab === 'global_search' ? 'border-[#4F8CFF] text-[#4F8CFF]' : 'border-transparent text-slate-500 hover:text-slate-350'}`}
          >
            Global Academic Search
          </button>
        </div>

        {/* BROWSE SUBJECTS TAB */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-glass">
              <div className="relative md:col-span-2">
                <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search subjects or faculty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 pl-10 pr-3.5 text-xs text-slate-200 placeholder-slate-500 focus:border-[#4F8CFF] focus:outline-none transition"
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
                    className="cursor-pointer rounded-2xl border border-slate-800 bg-[#111827] hover:border-slate-700 hover:bg-[#1E293B]/20 p-5 shadow-glass flex flex-col justify-between hover-glow transition text-left group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex rounded-full bg-slate-900 border border-slate-800 px-2.5 py-0.5 text-[9px] font-bold text-slate-400 uppercase">
                          {sub.department} · Sem {sub.semester}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] text-[#4F8CFF] font-black bg-[#4F8CFF]/10 px-2.5 py-0.5 rounded-full uppercase border border-[#4F8CFF]/15">
                          <HiOutlineBookOpen className="h-3.5 w-3.5" />
                          {sub.notesCount || 0} Files
                        </span>
                      </div>

                      <h3 className="font-black text-slate-100 text-sm mt-4 group-hover:text-[#4F8CFF] transition line-clamp-2 leading-relaxed">
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
                      <span>Explore workspace</span>
                      <div className="rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-450 group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/20 transition duration-200">
                        <HiOutlineChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GLOBAL FILE SEARCH TAB */}
        {activeTab === 'global_search' && (
          <div className="space-y-6">
            {/* Search Toolbar */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-glass">
              <div className="relative w-full">
                <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search across all providers once for Notes, PYQs, Assignments, Reference Books..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 pl-10 pr-3.5 text-xs text-slate-250 placeholder-slate-500 focus:border-[#4F8CFF] focus:outline-none transition duration-150"
                />
              </div>
            </div>

            {/* Results Output */}
            {isGlobalSearching ? (
              <div className="p-12 text-center text-slate-400 animate-pulse text-xs">Querying all enabled content resource providers...</div>
            ) : search.trim().length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-[#111827]/40 p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <HiOutlineSearch className="h-8 w-8 text-slate-700" />
                <p>Type a search term above to run a query once across all active providers (Campus, Google Drive, Helper).</p>
              </div>
            ) : globalFiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-[#111827]/40 p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <HiOutlineFolderOpen className="h-8 w-8 text-slate-700" />
                <p>No matching resources found. Try using simpler search keywords.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.keys(grouped).map(groupName => {
                  const items = grouped[groupName];
                  if (items.length === 0) return null;
                  return (
                    <div key={groupName} className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#4F8CFF] flex items-center gap-2 pb-2 border-b border-slate-800/60">
                        <HiOutlineFolderOpen className="h-4.5 w-4.5 text-[#4F8CFF]" />
                        {groupName} ({items.length})
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map((item) => (
                          <div key={item._id} className="rounded-2xl border border-slate-850 bg-[#111827]/80 hover:bg-[#111827] p-4 flex flex-col justify-between hover-glow transition duration-200 group relative overflow-hidden">
                            <div className="absolute right-0 top-0 h-16 w-16 bg-[#4F8CFF]/2 rounded-full blur-xl pointer-events-none" />
                            
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="inline-flex rounded bg-[#4F8CFF]/15 text-[#4F8CFF] px-2 py-0.5 font-bold uppercase text-[8px]">
                                    {item.fileType || 'PDF'}
                                  </span>
                                  <span className={`inline-flex rounded px-2 py-0.5 font-bold uppercase text-[8px] border ${
                                    item.source === 'CampusConnect' ? 'bg-[#4F8CFF]/10 text-[#4F8CFF] border-[#4F8CFF]/15' :
                                    item.source === 'Google Drive' ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/15' :
                                    'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/15'
                                  }`}>
                                    {item.source || 'CampusConnect'}
                                  </span>
                                </div>
                              </div>

                              <h4 className="font-bold text-slate-100 text-sm mt-3 group-hover:text-[#4F8CFF] transition line-clamp-2 leading-snug">
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-slate-450 mt-1 font-semibold">
                                Subject: {item.subject} &bull; Semester {item.semester} &bull; {item.department}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-850">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">
                                {item.fileSize || '1.2 MB'} &bull; {item.downloads || 0} Downloads
                              </span>
                              <Link
                                to={`/subjects/${encodeURIComponent(item.subject)}/${encodeURIComponent(item.category === 'Previous Year Questions' ? 'Previous Year Questions' : 'Notes')}?department=${item.department}&semester=${item.semester}`}
                                className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#4F8CFF] hover:text-[#7C3AED] transition bg-[#4F8CFF]/10 px-3.5 py-1.5 rounded-xl border border-[#4F8CFF]/15"
                              >
                                <HiOutlineEye className="h-4.5 w-4.5" />
                                Go View
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
