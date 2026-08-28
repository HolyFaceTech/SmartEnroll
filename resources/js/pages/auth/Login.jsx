import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import TermsModal from "../../components/TermsModal";
import AuthHelpModal from "../../components/AuthHelpModal";
import Toast from "../../utils/toast";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const recaptchaRef = useRef();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        const userStr =
            localStorage.getItem("user") || sessionStorage.getItem("user");

        if (token && userStr) {
            const user = JSON.parse(userStr);
            if (user.role === "admin") return navigate("/admin/dashboard");
            if (user.role === "head") return navigate("/head/dashboard");
            if (user.role === "staff") return navigate("/staff/dashboard");
        }

        const status = searchParams.get("status");
        const verificationNeeded = searchParams.get("needs_verification");
        const emailParam = searchParams.get("email");

        if (status === "verified")
            Toast.fire({
                icon: "success",
                title: "Email successfully verified! You may now login.",
                timer: 5000,
            });
        else if (status === "already_verified")
            Toast.fire({
                icon: "info",
                title: "Email is already verified. Login to continue.",
            });
        else if (status === "invalid")
            Toast.fire({
                icon: "error",
                title: "Invalid or expired verification link.",
            });

        if (verificationNeeded === "1" && emailParam) {
            navigate(`/verify-email?email=${emailParam}`);
        }
    }, [searchParams, navigate]);

    const handleLogin = async (e) => {
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
            await axios.get("/sanctum/csrf-cookie");
            const response = await axios.post("/api/login", {
                email,
                password,
                recaptcha_token: token,
            });

            if (response.status === 200) {
                if (remember) {
                    localStorage.setItem("token", response.data.access_token);
                    localStorage.setItem(
                        "user",
                        JSON.stringify(response.data.user),
                    );
                } else {
                    sessionStorage.setItem("token", response.data.access_token);
                    sessionStorage.setItem(
                        "user",
                        JSON.stringify(response.data.user),
                    );
                }

                Toast.fire({ icon: "success", title: "Login successful!" });

                const role = response.data.role;

                setTimeout(() => {
                    if (role === "admin")
                        window.location.href = "/admin/dashboard";
                    else if (role === "head")
                        window.location.href = "/head/dashboard";
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
            if (
                error.response?.status === 403 &&
                error.response?.data?.needs_verification
            ) {
                navigate(`/verify-email?email=${email}`);
            } else {
                Toast.fire({
                    icon: "error",
                    title:
                        error.response?.data?.message || "Invalid credentials.",
                });
                if (recaptchaRef.current) recaptchaRef.current.reset();
            }
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
                <img
                    src="/images/logo.png"
                    alt="Logo"
                    width="50"
                    className="d-none d-md-inline-block me-2 mb-2"
                />
                <h2
                    className="fw-bold d-inline-block align-middle font-monospace"
                    style={{ color: "#F96E5B" }}
                >
                    Sign In
                </h2>
                <p className="text-muted small font-monospace">
                    Please enter your credentials to access your account.
                </p>
            </div>

            <form onSubmit={handleLogin}>
                <div className="mb-3">
                    <label className="fw-bold small mb-1 font-monospace">
                        <i className="bi bi-envelope-fill me-1"></i> EMAIL
                        ADDRESS<span className="text-danger">*</span>
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

                <div className="mb-3">
                    <label className="fw-bold small mb-1 font-monospace">
                        <i className="bi bi-lock-fill me-1"></i> PASSWORD
                        <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-control pe-5"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            disabled={isLoading}
                        />
                        <span
                            className="position-absolute d-flex align-items-center h-100"
                            style={{
                                right: "15px",
                                top: "0",
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
                            className="form-check-label small fw-bold font-monospace"
                            htmlFor="rememberMe"
                        >
                            Remember me
                        </label>
                    </div>
                    <Link
                        to="/forgot-password"
                        style={{ color: "#F96E5B", fontWeight: "bold" }}
                        className="font-monospace text-decoration-none"
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
                    className="btn btn-retro w-100 py-3 mb-3 d-flex align-items-center justify-content-center gap-2 font-monospace fw-bold"
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

            <div className="text-center mt-3 d-flex flex-column align-items-center gap-2 font-monospace">
                <div className="d-flex gap-3">
                    <button
                        className="btn btn-link text-dark text-decoration-none small fw-bold p-0"
                        onClick={() => setShowTerms(true)}
                        disabled={isLoading}
                    >
                        <i className="bi bi-file-earmark-text-fill"></i> Terms &
                        Policy
                    </button>
                    <span className="text-muted small">|</span>
                    <button
                        className="btn btn-link text-primary text-decoration-none small fw-black p-0 d-flex align-items-center gap-1"
                        onClick={() => setShowHelp(true)}
                        disabled={isLoading}
                    >
                        <i className="bi bi-question-circle-fill"></i> Help
                    </button>
                </div>
                <p className="small text-muted mt-1 mb-0">
                    © {new Date().getFullYear()} SmartEnroll.v2 System
                </p>
            </div>

            <TermsModal
                show={showTerms}
                handleClose={() => setShowTerms(false)}
            />
            <AuthHelpModal show={showHelp} onClose={() => setShowHelp(false)} />
        </div>
    );
}
