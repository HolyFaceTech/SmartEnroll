import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";
import moment from "moment";
import Toast from "../utils/toast";
import Loading from "../utils/Loading";
import UserConfirmation from "./UserConfirmation";

export default function EnrollmentModal({ initialData, settings, onClose }) {
    const formRef = useRef(null);
    const [step, setStep] = useState(1);
    const [strands, setStrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [captchaVal, setCaptchaVal] = useState(null);

    const [confirmConfig, setConfirmConfig] = useState({ show: false });

    const initialForm = {
        lrn: initialData?.lrn || "",
        last_name: "",
        first_name: "",
        middle_name: "",
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

        current_school_attended: "",
        general_average: "",
        strand_id: "",
        learning_modality: "Face-to-Face",
    };

    const [form, setForm] = useState(initialForm);
    const [files, setFiles] = useState({
        file_psa: null,
        file_form137: null,
        file_good_moral: null,
        file_diploma: null,
        file_card: null,
        file_picture: null,
    });

    useEffect(() => {
        window.history.pushState(null, document.title, window.location.href);
        const handlePopState = () => {
            window.history.pushState(
                null,
                document.title,
                window.location.href,
            );
            handleSafeClose();
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        axios
            .get("/api/public/strands")
            .then((res) => {
                const safeData = Array.isArray(res.data)
                    ? res.data
                    : res.data.data || [];
                setStrands(safeData);
            })
            .catch(() => setStrands([]));
    }, []);

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

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (
            [
                "contact_number",
                "employer_contact",
                "father_contact",
                "mother_contact",
                "guardian_contact",
            ].includes(name)
        ) {
            const numericValue = value.replace(/\D/g, "");
            if (numericValue.length > 11) return;
            setForm({ ...form, [name]: numericValue });
            return;
        }

        if (name === "date_of_birth") {
            setForm({
                ...form,
                date_of_birth: value,
                age: calculateAge(value),
            });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleFileChange = (reqId, file) => {
        if (!file) return;

        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
        ];
        if (!allowedTypes.includes(file.type)) {
            Toast.fire({
                icon: "warning",
                title: "Invalid file type! Upload PDF, JPG, or PNG only.",
            });
            const fileInput = document.getElementById(`file_${reqId}`);
            if (fileInput) fileInput.value = "";
            return;
        }

        const MAX_FILE_SIZE_MB = 2;
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            Toast.fire({
                icon: "warning",
                title: `File is too large! Maximum is ${MAX_FILE_SIZE_MB}MB.`,
            });
            const fileInput = document.getElementById(`file_${reqId}`);
            if (fileInput) fileInput.value = "";
            return;
        }

        setFiles((prev) => ({ ...prev, [reqId]: file }));
    };

    const handleClearNewFile = (reqId) => {
        setFiles((prev) => ({ ...prev, [reqId]: null }));
        const fileInput = document.getElementById(`file_${reqId}`);
        if (fileInput) fileInput.value = "";
    };

    const handleSafeClose = () => {
        setConfirmConfig({
            show: true,
            title: "CANCEL APPLICATION?",
            message:
                "Are you sure you want to close? All entered data will be lost.",
            confirmText: "YES, CLOSE IT",
            confirmColor: "#F96E5B",
            iconClass: "bi-question-circle-fill",
            isSubmitType: false,
        });
    };

    const handleNextStep = () => {
        if (formRef.current) {
            const fields = formRef.current.querySelectorAll(
                "input, select, textarea",
            );
            let isValid = true;

            for (let i = 0; i < fields.length; i++) {
                if (!fields[i].checkValidity()) {
                    fields[i].reportValidity();
                    isValid = false;
                    break;
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

        if (!isAgreed) {
            return Toast.fire({
                icon: "warning",
                title: "Please agree to the Declaration.",
            });
        }
        if (!captchaVal) {
            return Toast.fire({
                icon: "warning",
                title: "Please complete the CAPTCHA.",
            });
        }

        setConfirmConfig({
            show: true,
            title: "CONFIRM SUBMISSION?",
            message: (
                <>
                    Are you sure you want to submit the enrollment application
                    of <br />
                    <strong>
                        {form.first_name} {form.middle_name} {form.last_name}{" "}
                        {form.suffix}
                    </strong>
                    ?
                </>
            ),
            confirmText: "YES, SUBMIT",
            confirmColor: "#3F9AAE",
            iconClass: "bi-send-fill",
            isSubmitType: true,
        });
    };

    const executeSubmit = async () => {
        setConfirmConfig({ show: false });
        setLoading(true);

        try {
            const formData = new FormData();

            Object.keys(form).forEach((key) => {
                if (form[key]) formData.append(key, form[key]);
            });

            Object.keys(files).forEach((key) => {
                if (files[key]) formData.append(key, files[key]);
            });

            await axios.post("/api/public/enroll", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Toast.fire({
                icon: "success",
                title: "Application Submitted! Please check your email.",
            });
            onClose();
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: error.response?.data?.message || "Submission failed.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAction = () => {
        if (confirmConfig.isSubmitType) {
            executeSubmit();
        } else {
            setConfirmConfig({ show: false });
            onClose();
        }
    };

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
        <label className="form-label fw-bold small mb-1 font-monospace text-uppercase text-nowrap d-flex justify-content-between w-100">
            <span>
                <i className={`bi ${icon} me-1`}></i> {text}{" "}
                {required && <span className="text-danger ms-1">*</span>}
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
                            className="modal-header border-bottom border-dark flex-shrink-0 text-white"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            <h5 className="modal-title fw-bold font-monospace text-uppercase">
                                <i className="bi bi-person-lines-fill me-2"></i>
                                FRESHMEN ENROLLMENT
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={handleSafeClose}
                            ></button>
                        </div>

                        <div className="modal-body bg-light p-4 p-md-5 pb-3 pb-md-3 overflow-auto flex-grow-1 position-relative">
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

                            <div className="alert bg-white border border-2 border-dark text-dark font-monospace shadow-sm mb-4">
                                <h6 className="fw-bold mb-1 text-primary">
                                    <i className="bi bi-info-circle-fill me-2"></i>
                                    INSTRUCTIONS:
                                </h6>
                                <ul className="mb-0 small text-muted">
                                    <li>
                                        Fill out all required fields marked with
                                        a red asterisk (
                                        <span className="text-danger fw-bold fs-6">
                                            *
                                        </span>
                                        ).
                                    </li>
                                    <li>
                                        Fields without an asterisk are optional
                                        and may be left blank.
                                    </li>
                                    <li>
                                        <strong>File Uploads (Step 6):</strong>{" "}
                                        Accepted file types are PDF, JPG, JPEG,
                                        and PNG. The maximum file size allowed
                                        is <strong>2MB per document</strong>.
                                    </li>
                                </ul>
                            </div>

                            <form
                                id="enrollmentWizard"
                                ref={formRef}
                                onSubmit={handleFormSubmit}
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
                                                        icon="bi-person-bounding-box"
                                                        text="FIRST NAME"
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        name="first_name"
                                                        className="form-control border-dark"
                                                        placeholder="e.g., Juan"
                                                        value={form.first_name}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-4 col-lg">
                                                    <Label
                                                        icon="bi-person-bounding-box"
                                                        text="MIDDLE NAME"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="middle_name"
                                                        className="form-control border-dark"
                                                        placeholder="e.g., Santos"
                                                        value={form.middle_name}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="col-md-4 col-lg">
                                                    <Label
                                                        icon="bi-person-bounding-box"
                                                        text="LAST NAME"
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        name="last_name"
                                                        className="form-control border-dark"
                                                        placeholder="e.g., Dela Cruz"
                                                        value={form.last_name}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-3 col-lg-2">
                                                    <Label
                                                        icon="bi-person-badge"
                                                        text="SUFFIX"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="suffix"
                                                        className="form-control border-dark text-center"
                                                        placeholder="e.g., Jr."
                                                        value={form.suffix}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-calendar-event-fill"
                                                text="BIRTH DATE"
                                                required
                                            />
                                            <input
                                                type="date"
                                                name="date_of_birth"
                                                className="form-control border-dark"
                                                value={form.date_of_birth}
                                                onChange={handleChange}
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
                                                value={form.age}
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
                                                value={form.gender}
                                                onChange={handleChange}
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
                                                icon="bi-heart-fill"
                                                text="CIVIL STATUS"
                                                required
                                            />
                                            <select
                                                name="civil_status"
                                                className="form-select border-dark"
                                                value={form.civil_status}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="Single">
                                                    Single
                                                </option>
                                                <option value="Married">
                                                    Married
                                                </option>
                                                <option value="Seperated">
                                                    Seperated
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
                                                placeholder="e.g., Filipino"
                                                value={form.citizenship}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-bookmark-heart-fill"
                                                text="RELIGION"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="religion"
                                                className="form-control border-dark"
                                                placeholder="e.g., Roman Catholic"
                                                value={form.religion}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-hospital-fill"
                                                text="PLACE OF BIRTH"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="place_of_birth"
                                                className="form-control border-dark"
                                                placeholder="e.g., Quezon City"
                                                value={form.place_of_birth}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-12">
                                            <Label
                                                icon="bi-house-fill"
                                                text="HOME ADDRESS"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="home_address"
                                                className="form-control border-dark"
                                                placeholder="House No., Street, Brgy, City, Province"
                                                value={form.home_address}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <Label
                                                icon="bi-map-fill"
                                                text="PROVINCIAL ADDRESS"
                                            />
                                            <input
                                                type="text"
                                                name="provincial_address"
                                                className="form-control border-dark"
                                                placeholder="House No., Street, Brgy, Province"
                                                value={form.provincial_address}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: CONTACT INFO */}
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
                                                icon="bi-envelope-at-fill"
                                                text="EMAIL ADDRESS"
                                                required
                                            />
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control border-dark"
                                                placeholder="e.g., example@gmail.com"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-telephone-fill"
                                                text="CONTACT NO."
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="contact_number"
                                                className="form-control border-dark"
                                                placeholder="e.g., 09*********"
                                                minLength="11"
                                                maxLength="11"
                                                value={form.contact_number}
                                                onChange={handleChange}
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
                                                For working students only. Leave
                                                blank if not applicable.
                                            </p>
                                        </div>

                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-building-fill"
                                                text="EMPLOYER NAME"
                                            />
                                            <input
                                                type="text"
                                                name="employer_name"
                                                className="form-control border-dark"
                                                placeholder="Company Name"
                                                value={form.employer_name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-telephone-fill"
                                                text="EMPLOYER CONTACT"
                                            />
                                            <input
                                                type="text"
                                                name="employer_contact"
                                                className="form-control border-dark"
                                                placeholder="Company Contact No."
                                                minLength="11"
                                                maxLength="11"
                                                value={form.employer_contact}
                                                onChange={handleChange}
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
                                                icon="bi-person-badge"
                                                text="FULL NAME"
                                            />
                                            <input
                                                type="text"
                                                name="father_name"
                                                className="form-control border-dark"
                                                placeholder="Father's Full Name"
                                                value={form.father_name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-briefcase-fill"
                                                text="OCCUPATION"
                                            />
                                            <input
                                                type="text"
                                                name="father_occupation"
                                                className="form-control border-dark"
                                                placeholder="Job Title"
                                                value={form.father_occupation}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-telephone-fill"
                                                text="CONTACT NO."
                                            />
                                            <input
                                                type="text"
                                                name="father_contact"
                                                className="form-control border-dark"
                                                placeholder="e.g., 09*********"
                                                minLength="11"
                                                maxLength="11"
                                                value={form.father_contact}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-12 mt-3">
                                            <h6 className="fw-bold text-decoration-underline font-monospace text-primary">
                                                MOTHER'S INFO
                                            </h6>
                                        </div>
                                        <div className="col-md-6">
                                            <Label
                                                icon="bi-person-badge"
                                                text="FULL NAME"
                                            />
                                            <input
                                                type="text"
                                                name="mother_name"
                                                className="form-control border-dark"
                                                placeholder="Mother's Full Name"
                                                value={form.mother_name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-briefcase-fill"
                                                text="OCCUPATION"
                                            />
                                            <input
                                                type="text"
                                                name="mother_occupation"
                                                className="form-control border-dark"
                                                placeholder="Job Title"
                                                value={form.mother_occupation}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-telephone-fill"
                                                text="CONTACT NO."
                                            />
                                            <input
                                                type="text"
                                                name="mother_contact"
                                                className="form-control border-dark"
                                                placeholder="e.g., 09*********"
                                                minLength="11"
                                                maxLength="11"
                                                value={form.mother_contact}
                                                onChange={handleChange}
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
                                                icon="bi-person-check-fill"
                                                text="FULL NAME"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="guardian_name"
                                                className="form-control border-dark"
                                                placeholder="Guardian's Full Name"
                                                value={form.guardian_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-briefcase-fill"
                                                text="OCCUPATION"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="guardian_occupation"
                                                className="form-control border-dark"
                                                placeholder="Job Title"
                                                value={form.guardian_occupation}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-telephone-fill"
                                                text="CONTACT NO."
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="guardian_contact"
                                                className="form-control border-dark"
                                                placeholder="e.g., 09*********"
                                                minLength="11"
                                                maxLength="11"
                                                value={form.guardian_contact}
                                                onChange={handleChange}
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

                                        <div className="col-md-9">
                                            <Label
                                                icon="bi-building-fill"
                                                text="PREVIOUS SCHOOL"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="current_school_attended"
                                                className="form-control border-dark"
                                                placeholder="Name of last school attended"
                                                value={
                                                    form.current_school_attended
                                                }
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <Label
                                                icon="bi-bar-chart-fill"
                                                text="GEN. AVERAGE"
                                            />
                                            <input
                                                type="number"
                                                name="general_average"
                                                className="form-control border-dark text-center fw-bold"
                                                placeholder="00.00"
                                                min="75"
                                                max="100"
                                                step="0.01"
                                                value={form.general_average}
                                                onChange={handleChange}
                                            />
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
                                                value={form.strand_id}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">
                                                    -- Select Strand --
                                                </option>
                                                {strands.map((s) => (
                                                    <option
                                                        key={s.id}
                                                        value={s.id}
                                                    >
                                                        {s.code} -{" "}
                                                        {s.description}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-laptop-fill"
                                                text="LEARNING MODALITY"
                                                required
                                            />
                                            <select
                                                name="learning_modality"
                                                className="form-select border-dark"
                                                value={form.learning_modality}
                                                onChange={handleChange}
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
                                        <div className="col-md-4">
                                            <Label
                                                icon="bi-calendar-date-fill"
                                                text="SCHOOL YEAR"
                                                required
                                            />
                                            <input
                                                type="text"
                                                className="form-control border-dark fw-bold bg-light text-center"
                                                value={
                                                    settings?.school_year || ""
                                                }
                                                readOnly
                                            />
                                        </div>

                                        <div className="col-md-4 mt-3">
                                            <Label
                                                icon="bi-upc-scan"
                                                text="VERIFIED LRN"
                                                required
                                            />
                                            <input
                                                type="text"
                                                className="form-control border-dark fw-bold bg-warning bg-opacity-10 text-center"
                                                value={form.lrn}
                                                readOnly
                                            />
                                        </div>
                                        <div className="col-md-4 mt-3">
                                            <Label
                                                icon="bi-bar-chart-steps"
                                                text="GRADE LEVEL"
                                                required
                                            />
                                            <input
                                                type="text"
                                                className="form-control border-dark fw-bold bg-light text-center"
                                                value="11"
                                                readOnly
                                            />
                                        </div>
                                        <div className="col-md-4 mt-3">
                                            <Label
                                                icon="bi-clock-fill"
                                                text="TERM"
                                                required
                                            />
                                            <input
                                                type="text"
                                                className="form-control border-dark fw-bold bg-light text-center"
                                                value="1st"
                                                readOnly
                                            />
                                        </div>

                                        <div className="col-md-12 mt-1">
                                            <div className="form-text small text-muted font-monospace fst-italic text-center">
                                                <i className="bi bi-info-circle-fill"></i>{" "}
                                                This LRN was verified during the
                                                New Student Check step. Grade
                                                Level, Term, and School Year are
                                                automatically assigned.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 6: REQUIREMENTS & REVIEW */}
                                {step === 6 && (
                                    <div className="row g-3 fade-in">
                                        <div className="col-12">
                                            <h5 className="fw-black border-bottom border-dark pb-2 mb-3 font-monospace text-dark">
                                                <i className="bi bi-folder-check me-2"></i>
                                                6. REQUIREMENTS & REVIEW
                                            </h5>
                                        </div>

                                        <div className="col-12 text-center">
                                            <h6 className="fw-bold font-monospace mb-3 border-bottom border-dark pb-2 text-primary">
                                                <i className="bi bi-cloud-arrow-up-fill me-2"></i>
                                                UPLOAD SOFT COPIES (OPTIONAL)
                                            </h6>
                                            <div
                                                className="row g-3 text-start mx-auto"
                                                style={{ maxWidth: "800px" }}
                                            >
                                                {[
                                                    {
                                                        id: "file_psa",
                                                        label: "PSA Birth Certificate",
                                                    },
                                                    {
                                                        id: "file_form137",
                                                        label: "Form 137 / SF10",
                                                    },
                                                    {
                                                        id: "file_good_moral",
                                                        label: "Certificate of Good Moral",
                                                    },
                                                    {
                                                        id: "file_diploma",
                                                        label: "Grade 10 Diploma",
                                                    },
                                                    {
                                                        id: "file_card",
                                                        label: "Report Card (F138)",
                                                    },
                                                    {
                                                        id: "file_picture",
                                                        label: "2x2 Picture (2pcs)",
                                                    },
                                                ].map((req) => {
                                                    const newFile =
                                                        files[req.id];

                                                    return (
                                                        <div
                                                            className="col-md-6"
                                                            key={req.id}
                                                        >
                                                            <div className="p-3 border border-dark bg-white d-inline-block w-100 shadow-sm h-100">
                                                                <label className="fw-bold small font-monospace d-block mb-2 text-uppercase text-muted">
                                                                    {req.label}
                                                                </label>

                                                                <input
                                                                    type="file"
                                                                    id={`file_${req.id}`}
                                                                    className="form-control form-control-sm border-dark rounded-0 font-monospace mb-2"
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
                                                                />

                                                                {newFile && (
                                                                    <div className="d-flex justify-content-between align-items-center bg-white border border-2 border-dark p-3 font-monospace mt-2 shadow-sm text-start">
                                                                        <div className="d-flex align-items-center overflow-hidden">
                                                                            <i className="bi bi-file-earmark-check-fill text-success fs-2 me-3"></i>
                                                                            <div>
                                                                                <div
                                                                                    className="text-truncate fw-bold text-dark"
                                                                                    style={{
                                                                                        maxWidth:
                                                                                            "150px",
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        newFile.name
                                                                                    }
                                                                                </div>
                                                                                <div className="text-muted small">
                                                                                    {(
                                                                                        newFile.size /
                                                                                        1024 /
                                                                                        1024
                                                                                    ).toFixed(
                                                                                        2,
                                                                                    )}{" "}
                                                                                    MB
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm border border-dark border-2 fw-bold btn-press-retro px-3 ms-2"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    "#F96E5B",
                                                                            }}
                                                                            onClick={() =>
                                                                                handleClearNewFile(
                                                                                    req.id,
                                                                                )
                                                                            }
                                                                            title="Remove File"
                                                                        >
                                                                            <i className="bi bi-trash-fill text-white"></i>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="col-12 text-center mt-5">
                                            <h6 className="fw-bold font-monospace mb-3 border-bottom border-dark pb-2 text-danger">
                                                <i className="bi bi-shield-check me-2"></i>
                                                DECLARATION & VERIFICATION
                                            </h6>
                                            <div
                                                className="alert alert-warning border-dark text-start rounded-0 mb-4 p-3 shadow-sm mx-auto font-monospace text-dark"
                                                style={{ maxWidth: "600px" }}
                                            >
                                                <div className="form-check d-flex align-items-center gap-2 m-0">
                                                    <input
                                                        className="form-check-input border-dark mt-0"
                                                        type="checkbox"
                                                        id="agree"
                                                        checked={isAgreed}
                                                        onChange={(e) =>
                                                            setIsAgreed(
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                        style={{
                                                            transform:
                                                                "scale(1.3)",
                                                            cursor: "pointer",
                                                        }}
                                                    />
                                                    <label
                                                        className="form-check-label fw-bold small"
                                                        htmlFor="agree"
                                                        style={{
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        I certify that all
                                                        information and
                                                        documents provided are
                                                        true and correct. I
                                                        understand that false
                                                        information is grounds
                                                        for disqualification.
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-center mb-4">
                                                <ReCAPTCHA
                                                    sitekey={
                                                        import.meta.env
                                                            .VITE_RECAPTCHA_SITE_KEY
                                                    }
                                                    onChange={(val) =>
                                                        setCaptchaVal(val)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="border-top border-dark flex-shrink-0 d-flex justify-content-between gap-2 mt-4 pt-3">
                                    <button
                                        type="button"
                                        className="btn btn-dark fw-bold px-4 btn-press-retro"
                                        onClick={handleSafeClose}
                                    >
                                        CANCEL
                                    </button>
                                    <div>
                                        {step > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-dark border-2 fw-bold px-4 me-2 btn-press-retro"
                                                onClick={prevStep}
                                            >
                                                <i className="bi bi-arrow-left"></i>{" "}
                                                BACK
                                            </button>
                                        )}
                                        {step < 6 && (
                                            <button
                                                type="button"
                                                className="btn btn-dark border-2 fw-bold px-4 btn-press-retro"
                                                onClick={handleNextStep}
                                            >
                                                NEXT{" "}
                                                <i className="bi bi-arrow-right"></i>
                                            </button>
                                        )}
                                        {step === 6 && (
                                            <button
                                                form="enrollmentWizard"
                                                type="submit"
                                                className="btn border-2 border-dark fw-bold px-4 btn-press-retro text-white"
                                                style={{
                                                    backgroundColor: "#3F9AAE",
                                                }}
                                            >
                                                SUBMIT
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <Loading show={loading} message="SUBMITTING APPLICATION..." />
            <UserConfirmation
                show={confirmConfig.show}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                confirmColor={confirmConfig.confirmColor}
                iconClass={confirmConfig.iconClass}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={handleConfirmAction}
            />
        </>
    );
}
