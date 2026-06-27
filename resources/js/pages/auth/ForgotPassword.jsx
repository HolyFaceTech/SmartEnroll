import React, { useState, useRef } from "react";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";
import { Link } from "react-router-dom";
import Toast from "../../utils/toast";
import AuthLayout from "../../layouts/AuthLayout";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const recaptchaRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = recaptchaRef.current.getValue();
        if (!token) {
            Toast.fire({
                icon: "warning",
                title: "Please verify that you are not a robot.",
            });
            return;
        }

        setIsLoading(true);
        try {
            await axios.post("/api/forgot-password", {
                email,
                recaptcha_token: token,
            });
            Toast.fire({
                icon: "success",
                title: "Reset link has been sent to your email!",
            });
            setEmail("");
            recaptchaRef.current.reset();
        } catch (error) {
            let errorMessage =
                error.response?.data?.message ||
                Object.values(error.response?.data?.errors || {})
                    .flat()
                    .join(" ") ||
                "Something went wrong.";
            Toast.fire({ icon: "error", title: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            leftTitle="ACCOUNT RECOVERY"
            leftSubtitle="Don't worry, we got you covered."
            leftImage="/images/forgot.svg"
            leftBgColor="#79C9C5"
        >
            <div className="mb-4">
                <Link
                    to="/login"
                    className="btn btn-sm btn-outline-dark rounded-0 mb-3"
                >
                    <i className="bi bi-arrow-left"></i> Back to Login
                </Link>
                <div className="mt-2">
                    <img
                        src="/images/logo.png"
                        alt="Logo"
                        width="50"
                        className="d-none d-lg-inline-block me-2 mb-2"
                    />
                    <h3
                        className="fw-bold d-inline-block align-middle"
                        style={{ color: "#F96E5B" }}
                    >
                        Forgot Password?
                    </h3>
                </div>
                <p className="text-muted small">
                    Enter your registered email address and we'll send you a
                    link to reset your password.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="fw-bold small mb-1">
                        REGISTERED EMAIL
                    </label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ex. juan.delacruz@student.com"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="mb-4 d-flex justify-content-center">
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-retro w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <i className="bi bi-mortarboard-fill fs-5 toga-spin"></i>
                            <span>SENDING...</span>
                        </>
                    ) : (
                        <span>SEND RESET LINK</span>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
}
