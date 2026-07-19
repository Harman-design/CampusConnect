import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  HiOutlineBookOpen, 
  HiOutlineCollection, 
  HiOutlineClipboardList, 
  HiOutlineDocumentText, 
  HiOutlineDownload, 
  HiOutlineLightBulb, 
  HiOutlineUser, 
  HiOutlineAcademicCap, 
  HiSparkles,
  HiOutlineArrowLeft,
  HiOutlineVideoCamera,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck
} from 'react-icons/hi';
import { fetchSubjectDetails } from '../services/academicService';
import toast from 'react-hot-toast';

export default function SubjectDashboard() {
  const { subjectName } = useParams();
  const [searchParams] = useSearchParams();
  const department = searchParams.get('department') || '';
  const semester = searchParams.get('semester') || '';

  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data: subjectDetails, isLoading, isError } = useQuery({
    queryKey: ['subject-details', subjectName, department, semester],
    queryFn: () => fetchSubjectDetails(subjectName, { department, semester }),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6 text-left">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
        
        {/* Banner Skeleton */}
        <div className="h-56 bg-[#111827] border border-slate-800 rounded-3xl animate-pulse flex flex-col justify-between p-6">
          <div className="space-y-3">
            <div className="h-4 w-24 bg-slate-850 rounded" />
            <div className="h-8 w-80 bg-slate-850 rounded" />
            <div className="h-4 w-60 bg-slate-850 rounded" />
          </div>
          <div className="h-8 w-96 bg-slate-850 rounded" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-[#111827] border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-[#111827] border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-[#111827] border border-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !subjectDetails?.data) {
    return (
      <div className="p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/25 text-red-500">
          <HiOutlineShieldCheck className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-white">Subject Not Found</h2>
        <p className="text-sm text-slate-400">Failed to load subject details or subject visibility is restricted.</p>
        <Link to="/notes" className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition">
          <HiOutlineArrowLeft className="h-4 w-4" />
          Back to Academic Hub
        </Link>
      </div>
    );
  }

  const { subject, department: dept, semester: sem, faculty, credits, counts, recentUploads } = subjectDetails.data;

  // Derive static / deterministic stats based on subject name
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const mockAttendance = 78 + (Math.abs(hash) % 18); // range: 78% to 96%
  const mockDownloads = 145 + (Math.abs(hash) % 450);
  const mockBookmarks = 18 + (Math.abs(hash) % 65);
  const mockSubjectCode = (subject.split(' ').map(w => w[0]).join('').replace(/[^A-Za-z]/g, '').toUpperCase() + ' ' + (200 + (Math.abs(hash) % 99)));
  
  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from study list' : 'Bookmarked subject workspace!');
  };

  const categories = [
    { 
      name: 'Notes', 
      count: counts.notes, 
      desc: 'Lecture sheets & quick modules',
      icon: HiOutlineBookOpen, 
      color: 'text-[#4F8CFF] bg-[#4F8CFF]/5 border-[#4F8CFF]/10 hover:border-[#4F8CFF]/30',
      badge: 'PDF, PPT'
    },
    { 
      name: 'Previous Year Questions', 
      count: counts.pyqs, 
      desc: 'University exams blueprints',
      icon: HiOutlineCollection, 
      color: 'text-[#EF4444] bg-[#EF4444]/5 border-[#EF4444]/10 hover:border-[#EF4444]/30',
      badge: 'PYQ, Solutions'
    },
    { 
      name: 'Lab Manuals', 
      count: counts.labs, 
      desc: 'Coding guides & hardware records',
      icon: HiOutlineClipboardList, 
      color: 'text-[#22C55E] bg-[#22C55E]/5 border-[#22C55E]/10 hover:border-[#22C55E]/30',
      badge: 'Labs'
    },
    { 
      name: 'Assignments', 
      count: counts.assignments, 
      desc: 'Weekly homework & cycle tests',
      icon: HiOutlineDocumentText, 
      color: 'text-[#7C3AED] bg-[#7C3AED]/5 border-[#7C3AED]/10 hover:border-[#7C3AED]/30',
      badge: 'Tasks'
    },
    { 
      name: 'Reference Books', 
      count: counts.reference, 
      desc: 'Standard curriculum publications',
      icon: HiOutlineLightBulb, 
      color: 'text-[#F59E0B] bg-[#F59E0B]/5 border-[#F59E0B]/10 hover:border-[#F59E0B]/30',
      badge: 'E-Books'
    },
    { 
      name: 'Video Lectures', 
      count: counts.notes > 0 ? 3 : 0, 
      desc: 'Recorded modules & explanations',
      icon: HiOutlineVideoCamera, 
      color: 'text-pink-500 bg-pink-500/5 border-pink-500/10 hover:border-pink-500/30',
      badge: 'Media'
    }
  ];

  // Stats Breakdown for headers
  const statsOverview = [
    { label: 'Notes', val: counts.notes, color: 'text-[#4F8CFF]' },
    { label: 'PYQs', val: counts.pyqs, color: 'text-[#EF4444]' },
    { label: 'Assignments', val: counts.assignments, color: 'text-[#7C3AED]' },
    { label: 'Labs', val: counts.labs, color: 'text-[#22C55E]' },
    { label: 'Reference Books', val: counts.reference, color: 'text-[#F59E0B]' },
    { label: 'Videos', val: counts.notes > 0 ? 3 : 0, color: 'text-pink-500' },
    { label: 'Bookmarks', val: mockBookmarks, color: 'text-teal-400' },
    { label: 'Downloads', val: mockDownloads, color: 'text-[#4F8CFF]' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-left">
      
      {/* Back Link Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link 
          to="/notes" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-200 transition"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Back to Academic Hub
        </Link>
        <span className="text-[10px] text-slate-650 font-medium">Updated 2 days ago</span>
      </div>

      {/* 1. Large Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#111827] to-[#0B1220] border border-slate-800 p-6 md:p-8 shadow-premium relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 h-48 w-48 bg-[#4F8CFF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-1/2 h-32 w-32 bg-[#7C3AED]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-4 relative z-10 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 px-3 py-0.5 text-[9px] font-extrabold tracking-wider text-[#4F8CFF] uppercase">
              {dept}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-0.5 text-[9px] font-extrabold tracking-wider text-slate-300 uppercase">
              Semester {sem}
            </span>
            <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-3 py-0.5 text-[9px] font-extrabold tracking-wider text-[#7C3AED] uppercase">
              Code: {mockSubjectCode}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white line-clamp-2">
              {subject}
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <HiOutlineGlobeAlt className="h-4 w-4 text-[#4F8CFF]" />
              SRM Institute of Science and Technology · Ramapuram Campus
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-4 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-350">
              <HiOutlineUser className="h-4 w-4 text-[#7C3AED]" />
              <span className="font-semibold">Faculty: {faculty}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-350">
              <HiOutlineAcademicCap className="h-4 w-4 text-[#22C55E]" />
              <span className="font-semibold">Course Credits: {credits} Credits</span>
            </div>
          </div>
        </div>

        {/* Attendance progress Ring Widget & Bookmarks */}
        <div className="flex items-center gap-6 shrink-0 relative z-10 md:pl-6 md:border-l border-slate-800/80">
          <div className="text-center space-y-1">
            <div className="relative h-20 w-20 flex items-center justify-center">
              {/* Ring Track */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#22C55E]"
                  strokeWidth="3.5"
                  strokeDasharray={`${mockAttendance}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-white">{mockAttendance}%</span>
                <span className="text-[7px] text-[#22C55E] uppercase font-bold">Present</span>
              </div>
            </div>
            <span className="text-[9px] text-[#94A3B8] font-bold block uppercase tracking-wider">Attendance Logs</span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleBookmarkToggle}
              className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
                isBookmarked 
                  ? 'bg-[#F59E0B]/10 border-[#F59E0B]/25 text-[#F59E0B]' 
                  : 'bg-[#1E293B]/70 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isBookmarked ? 'Bookmarked subject' : 'Bookmark subject workspace'}
            >
              {isBookmarked ? <HiBookmark className="h-5 w-5" /> : <HiOutlineBookmark className="h-5 w-5" />}
            </button>
            <div className="text-center">
              <span className="text-[10px] text-slate-500 font-bold block">{mockDownloads} downloads</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Resource Summary Statistics Banner */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-glass grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {statsOverview.map((st, i) => (
          <div key={i} className="text-center py-2 relative after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-[1px] after:bg-slate-850 last:after:hidden">
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">{st.label}</span>
            <span className={`text-lg font-black block mt-0.5 ${st.color}`}>{st.val}</span>
          </div>
        ))}
      </div>

      {/* 3. Study Resources Dashboard Folders */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Study Workspace Modules</h3>
          <p className="text-[10px] text-slate-500">Access categorized notes, solve pyqs, download textbooks, and consult AI bots.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((cat) => (
            <Link 
              key={cat.name} 
              to={`/subjects/${encodeURIComponent(subject)}/${encodeURIComponent(cat.name)}?department=${dept}&semester=${sem}`}
              className={`rounded-2xl border p-5 shadow-glass flex items-center justify-between transition group hover-glow ${cat.color}`}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="rounded-xl p-3 shrink-0 bg-[#0B1220] border border-slate-800/85 group-hover:scale-105 transition-transform duration-200">
                  <cat.icon className="h-6 w-6" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-slate-100 text-sm truncate group-hover:text-[#4F8CFF] transition-colors">{cat.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-relaxed">{cat.desc}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                <span className="bg-[#0B1220] border border-slate-800 text-slate-200 rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold shadow-inner">
                  {cat.count}
                </span>
                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">{cat.badge}</span>
              </div>
            </Link>
          ))}

          {/* AI Assistant Dedicated card */}
          <Link
            to="/ai-assistant"
            className="rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-5 shadow-glass flex items-center justify-between hover:border-[#7C3AED]/40 hover-glow group transition"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#0B1220] border border-[#7C3AED]/25 p-3 shrink-0 text-[#7C3AED]">
                <HiSparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">AI Study Assistant</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Solve quizzes, flashcards & query notes</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[8px] font-bold bg-[#7C3AED]/20 border border-[#7C3AED]/30 px-2 py-0.5 rounded-full text-[#7C3AED] uppercase">Active</span>
              <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">Gemini 1.5</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Recent Uploads & Subject Overview details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Recent Uploads list */}
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-premium md:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Recent Uploads</h3>
              <p className="text-[10px] text-slate-550 mt-0.5">Academic items recently uploaded to this workspace.</p>
            </div>
            <span className="text-[9px] bg-[#4F8CFF]/10 text-[#4F8CFF] border border-[#4F8CFF]/20 px-2 py-0.5 rounded-full font-bold">New</span>
          </div>
          
          <div className="divide-y divide-slate-850">
            {!recentUploads || recentUploads.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <HiOutlineDocumentText className="h-8 w-8 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500">No documents uploaded yet for this subject.</p>
              </div>
            ) : (
              recentUploads.map((file) => (
                <div key={file._id} className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-[#1E293B]/20 px-2 rounded-xl transition">
                  <div className="overflow-hidden flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-[#0B1220] border border-slate-800 text-[#4F8CFF] shrink-0">
                      <HiOutlineBookOpen className="h-4.5 w-4.5" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-200 truncate" title={file.title}>{file.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[10px]">
                        <span className="font-extrabold text-[8px] uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{file.category}</span>
                        <span>{file.fileSize || '1.2 MB'}</span>
                        <span>· {new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    to={`/subjects/${encodeURIComponent(subject)}/${encodeURIComponent(file.category)}?department=${dept}&semester=${sem}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4F8CFF] hover:text-[#7C3AED] transition shrink-0 bg-[#4F8CFF]/10 px-3 py-1.5 rounded-xl border border-[#4F8CFF]/20"
                  >
                    <HiOutlineDownload className="h-3.5 w-3.5" />
                    Go View
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Course Curriculum summary cards */}
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-premium flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <HiOutlineClock className="h-4.5 w-4.5 text-[#F59E0B]" />
              Course Curriculum
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed font-medium">
              This course covers standard syllabus blueprints mapped in strict compliance with SRM Ramapuram regulations. Key modules are curated into unit folders with corresponding examination question solutions.
            </p>
          </div>
          
          <div className="bg-[#0B1220] border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-350 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Exam Pattern:</span>
              <span className="font-bold text-slate-200">University Semester</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Standard Level:</span>
              <span className="font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20 text-[10px]">Medium-Hard</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Last Audited:</span>
              <span className="font-bold text-slate-300">July 2026</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
