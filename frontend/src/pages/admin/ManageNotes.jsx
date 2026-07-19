import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlinePencil, HiOutlineUpload, HiOutlineLink } from 'react-icons/hi';
import { fetchNotes, uploadNoteFile, uploadNoteDriveLink, updateNote, deleteNote } from '../../services/noteService';
import { TextInput } from '../../components/FormField';
import Pagination from '../../components/Pagination';

const emptyForm = { title: '', subject: '', semester: '', department: '', unit: '', description: '', driveLink: '' };

export default function ManageNotes() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState('file'); // 'file' | 'link'
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-notes', page],
    queryFn: () => fetchNotes({ page, limit: 10 }),
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-notes'] });

  const uploadFileMutation = useMutation({
    mutationFn: uploadNoteFile,
    onSuccess: () => {
      toast.success('Note uploaded successfully.');
      resetForm();
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed.'),
  });

  const uploadLinkMutation = useMutation({
    mutationFn: uploadNoteDriveLink,
    onSuccess: () => {
      toast.success('Note link added successfully.');
      resetForm();
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add link.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateNote(id, payload),
    onSuccess: () => {
      toast.success('Note updated.');
      resetForm();
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      toast.success('Note deleted.');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed.'),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setFile(null);
    setEditingId(null);
    setMode('file');
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setForm({
      title: note.title,
      subject: note.subject,
      semester: String(note.semester),
      department: note.department,
      unit: note.unit || '',
      description: note.description || '',
      driveLink: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      const { title, subject, semester, department, unit, description } = form;
      updateMutation.mutate({ id: editingId, payload: { title, subject, semester: Number(semester), department, unit, description } });
      return;
    }

    if (mode === 'file') {
      if (!file) return toast.error('Please choose a PDF or PPT file.');
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key !== 'driveLink' && value !== '') fd.append(key, value);
      });
      fd.append('file', file);
      uploadFileMutation.mutate(fd);
    } else {
      if (!form.driveLink) return toast.error('Please enter a Drive link.');
      const { title, subject, semester, department, unit, description, driveLink } = form;
      uploadLinkMutation.mutate({ title, subject, semester: Number(semester), department, unit, description, driveLink });
    }
  };

  const isSubmitting = uploadFileMutation.isPending || uploadLinkMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">Manage Notes</h1>
        <p className="text-sm text-slate-500">Upload PDFs, PPTs, or Drive links for students to access.</p>

        {/* Upload / Edit form */}
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">{editingId ? 'Edit Note' : 'Add New Note'}</h2>
            {!editingId && (
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setMode('file')}
                  className={`flex items-center gap-1 rounded-md px-3 py-1.5 ${mode === 'file' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'}`}
                >
                  <HiOutlineUpload className="h-4 w-4" /> File
                </button>
                <button
                  type="button"
                  onClick={() => setMode('link')}
                  className={`flex items-center gap-1 rounded-md px-3 py-1.5 ${mode === 'link' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'}`}
                >
                  <HiOutlineLink className="h-4 w-4" /> Drive Link
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <TextInput placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            <TextInput
              type="number"
              min={1}
              max={10}
              placeholder="Semester"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              required
            />
            <TextInput placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
            <TextInput placeholder="Unit (optional)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <TextInput
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {!editingId && mode === 'file' && (
              <input
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={(e) => setFile(e.target.files[0])}
                className="sm:col-span-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700"
              />
            )}
            {!editingId && mode === 'link' && (
              <TextInput
                className="sm:col-span-2"
                placeholder="https://drive.google.com/..."
                value={form.driveLink}
                onChange={(e) => setForm({ ...form, driveLink: e.target.value })}
              />
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Upload Note'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600">
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* List */}
        <div className="mt-8">
          {isLoading && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}
          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load notes: {error?.response?.data?.message || error.message}
            </div>
          )}
          {!isLoading && !isError && data?.notes.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No notes uploaded yet.
            </div>
          )}
          {!isLoading && !isError && data?.notes.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Dept / Sem</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Downloads</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.notes.map((note) => (
                    <tr key={note._id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{note.title}</td>
                      <td className="px-4 py-3 text-slate-500">{note.subject}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {note.department} / Sem {note.semester}
                      </td>
                      <td className="px-4 py-3 text-slate-500 uppercase text-xs">{note.fileType}</td>
                      <td className="px-4 py-3 text-slate-500">{note.downloads}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(note)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                            <HiOutlinePencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => confirm('Delete this note?') && deleteMutation.mutate(note._id)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination pagination={data?.pagination} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
