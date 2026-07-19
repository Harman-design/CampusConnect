import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiOutlineUserGroup, HiOutlinePlus, HiOutlineCloudUpload, HiOutlineTable } from 'react-icons/hi';

export default function FacultyManageAttendance() {
  const [activeTab, setActiveTab] = useState('mark'); // mark, reports
  const [params, setParams] = useState({ department: '', semester: '', subject: '', date: new Date().toISOString().split('T')[0] });
  const [students, setStudents] = useState([]);
  const [attendanceSheet, setAttendanceSheet] = useState({}); // { studentId: { status, remarks } }
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportRecords, setReportRecords] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const [deptRes, subjRes] = await Promise.all([
        axios.get('/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/subjects', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setDepartments(deptRes.data.data);
      setSubjects(subjRes.data.data);
    } catch (err) {
      toast.error('Failed to load subject lists.');
    }
  };

  const handleFetchStudents = async () => {
    if (!params.department || !params.semester) {
      toast.error('Please choose Department and Semester first.');
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get(`/api/users/students?department=${params.department}&semester=${params.semester}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.data);
      
      // Initialize sheet
      const sheet = {};
      res.data.data.forEach((s) => {
        sheet[s._id] = { status: 'Present', remarks: '' };
      });
      setAttendanceSheet(sheet);
    } catch (err) {
      toast.error('Failed to retrieve students.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceSheet({
      ...attendanceSheet,
      [studentId]: { ...attendanceSheet[studentId], status }
    });
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceSheet({
      ...attendanceSheet,
      [studentId]: { ...attendanceSheet[studentId], remarks }
    });
  };

  const handleBulkMarkPresent = () => {
    const sheet = { ...attendanceSheet };
    Object.keys(sheet).forEach((k) => {
      sheet[k].status = 'Present';
    });
    setAttendanceSheet(sheet);
  };

  const handleSubmitAttendance = async () => {
    if (!params.subject) {
      toast.error('Please select a subject.');
      return;
    }

    const records = Object.keys(attendanceSheet).map((studentId) => ({
      studentId,
      status: attendanceSheet[studentId].status,
      remarks: attendanceSheet[studentId].remarks,
    }));

    if (records.length === 0) {
      toast.error('No attendance records to submit.');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post('/api/attendance', {
        department: params.department,
        semester: Number(params.semester),
        subject: params.subject,
        date: params.date,
        records,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Attendance submitted successfully.');
      setStudents([]);
      setAttendanceSheet({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance.');
    }
  };

  const handleFetchReport = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      let url = '/api/attendance/report';
      const query = [];
      if (params.department) query.push(`department=${params.department}`);
      if (params.semester) query.push(`semester=${params.semester}`);
      if (params.subject) query.push(`subject=${params.subject}`);
      if (query.length > 0) url += `?${query.join('&')}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportRecords(res.data.data);
    } catch (err) {
      toast.error('Failed to load attendance report.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Attendance</h1>
        <p className="text-sm text-slate-500 font-sans">Mark attendance sheets, edit entries, and view logs.</p>
      </div>

      <div className="mt-6 flex border-b border-slate-700 pb-2 gap-4">
        <button
          onClick={() => setActiveTab('mark')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'mark' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mark Sheet
        </button>
        <button
          onClick={() => { setActiveTab('reports'); handleFetchReport(); }}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'reports' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Reports & History
        </button>
      </div>

      {activeTab === 'mark' && (
        <div className="mt-6 flex flex-col gap-6">
          {/* Roster query parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-end gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Department</label>
              <select
                value={params.department}
                onChange={(e) => setParams({ ...params, department: e.target.value })}
                className="w-full"
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="10"
                value={params.semester}
                onChange={(e) => setParams({ ...params, semester: e.target.value })}
                placeholder="5"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Subject</label>
              <select
                value={params.subject}
                onChange={(e) => setParams({ ...params, subject: e.target.value })}
                className="w-full"
              >
                <option value="">-- Select Subject --</option>
                {subjects
                  .filter((s) => s.department === params.department && s.semester === Number(params.semester))
                  .map((s) => (
                    <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
              </select>
            </div>
            <div>
              <button
                onClick={handleFetchStudents}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg"
              >
                Load Students
              </button>
            </div>
          </div>

          {/* Student Roster list */}
          {students.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Roster Checklist</h3>
                  <p className="text-[11px] text-slate-400">Mark student status for subject: <strong>{params.subject}</strong></p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkMarkPresent}
                    className="py-1 px-3 bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300 rounded hover:text-white"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={handleSubmitAttendance}
                    className="py-1.5 px-4 bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white rounded-lg flex items-center gap-1"
                  >
                    <HiOutlineCloudUpload /> Submit Sheet
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="py-2.5 px-4 text-left">Reg No</th>
                      <th className="py-2.5 px-4 text-left">Student Name</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-slate-900/10">
                        <td className="py-3 px-4 text-slate-400 font-semibold">{student.registerNumber || 'N/A'}</td>
                        <td className="py-3 px-4 font-medium text-slate-300">{student.name}</td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={attendanceSheet[student._id]?.status || 'Present'}
                            onChange={(e) => handleStatusChange(student._id, e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-medium cursor-pointer"
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="Excused">Excused</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Add remarks..."
                            value={attendanceSheet[student._id]?.remarks || ''}
                            onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                            className="w-full text-xs py-1 px-2"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Filter Subject</label>
              <select
                value={params.subject}
                onChange={(e) => setParams({ ...params, subject: e.target.value })}
                className="w-full"
              >
                <option value="">-- All Subjects --</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={handleFetchReport}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5"
              >
                <HiOutlineTable /> Filter Report
              </button>
            </div>
          </div>

          {/* Report records table */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Historical Attendance Entries</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="py-2.5 px-4 text-left">Date</th>
                    <th className="py-2.5 px-4 text-left">Student</th>
                    <th className="py-2.5 px-4 text-left">Subject</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-900/10">
                      <td className="py-3 px-4 text-slate-400">{new Date(rec.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-medium text-slate-300">
                        {rec.student?.name} <span className="text-[10px] text-slate-500">({rec.student?.registerNumber})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{rec.subject}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          rec.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic">{rec.remarks || 'None'}</td>
                    </tr>
                  ))}
                  {reportRecords.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500">No logs matching selections.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
