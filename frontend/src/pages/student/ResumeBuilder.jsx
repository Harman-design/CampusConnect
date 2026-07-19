import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiOutlineSparkles, HiOutlineCheckCircle, HiOutlinePlus, HiOutlineTrash, HiOutlineDownload, HiOutlineEye } from 'react-icons/hi';

export default function StudentResumeBuilder() {
  const [resume, setResume] = useState({
    education: [],
    skills: [],
    experience: [],
    projects: [],
    certificates: [],
    achievements: [],
    languages: [],
    links: { github: '', linkedin: '', portfolio: '' }
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [langInput, setLangInput] = useState('');
  const [achInput, setAchInput] = useState('');
  const [aiReview, setAiReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [jobDescription, setJobDescription] = useState('');
  const [jobAnalysis, setJobAnalysis] = useState(null);
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('minimalist'); // minimalist, modern, blueprint

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get('/api/resume/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.data) {
        setResume({
          ...resume,
          ...res.data.data,
          links: res.data.data.links || { github: '', linkedin: '', portfolio: '' }
        });
      }
    } catch (err) {
      toast.error('Failed to load resume details.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post('/api/resume/me', resume, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Resume details saved successfully.');
    } catch (err) {
      toast.error('Failed to save resume details.');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerAIReview = async () => {
    setIsReviewing(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.post('/api/ai/resume-review', { resumeData: resume }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiReview(res.data.data);
      toast.success('AI Resume review completed!');
    } catch (err) {
      toast.error('AI Resume Review service is currently busy. Try again later.');
    } finally {
      setIsReviewing(false);
    }
  };

  const triggerJobAnalysis = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please paste a Job Description to verify match fit.');
      return;
    }
    setIsAnalyzingJob(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.post('/api/ai/analyze-resume-job', { 
        resumeData: resume,
        jobDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobAnalysis(res.data.data);
      toast.success('AI Skills Gap & Fit Analysis completed!');
    } catch (err) {
      toast.error('AI matching service is currently busy. Try again later.');
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  const handleAddField = (field, schema) => {
    setResume({ ...resume, [field]: [...resume[field], schema] });
  };

  const handleRemoveField = (field, index) => {
    const list = [...resume[field]];
    list.splice(index, 1);
    setResume({ ...resume, [field]: list });
  };

  const handleFieldChange = (field, index, key, val) => {
    const list = [...resume[field]];
    list[index][key] = val;
    setResume({ ...resume, [field]: list });
  };

  // Add tags helper
  const addTag = (field, inputState, setInputState) => {
    if (!inputState.trim()) return;
    setResume({ ...resume, [field]: [...resume[field], inputState.trim()] });
    setInputState('');
  };

  const removeTag = (field, index) => {
    const tags = [...resume[field]];
    tags.splice(index, 1);
    setResume({ ...resume, [field]: tags });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto print:p-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ATS Resume Builder</h1>
          <p className="text-sm text-slate-500">Construct and review your resume with AI suggestions for placement filters</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-lg hover:text-white transition"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-1.5 transition"
          >
            <HiOutlineDownload className="h-4 w-4" /> PDF Print
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Left Form side */}
        <div className="lg:col-span-2 flex flex-col gap-6 print:hidden">
          {/* Education Block */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
              <h2 className="text-sm font-bold text-slate-200">Education Details</h2>
              <button
                onClick={() => handleAddField('education', { institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' })}
                className="py-1 px-3 bg-slate-900 hover:bg-slate-800 text-xs rounded border border-slate-800 flex items-center gap-1"
              >
                <HiOutlinePlus /> Add Education
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {resume.education.map((edu, i) => (
                <div key={i} className="border border-slate-850 p-4 rounded-lg bg-slate-900/40 relative">
                  <button
                    onClick={() => handleRemoveField('education', i)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-red-500"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 block mb-1">Institution</label>
                      <input
                        value={edu.institution}
                        onChange={(e) => handleFieldChange('education', i, 'institution', e.target.value)}
                        placeholder="SRM Institute of Science & Technology"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Degree</label>
                      <input
                        value={edu.degree}
                        onChange={(e) => handleFieldChange('education', i, 'degree', e.target.value)}
                        placeholder="B.Tech"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Field of Study</label>
                      <input
                        value={edu.fieldOfStudy}
                        onChange={(e) => handleFieldChange('education', i, 'fieldOfStudy', e.target.value)}
                        placeholder="Computer Science & Engineering"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Graduation Year</label>
                      <input
                        type="number"
                        value={edu.endYear || ''}
                        onChange={(e) => handleFieldChange('education', i, 'endYear', Number(e.target.value))}
                        placeholder="2025"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">CGPA / Grade</label>
                      <input
                        value={edu.grade}
                        onChange={(e) => handleFieldChange('education', i, 'grade', e.target.value)}
                        placeholder="9.1"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Block */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
              <h2 className="text-sm font-bold text-slate-200">Work Experience</h2>
              <button
                onClick={() => handleAddField('experience', { company: '', role: '', description: '', current: false })}
                className="py-1 px-3 bg-slate-900 hover:bg-slate-800 text-xs rounded border border-slate-800 flex items-center gap-1"
              >
                <HiOutlinePlus /> Add Experience
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {resume.experience.map((exp, i) => (
                <div key={i} className="border border-slate-850 p-4 rounded-lg bg-slate-900/40 relative">
                  <button
                    onClick={() => handleRemoveField('experience', i)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-red-500"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Company</label>
                      <input
                        value={exp.company}
                        onChange={(e) => handleFieldChange('experience', i, 'company', e.target.value)}
                        placeholder="Google Developer Group"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Role</label>
                      <input
                        value={exp.role}
                        onChange={(e) => handleFieldChange('experience', i, 'role', e.target.value)}
                        placeholder="Frontend Intern"
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 block mb-1">Description (ATS Optimized)</label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => handleFieldChange('experience', i, 'description', e.target.value)}
                        placeholder="Developed features using React, TailwindCSS. Improved performance by 15%."
                        className="w-full"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects Block */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
              <h2 className="text-sm font-bold text-slate-200">Projects</h2>
              <button
                onClick={() => handleAddField('projects', { title: '', description: '', link: '', technologies: [] })}
                className="py-1 px-3 bg-slate-900 hover:bg-slate-800 text-xs rounded border border-slate-800 flex items-center gap-1"
              >
                <HiOutlinePlus /> Add Project
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {resume.projects.map((proj, i) => (
                <div key={i} className="border border-slate-850 p-4 rounded-lg bg-slate-900/40 relative">
                  <button
                    onClick={() => handleRemoveField('projects', i)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-red-500"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Project Title</label>
                      <input
                        value={proj.title}
                        onChange={(e) => handleFieldChange('projects', i, 'title', e.target.value)}
                        placeholder="CampusConnect App"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Project Link</label>
                      <input
                        value={proj.link}
                        onChange={(e) => handleFieldChange('projects', i, 'link', e.target.value)}
                        placeholder="github.com/myproject"
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 block mb-1">Description</label>
                      <textarea
                        value={proj.description}
                        onChange={(e) => handleFieldChange('projects', i, 'description', e.target.value)}
                        placeholder="Full stack ERP application..."
                        className="w-full"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Block */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2 mb-4">Core Skills</h2>
            <div className="flex gap-2 mb-4">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="ReactJS, NodeJS, MongoDB, etc."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('skills', skillInput, setSkillInput))}
              />
              <button
                type="button"
                onClick={() => addTag('skills', skillInput, setSkillInput)}
                className="px-4 bg-brand-600 hover:bg-brand-700 font-semibold text-xs rounded-lg text-white"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((s, idx) => (
                <span
                  key={idx}
                  onClick={() => removeTag('skills', idx)}
                  className="bg-brand-500/10 text-brand-500 border border-brand-500/20 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition"
                  title="Click to remove"
                >
                  {s} &times;
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right side AI panel & Printing template */}
        <div className="flex flex-col gap-6 print:block print:col-span-3">
          {/* AI Review Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
            <div className="flex items-center gap-2 mb-4 text-emerald-500 font-bold text-sm">
              <HiOutlineSparkles className="h-5 w-5" />
              <span>AI Resume Reviewer</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Scan your current resume draft against standard ATS metrics powered by Google Gemini.</p>
            <button
              onClick={triggerAIReview}
              disabled={isReviewing}
              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              {isReviewing ? 'Analyzing with Gemini...' : 'Analyze Resume'}
            </button>

            {aiReview && (
              <div className="mt-6 border-t border-slate-800 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-slate-400">ATS Score Estimate:</span>
                  <span className={`text-xl font-bold ${aiReview.score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {aiReview.score}/100
                  </span>
                </div>
                
                <h4 className="text-xs font-bold text-slate-300 mt-4 mb-2">Suggestions:</h4>
                <ul className="list-disc list-inside text-[11px] text-slate-400 flex flex-col gap-1.5">
                  {aiReview.suggestions.map((sug, i) => (
                    <li key={i}>{sug}</li>
                  ))}
                </ul>

                <h4 className="text-xs font-bold text-slate-300 mt-4 mb-2">Recommended ATS Keywords:</h4>
                <div className="flex flex-wrap gap-1">
                  {aiReview.atsKeywords.map((kw, i) => (
                    <span key={i} className="bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Target Job Matching & Skills Gap Analysis */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
            <div className="flex items-center gap-2 mb-4 text-brand-400 font-bold text-sm">
              <HiOutlineSparkles className="h-5 w-5" />
              <span>Skills Gap & LinkedIn Alignment</span>
            </div>
            <p className="text-xs text-slate-400 mb-3 font-medium">Compare your resume against a target job description to identify missing skillsets and request optimization advice.</p>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description details here (e.g. Software developer, Java, Python, REST APIs)..."
              className="w-full text-xs mb-3 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100"
              rows={4}
            />
            <button
              onClick={triggerJobAnalysis}
              disabled={isAnalyzingJob}
              className="w-full py-2 bg-gradient-to-r from-brand-650 to-brand-700 text-white font-semibold text-xs rounded-lg disabled:opacity-50 transition"
            >
              {isAnalyzingJob ? 'Comparing Skills...' : 'Analyze Skills Fit'}
            </button>

            {jobAnalysis && (
              <div className="mt-6 border-t border-slate-800 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400 font-medium">Job Fit Match Score:</span>
                  <span className={`text-xl font-bold ${jobAnalysis.fitScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {jobAnalysis.fitScore}%
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-emerald-400 mb-1.5 font-sans">Matching Skills:</h4>
                  <div className="flex flex-wrap gap-1">
                    {jobAnalysis.matchingSkills?.map((sk, idx) => (
                      <span key={idx} className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-red-400 mb-1.5 font-sans">Skills Gap (Missing):</h4>
                  <div className="flex flex-wrap gap-1">
                    {jobAnalysis.missingSkills?.map((sk, idx) => (
                      <span key={idx} className="bg-red-950/20 border border-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-1">LinkedIn & Resume Recommendations:</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap font-sans">{jobAnalysis.recommendations}</p>
                </div>
              </div>
            )}
          </div>

          {/* Visual PDF Print Layout (Print media styles make this output standard black-on-white PDF when printed) */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-md flex flex-col gap-6 max-h-[850px] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0 print:overflow-visible">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 print:hidden">
              <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <HiOutlineEye className="h-4 w-4" /> Real-time PDF Preview
              </h3>
              <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg text-[10px] font-semibold border border-slate-800">
                {['minimalist', 'modern', 'blueprint'].map(tName => (
                  <button
                    key={tName}
                    onClick={() => setActiveTemplate(tName)}
                    className={`px-2.5 py-1 rounded transition uppercase ${
                      activeTemplate === tName ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tName}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Template styled container */}
            <div className={`text-slate-800 bg-white flex flex-col gap-4 text-left p-4 print:p-0 select-text leading-relaxed ${
              activeTemplate === 'blueprint' ? 'font-mono' : activeTemplate === 'modern' ? 'font-sans' : 'font-serif'
            }`}>
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                    background-color: white !important;
                    color: black !important;
                  }
                  #resume-print-area, #resume-print-area * {
                    visibility: visible;
                  }
                  #resume-print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                  }
                }
              `}</style>
              
              <div id="resume-print-area" className="flex flex-col gap-4 text-black bg-white select-text">
                <div className={`border-b border-slate-350 pb-3 ${
                  activeTemplate === 'modern' ? 'bg-slate-950 text-white p-6 rounded-lg text-left' : activeTemplate === 'blueprint' ? 'bg-blue-50/50 border-l-4 border-blue-500 p-4 text-left' : 'text-center'
                }`}>
                  <h1 className={`text-2xl font-bold uppercase tracking-wide text-slate-950 ${
                    activeTemplate === 'modern' ? 'text-white' : activeTemplate === 'blueprint' ? 'text-blue-900' : ''
                  }`}>{resume.name || 'Student Name'}</h1>
                  <p className={`text-xs mt-1 ${
                    activeTemplate === 'modern' ? 'text-slate-300' : 'text-slate-650'
                  }`}>
                    Email: {resume.email || 'you@srmist.edu.in'} • Links: {resume.links?.github && `GitHub: ${resume.links.github}`} {resume.links?.linkedin && `• LinkedIn: ${resume.links.linkedin}`}
                  </p>
                </div>

                {/* Section: Education */}
                {resume.education.length > 0 && (
                  <div>
                    {activeTemplate === 'modern' ? (
                      <h2 className="text-xs font-bold text-slate-900 border-b-2 border-slate-950 pb-1 mt-4 mb-2 uppercase tracking-wide font-sans">Education</h2>
                    ) : activeTemplate === 'blueprint' ? (
                      <h2 className="text-xs font-bold text-blue-700 border-b border-blue-500 pb-1 mt-4 mb-2 uppercase tracking-wider font-mono">Education</h2>
                    ) : (
                      <h2 className="text-xs font-bold font-sans uppercase border-b border-slate-300 text-slate-900 pb-0.5 tracking-wider mb-2 mt-4">Education</h2>
                    )}
                    <div className="flex flex-col gap-2">
                      {resume.education.map((edu, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs">
                          <div>
                            <strong>{edu.institution}</strong>
                            <p className="text-slate-600">{edu.degree} in {edu.fieldOfStudy}</p>
                          </div>
                          <div className="text-right text-slate-600">
                            <p>{edu.endYear || ''}</p>
                            <p>GPA: {edu.grade || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Experience */}
                {resume.experience.length > 0 && (
                  <div>
                    {activeTemplate === 'modern' ? (
                      <h2 className="text-xs font-bold text-slate-900 border-b-2 border-slate-950 pb-1 mt-4 mb-2 uppercase tracking-wide font-sans">Experience</h2>
                    ) : activeTemplate === 'blueprint' ? (
                      <h2 className="text-xs font-bold text-blue-700 border-b border-blue-500 pb-1 mt-4 mb-2 uppercase tracking-wider font-mono">Experience</h2>
                    ) : (
                      <h2 className="text-xs font-bold font-sans uppercase border-b border-slate-300 text-slate-900 pb-0.5 tracking-wider mb-2 mt-4">Experience</h2>
                    )}
                    <div className="flex flex-col gap-3">
                      {resume.experience.map((exp, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between font-semibold">
                            <span>{exp.role}</span>
                            <span className="text-slate-600 font-normal">{exp.company}</span>
                          </div>
                          <p className="text-slate-600 mt-1 text-[11px] whitespace-pre-wrap">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Projects */}
                {resume.projects.length > 0 && (
                  <div>
                    {activeTemplate === 'modern' ? (
                      <h2 className="text-xs font-bold text-slate-900 border-b-2 border-slate-950 pb-1 mt-4 mb-2 uppercase tracking-wide font-sans">Projects</h2>
                    ) : activeTemplate === 'blueprint' ? (
                      <h2 className="text-xs font-bold text-blue-700 border-b border-blue-500 pb-1 mt-4 mb-2 uppercase tracking-wider font-mono">Projects</h2>
                    ) : (
                      <h2 className="text-xs font-bold font-sans uppercase border-b border-slate-300 text-slate-900 pb-0.5 tracking-wider mb-2 mt-4">Projects</h2>
                    )}
                    <div className="flex flex-col gap-3">
                      {resume.projects.map((proj, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between font-semibold">
                            <span>{proj.title}</span>
                            {proj.link && <span className="text-slate-500 font-normal text-[10px]">{proj.link}</span>}
                          </div>
                          <p className="text-slate-600 mt-1 text-[11px]">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Skills */}
                {resume.skills.length > 0 && (
                  <div>
                    {activeTemplate === 'modern' ? (
                      <h2 className="text-xs font-bold text-slate-900 border-b-2 border-slate-950 pb-1 mt-4 mb-2 uppercase tracking-wide font-sans">Skills</h2>
                    ) : activeTemplate === 'blueprint' ? (
                      <h2 className="text-xs font-bold text-blue-700 border-b border-blue-500 pb-1 mt-4 mb-2 uppercase tracking-wider font-mono">Skills</h2>
                    ) : (
                      <h2 className="text-xs font-bold font-sans uppercase border-b border-slate-300 text-slate-900 pb-0.5 tracking-wider mb-2 mt-4">Skills</h2>
                    )}
                    <p className="text-xs text-slate-700">{resume.skills.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
