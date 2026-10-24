import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ReCAPTCHA from "react-google-recaptcha";
import moment from "moment";
import { Modal } from "react-bootstrap";

export default function EnrollmentModal({ initialData, settings, onClose }) {
    const [step, setStep] = useState(1);
    const [strands, setStrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [captchaVal, setCaptchaVal] = useState(null);

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

    const handleSafeClose = () => {
        Swal.fire({
            title: "CANCEL APPLICATION?",
            text: "Are you sure you want to close? All entered data will be lost.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "YES, CLOSE IT",
            cancelButtonText: "CONTINUE FILLING UP",
            background: "#fff",
            color: "#000",
            customClass: {
                popup: "card-retro font-monospace",
                confirmButton: "btn-retro bg-danger border-dark",
                cancelButton: "btn-retro bg-dark border-dark",
            },
        }).then((result) => {
            if (result.isConfirmed) onClose();
        });
    };

    const [form, setForm] = useState({
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
        email: "",
        contact_number: "",
        home_address: "",
        provincial_address: "",
        current_school_attended: "",
        general_average: "",
        strand_id: "",
        learning_modality: "Face-to-Face",
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
    });

    const [files, setFiles] = useState({
        file_psa: null,
        file_form137: null,
        file_good_moral: null,
        file_diploma: null,
        file_card: null,
        file_picture: null,
    });

    useEffect(() => {
        axios.get("/api/public/strands").then((res) => setStrands(res.data));
    }, []);

    const handleDobChange = (e) => {
        const dob = e.target.value;
        const age = dob ? moment().diff(moment(dob), "years") : "";
        setForm({ ...form, date_of_birth: dob, age });
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        setFiles({ ...files, [name]: selectedFiles[0] });
    };

    const validateCurrentStep = () => {
        let missingFields = [];
        if (step === 1) {
            if (!form.last_name) missingFields.push("Last Name");
            if (!form.first_name) missingFields.push("First Name");
            if (!form.date_of_birth) missingFields.push("Date of Birth");
            if (!form.place_of_birth) missingFields.push("Place of Birth");
            if (!form.home_address) missingFields.push("Home Address");
            if (!form.email) missingFields.push("Email Address");
            if (!form.contact_number) missingFields.push("Mobile Number");
        } else if (step === 2) {
            if (!form.lrn) missingFields.push("LRN");
            if (!form.current_school_attended)
                missingFields.push("Last School Attended");
            if (!form.strand_id) missingFields.push("Strand");
        } else if (step === 3) {
            if (!form.guardian_name) missingFields.push("Guardian's Name");
            if (!form.guardian_contact)
                missingFields.push("Guardian's Contact");
        }

        if (missingFields.length > 0) {
            Swal.fire({
                title: "MISSING FIELDS",
                html: `<ul class='text-start mt-3 mb-0'><li>${missingFields.join("</li><li>")}</li></ul>`,
                icon: "warning",
                confirmButtonColor: "#2d3436",
                customClass: { popup: "card-retro font-monospace" },
            });
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (validateCurrentStep()) {
            setStep(step + 1);
            document.querySelector(".modal")?.scrollTo(0, 0);
        }
    };
    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAgreed)
            return Swal.fire(
                "Required",
                "Please agree to the Declaration.",
                "warning",
            );
        if (!captchaVal)
            return Swal.fire(
                "Required",
                "Please complete the CAPTCHA.",
                "warning",
            );

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

            Swal.fire({
                title: "APPLICATION SUBMITTED!",
                html: `<p class="small">Your enrollment application and soft copies have been received. Please check your <b>Email</b> for further instructions.</p>`,
                icon: "success",
                confirmButtonText: "OKAY, GOT IT!",
                confirmButtonColor: "#2d3436",
                customClass: { popup: "card-retro font-monospace" },
            }).then(() => onClose());
        } catch (error) {
            Swal.fire(
                "Error",
                error.response?.data?.message || "Submission failed.",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const Label = ({ text, required }) => (
        <label className="form-label fw-bold small mb-1">
            {text} {required && <span className="text-danger">*</span>}
        </label>
    );

    return (
        <Modal
            show={true}
            onHide={handleSafeClose}
            backdrop="static"
            keyboard={false}
            size="xl"
            centered
            scrollable
            fullscreen="sm-down"
        >
            <div className="modal-content modal-retro-content font-monospace">
                <div className="modal-header-retro d-flex justify-content-between align-items-center bg-warning border-bottom border-dark border-3 p-3">
                    <h5 className="fw-black m-0 ls-1">
                        <i className="bi bi-person-lines-fill me-2"></i>{" "}
                        FRESHMEN ENROLLMENT
                    </h5>
                    <button
                        className="btn-close"
                        onClick={handleSafeClose}
                    ></button>
                </div>

                <div className="modal-body p-4 p-md-5 bg-white">
                    <div className="d-flex justify-content-between mb-4 px-md-3 text-center border-bottom border-dark pb-3">
                        {[
                            "PERSONAL",
                            "ACADEMIC",
                            "FAMILY",
                            "REQUIREMENTS",
                            "REVIEW",
                        ].map((label, idx) => (
                            <div
                                key={idx}
                                className={
                                    step >= idx + 1
                                        ? "text-dark fw-bold"
                                        : "text-muted opacity-50"
                                }
                            >
                                <div
                                    className={`rounded-circle border border-2 border-dark mx-auto mb-1 d-flex align-items-center justify-content-center ${step >= idx + 1 ? "bg-warning" : "bg-light"}`}
                                    style={{ width: "30px", height: "30px" }}
                                >
                                    {idx + 1}
                                </div>
                                <small style={{ fontSize: "0.65rem" }}>
                                    {label}
                                </small>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* STEP 1: PERSONAL */}
                        {step === 1 && (
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <Label text="LAST NAME" required />
                                    <input
                                        className="form-control border-dark"
                                        value={form.last_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                last_name: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <Label text="FIRST NAME" required />
                                    <input
                                        className="form-control border-dark"
                                        value={form.first_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                first_name: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="col-md-3">
                                    <Label text="MIDDLE NAME" />
                                    <input
                                        className="form-control border-dark"
                                        value={form.middle_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                middle_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-md-1">
                                    <Label text="SUFFIX" />
                                    <input
                                        className="form-control border-dark"
                                        value={form.suffix}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                suffix: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="col-md-3">
                                    <Label text="DATE OF BIRTH" required />
                                    <input
                                        type="date"
                                        className="form-control border-dark"
                                        value={form.date_of_birth}
                                        onChange={handleDobChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-1">
                                    <Label text="AGE" />
                                    <input
                                        className="form-control bg-light border-dark"
                                        value={form.age}
                                        readOnly
                                    />
                                </div>
                                <div className="col-md-2">
                                    <Label text="GENDER" required />
                                    <select
                                        className="form-select border-dark"
                                        value={form.gender}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                gender: e.target.value,
                                            })
                                        }
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <Label text="CIVIL STATUS" required />
                                    <select
                                        className="form-select border-dark"
                                        value={form.civil_status}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                civil_status: e.target.value,
                                            })
                                        }
                                    >
                                        <option>Single</option>
                                        <option>Married</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <Label text="RELIGION" required />
                                    <input
                                        className="form-control border-dark"
                                        value={form.religion}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                religion: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-md-8">
                                    <Label text="PLACE OF BIRTH" required />
                                    <input
                                        className="form-control border-dark"
                                        value={form.place_of_birth}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                place_of_birth: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <Label text="CITIZENSHIP" required />
                                    <input
                                        className="form-control border-dark"
                                        value={form.citizenship}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                citizenship: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-12">
                                    <Label text="HOME ADDRESS" required />
                                    <input
                                        className="form-control border-dark"
                                        value={form.home_address}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                home_address: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-md-6">
                                    <Label text="STUDENT EMAIL" required />
                                    <input
                                        type="email"
                                        className="form-control border-dark"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                email: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Label text="MOBILE NUMBER" required />
                                    <input
                                        className="form-control border-dark"
                                        value={form.contact_number}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                contact_number: e.target.value,
                                            })
                                        }
                                        maxLength="11"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 2: ACADEMIC */}
                        {step === 2 && (
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <Label text="LRN" required />
                                    <input
                                        className="form-control bg-light border-dark fw-bold"
                                        value={form.lrn}
                                        readOnly
                                    />
                                </div>
                                <div className="col-md-8">
                                    <Label
                                        text="LAST SCHOOL ATTENDED"
                                        required
                                    />
                                    <input
                                        className="form-control border-dark"
                                        value={form.current_school_attended}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                current_school_attended:
                                                    e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-md-4">
                                    <Label text="GENERAL AVERAGE (GRADE 10)" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control border-dark"
                                        value={form.general_average}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                general_average: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-md-4">
                                    <Label text="STRAND TO ENROLL" required />
                                    <select
                                        className="form-select border-dark"
                                        value={form.strand_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                strand_id: e.target.value,
                                            })
                                        }
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
                                    <Label text="LEARNING MODALITY" required />
                                    <select
                                        className="form-select border-dark"
                                        value={form.learning_modality}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                learning_modality:
                                                    e.target.value,
                                            })
                                        }
                                    >
                                        <option>Face-to-Face</option>
                                        <option>Modular</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: FAMILY */}
                        {step === 3 && (
                            <div className="row g-3">
                                <div className="col-12">
                                    <h6 className="fw-bold bg-light p-2 border border-dark">
                                        FATHER'S INFO
                                    </h6>
                                </div>
                                <div className="col-md-5">
                                    <Label text="NAME" />
                                    <input
                                        className="form-control border-dark"
                                        value={form.father_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                father_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-md-4">
                                    <Label text="OCCUPATION" />
                                    <input
                                        className="form-control border-dark"
                                        value={form.father_occupation}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                father_occupation:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-md-3">
                                    <Label text="CONTACT" />
                                    <input
                                        className="form-control border-dark"
                                        value={form.father_contact}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                father_contact: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="col-12">
                                    <h6 className="fw-bold bg-light p-2 border border-dark">
                                        MOTHER'S INFO
                                    </h6>
                                </div>
                                <div className="col-md-5">
                                    <Label text="MAIDEN NAME" />
                                    <input
                                        className="form-control border-dark"
                                        value={form.mother_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                mother_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-md-4">
                                    <Label text="OCCUPATION" />
                                    <input
                                        className="form-control border-dark"
                                        value={form.mother_occupation}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                mother_occupation:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-md-3">
                                    <Label text="CONTACT" />
                                    <input
                                        className="form-control border-dark"
                                        value={form.mother_contact}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                mother_contact: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="col-12">
                                    <h6 className="fw-bold bg-light p-2 border border-dark">
                                        GUARDIAN'S INFO{" "}
                                        <span className="text-danger">*</span>
                                    </h6>
                                </div>
                                <div className="col-md-5">
                                    <Label text="NAME" required />
                                    <input
                                        className="form-control border-dark"
                                        value={form.guardian_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                guardian_name: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <Label text="OCCUPATION" />
                                    <input
                                        className="form-control border-dark"
                                        value={form.guardian_occupation}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                guardian_occupation:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-md-3">
                                    <Label text="CONTACT" required />
                                    <input
                                        className="form-control border-dark"
                                        value={form.guardian_contact}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                guardian_contact:
                                                    e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 4: SOFT COPIES UPLOAD */}
                        {step === 4 && (
                            <div className="row g-4">
                                <div className="col-12">
                                    <div className="alert alert-info border-dark rounded-0 small">
                                        <i className="bi bi-info-circle-fill me-2"></i>
                                        <strong>Optional:</strong> You may
                                        upload scanned copies or clear photos
                                        (PDF, JPG, PNG) of your documents to
                                        expedite evaluation. Max file size: 2MB
                                        each.
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <Label text="PSA BIRTH CERTIFICATE" />
                                    <input
                                        type="file"
                                        name="file_psa"
                                        className="form-control border-dark"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Label text="REPORT CARD (FORM 138)" />
                                    <input
                                        type="file"
                                        name="file_card"
                                        className="form-control border-dark"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Label text="CERTIFICATE OF GOOD MORAL" />
                                    <input
                                        type="file"
                                        name="file_good_moral"
                                        className="form-control border-dark"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Label text="FORM 137 / SF10" />
                                    <input
                                        type="file"
                                        name="file_form137"
                                        className="form-control border-dark"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Label text="2x2 PICTURE" />
                                    <input
                                        type="file"
                                        name="file_picture"
                                        className="form-control border-dark"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Label text="DIPLOMA / COMPLETION CERT" />
                                    <input
                                        type="file"
                                        name="file_diploma"
                                        className="form-control border-dark"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 5: REVIEW & RECAPTCHA */}
                        {step === 5 && (
                            <div className="text-center">
                                <h5 className="fw-black mb-4">
                                    <i className="bi bi-check-circle-fill text-success me-2"></i>{" "}
                                    FINAL REVIEW
                                </h5>

                                <div
                                    className="alert alert-warning border-dark text-start rounded-0 mb-4 p-3 shadow-sm mx-auto"
                                    style={{ maxWidth: "600px" }}
                                >
                                    <div className="form-check">
                                        <input
                                            className="form-check-input border-dark"
                                            type="checkbox"
                                            id="agree"
                                            checked={isAgreed}
                                            onChange={(e) =>
                                                setIsAgreed(e.target.checked)
                                            }
                                            style={{ transform: "scale(1.2)" }}
                                        />
                                        <label
                                            className="form-check-label fw-bold small ms-2"
                                            htmlFor="agree"
                                        >
                                            I certify that all information and
                                            documents provided are true and
                                            correct. I understand that false
                                            information is grounds for
                                            disqualification.
                                        </label>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-center mb-4">
                                    <ReCAPTCHA
                                        sitekey={
                                            import.meta.env
                                                .VITE_RECAPTCHA_SITE_KEY
                                        }
                                        onChange={(val) => setCaptchaVal(val)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-success btn-lg w-50 rounded-0 border-2 border-dark fw-black btn-retro-effect py-3"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span>
                                            <i className="bi bi-arrow-repeat spinner-border spinner-border-sm me-2"></i>{" "}
                                            SUBMITTING...
                                        </span>
                                    ) : (
                                        "SUBMIT APPLICATION"
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="d-flex justify-content-between mt-5 pt-3 border-top border-dark">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    className="btn btn-outline-dark fw-bold px-4 rounded-0"
                                    onClick={prevStep}
                                >
                                    <i className="bi bi-arrow-left"></i> BACK
                                </button>
                            ) : (
                                <div></div>
                            )}
                            {step < 5 && (
                                <button
                                    type="button"
                                    className="btn btn-dark fw-bold px-4 rounded-0 btn-retro-effect"
                                    onClick={nextStep}
                                >
                                    NEXT <i className="bi bi-arrow-right"></i>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
}
