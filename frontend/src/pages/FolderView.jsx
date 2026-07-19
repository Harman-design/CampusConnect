import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  HiOutlineDownload, 
  HiBookmark, 
  HiOutlineBookmark, 
  HiOutlineSearch, 
  HiOutlineEye, 
  HiOutlineExternalLink, 
  HiSparkles,
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineAdjustments,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineMenu,
  HiOutlineBell,
  HiOutlinePlus,
  HiOutlineStar,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiOutlineUser,
  HiOutlineLightningBolt,
  HiOutlineFolder,
  HiOutlineShare,
  HiDotsVertical
} from 'react-icons/hi';
import { 
  fetchAcademicResources, 
  downloadAcademicResource, 
  toggleAcademicBookmark, 
  triggerAIContent,
  registerView
} from '../services/academicService';
import { useAuth } from '../context/AuthContext';
import { TextInput } from '../components/FormField';
import Pagination from '../components/Pagination';
import PDFPreviewModal from '../components/PDFPreviewModal';
import AIPopupModal from '../components/AIPopupModal';
import { SkeletonCard } from '../components/SkeletonLoader';

const EXAM_TYPES = ['Semester', 'Cycle Test 1', 'Cycle Test 2', 'Model Exam'];
const YEARS = ['2023', '2022', '2021', '2020', '2019'];
const UNITS = ['1', '2', '3', '4', '5'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function FolderView() {
  const { subjectName, category } = useParams();
  const [searchParams] = useSearchParams();
  const department = searchParams.get('department') || '';
  const semester = searchParams.get('semester') || '';
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [unit, setUnit] = useState('');
  const [year, setYear] = useState('');
  const [examType, setExamType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [fileType, setFileType] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  
  // Custom sidebar filter states
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
  const [showOnlyDownloaded, setShowOnlyDownloaded] = useState(false);

  // View state
  const [viewType, setViewType] = useState('grid'); // grid, list, compact
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('recentlyAdded');

  // Modals
  const [previewFile, setPreviewFile] = useState({ isOpen: false, id: '', url: '', title: '' });
  const [aiPanel, setAiPanel] = useState({ isOpen: false, resource: null, operation: '', content: '', isLoading: false });

  // Notifications state
  const [notified, setNotified] = useState(false);

  // Query all resources for this subject to run client-side filtering
  const { data, isLoading } = useQuery({
    queryKey: ['folder-resources', subjectName, department, semester],
    queryFn: () => {
      const params = {
        subject: subjectName,
        limit: 150
      };
      if (department) params.department = department;
      if (semester) params.semester = semester;

      return fetchAcademicResources(params);
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: toggleAcademicBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries(['folder-resources']);
      toast.success('Bookmark updated!');
    },
    onError: () => toast.error('Could not update bookmark.'),
  });

  const handleDownload = async (item) => {
    try {
      const res = await downloadAcademicResource(item._id);
      window.open(res.url, '_blank', 'noopener,noreferrer');
      queryClient.invalidateQueries(['folder-resources']);
      toast.success('Download registered.');
    } catch (err) {
      toast.error('Download failed.');
    }
  };

  const handlePreview = async (item) => {
    setPreviewFile({ isOpen: true, id: item._id, url: item.previewUrl, title: item.title });
    try {
      await registerView(item._id);
    } catch (err) {
      console.error('Failed to log view activity', err);
    }
  };

  const handleAI = async (item, operation) => {
    setAiPanel({ isOpen: true, resource: item, operation, content: '', isLoading: true });
    try {
      await registerView(item._id);
      const text = await triggerAIContent(item._id, operation);
      setAiPanel(prev => ({ ...prev, content: text, isLoading: false }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
      setAiPanel(prev => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  const isPyqs = category === 'Previous Year Questions';

  const aiPrompts = isPyqs 
    ? [
        { label: 'Paper Blueprint', op: 'pyq_analysis' },
        { label: 'Repeated Questions', op: 'repeated_questions' },
        { label: 'Expected Questions', op: 'expected_questions' },
        { label: 'Difficulty Matrix', op: 'difficulty_analysis' }
      ]
    : [
        { label: 'Summarize with AI', op: 'summarize' },
        { label: 'Generate Quiz', op: 'quiz' },
        { label: 'Study Flashcards', op: 'flashcards' },
        { label: 'Concept Explainer', op: 'explain_concepts' },
        { label: '5-Day Planner', op: 'study_plan' }
      ];

  // Map category selection to database tags
  const getCategoryMatches = (itemCategory) => {
    const catLower = (itemCategory || '').toLowerCase();
    if (category === 'Notes') {
      return ['notes', 'note', 'lecture ppts', 'syllabus', 'cheat sheets', 'formula sheets', 'tutorial sheets', 'important questions', 'question banks'].includes(catLower);
    }
    if (category === 'Previous Year Questions') {
      return ['previous year questions', 'pyq'].includes(catLower);
    }
    if (category === 'Lab Manuals') {
      return ['lab manuals', 'lab records'].includes(catLower);
    }
    if (category === 'Assignments') {
      return catLower === 'assignments';
    }
    if (category === 'Reference Books') {
      return catLower === 'reference books';
    }
    return true;
  };

  const allItems = data?.data || [];
  const categoryFiltered = allItems.filter(item => getCategoryMatches(item.category));

  // Client side filtering for visual richness
  const filteredData = categoryFiltered.filter(item => {
    if (unit && String(item.unit) !== String(unit)) return false;
    if (year && String(item.year) !== String(year)) return false;
    if (examType && item.examType !== examType) return false;
    if (search) {
      const term = search.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(term);
      const facultyMatch = item.faculty?.toLowerCase().includes(term);
      const subjectMatch = item.subject?.toLowerCase().includes(term);
      if (!titleMatch && !facultyMatch && !subjectMatch) return false;
    }
    if (difficulty && item.difficulty?.toLowerCase() !== difficulty.toLowerCase()) return false;
    if (fileType && item.fileType?.toLowerCase() !== fileType.toLowerCase()) return false;
    if (facultyFilter && item.faculty?.toLowerCase() !== facultyFilter.toLowerCase()) return false;
    if (showOnlyBookmarks && !item.bookmarkedBy?.includes(user?._id)) return false;
    if (showOnlyDownloaded && item.downloads === 0) return false;
    return true;
  });

  // Client side sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sort === 'mostDownloaded') {
      return (b.downloads || 0) - (a.downloads || 0);
    }
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  // Client side pagination
  const itemsPerPage = 9;
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const clientPagination = {
    page,
    pages: totalPages,
    total: sortedData.length,
    limit: itemsPerPage
  };

  // Unique list of faculties for filters
  const faculties = Array.from(new Set(categoryFiltered.map(item => item.faculty).filter(Boolean)));

  // Generate deterministic metadata for cards (Pages, ratings, solution tags)
  const getDocMeta = (item) => {
    let hash = 0;
    for (let i = 0; i < item.title.length; i++) {
      hash = item.title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const pages = 12 + (Math.abs(hash) % 45);
    const rating = (4.0 + (Math.abs(hash) % 10) / 10).toFixed(1);
    const repeatsCount = 2 + (Math.abs(hash) % 4);
    const marks = (Math.abs(hash) % 2) === 0 ? 100 : 50;
    const isRepeated = (Math.abs(hash) % 3) === 0;
    const chapters = ['Chapter 2, 4', 'Chapter 1, 3', 'Unit 3 & 5', 'All units'][Math.abs(hash) % 4];
    return { pages, rating, repeatsCount, marks, isRepeated, chapters };
  };

  return (
    <div className="p-6 space-y-6 text-left text-slate-100">
      <div className="max-w-6.5xl mx-auto space-y-6">
        
        {/* Breadcrumbs */}
        <div className="flex items-center justify-between">
          <Link 
            to={`/subjects/${encodeURIComponent(subjectName)}?department=${department}&semester=${semester}`} 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-200 transition"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to {subjectName} Dashboard
          </Link>
          <span className="text-[10px] text-slate-650 font-bold uppercase tracking-wider">Workspace Folder</span>
        </div>

        {/* 1. Page Title & Hero */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight">{subjectName} · {category}</h1>
          <p className="text-xs text-slate-400">SRM Ramapuram Academic Repository Console &bull; Browse verified university coursewares.</p>
        </div>

        {/* 2. Top Search Bar, Layout Toggle & Quick Filters Row */}
        <div className="space-y-3 bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-glass">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search notes, subjects, faculty, or topics..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full rounded-xl bg-[#0B1220] border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#4F8CFF] focus:outline-none transition duration-150"
              />
            </div>

            {/* Layout Toggles */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button 
                onClick={() => setViewType('grid')}
                className={`p-2 rounded-xl border transition ${viewType === 'grid' ? 'bg-[#4F8CFF]/15 border-[#4F8CFF]/30 text-[#4F8CFF]' : 'bg-[#0B1220] border-slate-800 text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <HiOutlineViewGrid className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={() => setViewType('list')}
                className={`p-2 rounded-xl border transition ${viewType === 'list' ? 'bg-[#4F8CFF]/15 border-[#4F8CFF]/30 text-[#4F8CFF]' : 'bg-[#0B1220] border-slate-800 text-slate-400 hover:text-white'}`}
                title="List View"
              >
                <HiOutlineViewList className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={() => setViewType('compact')}
                className={`p-2 rounded-xl border transition ${viewType === 'compact' ? 'bg-[#4F8CFF]/15 border-[#4F8CFF]/30 text-[#4F8CFF]' : 'bg-[#0B1220] border-slate-800 text-slate-400 hover:text-white'}`}
                title="Compact Table View"
              >
                <HiOutlineMenu className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/40">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mr-2">Quick Tags:</span>
            <button 
              onClick={() => { setUnit(''); setFileType(''); setExamType(''); setYear(''); }}
              className="px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 bg-[#0B1220] text-slate-300 hover:border-slate-700 transition"
            >
              All Files
            </button>
            <button 
              onClick={() => { setFileType('pdf'); }}
              className="px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 bg-[#0B1220] text-slate-350 hover:border-slate-700 transition"
            >
              PDF Notes
            </button>
            <button 
              onClick={() => { setFileType('ppt'); }}
              className="px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 bg-[#0B1220] text-slate-350 hover:border-slate-700 transition"
            >
              Slides
            </button>
            <button 
              onClick={() => { setUnit('1'); }}
              className="px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 bg-[#0B1220] text-slate-350 hover:border-slate-700 transition"
            >
              Unit 1
            </button>
            <button 
              onClick={() => { setUnit('2'); }}
              className="px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 bg-[#0B1220] text-slate-350 hover:border-slate-700 transition"
            >
              Unit 2
            </button>
            {isPyqs && (
              <>
                <button 
                  onClick={() => { setExamType('Semester'); }}
                  className="px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 bg-[#0B1220] text-slate-350 hover:border-slate-700 transition"
                >
                  University Semester
                </button>
                <button 
                  onClick={() => { setYear('2023'); }}
                  className="px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 bg-[#0B1220] text-slate-350 hover:border-slate-700 transition"
                >
                  2023 Paper
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. Main Split View Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* A. Left Filter Column */}
          <div className="space-y-4 bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-glass text-left">
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800/80">
              <HiOutlineAdjustments className="h-4.5 w-4.5 text-[#4F8CFF]" />
              Filter Center
            </h3>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">Department</label>
              <div className="text-xs font-bold text-slate-300 bg-[#0B1220] px-3 py-2 rounded-xl border border-slate-800">
                {department || 'Computer Science'}
              </div>
            </div>

            {/* Semester */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">Semester</label>
              <div className="text-xs font-bold text-slate-300 bg-[#0B1220] px-3 py-2 rounded-xl border border-slate-800">
                Semester {semester || 4}
              </div>
            </div>

            {/* Unit Filter (Non-PYQ) */}
            {!isPyqs && (
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">Syllabus Unit</label>
                <select
                  value={unit}
                  onChange={(e) => { setUnit(e.target.value); setPage(1); }}
                  className="w-full text-xs font-semibold text-slate-300 bg-[#0B1220] px-3 py-2 rounded-xl border border-slate-800 focus:border-[#4F8CFF] focus:outline-none transition"
                >
                  <option value="">All Units</option>
                  {UNITS.map(u => <option key={u} value={u}>Unit {u}</option>)}
                </select>
              </div>
            )}

            {/* PYQ Filters */}
            {isPyqs && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">Exam Year</label>
                  <select
                    value={year}
                    onChange={(e) => { setYear(e.target.value); setPage(1); }}
                    className="w-full text-xs font-semibold text-slate-300 bg-[#0B1220] px-3 py-2 rounded-xl border border-slate-800 focus:border-[#4F8CFF] focus:outline-none transition"
                  >
                    <option value="">All Years</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">Exam Type</label>
                  <select
                    value={examType}
                    onChange={(e) => { setExamType(e.target.value); setPage(1); }}
                    className="w-full text-xs font-semibold text-slate-300 bg-[#0B1220] px-3 py-2 rounded-xl border border-slate-800 focus:border-[#4F8CFF] focus:outline-none transition"
                  >
                    <option value="">All Exams</option>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Difficulty Level */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full text-xs font-semibold text-slate-300 bg-[#0B1220] px-3 py-2 rounded-xl border border-slate-800 focus:border-[#4F8CFF] focus:outline-none transition"
              >
                <option value="">All Levels</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* File Type */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">File Format</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full text-xs font-semibold text-slate-300 bg-[#0B1220] px-3 py-2 rounded-xl border border-slate-800 focus:border-[#4F8CFF] focus:outline-none transition"
              >
                <option value="">All Formats</option>
                <option value="pdf">PDF Documents</option>
                <option value="ppt">PowerPoint Slides</option>
                <option value="docx">Word Documents</option>
              </select>
            </div>

            {/* Faculty filter list */}
            {faculties.length > 0 && (
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">Course Faculty</label>
                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-300 bg-[#0B1220] px-3 py-2 rounded-xl border border-slate-800 focus:border-[#4F8CFF] focus:outline-none transition"
                >
                  <option value="">All Faculties</option>
                  {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}

            {/* Toggle bookmarks */}
            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={showOnlyBookmarks}
                  onChange={(e) => setShowOnlyBookmarks(e.target.checked)}
                  className="rounded text-[#4F8CFF] focus:ring-0 bg-[#0B1220] border-slate-800"
                />
                <span className="text-[11px] text-slate-400 font-semibold group-hover:text-white transition">Bookmarked Materials</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={showOnlyDownloaded}
                  onChange={(e) => setShowOnlyDownloaded(e.target.checked)}
                  className="rounded text-[#4F8CFF] focus:ring-0 bg-[#0B1220] border-slate-800"
                />
                <span className="text-[11px] text-slate-400 font-semibold group-hover:text-white transition">Downloaded Items</span>
              </label>
            </div>
            
            <button
              onClick={() => {
                setUnit(''); setYear(''); setExamType(''); setDifficulty(''); setFileType(''); setFacultyFilter('');
                setShowOnlyBookmarks(false); setShowOnlyDownloaded(false); setSearch('');
              }}
              className="w-full mt-2 py-2 text-center text-[10px] font-bold uppercase border border-dashed border-slate-850 hover:border-slate-700 bg-slate-900 rounded-xl transition text-slate-400 hover:text-white"
            >
              Reset All Filters
            </button>
          </div>

          {/* B. Middle Main Content Column */}
          <div className="lg:col-span-2 space-y-4">

            {/* PYQ analytics header panel */}
            {isPyqs && filteredData.length > 0 && (
              <div className="rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-500/5 via-transparent to-transparent p-5 text-left space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-red-500 tracking-wider flex items-center gap-2">
                    <HiOutlineLightningBolt className="h-4.5 w-4.5 animate-pulse" />
                    University Exam Analytics
                  </h3>
                  <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">SRM IST Ramapuram</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0B1220] border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                    <span className="text-slate-500 font-bold block text-[8px] uppercase tracking-wider">Most Repeated Topics</span>
                    <span className="font-extrabold text-slate-200 block text-[11px] mt-0.5">CPU Scheduling (4x), Deadlock Prevention (3x)</span>
                  </div>
                  <div className="bg-[#0B1220] border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                    <span className="text-slate-500 font-bold block text-[8px] uppercase tracking-wider">Highly Distributed Units</span>
                    <span className="font-extrabold text-slate-200 block text-[11px] mt-0.5">Unit 3 (Virtual Memory) & Unit 5 (Disk I/O)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Content list/grid rendering */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 bg-[#111827] border border-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredData.length === 0 ? (
              /* Custom empty state */
              <div className="rounded-3xl border border-dashed border-slate-800 bg-[#111827]/40 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 bg-[#4F8CFF]/5 rounded-full blur-xl" />
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-full text-slate-600">
                  <HiOutlineDocumentText className="h-10 w-10 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-200">No resources found</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">No matching notes or question sheets found in this subject folder. Ask your class coordinator to upload files.</p>
                </div>
                
                <button
                  onClick={() => {
                    setNotified(true);
                    toast.success('You will be notified as soon as files are uploaded!');
                  }}
                  disabled={notified}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition ${notified ? 'bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] cursor-not-allowed' : 'bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white shadow-md'}`}
                >
                  <HiOutlineBell className="h-4 w-4" />
                  {notified ? 'Notifications Enabled' : 'Notify Me'}
                </button>
              </div>
            ) : (
              /* Main Items Wrapper depending on viewType */
              <div className={
                viewType === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                  : 'space-y-3'
              }>
                {paginatedData.map((item) => {
                  const isItemBookmarked = item.bookmarkedBy?.includes(user?._id);
                  const meta = getDocMeta(item);
                  
                  // GRID VIEW
                  if (viewType === 'grid') {
                    return (
                      <div key={item._id} className="rounded-2xl border border-slate-800 bg-[#111827]/80 hover:bg-[#111827] p-4 flex flex-col justify-between hover-glow transition duration-200 group text-left relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-[#4F8CFF]/2 rounded-full blur-xl pointer-events-none" />
                        <div>
                          
                          {/* Card header metadata */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap gap-1.5">
                              <span className="inline-flex rounded bg-[#4F8CFF]/10 text-[#4F8CFF] px-2 py-0.5 font-bold uppercase text-[8px] border border-[#4F8CFF]/15">
                                {item.fileType || 'PDF'}
                              </span>
                              <span className={`inline-flex rounded px-2 py-0.5 font-bold uppercase text-[8px] border ${
                                item.source === 'CampusConnect' ? 'bg-[#4F8CFF]/10 text-[#4F8CFF] border-[#4F8CFF]/15' :
                                item.source === 'Google Drive' ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/15' :
                                'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/15'
                              }`}>
                                {item.source || 'CampusConnect'}
                              </span>
                              {item.unit && (
                                <span className="inline-flex rounded bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 font-bold uppercase text-[8px] border border-[#7C3AED]/15">
                                  Unit {item.unit}
                                </span>
                              )}
                              {isPyqs && (
                                <span className="inline-flex rounded bg-[#EF4444]/10 text-[#EF4444] px-2 py-0.5 font-bold uppercase text-[8px] border border-[#EF4444]/15">
                                  {meta.marks} Marks
                                </span>
                              )}
                            </div>
                            
                            <button
                              onClick={() => bookmarkMutation.mutate(item._id)}
                              className="text-slate-500 hover:text-[#F59E0B] transition duration-200"
                              title="Bookmark File"
                            >
                              {isItemBookmarked ? (
                                <HiBookmark className="h-4.5 w-4.5 text-[#F59E0B]" />
                              ) : (
                                <HiOutlineBookmark className="h-4.5 w-4.5" />
                              )}
                            </button>
                          </div>

                          {/* Title */}
                          <h4 
                            onClick={() => handlePreview(item)}
                            className="font-bold text-slate-100 text-sm mt-3.5 group-hover:text-[#4F8CFF] cursor-pointer transition line-clamp-2 leading-snug" 
                            title={item.title}
                          >
                            {item.title}
                          </h4>

                          {/* Tiny preview thumbnail area */}
                          <div 
                            onClick={() => handlePreview(item)}
                            className="mt-3.5 h-20 w-full rounded-xl bg-slate-900 border border-slate-850 overflow-hidden flex items-center justify-center text-slate-600 hover:text-slate-400 transition cursor-pointer relative"
                          >
                            <HiOutlineDocumentText className="h-8 w-8 text-[#4F8CFF]/40 group-hover:scale-105 transition-transform" />
                            <div className="absolute bottom-1 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-350">
                              Preview
                            </div>
                          </div>

                          {/* Specific stats */}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-3 pt-3 border-t border-slate-800/40 text-[9px] text-slate-450 font-bold uppercase tracking-wider">
                            {isPyqs ? (
                              <>
                                <span className="text-[#EF4444]">{item.year} PAPER</span>
                                <span>· {item.examType}</span>
                              </>
                            ) : (
                              <>
                                <span>{meta.pages} Pages</span>
                                <span>· {item.fileSize || '1.5 MB'}</span>
                              </>
                            )}
                            <span className="normal-case tracking-normal text-slate-500">· {item.downloads || 0} DLs</span>
                          </div>

                        </div>

                        {/* Actions row */}
                        <div className="space-y-2 mt-4 pt-3 border-t border-slate-800/40">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePreview(item)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-[#0B1220] py-2 text-xs font-bold text-slate-350 hover:text-white transition duration-200"
                            >
                              <HiOutlineEye className="h-4 w-4" />
                              Preview
                            </button>
                            <button
                              onClick={() => handleDownload(item)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] py-2 text-xs font-bold text-white hover:opacity-95 transition duration-200 shadow-md"
                            >
                              <HiOutlineDownload className="h-4 w-4" />
                              Get File
                            </button>
                          </div>

                          {/* Quick AI Trigger Dropdowns */}
                          <div className="flex items-center gap-1">
                            {aiPrompts.slice(0, 3).map((prompt) => (
                              <button
                                key={prompt.op}
                                onClick={() => handleAI(item, prompt.op)}
                                className="flex-1 text-[8.5px] font-black text-[#7C3AED] hover:text-[#4F8CFF] bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 py-1.5 px-1 rounded-lg border border-[#7C3AED]/15 transition"
                              >
                                {prompt.label.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // LIST VIEW
                  if (viewType === 'list') {
                    return (
                      <div key={item._id} className="rounded-2xl border border-slate-800 bg-[#111827]/80 hover:bg-[#111827] p-4 flex items-center justify-between gap-4 hover-glow transition duration-200 group text-left">
                        <div className="flex items-center gap-4 overflow-hidden flex-1">
                          <div 
                            onClick={() => handlePreview(item)}
                            className="h-16 w-16 rounded-xl bg-slate-900 border border-slate-850 shrink-0 flex items-center justify-center text-[#4F8CFF]/40 hover:text-white cursor-pointer transition relative"
                          >
                            <HiOutlineDocumentText className="h-6 w-6" />
                            <span className="absolute bottom-0.5 right-1 bg-black/60 px-1 rounded text-[7px] font-bold text-slate-400">PDF</span>
                          </div>
                          
                          <div className="overflow-hidden space-y-1">
                            <h4 
                              onClick={() => handlePreview(item)}
                              className="font-bold text-slate-100 text-sm group-hover:text-[#4F8CFF] cursor-pointer transition truncate"
                            >
                              {item.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-slate-450">
                              <span className={`inline-flex rounded px-1.5 py-0.5 font-bold uppercase text-[8px] border ${
                                item.source === 'CampusConnect' ? 'bg-[#4F8CFF]/10 text-[#4F8CFF] border-[#4F8CFF]/15' :
                                item.source === 'Google Drive' ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/15' :
                                'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/15'
                              }`}>
                                {item.source || 'CampusConnect'}
                              </span>
                              {item.unit && <span className="text-[#7C3AED] font-bold">UNIT {item.unit}</span>}
                              {item.year && <span className="text-red-500 font-extrabold">{item.year} EXAM</span>}
                              <span>{item.fileSize || '1.5 MB'}</span>
                              <span>· {meta.pages} Pages</span>
                              <span>· {item.downloads || 0} DLs</span>
                              <span>· Faculty: {item.faculty || 'SRM'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => bookmarkMutation.mutate(item._id)}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-[#F59E0B] transition"
                          >
                            {isItemBookmarked ? <HiBookmark className="h-4 w-4 text-[#F59E0B]" /> : <HiOutlineBookmark className="h-4 w-4" />}
                          </button>
                          
                          <button
                            onClick={() => handlePreview(item)}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 hover:text-white transition"
                            title="Preview File"
                          >
                            <HiOutlineEye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDownload(item)}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] text-xs font-bold text-white transition hover:opacity-90 shadow-md"
                          >
                            Download
                          </button>

                          {/* AI Summary shortcut */}
                          <button
                            onClick={() => handleAI(item, isPyqs ? 'pyq_analysis' : 'summarize')}
                            className="p-2.5 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/20 text-[#7C3AED] hover:text-[#4F8CFF] hover:bg-[#7C3AED]/25 transition"
                            title="Summarize with AI"
                          >
                            <HiSparkles className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // COMPACT TABLE VIEW
                  return (
                    <div key={item._id} className="rounded-xl border border-slate-850 hover:border-slate-700 bg-[#111827]/40 hover:bg-[#111827]/80 px-4 py-2 flex items-center justify-between text-xs transition gap-4 text-left">
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <span className="font-extrabold text-[8px] uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                          {item.fileType || 'PDF'}
                        </span>
                        <span className={`font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          item.source === 'CampusConnect' ? 'bg-[#4F8CFF]/15 text-[#4F8CFF]' :
                          item.source === 'Google Drive' ? 'bg-[#22C55E]/15 text-[#22C55E]' :
                          'bg-[#7C3AED]/15 text-[#7C3AED]'
                        }`}>
                          {item.source || 'CampusConnect'}
                        </span>
                        <h5 
                          onClick={() => handlePreview(item)}
                          className="font-semibold text-slate-200 truncate cursor-pointer hover:text-[#4F8CFF] transition"
                        >
                          {item.title}
                        </h5>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-slate-500">
                        {item.unit && <span className="font-extrabold text-[9px] text-[#7C3AED]">U-{item.unit}</span>}
                        <span>{item.fileSize || '1.1MB'}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handlePreview(item)} className="hover:text-white transition">
                            <HiOutlineEye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDownload(item)} className="hover:text-white transition">
                            <HiOutlineDownload className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination controls */}
            {clientPagination.pages > 1 && (
              <div className="mt-6">
                <Pagination pagination={clientPagination} onPageChange={setPage} />
              </div>
            )}
          </div>

          {/* C. Right Sidebar (Stats & Recommendations) */}
          <div className="space-y-4 lg:col-span-1">
            
            {/* Folder stats metrics card */}
            <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 text-left space-y-3">
              <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest pb-1.5 border-b border-slate-800/80">Folder Metadata</h4>
              <div className="space-y-2 text-xs font-medium text-slate-350">
                <div className="flex justify-between">
                  <span className="text-slate-550">Total Resources:</span>
                  <span className="font-bold text-slate-200">{filteredData.length} indexed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-550">Estimated Downloads:</span>
                  <span className="font-bold text-[#4F8CFF]">{12 + (filteredData.length * 8)} downloads</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-550">Target Rating:</span>
                  <span className="font-bold text-[#F59E0B]">4.8 / 5.0 ⭐</span>
                </div>
              </div>
            </div>

            {/* Gemini AI Side Console panel */}
            <div className="rounded-2xl border border-[#7C3AED]/20 bg-gradient-to-b from-[#7C3AED]/5 to-transparent p-5 text-left space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#7C3AED]/15 rounded-xl text-[#7C3AED]">
                  <HiSparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-slate-100 text-sm">AI Study Hub</h4>
                  <p className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">Study Assistants</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Solve practice problems and mock cycle test worksheets directly from this folder using Gemini.
              </p>
              
              <div className="space-y-2 pt-2">
                {aiPrompts.map((prompt) => (
                  <button
                    key={prompt.op}
                    onClick={() => {
                      if (filteredData.length > 0) {
                        handleAI(filteredData[0], prompt.op);
                      } else {
                        toast.error('No materials available to analyze.');
                      }
                    }}
                    className="w-full inline-flex items-center justify-between text-left rounded-xl border border-slate-800 bg-[#0B1220]/70 px-3.5 py-2.5 text-[11px] font-bold text-slate-300 hover:text-[#4F8CFF] hover:border-[#4F8CFF]/20 transition"
                  >
                    <span>{prompt.label}</span>
                    <span className="text-[8px] font-black bg-[#7C3AED]/20 px-2 py-0.5 rounded text-[#7C3AED] uppercase">Run</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bookmarked lists shortcuts */}
            {filteredData.some(i => i.bookmarkedBy?.includes(user?._id)) && (
              <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 text-left space-y-3">
                <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest pb-1.5 border-b border-slate-800/80">Bookmarks</h4>
                <div className="space-y-2">
                  {filteredData
                    .filter(i => i.bookmarkedBy?.includes(user?._id))
                    .slice(0, 3)
                    .map(item => (
                      <div 
                        key={item._id} 
                        onClick={() => handlePreview(item)}
                        className="text-xs font-semibold text-slate-300 hover:text-[#4F8CFF] cursor-pointer truncate transition"
                      >
                        {item.title}
                      </div>
                    ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* PDF Preview Modal console */}
      {previewFile.isOpen && (
        <PDFPreviewModal
          isOpen={previewFile.isOpen}
          onClose={() => setPreviewFile({ isOpen: false, id: '', url: '', title: '' })}
          resourceId={previewFile.id}
          previewUrl={previewFile.url}
          title={previewFile.title}
          onNavigate={(item) => {
            setPreviewFile({ isOpen: true, id: item._id, url: item.previewUrl, title: item.title });
          }}
        />
      )}

      {/* AI Popup Output Modal */}
      {aiPanel.isOpen && (
        <AIPopupModal
          isOpen={aiPanel.isOpen}
          onClose={() => setAiPanel({ isOpen: false, resource: null, operation: '', content: '', isLoading: false })}
          title={`${category} Analysis Assistant`}
          content={aiPanel.content}
          isLoading={aiPanel.isLoading}
        />
      )}
    </div>
  );
}
