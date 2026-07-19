import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiOutlineDocumentText, HiOutlineClock, HiOutlineCheckCircle, HiOutlineUpload, HiOutlineBookOpen, HiOutlineCheck, HiOutlineInformationCircle } from 'react-icons/hi';

export default function StudentAssignments() {
  const [data, setData] = useState({ pending: [], submitted: [], overdue: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get('/api/assignments/student/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data);
      setIsLoading(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch assignments');
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedAssignment) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post(`/api/assignments/${selectedAssignment._id}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      toast.success('Assignment submitted successfully');
      setFile(null);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Loading assignments...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assignments Consoles</h1>
        <p className="text-sm text-slate-500">View and submit class assignments, checks status, and view grades</p>
      </div>

      {/* Grid tabs of Pending, Submitted, Overdue */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span> Pending Assignments ({data.pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {data.pending.map((a) => (
              <div key={a._id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-200">{a.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{a.subject} • Sem {a.semester}</p>
                {a.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{a.description}</p>}
                
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                    <HiOutlineInformationCircle className="h-4 w-4" /> Due: {new Date(a.dueDate).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedAssignment(a)}
                    className="py-1 px-3 text-xs bg-brand-600 hover:bg-brand-700 rounded-md font-semibold text-white transition"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ))}
            {data.pending.length === 0 && (
              <p className="text-slate-400 text-xs text-center py-6">All caught up! No pending assignments.</p>
            )}
          </div>
        </div>

        {/* Overdue Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500"></span> Overdue Assignments ({data.overdue.length})
          </h2>
          <div className="flex flex-col gap-3">
            {data.overdue.map((a) => (
              <div key={a._id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-200">{a.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{a.subject} • Sem {a.semester}</p>
                
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                    Overdue: {new Date(a.dueDate).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedAssignment(a)}
                    className="py-1 px-3 text-xs bg-red-600 hover:bg-red-700 rounded-md font-semibold text-white transition"
                  >
                    Submit Late
                  </button>
                </div>
              </div>
            ))}
            {data.overdue.length === 0 && (
              <p className="text-slate-400 text-xs text-center py-6">Nice job! No overdue assignments.</p>
            )}
          </div>
        </div>

        {/* Submitted Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Submitted ({data.submitted.length})
          </h2>
          <div className="flex flex-col gap-3">
            {data.submitted.map((a) => (
              <div key={a._id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-200">{a.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{a.subject} • Sem {a.semester}</p>
                
                <div className="mt-3 p-2 bg-slate-950 border border-slate-850 rounded-md text-xs text-slate-400">
                  <div className="flex justify-between font-medium">
                    <span>Status:</span>
                    <span className={a.submission?.status === 'Graded' ? 'text-emerald-500' : 'text-blue-400'}>
                      {a.submission?.status}
                    </span>
                  </div>
                  {a.submission?.grade && (
                    <div className="flex justify-between font-medium mt-1">
                      <span>Grade:</span>
                      <span className="text-emerald-500">{a.submission.grade}</span>
                    </div>
                  )}
                  {a.submission?.feedback && (
                    <div className="mt-1 text-[11px] text-slate-500 italic">
                      &ldquo;{a.submission.feedback}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            ))}
            {data.submitted.length === 0 && (
              <p className="text-slate-400 text-xs text-center py-6">You haven&apos;t submitted any assignments yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal/Overlay for submitting files */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-100">Submit Assignment</h3>
            <p className="text-xs text-slate-400 mt-1">
              Submitting for <strong>{selectedAssignment.title}</strong> ({selectedAssignment.subject})
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-lg p-6 text-center cursor-pointer transition relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.zip"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <HiOutlineCheck className="h-8 w-8 text-slate-500 mx-auto" />
                <p className="text-sm font-medium text-slate-300 mt-2">
                  {file ? file.name : 'Click to upload PDF or ZIP file'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Maximum file size: 50MB</p>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssignment(null);
                    setFile(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg transition"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
