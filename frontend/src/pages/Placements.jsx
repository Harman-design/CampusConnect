import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineBriefcase, 
  HiOutlineSparkles, 
  HiOutlineTerminal, 
  HiOutlineClipboardCheck, 
  HiOutlineBookOpen,
  HiOutlineChevronRight,
  HiOutlineTrendingUp
} from 'react-icons/hi';
import { fetchPlacements, applyToPlacement } from '../services/placementService';
import Pagination from '../components/Pagination';

const STATUS_COLORS = {
  applied: 'text-[#4F8CFF] border-[#4F8CFF]/20 bg-[#4F8CFF]/10',
  shortlisted: 'text-[#F59E0B] border-[#F59E0B]/20 bg-[#F59E0B]/10',
  selected: 'text-[#22C55E] border-[#22C55E]/20 bg-[#22C55E]/10',
  rejected: 'text-[#EF4444] border-[#EF4444]/20 bg-[#EF4444]/10',
};

const TIMELINE_STAGES = ['Applied', 'Shortlisted', 'OA/Test', 'Selected'];

export default function Placements() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('drives'); // drives, analyzer, practice
  const [filters, setFilters] = useState({ search: '', status: '', page: 1, type: 'placement' });
  
  // AI Analyzer state
  const [selectedJob, setSelectedJob] = useState(null);
  const [customJobDesc, setCustomJobDesc] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resumeData, setResumeData] = useState(null);

  // AI Practice state
  const [practiceRole, setPracticeRole] = useState('');
  const [practiceCompany, setPracticeCompany] = useState('');
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [prepResult, setPrepResult] = useState(null);

  // Active match score calculated for specific card
  const [cardMatchScores, setCardMatchScores] = useState({});
  const [isMatchingCardId, setIsMatchingCardId] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['placements', filters],
    queryFn: () => fetchPlacements(filters),
    keepPreviousData: true,
  });

  useEffect(() => {
    fetchStudentResume();
  }, []);

  const fetchStudentResume = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get('/api/resume/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumeData(res.data.data);
    } catch (err) {
      // Resume not built yet, we handle gracefully
    }
  };

  const applyMutation = useMutation({
    mutationFn: applyToPlacement,
    onSuccess: () => {
      toast.success('Application submitted!');
      queryClient.invalidateQueries({ queryKey: ['placements'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not apply.'),
  });

  const handleAnalyzeResume = async () => {
    if (!resumeData) {
      toast.error('Please create your active profile/resume first.');
      return;
    }
    const description = selectedJob ? selectedJob.description : customJobDesc;
    if (!description) {
      toast.error('Please select a job listing or paste a requirements description.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.post('/api/ai/analyze-resume-job', {
        resumeData,
        jobDescription: description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalysisResult(res.data.data);
      toast.success('AI compatibility analysis completed!');
    } catch (err) {
      toast.error('Failed to run resume compatibility check.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickMatchCard = async (job) => {
    if (!resumeData) {
      toast.error('Please create your profile details first.');
      return;
    }
    setIsMatchingCardId(job._id);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.post('/api/ai/analyze-resume-job', {
        resumeData,
        jobDescription: job.description || `${job.companyName} looking for a ${job.role}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCardMatchScores(prev => ({
        ...prev,
        [job._id]: res.data.data.fitScore
      }));
      toast.success(`Job Compatibility: ${res.data.data.fitScore}%!`);
    } catch (err) {
      toast.error('Could not match metrics.');
    } finally {
      setIsMatchingCardId(null);
    }
  };

  const handleQuickPracticeCard = (job) => {
    setPracticeRole(job.role);
    setPracticeCompany(job.companyName);
    setActiveTab('practice');
    toast.success(`Job attributes loaded. Click 'Create Practice Set' below.`);
  };

  const handleGeneratePrep = async (e) => {
    e.preventDefault();
    if (!practiceRole) {
      toast.error('Target job role is required');
      return;
    }
    setIsGeneratingPrep(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.post('/api/ai/interview-prep', {
        role: practiceRole,
        companyName: practiceCompany,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrepResult(res.data.data);
      toast.success('Practice sheet compiled successfully!');
    } catch (err) {
      toast.error('Prep generator is currently busy.');
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 fade-in-up text-left text-slate-100 bg-[#0B1220] min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <HiOutlineBriefcase className="text-[#4F8CFF] h-6.5 w-6.5" />
          <span>Placement & Career Portal</span>
        </h1>
        <p className="text-xs text-[#94A3B8] mt-1 font-medium">Browse active placements, calculate ATS compatibility fit metrics, and generate AI Online Assessment (OA) worksheets.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-1.5 bg-[#111827] border border-slate-800 p-1 rounded-xl w-fit">
        {[
          { key: 'drives', label: 'Active Drives' },
          { key: 'analyzer', label: 'AI Resume Matcher' },
          { key: 'practice', label: 'OA Practice & Prep' }
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

      {/* Drives Tab */}
      {activeTab === 'drives' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#111827] border border-slate-800 p-3 rounded-2xl">
            <div className="flex gap-1.5 bg-[#0B1220]/60 p-1 border border-slate-850 rounded-xl">
              <button
                onClick={() => updateFilter('type', 'placement')}
                className={`px-4.5 py-1 text-xs font-bold rounded-lg transition ${
                  filters.type === 'placement' ? 'bg-[#1E293B] text-[#4F8CFF] border border-slate-850 shadow' : 'text-slate-400'
                }`}
              >
                Full-Time Jobs
              </button>
              <button
                onClick={() => updateFilter('type', 'internship')}
                className={`px-4.5 py-1 text-xs font-bold rounded-lg transition ${
                  filters.type === 'internship' ? 'bg-[#1E293B] text-[#4F8CFF] border border-slate-850 shadow' : 'text-slate-400'
                }`}
              >
                Internships
              </button>
            </div>

            <div className="relative w-full max-w-xs">
              <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search company or role..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full text-xs pl-10 pr-3.5 py-2 rounded-xl bg-[#0B1220] border border-slate-800 text-slate-200 focus:outline-none focus:border-[#4F8CFF]"
              />
            </div>
          </div>

          {/* List of cards */}
          <div className="space-y-5">
            {isLoading && [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-[#111827] border border-slate-800" />
            ))}

            {isError && (
              <div className="rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-6 text-center text-xs text-[#EF4444] font-medium">
                Failed to load drives: {error?.response?.data?.message || error.message}
              </div>
            )}

            {!isLoading && !isError && data?.placements.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-[#111827]/40 p-12 text-center text-[#94A3B8] flex flex-col items-center justify-center gap-3">
                <HiOutlineBriefcase className="h-10 w-10 text-slate-600" />
                <div>
                  <p className="text-sm font-bold text-white">No active drives posted</p>
                  <p className="text-[11px] text-slate-500 mt-1">Check back later or check other filters.</p>
                </div>
              </div>
            )}

            {!isLoading && !isError && data?.placements.map((p) => {
              const appStatus = p.myApplicationStatus;
              const hasApplied = !!appStatus;
              const matchScore = cardMatchScores[p._id];

              return (
                <div key={p._id} className="rounded-2xl border border-slate-800 bg-[#1E293B]/80 p-5 shadow-sm space-y-4 hover:border-slate-700/60 transition duration-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Logo placeholder */}
                      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-[#4F8CFF]">
                        {p.companyName?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-100 text-sm">{p.role}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.companyName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase bg-slate-900 border border-slate-850 px-2.5 py-0.5 rounded">
                        {p.packageLPA ? `${p.packageLPA} LPA` : 'Not Disclosed'}
                      </span>
                      <span className={`text-[10px] font-black uppercase rounded-full px-2.5 py-0.5 border ${
                        p.status === 'open' ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20' : 'bg-slate-800 text-slate-500 border-slate-750'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-350 leading-relaxed font-sans mt-2">{p.description}</p>
                  )}

                  {/* Horizontal application step timeline (if applied) */}
                  {hasApplied && (
                    <div className="bg-[#0B1220]/60 p-4 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                        <span>Application Progress Pipeline</span>
                        <span className="text-[#4F8CFF]">{appStatus}</span>
                      </div>
                      <div className="flex items-center justify-between relative pt-2">
                        {/* Timeline background bar */}
                        <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-slate-850 -translate-y-1/2" />
                        
                        {TIMELINE_STAGES.map((stage, idx) => {
                          const isCompleted = TIMELINE_STAGES.indexOf(appStatus) >= idx;
                          return (
                            <div key={stage} className="z-10 flex flex-col items-center gap-1.5">
                              <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center text-[9px] font-black transition ${
                                isCompleted 
                                  ? 'bg-[#4F8CFF] text-[#0B1220] border-[#4F8CFF]' 
                                  : 'bg-[#1E293B] text-slate-500 border-slate-800'
                              }`}>
                                {idx + 1}
                              </div>
                              <span className={`text-[9px] font-bold ${isCompleted ? 'text-slate-300' : 'text-slate-650'}`}>
                                {stage}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-4">
                    {/* Eligibility details */}
                    <div>
                      {hasApplied ? (
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold border capitalize ${STATUS_COLORS[appStatus]}`}>
                          Status: {appStatus}
                        </span>
                      ) : p.eligibilityCheck?.isEligible ? (
                        <span className="inline-flex rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-2.5 py-1 text-[10px] font-bold uppercase">
                          Eligible to Apply
                        </span>
                      ) : (
                        <div className="text-[10px] text-[#EF4444] font-semibold">
                          Not Eligible: {p.eligibilityCheck?.reasons.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {/* AI Quick match gauge trigger */}
                      {matchScore !== undefined ? (
                        <div className="flex items-center gap-1.5 bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-2.5 py-1.5 rounded-xl">
                          <HiOutlineTrendingUp className="h-4 w-4 text-[#7C3AED]" />
                          <span className="text-[10px] font-bold text-slate-200">Match Fit:</span>
                          <span className="text-[10px] font-black text-[#7C3AED]">{matchScore}%</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleQuickMatchCard(p)}
                          disabled={isMatchingCardId === p._id}
                          className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#2e3b52] border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300 transition flex items-center gap-1"
                        >
                          <HiOutlineSparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
                          {isMatchingCardId === p._id ? 'Matching...' : 'ATS Fit Check'}
                        </button>
                      )}

                      <button
                        onClick={() => handleQuickPracticeCard(p)}
                        className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#2e3b52] border border-slate-800 rounded-xl text-[10px] font-bold text-[#4F8CFF] transition flex items-center gap-1"
                      >
                        <HiOutlineTerminal className="h-3.5 w-3.5" />
                        OA Prep
                      </button>

                      {!hasApplied && (
                        <button
                          onClick={() => applyMutation.mutate(p._id)}
                          disabled={!p.eligibilityCheck?.isEligible || p.status === 'closed' || applyMutation.isPending}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] text-white text-[10px] font-bold hover:opacity-95 shadow disabled:opacity-40 transition"
                        >
                          {applyMutation.isPending ? 'Applying...' : 'Apply Drive'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {data?.pagination && (
            <div className="mt-6">
              <Pagination pagination={data?.pagination} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
            </div>
          )}
        </div>
      )}

      {/* Resume Matcher Tab */}
      {activeTab === 'analyzer' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-premium space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#7C3AED]/10 rounded-xl text-[#7C3AED]">
              <HiOutlineSparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-slate-100 text-sm">AI Job Description Matcher</h3>
              <p className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-wider mt-0.5">Gemini ATS Compatibility Optimizer</p>
            </div>
          </div>
          <p className="text-xs text-[#94A3B8] font-medium leading-relaxed max-w-xl">Compare your resume against details of any placement drive to check matching keywords and gap recommendations.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider block mb-1.5">Select Open Drive Job:</label>
                <select
                  onChange={(e) => {
                    const drive = data?.placements.find((p) => p._id === e.target.value);
                    setSelectedJob(drive || null);
                  }}
                  className="w-full text-xs rounded-xl bg-[#0B1220] border border-slate-800 px-3.5 py-2.5 text-slate-200"
                >
                  <option value="">-- Choose active job drive --</option>
                  {data?.placements.map((p) => (
                    <option key={p._id} value={p._id}>{p.companyName} - {p.role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider block mb-1.5">Or Paste Custom Job Description:</label>
                <textarea
                  value={customJobDesc}
                  onChange={(e) => {
                    setSelectedJob(null);
                    setCustomJobDesc(e.target.value);
                  }}
                  placeholder="Paste roles, technologies, experience limits, and stack details..."
                  className="w-full text-xs rounded-xl bg-[#0B1220] border border-slate-800 px-3.5 py-2.5 text-slate-200"
                  rows={6}
                />
              </div>

              <button
                onClick={handleAnalyzeResume}
                disabled={isAnalyzing}
                className="py-2.5 bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] hover:opacity-95 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition shadow"
              >
                {isAnalyzing ? 'Matching Resume Metrics...' : 'Calculate Compatibility Score'}
              </button>
            </div>

            {/* Match scorecard results */}
            <div className="bg-[#0B1220]/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-center min-h-[250px]">
              {analysisResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8]">AI Compatibility Score</span>
                    <span className={`text-3xl font-black ${analysisResult.fitScore >= 75 ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>
                      {analysisResult.fitScore}%
                    </span>
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-200 flex items-center gap-1 mb-2">
                      <span className="h-1.5 w-1.5 bg-[#22C55E] rounded-full" />
                      Matching Tech Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.matchingSkills.map((sk, i) => (
                        <span key={i} className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                          {sk}
                        </span>
                      ))}
                      {analysisResult.matchingSkills.length === 0 && <span className="text-xs text-slate-500">None found</span>}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-200 flex items-center gap-1 mb-2">
                      <span className="h-1.5 w-1.5 bg-[#EF4444] rounded-full" />
                      Missing Skills & Gaps
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.missingSkills.map((sk, i) => (
                        <span key={i} className="bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                          {sk}
                        </span>
                      ))}
                      {analysisResult.missingSkills.length === 0 && <span className="text-[10px] text-slate-500 font-bold uppercase">None identified</span>}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-850">
                    <h4 className="text-[10px] uppercase font-bold text-slate-200 mb-1">AI Recommendation</h4>
                    <p className="text-xs text-[#94A3B8] leading-relaxed font-sans font-medium whitespace-pre-wrap">{analysisResult.recommendations}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-[#94A3B8] text-xs font-semibold space-y-3">
                  <HiOutlineClipboardCheck className="h-10 w-10 mx-auto text-slate-700" />
                  <p>Select an active job drive or input custom text to calculate keywords scorecard compatibility.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OA & Practice Tab */}
      {activeTab === 'practice' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-premium space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#4F8CFF]/10 rounded-xl text-[#4F8CFF]">
              <HiOutlineTerminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-100 text-sm">AI OA Practice Generator</h3>
              <p className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-wider mt-0.5">Gemini OA Mocking Tool</p>
            </div>
          </div>
          <p className="text-xs text-[#94A3B8] font-medium leading-relaxed max-w-xl">Enter target role details to compile Online Assessment practice questions and model interview guides.</p>

          <form onSubmit={handleGeneratePrep} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-2">
            <div>
              <label className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider block mb-1.5">Target Role:</label>
              <input
                value={practiceRole}
                onChange={(e) => setPracticeRole(e.target.value)}
                placeholder="Software Engineer Intern"
                className="w-full text-xs rounded-xl bg-[#0B1220] border border-slate-800 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-[#4F8CFF]"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider block mb-1.5">Company Name (Optional):</label>
              <input
                value={practiceCompany}
                onChange={(e) => setPracticeCompany(e.target.value)}
                placeholder="Amazon"
                className="w-full text-xs rounded-xl bg-[#0B1220] border border-slate-800 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-[#4F8CFF]"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isGeneratingPrep}
                className="w-full py-2.5 bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow"
              >
                {isGeneratingPrep ? 'Generating Practice Set...' : 'Create Prep Materials'}
              </button>
            </div>
          </form>

          {/* Results sheet */}
          {prepResult && (
            <div className="mt-6 border-t border-slate-800 pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <HiOutlineTerminal className="h-4.5 w-4.5 text-[#4F8CFF]" /> 
                    <span>OA Technical Mock Questions</span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {prepResult.technicalQuestions.map((q, idx) => (
                      <div key={idx} className="p-3.5 bg-[#0B1220]/60 border border-slate-850 rounded-xl text-xs font-sans">
                        <strong className="text-[#4F8CFF] block mb-1">Question {idx + 1}:</strong>
                        <p className="text-slate-350 leading-relaxed whitespace-pre-wrap">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <HiOutlineBookOpen className="h-4.5 w-4.5 text-[#7C3AED]" /> 
                    <span>Behavioral & HR Practice Questions</span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {prepResult.hrQuestions.map((q, idx) => (
                      <div key={idx} className="p-3.5 bg-[#0B1220]/60 border border-slate-850 rounded-xl text-xs font-sans">
                        <strong className="text-[#7C3AED] block mb-1">HR Q{idx + 1}:</strong>
                        <p className="text-slate-350 leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {prepResult.tips && prepResult.tips.length > 0 && (
                <div className="p-4 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-2xl font-sans text-xs">
                  <h4 className="text-[10px] font-bold text-[#22C55E] uppercase tracking-wide mb-2">Practice Guidelines & Hints</h4>
                  <ul className="list-disc list-inside text-slate-400 flex flex-col gap-1.5">
                    {prepResult.tips.map((tip, idx) => (
                      <li key={idx} className="leading-relaxed">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
