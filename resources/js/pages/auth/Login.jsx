import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import Toast from "../../utils/toast";
import AuthLayout from "../../layouts/AuthLayout";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const recaptchaRef = useRef();

    useEffect(() => {
        const status = searchParams.get("status");
        if (status === "verified") {
            Toast.fire({
                icon: "success",
                title: "Email successfully verified! You may now login.",
                timer: 5000,
            });
        } else if (status === "already_verified") {
            Toast.fire({
                icon: "info",
                title: "Email is already verified. Login to continue.",
            });
        } else if (status === "invalid") {
            Toast.fire({
                icon: "error",
                title: "Invalid or expired verification link.",
            });
        }
    }, [searchParams]);

    const handleLogin = async (e) => {
        e.preventDefault();

        const recaptchaToken = recaptchaRef.current.getValue();
        if (!recaptchaToken) {
            Toast.fire({
                icon: "warning",
                title: "Please verify that you are not a robot.",
            });
            return;
        }

        setIsLoading(true);

        try {
            await axios.get("/sanctum/csrf-cookie");
            const response = await axios.post("/api/login", {
                email,
                password,
                remember,
                recaptcha_token: recaptchaToken,
            });

            if (response.status === 200) {
                localStorage.setItem("token", response.data.access_token);
                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user),
                );
                Toast.fire({ icon: "success", title: "Login successful!" });

                const role = response.data.role;
                setTimeout(() => {
                    if (role === "super_admin")
                        window.location.href = "/super-admin/dashboard";
                    else if (role === "admin")
                        window.location.href = "/admin/dashboard";
                    else if (role === "staff")
                        window.location.href = "/staff/dashboard";
                    else
                        Toast.fire({
                            icon: "error",
                            title: "Unauthorized Access.",
                        });
                }, 1000);
            }
        } catch (error) {
            if (recaptchaRef.current) recaptchaRef.current.reset();

            if (
                error.response?.status === 403 &&
                error.response.data.needs_verification
            ) {
                Toast.fire({
                    icon: "warning",
                    title: "Email not verified. Redirecting...",
                });
                navigate(`/verify-email?email=${encodeURIComponent(email)}`);
            } else {
                Toast.fire({
                    icon: "error",
                    title:
                        error.response?.data?.message || "Invalid credentials.",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            leftTitle="SMARTENROLL"
            leftSubtitle="Official HFJLSJI Enrollment System"
            leftImage="/images/login.svg"
            leftBgColor="#3F9AAE"
        >
            <div className="mb-4">
                <img
                    src="/images/logo.png"
                    alt="Logo"
                    width="50"
                    className="d-none d-lg-inline-block me-2 mb-2"
                />
                <h2
                    className="fw-bold d-inline-block align-middle"
                    style={{ color: "#F96E5B" }}
                >
                    Sign In
                </h2>
                <p className="text-muted small">
                    Please enter your credentials to access your account.
                </p>
            </div>

            <form onSubmit={handleLogin}>
                <div className="mb-3">
                    <label className="fw-bold small mb-1">EMAIL ADDRESS</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ex. admin@smartenroll.com"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="mb-3 position-relative">
                    <label className="fw-bold small mb-1">PASSWORD</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                    />
                    <span
                        className="position-absolute"
                        style={{
                            right: "15px",
                            top: "38px",
                            cursor: "pointer",
                            color: "#666",
                        }}
                        onClick={() =>
                            !isLoading && setShowPassword(!showPassword)
                        }
                    >
                        <i
                            className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"} fs-5`}
                        ></i>
                    </span>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input border-dark"
                            id="rememberMe"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            disabled={isLoading}
                        />
                        <label
                            className="form-check-label small fw-bold"
                            htmlFor="rememberMe"
                        >
                            Remember me
                        </label>
                    </div>
                    <Link
                        to="/forgot-password"
                        style={{ color: "#F96E5B", fontWeight: "bold" }}
                    >
                        Forgot Password?
                    </Link>
                </div>

                <div className="mb-4 d-flex justify-content-center">
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-retro w-100 py-3 mb-3 d-flex align-items-center justify-content-center gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <i className="bi bi-mortarboard-fill fs-5 toga-spin"></i>
                            <span>LOGGING IN...</span>
                        </>
                    ) : (
                        <span>ACCESS PORTAL</span>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
}
