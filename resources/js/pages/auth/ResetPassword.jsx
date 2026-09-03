import React, { useState } from "react";
import axios from "axios";
import {
    useNavigate,
    useSearchParams,
    useParams,
    Link,
} from "react-router-dom";
import Toast from "../../utils/toast";
import Loading from "../../utils/Loading";

export default function ResetPassword() {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [email] = useState(searchParams.get("email") || "");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [passwordStrength, setPasswordStrength] = useState({
        text: "",
        color: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const evaluatePassword = (pass) => {
        setPassword(pass);
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasNumber = /[0-9]/.test(pass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
        const isLong = pass.length >= 8;

        const rulesMet = [
            hasUpper,
            hasLower,
            hasNumber,
            hasSpecial,
            isLong,
        ].filter(Boolean).length;

        if (rulesMet <= 2)
            setPasswordStrength({ text: "Weak", color: "text-danger" });
        else if (rulesMet <= 4)
            setPasswordStrength({ text: "Fair", color: "text-warning" });
        else setPasswordStrength({ text: "Strong", color: "text-success" });
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post("/api/reset-password", {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });

            if (response.status === 200) {
                const { token, user, role, verified } = response.data;
                if (verified && token) {
                    localStorage.setItem("token", token);
                    localStorage.setItem("user", JSON.stringify(user));
                    axios.defaults.headers.common["Authorization"] =
                        `Bearer ${token}`;

                    Toast.fire({
                        icon: "success",
                        title: "Password updated! Entering Dashboard...",
                        timer: 2000,
                    });
                    setTimeout(() => {
                        if (role === "admin")
                            window.location.href = "/admin/dashboard";
                        else if (role === "head")
                            window.location.href = "/head/dashboard";
                        else if (role === "staff")
                            window.location.href = "/staff/dashboard";
                        else window.location.href = "/login";
                    }, 2000);
                } else {
                    Toast.fire({
                        icon: "warning",
                        title: "Password updated. Please verify email first.",
                    });
                    setTimeout(
                        () => navigate(`/verify-email?email=${email}`),
                        2000,
                    );
                }
            }
        } catch (error) {
            Toast.fire({
                icon: "error",
                title:
                    error.response?.data?.message ||
                    "Failed to reset password.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Loading show={isLoading} message="UPDATING PASSWORD..." />

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
                            className="fw-bold d-inline-block align-middle font-monospace text-uppercase"
                            style={{ color: "#F96E5B" }}
                        >
                            SET NEW PASSWORD
                        </h3>
                    </div>
                    <p className="text-muted small font-monospace">
                        Please enter your new password below.
                    </p>
                </div>

                <form onSubmit={handleReset}>
                    <div className="mb-3">
                        <label className="fw-bold small mb-1 font-monospace">
                            <i className="bi bi-envelope-fill me-1"></i> EMAIL
                            ADDRESS
                        </label>
                        <input
                            type="email"
                            className="form-control bg-light fw-bold"
                            value={email}
                            readOnly
                            disabled
                        />
                    </div>

                    <div className="mb-2">
                        <label className="fw-bold small mb-1 font-monospace d-flex justify-content-between">
                            <span>
                                <i className="bi bi-lock-fill me-1"></i> NEW
                                PASSWORD <span className="text-danger">*</span>
                            </span>
                            {password && (
                                <span
                                    className={`small fw-bold ${passwordStrength.color}`}
                                >
                                    {passwordStrength.text}
                                </span>
                            )}
                        </label>
                        <div className="position-relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control pe-5"
                                value={password}
                                onChange={(e) =>
                                    evaluatePassword(e.target.value)
                                }
                                placeholder="Create new password"
                                required
                                minLength="8"
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
                    <small
                        className="d-block text-muted mb-3 font-monospace"
                        style={{ fontSize: "0.75rem" }}
                    >
                        Must contain at least 8 chars, 1 uppercase, 1 lowercase,
                        1 number, and 1 special character.
                    </small>

                    <div className="mb-4">
                        <label className="fw-bold small mb-1 font-monospace">
                            <i className="bi bi-lock-fill me-1"></i> CONFIRM
                            PASSWORD <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                className="form-control pe-5"
                                value={passwordConfirmation}
                                onChange={(e) =>
                                    setPasswordConfirmation(e.target.value)
                                }
                                placeholder="Repeat new password"
                                required
                                minLength="8"
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
                                    !isLoading && setShowConfirm(!showConfirm)
                                }
                            >
                                <i
                                    className={`bi ${showConfirm ? "bi-eye-slash-fill" : "bi-eye-fill"} fs-5`}
                                ></i>
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-retro w-100 py-3 mt-2 font-monospace fw-bold"
                        disabled={isLoading}
                    >
                        UPDATE PASSWORD
                    </button>
                </form>

                <p className="text-center small text-muted mt-4 font-monospace">
                    © {new Date().getFullYear()} SmartEnroll.v2 System
                </p>
            </div>
        </>
    );
}
