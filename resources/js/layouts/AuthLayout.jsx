import React, { useState } from "react";
import TermsModal from "../components/TermsModal";
import AuthHelpModal from "../components/AuthHelpModal";

export default function AuthLayout({
    children,
    leftTitle,
    leftSubtitle,
    leftImage,
    leftBgColor = "transparent",
}) {
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    return (
        <div className="split-layout">
            <div
                className="split-left d-none d-lg-block"
                style={{ backgroundColor: leftBgColor }}
            >
                <div className="d-flex flex-column justify-content-center align-items-center text-center h-100 p-5 text-dark">
                    <h1
                        className="display-4 fw-bold mb-3 text-uppercase"
                        style={{ textShadow: "2px 2px 0 #fff" }}
                    >
                        {leftTitle}
                    </h1>
                    <p className="lead fw-bold mb-4">{leftSubtitle}</p>
                    {leftImage && (
                        <img
                            src={leftImage}
                            alt="Auth Illustration"
                            className="img-fluid mt-4"
                            style={{
                                maxWidth: "60%",
                                filter: "drop-shadow(4px 4px 0 #000)",
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="split-right w-100">
                <div
                    className="auth-form-container mx-auto"
                    style={{ maxWidth: "450px" }}
                >
                    <div className="text-center mb-4 d-lg-none">
                        <img src="/images/logo.png" alt="Logo" width="80" />
                    </div>

                    {children}

                    <div className="text-center mt-4 d-flex flex-column align-items-center gap-2">
                        <div className="d-flex gap-3">
                            <button
                                type="button"
                                className="btn btn-link text-dark text-decoration-none small fw-bold p-0"
                                onClick={() => setShowTerms(true)}
                            >
                                Terms & Policy
                            </button>
                            <span className="text-muted small">|</span>
                            <button
                                type="button"
                                className="btn btn-link text-primary text-decoration-none small fw-bold p-0 d-flex align-items-center gap-1"
                                onClick={() => setShowHelp(true)}
                            >
                                <i className="bi bi-question-circle-fill"></i>{" "}
                                Help
                            </button>
                        </div>
                        <p className="small text-muted mt-1 mb-0">
                            © {new Date().getFullYear()} SmartEnroll v2
                        </p>
                    </div>
                </div>
            </div>

            <TermsModal
                show={showTerms}
                handleClose={() => setShowTerms(false)}
            />
            <AuthHelpModal show={showHelp} onClose={() => setShowHelp(false)} />
        </div>
    );
}
