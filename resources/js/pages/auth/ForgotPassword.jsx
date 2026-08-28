import React, { useState, useRef } from "react";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";
import { Link } from "react-router-dom";
import Toast from "../../utils/toast";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const recaptchaRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = recaptchaRef.current
            ? recaptchaRef.current.getValue()
            : null;
        if (!token) {
            return Toast.fire({
                icon: "warning",
                title: "Please verify that you are not a robot.",
            });
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
            if (recaptchaRef.current) recaptchaRef.current.reset();
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: error.response?.data?.message || "Something went wrong.",
            });
            if (recaptchaRef.current) recaptchaRef.current.reset();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="auth-form-container card-retro p-4 bg-white fade-in w-100"
            style={{ maxWidth: "450px" }}
        >
            <div className="text-center mb-4 d-md-none">
                <img src="/images/logo.png" alt="Logo" width="60" />
            </div>

            <div className="mb-4">
                <Link
                    to="/login"
                    className="btn btn-sm btn-outline-dark rounded-0 mb-3 font-monospace fw-bold"
                >
                    <i className="bi bi-arrow-left"></i> Back to Login
                </Link>
                <div className="mt-2">
                    <img
                        src="/images/logo.png"
                        alt="Logo"
                        width="50"
                        className="d-none d-md-inline-block me-2 mb-2"
                    />
                    <h3
                        className="fw-bold d-inline-block align-middle font-monospace"
                        style={{ color: "#F96E5B" }}
                    >
                        Forgot Password?
                    </h3>
                </div>
                <p className="text-muted small font-monospace">
                    Enter your registered email address and we'll send you a
                    link to reset your password.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="fw-bold small mb-1 font-monospace">
                        <i className="bi bi-envelope-fill me-1"></i> REGISTERED
                        EMAIL<span className="text-danger">*</span>
                    </label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ex. juansantos@gmail.com"
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
                    className="btn btn-retro w-100 py-3 d-flex align-items-center justify-content-center gap-2 font-monospace fw-bold"
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

            <p className="text-center small text-muted mt-4 font-monospace">
                © {new Date().getFullYear()} SmartEnroll.v2 System
            </p>
        </div>
    );
}
