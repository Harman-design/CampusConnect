import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiOutlineAdjustments, HiOutlineShieldCheck, HiOutlineCloudUpload } from 'react-icons/hi';

export default function AdminSystemSettings() {
  const [activeTab, setActiveTab] = useState('settings'); // settings, logs
  const [settings, setSettings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New setting form
  const [form, setForm] = useState({ key: '', value: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (activeTab === 'settings') {
        const res = await axios.get('/api/admin/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSettings(res.data.data);
      } else {
        const res = await axios.get('/api/admin/audit-logs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to retrieve settings or logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSetting = async (e) => {
    e.preventDefault();
    if (!form.key || !form.value) return toast.error('Key and Value are required');
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post('/api/admin/settings', {
        key: form.key,
        value: form.value,
        description: form.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('System setting updated successfully.');
      setForm({ key: '', value: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to save system setting.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings & Auditing</h1>
          <p className="text-sm text-slate-500 font-sans">Audit administrator logs and adjust application-wide system configurations.</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="mt-6 flex border-b border-slate-700 pb-2 gap-4">
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'settings' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Dynamic Configurations
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'logs' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Administrator Audit Logs
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Config Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2 mb-4 flex items-center gap-1.5">
              <HiOutlineAdjustments className="text-brand-500" /> Configure Setting
            </h3>
            <form onSubmit={handleUpdateSetting} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Configuration Key</label>
                <input
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="MIN_ATTENDANCE_PERCENT"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Configuration Value</label>
                <input
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="75"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Short Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Minimum percentage required to clear exams."
                  className="w-full text-xs"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2 bg-brand-605 text-white font-semibold text-xs rounded-lg hover:bg-brand-750 disabled:opacity-50 mt-2"
              >
                {isSaving ? 'Updating...' : 'Save Configuration'}
              </button>
            </form>
          </div>

          {/* Settings List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-200 mb-4">Active Configurations</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="py-2.5 px-4 text-left">Setting Key</th>
                      <th className="py-2.5 px-4 text-left">Value</th>
                      <th className="py-2.5 px-4 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-900/10">
                        <td className="py-3 px-4 font-semibold text-brand-400">{s.key}</td>
                        <td className="py-3 px-4 text-slate-200 font-medium">{JSON.stringify(s.value)}</td>
                        <td className="py-3 px-4 text-slate-400">{s.description || 'No description'}</td>
                      </tr>
                    ))}
                    {settings.length === 0 && (
                      <tr>
                        <td colSpan="3" className="py-6 text-center text-slate-500">No configs defined yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <HiOutlineShieldCheck className="h-5 w-5 text-emerald-500" /> Admin Audit Logs Trail
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="py-2.5 px-4 text-left">Timestamp</th>
                  <th className="py-2.5 px-4 text-left">Admin Agent</th>
                  <th className="py-2.5 px-4 text-left">Action Code</th>
                  <th className="py-2.5 px-4 text-left">Details</th>
                  <th className="py-2.5 px-4 text-center">IP IPAddress</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/10">
                    <td className="py-3 px-4 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium text-slate-300">
                      {log.performedBy?.name} <span className="text-[10px] text-slate-500">({log.performedBy?.email})</span>
                    </td>
                    <td className="py-3 px-4 text-indigo-400 font-semibold">{log.action}</td>
                    <td className="py-3 px-4 text-slate-400">{log.details || 'None'}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{log.ipAddress || 'Unknown'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">No logs on trail file.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
