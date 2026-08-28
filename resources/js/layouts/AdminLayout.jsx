import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Toast from "../utils/toast";
import TermsModal from "../components/TermsModal";
import AdminHelpModal from "../components/AdminHelpModal";

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // UI States
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // User State
    const [user, setUser] = useState({
        name: "Admin User",
        email: "admin@test.com",
        role: "Administrator",
    });

    // Dynamic Header State
    const [currentSem, setCurrentSem] = useState({
        school_year: "Loading...",
        semester: "",
    });

    const fetchSettings = async () => {
        try {
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");
            const res = await axios.get("/api/settings", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data) {
                setCurrentSem({
                    school_year: res.data.school_year || "N/A",
                    semester: res.data.semester || "",
                });
            }
        } catch (error) {
            console.error("Failed to load settings");
            setCurrentSem({ school_year: "N/A", semester: "Offline" });
        }
    };

    useEffect(() => {
        // 1. Load User mula sa parehong storages
        const storedUser =
            localStorage.getItem("user") || sessionStorage.getItem("user");

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate("/login"); // I-kick out kung walang naka-save
        }

        // 2. Initial Fetch
        fetchSettings();

        // 3. Listen for updates
        const handleSettingsUpdate = () => fetchSettings();
        window.addEventListener("settings-updated", handleSettingsUpdate);
        return () =>
            window.removeEventListener(
                "settings-updated",
                handleSettingsUpdate,
            );
    }, [navigate]);

    const handleLogout = async () => {
        try {
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            await axios.post(
                "/api/logout",
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            // Linisin pareho ang storages
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");

            Toast.fire({ icon: "success", title: "Logged out successfully" });
            navigate("/login");
        } catch (error) {
            console.error("Logout failed", error);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            navigate("/login");
        }
    };

    const isActive = (path) => (location.pathname === path ? "active" : "");

    return (
        <div
            className="d-flex"
            style={{
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "var(--color-bg)",
            }}
        >
            {/* RETRO SIDEBAR */}
            <div
                className="d-flex flex-column flex-shrink-0 p-3 sidebar-retro text-white"
                style={{
                    width: isSidebarOpen ? "280px" : "90px",
                    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    height: "100vh",
                    position: "relative",
                    zIndex: 1000,
                }}
            >
                {/* 1. BRAND / LOGO (Fixed at Top) */}
                <div
                    className={`d-flex align-items-center mb-4 text-white text-decoration-none ${
                        !isSidebarOpen ? "justify-content-center" : ""
                    }`}
                    style={{
                        height: "60px",
                        overflow: "hidden",
                        flexShrink: 0,
                    }}
                >
                    <div
                        className="bg-white p-1 border border-2 border-dark rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px" }}
                    >
                        <img
                            src="/images/logo.png"
                            alt="Logo"
                            style={{ width: "100%", height: "auto" }}
                        />
                    </div>

                    <div
                        className={`ms-3 fade-in ${
                            !isSidebarOpen ? "d-none" : "d-block"
                        }`}
                        style={{ whiteSpace: "nowrap" }}
                    >
                        <span
                            className="fw-black d-block text-uppercase"
                            style={{
                                textShadow: "3px 3px 0 #000",
                                fontSize: "1.5rem",
                                letterSpacing: "1px",
                            }}
                        >
                            SmartEnroll
                        </span>
                    </div>
                </div>

                <hr className="border-dark opacity-100" />

                {/* 2. NAVIGATION LINKS (SCROLLABLE AREA) */}
                <div
                    className="flex-grow-1 mb-auto sidebar-scroll-area"
                    style={{
                        overflowY: "auto",
                        overflowX: "hidden",
                        paddingRight: "5px",
                    }}
                >
                    <ul className="nav nav-pills flex-column">
                        {[
                            {
                                path: "/admin/dashboard",
                                icon: "bi-speedometer2",
                                label: "Dashboard",
                            },
                            {
                                path: "/admin/users",
                                icon: "bi-people-fill",
                                label: "User Records",
                            },
                            {
                                path: "/admin/students",
                                icon: "bi-mortarboard-fill",
                                label: "Student Records",
                            },
                            {
                                path: "/admin/strands",
                                icon: "bi-diagram-3-fill",
                                label: "Strands",
                            },
                            {
                                path: "/admin/sections",
                                icon: "bi-grid-3x3-gap-fill",
                                label: "Sections",
                            },
                            {
                                path: "/admin/subjects",
                                icon: "bi-book-fill",
                                label: "Subjects",
                            },
                            {
                                path: "/admin/reports",
                                icon: "bi-file-earmark-bar-graph-fill",
                                label: "Reports",
                            },
                            {
                                path: "/admin/settings",
                                icon: "bi-gear-fill",
                                label: "Settings",
                            },
                            {
                                path: "/admin/recycle-bin",
                                icon: "bi-trash-fill",
                                label: "Recycle Bin",
                            },
                        ].map((item) => (
                            <li className="nav-item mb-2" key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`nav-link nav-link-retro d-flex align-items-center ${
                                        isSidebarOpen
                                            ? "gap-3 px-3"
                                            : "justify-content-center px-0"
                                    } ${isActive(item.path)}`}
                                    title={!isSidebarOpen ? item.label : ""}
                                >
                                    <i className={`bi ${item.icon} fs-5`}></i>
                                    {isSidebarOpen && <span>{item.label}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <hr className="border-dark opacity-100" />

                {/* 3. USER PROFILE (Updated Style) */}
                <div className="dropdown position-relative flex-shrink-0">
                    <div
                        className={`d-flex align-items-center text-white text-decoration-none cursor-pointer p-2 rounded ${
                            !isSidebarOpen ? "justify-content-center" : ""
                        }`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{
                            cursor: "pointer",
                            border: "2px solid white", // WHITE BORDER (Same as Staff)
                            backgroundColor: isDropdownOpen
                                ? "rgba(255,255,255,0.1)"
                                : "transparent",
                            transition: "all 0.1s",
                        }}
                    >
                        {/* AVATAR: Black BG, White Text */}
                        <img
                            src={`https://ui-avatars.com/api/?name=${user.name}&background=000000&color=fff&bold=true`}
                            alt="User"
                            width="40"
                            height="40"
                            className="rounded-circle border border-2 border-white flex-shrink-0"
                        />

                        {isSidebarOpen && (
                            <div
                                className="ms-2 fade-in overflow-hidden"
                                style={{ lineHeight: "1.2" }}
                            >
                                <strong
                                    className="d-block text-truncate font-monospace"
                                    style={{ maxWidth: "150px" }}
                                >
                                    {user.name}
                                </strong>
                                <small
                                    className="d-block text-uppercase"
                                    style={{
                                        fontSize: "0.7rem",
                                        letterSpacing: "1px",
                                        fontWeight: "800",
                                        color: "rgba(255,255,255,0.7)", // MUTED WHITE ROLE
                                    }}
                                >
                                    {user.role}
                                </small>
                            </div>
                        )}

                        {isSidebarOpen && (
                            <i
                                className={`bi bi-chevron-${
                                    isDropdownOpen ? "up" : "down"
                                } ms-auto small`}
                            ></i>
                        )}
                    </div>

                    {/* DROPDOWN MENU */}
                    {isDropdownOpen && (
                        <div
                            className="bg-white text-dark rounded p-2 fade-in"
                            style={{
                                position: "absolute",
                                bottom: "120%", // Pops UP
                                left: "0",
                                width: isSidebarOpen ? "100%" : "260px",
                                minWidth: "260px",
                                border: "2px solid black",
                                boxShadow: "4px 4px 0px #000",
                                zIndex: 1050,
                            }}
                        >
                            <div className="px-3 py-2 border-bottom border-dark mb-2 bg-retro-bg rounded">
                                <span className="d-block small fw-bold text-muted font-monospace">
                                    SIGNED IN AS
                                </span>
                                <span
                                    className="d-block text-truncate fw-bold text-dark font-monospace"
                                    title={user.email}
                                >
                                    {user.email}
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2 fw-bold font-monospace"
                                style={{
                                    border: "2px solid black",
                                    boxShadow: "2px 2px 0 #000",
                                }}
                            >
                                <i className="bi bi-box-arrow-right"></i> SIGN
                                OUT
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div
                className="flex-grow-1 d-flex flex-column"
                style={{ overflowY: "auto", height: "100vh" }}
            >
                {/* HEADER */}
                <header
                    className="py-3 px-4 bg-white d-flex justify-content-between align-items-center sticky-top"
                    style={{
                        zIndex: 900,
                        borderBottom: "2px solid black",
                    }}
                >
                    <button
                        className="btn p-0 border-0"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <i className="bi bi-list fs-1 fw-bold"></i>
                    </button>

                    <div
                        className="fw-bold d-flex align-items-center gap-2 px-3 py-1 rounded"
                        style={{
                            border: "2px solid black",
                            backgroundColor: "var(--color-bg)",
                        }}
                    >
                        <i className="bi bi-calendar-check-fill"></i>
                        <span
                            style={{
                                fontFamily: "monospace",
                                fontSize: "1.1rem",
                            }}
                        >
                            S.Y. {currentSem.school_year} |{" "}
                            {currentSem.semester}
                        </span>
                    </div>
                </header>

                {/* MAIN CONTENT */}
                <main className="p-4 flex-grow-1">
                    <Outlet />
                </main>

                {/* FOOTER WITH HELP BUTTON */}
                <footer
                    className="py-3 bg-white text-center small mt-auto"
                    style={{ borderTop: "2px solid black" }}
                >
                    <div className="container font-monospace d-flex justify-content-center align-items-center flex-wrap gap-2">
                        <span>
                            © {new Date().getFullYear()} SmartEnroll System
                        </span>
                        <span className="mx-2">|</span>

                        {/* TERMS BUTTON */}
                        <button
                            className="btn btn-link text-dark text-decoration-none fw-bold p-0"
                            onClick={() => setShowTerms(true)}
                        >
                            Terms & Policy
                        </button>

                        <span className="mx-2">|</span>

                        {/* HELP BUTTON */}
                        <button
                            className="btn btn-link text-primary text-decoration-none fw-black p-0 d-flex align-items-center gap-1"
                            onClick={() => setShowHelp(true)}
                        >
                            <i className="bi bi-question-circle-fill fs-6"></i>
                            HELP & GUIDE
                        </button>
                    </div>
                </footer>
            </div>

            <TermsModal
                show={showTerms}
                handleClose={() => setShowTerms(false)}
            />

            <AdminHelpModal
                show={showHelp}
                onClose={() => setShowHelp(false)}
            />
        </div>
    );
}
