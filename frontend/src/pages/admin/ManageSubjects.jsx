import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineAcademicCap, HiOutlineBookmark } from 'react-icons/hi';

export default function AdminManageSubjects() {
  const [activeTab, setActiveTab] = useState('subjects'); // subjects, departments
  
  // Lists state
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms state
  const [newDept, setNewDept] = useState({ name: '', code: '' });
  const [newSubj, setNewSubj] = useState({ name: '', code: '', department: '', semester: '', credits: 3 });

  // Filter state
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab, deptFilter, semFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (activeTab === 'subjects') {
        let url = '/api/subjects';
        const queries = [];
        if (deptFilter) queries.push(`department=${deptFilter}`);
        if (semFilter) queries.push(`semester=${semFilter}`);
        if (queries.length > 0) url += `?${queries.join('&')}`;

        const [subjRes, deptRes] = await Promise.all([
          axios.get(url, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/departments', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setSubjects(subjRes.data.data);
        setDepartments(deptRes.data.data);
      } else {
        const res = await axios.get('/api/departments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDepartments(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load subjects or departments.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDept.name || !newDept.code) return toast.error('All fields are required');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post('/api/departments', newDept, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Department created successfully.');
      setNewDept({ name: '', code: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department.');
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`/api/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Department deleted.');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete department.');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubj.name || !newSubj.code || !newSubj.department || !newSubj.semester) {
      return toast.error('All fields are required.');
    }
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post('/api/subjects', newSubj, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Subject created successfully.');
      setNewSubj({ name: '', code: '', department: '', semester: '', credits: 3 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subject.');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`/api/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Subject deleted.');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete subject.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Subjects & Departments</h1>
          <p className="text-sm text-slate-500 font-sans">Configure university courses, curriculum subjects, credit points, and departments.</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="mt-6 flex border-b border-slate-700 pb-2 gap-4">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'subjects' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Subjects Registry
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'departments' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Departments Registry
        </button>
      </div>

      {activeTab === 'subjects' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creation Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2 mb-4 flex items-center gap-1.5">
              <HiOutlinePlus /> Add New Subject
            </h3>
            <form onSubmit={handleAddSubject} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Subject Name</label>
                <input
                  value={newSubj.name}
                  onChange={(e) => setNewSubj({ ...newSubj, name: e.target.value })}
                  placeholder="Advanced Database Systems"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Subject Code</label>
                <input
                  value={newSubj.code}
                  onChange={(e) => setNewSubj({ ...newSubj, code: e.target.value })}
                  placeholder="18CS301T"
                  className="w-full text-xs uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Department</label>
                <select
                  value={newSubj.department}
                  onChange={(e) => setNewSubj({ ...newSubj, department: e.target.value })}
                  className="w-full text-xs"
                  required
                >
                  <option value="">-- Choose Dept --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.code}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Semester</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newSubj.semester}
                  onChange={(e) => setNewSubj({ ...newSubj, semester: Number(e.target.value) })}
                  placeholder="5"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Credits</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newSubj.credits}
                  onChange={(e) => setNewSubj({ ...newSubj, credits: Number(e.target.value) })}
                  placeholder="3"
                  className="w-full text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-brand-605 text-white font-semibold text-xs rounded-lg hover:bg-brand-700 mt-2"
              >
                Publish Subject
              </button>
            </form>
          </div>

          {/* List and filters */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-bold text-slate-300">Filters:</span>
              <div className="flex gap-2">
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="text-xs"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.code}>{d.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Sem"
                  value={semFilter}
                  onChange={(e) => setSemFilter(e.target.value)}
                  className="w-20 text-xs py-1"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center text-slate-500 text-xs py-8">Retrieving subjects...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="py-2.5 px-4 text-left">Code</th>
                      <th className="py-2.5 px-4 text-left">Subject</th>
                      <th className="py-2.5 px-4 text-left">Department</th>
                      <th className="py-2.5 px-4 text-center">Semester</th>
                      <th className="py-2.5 px-4 text-center">Credits</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-900/10">
                        <td className="py-3 px-4 font-semibold text-slate-400">{s.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{s.name}</td>
                        <td className="py-3 px-4 text-slate-400">{s.department}</td>
                        <td className="py-3 px-4 text-center text-slate-400">{s.semester}</td>
                        <td className="py-3 px-4 text-center text-slate-400">{s.credits}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteSubject(s._id)}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {subjects.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-500">No subjects matches parameters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Department Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2 mb-4 flex items-center gap-1.5">
              <HiOutlinePlus /> Add New Department
            </h3>
            <form onSubmit={handleAddDepartment} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Department Name</label>
                <input
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  placeholder="Computer Science & Engineering"
                  className="w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Department Code</label>
                <input
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                  placeholder="CSE"
                  className="w-full text-xs uppercase"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-brand-605 text-white font-semibold text-xs rounded-lg hover:bg-brand-700 mt-2"
              >
                Create Department
              </button>
            </form>
          </div>

          {/* Department List */}
          <div className="md:col-span-2">
            {isLoading ? (
              <div className="text-center text-slate-500 text-xs py-8">Retrieving departments...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="py-2.5 px-4 text-left">Code</th>
                      <th className="py-2.5 px-4 text-left">Department Name</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-900/10">
                        <td className="py-3 px-4 font-semibold text-slate-400">{d.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{d.name}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteDepartment(d._id)}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
