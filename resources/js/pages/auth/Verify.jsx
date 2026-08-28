import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Toast from "../../utils/toast";

export default function Verify() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get("email") || "";
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!email)
            return Toast.fire({ icon: "error", title: "No email provided." });
        setIsResending(true);
        try {
            await axios.post("/api/email/resend", { email });
            Toast.fire({
                icon: "success",
                title: "Verification link sent! Check your inbox.",
            });
        } catch (error) {
            Toast.fire({
                icon: "error",
                title:
                    error.response?.data?.message ||
                    "Failed to send verification email.",
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div
            className="auth-form-container card-retro p-4 bg-white fade-in w-100"
            style={{ maxWidth: "450px" }}
        >
            <div className="text-center py-4">
                <div className="mb-4 text-warning">
                    <i
                        className="bi bi-envelope-exclamation-fill"
                        style={{ fontSize: "4rem" }}
                    ></i>
                </div>
                <h3
                    className="fw-bold mb-3 font-monospace"
                    style={{ color: "#3F9AAE" }}
                >
                    Verify Your Email
                </h3>
                <p className="text-muted mb-4 font-monospace">
                    Your account <strong>{email}</strong> is not yet verified.
                    <br />
                    Please check your email inbox.
                </p>

                <button
                    onClick={handleResend}
                    className="btn btn-retro w-100 py-3 mb-3 d-flex align-items-center justify-content-center gap-2 font-monospace fw-bold"
                    disabled={isResending}
                >
                    {isResending ? (
                        <>
                            <i className="bi bi-mortarboard-fill fs-5 toga-spin"></i>
                            <span>SENDING...</span>
                        </>
                    ) : (
                        <span>RESEND VERIFICATION LINK</span>
                    )}
                </button>

                <button
                    onClick={() => navigate("/login")}
                    className="btn btn-link text-dark fw-bold text-decoration-none font-monospace"
                >
                    <i className="bi bi-arrow-left"></i> Back to Login
                </button>
            </div>

            <p className="text-center small text-muted font-monospace">
                © {new Date().getFullYear()} SmartEnroll.v2 System
            </p>
        </div>
    );
}
