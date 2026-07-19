import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlinePencil, HiOutlineUsers } from 'react-icons/hi';
import {
  fetchPlacements,
  createPlacement,
  updatePlacement,
  deletePlacement,
  fetchApplicants,
  updateApplicationStatus,
} from '../../services/placementService';
import { TextInput } from '../../components/FormField';
import { SelectInput } from '../../components/SelectInput';
import Pagination from '../../components/Pagination';

const emptyForm = {
  companyName: '',
  role: '',
  description: '',
  packageLPA: '',
  location: '',
  driveDate: '',
  applicationDeadline: '',
  minCgpa: '',
  maxBacklogs: '',
  allowedDepartments: '',
  graduationYear: '',
  status: 'upcoming',
  type: 'placement',
};

const STATUS_OPTIONS = ['applied', 'shortlisted', 'rejected', 'selected'];

export default function ManagePlacements() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [viewingApplicantsFor, setViewingApplicantsFor] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-placements', page],
    queryFn: () => fetchPlacements({ page, limit: 10 }),
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-placements'] });

  const createMutation = useMutation({
    mutationFn: createPlacement,
    onSuccess: () => {
      toast.success('Placement drive created.');
      resetForm();
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePlacement(id, payload),
    onSuccess: () => {
      toast.success('Placement updated.');
      resetForm();
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlacement,
    onSuccess: () => {
      toast.success('Placement deleted.');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed.'),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      companyName: p.companyName,
      role: p.role,
      description: p.description || '',
      packageLPA: p.packageLPA ?? '',
      location: p.location || '',
      driveDate: p.driveDate ? p.driveDate.slice(0, 10) : '',
      applicationDeadline: p.applicationDeadline ? p.applicationDeadline.slice(0, 10) : '',
      minCgpa: p.eligibility?.minCgpa ?? '',
      maxBacklogs: p.eligibility?.maxBacklogs ?? '',
      allowedDepartments: (p.eligibility?.allowedDepartments || []).join(', '),
      graduationYear: p.eligibility?.graduationYear ?? '',
      status: p.status,
      type: p.type || 'placement',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      companyName: form.companyName,
      role: form.role,
      description: form.description,
      packageLPA: form.packageLPA ? Number(form.packageLPA) : undefined,
      location: form.location,
      driveDate: form.driveDate || undefined,
      applicationDeadline: form.applicationDeadline,
      status: form.status,
      type: form.type || 'placement',
      eligibility: {
        minCgpa: form.minCgpa ? Number(form.minCgpa) : 0,
        maxBacklogs: form.maxBacklogs !== '' ? Number(form.maxBacklogs) : 999,
        allowedDepartments: form.allowedDepartments
          ? form.allowedDepartments.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
      },
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">Manage Placements</h1>
        <p className="text-sm text-slate-500">Create drives, set eligibility criteria, and track applicants.</p>

        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-800">{editingId ? 'Edit Drive' : 'Create New Drive'}</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput placeholder="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
            <TextInput placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
            <TextInput placeholder="Package (LPA)" type="number" value={form.packageLPA} onChange={(e) => setForm({ ...form, packageLPA: e.target.value })} />
            <TextInput placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <TextInput type="date" placeholder="Drive Date" value={form.driveDate} onChange={(e) => setForm({ ...form, driveDate: e.target.value })} />
            <TextInput
              type="date"
              placeholder="Application Deadline"
              value={form.applicationDeadline}
              onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })}
              required
            />
            <TextInput
              className="sm:col-span-2"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <TextInput
              type="number"
              step="0.01"
              placeholder="Min CGPA (e.g. 7.0)"
              value={form.minCgpa}
              onChange={(e) => setForm({ ...form, minCgpa: e.target.value })}
            />
            <TextInput
              type="number"
              placeholder="Max Backlogs Allowed"
              value={form.maxBacklogs}
              onChange={(e) => setForm({ ...form, maxBacklogs: e.target.value })}
            />
            <TextInput
              placeholder="Allowed Departments (comma-separated, blank = all)"
              value={form.allowedDepartments}
              onChange={(e) => setForm({ ...form, allowedDepartments: e.target.value })}
            />
            <TextInput
              type="number"
              placeholder="Graduation Year (blank = any)"
              value={form.graduationYear}
              onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
            />

            <SelectInput
              placeholder="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={['upcoming', 'ongoing', 'closed']}
            />
            <SelectInput
              placeholder="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={['placement', 'internship']}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Drive'}
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
              Failed to load placements: {error?.response?.data?.message || error.message}
            </div>
          )}
          {!isLoading && !isError && data?.placements.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No placement drives yet.
            </div>
          )}

          {!isLoading &&
            !isError &&
            data?.placements.map((p) => (
              <div key={p._id} className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {p.companyName} — {p.role}
                    </h3>
                    <p className="text-xs text-slate-400 capitalize">
                      {p.status} · Deadline {new Date(p.applicationDeadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingApplicantsFor(viewingApplicantsFor === p._id ? null : p._id)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <HiOutlineUsers className="h-4 w-4" /> Applicants
                    </button>
                    <button onClick={() => startEdit(p)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                      <HiOutlinePencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => confirm('Delete this drive and all its applications?') && deleteMutation.mutate(p._id)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {viewingApplicantsFor === p._id && <ApplicantsPanel placementId={p._id} />}
              </div>
            ))}

          <Pagination pagination={data?.pagination} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}

function ApplicantsPanel({ placementId }) {
  const queryClient = useQueryClient();
  const { data: applicants, isLoading } = useQuery({
    queryKey: ['applicants', placementId],
    queryFn: () => fetchApplicants(placementId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateApplicationStatus(id, { status }),
    onSuccess: () => {
      toast.success('Status updated.');
      queryClient.invalidateQueries({ queryKey: ['applicants', placementId] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  if (isLoading) return <div className="mt-3 h-16 animate-pulse rounded-lg bg-slate-100" />;

  if (!applicants || applicants.length === 0) {
    return <p className="mt-3 text-sm text-slate-400">No applicants yet.</p>;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">CGPA</th>
            <th className="px-3 py-2">Backlogs</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applicants.map((app) => (
            <tr key={app._id}>
              <td className="px-3 py-2 font-medium text-slate-700">{app.student?.name}</td>
              <td className="px-3 py-2 text-slate-500">{app.student?.email}</td>
              <td className="px-3 py-2 text-slate-500">{app.student?.cgpa ?? '—'}</td>
              <td className="px-3 py-2 text-slate-500">{app.student?.backlogs ?? 0}</td>
              <td className="px-3 py-2">
                <select
                  value={app.status}
                  onChange={(e) => statusMutation.mutate({ id: app._id, status: e.target.value })}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
