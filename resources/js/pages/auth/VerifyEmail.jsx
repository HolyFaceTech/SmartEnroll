import React, { useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import Toast from "../../utils/toast";
import AuthLayout from "../../layouts/AuthLayout";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!email) {
            Toast.fire({ icon: "error", title: "No email address found." });
            return;
        }

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
                title: "Failed to send verification email.",
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <AuthLayout
            leftTitle="SECURITY FIRST"
            leftSubtitle="Let's make sure it's really you."
            leftImage="/images/verify.svg"
            leftBgColor="#FFD166"
        >
            <div className="text-center py-4 fade-in">
                <img
                    src="/images/logo.png"
                    alt="Logo"
                    width="50"
                    className="d-none d-lg-inline-block me-2 mb-2"
                />
                <h2 className="fw-bold d-inline-block align-middle">
                    Verify Your Email
                </h2>
                <p className="text-muted mb-4">
                    Your account <strong>{email}</strong> is not yet verified.
                    <br />
                    Please check your email inbox for the activation link.
                </p>

                <button
                    onClick={handleResend}
                    className="btn btn-retro w-100 py-3 mb-3 d-flex align-items-center justify-content-center gap-2"
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

                <Link
                    to="/login"
                    className="btn btn-link text-dark fw-bold text-decoration-none"
                >
                    <i className="bi bi-arrow-left"></i> Back to Login
                </Link>
            </div>
        </AuthLayout>
    );
}
