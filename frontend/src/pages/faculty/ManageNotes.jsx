import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineDocumentText, HiOutlineClipboardList, HiOutlineCloudUpload, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import { fetchNotes, uploadNoteFile, uploadNoteDriveLink, deleteNote } from '../../services/noteService';
import { fetchPyqs, uploadPyq, deletePyq } from '../../services/pyqService';
import { TextInput } from '../../components/FormField';
import Pagination from '../../components/Pagination';

export default function FacultyManageNotes() {
  const [category, setCategory] = useState('notes'); // notes, pyqs
  const [activeView, setActiveView] = useState('list'); // list, upload
  
  // Lists state
  const [notes, setNotes] = useState([]);
  const [pyqs, setPyqs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Forms state
  const [noteForm, setNoteForm] = useState({ title: '', subject: '', semester: '', department: '', unit: '', description: '', driveLink: '' });
  const [pyqForm, setPyqForm] = useState({ subject: '', semester: '', department: '', year: '', examType: 'semester' });
  const [file, setFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // file, link (for notes)
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [category, page]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (category === 'notes') {
        const res = await fetchNotes({ page, limit: 10 });
        setNotes(res.notes);
        setPagination(res.pagination);
      } else {
        const res = await fetchPyqs({ page, limit: 10 });
        setPyqs(res.pyqs);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load records.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (category === 'notes') {
        if (uploadMode === 'file') {
          if (!file) throw new Error('Please select a file first.');
          const fd = new FormData();
          fd.append('title', noteForm.title);
          fd.append('subject', noteForm.subject);
          fd.append('semester', noteForm.semester);
          fd.append('department', noteForm.department);
          if (noteForm.unit) fd.append('unit', noteForm.unit);
          if (noteForm.description) fd.append('description', noteForm.description);
          fd.append('file', file);
          await uploadNoteFile(fd);
        } else {
          if (!noteForm.driveLink) throw new Error('Please enter Google Drive link.');
          await uploadNoteDriveLink({
            title: noteForm.title,
            subject: noteForm.subject,
            semester: Number(noteForm.semester),
            department: noteForm.department,
            unit: noteForm.unit,
            description: noteForm.description,
            driveLink: noteForm.driveLink
          });
        }
        toast.success('Note published successfully.');
        setNoteForm({ title: '', subject: '', semester: '', department: '', unit: '', description: '', driveLink: '' });
      } else {
        if (!file) throw new Error('Please select a PYQ PDF file.');
        const fd = new FormData();
        fd.append('subject', pyqForm.subject);
        fd.append('semester', pyqForm.semester);
        fd.append('department', pyqForm.department);
        fd.append('year', pyqForm.year);
        fd.append('examType', pyqForm.examType);
        fd.append('file', file);
        await uploadPyq(fd);
        toast.success('PYQ paper published successfully.');
        setPyqForm({ subject: '', semester: '', department: '', year: '', examType: 'semester' });
      }
      setFile(null);
      setActiveView('list');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Publishing failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      if (category === 'notes') {
        await deleteNote(id);
      } else {
        await deletePyq(id);
      }
      toast.success('File deleted.');
      loadData();
    } catch (err) {
      toast.error('Deletion failed.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload Notes & PYQs</h1>
          <p className="text-sm text-slate-500 font-sans">Publish lecture notes, slides, and previous year question sheets.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex text-xs">
            <button
              onClick={() => { setCategory('notes'); setPage(1); setActiveView('list'); }}
              className={`px-4 py-1.5 font-semibold rounded-md transition ${
                category === 'notes' ? 'bg-brand-600 text-white' : 'text-slate-400'
              }`}
            >
              Notes / Slides
            </button>
            <button
              onClick={() => { setCategory('pyqs'); setPage(1); setActiveView('list'); }}
              className={`px-4 py-1.5 font-semibold rounded-md transition ${
                category === 'pyqs' ? 'bg-brand-600 text-white' : 'text-slate-400'
              }`}
            >
              PYQs
            </button>
          </div>
          {activeView === 'list' ? (
            <button
              onClick={() => setActiveView('upload')}
              className="py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1"
            >
              <HiOutlinePlus /> Upload File
            </button>
          ) : (
            <button
              onClick={() => setActiveView('list')}
              className="py-2 px-4 bg-slate-950 border border-slate-800 text-slate-400 font-semibold text-xs rounded-lg hover:text-white"
            >
              Back to List
            </button>
          )}
        </div>
      </div>

      {activeView === 'list' && (
        <div className="mt-8">
          {isLoading ? (
            <div className="text-center text-slate-500 text-xs py-8">Retrieving database files...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-xs">
                <thead>
                  {category === 'notes' ? (
                    <tr>
                      <th className="py-2.5 px-4 text-left">Title</th>
                      <th className="py-2.5 px-4 text-left">Subject</th>
                      <th className="py-2.5 px-4 text-left">Dept / Sem</th>
                      <th className="py-2.5 px-4 text-center">Type</th>
                      <th className="py-2.5 px-4 text-center">Downloads</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="py-2.5 px-4 text-left">Subject</th>
                      <th className="py-2.5 px-4 text-left">Year</th>
                      <th className="py-2.5 px-4 text-left">Exam Type</th>
                      <th className="py-2.5 px-4 text-left">Dept / Sem</th>
                      <th className="py-2.5 px-4 text-center">Downloads</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {category === 'notes' ? (
                    notes.map((n) => (
                      <tr key={n._id} className="hover:bg-slate-900/10">
                        <td className="py-3 px-4 font-semibold text-slate-200">{n.title}</td>
                        <td className="py-3 px-4 text-slate-400">{n.subject}</td>
                        <td className="py-3 px-4 text-slate-400">{n.department} / Sem {n.semester}</td>
                        <td className="py-3 px-4 text-center text-slate-500 uppercase">{n.fileType}</td>
                        <td className="py-3 px-4 text-center text-slate-400">{n.downloads}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDelete(n._id)}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    pyqs.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-900/10">
                        <td className="py-3 px-4 font-semibold text-slate-200">{p.subject}</td>
                        <td className="py-3 px-4 text-slate-400">{p.year}</td>
                        <td className="py-3 px-4 text-slate-400 capitalize">{p.examType}</td>
                        <td className="py-3 px-4 text-slate-400">{p.department} / Sem {p.semester}</td>
                        <td className="py-3 px-4 text-center text-slate-400">{p.downloads}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {((category === 'notes' && notes.length === 0) || (category === 'pyqs' && pyqs.length === 0)) && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">No documents uploaded under this category yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
        </div>
      )}

      {activeView === 'upload' && (
        <form onSubmit={handleUploadSubmit} className="mt-8 rounded-xl border border-slate-200 bg-white p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <h3 className="col-span-full text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
            Publish {category === 'notes' ? 'Notes Material' : 'PYQ Paper'}
          </h3>

          {category === 'notes' ? (
            <>
              <div className="col-span-full flex gap-2 mb-2 text-xs">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-3 py-1 rounded font-semibold ${uploadMode === 'file' ? 'bg-brand-600 text-white' : 'bg-slate-905 text-slate-400 border border-slate-800'}`}
                >
                  Attach File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('link')}
                  className={`px-3 py-1 rounded font-semibold ${uploadMode === 'link' ? 'bg-brand-600 text-white' : 'bg-slate-905 text-slate-400 border border-slate-800'}`}
                >
                  Paste Drive Link
                </button>
              </div>

              <div className="col-span-full">
                <label className="text-xs text-slate-400 block mb-1">Title</label>
                <input
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="Lecture 4 slides - Arrays"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Subject</label>
                <input
                  value={noteForm.subject}
                  onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                  placeholder="Data Structures"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Department</label>
                <input
                  value={noteForm.department}
                  onChange={(e) => setNoteForm({ ...noteForm, department: e.target.value })}
                  placeholder="CSE"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Semester</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={noteForm.semester}
                  onChange={(e) => setNoteForm({ ...noteForm, semester: e.target.value })}
                  placeholder="3"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Unit (Optional)</label>
                <input
                  value={noteForm.unit}
                  onChange={(e) => setNoteForm({ ...noteForm, unit: e.target.value })}
                  placeholder="Unit 1"
                  className="w-full text-xs"
                />
              </div>
              
              {uploadMode === 'file' ? (
                <div className="col-span-full border border-dashed border-slate-700 hover:border-brand-500 rounded-lg p-5 text-center cursor-pointer transition relative">
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <HiOutlineCloudUpload className="h-6 w-6 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400 mt-2">
                    {file ? file.name : 'Click to select PDF or PPT slides'}
                  </p>
                </div>
              ) : (
                <div className="col-span-full">
                  <label className="text-xs text-slate-400 block mb-1">Google Drive Link</label>
                  <input
                    value={noteForm.driveLink}
                    onChange={(e) => setNoteForm({ ...noteForm, driveLink: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full text-xs"
                    required
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Subject</label>
                <input
                  value={pyqForm.subject}
                  onChange={(e) => setPyqForm({ ...pyqForm, subject: e.target.value })}
                  placeholder="Digital Electronics"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Year</label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={pyqForm.year}
                  onChange={(e) => setPyqForm({ ...pyqForm, year: e.target.value })}
                  placeholder="2023"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Department</label>
                <input
                  value={pyqForm.department}
                  onChange={(e) => setPyqForm({ ...pyqForm, department: e.target.value })}
                  placeholder="ECE"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Semester</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={pyqForm.semester}
                  onChange={(e) => setPyqForm({ ...pyqForm, semester: e.target.value })}
                  placeholder="4"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Exam Type</label>
                <select
                  value={pyqForm.examType}
                  onChange={(e) => setPyqForm({ ...pyqForm, examType: e.target.value })}
                  className="w-full text-xs"
                >
                  <option value="semester">End Semester</option>
                  <option value="model">Model Exam</option>
                  <option value="cycle-test">Cycle Test</option>
                </select>
              </div>
              
              <div className="col-span-full border border-dashed border-slate-700 hover:border-brand-500 rounded-lg p-5 text-center cursor-pointer transition relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <HiOutlineCloudUpload className="h-6 w-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 mt-2">
                  {file ? file.name : 'Click to select PYQ PDF paper'}
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="col-span-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Upload File'}
          </button>
        </form>
      )}
    </div>
  );
}
