import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import Toast from "../../utils/toast";
import AuthLayout from "../../layouts/AuthLayout";

export default function ResetPassword() {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [email] = useState(searchParams.get("email") || "");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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
                        if (role === "super_admin")
                            window.location.href = "/super-admin/dashboard";
                        else if (role === "admin")
                            window.location.href = "/admin/dashboard";
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
            let errorMessage =
                error.response?.data?.message ||
                Object.values(error.response?.data?.errors || {})
                    .flat()
                    .join(" ") ||
                "Failed to reset password.";
            Toast.fire({ icon: "error", title: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            leftTitle="SECURE YOUR ACCOUNT"
            leftSubtitle="Create a strong password."
            leftImage="/images/reset.svg"
            leftBgColor="#F96E5B"
        >
            <div className="mb-4">
                <img
                    src="/images/logo.png"
                    alt="Logo"
                    width="50"
                    className="d-none d-lg-inline-block me-2 mb-2"
                />
                <h3
                    className="fw-bold d-inline-block align-middle font-monospace text-uppercase"
                    style={{ color: "#3F9AAE" }}
                >
                    SET NEW PASSWORD
                </h3>
                <p className="text-muted small font-monospace">
                    Please enter your new password below.
                </p>
            </div>

            <form onSubmit={handleReset}>
                <div className="mb-3">
                    <label className="fw-bold small mb-1 font-monospace">
                        EMAIL ADDRESS
                    </label>
                    <input
                        type="email"
                        className="form-control bg-light"
                        value={email}
                        readOnly
                        disabled
                        style={{ cursor: "not-allowed" }}
                    />
                </div>
                <div className="mb-3 position-relative">
                    <label className="fw-bold small mb-1 font-monospace">
                        NEW PASSWORD
                    </label>
                    <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create new password"
                        required
                        minLength="8"
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

                    <div
                        className="text-muted mt-2 font-monospace"
                        style={{ fontSize: "11px", lineHeight: "1.4" }}
                    >
                        <strong>Password Requirements:</strong>
                        <ul
                            className="mb-0 ps-3 mt-1"
                            style={{ listStyleType: "square" }}
                        >
                            <li>At least 8 characters long</li>
                            <li>1 Uppercase & 1 Lowercase letter</li>
                            <li>At least 1 Number</li>
                            <li>
                                At least 1 Special Character (e.g., @, #, $, !)
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mb-4 position-relative">
                    <label className="fw-bold small mb-1 font-monospace">
                        CONFIRM PASSWORD
                    </label>
                    <input
                        type={showConfirm ? "text" : "password"}
                        className="form-control"
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
                        className="position-absolute"
                        style={{
                            right: "15px",
                            top: "38px",
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
                <button
                    type="submit"
                    className="btn btn-retro w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <i className="bi bi-mortarboard-fill fs-5 toga-spin"></i>
                            <span>PROCESSING...</span>
                        </>
                    ) : (
                        <span>UPDATE PASSWORD</span>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
}
