import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiOutlineFolderOpen, HiOutlinePlus, HiOutlineCloudUpload, HiOutlineCheckCircle, HiOutlineAcademicCap, HiOutlineTrash } from 'react-icons/hi';

export default function FacultyManageAssignments() {
  const [activeView, setActiveView] = useState('list'); // list, create, review
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Create form state
  const [form, setForm] = useState({ title: '', description: '', subject: '', dueDate: '', department: '', semester: '' });
  const [file, setFile] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
  const [isGrading, setIsGrading] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchAssignments();
    fetchInitialMetaData();
  }, []);

  const fetchInitialMetaData = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const [deptRes, subjRes] = await Promise.all([
        axios.get('/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/subjects', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setDepartments(deptRes.data.data);
      setSubjects(subjRes.data.data);
    } catch (err) {
      toast.error('Failed to load initial metadata.');
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get('/api/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data.data);
    } catch (err) {
      toast.error('Failed to load assignments.');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject || !form.dueDate || !form.department || !form.semester) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsPublishing(true);
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('subject', form.subject);
    formData.append('dueDate', form.dueDate);
    formData.append('department', form.department);
    formData.append('semester', form.semester);
    if (file) formData.append('file', file);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post('/api/assignments', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      toast.success('Assignment published successfully!');
      setForm({ title: '', description: '', subject: '', dueDate: '', department: '', semester: '' });
      setFile(null);
      setActiveView('list');
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish assignment.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment and all its submissions?')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`/api/assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Assignment deleted.');
      fetchAssignments();
    } catch (err) {
      toast.error('Failed to delete assignment.');
    }
  };

  const handleReviewAssignment = async (assign) => {
    setSelectedAssignment(assign);
    setIsLoadingSubmissions(true);
    setActiveView('review');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get(`/api/assignments/${assign._id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(res.data.data);
    } catch (err) {
      toast.error('Failed to retrieve submissions.');
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  const handleGradeSubmissionSubmit = async (e) => {
    e.preventDefault();
    if (!gradeForm.grade) return toast.error('Grade is required.');

    setIsGrading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post(`/api/assignments/submissions/${selectedSubmission._id}/grade`, gradeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Submission graded successfully!');
      setSelectedSubmission(null);
      setGradeForm({ grade: '', feedback: '' });
      
      // Reload submissions
      handleReviewAssignment(selectedAssignment);
    } catch (err) {
      toast.error('Failed to grade submission.');
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Assignments</h1>
          <p className="text-sm text-slate-500 font-sans">Publish assignments and grade submissions.</p>
        </div>
        <div>
          {activeView === 'list' ? (
            <button
              onClick={() => setActiveView('create')}
              className="py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1"
            >
              <HiOutlinePlus /> Create Assignment
            </button>
          ) : (
            <button
              onClick={() => { setActiveView('list'); setSelectedAssignment(null); }}
              className="py-2 px-4 bg-slate-950 border border-slate-800 text-slate-400 font-semibold text-xs rounded-lg hover:text-white"
            >
              Back to List
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Assignments list */}
      {activeView === 'list' && (
        <div className="mt-8 flex flex-col gap-4">
          {assignments.map((a) => (
            <div key={a._id} className="flex items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <div>
                <h3 className="text-sm font-bold text-slate-200">{a.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{a.subject} • Department: {a.department} • Semester {a.semester}</p>
                <p className="text-[10px] text-amber-500 mt-2">Due Date: {new Date(a.dueDate).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReviewAssignment(a)}
                  className="py-1 px-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded"
                >
                  Review Submissions
                </button>
                <button
                  onClick={() => handleDeleteAssignment(a._id)}
                  className="py-1 px-2.5 bg-red-600/10 text-red-500 hover:bg-red-500 hover:text-white rounded border border-red-500/20"
                >
                  <HiOutlineTrash />
                </button>
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">You haven&apos;t published any assignments yet.</p>
          )}
        </div>
      )}

      {/* Tab 2: Create Assignment */}
      {activeView === 'create' && (
        <form onSubmit={handleCreateAssignment} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="col-span-full">
            <label className="text-xs text-slate-400 block mb-1">Assignment Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Midterm Lab submission"
              className="w-full text-xs"
              required
            />
          </div>
          <div className="col-span-full">
            <label className="text-xs text-slate-400 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Submit PDF with source code and screenshot..."
              className="w-full text-xs"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Department</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full"
              required
            >
              <option value="">-- Choose Dept --</option>
              {departments.map((d) => (
                <option key={d._id} value={d.code}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Semester</label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              placeholder="5"
              className="w-full text-xs"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Subject</label>
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full"
              required
            >
              <option value="">-- Choose Subject --</option>
              {subjects
                .filter((s) => s.department === form.department && s.semester === Number(form.semester))
                .map((s) => (
                  <option key={s._id} value={s.name}>{s.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full text-xs"
              required
            />
          </div>
          <div className="col-span-full border border-dashed border-slate-700 hover:border-brand-500 rounded-lg p-5 text-center cursor-pointer transition relative">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <HiOutlineCloudUpload className="h-6 w-6 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400 mt-2">
              {file ? file.name : 'Upload assignment instruction notes (optional)'}
            </p>
          </div>

          <button
            type="submit"
            disabled={isPublishing}
            className="col-span-full rounded-lg bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isPublishing ? 'Publishing...' : 'Publish Assignment'}
          </button>
        </form>
      )}

      {/* Tab 3: Review submissions */}
      {activeView === 'review' && selectedAssignment && (
        <div className="mt-8">
          <div className="mb-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <h3 className="text-sm font-bold text-slate-200">Submissions for: {selectedAssignment.title}</h3>
            <p className="text-xs text-slate-400 mt-1">Subject: {selectedAssignment.subject} | Due: {new Date(selectedAssignment.dueDate).toLocaleString()}</p>
          </div>

          {isLoadingSubmissions ? (
            <div className="text-center text-slate-500 text-xs py-8">Retrieving student submissions...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-250 bg-white">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="py-2.5 px-4 text-left">Reg No</th>
                    <th className="py-2.5 px-4 text-left">Student Name</th>
                    <th className="py-2.5 px-4 text-left">Submitted File</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-center">Grade</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-900/10">
                      <td className="py-3 px-4 text-slate-400 font-semibold">{sub.student?.registerNumber || 'N/A'}</td>
                      <td className="py-3 px-4 font-medium text-slate-300">{sub.student?.name}</td>
                      <td className="py-3 px-4">
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-400 hover:underline font-semibold"
                        >
                          {sub.fileName}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          sub.status === 'Graded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-200">{sub.grade || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => { setSelectedSubmission(sub); setGradeForm({ grade: sub.grade || '', feedback: sub.feedback || '' }); }}
                          className="py-1 px-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[10px] rounded"
                        >
                          Grade
                        </button>
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-slate-500">No submissions uploaded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal for Grading */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-1">
              <HiOutlineAcademicCap className="text-brand-500" /> Grade Submission
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Assign grade and feedback for student: <strong>{selectedSubmission.student?.name}</strong>
            </p>

            <form onSubmit={handleGradeSubmissionSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Grade (A+, 95%, etc.)</label>
                <input
                  value={gradeForm.grade}
                  onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                  placeholder="A+"
                  className="w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Feedback Comments</label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  placeholder="Excellent work on coding standards and comments."
                  className="w-full text-xs"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGrading}
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition"
                >
                  {isGrading ? 'Saving...' : 'Submit Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
