import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { broadcastNotification } from '../../services/notificationService';
import { TextInput } from '../../components/FormField';
import { SelectInput } from '../../components/SelectInput';

const TARGETS = ['all', 'students', 'admins'];

export default function SendNotification() {
  const [form, setForm] = useState({ title: '', message: '', target: 'students', link: '' });

  const mutation = useMutation({
    mutationFn: broadcastNotification,
    onSuccess: (data) => {
      toast.success(`Notification sent to ${data.count} recipient(s).`);
      setForm({ title: '', message: '', target: 'students', link: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send notification.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error('Title and message are required.');
    mutation.mutate(form);
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-slate-900">Send Notification</h1>
        <p className="text-sm text-slate-500">Broadcast an announcement to students, admins, or everyone — delivered in real time.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <TextInput placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <SelectInput placeholder="Send to..." value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} options={TARGETS} />
          <TextInput
            placeholder="Optional link (e.g. /events)"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>
    </div>
  );
}
