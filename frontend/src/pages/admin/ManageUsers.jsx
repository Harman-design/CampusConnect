import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiOutlineUserAdd, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineAcademicCap, HiOutlineHome } from 'react-icons/hi';

export default function AdminManageUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Editor form states
  const [basicForm, setBasicForm] = useState({});
  const [hostelForm, setHostelForm] = useState({});
  const [fees, setFees] = useState([]);
  const [newFee, setNewFee] = useState({ feeType: 'Tuition', amount: '', paidAmount: '', dueDate: '', status: 'Unpaid' });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      let url = '/api/admin/users';
      const queries = [];
      if (roleFilter) queries.push(`role=${roleFilter}`);
      if (search) queries.push(`search=${search}`);
      if (queries.length > 0) url += `?${queries.join('&')}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to load user directory.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setBasicForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'student',
      department: user.department || '',
      semester: user.semester || '',
      registerNumber: user.registerNumber || '',
      cgpa: user.cgpa ?? '',
      backlogs: user.backlogs ?? 0,
      graduationYear: user.graduationYear || '',
      isActive: user.isActive ?? true,
    });
    setHostelForm(user.hostelDetails || { block: '', roomNumber: '', messType: 'none', wardenName: '', wardenPhone: '' });
    setFees(user.feeDetails || []);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.put(`/api/admin/users/${selectedUser._id}`, {
        ...basicForm,
        hostelDetails: hostelForm,
        feeDetails: fees,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User updated successfully.');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user profile.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  const handleAddFee = () => {
    if (!newFee.amount) return toast.error('Amount is required.');
    const updated = [...fees, { ...newFee, amount: Number(newFee.amount), paidAmount: Number(newFee.paidAmount || 0) }];
    setFees(updated);
    setNewFee({ feeType: 'Tuition', amount: '', paidAmount: '', dueDate: '', status: 'Unpaid' });
  };

  const handleRemoveFee = (idx) => {
    const updated = [...fees];
    updated.splice(idx, 1);
    setFees(updated);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 font-sans">Manage university Student and Faculty accounts, academic CGPAs, fees, and hostels.</p>
      </div>

      {/* Directory search and filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-xs">
          <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search by name, email or reg..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs"
          >
            <option value="">-- All Roles --</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center text-slate-500 text-xs py-8">Loading directory index...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="py-2.5 px-4 text-left">Reg No</th>
                  <th className="py-2.5 px-4 text-left">Name</th>
                  <th className="py-2.5 px-4 text-left">Email</th>
                  <th className="py-2.5 px-4 text-center">Role</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/10">
                    <td className="py-3 px-4 font-semibold text-slate-400">{u.registerNumber || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{u.name}</td>
                    <td className="py-3 px-4 text-slate-400">{u.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                        u.role === 'admin' ? 'bg-red-500/10 text-red-400' : u.role === 'faculty' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                        u.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {u.isActive ? 'Active' : 'Deactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(u)}
                          className="p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded"
                        >
                          <HiOutlinePencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded"
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
      </div>

      {/* Editor Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl bg-slate-900 border border-slate-800 p-6 max-h-[90vh] overflow-y-auto my-10">
            <h3 className="text-base font-bold text-slate-100 mb-4 border-b border-slate-850 pb-2">
              Edit User: {selectedUser.name}
            </h3>

            <form onSubmit={handleSaveUser} className="flex flex-col gap-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <h4 className="col-span-full text-xs font-bold text-brand-500 flex items-center gap-1">
                  <HiOutlineAcademicCap /> Personal & Academic Credentials
                </h4>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Full Name</label>
                  <input
                    value={basicForm.name}
                    onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
                    className="w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Email</label>
                  <input
                    value={basicForm.email}
                    onChange={(e) => setBasicForm({ ...basicForm, email: e.target.value })}
                    className="w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Role</label>
                  <select
                    value={basicForm.role}
                    onChange={(e) => setBasicForm({ ...basicForm, role: e.target.value })}
                    className="w-full text-xs"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Department</label>
                  <input
                    value={basicForm.department}
                    onChange={(e) => setBasicForm({ ...basicForm, department: e.target.value })}
                    className="w-full text-xs"
                  />
                </div>
                {basicForm.role === 'student' && (
                  <>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Semester</label>
                      <input
                        type="number"
                        value={basicForm.semester}
                        onChange={(e) => setBasicForm({ ...basicForm, semester: Number(e.target.value) })}
                        className="w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Reg Number</label>
                      <input
                        value={basicForm.registerNumber}
                        onChange={(e) => setBasicForm({ ...basicForm, registerNumber: e.target.value })}
                        className="w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        value={basicForm.cgpa}
                        onChange={(e) => setBasicForm({ ...basicForm, cgpa: e.target.value })}
                        className="w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Backlogs</label>
                      <input
                        type="number"
                        value={basicForm.backlogs}
                        onChange={(e) => setBasicForm({ ...basicForm, backlogs: e.target.value })}
                        className="w-full text-xs"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Hostel Fields */}
              {basicForm.role === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                  <h4 className="col-span-full text-xs font-bold text-brand-500 flex items-center gap-1">
                    <HiOutlineHome /> Hostel Boarding
                  </h4>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Block</label>
                    <input
                      value={hostelForm.block}
                      onChange={(e) => setHostelForm({ ...hostelForm, block: e.target.value })}
                      placeholder="Tech Park Hostel"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Room Number</label>
                    <input
                      value={hostelForm.roomNumber}
                      onChange={(e) => setHostelForm({ ...hostelForm, roomNumber: e.target.value })}
                      placeholder="403"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Mess Option</label>
                    <select
                      value={hostelForm.messType}
                      onChange={(e) => setHostelForm({ ...hostelForm, messType: e.target.value })}
                      className="w-full text-xs"
                    >
                      <option value="none">None</option>
                      <option value="veg">Vegetarian</option>
                      <option value="non-veg">Non-Vegetarian</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Warden Name</label>
                    <input
                      value={hostelForm.wardenName}
                      onChange={(e) => setHostelForm({ ...hostelForm, wardenName: e.target.value })}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Fees list */}
              {basicForm.role === 'student' && (
                <div className="border-t border-slate-850 pt-4 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-brand-500 flex items-center gap-1">
                    <HiOutlineAcademicCap /> Dynamic Fee Invoices
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 items-end gap-2 p-3 bg-slate-950 border border-slate-850 rounded-lg">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[9px] text-slate-500 block mb-1">Fee Type</label>
                      <select
                        value={newFee.feeType}
                        onChange={(e) => setNewFee({ ...newFee, feeType: e.target.value })}
                        className="w-full text-xs py-1"
                      >
                        <option value="Tuition">Tuition</option>
                        <option value="Hostel">Hostel</option>
                        <option value="Exam">Exam</option>
                        <option value="Mess">Mess</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">Amount</label>
                      <input
                        value={newFee.amount}
                        onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                        placeholder="10000"
                        className="w-full text-xs py-1"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">Paid Amount</label>
                      <input
                        value={newFee.paidAmount}
                        onChange={(e) => setNewFee({ ...newFee, paidAmount: e.target.value })}
                        placeholder="5000"
                        className="w-full text-xs py-1"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">Status</label>
                      <select
                        value={newFee.status}
                        onChange={(e) => setNewFee({ ...newFee, status: e.target.value })}
                        className="w-full text-xs py-1"
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleAddFee}
                        className="w-full py-1.5 bg-brand-605 text-white font-semibold text-xs rounded hover:bg-brand-700"
                      >
                        Add Invoice
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {fees.map((fee, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950 p-2.5 rounded text-xs">
                        <div>
                          <strong>{fee.feeType} Invoice</strong>
                          <p className="text-slate-500 mt-0.5">Amount: &#8377;{fee.amount} | Paid: &#8377;{fee.paidAmount} | Status: <strong className="text-slate-300">{fee.status}</strong></p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFee(idx)}
                          className="p-1 text-slate-500 hover:text-red-500"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
