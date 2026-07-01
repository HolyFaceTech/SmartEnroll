import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Toast from "../utils/toast";
import TermsModal from "../components/TermsModal";
import AdminHelpModal from "../components/AdminHelpModal";

export default function SuperAdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [user, setUser] = useState({
        name: "Super Admin",
        last_name: "Admin",
        suffix: "jr",
        gender: "Male",
        email: "super.admin@smartenroll.com",
    });

    const [currentTerm, setCurrentTerm] = useState({
        school_year: "Loading...",
        term: "Loading...",
    });

    const fetchSettings = async () => {
        try {
            const res = await axios.get("/api/settings");
            if (res.data) {
                setCurrentTerm({
                    school_year: res.data.school_year || "-",
                    term: res.data.term || "-",
                });
            }
        } catch (error) {
            setCurrentTerm({ school_year: "-", term: "-" });
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchSettings();

        const handleResize = () => {
            const isSmallScreen = window.innerWidth < 992;
            setIsMobile(isSmallScreen);

            if (isSmallScreen) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post("/api/logout");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            Toast.fire({ icon: "success", title: "Logged out successfully" });
            navigate("/login");
        } catch (error) {
            localStorage.removeItem("token");
            navigate("/login");
        }
    };

    const isActive = (path) =>
        location.pathname.startsWith(path) ? "active" : "";

    const prefix = user.gender?.toLowerCase() === "female" ? "Ma'am." : "Sir.";
    const displayName = user.last_name
        ? `${user.last_name}${user.suffix ? ` ${user.suffix}` : ""}`
        : user.name;

    return (
        <div
            className="d-flex position-relative"
            style={{
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "var(--color-bg)",
            }}
        >
            {isMobile && isSidebarOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
                    style={{ opacity: 0.5, zIndex: 1040 }}
                    onClick={() => {
                        setIsSidebarOpen(false);
                        setIsDropdownOpen(false);
                    }}
                ></div>
            )}

            {/* SIDEBAR LOGIC */}
            <div
                className="d-flex flex-column flex-shrink-0 p-3 sidebar-retro text-white"
                style={{
                    width: isMobile
                        ? "280px"
                        : isSidebarOpen
                          ? "280px"
                          : "90px",
                    position: isMobile ? "fixed" : "relative",
                    transform: isMobile
                        ? isSidebarOpen
                            ? "translateX(0)"
                            : "translateX(-100%)"
                        : "none",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    height: "100vh",
                    zIndex: 1050,
                    top: 0,
                    left: 0,
                    boxShadow:
                        isMobile && isSidebarOpen
                            ? "4px 0 15px rgba(0,0,0,0.5)"
                            : "none",
                }}
            >
                <div
                    className={`d-flex align-items-center mb-4 text-white text-decoration-none ${!isSidebarOpen && !isMobile ? "justify-content-center" : ""}`}
                    style={{ height: "60px", flexShrink: 0 }}
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
                        className={`ms-3 fade-in ${!isSidebarOpen && !isMobile ? "d-none" : "d-block"}`}
                        style={{ whiteSpace: "nowrap" }}
                    >
                        <span
                            className="fw-black d-block text-uppercase"
                            style={{
                                textShadow: "2px 2px 0 #000",
                                fontSize: "1.4rem",
                                letterSpacing: "1px",
                            }}
                        >
                            SmartEnroll
                        </span>
                        <span
                            className="d-block text-warning small fw-bold font-monospace mt-1"
                            style={{ fontSize: "0.75rem" }}
                        >
                            <i className="bi bi-shield-lock-fill"></i> SUPER
                            ADMIN PORTAL
                        </span>
                    </div>
                </div>

                <hr className="border-dark opacity-100" />

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
                                path: "/super-admin/dashboard",
                                icon: "bi-speedometer2",
                                label: "Dashboard",
                            },
                            {
                                path: "/super-admin/users",
                                icon: "bi-people-fill",
                                label: "Users",
                            },
                            {
                                path: "/super-admin/students",
                                icon: "bi-mortarboard-fill",
                                label: "Students",
                            },
                            {
                                path: "/super-admin/strands",
                                icon: "bi-diagram-3-fill",
                                label: "Strands",
                            },
                            {
                                path: "/super-admin/sections",
                                icon: "bi-grid-3x3-gap-fill",
                                label: "Sections",
                            },
                            {
                                path: "/super-admin/subjects",
                                icon: "bi-book-fill",
                                label: "Subjects",
                            },
                            {
                                path: "/super-admin/requests",
                                icon: "bi-envelope-paper-fill",
                                label: "Requests",
                            },
                            {
                                path: "/super-admin/statuses",
                                icon: "bi-tags-fill",
                                label: "Statuses",
                            },
                            {
                                path: "/super-admin/maintenances",
                                icon: "bi-cone-striped",
                                label: "Maintenances",
                            },
                            {
                                path: "/super-admin/activity-logs",
                                icon: "bi-clock-history",
                                label: "Activity Logs",
                            },
                            {
                                path: "/super-admin/settings",
                                icon: "bi-gear-fill",
                                label: "Settings",
                            },
                            {
                                path: "/super-admin/reports",
                                icon: "bi-file-earmark-bar-graph-fill",
                                label: "Reports",
                            },
                            {
                                path: "/super-admin/recycle-bin",
                                icon: "bi-trash-fill",
                                label: "Recycle Bin",
                            },
                        ].map((item) => (
                            <li className="nav-item mb-2" key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={() => {
                                        if (isMobile) setIsSidebarOpen(false);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`nav-link nav-link-retro d-flex align-items-center ${isSidebarOpen || isMobile ? "gap-3 px-3" : "justify-content-center px-0"} ${isActive(item.path)}`}
                                    title={
                                        !isSidebarOpen && !isMobile
                                            ? item.label
                                            : ""
                                    }
                                >
                                    <i className={`bi ${item.icon} fs-5`}></i>
                                    {(isSidebarOpen || isMobile) && (
                                        <span>{item.label}</span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <hr className="border-dark opacity-100" />

                <div className="dropdown position-relative flex-shrink-0">
                    <div
                        className={`d-flex align-items-center text-white text-decoration-none cursor-pointer p-2 rounded ${!isSidebarOpen && !isMobile ? "justify-content-center" : ""}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{
                            border: "2px solid #000000",
                            backgroundColor: isDropdownOpen
                                ? "rgba(255,255,255,0.1)"
                                : "transparent",
                            transition: "all 0.1s",
                        }}
                    >
                        <img
                            src={`https://ui-avatars.com/api/?name=${displayName}&background=000000&color=fff&bold=true`}
                            alt="User"
                            width="40"
                            height="40"
                            className="rounded-circle border border-2 border-white flex-shrink-0"
                        />

                        {(isSidebarOpen || isMobile) && (
                            <div
                                className="ms-2 fade-in overflow-hidden"
                                style={{ lineHeight: "1.2" }}
                            >
                                <strong
                                    className="d-block text-truncate font-monospace"
                                    style={{ maxWidth: "150px" }}
                                >
                                    {prefix} {displayName}
                                </strong>
                            </div>
                        )}
                        {(isSidebarOpen || isMobile) && (
                            <i
                                className={`bi bi-chevron-${isDropdownOpen ? "up" : "down"} ms-auto small`}
                            ></i>
                        )}
                    </div>

                    {isDropdownOpen && (
                        <div
                            className="bg-white text-dark rounded p-3 fade-in"
                            style={{
                                position: "absolute",
                                bottom: "120%",
                                left: "0",
                                minWidth: "260px",
                                width: "max-content",
                                maxWidth: "350px",
                                border: "2px solid black",
                                boxShadow: "4px 4px 0px #000",
                                zIndex: 1060,
                            }}
                        >
                            <div className="px-3 py-2 border-bottom border-dark mb-3 bg-retro-bg rounded text-center">
                                <span className="d-block small fw-bold text-muted font-monospace mb-1">
                                    SIGNED IN AS
                                </span>
                                <span
                                    className="d-block fw-bold text-dark font-monospace"
                                    style={{ wordBreak: "break-all" }}
                                >
                                    {user.email}
                                </span>
                            </div>

                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    setShowHelp(true);
                                }}
                                className="btn btn-warning w-100 mb-2 d-flex align-items-center justify-content-center gap-2 fw-bold font-monospace"
                                style={{
                                    border: "2px solid black",
                                    boxShadow: "2px 2px 0 #000",
                                }}
                            >
                                <i className="bi bi-question-circle-fill"></i>{" "}
                                HELP & GUIDE
                            </button>

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

            <div
                className="flex-grow-1 d-flex flex-column"
                style={{ overflowY: "auto", height: "100vh" }}
            >
                <header
                    className="py-3 px-3 px-md-4 bg-white d-flex justify-content-between align-items-center sticky-top"
                    style={{ zIndex: 900, borderBottom: "2px solid black" }}
                >
                    <button
                        className="btn p-0 border-0"
                        onClick={() => {
                            setIsSidebarOpen(!isSidebarOpen);
                            setIsDropdownOpen(false);
                        }}
                    >
                        <i className="bi bi-list fs-1 fw-bold"></i>
                    </button>
                    <div
                        className={`fw-bold d-flex align-items-center gap-2 ${isMobile ? "px-2" : "px-3"} py-1 rounded`}
                        style={{
                            border: "2px solid black",
                            backgroundColor: "var(--color-bg)",
                        }}
                    >
                        <i className="bi bi-calendar-check-fill text-dark"></i>
                        <span
                            style={{
                                fontFamily: "monospace",
                                fontSize: isMobile ? "0.80rem" : "1.1rem",
                            }}
                        >
                            S.Y. {currentTerm.school_year}
                        </span>

                        <span className="mx-1 fw-black text-muted">|</span>

                        <i
                            className="bi bi-bookmark-star-fill text-warning"
                            style={{ textShadow: "1px 1px 0px #000" }}
                        ></i>
                        <span
                            style={{
                                fontFamily: "monospace",
                                fontSize: isMobile ? "0.80rem" : "1.1rem",
                            }}
                        >
                            {currentTerm.term} Term
                        </span>
                    </div>
                </header>

                <main className="p-3 p-md-4 flex-grow-1">
                    <Outlet />
                </main>

                <footer
                    className="py-3 bg-white text-center small mt-auto"
                    style={{ borderTop: "2px solid black" }}
                >
                    <div className="container font-monospace d-flex justify-content-center align-items-center flex-wrap gap-2">
                        <span>© {new Date().getFullYear()} SmartEnroll v2</span>
                        <span className="mx-2">|</span>
                        <button
                            className="btn btn-link text-dark text-decoration-none fw-bold p-0"
                            onClick={() => setShowTerms(true)}
                        >
                            Terms & Policy
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
