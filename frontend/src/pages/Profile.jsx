import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../services/userService';
import FormField, { TextInput } from '../components/FormField';
import { 
  HiOutlineUser, 
  HiOutlineHome, 
  HiOutlineAcademicCap, 
  HiOutlinePlus, 
  HiOutlineTrash,
  HiSparkles,
  HiOutlineExternalLink,
  HiOutlineStar,
  HiBadgeCheck
} from 'react-icons/hi';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // profile, hostel-fees, achievements
  
  const [form, setForm] = useState({
    name: user.name || '',
    department: user.department || '',
    semester: user.semester || '',
    registerNumber: user.registerNumber || '',
    cgpa: user.cgpa ?? '',
    backlogs: user.backlogs ?? 0,
    graduationYear: user.graduationYear || '',
    resumeUrl: user.resumeUrl || '',
    hostelDetails: user.hostelDetails || { block: '', roomNumber: '', messType: 'none', wardenName: '', wardenPhone: '' },
    feeDetails: user.feeDetails || [],
    achievements: user.achievements || [],
    certificates: user.certificates || [],
  });

  const [newAch, setNewAch] = useState({ title: '', date: '', description: '' });
  const [newCert, setNewCert] = useState({ title: '', issuingOrg: '', date: '', credentialUrl: '' });

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success('Profile details saved successfully.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Profile save failed.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      semester: form.semester ? Number(form.semester) : undefined,
      cgpa: form.cgpa !== '' ? Number(form.cgpa) : undefined,
      backlogs: form.backlogs !== '' ? Number(form.backlogs) : undefined,
      graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
    };
    mutation.mutate(payload);
  };

  const handleAddAchievement = () => {
    if (!newAch.title) return toast.error('Achievement title is required');
    const updated = [...form.achievements, newAch];
    setForm({ ...form, achievements: updated });
    setNewAch({ title: '', date: '', description: '' });
    mutation.mutate({ ...form, achievements: updated });
  };

  const handleRemoveAchievement = (idx) => {
    const updated = [...form.achievements];
    updated.splice(idx, 1);
    setForm({ ...form, achievements: updated });
    mutation.mutate({ ...form, achievements: updated });
  };

  const handleAddCertificate = () => {
    if (!newCert.title) return toast.error('Certificate title is required');
    const updated = [...form.certificates, newCert];
    setForm({ ...form, certificates: updated });
    setNewCert({ title: '', issuingOrg: '', date: '', credentialUrl: '' });
    mutation.mutate({ ...form, certificates: updated });
  };

  const handleRemoveCertificate = (idx) => {
    const updated = [...form.certificates];
    updated.splice(idx, 1);
    setForm({ ...form, certificates: updated });
    mutation.mutate({ ...form, certificates: updated });
  };

  // Calculate profile completeness score
  const calculateCompleteness = () => {
    let score = 0;
    let totalPoints = 8;
    
    if (form.name) score++;
    if (form.registerNumber) score++;
    if (form.department) score++;
    if (form.semester) score++;
    if (form.cgpa !== '') score++;
    if (form.graduationYear) score++;
    if (form.resumeUrl) score++;
    if (form.achievements.length > 0 || form.certificates.length > 0) score++;

    return Math.round((score / totalPoints) * 100);
  };

  const completeness = calculateCompleteness();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 fade-in-up text-left text-slate-100 bg-[#0B1220] min-h-screen">
      
      {/* Premium LinkedIn-style Header Card */}
      <div className="relative bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden shadow-premium">
        {/* Banner area */}
        <div className="h-32 bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] relative opacity-90">
          <div className="absolute inset-0 bg-grid-white/[0.05]" />
        </div>

        {/* Profile Avatar & Metadata Section */}
        <div className="px-6 pb-6 pt-1 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative">
          
          {/* Avatar overlap */}
          <div className="h-24 w-24 rounded-2xl bg-[#1E293B] border-4 border-[#111827] -mt-12 flex items-center justify-center font-black text-3xl text-white shadow-lg shrink-0">
            {form.name ? form.name.slice(0, 2).toUpperCase() : 'ST'}
          </div>

          <div className="flex-1 md:pb-2">
            <h2 className="text-xl font-black text-white flex items-center gap-1.5">
              <span>{form.name || 'Student Profile'}</span>
              <HiBadgeCheck className="text-[#4F8CFF] h-5 w-5" />
            </h2>
            <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">
              {form.department ? `${form.department} Department` : 'No Department Added'} · Semester {form.semester || 'N/A'}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Reg: {form.registerNumber || 'Not Registered'}</p>
          </div>

          {/* ATS Score card */}
          <div className="w-full md:w-auto bg-[#0B1220]/60 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/15 flex items-center justify-center font-black text-xs text-[#7C3AED]">
              {completeness}%
            </div>
            <div>
              <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">ATS Completeness</span>
              <span className="text-[10px] text-[#22C55E] font-bold">Profile Optimized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-1.5 bg-[#111827] border border-slate-800 p-1 rounded-xl w-fit">
        {[
          { key: 'profile', label: 'Academic & Personal' },
          { key: 'hostel-fees', label: 'Hostel & Fee Logs' },
          { key: 'achievements', label: 'Achievements & Badges' }
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

      {/* Tab Contents */}
      <div className="mt-4">
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-premium sm:grid-cols-2">
            
            <FormField label="Full Name">
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormField>
            <FormField label="Register Number">
              <TextInput value={form.registerNumber} onChange={(e) => setForm({ ...form, registerNumber: e.target.value })} />
            </FormField>
            <FormField label="Department">
              <TextInput value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="CSE" />
            </FormField>
            <FormField label="Semester">
              <TextInput type="number" min={1} max={10} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            </FormField>
            <FormField label="CGPA">
              <TextInput
                type="number"
                step="0.01"
                min={0}
                max={10}
                value={form.cgpa}
                onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
                placeholder="8.50"
              />
            </FormField>
            <FormField label="Active Backlogs">
              <TextInput type="number" min={0} value={form.backlogs} onChange={(e) => setForm({ ...form, backlogs: e.target.value })} />
            </FormField>
            <FormField label="Graduation Year">
              <TextInput
                type="number"
                min={2000}
                max={2100}
                value={form.graduationYear}
                onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                placeholder="2027"
              />
            </FormField>
            <FormField label="Resume URL (Google Drive / PDF)">
              <TextInput
                value={form.resumeUrl}
                onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </FormField>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="col-span-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold shadow-md transition disabled:opacity-40"
            >
              {mutation.isPending ? 'Saving details...' : 'Save Profile details'}
            </button>
          </form>
        )}

        {activeTab === 'hostel-fees' && (
          <div className="flex flex-col gap-6">
            
            {/* Hostel details card */}
            <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-premium">
              <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                <HiOutlineHome className="h-4.5 w-4.5 text-[#4F8CFF]" /> 
                <span>Hostel Allotment Details</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#0B1220]/60 border border-slate-850 rounded-xl">
                  <span className="text-slate-500 block font-bold text-[9px] uppercase">Block</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block">{form.hostelDetails.block || 'Not Assigned'}</span>
                </div>
                <div className="p-3 bg-[#0B1220]/60 border border-slate-850 rounded-xl">
                  <span className="text-slate-500 block font-bold text-[9px] uppercase">Room Number</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block">{form.hostelDetails.roomNumber || 'Not Assigned'}</span>
                </div>
                <div className="p-3 bg-[#0B1220]/60 border border-slate-850 rounded-xl">
                  <span className="text-slate-500 block font-bold text-[9px] uppercase">Mess Plan</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block capitalize">{form.hostelDetails.messType || 'None'}</span>
                </div>
                <div className="p-3 bg-[#0B1220]/60 border border-slate-850 rounded-xl col-span-2 md:col-span-1">
                  <span className="text-slate-500 block font-bold text-[9px] uppercase">Warden Details</span>
                  <span className="text-xs font-semibold text-slate-200 mt-1 block truncate">
                    {form.hostelDetails.wardenName || 'N/A'} {form.hostelDetails.wardenPhone && `(${form.hostelDetails.wardenPhone})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Fees details card */}
            <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-premium">
              <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                <HiOutlineAcademicCap className="h-4.5 w-4.5 text-[#7C3AED]" /> 
                <span>University Fee Invoices</span>
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-[#0B1220]/80 text-[#94A3B8] border-b border-slate-800">
                      <th className="py-2.5 px-4 text-left font-bold text-[9px] uppercase">Fee Description</th>
                      <th className="py-2.5 px-4 text-center font-bold text-[9px] uppercase">Amount</th>
                      <th className="py-2.5 px-4 text-center font-bold text-[9px] uppercase">Paid</th>
                      <th className="py-2.5 px-4 text-center font-bold text-[9px] uppercase">Due Date</th>
                      <th className="py-2.5 px-4 text-left font-bold text-[9px] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {form.feeDetails.map((fee, idx) => (
                      <tr key={idx} className="hover:bg-[#0B1220]/25">
                        <td className="py-3 px-4 font-bold text-slate-350">{fee.feeType}</td>
                        <td className="py-3 px-4 text-center text-slate-400">&#8377;{fee.amount}</td>
                        <td className="py-3 px-4 text-center text-slate-400">&#8377;{fee.paidAmount}</td>
                        <td className="py-3 px-4 text-center text-slate-400">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase border ${
                            fee.status === 'Paid' ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {form.feeDetails.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500 font-medium">No active fee statements on record.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Achievements management */}
            <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-premium flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <HiOutlineStar className="h-4.5 w-4.5 text-[#F59E0B]" />
                  Achievements Log
                </h3>
                <p className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Add competitions won, scholarships received, and extracurricular titles.</p>
              </div>
              
              <div className="flex flex-col gap-2 bg-[#0B1220]/60 p-3 border border-slate-850 rounded-2xl">
                <input
                  value={newAch.title}
                  onChange={(e) => setNewAch({ ...newAch, title: e.target.value })}
                  placeholder="Achievement title (e.g. Hackathon Winner)"
                  className="w-full text-xs bg-[#111827] border border-slate-800 rounded-lg p-2"
                />
                <textarea
                  value={newAch.description}
                  onChange={(e) => setNewAch({ ...newAch, description: e.target.value })}
                  placeholder="Provide short details/description..."
                  className="w-full text-xs bg-[#111827] border border-slate-800 rounded-lg p-2"
                  rows={2}
                />
                <button
                  onClick={handleAddAchievement}
                  className="py-1.5 px-3.5 bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:opacity-95 shadow transition"
                >
                  <HiOutlinePlus className="h-3.5 w-3.5" /> 
                  <span>Track Achievement</span>
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {form.achievements.map((ach, idx) => (
                  <div key={idx} className="p-3 bg-[#0B1220]/40 border border-slate-800 rounded-xl relative text-xs text-left">
                    <button
                      onClick={() => handleRemoveAchievement(idx)}
                      className="absolute top-2.5 right-2.5 text-slate-500 hover:text-[#EF4444] transition"
                      title="Remove Achievement"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                    <strong className="text-slate-200 font-bold">{ach.title}</strong>
                    {ach.description && <p className="text-slate-400 mt-1 text-[11px] leading-relaxed font-sans">{ach.description}</p>}
                  </div>
                ))}
                {form.achievements.length === 0 && (
                  <p className="text-center py-6 text-slate-500 text-xs font-semibold">No achievements tracked yet.</p>
                )}
              </div>
            </div>

            {/* Certificates management */}
            <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-premium flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <HiBadgeCheck className="h-4.5 w-4.5 text-[#22C55E]" />
                  Verifiable Credentials
                </h3>
                <p className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Log your professional certificates links and credential hashes.</p>
              </div>
              
              <div className="flex flex-col gap-2 bg-[#0B1220]/60 p-3 border border-slate-850 rounded-2xl">
                <input
                  value={newCert.title}
                  onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                  placeholder="Certificate name (e.g. AWS Cloud Practitioner)"
                  className="w-full text-xs bg-[#111827] border border-slate-800 rounded-lg p-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newCert.issuingOrg}
                    onChange={(e) => setNewCert({ ...newCert, issuingOrg: e.target.value })}
                    placeholder="Issuing Org"
                    className="w-full text-xs bg-[#111827] border border-slate-800 rounded-lg p-2"
                  />
                  <input
                    value={newCert.credentialUrl}
                    onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })}
                    placeholder="Credential Link"
                    className="w-full text-xs bg-[#111827] border border-slate-800 rounded-lg p-2"
                  />
                </div>
                <button
                  onClick={handleAddCertificate}
                  className="py-1.5 px-3.5 bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:opacity-95 shadow transition"
                >
                  <HiOutlinePlus className="h-3.5 w-3.5" /> 
                  <span>Save Certificate</span>
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {form.certificates.map((cert, idx) => (
                  <div key={idx} className="p-3 bg-[#0B1220]/40 border border-slate-800 rounded-xl relative text-xs text-left">
                    <button
                      onClick={() => handleRemoveCertificate(idx)}
                      className="absolute top-2.5 right-2.5 text-slate-500 hover:text-[#EF4444] transition"
                      title="Remove Certificate"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                    <strong className="text-slate-200 font-bold">{cert.title}</strong>
                    <p className="text-slate-400 mt-0.5 text-[10px]">{cert.issuingOrg}</p>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#4F8CFF] hover:underline mt-1.5 flex items-center gap-1 font-bold"
                      >
                        <span>View Verified Badge</span>
                        <HiOutlineExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
                {form.certificates.length === 0 && (
                  <p className="text-center py-6 text-slate-500 text-xs font-semibold">No certificates recorded yet.</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
