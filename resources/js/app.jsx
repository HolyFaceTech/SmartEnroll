import "./bootstrap";
import "../css/app.scss";
import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import HeadLayout from "./layouts/HeadLayout";
import StaffLayout from "./layouts/StaffLayout";

// --- PUBLIC PAGES ---
import Landing from "./pages/Landing";
import Maintenance from "./pages/Maintenance";

// Authentications
import Login from "./pages/auth/Login";
import Verify from "./pages/auth/Verify";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Admin & Head Shared
import Users from "./pages/admin_head/Users";

// Head & Staff Shared
import HeadStaffStrands from "./pages/head_staff/Strands";
import HeadStaffSections from "./pages/head_staff/Sections";
import HeadStaffSubjects from "./pages/head_staff/Subjects";

// --- ADMIN PAGES ---
import AdminDashboard from "./pages/admin/Dashboard";
import Students from "./pages/admin/Students";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import RecycleBin from "./pages/admin/RecycleBin";

// --- STAFF PAGES ---
import StaffDashboard from "./pages/staff/Dashboard";
import StaffStudents from "./pages/staff/Students";
import StaffReports from "./pages/staff/Reports";

// Placeholder Component
const Placeholder = ({ title }) => (
    <div className="container-fluid p-4 fade-in">
        <h2 className="fw-bold text-dark mb-3 font-monospace">{title}</h2>
        <div
            className="card shadow-sm border-0"
            style={{ backgroundColor: "#FFE2AF", border: "2px solid black" }}
        >
            <div className="card-body text-center py-5">
                <i
                    className="bi bi-cone-striped fs-1 text-warning mb-3"
                    style={{ textShadow: "2px 2px 0 #000" }}
                ></i>
                <h4 className="text-muted font-monospace">Work in Progress</h4>
                <p className="font-monospace">
                    This module (<strong>{title}</strong>) is currently under
                    development.
                </p>
            </div>
        </div>
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ==============================
                    PUBLIC ROUTES
                ============================== */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Landing />} />
                    <Route path="/maintenance" element={<Maintenance />} />
                </Route>

                {/* Auth routes */}
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/verify-email" element={<Verify />} />
                    <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                    />
                    <Route
                        path="/password-reset/:token"
                        element={<ResetPassword />}
                    />
                </Route>

                {/* Admin routes */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route
                        index
                        element={<Navigate to="/admin/dashboard" replace />}
                    />
                    <Route
                        path="dashboard"
                        element={<Placeholder title="AdminDashboard" />}
                    />
                    <Route
                        path="users"
                        element={<Users title="User Records" />}
                    />
                    <Route
                        path="keeps"
                        element={<Placeholder title="Keeps Management" />}
                    />
                    <Route
                        path="students"
                        element={<Students title="Student Records" />}
                    />
                    <Route
                        path="reports"
                        element={<Reports title="System Reports" />}
                    />
                    <Route
                        path="backup"
                        element={<Placeholder title="System Backup" />}
                    />
                    <Route
                        path="activity-logs"
                        element={<Placeholder title="Activity Logs" />}
                    />
                    <Route
                        path="system-status"
                        element={<Placeholder title="System Status" />}
                    />
                    <Route
                        path="maintenance"
                        element={<Placeholder title="Maintenance Mode" />}
                    />
                    <Route
                        path="settings"
                        element={<Settings title="Enrollment Settings" />}
                    />
                    <Route
                        path="recycle-bin"
                        element={<RecycleBin title="Recycle Bin" />}
                    />
                </Route>

                {/* Head routes */}
                <Route path="/head" element={<HeadLayout />}>
                    <Route
                        index
                        element={<Navigate to="/head/dashboard" replace />}
                    />
                    <Route
                        path="dashboard"
                        element={<Placeholder title="Head Dashboard" />}
                    />
                    <Route
                        path="users"
                        element={<Users title="User Records" />}
                    />
                    <Route
                        path="students"
                        element={<Placeholder title="Students Management" />}
                    />
                    <Route
                        path="keeps"
                        element={<Placeholder title="Keeps Management" />}
                    />
                    <Route
                        path="requests"
                        element={<Placeholder title="Requests Management" />}
                    />
                    <Route
                        path="strands"
                        element={<HeadStaffStrands title="Strand Management" />}
                    />
                    <Route
                        path="sections"
                        element={
                            <HeadStaffSections title="Section Management" />
                        }
                    />
                    <Route
                        path="subjects"
                        element={
                            <HeadStaffSubjects title="Subject Management" />
                        }
                    />
                    <Route
                        path="reports"
                        element={<Placeholder title="System Reports" />}
                    />
                    <Route
                        path="settings"
                        element={<Placeholder title="System Settings" />}
                    />
                    <Route
                        path="recycle-bin"
                        element={<Placeholder title="Recycle Bin" />}
                    />
                </Route>

                {/* ==============================
                    STAFF ROUTES
                ============================== */}
                <Route path="/staff" element={<StaffLayout />}>
                    <Route
                        index
                        element={<Navigate to="/staff/dashboard" replace />}
                    />

                    <Route path="dashboard" element={<StaffDashboard />} />
                    <Route
                        path="students"
                        element={<StaffStudents title="Student Records" />}
                    />
                    <Route
                        path="strands"
                        element={
                            <HeadStaffStrands title="Strands Management" />
                        }
                    />
                    <Route
                        path="sections"
                        element={
                            <HeadStaffSections title="Section Management" />
                        }
                    />
                    <Route
                        path="subjects"
                        element={
                            <HeadStaffSubjects title="Subject Management" />
                        }
                    />
                    <Route
                        path="reports"
                        element={<StaffReports title="System Reports" />}
                    />
                </Route>

                {/* ==============================
                    404 FALLBACK
                ============================== */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

if (document.getElementById("app")) {
    createRoot(document.getElementById("app")).render(<App />);
}
