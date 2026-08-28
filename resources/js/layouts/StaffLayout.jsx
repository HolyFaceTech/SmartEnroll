import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Toast from "../utils/toast";
import TermsModal from "../components/TermsModal";
import StaffHelpModal from "../components/StaffHelpModal";
import Maintenance from "../pages/Maintenance";

export default function StaffLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // User State
    const [user, setUser] = useState({
        name: "Staff User",
        email: "staff@test.com",
        role: "Staff",
    });

    // Dynamic Header State
    const [currentSem, setCurrentSem] = useState({
        school_year: "Loading...",
        semester: "",
    });

    // UI States
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // 2. ADD MAINTENANCE STATE
    const [isMaintenance, setIsMaintenance] = useState(false);

    // FETCH SETTINGS
    const fetchSettings = async () => {
        try {
            const res = await axios.get("/api/settings");
            if (res.data) {
                setCurrentSem({
                    school_year: res.data.school_year || "TBA",
                    semester: res.data.semester || "TBA",
                });
            }
        } catch (error) {
            // 3. CATCH 503 ERROR (MAINTENANCE MODE)
            if (error.response && error.response.status === 503) {
                setIsMaintenance(true);
            }
            // Handle Unauthorized (Session Expired)
            else if (error.response && error.response.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            }

            console.error("Failed to load settings");
            setCurrentSem({ school_year: "N/A", semester: "Offline" });
        }
    };

    useEffect(() => {
        // 1. Load User
        const storedUser =
            localStorage.getItem("user") || sessionStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        // 2. Fetch Settings
        fetchSettings();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post("/api/logout");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            Toast.fire({ icon: "success", title: "Logged out successfully" });
            navigate("/login");
        } catch (error) {
            console.error("Logout failed", error);
            localStorage.removeItem("token");
            navigate("/login");
        }
    };

    // Helper para sa Active Link style
    const isActive = (path) => location.pathname === path;

    // 4. BLOCK EVERYTHING IF MAINTENANCE IS ACTIVE
    // Ito ang magtatago ng Sidebar, Navbar, at Footer. Full screen maintenance lang ang lalabas.
    if (isMaintenance) {
        return <Maintenance />;
    }

    return (
        // 1. FIXED HEIGHT CONTAINER (No Page Scroll)
        <div
            className="d-flex flex-column"
            style={{
                height: "100vh", // Lock height to screen
                overflow: "hidden", // Disable body scroll
                backgroundColor: "var(--color-bg)",
            }}
        >
            {/* 2. FIXED HEADER */}
            <nav
                className="navbar navbar-expand-lg py-0 px-4 border-bottom border-2 border-dark"
                style={{
                    backgroundColor: "var(--color-primary)",
                    zIndex: 1000,
                    boxShadow: "0 4px 0 rgba(0,0,0,0.1)",
                    height: "80px",
                    flexShrink: 0,
                }}
            >
                <div className="container-fluid h-100 d-flex align-items-center justify-content-between">
                    {/* LEFT: BRANDING */}
                    <Link
                        to="/staff/dashboard"
                        className="d-flex align-items-center text-decoration-none gap-3 h-100"
                    >
                        <div
                            className="bg-white p-1 border border-2 border-dark rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            style={{ width: "50px", height: "50px" }}
                        >
                            <img
                                src="/images/logo.png"
                                alt="Logo"
                                style={{ width: "100%", height: "auto" }}
                            />
                        </div>
                        <div className="d-flex flex-column justify-content-center">
                            <span
                                className="fw-black text-uppercase lh-1 text-white"
                                style={{
                                    fontSize: "1.5rem",
                                    letterSpacing: "1px",
                                    textShadow: "3px 3px 0 #000",
                                }}
                            >
                                SmartEnroll
                            </span>
                            <span
                                className="small fw-bold font-monospace text-uppercase"
                                style={{
                                    letterSpacing: "2px",
                                    color: "#F4D03F",
                                    textShadow: "1px 1px 0 #000",
                                }}
                            >
                                Staff Portal
                            </span>
                        </div>
                    </Link>

                    {/* CENTER: SCHOOL YEAR BADGE */}
                    <div
                        className="d-none d-lg-flex align-items-center gap-2 px-3 py-1 rounded shadow-sm"
                        style={{
                            border: "2px solid black",
                            backgroundColor: "#FFE2AF", // Cream Background
                            boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
                        }}
                    >
                        <i className="bi bi-calendar-check-fill text-dark"></i>
                        <span
                            style={{
                                fontFamily: "monospace",
                                fontSize: "1rem",
                                fontWeight: "bold",
                                color: "#000",
                            }}
                        >
                            S.Y. {currentSem.school_year} |{" "}
                            {currentSem.semester}
                        </span>
                    </div>

                    {/* RIGHT: USER PROFILE */}
                    <div className="position-relative">
                        <div
                            className="d-flex align-items-center text-white text-decoration-none cursor-pointer p-2 rounded justify-content-between" // Added justify-content-between
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                cursor: "pointer",
                                border: "2px solid white",
                                backgroundColor: isDropdownOpen
                                    ? "rgba(255,255,255,0.1)"
                                    : "transparent",
                                transition: "all 0.1s",
                                minWidth: "180px", // Optional: Ensure enough width
                            }}
                            onMouseEnter={(e) => {
                                if (!isDropdownOpen)
                                    e.currentTarget.style.backgroundColor =
                                        "rgba(255,255,255,0.1)";
                            }}
                            onMouseLeave={(e) => {
                                if (!isDropdownOpen)
                                    e.currentTarget.style.backgroundColor =
                                        "transparent";
                            }}
                        >
                            {/* LEFT SIDE: Avatar + Info */}
                            <div className="d-flex align-items-center">
                                {/* AVATAR */}
                                <img
                                    src={`https://ui-avatars.com/api/?name=${user.name}&background=000000&color=fff&bold=true`}
                                    alt="User"
                                    width="40"
                                    height="40"
                                    className="rounded-circle border border-2 border-white flex-shrink-0"
                                />

                                <div
                                    className="ms-2 d-none d-md-block"
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
                                            color: "rgba(255,255,255,0.7)",
                                        }}
                                    >
                                        {user.role}
                                    </small>
                                </div>
                            </div>

                            {/* RIGHT SIDE: Chevron (With proper spacing) */}
                            <i
                                className={`bi bi-chevron-${isDropdownOpen ? "up" : "down"} ms-4 small text-white`} // Changed ms-2 to ms-4 for wider gap
                            ></i>
                        </div>

                        {/* DROPDOWN MENU */}
                        {isDropdownOpen && (
                            <div
                                className="bg-white text-dark rounded p-2 fade-in"
                                style={{
                                    position: "absolute",
                                    top: "125%",
                                    right: "0",
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
                                    <i className="bi bi-box-arrow-right"></i>{" "}
                                    SIGN OUT
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* 3. FIXED MENU BAR (Horizontal Tabs) */}
            <div
                className="bg-dark border-bottom border-2 border-dark shadow-sm pt-3"
                style={{
                    paddingBottom: "0",
                    flexShrink: 0,
                }}
            >
                <div className="container-fluid px-4">
                    <ul
                        className="nav nav-tabs border-0 gap-1"
                        style={{
                            flexWrap: "nowrap",
                            overflowX: "auto",
                            overflowY: "hidden",
                            scrollbarWidth: "none",
                        }}
                    >
                        {[
                            {
                                path: "/staff/dashboard",
                                icon: "bi-speedometer2",
                                label: "Dashboard",
                            },
                            {
                                path: "/staff/students",
                                icon: "bi-mortarboard-fill",
                                label: "Student Records",
                            },
                            {
                                path: "/staff/strands",
                                icon: "bi-diagram-3-fill",
                                label: "Strands",
                            },
                            {
                                path: "/staff/sections",
                                icon: "bi-grid-3x3-gap-fill",
                                label: "Sections",
                            },
                            {
                                path: "/staff/subjects",
                                icon: "bi-book-fill",
                                label: "Subjects",
                            },
                            {
                                path: "/staff/reports",
                                icon: "bi-file-earmark-bar-graph-fill",
                                label: "Reports",
                            },
                        ].map((item) => {
                            const active = isActive(item.path);
                            return (
                                <li
                                    className="nav-item"
                                    key={item.path}
                                    style={{ flexShrink: 0 }}
                                >
                                    <Link
                                        to={item.path}
                                        className="nav-link px-4 py-2 fw-bold d-flex align-items-center gap-2 font-monospace text-uppercase small"
                                        style={{
                                            borderRadius: "8px 8px 0 0",
                                            border: "2px solid #000",
                                            borderBottom: active
                                                ? "2px solid #F4D03F"
                                                : "2px solid #000",
                                            backgroundColor: active
                                                ? "#F4D03F"
                                                : "#e9ecef",
                                            color: "#000",
                                            marginBottom: "-2px",
                                            zIndex: active ? 10 : 1,
                                            position: "relative",
                                            top: active ? "0" : "4px",
                                            transition: "top 0.2s",
                                        }}
                                    >
                                        <i
                                            className={`bi ${item.icon} ${active ? "text-dark" : "text-secondary"}`}
                                        ></i>
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {/* 4. SCROLLABLE CONTENT AREA */}
            <div
                className="d-flex flex-column flex-grow-1"
                style={{
                    overflowY: "auto",
                }}
            >
                {/* MAIN CONTENT */}
                <main className="flex-grow-1 p-4">
                    <div className="container-fluid fade-in">
                        <Outlet />
                    </div>
                </main>

                {/* FOOTER */}
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

                        {/* HELP BUTTON FOR STAFF */}
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

            <StaffHelpModal
                show={showHelp}
                onClose={() => setShowHelp(false)}
            />
        </div>
    );
}
