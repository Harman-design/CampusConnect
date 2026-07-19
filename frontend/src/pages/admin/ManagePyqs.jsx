import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import { fetchPyqs, uploadPyq, updatePyq, deletePyq } from '../../services/pyqService';
import { TextInput } from '../../components/FormField';
import { SelectInput } from '../../components/SelectInput';
import Pagination from '../../components/Pagination';

const EXAM_TYPES = ['CAT1', 'CAT2', 'CAT3', 'Model', 'Semester', 'Other'];
const emptyForm = { subject: '', semester: '', department: '', year: '', examType: '' };

export default function ManagePyqs() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-pyqs', page],
    queryFn: () => fetchPyqs({ page, limit: 10 }),
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-pyqs'] });

  const uploadMutation = useMutation({
    mutationFn: uploadPyq,
    onSuccess: () => {
      toast.success('PYQ uploaded successfully.');
      resetForm();
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePyq(id, payload),
    onSuccess: () => {
      toast.success('PYQ updated.');
      resetForm();
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePyq,
    onSuccess: () => {
      toast.success('PYQ deleted.');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed.'),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setFile(null);
    setEditingId(null);
  };

  const startEdit = (pyq) => {
    setEditingId(pyq._id);
    setForm({
      subject: pyq.subject,
      semester: String(pyq.semester),
      department: pyq.department,
      year: String(pyq.year),
      examType: pyq.examType,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        payload: { ...form, semester: Number(form.semester), year: Number(form.year) },
      });
      return;
    }

    if (!file) return toast.error('Please choose a PDF file.');
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => fd.append(key, value));
    fd.append('file', file);
    uploadMutation.mutate(fd);
  };

  const isSubmitting = uploadMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">Manage PYQs</h1>
        <p className="text-sm text-slate-500">Upload previous year question papers as PDF.</p>

        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-800">{editingId ? 'Edit PYQ' : 'Add New PYQ'}</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            <TextInput placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
            <TextInput
              type="number"
              min={1}
              max={10}
              placeholder="Semester"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              required
            />
            <TextInput
              type="number"
              min={2000}
              max={2100}
              placeholder="Year"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              required
            />
            <SelectInput placeholder="Exam type" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })} options={EXAM_TYPES} />

            {!editingId && (
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700"
              />
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Upload PYQ'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-8">
          {isLoading && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}
          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load PYQs: {error?.response?.data?.message || error.message}
            </div>
          )}
          {!isLoading && !isError && data?.pyqs.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No PYQs uploaded yet.
            </div>
          )}
          {!isLoading && !isError && data?.pyqs.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Dept / Sem</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Exam</th>
                    <th className="px-4 py-3">Downloads</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.pyqs.map((pyq) => (
                    <tr key={pyq._id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{pyq.subject}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {pyq.department} / Sem {pyq.semester}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{pyq.year}</td>
                      <td className="px-4 py-3 text-slate-500">{pyq.examType}</td>
                      <td className="px-4 py-3 text-slate-500">{pyq.downloads}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(pyq)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                            <HiOutlinePencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => confirm('Delete this PYQ?') && deleteMutation.mutate(pyq._id)}
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
