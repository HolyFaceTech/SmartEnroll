import "./bootstrap";
import "../css/app.scss";
import { createRoot } from "react-dom/client";
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Loading from "./utils/Loading";

// Layouts
const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
const AuthLayout = lazy(() => import("./layouts/AuthLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const HeadLayout = lazy(() => import("./layouts/HeadLayout"));
const StaffLayout = lazy(() => import("./layouts/StaffLayout"));

// Public Pages
const Home = lazy(() => import("./pages/public/Home"));
const Registrar = lazy(() => import("./pages/public/Registrar"));
const Strands = lazy(() => import("./pages/public/Strands"));
const FAQ = lazy(() => import("./pages/public/FAQ"));
const Maintenance = lazy(() => import("./pages/Maintenance"));

// Authentications
const Login = lazy(() => import("./pages/auth/Login"));
const Verify = lazy(() => import("./pages/auth/Verify"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Head
const Settings = lazy(() => import("./pages/head/Setting"));

// Admin & Head Shared
const AdminHeadUsers = lazy(() => import("./pages/admin_head/Users"));

// Head & Staff Shared
const HeadStaffStrands = lazy(() => import("./pages/head_staff/Strands"));
const HeadStaffSections = lazy(() => import("./pages/head_staff/Sections"));
const HeadStaffSubjects = lazy(() => import("./pages/head_staff/Subjects"));
const HeadStaffStudents = lazy(() => import("./pages/head_staff/Students"));

// Admin, Head & Staff Shared
const AdminHeadStaffKeeps = lazy(() => import("./pages/AdminHeadStaff/Keeps"));

// Not Done for Updates
const Reports = lazy(() => import("./pages/admin/Reports"));
const RecycleBin = lazy(() => import("./pages/admin/RecycleBin"));
const StaffDashboard = lazy(() => import("./pages/staff/Dashboard"));
const StaffReports = lazy(() => import("./pages/staff/Reports"));

// Placeholder Component
const Placeholder = ({ title }) => (
    <div className="container-fluid p-4 fade-in font-monospace">
        <h2 className="fw-bold text-dark mb-3">{title}</h2>
        <div
            className="card shadow-sm border-0"
            style={{ backgroundColor: "#FFE2AF", border: "2px solid black" }}
        >
            <div className="card-body text-center py-5">
                <i
                    className="bi bi-cone-striped fs-1 text-warning mb-3"
                    style={{ textShadow: "2px 2px 0 #000" }}
                ></i>
                <h4 className="text-muted">Work in Progress</h4>
                <p>
                    This module (<strong>{title}</strong>) is currently under
                    development.
                </p>
            </div>
        </div>
    </div>
);

// Fallback Loader habang nagda-download ang mga Lazy Components
const PageLoader = () => <Loading show={true} message="LOADING MODULE..." />;

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public Routes */}
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<Home />} />
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
                            element={<AdminHeadUsers title="User Records" />}
                        />
                        <Route
                            path="keeps"
                            element={
                                <AdminHeadStaffKeeps title="Keeps Management" />
                            }
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
                            element={
                                <Placeholder title="Enrollment Settings" />
                            }
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
                            element={<AdminHeadUsers title="User Records" />}
                        />
                        <Route
                            path="students"
                            element={
                                <HeadStaffStudents title="Student Records" />
                            }
                        />
                        <Route
                            path="keeps"
                            element={
                                <AdminHeadStaffKeeps title="Keeps Management" />
                            }
                        />
                        <Route
                            path="requests"
                            element={
                                <Placeholder title="Requests Management" />
                            }
                        />
                        <Route
                            path="strands"
                            element={
                                <HeadStaffStrands title="Strand Management" />
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
                            element={<Placeholder title="System Reports" />}
                        />
                        <Route
                            path="settings"
                            element={<Settings title="System Settings" />}
                        />
                        <Route
                            path="recycle-bin"
                            element={<Placeholder title="Recycle Bin" />}
                        />
                    </Route>

                    {/* Staff Routes */}
                    <Route path="/staff" element={<StaffLayout />}>
                        <Route
                            index
                            element={<Navigate to="/staff/dashboard" replace />}
                        />

                        <Route path="dashboard" element={<StaffDashboard />} />
                        <Route
                            path="students"
                            element={
                                <HeadStaffStudents title="Student Records" />
                            }
                        />
                        <Route
                            path="keeps"
                            element={
                                <AdminHeadStaffKeeps title="Keeps Management" />
                            }
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

                    {/* 404 */}
                    <Route
                        path="*"
                        element={<Navigate to="/login" replace />}
                    />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

if (document.getElementById("app")) {
    createRoot(document.getElementById("app")).render(<App />);
}
