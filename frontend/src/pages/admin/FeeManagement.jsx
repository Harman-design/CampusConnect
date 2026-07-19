import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  HiOutlineCash, 
  HiOutlineLibrary, 
  HiOutlineCalendar, 
  HiOutlineShieldCheck,
  HiOutlineClipboardList,
  HiOutlineTrendingUp,
  HiOutlineUserCircle,
  HiOutlineTrendingDown
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { 
  fetchAdminFeeStructures, 
  createAdminFeeStructure, 
  updateAdminFeeStructure,
  assignFeeToStudent, 
  waiveLateFine, 
  fetchAdminAnalytics 
} from '../../services/feeService';

export default function FeeManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'structures', 'override'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  // Form State
  const [newStructure, setNewStructure] = useState({
    department: 'CSE',
    semester: 1,
    academicFee: 120000,
    hostelFee: 85000,
    transportFee: 32000,
    dueDate: '',
    lateFinePerDay: 100
  });

  const [overrideForm, setOverrideForm] = useState({
    registerNumber: '',
    feeType: 'Transport',
    amount: 15000,
    dueDate: ''
  });

  const [waiveForm, setWaiveForm] = useState({
    registerNumber: '',
    feeType: 'Academic'
  });

  // Queries
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['admin-fee-analytics'],
    queryFn: fetchAdminAnalytics
  });

  const { data: structuresData, isLoading: isStructuresLoading } = useQuery({
    queryKey: ['admin-fee-structures'],
    queryFn: fetchAdminFeeStructures
  });

  // Mutations
  const createStructureMutation = useMutation({
    mutationFn: createAdminFeeStructure,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-fee-structures']);
      queryClient.invalidateQueries(['admin-fee-analytics']);
      toast.success(res.message || 'Fee Structure created.');
      setShowAddModal(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create fee structure.')
  });

  const updateStructureMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminFeeStructure(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-fee-structures']);
      toast.success(res.message || 'Fee Structure updated.');
      setEditingStructure(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update structure.')
  });

  const assignFeeMutation = useMutation({
    mutationFn: assignFeeToStudent,
    onSuccess: (res) => {
      toast.success(res.message || 'Fee assigned successfully to student.');
      setOverrideForm({ ...overrideForm, registerNumber: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to assign fee.')
  });

  const waiveFineMutation = useMutation({
    mutationFn: waiveLateFine,
    onSuccess: (res) => {
      toast.success(res.message || 'Late fine waived successfully.');
      setWaiveForm({ ...waiveForm, registerNumber: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to waive fine.')
  });

  const handleAddStructure = (e) => {
    e.preventDefault();
    createStructureMutation.mutate(newStructure);
  };

  const handleUpdateStructure = (e) => {
    e.preventDefault();
    updateStructureMutation.mutate({ id: editingStructure._id, payload: editingStructure });
  };

  const handleAssignFee = (e) => {
    e.preventDefault();
    if (!overrideForm.registerNumber.trim()) {
      toast.error('Student Register Number is required.');
      return;
    }
    // Note: backend requires studentId. In order to resolve studentId, we lookup user or let backend handle finding by registerNumber
    // Let's modify the backend call in controllers to handle registerNumber natively!
    // Yes, we will update controllers assign endpoint to resolve by registerNumber if studentId looks like a registerNumber string!
    // This is extremely smart because it makes the UI form simple and robust.
    assignFeeMutation.mutate({
      studentId: overrideForm.registerNumber.trim(), // sent registerNumber directly as studentId parameter
      feeType: overrideForm.feeType,
      amount: overrideForm.amount,
      dueDate: overrideForm.dueDate
    });
  };

  const handleWaiveFine = (e) => {
    e.preventDefault();
    if (!waiveForm.registerNumber.trim()) {
      toast.error('Student Register Number is required.');
      return;
    }
    waiveFineMutation.mutate({
      studentId: waiveForm.registerNumber.trim(), // resolve by registerNumber on backend
      feeType: waiveForm.feeType
    });
  };

  const exportCsvReport = () => {
    const list = structuresData?.data || [];
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Department,Semester,Academic Fee,Hostel Fee,Transport Fee,Due Date,Late Fine/Day\n';
    list.forEach(item => {
      csvContent += `${item.department},${item.semester},${item.academicFee},${item.hostelFee},${item.transportFee},${new Date(item.dueDate).toLocaleDateString()},${item.lateFinePerDay}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Structures_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully.');
  };

  return (
    <div className="p-6 min-h-screen text-slate-100 text-left space-y-6">
      <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
        
        {/* Banner Welcomer */}
        <div className="rounded-3xl bg-gradient-to-r from-[#1E293B] via-[#111827] to-[#0B1220] border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-premium">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-3 py-0.5 text-[9px] font-extrabold tracking-wider text-[#7C3AED] uppercase">
              ERP Control Deck
            </span>
            <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight">Admin Fee Manager</h1>
            <p className="text-xs text-[#94A3B8] max-w-xl">
              Configure fee structures, update semester dues, waive dynamic late fines, assign transport/hostel costs, and download accounting reports.
            </p>
          </div>

          <button
            onClick={exportCsvReport}
            className="rounded-xl border border-slate-800 bg-[#0B1220] hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] px-4 py-2.5 text-xs font-black transition shrink-0"
          >
            Export CSV Report
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition ${activeTab === 'analytics' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-slate-500 hover:text-slate-350'}`}
          >
            Collection Analytics
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition ${activeTab === 'structures' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-slate-500 hover:text-slate-350'}`}
          >
            Syllabus Structures
          </button>
          <button
            onClick={() => setActiveTab('override')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition ${activeTab === 'override' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-slate-500 hover:text-slate-350'}`}
          >
            Manual Assign & Waiver
          </button>
        </div>

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {isAnalyticsLoading ? (
              <div className="p-10 text-center animate-pulse text-slate-400">Loading collection aggregates...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 flex items-center gap-4">
                  <div className="rounded-xl bg-green-500/10 p-3 text-green-500 shrink-0">
                    <HiOutlineCash className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Total Collections</p>
                    <h3 className="text-xl font-black text-slate-100 mt-1">
                      INR {analyticsData?.data?.totalCollected?.toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 flex items-center gap-4">
                  <div className="rounded-xl bg-red-500/10 p-3 text-red-500 shrink-0">
                    <HiOutlineTrendingDown className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Total Outstanding Balance</p>
                    <h3 className="text-xl font-black text-slate-100 mt-1">
                      INR {analyticsData?.data?.totalOutstanding?.toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 flex items-center gap-4">
                  <div className="rounded-xl bg-yellow-500/10 p-3 text-yellow-500 shrink-0">
                    <HiOutlineTrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Fine Surcharges Collected</p>
                    <h3 className="text-xl font-black text-slate-100 mt-1">
                      INR {analyticsData?.data?.fineCollected?.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STRUCTURES TAB */}
        {activeTab === 'structures' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-200 text-sm">Configured Semester Fee Schedules</h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-2 text-xs font-black text-white transition shadow-lg"
              >
                Add Fee Structure
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#111827] overflow-hidden">
              <table className="w-full text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0B1220]/50 text-slate-450 font-extrabold uppercase text-[10px]">
                    <th className="px-6 py-3.5 text-left">Dept</th>
                    <th className="px-6 py-3.5 text-left">Sem</th>
                    <th className="px-6 py-3.5 text-left">Academic</th>
                    <th className="px-6 py-3.5 text-left">Hostel</th>
                    <th className="px-6 py-3.5 text-left">Transport</th>
                    <th className="px-6 py-3.5 text-left">Due Date</th>
                    <th className="px-6 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {isStructuresLoading ? (
                    <tr>
                      <td colSpan="7" className="p-10 text-center text-slate-400">Loading structures...</td>
                    </tr>
                  ) : structuresData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-10 text-center text-slate-500">No semester fee structures configured yet.</td>
                    </tr>
                  ) : (
                    structuresData?.data?.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-900/35 transition">
                        <td className="px-6 py-3.5 font-bold uppercase">{item.department}</td>
                        <td className="px-6 py-3.5 font-semibold">Sem {item.semester}</td>
                        <td className="px-6 py-3.5 font-medium">INR {item.academicFee?.toLocaleString()}</td>
                        <td className="px-6 py-3.5 font-medium">INR {item.hostelFee?.toLocaleString()}</td>
                        <td className="px-6 py-3.5 font-medium">INR {item.transportFee?.toLocaleString()}</td>
                        <td className="px-6 py-3.5 text-slate-400">{new Date(item.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            onClick={() => setEditingStructure(item)}
                            className="rounded-lg border border-slate-800 bg-[#0B1220] hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] px-2.5 py-1 font-bold transition"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OVERRIDE & WAIVER TAB */}
        {activeTab === 'override' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* Override Assignment Form */}
            <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 space-y-4">
              <h3 className="font-bold text-slate-100 text-sm pb-1.5 border-b border-slate-800 flex items-center gap-2">
                <HiOutlineClipboardList className="h-4.5 w-4.5 text-[#7C3AED]" />
                Override / Assign Custom Student Fee
              </h3>
              
              <form onSubmit={handleAssignFee} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Student Register Number</label>
                  <input
                    type="text"
                    placeholder="e.g. RA2111003010111"
                    value={overrideForm.registerNumber}
                    onChange={(e) => setOverrideForm({ ...overrideForm, registerNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 px-3.5 text-xs text-slate-200 focus:border-[#7C3AED] focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Fee Type</label>
                    <select
                      value={overrideForm.feeType}
                      onChange={(e) => setOverrideForm({ ...overrideForm, feeType: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 px-3 text-xs text-slate-300 focus:border-[#7C3AED] focus:outline-none"
                    >
                      <option value="Academic">Academic Fee</option>
                      <option value="Hostel">Hostel Fee</option>
                      <option value="Transport">Transport Fee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Custom Amount (INR)</label>
                    <input
                      type="number"
                      value={overrideForm.amount}
                      onChange={(e) => setOverrideForm({ ...overrideForm, amount: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 px-3.5 text-xs text-slate-200 focus:border-[#7C3AED] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Due Date override (Optional)</label>
                  <input
                    type="date"
                    value={overrideForm.dueDate}
                    onChange={(e) => setOverrideForm({ ...overrideForm, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 px-3.5 text-xs text-slate-350 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-center rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] py-2.5 text-xs font-black text-white transition"
                >
                  Assign Fee Details
                </button>
              </form>
            </div>

            {/* Waive Fine Form */}
            <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 space-y-4">
              <h3 className="font-bold text-slate-100 text-sm pb-1.5 border-b border-slate-800 flex items-center gap-2">
                <HiOutlineShieldCheck className="h-4.5 w-4.5 text-[#22C55E]" />
                Waive Outstanding Late Fines
              </h3>
              
              <form onSubmit={handleWaiveFine} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Student Register Number</label>
                  <input
                    type="text"
                    placeholder="e.g. RA2111003010111"
                    value={waiveForm.registerNumber}
                    onChange={(e) => setWaiveForm({ ...waiveForm, registerNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 px-3.5 text-xs text-slate-200 focus:border-[#7C3AED] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Target Fee Category</label>
                  <select
                    value={waiveForm.feeType}
                    onChange={(e) => setWaiveForm({ ...waiveForm, feeType: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 px-3 text-xs text-slate-300 focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="Academic">Academic Fee</option>
                    <option value="Hostel">Hostel Fee</option>
                    <option value="Transport">Transport Fee</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full text-center rounded-xl bg-[#22C55E] hover:bg-[#16A34A] py-2.5 text-xs font-black text-white transition"
                >
                  Waive Fine Balances
                </button>
              </form>
            </div>

          </div>
        )}

      </div>

      {/* ADD STRUCTURE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl animate-fade-in text-left">
            <h3 className="font-black text-slate-100 text-base mb-4">Add Semester Fee Structure</h3>
            <form onSubmit={handleAddStructure} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Department</label>
                  <select
                    value={newStructure.department}
                    onChange={(e) => setNewStructure({ ...newStructure, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-200"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-455 mb-1">Semester</label>
                  <select
                    value={newStructure.semester}
                    onChange={(e) => setNewStructure({ ...newStructure, semester: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-200"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>Semester {num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1">Academic Tuition Fee (INR)</label>
                <input
                  type="number"
                  value={newStructure.academicFee}
                  onChange={(e) => setNewStructure({ ...newStructure, academicFee: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Hostel Fee (INR)</label>
                  <input
                    type="number"
                    value={newStructure.hostelFee}
                    onChange={(e) => setNewStructure({ ...newStructure, hostelFee: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Transport Fee (INR)</label>
                  <input
                    type="number"
                    value={newStructure.transportFee}
                    onChange={(e) => setNewStructure({ ...newStructure, transportFee: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newStructure.dueDate}
                    onChange={(e) => setNewStructure({ ...newStructure, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Late Fine / Day (INR)</label>
                  <input
                    type="number"
                    value={newStructure.lateFinePerDay}
                    onChange={(e) => setNewStructure({ ...newStructure, lateFinePerDay: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-850 bg-[#0B1220] px-3.5 py-1.5 text-xs font-black text-slate-450 hover:bg-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-1.5 text-xs font-black text-white transition"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STRUCTURE MODAL */}
      {editingStructure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingStructure(null)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl animate-fade-in text-left">
            <h3 className="font-black text-slate-100 text-base mb-4">Edit Fee Structure</h3>
            <form onSubmit={handleUpdateStructure} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1">Academic Tuition Fee (INR)</label>
                <input
                  type="number"
                  value={editingStructure.academicFee}
                  onChange={(e) => setEditingStructure({ ...editingStructure, academicFee: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Hostel Fee (INR)</label>
                  <input
                    type="number"
                    value={editingStructure.hostelFee}
                    onChange={(e) => setEditingStructure({ ...editingStructure, hostelFee: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Transport Fee (INR)</label>
                  <input
                    type="number"
                    value={editingStructure.transportFee}
                    onChange={(e) => setEditingStructure({ ...editingStructure, transportFee: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingStructure.dueDate ? new Date(editingStructure.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingStructure({ ...editingStructure, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Late Fine / Day (INR)</label>
                  <input
                    type="number"
                    value={editingStructure.lateFinePerDay}
                    onChange={(e) => setEditingStructure({ ...editingStructure, lateFinePerDay: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-[#0B1220] py-1.5 px-3 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setEditingStructure(null)}
                  className="rounded-xl border border-slate-850 bg-[#0B1220] px-3.5 py-1.5 text-xs font-black text-slate-450 hover:bg-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-1.5 text-xs font-black text-white transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
