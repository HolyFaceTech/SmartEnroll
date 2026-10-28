import React, { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import TermsModal from "../components/TermsModal";
import StatusCheckModal from "../components/StatusCheckModal";
import PublicConfirmation from "../components/PublicConfirmation";
import Maintenance from "../pages/Maintenance";
import Toast from "../utils/toast";
import Loading from "../utils/Loading";

export default function PublicLayout() {
    const [showTerms, setShowTerms] = useState(false);
    const [searchLrn, setSearchLrn] = useState("");
    const [showStatus, setShowStatus] = useState(false);
    const [statusResult, setStatusResult] = useState(null);
    const [strands, setStrands] = useState([]);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);

    const [activeSection, setActiveSection] = useState("home");

    const [showAnnexConfirm, setShowAnnexConfirm] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    const [showAnnexDropdown, setShowAnnexDropdown] = useState(false);

    useEffect(() => {
        const hasSeenTerms = sessionStorage.getItem("hasSeenTerms");
        if (!hasSeenTerms) {
            setShowTerms(true);
        }
    }, []);

    const handleCloseTerms = () => {
        sessionStorage.setItem("hasSeenTerms", "true");
        setShowTerms(false);
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [settingsRes, strandsRes] = await Promise.all([
                    axios.get("/api/public/settings"),
                    axios.get("/api/public/strands"),
                ]);

                if (
                    settingsRes.data &&
                    settingsRes.data.maintenance_mode == 1
                ) {
                    setIsMaintenance(true);
                }
                setStrands(strandsRes.data || []);
            } catch (error) {
                console.error("Failed to load initial data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const sections = [
                "home",
                "strands",
                "registrar",
                "faq",
                "contacts",
            ];
            let current = "home";

            for (let section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 200) {
                        current = section;
                    }
                }
            }

            if (
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 50
            ) {
                current = "contacts";
            }

            setActiveSection(current);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleQuickSearch = async (e) => {
        e.preventDefault();
        if (searchLrn.length !== 12) {
            return Toast.fire({
                icon: "warning",
                title: "LRN must be exactly 12 digits.",
            });
        }

        setIsCheckingStatus(true);

        try {
            const res = await axios.post("/api/public/check-status", {
                lrn: searchLrn,
            });
            setStatusResult(res.data);
            setShowStatus(true);
        } catch (e) {
            Toast.fire({
                icon: "error",
                title: "LRN not found in the system.",
            });
        } finally {
            setIsCheckingStatus(false);
        }
    };

    const handleCloseStatus = () => {
        setShowStatus(false);
        setStatusResult(null);
        setSearchLrn("");
    };

    const onSearchChange = (e) => {
        setSearchLrn(e.target.value.replace(/\D/g, "").slice(0, 12));
    };

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        Toast.fire({
            icon: "success",
            title: `${type} Copied!`,
        });
    };

    const handleDownloadAnnex = async () => {
        setShowAnnexConfirm(false);
        setIsDownloading(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const response = await axios.get("/annex/DEPED_SHS_Annex_E_F.zip", {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "DEPED_SHS_Annex_E_F.zip");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            Toast.fire({
                icon: "success",
                title: "Download complete!",
            });
        } catch (error) {
            console.error("Download Error:", error);
            Toast.fire({
                icon: "error",
                title: "Failed to download files. Please try again.",
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const mapAddress =
        "Petron Gasoline Station, Block 04 Lot 18 Calavite St, Valentino Subdivision Near, Kasiglahan Village, Rodriguez, Rizal";
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`;

    if (!loading && isMaintenance) {
        return <Maintenance />;
    }

    return (
        <div
            className="d-flex flex-column min-vh-100 font-monospace"
            style={{
                backgroundColor: "#fcfbf4",
                backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
            }}
        >
            <nav
                className="navbar navbar-expand-lg border-bottom border-3 border-dark sticky-top shadow-sm"
                style={{ backgroundColor: "#3F9AAE", zIndex: 1000 }}
            >
                <div className="container py-2">
                    <a
                        href="#home"
                        className="navbar-brand d-flex align-items-center gap-3 text-decoration-none"
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
                                    fontSize: "1.35rem",
                                    letterSpacing: "1px",
                                    textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
                                }}
                            >
                                SmartEnroll
                            </span>
                            <span
                                className="text-white opacity-75 fw-normal"
                                style={{
                                    fontSize: "0.7rem",
                                    letterSpacing: "3px",
                                }}
                            >
                                ENROLLMENT PORTAL
                            </span>
                        </div>
                    </a>

                    <button
                        className="navbar-toggler border-0 bg-transparent text-white"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#publicNavbar"
                        aria-controls="publicNavbar"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <i className="bi bi-list fs-1"></i>
                    </button>

                    <div className="collapse navbar-collapse" id="publicNavbar">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0 fw-bold ms-lg-4 gap-3 align-items-lg-end">
                            <li className="nav-item">
                                <a
                                    href="#home"
                                    className={`nav-link pb-1 ${activeSection === "home" ? "text-warning fw-black border-bottom border-2 border-warning opacity-100" : "text-white opacity-75 fw-bold"}`}
                                >
                                    HOME
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    href="#strands"
                                    className={`nav-link pb-1 ${activeSection === "strands" ? "text-warning fw-black border-bottom border-2 border-warning opacity-100" : "text-white opacity-75 fw-bold"}`}
                                >
                                    STRANDS
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    href="#registrar"
                                    className={`nav-link pb-1 ${activeSection === "registrar" ? "text-warning fw-black border-bottom border-2 border-warning opacity-100" : "text-white opacity-75 fw-bold"}`}
                                >
                                    REGISTRAR
                                </a>
                            </li>

                            <li
                                className="nav-item dropdown"
                                onMouseEnter={() => setShowAnnexDropdown(true)}
                                onMouseLeave={() => setShowAnnexDropdown(false)}
                            >
                                <a
                                    className={`nav-link pb-1 text-white opacity-75 fw-bold dropdown-toggle ${showAnnexDropdown ? "show text-warning opacity-100" : ""}`}
                                    href="#"
                                    role="button"
                                    aria-expanded={showAnnexDropdown}
                                    onClick={(e) => e.preventDefault()}
                                >
                                    ANNEX
                                </a>
                                <ul
                                    className={`dropdown-menu card-retro border-2 border-dark rounded-0 p-2 shadow ${showAnnexDropdown ? "show" : ""}`}
                                    style={{
                                        minWidth: "300px",
                                        marginTop: "0",
                                        display: showAnnexDropdown
                                            ? "block"
                                            : "none",
                                    }}
                                >
                                    <li>
                                        <button
                                            className="dropdown-item fw-bold text-dark annex-hover-item py-2"
                                            style={{
                                                whiteSpace: "normal",
                                                fontSize: "0.85rem",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => {
                                                setShowAnnexDropdown(false);
                                                setShowAnnexConfirm(true);
                                            }}
                                            disabled={isDownloading}
                                        >
                                            <i
                                                className="bi bi-file-earmark-zip-fill text-danger me-2"
                                                style={{
                                                    transition:
                                                        "color 0.2s ease",
                                                }}
                                            ></i>
                                            DEPED Order no. 011, s. 2026 SHS
                                            Application Form Annex E & F
                                        </button>
                                    </li>
                                </ul>
                            </li>

                            <li className="nav-item">
                                <a
                                    href="#faq"
                                    className={`nav-link pb-1 ${activeSection === "faq" ? "text-warning fw-black border-bottom border-2 border-warning opacity-100" : "text-white opacity-75 fw-bold"}`}
                                >
                                    FAQ
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    href="#contacts"
                                    className={`nav-link pb-1 ${activeSection === "contacts" ? "text-warning fw-black border-bottom border-2 border-warning opacity-100" : "text-white opacity-75 fw-bold"}`}
                                >
                                    CONTACTS
                                </a>
                            </li>
                        </ul>

                        <div className="d-flex flex-column flex-lg-row align-items-lg-end gap-3 mt-3 mt-lg-0">
                            <div className="d-flex flex-column">
                                <span
                                    className="text-white opacity-75 fw-bold mb-1"
                                    style={{
                                        fontSize: "0.65rem",
                                        letterSpacing: "1px",
                                    }}
                                >
                                    CHECK ENROLLMENT STATUS:
                                </span>
                                <form
                                    onSubmit={handleQuickSearch}
                                    className="d-flex align-items-center"
                                >
                                    <div
                                        className="input-group"
                                        style={{
                                            maxWidth: "300px",
                                            width: "260px",
                                        }}
                                    >
                                        <span className="input-group-text bg-white border-dark border-2 border-end-0">
                                            <i className="bi bi-search text-dark"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-dark border-2 border-start-0 ps-2 font-monospace fw-bold"
                                            placeholder="Enter 12-Digit LRN..."
                                            value={searchLrn}
                                            onChange={(e) => {
                                                onSearchChange(e);
                                            }}
                                            disabled={isCheckingStatus}
                                        />
                                    </div>
                                </form>
                            </div>

                            <Link
                                to="/login"
                                className="btn btn-retro btn-press-retro bg-warning text-dark border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                                style={{ height: "42px" }}
                            >
                                <i className="bi bi-shield-lock-fill"></i> LOGIN
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main
                className="flex-grow-1 position-relative"
                style={{ overflowX: "hidden" }}
            >
                <Outlet />
            </main>

            <footer
                id="contacts"
                className="py-5 bg-white border-top border-dark border-3 mt-auto shadow-lg"
            >
                <div className="container">
                    <div className="row g-4">
                        <div className="col-lg-4 col-md-6">
                            <h6 className="fw-black text-uppercase mb-3 d-flex align-items-center gap-2">
                                <i
                                    className="bi bi-building-fill fs-5 text-warning"
                                    style={{ textShadow: "1px 1px 0 #000" }}
                                ></i>
                                Holy Face of Jesus Lyceum of San Jose Inc.
                            </h6>
                            <a
                                href={mapLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-muted small text-decoration-none d-block mb-3 hover-text-primary"
                            >
                                <i className="bi bi-geo-alt-fill text-danger me-1"></i>{" "}
                                {mapAddress}
                            </a>
                            <div className="d-flex gap-3 mt-3">
                                <button
                                    className="btn btn-sm btn-outline-dark rounded-circle"
                                    onClick={() =>
                                        handleCopy(
                                            "mariaelenaschool@gmail.com",
                                            "Email",
                                        )
                                    }
                                    title="Copy Email"
                                >
                                    <i className="bi bi-envelope-fill"></i>
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-dark rounded-circle"
                                    onClick={() =>
                                        handleCopy("09242740388", "Number")
                                    }
                                    title="Copy Phone Number"
                                >
                                    <i className="bi bi-telephone-fill"></i>
                                </button>
                                <a
                                    href="https://www.facebook.com/elena.salazar.459616/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-outline-dark rounded-circle"
                                    title="Visit Facebook Page"
                                >
                                    <i className="bi bi-facebook"></i>
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-5 col-md-6">
                            <h6 className="fw-black text-uppercase mb-3 d-flex align-items-center gap-2">
                                <i
                                    className="bi bi-award-fill fs-5 text-danger"
                                    style={{ textShadow: "1px 1px 0 #000" }}
                                ></i>
                                Academic Strands
                            </h6>
                            <div className="row g-2">
                                {loading ? (
                                    <div className="col-12 small text-muted">
                                        Loading strands...
                                    </div>
                                ) : strands.length > 0 ? (
                                    strands.map((strand) => (
                                        <div
                                            className="col-sm-6"
                                            key={strand.id}
                                        >
                                            <a
                                                href={`https://www.google.com/search?q=${encodeURIComponent(strand.description + " Senior High School")}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-muted small text-decoration-none hover-text-primary d-block"
                                            >
                                                <strong className="text-dark">
                                                    {strand.code}
                                                </strong>{" "}
                                                -{" "}
                                                <span className="fst-italic">
                                                    {strand.description}
                                                </span>
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-12 text-center py-4">
                                        <i
                                            className="bi bi-folder-x text-muted mb-2 d-block"
                                            style={{ fontSize: "3rem" }}
                                        ></i>
                                        <span className="small text-muted fw-bold">
                                            No strands available at the moment.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-12 text-lg-end">
                            <h6 className="fw-black text-uppercase mb-3 d-flex align-items-center justify-content-lg-end gap-2">
                                <i
                                    className="bi bi-shield-lock-fill fs-5 text-info"
                                    style={{ textShadow: "1px 1px 0 #000" }}
                                ></i>
                                Legal & Info
                            </h6>
                            <ul className="list-unstyled small text-muted">
                                <li className="mb-2">
                                    <button
                                        className="btn btn-link text-muted text-decoration-none p-0 fw-bold"
                                        onClick={() => setShowTerms(true)}
                                    >
                                        Privacy Statement
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button
                                        className="btn btn-link text-muted text-decoration-none p-0 fw-bold"
                                        onClick={() => setShowTerms(true)}
                                    >
                                        Terms & Conditions
                                    </button>
                                </li>
                                <li
                                    className="mt-4 fw-black text-dark"
                                    style={{ letterSpacing: "1px" }}
                                >
                                    © {new Date().getFullYear()} SmartEnroll.v2
                                    System
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>

            <TermsModal show={showTerms} handleClose={handleCloseTerms} />

            <StatusCheckModal
                show={showStatus}
                student={statusResult}
                onClose={handleCloseStatus}
            />

            <PublicConfirmation
                show={showAnnexConfirm}
                title="DOWNLOAD ANNEX FILES?"
                message="Are you sure you want to download the DEPED SHS Application Form Annex E & F files?"
                confirmText="YES, DOWNLOAD IT"
                confirmColor="#55efc4"
                iconClass="bi-cloud-arrow-down-fill"
                onCancel={() => setShowAnnexConfirm(false)}
                onConfirm={handleDownloadAnnex}
            />

            <Loading
                show={isDownloading}
                message="DOWNLOADING ANNEX FILES..."
            />

            <Loading show={isCheckingStatus} message="SEARCHING RECORD..." />
        </div>
    );
}
