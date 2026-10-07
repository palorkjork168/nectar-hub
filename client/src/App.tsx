import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./layouts/PublicLayout";
import PageLoading from "./components/common/PageLoading";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ScrollToTop from "./components/common/ScrollToTop";
import { PageTitleSynchronizer } from "./hooks/useDocumentTitle";

// Eagerly loaded landing page for instant first paint
import Home from "./pages/public/Home";

// Lazy-loaded Public Routes
const JobList = lazy(() => import("./pages/public/JobList"));
const JobDetails = lazy(() => import("./pages/public/JobDetails"));
const NotFound = lazy(() => import("./pages/public/NotFound"));

// Lazy-loaded Auth Routes
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));

// Lazy-loaded Admin Layout & Pages
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const EmployeeManagement = lazy(() => import("./pages/admin/EmployeeManagement"));
const RoleManagement = lazy(() => import("./pages/admin/RoleManagement"));

// Lazy-loaded Employee Pages
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const AttendanceHistory = lazy(() => import("./pages/employee/AttendanceHistory"));
const Leave = lazy(() => import("./pages/employee/Leave"));

// Lazy-loaded Job Seeker Layout & Pages
const JobSeekerLayout = lazy(() => import("./layouts/JobSeekerLayout"));
const JobSeekerDashboard = lazy(() => import("./pages/job-seeker/JobSeekerDashboard"));
const Profile = lazy(() => import("./pages/job-seeker/Profile"));
const MyApplications = lazy(() => import("./pages/job-seeker/MyApplications"));
const SavedJobs = lazy(() => import("./pages/job-seeker/SavedJobs"));
const RecommendedJobs = lazy(() => import("./pages/job-seeker/RecommendedJobs"));
const MyInterviews = lazy(() => import("./pages/job-seeker/MyInterviews"));

// Lazy-loaded Employer Layout & Pages
const EmployerLayout = lazy(() => import("./layouts/EmployerLayout"));
const EmployerDashboard = lazy(() => import("./pages/employer/EmployerDashboard"));
const EmployerAnalytics = lazy(() => import("./pages/employer/EmployerAnalytics"));
const CompanyProfile = lazy(() => import("./pages/employer/CompanyProfile"));
const MyJobs = lazy(() => import("./pages/employer/MyJobs"));
const CreateJob = lazy(() => import("./pages/employer/CreateJob"));
const EditJob = lazy(() => import("./pages/employer/EditJob"));
const Applicants = lazy(() => import("./pages/employer/Applicants"));
const Interviews = lazy(() => import("./pages/employer/Interviews"));
const HRDashboard = lazy(() => import("./pages/employer/HRDashboard"));
const LeaveRequests = lazy(() => import("./pages/employer/LeaveRequests"));
const CompanyTeam = lazy(() => import("./pages/employer/CompanyTeam"));
const CompanyEmployees = lazy(() => import("./pages/employer/CompanyEmployees"));
const WorkSchedules = lazy(() => import("./pages/employer/WorkSchedules"));
const CompanyAttendance = lazy(() => import("./pages/employer/CompanyAttendance"));
const AuditLogs = lazy(() => import("./pages/employer/AuditLogs"));

// Lazy-loaded Notifications
const Notifications = lazy(() => import("./pages/notifications/Notifications"));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <PageTitleSynchronizer />
            <Suspense fallback={<PageLoading />}>
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
                    <Route path="/employer/audit" element={<AuditLogs />} />
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
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
