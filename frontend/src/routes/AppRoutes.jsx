import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';

import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Dashboard from '../pages/Dashboard';
import Notes from '../pages/Notes';
import Pyqs from '../pages/Pyqs';
import SubjectDashboard from '../pages/SubjectDashboard';
import FolderView from '../pages/FolderView';
import Placements from '../pages/Placements';
import Events from '../pages/Events';
import Profile from '../pages/Profile';
import Notifications from '../pages/Notifications';
import Complaints from '../pages/Complaints';
import SupportTickets from '../pages/SupportTickets';
import AIAssistant from '../pages/AIAssistant';
import AdminDashboard from '../pages/AdminDashboard';
import ManageNotes from '../pages/admin/ManageNotes';
import ManagePyqs from '../pages/admin/ManagePyqs';
import ManagePlacements from '../pages/admin/ManagePlacements';
import ManageEvents from '../pages/admin/ManageEvents';
import ManageComplaints from '../pages/admin/ManageComplaints';
import ManageSupportTickets from '../pages/admin/ManageSupportTickets';
import SendNotification from '../pages/admin/SendNotification';
import Analytics from '../pages/admin/Analytics';
import AcademicResources from '../pages/admin/AcademicResources';
import Unauthorized from '../pages/Unauthorized';
import NotFound from '../pages/NotFound';

import StudentFees from '../pages/StudentFees';
import ParentFees from '../pages/ParentFees';
import FeeManagement from '../pages/admin/FeeManagement';

// Student Portals
import StudentAttendance from '../pages/student/Attendance';
import StudentAssignments from '../pages/student/Assignments';
import StudentTimetable from '../pages/student/Timetable';
import StudentResumeBuilder from '../pages/student/ResumeBuilder';
import AcademicTools from '../pages/student/AcademicTools';
import StudentExams from '../pages/student/Exams';
import StudentInternalMarks from '../pages/student/InternalMarks';

// Faculty Portals
import FacultyManageAttendance from '../pages/faculty/ManageAttendance';
import FacultyManageAssignments from '../pages/faculty/ManageAssignments';
import FacultyManageNotes from '../pages/faculty/ManageNotes';
import FacultyManageTimetable from '../pages/faculty/ManageTimetable';

// Admin Portals
import AdminManageUsers from '../pages/admin/ManageUsers';
import AdminManageSubjects from '../pages/admin/ManageSubjects';
import AdminSystemSettings from '../pages/admin/SystemSettings';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/parent/fees" element={<ParentFees />} />

      {/* Shared routes (student, faculty, admin) */}
      <Route element={<ProtectedRoute allowedRoles={['student', 'faculty', 'admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/pyqs" element={<Pyqs />} />
          <Route path="/subjects/:subjectName" element={<SubjectDashboard />} />
          <Route path="/subjects/:subjectName/:category" element={<FolderView />} />
          <Route path="/placements" element={<Placements />} />
          <Route path="/events" element={<Events />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
        </Route>
      </Route>

      {/* Student-only routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<AppLayout />}>
          <Route path="/attendance" element={<StudentAttendance />} />
          <Route path="/assignments" element={<StudentAssignments />} />
          <Route path="/timetable" element={<StudentTimetable />} />
          <Route path="/resume-builder" element={<StudentResumeBuilder />} />
          <Route path="/academic-tools" element={<AcademicTools />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/support-tickets" element={<SupportTickets />} />
          <Route path="/fees" element={<StudentFees />} />
          <Route path="/exams" element={<StudentExams />} />
          <Route path="/marks" element={<StudentInternalMarks />} />
        </Route>
      </Route>

      {/* Faculty-only routes */}
      <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
        <Route element={<AppLayout />}>
          <Route path="/faculty/attendance" element={<FacultyManageAttendance />} />
          <Route path="/faculty/assignments" element={<FacultyManageAssignments />} />
          <Route path="/faculty/notes" element={<FacultyManageNotes />} />
          <Route path="/faculty/timetable" element={<FacultyManageTimetable />} />
        </Route>
      </Route>

      {/* Admin-only routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/academic" element={<AcademicResources />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/users" element={<AdminManageUsers />} />
          <Route path="/admin/subjects" element={<AdminManageSubjects />} />
          <Route path="/admin/settings" element={<AdminSystemSettings />} />
          <Route path="/admin/notes" element={<ManageNotes />} />
          <Route path="/admin/pyqs" element={<ManagePyqs />} />
          <Route path="/admin/placements" element={<ManagePlacements />} />
          <Route path="/admin/events" element={<ManageEvents />} />
          <Route path="/admin/complaints" element={<ManageComplaints />} />
          <Route path="/admin/support-tickets" element={<ManageSupportTickets />} />
          <Route path="/admin/notifications/send" element={<SendNotification />} />
          <Route path="/admin/fees" element={<FeeManagement />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
