import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Toast from "../utils/toast";
import moment from "moment";
import { Modal } from "react-bootstrap";

export default function StudentModal({
    show,
    type,
    selectedStudent,
    strands,
    onClose,
    onSuccess,
    onSuccessEnroll, // NEW CALLBACK PARA SA COR TRIGGER
    apiPrefix = "/api",
}) {
    const isReadOnly = type === "view";
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [sectionsList, setSectionsList] = useState([]); // Master list for sections
    const [activeSettings, setActiveSettings] = useState({
        term: "1st",
        school_year:
            new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    });

    const initialForm = {
        lrn: "",
        last_name: "",
        first_name: "",
        middle_name: "",
        suffix: "",
        date_of_birth: "",
        gender: "Male",
        place_of_birth: "",
        citizenship: "Filipino",
        civil_status: "Single",
        religion: "Roman Catholic",
        home_address: "",
        provincial_address: "",
        email: "",
        contact_number: "",
        current_school_attended: "",
        general_average: "",
        strand_id: "",
        grade_level: "11",
        section_id: "",
        term: "",
        school_year: "",
        learning_modality: "Face-to-Face",
        is_employed: false,
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
        status: "pending", // NEW DEFAULT STATUS
        requirements: {
            psa: false,
            form137: false,
            good_moral: false,
            diploma: false,
            card: false,
            picture: false,
        },
    };

    const [form, setForm] = useState(initialForm);
    const [file2x2, setFile2x2] = useState(null);
    const [fileEsign, setFileEsign] = useState(null);

    // LIVE AGE CALCULATOR HELPER
    const calculateAge = (dob) => {
        if (!dob) return "";
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        if (
            today.getMonth() < birth.getMonth() ||
            (today.getMonth() === birth.getMonth() &&
                today.getDate() < birth.getDate())
        ) {
            age--;
        }
        return age >= 0 ? age : 0;
    };

    // FETCH INIT SETTINGS & SECTIONS
    useEffect(() => {
        const fetchInit = async () => {
            try {
                const setRes = await axios
                    .get("/api/settings")
                    .catch(() => ({ data: null }));
                if (setRes.data)
                    setActiveSettings(
                        Array.isArray(setRes.data)
                            ? setRes.data[0]
                            : setRes.data,
                    );
            } catch (e) {}
        };

        const fetchSections = async () => {
            try {
                const res = await axios.get("/api/sections", {
                    params: { limit: 1000 },
                });
                setSectionsList(res.data.data ? res.data.data : res.data);
            } catch (e) {}
        };

        if (show) {
            fetchInit();
            fetchSections(); // ALWAYS FETCH SECTIONS FOR BOTH CREATE AND EDIT
            setStep(1);
            setFile2x2(null);
            setFileEsign(null);
        }
    }, [show]);

    // POPULATE DATA
    useEffect(() => {
        if ((type === "edit" || type === "view") && selectedStudent) {
            let parsedReqs = initialForm.requirements;
            if (selectedStudent.requirements) {
                parsedReqs =
                    typeof selectedStudent.requirements === "string"
                        ? JSON.parse(selectedStudent.requirements)
                        : selectedStudent.requirements;
            }
            setForm({
                ...initialForm,
                ...selectedStudent,
                date_of_birth: selectedStudent.date_of_birth
                    ? moment(selectedStudent.date_of_birth).format("YYYY-MM-DD")
                    : "",
                learning_modality:
                    selectedStudent.learning_modality || "Face-to-Face",
                requirements: { ...initialForm.requirements, ...parsedReqs },
                school_year:
                    selectedStudent.school_year || activeSettings.school_year,
                term: selectedStudent.term || activeSettings.term,
                section_id: selectedStudent.section_id || "",
                status: selectedStudent.status || "pending",
                is_employed: !!selectedStudent.employer_name,
            });
        } else if (type === "create") {
            setForm({
                ...initialForm,
                term: activeSettings.term,
                school_year: activeSettings.school_year,
            });
        }
    }, [show, selectedStudent, type, activeSettings]);

    const handleChange = (e) => {
        const { name, value, checked, type: inputType } = e.target;

        // Auto-format phone numbers (0900-000-0000)
        if (
            [
                "contact_number",
                "father_contact",
                "mother_contact",
                "guardian_contact",
                "employer_contact",
            ].includes(name)
        ) {
            let val = value.replace(/[^\d]/g, "");
            if (val.length > 11) val = val.slice(0, 11);

            let formatted = val;
            if (val.length > 4 && val.length <= 7) {
                formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
            } else if (val.length > 7) {
                formatted = `${val.slice(0, 4)}-${val.slice(4, 7)}-${val.slice(7)}`;
            }
            setForm((prev) => ({ ...prev, [name]: formatted }));
            return;
        }

        // Strict input filters
        if (name === "school_year") {
            let val = value.replace(/[^\d-]/g, "");
            if (val.length > 9) val = val.slice(0, 9);
            setForm((prev) => ({ ...prev, [name]: val }));
            return;
        }

        if (name === "lrn") {
            let val = value.replace(/\D/g, "");
            if (val.length > 12) val = val.slice(0, 12);
            setForm((prev) => ({ ...prev, [name]: val }));
            return;
        }

        if (name.startsWith("req_")) {
            setForm((prev) => ({
                ...prev,
                requirements: {
                    ...prev.requirements,
                    [name.replace("req_", "")]: checked,
                },
            }));
        } else if (inputType === "checkbox") {
            setForm((prev) => ({ ...prev, [name]: checked }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleFile = (e, type) => {
        if (type === "2x2") setFile2x2(e.target.files[0]);
        if (type === "esign") setFileEsign(e.target.files[0]);
    };

    // WIZARD VALIDATION
    const validateCurrentStep = () => {
        if (isReadOnly) return true;
        let errors = [];

        if (step === 1) {
            if (!form.last_name) errors.push("Last Name");
            if (!form.first_name) errors.push("First Name");
            if (!form.date_of_birth) errors.push("Date of Birth");
            if (!form.gender) errors.push("Gender");
            if (!form.civil_status) errors.push("Civil Status");
            if (!form.religion) errors.push("Religion");
            if (!form.place_of_birth) errors.push("Place of Birth");
            if (!form.citizenship) errors.push("Citizenship");
            if (!form.home_address) errors.push("Home Address");
            if (!form.email) errors.push("Email Address");

            if (!form.contact_number) errors.push("Mobile Number");
            else if (!/^09\d{2}-\d{3}-\d{4}$/.test(form.contact_number))
                errors.push("Mobile Number must be 0900-000-0000 format");
        } else if (step === 2) {
            if (!form.lrn) errors.push("LRN");
            else if (form.lrn.length !== 12)
                errors.push("LRN must be exactly 12 digits");

            if (!form.current_school_attended)
                errors.push("Last School Attended");
            if (!form.strand_id) errors.push("Strand");
            if (!form.term) errors.push("Term");

            if (!form.school_year) errors.push("School Year");
            else if (!/^\d{4}-\d{4}$/.test(form.school_year))
                errors.push("School Year must follow YYYY-YYYY format");

            if (!form.general_average) errors.push("General Average");
            else if (form.general_average < 75 || form.general_average > 100)
                errors.push("General Average must be between 75 and 100");
        } else if (step === 3) {
            if (!form.guardian_name) errors.push("Guardian's Name");
            if (!form.guardian_occupation) errors.push("Guardian's Occupation");

            if (!form.guardian_contact) errors.push("Guardian's Contact");
            else if (!/^09\d{2}-\d{3}-\d{4}$/.test(form.guardian_contact))
                errors.push("Guardian's Contact must be 0900-000-0000 format");

            if (
                form.father_contact &&
                !/^09\d{2}-\d{3}-\d{4}$/.test(form.father_contact)
            )
                errors.push("Father's Contact must be 0900-000-0000 format");
            if (
                form.mother_contact &&
                !/^09\d{2}-\d{3}-\d{4}$/.test(form.mother_contact)
            )
                errors.push("Mother's Contact must be 0900-000-0000 format");
            if (
                form.employer_contact &&
                !/^09\d{2}-\d{3}-\d{4}$/.test(form.employer_contact)
            )
                errors.push("Employer's Contact must be 0900-000-0000 format");
        } else if (step === 4) {
            if (!form.status) errors.push("Student Status");
        }

        if (errors.length > 0) {
            Swal.fire({
                title: "VALIDATION FAILED",
                html: `<ul class='text-start mt-3 mb-0'><li>${errors.join("</li><li>")}</li></ul>`,
                icon: "warning",
                confirmButtonColor: "#2d3436",
                customClass: { popup: "card-retro" },
            });
            return false;
        }
        return true;
    };

    const nextStep = (e) => {
        if (e) e.preventDefault();
        if (validateCurrentStep()) {
            setStep(step + 1);
            document.querySelector(".modal")?.scrollTo(0, 0);
        }
    };

    const prevStep = (e) => {
        if (e) e.preventDefault();
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateCurrentStep()) return;

        setIsLoading(true);

        const formData = new FormData();
        Object.keys(form).forEach((key) => {
            if (key === "requirements") {
                formData.append(key, JSON.stringify(form[key]));
            } else if (
                key === "age" ||
                key === "2x2_picture" ||
                key === "e_sign"
            ) {
                // ⭐ SENIOR DEV FIX: I-ignore ang mga keys na 'to.
                // Ang mga bagong files ay i-a-append natin sa susunod na line.
            } else if (form[key] !== null && form[key] !== undefined) {
                formData.append(key, form[key]);
            }
        });

        // Dito lang mag-a-append kung totoong may in-upload na BAGONG file
        if (file2x2) formData.append("2x2_picture", file2x2);
        if (fileEsign) formData.append("e_sign", fileEsign);
        if (type === "edit") formData.append("_method", "PUT");

        try {
            let res;
            if (type === "create") {
                res = await axios.post(`${apiPrefix}/students`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                Toast.fire({
                    icon: "success",
                    title: "Student Record Created!",
                });
            } else {
                res = await axios.post(
                    `${apiPrefix}/students/${selectedStudent.id}`,
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    },
                );
                Toast.fire({
                    icon: "success",
                    title: "Student Record Updated!",
                });
            }

            // CHECK IF STATUS IS ENROLLED TO TRIGGER COR MODAL
            if (form.status === "enrolled" && onSuccessEnroll) {
                onSuccessEnroll(res.data.student);
            } else {
                onSuccess();
            }
            onClose();
        } catch (error) {
            let msg = error.response?.data?.message || "Action Failed";
            Toast.fire({ icon: "error", title: msg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSafeClose = () => {
        if (isReadOnly) return onClose();
        Swal.fire({
            title: "CANCEL OPERATION?",
            text: "Unsaved changes will be lost.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "YES, CLOSE IT",
            cancelButtonText: "CONTINUE EDITING",
            background: "#fff",
            color: "#000",
            customClass: {
                popup: "card-retro",
                confirmButton: "btn-retro bg-danger border-dark",
                cancelButton: "btn-retro bg-dark border-dark",
            },
        }).then((result) => {
            if (result.isConfirmed) onClose();
        });
    };

    // UI Helpers
    const Indicator = ({ num, label }) => (
        <div
            className={`d-flex flex-column align-items-center ${step >= num ? "text-dark" : "text-muted"}`}
            style={{ flex: 1 }}
        >
            <div
                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold border border-2 border-dark mb-1 ${step >= num ? "bg-warning" : "bg-light"}`}
                style={{ width: "35px", height: "35px" }}
            >
                {num}
            </div>
            <small
                className="fw-bold d-none d-md-block"
                style={{ fontSize: "0.7rem" }}
            >
                {label}
            </small>
        </div>
    );

    const Label = ({ text, required = false }) => (
        <label className="form-label fw-bold small mb-1 mt-2">
            {text} {required && <span className="text-danger">*</span>}
        </label>
    );

    if (!show) return null;

    return (
        <Modal
            show={show}
            onHide={handleSafeClose}
            backdrop="static"
            keyboard={false}
            size="xl"
            centered
            scrollable={true}
            fullscreen="sm-down"
        >
            <div className="modal-content modal-retro-content font-monospace">
                {/* HEADER */}
                <div className="modal-header-retro d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <i
                            className={`bi ${type === "create" ? "bi-person-plus-fill" : type === "edit" ? "bi-pencil-square" : "bi-eye-fill"} fs-4`}
                        ></i>
                        <h5 className="fw-black m-0 ls-1">
                            {type === "create"
                                ? "NEW STUDENT"
                                : type === "edit"
                                  ? "EDIT STUDENT"
                                  : "VIEW STUDENT"}
                        </h5>
                    </div>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={handleSafeClose}
                    ></button>
                </div>

                {/* BODY */}
                <div className="modal-body p-4 p-md-5 bg-white">
                    {/* STEPPER */}
                    <div className="d-flex justify-content-between mb-4 position-relative px-md-5">
                        <div
                            className="position-absolute top-50 start-0 w-100 border-top border-2 border-dark"
                            style={{ zIndex: 0 }}
                        ></div>
                        <div
                            className="position-relative w-100 d-flex justify-content-between"
                            style={{ zIndex: 1 }}
                        >
                            <Indicator num={1} label="PERSONAL" />
                            <Indicator num={2} label="ACADEMIC & FILES" />
                            <Indicator num={3} label="FAMILY" />
                            <Indicator num={4} label="STATUS & REQS" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} id="studentForm">
                        <fieldset disabled={isLoading || isReadOnly}>
                            {/* --- STEP 1: PERSONAL INFORMATION --- */}
                            {step === 1 && (
                                <div className="row g-3 fade-in">
                                    <h4 className="fw-black border-bottom border-dark pb-2 mb-3">
                                        <i className="bi bi-person-circle me-2"></i>
                                        PERSONAL INFORMATION
                                    </h4>

                                    <div className="col-md-4">
                                        <Label text="LAST NAME" required />
                                        <input
                                            className="form-control"
                                            name="last_name"
                                            value={form.last_name}
                                            onChange={handleChange}
                                            placeholder="e.g. Dela Cruz"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <Label text="FIRST NAME" required />
                                        <input
                                            className="form-control"
                                            name="first_name"
                                            value={form.first_name}
                                            onChange={handleChange}
                                            placeholder="e.g. Juan"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <Label text="MIDDLE NAME" />
                                        <input
                                            className="form-control"
                                            name="middle_name"
                                            value={form.middle_name}
                                            onChange={handleChange}
                                            placeholder="e.g. Santos (Optional)"
                                        />
                                    </div>
                                    <div className="col-md-1">
                                        <Label text="SUFFIX" />
                                        <input
                                            className="form-control"
                                            name="suffix"
                                            value={form.suffix}
                                            onChange={handleChange}
                                            placeholder="e.g. Jr."
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <Label text="DATE OF BIRTH" required />
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="date_of_birth"
                                            value={form.date_of_birth}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-1">
                                        <Label text="AGE" />
                                        <input
                                            className="form-control bg-light text-muted"
                                            value={calculateAge(
                                                form.date_of_birth,
                                            )}
                                            placeholder="0"
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <Label text="GENDER" required />
                                        <select
                                            className="form-select"
                                            name="gender"
                                            value={form.gender}
                                            onChange={handleChange}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">
                                                Female
                                            </option>
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <Label text="CIVIL STATUS" required />
                                        <select
                                            className="form-select"
                                            name="civil_status"
                                            value={form.civil_status}
                                            onChange={handleChange}
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
                                        <Label text="RELIGION" required />
                                        <input
                                            className="form-control"
                                            name="religion"
                                            value={form.religion}
                                            onChange={handleChange}
                                            placeholder="e.g. Roman Catholic"
                                            required
                                        />
                                    </div>

                                    <div className="col-md-8">
                                        <Label text="PLACE OF BIRTH" required />
                                        <input
                                            className="form-control"
                                            name="place_of_birth"
                                            value={form.place_of_birth}
                                            onChange={handleChange}
                                            placeholder="e.g. Quezon City"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <Label text="CITIZENSHIP" required />
                                        <input
                                            className="form-control"
                                            name="citizenship"
                                            value={form.citizenship}
                                            onChange={handleChange}
                                            placeholder="e.g. Filipino"
                                            required
                                        />
                                    </div>

                                    <div className="col-12">
                                        <Label text="HOME ADDRESS" required />
                                        <input
                                            className="form-control"
                                            name="home_address"
                                            value={form.home_address}
                                            onChange={handleChange}
                                            placeholder="House No., Street, Brgy, City, Province"
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <Label text="PROVINCIAL ADDRESS" />
                                        <input
                                            className="form-control"
                                            name="provincial_address"
                                            value={form.provincial_address}
                                            onChange={handleChange}
                                            placeholder="(Optional) If different from home address"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <Label text="STUDENT EMAIL" required />
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="example@email.com"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <Label text="MOBILE NUMBER" required />
                                        <input
                                            className="form-control fw-bold"
                                            name="contact_number"
                                            value={form.contact_number}
                                            onChange={handleChange}
                                            placeholder="0900-000-0000"
                                            required
                                            maxLength="13"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* --- STEP 2: ACADEMIC & FILES --- */}
                            {step === 2 && (
                                <div className="row g-3 fade-in">
                                    <h4 className="fw-black border-bottom border-dark pb-2 mb-3">
                                        <i className="bi bi-mortarboard-fill me-2"></i>
                                        ACADEMIC & FILES
                                    </h4>

                                    <div className="col-md-4">
                                        <Label text="LRN" required />
                                        <input
                                            className="form-control"
                                            name="lrn"
                                            value={form.lrn}
                                            onChange={handleChange}
                                            required
                                            placeholder="12-digit LRN"
                                        />
                                    </div>
                                    <div className="col-md-8">
                                        <Label
                                            text="LAST SCHOOL ATTENDED"
                                            required
                                        />
                                        <input
                                            className="form-control"
                                            name="current_school_attended"
                                            value={form.current_school_attended}
                                            onChange={handleChange}
                                            placeholder="Name of previous school"
                                            required
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <Label text="SCHOOL YEAR" required />
                                        <input
                                            className={`form-control ${type === "create" ? "bg-light text-muted" : "fw-bold"}`}
                                            name="school_year"
                                            value={form.school_year}
                                            onChange={handleChange}
                                            readOnly={type === "create"}
                                            placeholder="YYYY-YYYY"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <Label text="TERM" required />
                                        {type === "create" ? (
                                            <input
                                                className="form-control bg-light text-muted"
                                                name="term"
                                                value={form.term}
                                                readOnly
                                                placeholder="e.g. 1st Term"
                                            />
                                        ) : (
                                            <select
                                                className="form-select fw-bold"
                                                name="term"
                                                value={form.term}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">
                                                    -- Select Term --
                                                </option>
                                                <option value="1st">1st</option>
                                                <option value="2nd">2nd</option>
                                                <option value="3rd">3rd</option>
                                            </select>
                                        )}
                                    </div>
                                    <div className="col-md-4">
                                        <Label text="GRADE LEVEL" required />
                                        <select
                                            className="form-select"
                                            name="grade_level"
                                            value={form.grade_level}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="11">Grade 11</option>
                                            <option value="12">Grade 12</option>
                                        </select>
                                    </div>

                                    <div className="col-md-5">
                                        <Label text="STRAND" required />
                                        <select
                                            className="form-select"
                                            name="strand_id"
                                            value={form.strand_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">
                                                -- Select Strand --
                                            </option>
                                            {strands.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.code} - {s.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <Label
                                            text="LEARNING MODALITY"
                                            required
                                        />
                                        <select
                                            className="form-select"
                                            name="learning_modality"
                                            value={form.learning_modality}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="Face-to-Face">
                                                Face-to-Face (Regular)
                                            </option>
                                            <option value="Modular">
                                                Modular (Distance Learning)
                                            </option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <Label
                                            text="GENERAL AVERAGE"
                                            required
                                        />
                                        <input
                                            type="number"
                                            min="75"
                                            max="100"
                                            step="0.01"
                                            className="form-control fw-bold"
                                            name="general_average"
                                            value={form.general_average}
                                            onChange={handleChange}
                                            placeholder="e.g. 85.00"
                                            required
                                        />
                                    </div>

                                    {/* SECTION DROPDOWN FOR BOTH CREATE & EDIT */}
                                    <div className="col-md-12 mt-3">
                                        <div className="p-3 border border-dark rounded-0 bg-warning bg-opacity-10">
                                            <Label text="ASSIGN SECTION" />
                                            <select
                                                className="form-select border-dark fw-bold"
                                                name="section_id"
                                                value={form.section_id || ""}
                                                onChange={handleChange}
                                            >
                                                <option value="">
                                                    -- Unassigned --
                                                </option>
                                                {sectionsList
                                                    .filter(
                                                        (s) =>
                                                            s.strand_id ===
                                                                form.strand_id &&
                                                            s.grade_level ==
                                                                form.grade_level,
                                                    )
                                                    .map((s) => {
                                                        const enrolled =
                                                            s.enrolled_count ||
                                                            0;
                                                        const capacity =
                                                            s.capacity || 40;
                                                        const isFull =
                                                            enrolled >=
                                                            capacity;
                                                        const isCurrent =
                                                            form.section_id ===
                                                            s.id;
                                                        return (
                                                            <option
                                                                key={s.id}
                                                                value={s.id}
                                                                disabled={
                                                                    isFull &&
                                                                    !isCurrent
                                                                }
                                                            >
                                                                {s.name} -
                                                                Enrolled:{" "}
                                                                {enrolled}/
                                                                {capacity}{" "}
                                                                {isFull &&
                                                                !isCurrent
                                                                    ? "(FULL)"
                                                                    : ""}
                                                            </option>
                                                        );
                                                    })}
                                            </select>
                                            <small className="text-muted fst-italic mt-1 d-block">
                                                Options are filtered based on
                                                the selected Grade Level and
                                                Strand. Full sections are
                                                automatically disabled.
                                            </small>
                                        </div>
                                    </div>

                                    <div className="col-md-6 mt-4">
                                        <div className="p-3 border border-dark rounded-0 bg-light">
                                            <Label text="2X2 PICTURE (JPG/PNG, Max 2MB)" />
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png"
                                                className="form-control mt-2"
                                                onChange={(e) =>
                                                    handleFile(e, "2x2")
                                                }
                                            />
                                            {type !== "create" &&
                                                selectedStudent?.[
                                                    "2x2_picture"
                                                ] && (
                                                    <div className="mt-2 text-truncate">
                                                        <small className="text-success fw-bold d-block mb-1">
                                                            <i className="bi bi-check-circle-fill"></i>{" "}
                                                            Current File:
                                                        </small>
                                                        <a
                                                            href={`/storage/${selectedStudent["2x2_picture"]}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="small font-monospace text-primary text-decoration-underline"
                                                        >
                                                            {selectedStudent[
                                                                "2x2_picture"
                                                            ]
                                                                .split("/")
                                                                .pop()}
                                                        </a>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                    <div className="col-md-6 mt-4">
                                        <div className="p-3 border border-dark rounded-0 bg-light">
                                            <Label text="E-SIGNATURE (PNG, Max 2MB)" />
                                            <input
                                                type="file"
                                                accept=".png"
                                                className="form-control mt-2"
                                                onChange={(e) =>
                                                    handleFile(e, "esign")
                                                }
                                            />
                                            {type !== "create" &&
                                                selectedStudent?.e_sign && (
                                                    <div className="mt-2 text-truncate">
                                                        <small className="text-success fw-bold d-block mb-1">
                                                            <i className="bi bi-check-circle-fill"></i>{" "}
                                                            Current File:
                                                        </small>
                                                        <a
                                                            href={`/storage/${selectedStudent["e_sign"]}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="small font-monospace text-primary text-decoration-underline"
                                                        >
                                                            {selectedStudent[
                                                                "e_sign"
                                                            ]
                                                                .split("/")
                                                                .pop()}
                                                        </a>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- STEP 3: FAMILY & WORK --- */}
                            {step === 3 && (
                                <div className="row g-3 fade-in">
                                    <h4 className="fw-black border-bottom border-dark pb-2 mb-3">
                                        <i className="bi bi-people-fill me-2"></i>{" "}
                                        FAMILY & EMPLOYMENT
                                    </h4>

                                    <div className="col-12">
                                        <div className="form-check p-2 border border-dark bg-light d-inline-block px-3">
                                            <input
                                                className="form-check-input border-dark"
                                                type="checkbox"
                                                id="isEmployed"
                                                name="is_employed"
                                                checked={form.is_employed}
                                                onChange={handleChange}
                                            />
                                            <label
                                                className="form-check-label fw-bold small ms-2"
                                                htmlFor="isEmployed"
                                            >
                                                STUDENT IS CURRENTLY EMPLOYED
                                            </label>
                                        </div>
                                    </div>
                                    {form.is_employed && (
                                        <>
                                            <div className="col-md-6">
                                                <Label text="EMPLOYER NAME" />
                                                <input
                                                    className="form-control"
                                                    name="employer_name"
                                                    value={form.employer_name}
                                                    onChange={handleChange}
                                                    placeholder="Company Name"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <Label text="EMPLOYER CONTACT" />
                                                <input
                                                    className="form-control"
                                                    name="employer_contact"
                                                    value={
                                                        form.employer_contact
                                                    }
                                                    onChange={handleChange}
                                                    placeholder="0900-000-0000"
                                                    maxLength="13"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="col-12">
                                        <h6 className="fw-bold text-decoration-underline mt-3">
                                            FATHER'S INFORMATION
                                        </h6>
                                    </div>
                                    <div className="col-md-6">
                                        <Label text="FULL NAME" />
                                        <input
                                            className="form-control"
                                            name="father_name"
                                            value={form.father_name}
                                            onChange={handleChange}
                                            placeholder="Father's Full Name"
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <Label text="OCCUPATION" />
                                        <input
                                            className="form-control"
                                            name="father_occupation"
                                            value={form.father_occupation}
                                            onChange={handleChange}
                                            placeholder="Job Title"
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <Label text="CONTACT NO." />
                                        <input
                                            className="form-control"
                                            name="father_contact"
                                            value={form.father_contact}
                                            onChange={handleChange}
                                            placeholder="0900-000-0000"
                                            maxLength="13"
                                        />
                                    </div>

                                    <div className="col-12">
                                        <h6 className="fw-bold text-decoration-underline mt-3">
                                            MOTHER'S INFORMATION
                                        </h6>
                                    </div>
                                    <div className="col-md-6">
                                        <Label text="FULL NAME" />
                                        <input
                                            className="form-control"
                                            name="mother_name"
                                            value={form.mother_name}
                                            onChange={handleChange}
                                            placeholder="Mother's Full Name"
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <Label text="OCCUPATION" />
                                        <input
                                            className="form-control"
                                            name="mother_occupation"
                                            value={form.mother_occupation}
                                            onChange={handleChange}
                                            placeholder="Job Title"
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <Label text="CONTACT NO." />
                                        <input
                                            className="form-control"
                                            name="mother_contact"
                                            value={form.mother_contact}
                                            onChange={handleChange}
                                            placeholder="0900-000-0000"
                                            maxLength="13"
                                        />
                                    </div>

                                    <div className="col-12">
                                        <h6 className="fw-bold text-decoration-underline mt-3">
                                            GUARDIAN'S INFORMATION
                                        </h6>
                                    </div>
                                    <div className="col-md-6">
                                        <Label text="FULL NAME" required />
                                        <input
                                            className="form-control"
                                            name="guardian_name"
                                            value={form.guardian_name}
                                            onChange={handleChange}
                                            placeholder="Guardian's Full Name"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <Label text="OCCUPATION" required />
                                        <input
                                            className="form-control"
                                            name="guardian_occupation"
                                            value={form.guardian_occupation}
                                            onChange={handleChange}
                                            placeholder="Job Title"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <Label text="CONTACT NO." required />
                                        <input
                                            className="form-control fw-bold"
                                            name="guardian_contact"
                                            value={form.guardian_contact}
                                            onChange={handleChange}
                                            placeholder="0900-000-0000"
                                            required
                                            maxLength="13"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* --- STEP 4: STATUS & REQS --- */}
                            {step === 4 && (
                                <div className="row g-3 fade-in">
                                    <h4 className="fw-black border-bottom border-dark pb-2 mb-3">
                                        <i className="bi bi-file-earmark-check-fill me-2"></i>{" "}
                                        REQUIREMENTS & STATUS
                                    </h4>

                                    <div className="col-md-12 mb-3">
                                        <Label text="SUBMITTED REQUIREMENTS CHECKLIST" />
                                        <div className="d-flex justify-content-center bg-light border border-dark p-3 m-0">
                                            <div
                                                className="row w-100"
                                                style={{ maxWidth: "600px" }}
                                            >
                                                {[
                                                    {
                                                        key: "psa",
                                                        label: "PSA Birth Certificate",
                                                    },
                                                    {
                                                        key: "form137",
                                                        label: "Form 137 / SF10",
                                                    },
                                                    {
                                                        key: "good_moral",
                                                        label: "Good Moral Certificate",
                                                    },
                                                    {
                                                        key: "diploma",
                                                        label: "Certificate of Completion",
                                                    },
                                                    {
                                                        key: "card",
                                                        label: "Report Card",
                                                    },
                                                    {
                                                        key: "picture",
                                                        label: "2x2 Picture (2pcs)",
                                                    },
                                                ].map((req) => (
                                                    <div
                                                        className="col-md-6 mb-2"
                                                        key={req.key}
                                                    >
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input border-dark"
                                                                type="checkbox"
                                                                id={`req_${req.key}`}
                                                                name={`req_${req.key}`}
                                                                checked={
                                                                    form
                                                                        .requirements[
                                                                        req.key
                                                                    ] || false
                                                                }
                                                                onChange={
                                                                    handleChange
                                                                }
                                                            />
                                                            <label
                                                                className="form-check-label fw-bold small text-uppercase"
                                                                htmlFor={`req_${req.key}`}
                                                            >
                                                                {req.label}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* STATUS DROPDOWN FOR BOTH CREATE & EDIT */}
                                    <div className="col-md-12">
                                        <div className="alert alert-warning border-dark rounded-0 py-3 shadow-sm">
                                            <Label
                                                text="SYSTEM RECORD STATUS"
                                                required
                                            />
                                            <select
                                                name="status"
                                                className="form-select border-dark border-2 fw-bold bg-white text-uppercase"
                                                value={form.status}
                                                onChange={handleChange}
                                                required
                                            >
                                                {type === "create" ? (
                                                    <>
                                                        <option value="pending">
                                                            Pending
                                                        </option>
                                                        <option value="enrolled">
                                                            Enrolled
                                                        </option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="pending">
                                                            Pending
                                                        </option>
                                                        <option value="passed">
                                                            Passed
                                                        </option>
                                                        <option value="enrolled">
                                                            Enrolled
                                                        </option>
                                                        <option value="failed">
                                                            Failed
                                                        </option>
                                                        <option value="graduate">
                                                            Graduate
                                                        </option>
                                                        <option value="dropout">
                                                            Dropout
                                                        </option>
                                                        <option value="released">
                                                            Released
                                                        </option>
                                                    </>
                                                )}
                                            </select>
                                            <p className="small mb-0 mt-2 text-muted fst-italic">
                                                <i className="bi bi-info-circle-fill me-1 text-dark"></i>
                                                Setting the status to{" "}
                                                <strong>"Enrolled"</strong> will
                                                automatically generate the
                                                student's COR for printing upon
                                                saving. Setting it to{" "}
                                                <strong>"Released"</strong> will
                                                record your name and the exact
                                                time of release.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </fieldset>

                        {/* NAVIGATION BUTTONS */}
                        <div className="d-flex justify-content-between mt-5 pt-3 border-top border-dark">
                            {step > 1 && (
                                <button
                                    key="btn-back"
                                    type="button"
                                    className="btn btn-outline-dark rounded-0 fw-bold px-4"
                                    onClick={prevStep}
                                    disabled={isLoading}
                                >
                                    <i className="bi bi-arrow-left me-2"></i>{" "}
                                    BACK
                                </button>
                            )}

                            {step === 1 && <div></div>}

                            {step < 4 && (
                                <button
                                    key="btn-next"
                                    type="button"
                                    className="btn btn-dark rounded-0 fw-bold px-4 btn-retro-effect"
                                    onClick={nextStep}
                                >
                                    NEXT STEP{" "}
                                    <i className="bi bi-arrow-right ms-2"></i>
                                </button>
                            )}

                            {step === 4 && !isReadOnly && (
                                <button
                                    key="btn-submit"
                                    type="submit"
                                    className="btn btn-success rounded-0 border-dark border-2 fw-black px-5 btn-retro-effect"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span>
                                            <i className="bi bi-arrow-repeat toga-spin me-2"></i>{" "}
                                            SAVING...
                                        </span>
                                    ) : (
                                        <>
                                            <i className="bi bi-floppy-fill me-2"></i>{" "}
                                            {type === "create"
                                                ? "SAVE NEW RECORD"
                                                : "UPDATE RECORD"}
                                        </>
                                    )}
                                </button>
                            )}

                            {step === 4 && isReadOnly && (
                                <button
                                    key="btn-close"
                                    type="button"
                                    className="btn btn-dark rounded-0 fw-bold px-5 btn-retro-effect"
                                    onClick={onClose}
                                >
                                    CLOSE WINDOW
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
}
