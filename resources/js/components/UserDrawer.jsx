import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";

export default function UserDrawer({
    show,
    type,
    selectedUser,
    onClose,
    onSuccess,
    apiPrefix = "/api",
}) {
    const initialForm = {
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
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
            let computedAge = "";
            if (selectedUser.birthday) {
                const bdate = new Date(selectedUser.birthday);
                const today = new Date();
                computedAge = today.getFullYear() - bdate.getFullYear();
                const m = today.getMonth() - bdate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < bdate.getDate())) {
                    computedAge--;
                }
            }
            setFormData({
                ...initialForm,
                ...selectedUser,
                age: computedAge.toString(),
                password: "",
            });
        } else {
            setFormData(initialForm);
        }
        setShowPassword(false);
    }, [type, selectedUser, show]);

    const handleBirthdayChange = (e) => {
        const bday = e.target.value;
        if (bday) {
            const birthDate = new Date(bday);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            setFormData({ ...formData, birthday: bday, age: age.toString() });
        } else {
            setFormData({ ...formData, birthday: "", age: "" });
        }
    };

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = { ...formData };
        delete payload.age;

        try {
            if (type === "create") {
                await axios.post(`${apiPrefix}/users`, payload);
                Toast.fire({
                    icon: "success",
                    title: "User Created Successfully!",
                });
            } else {
                await axios.put(
                    `${apiPrefix}/users/${selectedUser.id}`,
                    payload,
                );
                Toast.fire({
                    icon: "success",
                    title: "User Updated Successfully!",
                });
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            let msg = "Action Failed";
            if (error.response && error.response.status === 422) {
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
    const isFormDisabled = isReadOnly || isLoading;

    const calculatePasswordStrength = (password) => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        return score;
    };

    const passwordScore = calculatePasswordStrength(formData.password);

    const strengthConfig = {
        0: { label: "", color: "transparent", width: "0%" },
        1: { label: "Very Weak", color: "#dc3545", width: "20%" },
        2: { label: "Weak", color: "#fd7e14", width: "40%" },
        3: { label: "Fair", color: "#ffc107", width: "60%" },
        4: { label: "Good", color: "#0d6efd", width: "80%" },
        5: { label: "Strong", color: "#198754", width: "100%" },
    };

    const currentStrength = strengthConfig[passwordScore];

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
                    width: "500px",
                    borderLeft: "2px solid black",
                }}
            >
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
                        disabled={isFormDisabled}
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
                        <div className="card-retro p-3 bg-retro-bg">
                            <h6 className="fw-bold mb-3 pb-2 border-bottom border-dark font-monospace">
                                <i className="bi bi-person-lines-fill me-2"></i>
                                PERSONAL INFORMATION
                            </h6>

                            <div className="mb-3">
                                <label className="form-label small fw-bold font-monospace">
                                    FIRST NAME
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    className="form-control"
                                    placeholder="e.g. Juan Pedro"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    required
                                    disabled={isFormDisabled}
                                />
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold font-monospace">
                                        MIDDLE NAME
                                    </label>
                                    <input
                                        type="text"
                                        name="middle_name"
                                        className="form-control"
                                        placeholder="e.g. Doe"
                                        value={formData.middle_name}
                                        onChange={handleChange}
                                        disabled={isFormDisabled}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold font-monospace">
                                        LAST NAME
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        className="form-control"
                                        placeholder="e.g. Cruz"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                        disabled={isFormDisabled}
                                    />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold font-monospace">
                                        SUFFIX
                                    </label>
                                    <input
                                        type="text"
                                        name="suffix"
                                        className="form-control"
                                        placeholder="e.g. Jr, II"
                                        value={formData.suffix}
                                        onChange={handleChange}
                                        disabled={isFormDisabled}
                                    />
                                </div>
                                <div className="col-md-5">
                                    <label className="form-label small fw-bold font-monospace">
                                        BIRTHDAY
                                    </label>
                                    <input
                                        type="date"
                                        name="birthday"
                                        className="form-control"
                                        value={formData.birthday}
                                        onChange={handleBirthdayChange}
                                        disabled={isFormDisabled}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold font-monospace">
                                        AGE
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control bg-light text-center fw-bold"
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
                                    disabled={isFormDisabled}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>

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
                                    disabled={isFormDisabled}
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
                                    placeholder="09**-***-****"
                                    value={formData.contact_number}
                                    onChange={handleChange}
                                    disabled={isFormDisabled}
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
                                        disabled={isFormDisabled}
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">
                                            Super Admin
                                        </option>
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
                                        disabled={isFormDisabled}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {!isReadOnly && (
                                <div className="mb-2">
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
                                            disabled={isFormDisabled}
                                        />
                                        <button
                                            className="btn border-2 border-dark border-start-0"
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            disabled={isFormDisabled}
                                        >
                                            <i
                                                className={`bi bi-eye${showPassword ? "-slash" : ""}`}
                                            ></i>
                                        </button>
                                    </div>

                                    {formData.password.length > 0 && (
                                        <div className="mt-2">
                                            <div
                                                className="progress border border-dark rounded-0"
                                                style={{ height: "6px" }}
                                            >
                                                <div
                                                    className="progress-bar"
                                                    role="progressbar"
                                                    style={{
                                                        width: currentStrength.width,
                                                        backgroundColor:
                                                            currentStrength.color,
                                                        transition:
                                                            "width 0.3s ease, background-color 0.3s ease",
                                                    }}
                                                ></div>
                                            </div>
                                            <div
                                                className="text-end mt-1 font-monospace"
                                                style={{
                                                    fontSize: "11px",
                                                    color: currentStrength.color,
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {currentStrength.label}
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        className="text-muted mt-2 font-monospace"
                                        style={{
                                            fontSize: "11px",
                                            lineHeight: "1.4",
                                        }}
                                    >
                                        <strong>Password Requirements:</strong>
                                        <ul
                                            className="mb-0 ps-3 mt-1"
                                            style={{ listStyleType: "square" }}
                                        >
                                            <li>At least 8 characters long</li>
                                            <li>
                                                1 Uppercase & 1 Lowercase letter
                                            </li>
                                            <li>At least 1 Number</li>
                                            <li>
                                                At least 1 Special Character
                                                (e.g., @, #, $, !)
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="d-flex justify-content-center gap-2 mt-1">
                            <button
                                type="submit"
                                className="btn btn-retro px-4 py-2 fw-bold d-flex align-items-center justify-content-center border-dark"
                                style={
                                    type === "edit"
                                        ? { backgroundColor: "#F4D03F" }
                                        : {}
                                }
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="bi bi-mortarboard-fill me-2 toga-spin"></i>
                                        <span>PROCESSING...</span>
                                    </>
                                ) : type === "create" ? (
                                    <>
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        <span>SUBMIT</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-floppy-fill me-2"></i>
                                        <span>SAVE CHANGES</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="btn btn-retro bg-dark text-white px-4 py-2 fw-bold d-flex align-items-center justify-content-center border-dark"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                <span>CANCEL</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
