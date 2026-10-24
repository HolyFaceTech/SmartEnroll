import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Modal } from "react-bootstrap";
import PublicConfirmation from "./PublicConfirmation";

export default function RequestModal({ show, onClose }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [lrn, setLrn] = useState("");
    const [dob, setDob] = useState("");

    const [studentData, setStudentData] = useState(null);

    const [documentType, setDocumentType] = useState("");
    const [otherDocument, setOtherDocument] = useState("");
    const [purpose, setPurpose] = useState("");

    const [showConfirm, setShowConfirm] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (lrn.length !== 12)
            return Swal.fire(
                "Invalid LRN",
                "LRN must be exactly 12 digits.",
                "warning",
            );
        if (!dob)
            return Swal.fire(
                "Required",
                "Please enter your Date of Birth.",
                "warning",
            );

        setLoading(true);
        try {
            const res = await axios.post("/api/public/verify-request", {
                lrn: lrn,
                date_of_birth: dob,
            });
            setStudentData(res.data);
            setStep(2);
        } catch (error) {
            Swal.fire({
                title: "RECORD NOT FOUND",
                html: "We couldn't find a match for the provided LRN and Date of Birth.<br><br><b>Please visit the Registrar's Office to manually request your documents.</b>",
                icon: "error",
                confirmButtonColor: "#2d3436",
                customClass: { popup: "card-retro font-monospace" },
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePreSubmit = (e) => {
        e.preventDefault();
        if (!documentType)
            return Swal.fire(
                "Required",
                "Please select a document type.",
                "warning",
            );
        if (documentType === "Others" && !otherDocument)
            return Swal.fire(
                "Required",
                "Please specify the document.",
                "warning",
            );
        if (!purpose)
            return Swal.fire(
                "Required",
                "Please state your purpose.",
                "warning",
            );

        setShowConfirm(true);
    };

    const handleFinalSubmit = async () => {
        setShowConfirm(false);
        setLoading(true);

        const finalType =
            documentType === "Others" ? otherDocument : documentType;

        try {
            const res = await axios.post("/api/public/submit-request", {
                lrn: lrn,
                type: finalType,
                purpose: purpose,
            });

            Swal.fire({
                title: "REQUEST SUBMITTED!",
                text:
                    res.data.message || "Your document request has been saved.",
                icon: "success",
                confirmButtonColor: "#2d3436",
                customClass: { popup: "card-retro font-monospace" },
            }).then(() => {
                resetAndClose();
            });
        } catch (error) {
            Swal.fire(
                "Error",
                "Failed to submit request. Please try again.",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setStep(1);
        setLrn("");
        setDob("");
        setStudentData(null);
        setDocumentType("");
        setOtherDocument("");
        setPurpose("");
        onClose();
    };

    return (
        <>
            <Modal
                show={show}
                onHide={resetAndClose}
                centered
                backdrop="static"
                keyboard={false}
            >
                <div className="modal-content modal-retro-content font-monospace">
                    <div className="modal-header-retro d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-folder-fill fs-4 text-warning"></i>
                            <h5 className="fw-black m-0 ls-1">
                                DOCUMENT REQUEST
                            </h5>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={resetAndClose}
                            disabled={loading}
                        ></button>
                    </div>

                    <div className="modal-body p-4 bg-retro-bg">
                        {step === 1 && (
                            <form onSubmit={handleVerify}>
                                <div className="alert alert-info border-2 border-dark rounded-0 mb-4 small fw-bold">
                                    <i className="bi bi-shield-lock-fill me-2"></i>
                                    Security Verification: Please enter your
                                    details to access the request form.
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small">
                                        LEARNER REFERENCE NO. (LRN)
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control border-2 border-dark fw-bold"
                                        placeholder="12-digit LRN"
                                        value={lrn}
                                        onChange={(e) =>
                                            setLrn(
                                                e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 12),
                                            )
                                        }
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold small">
                                        DATE OF BIRTH
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control border-2 border-dark fw-bold"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-dark w-100 rounded-0 fw-bold btn-retro-effect py-2"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "VERIFYING..."
                                        : "VERIFY IDENTITY"}
                                </button>
                            </form>
                        )}

                        {step === 2 && studentData && (
                            <form onSubmit={handlePreSubmit}>
                                <div className="p-3 bg-white border border-2 border-dark mb-4 shadow-sm">
                                    <h6 className="fw-black border-bottom border-dark pb-2 mb-2 text-uppercase">
                                        Student Details
                                    </h6>
                                    <div className="small">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="text-muted fw-bold">
                                                Name:
                                            </span>
                                            <span className="fw-bolder">
                                                {studentData.last_name},{" "}
                                                {studentData.first_name}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="text-muted fw-bold">
                                                Student No:
                                            </span>
                                            <span className="fw-bolder">
                                                {studentData.student_number}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted fw-bold">
                                                Strand:
                                            </span>
                                            <span className="fw-bolder">
                                                {studentData.strand_code}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small">
                                        DOCUMENT TYPE
                                    </label>
                                    <select
                                        className="form-select border-2 border-dark fw-bold"
                                        value={documentType}
                                        onChange={(e) => {
                                            setDocumentType(e.target.value);
                                            if (e.target.value !== "Others")
                                                setOtherDocument("");
                                        }}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="" disabled>
                                            -- Select Document --
                                        </option>
                                        <optgroup label="3 Days Processing">
                                            <option value="Certificate of Enrollment">
                                                Certificate of Enrollment
                                            </option>
                                            <option value="Certificate of Graduate">
                                                Certificate of Graduate
                                            </option>
                                            <option value="Copy of Grades">
                                                Copy of Grades
                                            </option>
                                            <option value="Certificate of Dismissal">
                                                Certificate of Dismissal
                                            </option>
                                            <option value="Others">
                                                Others (Please specify)
                                            </option>
                                        </optgroup>
                                        <optgroup label="7 Days Processing">
                                            <option value="Form 137">
                                                Form 137
                                            </option>
                                            <option value="Good Moral Certificate">
                                                Good Moral Certificate
                                            </option>
                                        </optgroup>
                                    </select>
                                </div>

                                {documentType === "Others" && (
                                    <div className="mb-3 p-2 bg-light border border-dark">
                                        <label className="form-label fw-bold small">
                                            SPECIFY DOCUMENT
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control border-dark"
                                            placeholder="Enter document name"
                                            value={otherDocument}
                                            onChange={(e) =>
                                                setOtherDocument(e.target.value)
                                            }
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="form-label fw-bold small">
                                        PURPOSE
                                    </label>
                                    <textarea
                                        className="form-control border-2 border-dark"
                                        rows="3"
                                        placeholder="e.g. For college admission, employment, etc."
                                        value={purpose}
                                        onChange={(e) =>
                                            setPurpose(e.target.value)
                                        }
                                        required
                                        disabled={loading}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 border-2 border-dark rounded-0 fw-bold btn-retro-effect py-2"
                                    disabled={loading}
                                    style={{
                                        backgroundColor: "#3F9AAE",
                                        color: "#fff",
                                    }}
                                >
                                    {loading
                                        ? "SUBMITTING..."
                                        : "SUBMIT REQUEST"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </Modal>

            <PublicConfirmation
                show={showConfirm}
                title="SUBMIT REQUEST?"
                message={`Are you sure you want to request this document?`}
                confirmText="YES, SUBMIT"
                confirmColor="#F4D03F"
                iconClass="bi-send-fill"
                onConfirm={handleFinalSubmit}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}
