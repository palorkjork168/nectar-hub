import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const DEFAULT_PAGE_TITLE = "Nectar Hub — Your Workplace, Connected.";

const ROUTE_TITLE_MAP: Record<string, string> = {
  "/": "Nectar Hub — Your Workplace, Connected.",
  "/jobs": "Nectar Hub | Jobs",
  "/login": "Nectar Hub | Sign In",
  "/register": "Nectar Hub | Join Nectar Hub",
  "/notifications": "Nectar Hub | Notifications",

  // Admin Routes
  "/admin/dashboard": "Nectar Hub | Admin Portal",
  "/admin/analytics": "Nectar Hub | Platform Analytics",
  "/admin/employees": "Nectar Hub | Employees Management",
  "/admin/roles": "Nectar Hub | Roles & Permissions",

  // Employee Routes
  "/employee/dashboard": "Nectar Hub | Dashboard",
  "/employee/attendance": "Nectar Hub | Attendance History",
  "/employee/leave": "Nectar Hub | Time Off & Leave",

  // Job Seeker Routes
  "/job-seeker/dashboard": "Nectar Hub | Dashboard",
  "/job-seeker/profile": "Nectar Hub | Profile",
  "/job-seeker/applications": "Nectar Hub | Applications",
  "/job-seeker/saved": "Nectar Hub | Saved Jobs",
  "/job-seeker/recommended": "Nectar Hub | Recommended Jobs",
  "/job-seeker/interviews": "Nectar Hub | Interviews",

  // Employer Routes
  "/employer/dashboard": "Nectar Hub | Employer Dashboard",
  "/employer/analytics": "Nectar Hub | Analytics",
  "/employer/company": "Nectar Hub | Company Profile",
  "/employer/team": "Nectar Hub | Team",
  "/employer/employees": "Nectar Hub | Employees",
  "/employer/schedules": "Nectar Hub | Work Schedules",
  "/employer/attendance": "Nectar Hub | Attendance",
  "/employer/jobs": "Nectar Hub | Manage Jobs",
  "/employer/jobs/new": "Nectar Hub | Post New Job",
  "/employer/applicants": "Nectar Hub | Applicants",
  "/employer/interviews": "Nectar Hub | Interviews",
  "/employer/hr": "Nectar Hub | HR Dashboard",
  "/employer/leave-requests": "Nectar Hub | Leave Requests",
  "/employer/audit": "Nectar Hub | Audit Logs",
};

/**
 * Hook to manually set document title within specific component lifecycle
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);
}

/**
 * Router-level Title Synchronizer to update document.title on every route change
 */
export function PageTitleSynchronizer() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    if (ROUTE_TITLE_MAP[pathname]) {
      document.title = ROUTE_TITLE_MAP[pathname];
      return;
    }

    // Dynamic routes matching
    if (pathname.startsWith("/jobs/")) {
      document.title = "Nectar Hub | Job Details";
      return;
    }
    if (pathname.startsWith("/employer/jobs/") && pathname.endsWith("/edit")) {
      document.title = "Nectar Hub | Edit Job";
      return;
    }
    if (pathname.startsWith("/employer/jobs/") && pathname.endsWith("/applicants")) {
      document.title = "Nectar Hub | Applicants";
      return;
    }

    document.title = DEFAULT_PAGE_TITLE;
  }, [location.pathname]);

  return null;
}
