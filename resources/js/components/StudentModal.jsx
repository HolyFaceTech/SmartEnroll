import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Toast from "../utils/toast";
import StudentConfirmation from "./StudentConfirmation";
import Loading from "../utils/Loading";
import moment from "moment";

export default function StudentModal({
    show,
    type,
    selectedStudent,
    strands,
    onClose,
    onSuccess,
    apiPrefix = "/api",
    openCorModal,
}) {
    const initialForm = {
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        date_of_birth: "",
        age: "",
        gender: "Male",
        place_of_birth: "",
        citizenship: "Filipino",
        civil_status: "Single",
        religion: "Roman Catholic",
        home_address: "",
        provincial_address: "",

        email: "",
        contact_number: "",
        employer_name: "",
        employer_contact: "",

        father_name: "",
        father_occupation: "",
        father_contact: "",
        mother_name: "",
        mother_occupation: "",
        mother_contact: "",
        guardian_name: "",
        guardian_occupation: "",
        guardian_contact: "",

        student_number: "",
        lrn: "",
        current_school_attended: "",
        general_average: "",
        strand_id: "",
        grade_level: "11",
        section_id: "",
        term: "1st",
        school_year: "2026-2027",
        learning_modality: "Face-to-Face",
        status: "pending",

        requirements: {
            psa: false,
            form137: false,
            good_moral: false,
            diploma: false,
            card: false,
            picture: false,
        },
        files: {
            psa: null,
            form137: null,
            good_moral: null,
            diploma: null,
            card: null,
            picture: null,
        },
    };

    const [formData, setFormData] = useState(initialForm);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [sectionsList, setSectionsList] = useState([]);
    const [confirmConfig, setConfirmConfig] = useState({ show: false });

    // HTML5 Validation Ref
    const formRef = useRef(null);

    const getToken = () =>
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const calculateAge = (dob) => {
        if (!dob) return "";
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (
            today.getMonth() - birthDate.getMonth() < 0 ||
            (today.getMonth() === birthDate.getMonth() &&
                today.getDate() < birthDate.getDate())
        )
            age--;
        return age;
    };

    useEffect(() => {
        if (show) {
            setStep(1);

            axios
                .get(`${apiPrefix}/sections`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                })
                .then((res) => {
                    const safeData = Array.isArray(res.data)
                        ? res.data
                        : res.data.data || [];
                    setSectionsList(safeData);
                })
                .catch(() => setSectionsList([]));

            if ((type === "edit" || type === "view") && selectedStudent) {
                let parsedReqs =
                    typeof selectedStudent.requirements === "string"
                        ? JSON.parse(selectedStudent.requirements)
                        : selectedStudent.requirements;
                let formattedDOB = selectedStudent.profile?.date_of_birth
                    ? moment(selectedStudent.profile.date_of_birth).format(
                          "YYYY-MM-DD",
                      )
                    : "";

                setFormData({
                    ...initialForm,
                    ...selectedStudent,
                    date_of_birth: formattedDOB,
                    age: calculateAge(formattedDOB),
                    strand_id: selectedStudent.academic?.strand_id || "",
                    section_id: selectedStudent.academic?.section_id || "",
                    grade_level: selectedStudent.academic?.grade_level || "11",
                    term: selectedStudent.academic?.term || "1st",
                    school_year:
                        selectedStudent.academic?.school_year || "2026-2027",
                    learning_modality:
                        selectedStudent.academic?.learning_modality ||
                        "Face-to-Face",
                    general_average:
                        selectedStudent.academic?.general_average || "",
                    student_number: selectedStudent.student_number || "",
                    status: selectedStudent.status || "pending",
                    requirements: {
                        ...initialForm.requirements,
                        ...(selectedStudent.requirement?.hard_copies ||
                            parsedReqs),
                    },
                    ...selectedStudent.profile,
                    ...selectedStudent.family,
                    files: { ...initialForm.files },
                });
            } else {
                setFormData(initialForm);
            }
        }
    }, [show, selectedStudent, type, apiPrefix]);

    const handleChange = (e) => {
        const { name, value, checked, type: inputType } = e.target;

        // Strict Number Replacement
        if (
            [
                "lrn",
                "contact_number",
                "employer_contact",
                "father_contact",
                "mother_contact",
                "guardian_contact",
            ].includes(name)
        ) {
            const numericValue = value.replace(/\D/g, "");
            const maxLength = name === "lrn" ? 12 : 11;
            if (numericValue.length > maxLength) return;
            setFormData({ ...formData, [name]: numericValue });
            return;
        }

        if (name.startsWith("req_")) {
            setFormData((prev) => ({
                ...prev,
                requirements: {
                    ...prev.requirements,
                    [name.replace("req_", "")]: checked,
                },
            }));
        } else if (name === "date_of_birth") {
            setFormData({
                ...formData,
                date_of_birth: value,
                age: calculateAge(value),
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (reqId, file) => {
        setFormData((prev) => ({
            ...prev,
            files: { ...prev.files, [reqId]: file },
        }));
    };

    // STRICT HTML5 STEP VALIDATION (Triggers the browser popup "Please fill out this field")
    const handleNextStep = () => {
        if (isReadOnly) {
            setStep(step + 1);
            return;
        }

        if (formRef.current) {
            // Kunin lahat ng input, select, textarea na nasa current view
            const fields = formRef.current.querySelectorAll(
                "input, select, textarea",
            );
            let isValid = true;

            for (let i = 0; i < fields.length; i++) {
                if (!fields[i].checkValidity()) {
                    fields[i].reportValidity(); // Papalabasin nito ang Tooltip sa mismong field na nagka-error
                    isValid = false;
                    break; // Titigil sa unang field na may error
                }
            }

            if (!isValid) return;
        }

        setStep(step + 1);
        document
            .querySelector(".modal-body")
            .scrollTo({ top: 0, behavior: "smooth" });
    };

    const prevStep = () => setStep(step - 1);

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (formRef.current && !formRef.current.reportValidity()) return;

        const actionName = type === "create" ? "SUBMIT" : "UPDATE";
        const btnColor = type === "create" ? "#3F9AAE" : "#F4D03F";

        setConfirmConfig({
            show: true,
            title: `CONFIRM ${actionName}?`,
            message: (
                <>
                    Are you sure you want to {actionName.toLowerCase()} the
                    records of <br />{" "}
                    <strong>
                        {formData.first_name} {formData.last_name}
                    </strong>
                    ?
                </>
            ),
            confirmText: `YES, ${actionName}`,
            confirmColor: btnColor,
            iconClass: "bi-send-fill",
        });
    };

    const executeSubmit = async () => {
        setConfirmConfig({ show: false });
        setIsLoading(true);

        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        const payload = new FormData();

        Object.keys(formData).forEach((key) => {
            if (key === "requirements") {
                payload.append(
                    "requirements",
                    JSON.stringify(formData.requirements),
                );
            } else if (key === "files") {
                Object.keys(formData.files).forEach((fileKey) => {
                    if (formData.files[fileKey]) {
                        payload.append(
                            `file_${fileKey}`,
                            formData.files[fileKey],
                        );
                    }
                });
            } else {
                if (formData[key] !== null && formData[key] !== "") {
                    payload.append(key, formData[key]);
                }
            }
        });

        if (type === "edit") payload.append("_method", "PUT");

        try {
            const url =
                type === "create"
                    ? `${apiPrefix}/students`
                    : `${apiPrefix}/students/${selectedStudent.id}`;
            const res = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            Toast.fire({ icon: "success", title: res.data.message });
            if (onSuccess) onSuccess();
            if (formData.status === "enrolled" && openCorModal)
                openCorModal(res.data.student || formData);

            onClose();
        } catch (error) {
            // FIX: Extracts the exact validation error message from backend (e.g. "The lrn has already been taken.")
            if (
                error.response &&
                error.response.status === 422 &&
                error.response.data.errors
            ) {
                const backendErrs = error.response.data.errors;
                const firstErrorKey = Object.keys(backendErrs)[0];
                const specificErrorMessage = backendErrs[firstErrorKey][0];
                Toast.fire({ icon: "warning", title: specificErrorMessage });
            } else {
                Toast.fire({
                    icon: "error",
                    title: error.response?.data?.message || "Action Failed",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!show) return null;

    const isReadOnly = type === "view";
    const isUpdate = type === "edit";
    const headerBgColor =
        type === "create"
            ? "var(--color-primary)"
            : type === "edit"
              ? "#F4D03F"
              : "#34495e";
    const headerTextColor = type === "edit" ? "text-dark" : "text-white";

    const filteredSections = Array.isArray(sectionsList)
        ? sectionsList.filter(
              (s) =>
                  s.strand_id == formData.strand_id &&
                  s.grade_level == formData.grade_level,
          )
        : [];
    const safeStrands = Array.isArray(strands) ? strands : strands?.data || [];

    const Indicator = ({ num, label, icon }) => {
        const isCompleted = step > num;
        const isCurrent = step === num;
        return (
            <div
                className="d-flex flex-column align-items-center"
                style={{ flex: 1, position: "relative" }}
            >
                <div
                    className={`rounded-circle d-flex align-items-center justify-content-center fw-bold border border-2 border-dark mb-2 shadow-sm ${isCurrent ? "bg-warning text-dark scale-up" : isCompleted ? "bg-success text-white" : "bg-light text-muted"}`}
                    style={{
                        width: isCurrent ? "45px" : "35px",
                        height: isCurrent ? "45px" : "35px",
                        transition: "all 0.3s ease",
                        zIndex: 2,
                    }}
                >
                    {isCompleted ? (
                        <i className="bi bi-check-lg fs-5"></i>
                    ) : (
                        <i
                            className={`bi ${icon} ${isCurrent ? "fs-5" : ""}`}
                        ></i>
                    )}
                </div>
                <small
                    className={`fw-bold font-monospace text-uppercase text-center ${isCurrent ? "text-dark" : "text-muted d-none d-md-block"}`}
                    style={{ fontSize: "0.65rem", letterSpacing: "1px" }}
                >
                    {label}
                </small>
            </div>
        );
    };

    const Label = ({ icon, text, required = false }) => (
        <label className="form-label fw-bold small mb-1 font-monospace text-uppercase text-muted text-nowrap d-flex justify-content-between w-100">
            <span>
                <i className={`bi ${icon} me-1`}></i> {text}{" "}
                {required && !isReadOnly && (
                    <span className="text-danger ms-1">*</span>
                )}
            </span>
        </label>
    );

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1045 }}
            ></div>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ zIndex: 1050, overflowY: "hidden" }}
            >
                <div className="modal-dialog modal-dialog-centered modal-xl h-100 mt-0 mb-0 d-flex align-items-center">
                    <div
                        className="modal-content card-retro border-2 border-dark shadow"
                        style={{
                            maxHeight: "95vh",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            className={`modal-header border-bottom border-dark flex-shrink-0 ${headerTextColor}`}
                            style={{ backgroundColor: headerBgColor }}
                        >
                            <h5 className="modal-title fw-bold font-monospace text-uppercase">
                                {type === "create" ? (
                                    <>
                                        <i className="bi bi-person-plus-fill me-2"></i>
                                        NEW STUDENT WIZARD
                                    </>
                                ) : type === "edit" ? (
                                    <>
                                        <i className="bi bi-pencil-square me-2"></i>
                                        UPDATE RECORD
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-person-badge-fill me-2"></i>
                                        STUDENT PROFILE (VIEW MODE)
                                    </>
                                )}
                            </h5>
                            <button
                                type="button"
                                className={`btn-close ${type !== "edit" ? "btn-close-white" : ""}`}
                                onClick={onClose}
                            ></button>
                        </div>

                        <div className="modal-body bg-light p-4 p-md-5 overflow-auto flex-grow-1 position-relative">
                            {(type === "view" || type === "edit") && (
                                <div className="text-center mb-4">
                                    <div
                                        className={`d-inline-block px-4 py-2 border border-2 border-dark font-monospace fw-bold text-uppercase shadow-sm ${
                                            formData.status === "enrolled"
                                                ? "bg-success text-white"
                                                : formData.status === "cleared"
                                                  ? "bg-primary text-white"
                                                  : formData.status ===
                                                      "on hold"
                                                    ? "bg-danger text-white"
                                                    : formData.status ===
                                                        "graduate"
                                                      ? "bg-info text-dark"
                                                      : formData.status ===
                                                          "drop out"
                                                        ? "bg-dark text-white"
                                                        : formData.status ===
                                                            "released"
                                                          ? "bg-secondary text-white"
                                                          : "bg-warning text-dark"
                                        }`}
                                    >
                                        STATUS:{" "}
                                        {formData.status
                                            ? formData.status
                                            : "PENDING"}
                                    </div>
                                    <div className="mt-2 fw-bold font-monospace text-dark d-flex align-items-center justify-content-center">
                                        <i className="bi bi-upc-scan me-2"></i>{" "}
                                        STUDENT NUMBER:{" "}
                                        {formData.student_number ? (
                                            <span className="text-primary fs-5 ms-1">
                                                {formData.student_number}
                                            </span>
                                        ) : (
                                            <span className="text-muted fst-italic ms-1">
                                                No Student Number yet
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="d-flex justify-content-between mb-5 position-relative px-md-4 mt-2">
                                <div
                                    className="position-absolute top-50 start-0 w-100 border-top border-2 border-dark"
                                    style={{
                                        zIndex: 0,
                                        transform: "translateY(-10px)",
                                    }}
                                ></div>
                                <div className="position-relative w-100 d-flex justify-content-between">
                                    <Indicator
                                        num={1}
                                        label="Personal"
                                        icon="bi-person-lines-fill"
                                    />
                                    <Indicator
                                        num={2}
                                        label="Contact"
                                        icon="bi-telephone-fill"
                                    />
                                    <Indicator
                                        num={3}
                                        label="Employment"
                                        icon="bi-briefcase-fill"
                                    />
                                    <Indicator
                                        num={4}
                                        label="Family"
                                        icon="bi-people-fill"
                                    />
                                    <Indicator
                                        num={5}
                                        label="Academic"
                                        icon="bi-mortarboard-fill"
                                    />
                                    <Indicator
                                        num={6}
                                        label="Requirements"
                                        icon="bi-folder-check"
                                    />
                                </div>
                            </div>

                            {!isReadOnly && (
                                <div className="alert bg-white border border-2 border-dark text-dark font-monospace shadow-sm mb-4">
                                    <h6 className="fw-bold mb-1 text-primary">
                                        <i className="bi bi-info-circle-fill me-2"></i>
                                        INSTRUCTIONS:
                                    </h6>
                                    <ul className="mb-0 small text-muted">
                                        <li>
                                            Fill out all required fields marked
                                            with a red asterisk (
                                            <span className="text-danger fw-bold fs-6">
                                                *
                                            </span>
                                            ).
                                        </li>
                                        <li>
                                            Fields without an asterisk are
                                            optional and may be left blank.
                                        </li>
                                        <li>
                                            Student Number is{" "}
                                            <strong>auto-generated</strong> once
                                            the status is marked as Enrolled.
                                            You may also assign it manually.
                                        </li>
                                    </ul>
                                </div>
                            )}

                            <form
                                id="studentWizard"
                                ref={formRef}
                                onSubmit={handleFormSubmit}
                                noValidate={false}
                            >
                                {/* STEP 1: PERSONAL INFO */}
                                {step === 1 && (
                                    <div className="row g-3 fade-in">
                                        <div className="col-12">
                                            <h5 className="fw-black border-bottom border-dark pb-2 mb-2 font-monospace text-dark">
                                                <i className="bi bi-person-lines-fill me-2"></i>
                                                1. PERSONAL INFO
                                            </h5>
                                        </div>

                                        <div className="col-12">
                                            <div className="row g-2">
                                                <div className="col-md-4 col-lg">
                                                    <Label
                                                        icon="bi-person"
                                                        text="FIRST NAME"
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        name="first_name"
                                                        className="form-control border-dark"
                                                        placeholder="e.g. Juan"
                                                        value={
                                                            formData.first_name
                                                        }
                                                        onChange={handleChange}
                                                        disabled={
                                                            isReadOnly ||
                                                            isLoading
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-4 col-lg">
                                                    <Label
                                                        icon="bi-person"
                                                        text="MIDDLE NAME"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="middle_name"
                                                        className="form-control border-dark"
                                                        placeholder="e.g. Santos"
                                                        value={
                                                            formData.middle_name
                                                        }
                                                        onChange={handleChange}
                                                        disabled={
                                                            isReadOnly ||
                                                            isLoading
                                                        }
                                                    />
                                                </div>
                                                <div className="col-md-4 col-lg">
                                                    <Label
                                                        icon="bi-person"
                                                        text="LAST NAME"
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        name="last_name"
                                                        className="form-control border-dark"
                                                        placeholder="e.g. Dela Cruz"
                                                        value={
                                                            formData.last_name
                                                        }
                                                        onChange={handleChange}
                                                        disabled={
                                                            isReadOnly ||
                                                            isLoading
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-3 col-lg-2">
                                                    <Label
                                                        icon="bi-hash"
                                                        text="SUFFIX"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="suffix"
                                                        className="form-control border-dark text-center"
                                                        placeholder="Jr."
                                                        value={formData.suffix}
                                                        onChange={handleChange}
                                                        disabled={
                                                            isReadOnly ||
                                                            isLoading
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-calendar-event"
                                                text="BIRTH DATE"
                                                required
                                            />
                                            <input
                                                type="date"
                                                name="date_of_birth"
                                                className="form-control border-dark"
                                                value={formData.date_of_birth}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <Label
                                                icon="bi-hourglass-split"
                                                text="AGE"
                                                required
                                            />
                                            <input
                                                type="text"
                                                className="form-control border-dark bg-light fw-bold text-center"
                                                placeholder="0"
                                                value={formData.age}
                                                readOnly
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-gender-ambiguous"
                                                text="GENDER"
                                                required
                                            />
                                            <select
                                                name="gender"
                                                className="form-select border-dark"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            >
                                                <option value="Male">
                                                    Male
                                                </option>
                                                <option value="Female">
                                                    Female
                                                </option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-heart"
                                                text="CIVIL STATUS"
                                                required
                                            />
                                            <select
                                                name="civil_status"
                                                className="form-select border-dark"
                                                value={formData.civil_status}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            >
                                                <option value="Single">
                                                    Single
                                                </option>
                                                <option value="Married">
                                                    Married
                                                </option>
                                                <option value="Widowed">
                                                    Widowed
                                                </option>
                                            </select>
                                        </div>

                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-globe"
                                                text="CITIZENSHIP"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="citizenship"
                                                className="form-control border-dark"
                                                placeholder="e.g. Filipino"
                                                value={formData.citizenship}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-bookmark-heart"
                                                text="RELIGION"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="religion"
                                                className="form-control border-dark"
                                                placeholder="e.g. Roman Catholic"
                                                value={formData.religion}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-hospital"
                                                text="PLACE OF BIRTH"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="place_of_birth"
                                                className="form-control border-dark"
                                                placeholder="e.g. Quezon City"
                                                value={formData.place_of_birth}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="col-md-12">
                                            <Label
                                                icon="bi-house"
                                                text="HOME ADDRESS"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="home_address"
                                                className="form-control border-dark"
                                                placeholder="House No., Street, Brgy, City, Province"
                                                value={formData.home_address}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <Label
                                                icon="bi-map"
                                                text="PROVINCIAL ADDRESS"
                                            />
                                            <input
                                                type="text"
                                                name="provincial_address"
                                                className="form-control border-dark"
                                                placeholder="House No., Street, Brgy, Province"
                                                value={
                                                    formData.provincial_address
                                                }
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: CONTACT */}
                                {step === 2 && (
                                    <div className="row g-3 fade-in">
                                        <div className="col-12">
                                            <h5 className="fw-black border-bottom border-dark pb-2 mb-2 font-monospace text-dark">
                                                <i className="bi bi-telephone-fill me-2"></i>
                                                2. CONTACT INFO
                                            </h5>
                                        </div>

                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-envelope"
                                                text="EMAIL ADDRESS"
                                                required
                                            />
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control border-dark"
                                                placeholder="example@email.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-phone"
                                                text="CONTACT NO."
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="contact_number"
                                                className="form-control border-dark"
                                                placeholder="11-digit mobile number"
                                                minLength="11"
                                                maxLength="11"
                                                value={formData.contact_number}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: EMPLOYMENT */}
                                {step === 3 && (
                                    <div className="row g-3 fade-in">
                                        <div className="col-12">
                                            <h5 className="fw-black border-bottom border-dark pb-2 mb-2 font-monospace text-dark">
                                                <i className="bi bi-briefcase-fill me-2"></i>
                                                3. EMPLOYMENT INFO
                                            </h5>
                                        </div>
                                        <div className="col-12">
                                            <p className="small text-muted font-monospace fst-italic">
                                                For working students only.
                                            </p>
                                        </div>

                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-building"
                                                text="EMPLOYER NAME"
                                            />
                                            <input
                                                type="text"
                                                name="employer_name"
                                                className="form-control border-dark"
                                                placeholder="Company Name"
                                                value={formData.employer_name}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-telephone"
                                                text="EMPLOYER CONTACT"
                                            />
                                            <input
                                                type="text"
                                                name="employer_contact"
                                                className="form-control border-dark"
                                                placeholder="Company Contact No."
                                                minLength="11"
                                                maxLength="11"
                                                value={
                                                    formData.employer_contact
                                                }
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: FAMILY */}
                                {step === 4 && (
                                    <div className="row g-3 fade-in">
                                        <div className="col-12">
                                            <h5 className="fw-black border-bottom border-dark pb-2 mb-2 font-monospace text-dark">
                                                <i className="bi bi-people-fill me-2"></i>
                                                4. FAMILY BACKGROUND
                                            </h5>
                                        </div>

                                        <div className="col-12 mt-2">
                                            <h6 className="fw-bold text-decoration-underline font-monospace text-primary">
                                                FATHER'S INFO
                                            </h6>
                                        </div>
                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-person"
                                                text="FULL NAME"
                                            />
                                            <input
                                                type="text"
                                                name="father_name"
                                                className="form-control border-dark"
                                                placeholder="Father's Full Name"
                                                value={formData.father_name}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-briefcase"
                                                text="OCCUPATION"
                                            />
                                            <input
                                                type="text"
                                                name="father_occupation"
                                                className="form-control border-dark"
                                                placeholder="Job Title"
                                                value={
                                                    formData.father_occupation
                                                }
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-telephone"
                                                text="CONTACT NO."
                                            />
                                            <input
                                                type="text"
                                                name="father_contact"
                                                className="form-control border-dark"
                                                placeholder="09xxxxxxxxx"
                                                minLength="11"
                                                maxLength="11"
                                                value={formData.father_contact}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>

                                        <div className="col-12 mt-3">
                                            <h6 className="fw-bold text-decoration-underline font-monospace text-primary">
                                                MOTHER'S INFO
                                            </h6>
                                        </div>
                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-person"
                                                text="FULL NAME"
                                            />
                                            <input
                                                type="text"
                                                name="mother_name"
                                                className="form-control border-dark"
                                                placeholder="Mother's Full Name"
                                                value={formData.mother_name}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-briefcase"
                                                text="OCCUPATION"
                                            />
                                            <input
                                                type="text"
                                                name="mother_occupation"
                                                className="form-control border-dark"
                                                placeholder="Job Title"
                                                value={
                                                    formData.mother_occupation
                                                }
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-telephone"
                                                text="CONTACT NO."
                                            />
                                            <input
                                                type="text"
                                                name="mother_contact"
                                                className="form-control border-dark"
                                                placeholder="09xxxxxxxxx"
                                                minLength="11"
                                                maxLength="11"
                                                value={formData.mother_contact}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>

                                        <div className="col-12 mt-3">
                                            <h6 className="fw-bold text-decoration-underline font-monospace text-primary">
                                                GUARDIAN'S INFO{" "}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </h6>
                                        </div>
                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-person-check"
                                                text="FULL NAME"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="guardian_name"
                                                className="form-control border-dark"
                                                placeholder="Guardian's Full Name"
                                                value={formData.guardian_name}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-briefcase"
                                                text="OCCUPATION"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="guardian_occupation"
                                                className="form-control border-dark"
                                                placeholder="Job Title"
                                                value={
                                                    formData.guardian_occupation
                                                }
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-telephone"
                                                text="CONTACT NO."
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="guardian_contact"
                                                className="form-control border-dark"
                                                placeholder="09xxxxxxxxx"
                                                minLength="11"
                                                maxLength="11"
                                                value={
                                                    formData.guardian_contact
                                                }
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 5: ACADEMIC */}
                                {step === 5 && (
                                    <div className="row g-3 fade-in">
                                        <div className="col-12">
                                            <h4 className="fw-black border-bottom border-dark pb-2 mb-3 font-monospace text-dark">
                                                <i className="bi bi-mortarboard-fill me-2"></i>
                                                5. ACADEMIC INFO
                                            </h4>
                                        </div>

                                        {/* Row 1: Previous School, Gen Ave */}
                                        <div className="col-md-9">
                                            <Label
                                                icon="bi-building"
                                                text="PREVIOUS SCHOOL"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="current_school_attended"
                                                className="form-control border-dark"
                                                placeholder="Name of last school attended"
                                                value={
                                                    formData.current_school_attended
                                                }
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-bar-chart"
                                                text="GEN. AVERAGE"
                                            />
                                            {/* FIX: Built in HTML5 Max, Min and Step logic para hindi mag next kapag mali. */}
                                            <input
                                                type="number"
                                                name="general_average"
                                                className="form-control border-dark text-center fw-bold"
                                                placeholder="00.00"
                                                min="75"
                                                max="100"
                                                step="0.01"
                                                value={formData.general_average}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>

                                        {/* Row 2: School Year, Term, Learning Modality */}
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-calendar-date"
                                                text="SCHOOL YEAR"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="school_year"
                                                className="form-control border-dark"
                                                placeholder="YYYY-YYYY"
                                                value={formData.school_year}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-clock"
                                                text="TERM"
                                                required
                                            />
                                            <select
                                                name="term"
                                                className="form-select border-dark"
                                                value={formData.term}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            >
                                                <option value="1st">
                                                    1st Term
                                                </option>
                                                <option value="2nd">
                                                    2nd Term
                                                </option>
                                                <option value="3rd">
                                                    3rd Term
                                                </option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-laptop"
                                                text="LEARNING MODALITY"
                                                required
                                            />
                                            <select
                                                name="learning_modality"
                                                className="form-select border-dark"
                                                value={
                                                    formData.learning_modality
                                                }
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            >
                                                <option value="Face-to-Face">
                                                    Face-to-Face
                                                </option>
                                                <option value="Modular">
                                                    Modular
                                                </option>
                                            </select>
                                        </div>

                                        {/* Row 3: Grade Level, Strand, Section */}
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-bar-chart-steps"
                                                text="GRADE LEVEL"
                                                required
                                            />
                                            <select
                                                name="grade_level"
                                                className="form-select border-dark"
                                                value={formData.grade_level}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            >
                                                <option value="11">
                                                    Grade 11
                                                </option>
                                                <option value="12">
                                                    Grade 12
                                                </option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-journal-text"
                                                text="STRAND"
                                                required
                                            />
                                            <select
                                                name="strand_id"
                                                className="form-select border-dark"
                                                value={formData.strand_id}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            >
                                                <option value="">
                                                    -- Select Strand --
                                                </option>
                                                {safeStrands.map((s) => (
                                                    <option
                                                        key={s.id}
                                                        value={s.id}
                                                    >
                                                        {s.code}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-diagram-3"
                                                text="SECTION"
                                            />
                                            <select
                                                name="section_id"
                                                className="form-select border-dark bg-success bg-opacity-10 fw-bold"
                                                value={formData.section_id}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            >
                                                <option value="">
                                                    -- No Section --
                                                </option>
                                                {filteredSections.map((s) => {
                                                    const isFull =
                                                        s.enrolled_count >=
                                                            s.capacity &&
                                                        s.id !==
                                                            selectedStudent
                                                                ?.academic
                                                                ?.section_id;
                                                    return (
                                                        <option
                                                            key={s.id}
                                                            value={s.id}
                                                            disabled={isFull}
                                                        >
                                                            {s.name} (
                                                            {s.enrolled_count}/
                                                            {s.capacity}){" "}
                                                            {isFull
                                                                ? "(FULL)"
                                                                : ""}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>

                                        {/* Row 4: LRN, Student Number, Status */}
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-upc-scan"
                                                text="LRN"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="lrn"
                                                className="form-control border-dark fw-bold bg-warning bg-opacity-10"
                                                placeholder="12-digit LRN"
                                                minLength="12"
                                                maxLength="12"
                                                value={formData.lrn}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-hash"
                                                text="STUDENT NUMBER"
                                            />
                                            <input
                                                type="text"
                                                name="student_number"
                                                className="form-control border-dark text-center fw-bold bg-light"
                                                placeholder="(Auto-Generated if blank)"
                                                value={
                                                    formData.student_number ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        student_number:
                                                            e.target.value,
                                                    })
                                                }
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-activity"
                                                text="STATUS"
                                                required
                                            />
                                            <select
                                                name="status"
                                                className={`form-select border-dark fw-bold text-uppercase ${formData.status === "enrolled" ? "bg-success text-white" : formData.status === "cleared" ? "bg-primary text-white" : formData.status === "pending" ? "bg-warning text-dark" : formData.status === "on hold" ? "bg-danger text-white" : formData.status === "graduate" ? "bg-info text-dark" : formData.status === "drop out" ? "bg-dark text-white" : "bg-secondary text-white"}`}
                                                value={formData.status}
                                                onChange={handleChange}
                                                disabled={
                                                    isReadOnly || isLoading
                                                }
                                                required
                                            >
                                                <option value="pending">
                                                    Pending
                                                </option>
                                                <option value="enrolled">
                                                    Enrolled
                                                </option>
                                                <option value="on hold">
                                                    On Hold
                                                </option>
                                                <option value="graduate">
                                                    Graduate
                                                </option>
                                                <option value="drop out">
                                                    Drop Out
                                                </option>
                                                <option value="released">
                                                    Released
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 6: REQUIREMENTS */}
                                {step === 6 && (
                                    <div className="row g-3 fade-in">
                                        <div className="col-12">
                                            <h5 className="fw-black border-bottom border-dark pb-2 mb-3 font-monospace text-dark">
                                                <i className="bi bi-folder-check me-2"></i>
                                                6. REQUIREMENTS
                                            </h5>
                                        </div>

                                        <div className="col-12 mt-2 text-center">
                                            <h6 className="fw-bold font-monospace mb-3 border-bottom border-dark pb-2 text-primary">
                                                <i className="bi bi-check2-square me-2"></i>
                                                HARD COPIES SUBMITTED
                                            </h6>
                                            <div
                                                className="row g-2 text-start mx-auto"
                                                style={{ maxWidth: "800px" }}
                                            >
                                                {[
                                                    {
                                                        id: "psa",
                                                        label: "PSA Birth Certificate",
                                                    },
                                                    {
                                                        id: "form137",
                                                        label: "Form 137 / SF10",
                                                    },
                                                    {
                                                        id: "good_moral",
                                                        label: "Certificate of Good Moral",
                                                    },
                                                    {
                                                        id: "diploma",
                                                        label: "Grade 10 Diploma",
                                                    },
                                                    {
                                                        id: "card",
                                                        label: "Report Card (F138)",
                                                    },
                                                    {
                                                        id: "picture",
                                                        label: "2x2 Picture (2pcs)",
                                                    },
                                                ].map((req) => (
                                                    <div
                                                        className="col-md-4"
                                                        key={req.id}
                                                    >
                                                        <div className="form-check p-2 border border-dark bg-white d-inline-block w-100 shadow-sm">
                                                            <input
                                                                className="form-check-input ms-2 border-dark cursor-pointer"
                                                                type="checkbox"
                                                                name={`req_${req.id}`}
                                                                id={`chk_${req.id}`}
                                                                checked={
                                                                    formData
                                                                        .requirements[
                                                                        req.id
                                                                    ] || false
                                                                }
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                style={{
                                                                    transform:
                                                                        "scale(1.2)",
                                                                }}
                                                                disabled={
                                                                    isReadOnly ||
                                                                    isLoading
                                                                }
                                                            />
                                                            <label
                                                                className="form-check-label fw-bold small ms-2 font-monospace"
                                                                htmlFor={`chk_${req.id}`}
                                                            >
                                                                {req.label}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-12 mt-4 text-center">
                                            <h6 className="fw-bold font-monospace mb-3 border-bottom border-dark pb-2 text-primary">
                                                <i className="bi bi-cloud-arrow-up-fill me-2"></i>
                                                UPLOADED SOFT COPIES (OPTIONAL)
                                            </h6>
                                            <div
                                                className="row g-3 text-start mx-auto"
                                                style={{ maxWidth: "800px" }}
                                            >
                                                {[
                                                    {
                                                        id: "psa",
                                                        label: "PSA Birth Certificate",
                                                    },
                                                    {
                                                        id: "form137",
                                                        label: "Form 137 / SF10",
                                                    },
                                                    {
                                                        id: "good_moral",
                                                        label: "Certificate of Good Moral",
                                                    },
                                                    {
                                                        id: "diploma",
                                                        label: "Grade 10 Diploma",
                                                    },
                                                    {
                                                        id: "card",
                                                        label: "Report Card (F138)",
                                                    },
                                                    {
                                                        id: "picture",
                                                        label: "2x2 Picture (2pcs)",
                                                    },
                                                ].map((req) => {
                                                    const dbKey =
                                                        req.id === "card"
                                                            ? "form_138"
                                                            : req.id ===
                                                                "picture"
                                                              ? "photo_2x2"
                                                              : req.id ===
                                                                  "form137"
                                                                ? "form_137"
                                                                : req.id;
                                                    const existingFile =
                                                        selectedStudent
                                                            ?.requirement?.[
                                                            dbKey
                                                        ];

                                                    return (
                                                        <div
                                                            className="col-md-6"
                                                            key={`file_${req.id}`}
                                                        >
                                                            <div className="p-2 border border-dark bg-white d-inline-block w-100 shadow-sm">
                                                                <label className="fw-bold small font-monospace d-block mb-1 text-uppercase text-muted">
                                                                    {req.label}
                                                                </label>
                                                                {!isReadOnly && (
                                                                    <input
                                                                        type="file"
                                                                        className="form-control form-control-sm border-dark rounded-0 font-monospace"
                                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleFileChange(
                                                                                req.id,
                                                                                e
                                                                                    .target
                                                                                    .files[0],
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isLoading
                                                                        }
                                                                    />
                                                                )}
                                                                {existingFile && (
                                                                    <a
                                                                        href={`/storage/${existingFile}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="badge bg-success text-white text-decoration-none mt-2 d-inline-block p-2 border border-dark"
                                                                    >
                                                                        <i className="bi bi-eye-fill me-1"></i>{" "}
                                                                        VIEW
                                                                        FILE
                                                                    </a>
                                                                )}
                                                                {!existingFile &&
                                                                    isReadOnly && (
                                                                        <span className="small text-muted fst-italic">
                                                                            No
                                                                            file
                                                                            uploaded.
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="modal-footer border-top border-dark flex-shrink-0 d-flex justify-content-between bg-light p-3">
                            <button
                                type="button"
                                className="btn btn-dark fw-bold px-4 btn-press-retro"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                CLOSE
                            </button>
                            <div>
                                {step > 1 && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-dark border-2 fw-bold px-4 me-2 btn-press-retro"
                                        onClick={prevStep}
                                        disabled={isLoading}
                                    >
                                        <i className="bi bi-arrow-left me-2"></i>{" "}
                                        BACK
                                    </button>
                                )}
                                {step < 6 && (
                                    <button
                                        type="button"
                                        className="btn btn-dark border-2 fw-bold px-4 btn-press-retro"
                                        onClick={handleNextStep}
                                    >
                                        NEXT STEP{" "}
                                        <i className="bi bi-arrow-right ms-2"></i>
                                    </button>
                                )}
                                {step === 6 && !isReadOnly && (
                                    <button
                                        form="studentWizard"
                                        type="submit"
                                        className={`btn border-2 border-dark fw-bold px-4 btn-press-retro ${!isUpdate ? "text-white" : "text-dark"}`}
                                        style={{
                                            backgroundColor: headerBgColor,
                                        }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span>
                                                <i className="bi bi-mortarboard-fill spinner-toga me-2"></i>
                                                PROCESSING...
                                            </span>
                                        ) : isUpdate ? (
                                            "SAVE CHANGES"
                                        ) : (
                                            "SUBMIT APPLICATION"
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <StudentConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeSubmit}
            />
            <Loading
                show={isLoading}
                message={
                    type === "create"
                        ? "SUBMITTING APPLICATION..."
                        : "SAVING CHANGES..."
                }
            />
        </>
    );
}
