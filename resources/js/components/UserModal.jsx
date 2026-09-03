import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";
import UserConfirmation from "./UserConfirmation";
import Loading from "../utils/Loading";

export default function UserModal({
    show,
    type,
    selectedUser,
    onClose,
    onSuccess,
    apiPrefix = "/api",
}) {
    const storedStr =
        localStorage.getItem("user") || sessionStorage.getItem("user");
    const currentUser = storedStr ? JSON.parse(storedStr) : null;
    const isAdmin = currentUser?.role === "admin";

    const initialForm = {
        first_name: "",
        last_name: "",
        middle_name: "",
        suffix: "",
        email: "",
        contact_number: "",
        birthday: "",
        age: "",
        gender: "",
        role: "staff",
        status: "inactive",
        password: "",
    };

    const [formData, setFormData] = useState(initialForm);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pwdStrength, setPwdStrength] = useState("");

    const [confirmConfig, setConfirmConfig] = useState({ show: false });

    const calculateAge = (dob) => {
        if (!dob) return "";
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    useEffect(() => {
        if ((type === "edit" || type === "view") && selectedUser) {
            let formattedBirthday = "";
            if (selectedUser.birthday) {
                if (selectedUser.birthday.includes("T")) {
                    const d = new Date(selectedUser.birthday);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    formattedBirthday = `${year}-${month}-${day}`;
                } else {
                    formattedBirthday = selectedUser.birthday.split(" ")[0];
                }
            }

            const computedAge = calculateAge(formattedBirthday);

            setFormData({
                ...initialForm,
                ...selectedUser,
                birthday: formattedBirthday,
                age: computedAge,
                password: "",
            });
        } else {
            setFormData(initialForm);
        }
        setShowPassword(false);
        setPwdStrength("");
    }, [type, selectedUser, show]);

    const checkPasswordStrength = (pwd) => {
        if (!pwd) {
            setPwdStrength("");
            return;
        }
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 2) setPwdStrength("Weak");
        else if (score <= 4) setPwdStrength("Good");
        else setPwdStrength("Strong");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "birthday") {
            setFormData({
                ...formData,
                birthday: value,
                age: calculateAge(value),
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }

        if (name === "password") checkPasswordStrength(value);
    };

    const handleAutoGenerate = () => {
        const all =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
        let generated = "A" + "a" + "1" + "!";
        for (let i = 0; i < 8; i++)
            generated += all[Math.floor(Math.random() * all.length)];
        generated = generated
            .split("")
            .sort(() => 0.5 - Math.random())
            .join("");

        setFormData({ ...formData, password: generated });
        checkPasswordStrength(generated);
        setShowPassword(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const actionName = type === "create" ? "CREATE" : "UPDATE";

        const btnColor = type === "create" ? "#3F9AAE" : "#F4D03F";
        const icon =
            type === "create" ? "bi-person-plus-fill" : "bi-pencil-square";

        const fullName =
            `${formData.first_name || ""} ${formData.middle_name ? formData.middle_name[0] + "." : ""} ${formData.last_name || ""} ${formData.suffix || ""}`.trim();

        const messageContent =
            type === "create" ? (
                "Are you sure you want to create this new user account?"
            ) : (
                <>
                    Are you sure you want to update the records of <br />{" "}
                    <strong>{fullName}</strong>?
                </>
            );

        setConfirmConfig({
            show: true,
            title: `CONFIRM ${actionName}?`,
            message: messageContent,
            confirmText: `YES, ${actionName}`,
            confirmColor: btnColor,
            iconClass: icon,
        });
    };

    const executeSubmit = async () => {
        setConfirmConfig({ show: false });
        setIsLoading(true);

        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (type === "create") {
                const res = await axios.post(`${apiPrefix}/users`, formData, {
                    headers,
                });
                Toast.fire({
                    icon: "success",
                    title: res.data.message || "User Created Successfully!",
                });
            } else {
                const res = await axios.put(
                    `${apiPrefix}/users/${selectedUser.id}`,
                    formData,
                    { headers },
                );
                Toast.fire({
                    icon: "success",
                    title: res.data.message || "User Updated Successfully!",
                });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            let msg = "Action Failed";
            if (error.response?.status === 422)
                msg = Object.values(error.response.data.errors)
                    .flat()
                    .join("\n");
            else if (error.response?.data?.message)
                msg = error.response.data.message;
            Toast.fire({ icon: "error", title: msg });
        } finally {
            setIsLoading(false);
        }
    };

    if (!show) return null;

    const fullName =
        `${formData.first_name || ""} ${formData.middle_name ? formData.middle_name[0] + "." : ""} ${formData.last_name || ""} ${formData.suffix || ""}`.trim();

    const isUpdate = type === "edit";
    const headerBgColor = isUpdate ? "#F4D03F" : "var(--color-primary)";
    const headerTextColor = isUpdate ? "text-dark" : "text-white";

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === "active") return "bg-success text-white";
        if (s === "inactive") return "bg-danger text-white";
        return "bg-secondary text-white";
    };

    if (type === "view") {
        return (
            <>
                <div
                    className="modal-backdrop fade show"
                    style={{ zIndex: 1045 }}
                ></div>
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ zIndex: 1050, overflowY: "auto" }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content card-retro border-2 border-dark shadow">
                            <div
                                className="modal-header border-bottom border-dark text-white"
                                style={{
                                    backgroundColor: "var(--color-primary)",
                                }}
                            >
                                <h5 className="modal-title fw-bold font-monospace">
                                    <i className="bi bi-person-badge-fill me-2"></i>
                                    USER PROFILE
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={onClose}
                                ></button>
                            </div>

                            <div className="modal-body bg-light">
                                <div className="text-center mb-4 mt-2">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff&size=128`}
                                        className="rounded-circle border border-dark border-2 mb-3 bg-white shadow-sm"
                                        style={{
                                            width: "80px",
                                            height: "80px",
                                        }}
                                        alt="Avatar"
                                    />
                                    <h4
                                        className="fw-black text-dark mb-1 font-monospace text-uppercase"
                                        style={{ letterSpacing: "1px" }}
                                    >
                                        {fullName}
                                    </h4>
                                    <div className="text-muted font-monospace small fw-bold mb-3">
                                        <i className="bi bi-envelope-at-fill text-danger me-2"></i>
                                        {formData.email}
                                    </div>
                                    <div
                                        className={`d-inline-block px-4 py-2 border border-2 border-dark font-monospace ${getStatusColor(formData.status)}`}
                                        style={{
                                            boxShadow:
                                                "4px 4px 0 rgba(0,0,0,0.2)",
                                            fontWeight: "bold",
                                            letterSpacing: "2px",
                                        }}
                                    >
                                        {formData.status
                                            ? formData.status.toUpperCase()
                                            : "UNKNOWN"}
                                    </div>
                                </div>

                                <div className="card border-2 border-dark mb-4">
                                    <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                        <i className="bi bi-card-list me-2"></i>{" "}
                                        INFORMATION DETAILS
                                    </div>
                                    <div className="card-body p-3 bg-white">
                                        {[
                                            {
                                                label: "Role",
                                                icon: "bi-shield-lock-fill",
                                                value: formData.role.toUpperCase(),
                                                color: "text-primary",
                                            },
                                            {
                                                label: "Contact",
                                                icon: "bi-telephone-fill",
                                                value:
                                                    formData.contact_number ||
                                                    "N/A",
                                            },
                                            {
                                                label: "Birthday",
                                                icon: "bi-calendar-event-fill",
                                                value:
                                                    formData.birthday || "N/A",
                                            },
                                            {
                                                label: "Age",
                                                icon: "bi-hourglass-split",
                                                value: formData.age
                                                    ? `${formData.age} yrs`
                                                    : "N/A",
                                            },
                                            {
                                                label: "Gender",
                                                icon: "bi-gender-ambiguous",
                                                value: formData.gender || "N/A",
                                            },
                                        ].map((row, idx, arr) => (
                                            <div
                                                key={row.label}
                                                className={`d-flex justify-content-between align-items-center py-3 ${idx !== arr.length - 1 ? "border-bottom border-dark border-1" : ""}`}
                                                style={
                                                    idx !== arr.length - 1
                                                        ? {
                                                              borderBottomStyle:
                                                                  "dashed",
                                                          }
                                                        : {}
                                                }
                                            >
                                                <span className="fw-bold text-muted small text-uppercase font-monospace">
                                                    <i
                                                        className={`bi ${row.icon} me-2`}
                                                    ></i>
                                                    {row.label}
                                                </span>
                                                <span
                                                    className={`fw-bolder text-uppercase text-end font-monospace ${row.color || "text-dark"}`}
                                                    style={{
                                                        maxWidth: "60%",
                                                        wordBreak: "break-word",
                                                    }}
                                                >
                                                    {row.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-center mt-3">
                                    <p className="small text-muted mb-3 fst-italic font-monospace">
                                        * This is a system-generated user record
                                    </p>
                                </div>

                                <div className="d-flex justify-content-end gap-2 pt-3 border-top border-dark">
                                    <button
                                        type="button"
                                        className="btn btn-dark fw-bold px-4 btn-press-retro"
                                        onClick={onClose}
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1045 }}
            ></div>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ zIndex: 1050, overflowY: "auto" }}
            >
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content card-retro border-2 border-dark shadow">
                        <div
                            className={`modal-header border-bottom border-dark ${headerTextColor}`}
                            style={{ backgroundColor: headerBgColor }}
                        >
                            <h5 className="modal-title fw-bold font-monospace">
                                {type === "create" ? (
                                    <>
                                        <i className="bi bi-person-plus-fill me-2"></i>
                                        CREATE USER
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-pencil-square me-2"></i>
                                        UPDATE USER
                                    </>
                                )}
                            </h5>
                            <button
                                type="button"
                                className={`btn-close ${!isUpdate ? "btn-close-white" : ""}`}
                                onClick={onClose}
                            ></button>
                        </div>
                        <div className="modal-body bg-light">
                            <form onSubmit={handleFormSubmit}>
                                <div className="card border-2 border-dark mb-4">
                                    <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                        <i className="bi bi-person-lines-fill me-2"></i>{" "}
                                        PERSONAL INFORMATION
                                    </div>
                                    <div className="card-body row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-person-bounding-box me-1"></i>{" "}
                                                FIRST NAME
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                className="form-control border-dark"
                                                placeholder="Enter first name"
                                                value={formData.first_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-person-bounding-box me-1"></i>{" "}
                                                LAST NAME
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                className="form-control border-dark"
                                                placeholder="Enter last name"
                                                value={formData.last_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-person-bounding-box me-1"></i>{" "}
                                                MIDDLE NAME (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                name="middle_name"
                                                className="form-control border-dark"
                                                placeholder="Enter middle name"
                                                value={formData.middle_name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-person-badge me-1"></i>{" "}
                                                SUFFIX (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                name="suffix"
                                                className="form-control border-dark"
                                                placeholder="e.g., Jr, Sr, III"
                                                value={formData.suffix}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-calendar-event-fill me-1"></i>{" "}
                                                BIRTHDAY
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                name="birthday"
                                                className="form-control border-dark"
                                                value={formData.birthday}
                                                onChange={handleChange}
                                                onWheel={(e) => e.target.blur()}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold font-monospace text-muted">
                                                <i className="bi bi-hourglass-split me-1"></i>{" "}
                                                AGE (Auto-computed)
                                            </label>
                                            <input
                                                type="text"
                                                name="age"
                                                className="form-control border-dark bg-secondary bg-opacity-10"
                                                placeholder="0"
                                                value={formData.age}
                                                readOnly
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-gender-ambiguous me-1"></i>{" "}
                                                GENDER
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                name="gender"
                                                className="form-select border-dark"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">
                                                    Select Gender
                                                </option>
                                                <option value="Male">
                                                    Male
                                                </option>
                                                <option value="Female">
                                                    Female
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="card border-2 border-dark mb-4">
                                    <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                        <i className="bi bi-shield-lock-fill me-2"></i>{" "}
                                        ACCOUNT DETAILS
                                    </div>
                                    <div className="card-body row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-envelope-at-fill me-1"></i>{" "}
                                                EMAIL ADDRESS
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control border-dark"
                                                placeholder="name@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-telephone-fill me-1"></i>{" "}
                                                CONTACT NUMBER
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                name="contact_number"
                                                className="form-control border-dark"
                                                placeholder="e.g., 09123456789"
                                                value={formData.contact_number}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-shield-lock-fill me-1"></i>{" "}
                                                ROLE
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                name="role"
                                                className={`form-select border-dark ${!isAdmin ? "bg-secondary bg-opacity-10" : ""}`}
                                                value={formData.role}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="staff">
                                                    Staff
                                                </option>
                                                {isAdmin && (
                                                    <>
                                                        <option value="head">
                                                            Head
                                                        </option>
                                                        <option value="admin">
                                                            Admin
                                                        </option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-activity me-1"></i>{" "}
                                                STATUS
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                name="status"
                                                className={`form-select fw-bold border-dark ${formData.status === "active" ? "text-success" : "text-danger"}`}
                                                value={formData.status}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="active">
                                                    Active
                                                </option>
                                                <option value="inactive">
                                                    Inactive
                                                </option>
                                            </select>
                                        </div>
                                        <div className="col-12 mt-3">
                                            <div className="d-flex justify-content-between align-items-end mb-1">
                                                <label className="form-label small fw-bold font-monospace mb-0">
                                                    <i className="bi bi-key-fill me-1"></i>{" "}
                                                    {type === "edit"
                                                        ? "NEW PASSWORD (Optional)"
                                                        : "PASSWORD"}
                                                    {type === "create" && (
                                                        <span className="text-danger ms-1">
                                                            *
                                                        </span>
                                                    )}
                                                </label>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-dark font-monospace"
                                                    onClick={handleAutoGenerate}
                                                >
                                                    <i className="bi bi-magic me-1"></i>{" "}
                                                    Auto Generate
                                                </button>
                                            </div>

                                            <div className="position-relative">
                                                <input
                                                    type={
                                                        showPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    name="password"
                                                    className="form-control border-dark pe-5"
                                                    placeholder={
                                                        type === "edit"
                                                            ? "Leave blank to keep current"
                                                            : "Enter a secure password"
                                                    }
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    required={type === "create"}
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
                                                        !isLoading &&
                                                        setShowPassword(
                                                            !showPassword,
                                                        )
                                                    }
                                                >
                                                    <i
                                                        className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"} fs-5`}
                                                    ></i>
                                                </span>
                                            </div>

                                            {formData.password && (
                                                <div className="mt-2 small fw-bold d-flex align-items-center gap-2">
                                                    Strength:{" "}
                                                    <span
                                                        className={`badge ${pwdStrength === "Weak" ? "bg-danger" : pwdStrength === "Good" ? "bg-warning text-dark" : "bg-success"}`}
                                                    >
                                                        {pwdStrength}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="form-text mt-2 small text-muted font-monospace">
                                                <i className="bi bi-info-circle-fill me-1"></i>
                                                Password must be at least 8
                                                characters long, containing 1
                                                Uppercase letter, 1 lowercase
                                                letter, 1 number, and 1 special
                                                character.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark">
                                    <button
                                        type="button"
                                        className="btn btn-dark fw-bold px-4 btn-press-retro"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        type="submit"
                                        className={`btn border-2 border-dark fw-bold px-4 btn-press-retro d-flex align-items-center ${!isUpdate ? "text-white" : "text-dark"}`}
                                        style={{
                                            backgroundColor: headerBgColor,
                                        }}
                                        disabled={isLoading}
                                    >
                                        {type === "create"
                                            ? "CREATE ACCOUNT"
                                            : "SAVE CHANGES"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <UserConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeSubmit}
            />

            <Loading
                show={isLoading}
                message={
                    type === "create"
                        ? "CREATING ACCOUNT..."
                        : "SAVING CHANGES..."
                }
            />
        </>
    );
}
