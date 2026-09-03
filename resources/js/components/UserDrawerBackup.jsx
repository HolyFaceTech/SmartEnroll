import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast"; // Using Toast

export default function UserDrawer({
    show,
    type,
    selectedUser,
    onClose,
    onSuccess, // Callback para mag-auto refresh ang parent table
    apiPrefix = "/api", // Default Admin API
}) {
    const initialForm = {
        name: "",
        email: "",
        contact_number: "",
        birthday: "",
        age: "",
        gender: "",
        role: "staff",
        status: "active",
        password: "",
    };

    const [formData, setFormData] = useState(initialForm);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if ((type === "edit" || type === "view") && selectedUser) {
            setFormData({ ...selectedUser, password: "" });
        } else {
            setFormData(initialForm);
        }
        setShowPassword(false);
    }, [type, selectedUser, show]);

    const handleBirthdayChange = (e) => {
        const bday = e.target.value;
        if (bday) {
            const age = new Date().getFullYear() - new Date(bday).getFullYear();
            setFormData({ ...formData, birthday: bday, age: age });
        } else {
            setFormData({ ...formData, birthday: "", age: "" });
        }
    };

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    // SMART SUBMIT HANDLER
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (type === "create") {
                await axios.post(`${apiPrefix}/users`, formData);
                Toast.fire({
                    icon: "success",
                    title: "User Created Successfully!",
                });
            } else {
                await axios.put(
                    `${apiPrefix}/users/${selectedUser.id}`,
                    formData,
                );
                Toast.fire({
                    icon: "success",
                    title: "User Updated Successfully!",
                });
            }

            if (onSuccess) onSuccess(); // Refresh parent table
            onClose(); // Close drawer
        } catch (error) {
            // Error is Toast
            let msg = "Action Failed";
            if (error.response && error.response.status === 422) {
                // Combine validation errors into a single string
                msg = Object.values(error.response.data.errors)
                    .flat()
                    .join("\n");
            } else if (error.response?.data?.message) {
                msg = error.response.data.message;
            }

            Toast.fire({ icon: "error", title: msg });
        } finally {
            setIsLoading(false);
        }
    };

    const drawerClass = show
        ? "offcanvas offcanvas-end show"
        : "offcanvas offcanvas-end";
    const backdropClass = show ? "offcanvas-backdrop fade show" : "";
    const isReadOnly = type === "view";

    return (
        <>
            {show && (
                <div
                    className={backdropClass}
                    onClick={onClose}
                    style={{ zIndex: 1045 }}
                ></div>
            )}

            <div
                className={drawerClass}
                style={{
                    zIndex: 1050,
                    visibility: show ? "visible" : "hidden",
                    width: "450px",
                    borderLeft: "2px solid black",
                }}
            >
                {/* HEADER */}
                <div
                    className="offcanvas-header text-white"
                    style={{
                        backgroundColor: "var(--color-primary)",
                        borderBottom: "2px solid black",
                    }}
                >
                    <h5 className="offcanvas-title fw-bold font-monospace">
                        {type === "create" && (
                            <>
                                <i className="bi bi-person-plus-fill me-2"></i>
                                CREATE USER
                            </>
                        )}
                        {type === "edit" && (
                            <>
                                <i className="bi bi-pencil-square me-2"></i>
                                UPDATE USER
                            </>
                        )}
                        {type === "view" && (
                            <>
                                <i className="bi bi-person-vcard me-2"></i>USER
                                DETAILS
                            </>
                        )}
                    </h5>
                    <button
                        type="button"
                        className="btn-close btn-close-white opacity-100"
                        onClick={onClose}
                    ></button>
                </div>

                <div
                    className="offcanvas-body"
                    style={{ backgroundColor: "#fff" }}
                >
                    <form
                        onSubmit={handleSubmit}
                        className="d-flex flex-column gap-4"
                    >
                        {/* PERSONAL INFO CARD */}
                        <div className="card-retro p-3 bg-retro-bg">
                            <h6 className="fw-bold mb-3 pb-2 border-bottom border-dark font-monospace">
                                <i className="bi bi-person-lines-fill me-2"></i>
                                PERSONAL INFORMATION
                            </h6>
                            <div className="mb-3">
                                <label className="form-label small fw-bold font-monospace">
                                    FULL NAME
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    placeholder="e.g. Juan Dela Cruz"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="row">
                                <div className="col-8">
                                    <label className="form-label small fw-bold font-monospace">
                                        BIRTHDAY
                                    </label>
                                    <input
                                        type="date"
                                        name="birthday"
                                        className="form-control"
                                        value={formData.birthday}
                                        onChange={handleBirthdayChange}
                                        required
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="col-4">
                                    <label className="form-label small fw-bold font-monospace">
                                        AGE
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control bg-white"
                                        value={formData.age}
                                        readOnly
                                        placeholder="0"
                                        style={{ cursor: "not-allowed" }}
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="form-label small fw-bold font-monospace">
                                    GENDER
                                </label>
                                <select
                                    name="gender"
                                    className="form-select"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required
                                    disabled={isReadOnly}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>

                        {/* ACCOUNT INFO CARD */}
                        <div className="card-retro p-3 bg-white">
                            <h6 className="fw-bold mb-3 pb-2 border-bottom border-dark font-monospace">
                                <i className="bi bi-shield-lock-fill me-2"></i>
                                ACCOUNT DETAILS
                            </h6>

                            <div className="mb-3">
                                <label className="form-label small fw-bold font-monospace">
                                    EMAIL ADDRESS
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold font-monospace">
                                    CONTACT NUMBER
                                </label>
                                <input
                                    type="text"
                                    name="contact_number"
                                    className="form-control"
                                    placeholder="0912 345 6789"
                                    value={formData.contact_number}
                                    onChange={handleChange}
                                    required
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="row mb-3">
                                <div className="col-6">
                                    <label className="form-label small fw-bold font-monospace">
                                        ROLE
                                    </label>
                                    <select
                                        name="role"
                                        className="form-select"
                                        value={formData.role}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="col-6">
                                    <label className="form-label small fw-bold font-monospace">
                                        STATUS
                                    </label>
                                    <select
                                        name="status"
                                        className={`form-select fw-bold ${formData.status === "active" ? "text-success" : "text-danger"}`}
                                        value={formData.status}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {!isReadOnly && (
                                <div>
                                    <label className="form-label small fw-bold font-monospace">
                                        {type === "edit"
                                            ? "NEW PASSWORD (Optional)"
                                            : "PASSWORD"}
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            className="form-control border-end-0"
                                            placeholder={
                                                type === "edit"
                                                    ? "Leave blank to keep"
                                                    : "Enter password"
                                            }
                                            value={formData.password}
                                            onChange={handleChange}
                                            required={type === "create"}
                                            minLength="8"
                                        />
                                        <button
                                            className="btn btn-outline-secondary border-2 border-dark border-start-0"
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                        >
                                            <i
                                                className={`bi bi-eye${showPassword ? "-slash" : ""}`}
                                            ></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ACTION BUTTONS */}
                        {!isReadOnly && (
                            <button
                                type="submit"
                                className="btn btn-retro py-3 fw-bold w-100 d-flex align-items-center justify-content-center"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="bi bi-mortarboard-fill fs-5 me-2 toga-spin"></i>
                                        <span>PROCESSING...</span>
                                    </>
                                ) : type === "create" ? (
                                    "CREATE ACCOUNT"
                                ) : (
                                    "SAVE CHANGES"
                                )}
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
