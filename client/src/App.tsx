import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./layouts/PublicLayout";

import Home from "./pages/public/Home";
import JobList from "./pages/public/JobList";
import JobDetails from "./pages/public/JobDetails";
import NotFound from "./pages/public/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import AttendanceHistory from "./pages/employee/AttendanceHistory";
import Leave from "./pages/employee/Leave";


import JobSeekerLayout from "./layouts/JobSeekerLayout";
import JobSeekerDashboard from "./pages/job-seeker/JobSeekerDashboard";
import Profile from "./pages/job-seeker/Profile";
import MyApplications from "./pages/job-seeker/MyApplications";
import SavedJobs from "./pages/job-seeker/SavedJobs";
import RecommendedJobs from "./pages/job-seeker/RecommendedJobs";
import MyInterviews from "./pages/job-seeker/MyInterviews";

import EmployerLayout from "./layouts/EmployerLayout";
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerAnalytics from "./pages/employer/EmployerAnalytics";
import CompanyProfile from "./pages/employer/CompanyProfile";
import MyJobs from "./pages/employer/MyJobs";
import CreateJob from "./pages/employer/CreateJob";
import EditJob from "./pages/employer/EditJob";
import Applicants from "./pages/employer/Applicants";
import Interviews from "./pages/employer/Interviews";
import HRDashboard from "./pages/employer/HRDashboard";
import LeaveRequests from "./pages/employer/LeaveRequests";
import CompanyTeam from "./pages/employer/CompanyTeam";
import CompanyEmployees from "./pages/employer/CompanyEmployees";
import WorkSchedules from "./pages/employer/WorkSchedules";
import CompanyAttendance from "./pages/employer/CompanyAttendance";
import Notifications from "./pages/notifications/Notifications";



function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Portal Routes with PublicLayout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<JobList />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
            </Route>

            {/* Authentication Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/employees" element={<EmployeeManagement />} />
                <Route path="/admin/roles" element={<RoleManagement />} />
              </Route>
            </Route>

            {/* Protected Employee Routes */}
            <Route element={<ProtectedRoute requireAdmin={false} requireEmployee={true} />}>
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee/attendance" element={<AttendanceHistory />} />
              <Route path="/employee/leave" element={<Leave />} />
            </Route>

            {/* Protected Job Seeker Routes */}
            <Route element={<ProtectedRoute requireJobSeeker={true} />}>
              <Route element={<JobSeekerLayout />}>
                <Route path="/job-seeker/dashboard" element={<JobSeekerDashboard />} />
                <Route path="/job-seeker/profile" element={<Profile />} />
                <Route path="/job-seeker/applications" element={<MyApplications />} />
                <Route path="/job-seeker/saved" element={<SavedJobs />} />
                <Route path="/job-seeker/recommended" element={<RecommendedJobs />} />
                <Route path="/job-seeker/interviews" element={<MyInterviews />} />
              </Route>
            </Route>

            {/* Protected Employer Routes */}
            <Route element={<ProtectedRoute requireEmployer={true} />}>
              <Route element={<EmployerLayout />}>
                <Route path="/employer/dashboard" element={<EmployerDashboard />} />
                <Route path="/employer/analytics" element={<EmployerAnalytics />} />
                <Route path="/employer/company" element={<CompanyProfile />} />
                <Route path="/employer/team" element={<CompanyTeam />} />
                <Route path="/employer/employees" element={<CompanyEmployees />} />
                <Route path="/employer/schedules" element={<WorkSchedules />} />
                <Route path="/employer/attendance" element={<CompanyAttendance />} />
                <Route path="/employer/jobs" element={<MyJobs />} />
                <Route path="/employer/jobs/new" element={<CreateJob />} />
                <Route path="/employer/jobs/:id/edit" element={<EditJob />} />
                <Route path="/employer/jobs/:id/applicants" element={<Applicants />} />
                <Route path="/employer/applicants" element={<Applicants />} />
                <Route path="/employer/interviews" element={<Interviews />} />
                <Route path="/employer/hr" element={<HRDashboard />} />
                <Route path="/employer/leave-requests" element={<LeaveRequests />} />
              </Route>
            </Route>


            {/* Authenticated Shared Notification Center */}
            <Route element={<ProtectedRoute />}>
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* Catch-all 404 Fallback */}
            <Route element={<PublicLayout />}>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
