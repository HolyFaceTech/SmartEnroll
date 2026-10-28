import React, { useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";
import PublicConfirmation from "./PublicConfirmation";
import Loading from "../utils/Loading";

export default function RequestModal({ show, onClose }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [lrn, setLrn] = useState("");
    const [dob, setDob] = useState("");

    const [studentData, setStudentData] = useState(null);

    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [otherDocument, setOtherDocument] = useState("");
    const [purpose, setPurpose] = useState("");

    const [showConfirm, setShowConfirm] = useState(false);

    const documentOptions = [
        { label: "Certificate of Enrollment", group: "3 Days Processing" },
        { label: "Certificate of Graduate", group: "3 Days Processing" },
        { label: "Copy of Grades", group: "3 Days Processing" },
        { label: "Certificate of Dismissal", group: "3 Days Processing" },
        { label: "Form 137", group: "7 Days Processing" },
        { label: "Good Moral Certificate", group: "7 Days Processing" },
        { label: "Others", group: "Custom" },
    ];

    const handleVerify = async (e) => {
        e.preventDefault();
        if (lrn.length !== 12) {
            return Toast.fire({
                icon: "warning",
                title: "LRN must be exactly 12 digits.",
            });
        }
        if (!dob) {
            return Toast.fire({
                icon: "warning",
                title: "Please enter your Date of Birth.",
            });
        }

        setLoading(true);
        try {
            const res = await axios.post("/api/public/verify-request", {
                lrn: lrn,
                date_of_birth: dob,
            });
            setStudentData(res.data);
            setStep(2);
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "Record not found. Please visit the Registrar's Office.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (docLabel) => {
        if (selectedDocuments.includes(docLabel)) {
            setSelectedDocuments(
                selectedDocuments.filter((doc) => doc !== docLabel),
            );
            if (docLabel === "Others") setOtherDocument("");
        } else {
            setSelectedDocuments([...selectedDocuments, docLabel]);
        }
    };

    const handlePreSubmit = (e) => {
        e.preventDefault();
        if (selectedDocuments.length === 0) {
            return Toast.fire({
                icon: "warning",
                title: "Please select at least one document type.",
            });
        }
        if (selectedDocuments.includes("Others") && !otherDocument.trim()) {
            return Toast.fire({
                icon: "warning",
                title: "Please specify the other document.",
            });
        }
        if (!purpose) {
            return Toast.fire({
                icon: "warning",
                title: "Please state your purpose.",
            });
        }

        setShowConfirm(true);
    };

    const handleFinalSubmit = async () => {
        setShowConfirm(false);
        setLoading(true);

        const finalDocsList = selectedDocuments.map((doc) =>
            doc === "Others" ? otherDocument.trim() : doc,
        );
        const finalType = finalDocsList.join(", ");

        try {
            const res = await axios.post("/api/public/submit-request", {
                lrn: lrn,
                type: finalType,
                purpose: purpose,
            });

            Toast.fire({
                icon: "success",
                title:
                    res.data.message || "Your document request has been saved.",
            });

            resetAndClose();
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "Failed to submit request. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setStep(1);
        setLrn("");
        setDob("");
        setStudentData(null);
        setSelectedDocuments([]);
        setOtherDocument("");
        setPurpose("");
        onClose();
    };

    const handleCancelStep2 = () => {
        setStep(1);
        setLrn("");
        setDob("");
        setStudentData(null);
        setSelectedDocuments([]);
        setOtherDocument("");
        setPurpose("");
    };

    if (!show) return null;

    const headerBgColor = "#F4D03F";

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
                            className="modal-header border-bottom border-dark text-dark"
                            style={{ backgroundColor: headerBgColor }}
                        >
                            <h5 className="modal-title fw-bold font-monospace">
                                <i className="bi bi-folder-fill me-2"></i>
                                DOCUMENT REQUEST
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={resetAndClose}
                                disabled={loading}
                            ></button>
                        </div>

                        <div className="modal-body bg-light">
                            {step === 1 && (
                                <form onSubmit={handleVerify}>
                                    <div className="card border-2 border-dark mb-4">
                                        <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                            <i className="bi bi-shield-lock-fill me-2"></i>{" "}
                                            SECURITY VERIFICATION
                                        </div>
                                        <div className="card-body row g-3">
                                            <div className="col-12">
                                                <p className="small text-muted font-monospace fst-italic mb-1">
                                                    Please enter your details to
                                                    verify your identity and
                                                    access the request form.
                                                </p>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold font-monospace">
                                                    <i className="bi bi-upc-scan me-1"></i>{" "}
                                                    LEARNER REFERENCE NO. (LRN){" "}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control border-dark"
                                                    placeholder="12-digit LRN"
                                                    value={lrn}
                                                    onChange={(e) =>
                                                        setLrn(
                                                            e.target.value
                                                                .replace(
                                                                    /\D/g,
                                                                    "",
                                                                )
                                                                .slice(0, 12),
                                                        )
                                                    }
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold font-monospace">
                                                    <i className="bi bi-calendar-event-fill me-1"></i>{" "}
                                                    DATE OF BIRTH{" "}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="date"
                                                    className="form-control border-dark"
                                                    value={dob}
                                                    onChange={(e) =>
                                                        setDob(e.target.value)
                                                    }
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark">
                                        <button
                                            type="button"
                                            className="btn btn-dark fw-bold px-4 btn-press-retro"
                                            onClick={resetAndClose}
                                            disabled={loading}
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn border-2 border-dark fw-bold px-4 btn-press-retro text-dark"
                                            style={{
                                                backgroundColor: headerBgColor,
                                            }}
                                            disabled={loading}
                                        >
                                            VERIFY
                                        </button>
                                    </div>
                                </form>
                            )}

                            {step === 2 && studentData && (
                                <form onSubmit={handlePreSubmit}>
                                    <div className="card border-2 border-dark mb-4">
                                        <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                            <i className="bi bi-person-lines-fill me-2"></i>{" "}
                                            STUDENT DETAILS
                                        </div>
                                        <div className="card-body p-3 bg-white">
                                            {[
                                                {
                                                    label: "Full Name",
                                                    icon: "bi-person-circle",
                                                    value: `${studentData.first_name} ${studentData.last_name}`,
                                                    color: "text-primary",
                                                },
                                                {
                                                    label: "LRN",
                                                    icon: "bi-upc-scan",
                                                    value: lrn,
                                                },
                                                {
                                                    label: "Student No.",
                                                    icon: "bi-person-vcard",
                                                    value:
                                                        studentData.student_number ||
                                                        "TBA",
                                                },
                                                {
                                                    label: "Strand",
                                                    icon: "bi-book-half",
                                                    value:
                                                        studentData.strand_code ||
                                                        "N/A",
                                                },
                                            ].map((row, idx, arr) => (
                                                <div
                                                    key={row.label}
                                                    className={`d-flex justify-content-between align-items-center py-2 ${
                                                        idx !== arr.length - 1
                                                            ? "border-bottom border-dark border-1"
                                                            : ""
                                                    }`}
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
                                                        className={`fw-bolder text-uppercase font-monospace ${
                                                            row.color ||
                                                            "text-dark"
                                                        }`}
                                                    >
                                                        {row.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="card border-2 border-dark mb-4">
                                        <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                            <i className="bi bi-file-earmark-text-fill me-2"></i>{" "}
                                            REQUEST DETAILS
                                        </div>
                                        <div className="card-body row g-3">
                                            <div className="col-12">
                                                <label className="form-label small fw-bold font-monospace border-bottom border-dark pb-2 w-100">
                                                    <i className="bi bi-files me-1"></i>{" "}
                                                    SELECT DOCUMENTS{" "}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </label>

                                                <div className="row g-2 mt-1">
                                                    {documentOptions.map(
                                                        (doc, idx) => (
                                                            <div
                                                                className="col-md-6"
                                                                key={idx}
                                                            >
                                                                <div
                                                                    className="form-check p-2 border border-dark bg-white shadow-sm d-flex align-items-center"
                                                                    style={{
                                                                        cursor: "pointer",
                                                                    }}
                                                                >
                                                                    <input
                                                                        className="form-check-input ms-1 me-2 border-dark"
                                                                        type="checkbox"
                                                                        id={`docCheck_${idx}`}
                                                                        checked={selectedDocuments.includes(
                                                                            doc.label,
                                                                        )}
                                                                        onChange={() =>
                                                                            handleCheckboxChange(
                                                                                doc.label,
                                                                            )
                                                                        }
                                                                        style={{
                                                                            transform:
                                                                                "scale(1.2)",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        disabled={
                                                                            loading
                                                                        }
                                                                    />
                                                                    <label
                                                                        className="form-check-label fw-bold small flex-grow-1"
                                                                        htmlFor={`docCheck_${idx}`}
                                                                        style={{
                                                                            cursor: "pointer",
                                                                            fontSize:
                                                                                "0.85rem",
                                                                        }}
                                                                    >
                                                                        {
                                                                            doc.label
                                                                        }
                                                                        {doc.group !==
                                                                            "Custom" && (
                                                                            <span
                                                                                className="d-block text-muted"
                                                                                style={{
                                                                                    fontSize:
                                                                                        "0.7rem",
                                                                                }}
                                                                            >
                                                                                (
                                                                                {
                                                                                    doc.group
                                                                                }

                                                                                )
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            {selectedDocuments.includes(
                                                "Others",
                                            ) && (
                                                <div className="col-12 mt-3 p-3 bg-white border border-2 border-dark">
                                                    <label className="form-label small fw-bold font-monospace">
                                                        <i className="bi bi-pencil-square me-1"></i>{" "}
                                                        SPECIFY DOCUMENT{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control border-dark"
                                                        placeholder="Enter document name"
                                                        value={otherDocument}
                                                        onChange={(e) =>
                                                            setOtherDocument(
                                                                e.target.value,
                                                            )
                                                        }
                                                        required={selectedDocuments.includes(
                                                            "Others",
                                                        )}
                                                        disabled={loading}
                                                    />
                                                </div>
                                            )}

                                            <div className="col-12 mt-3">
                                                <label className="form-label small fw-bold font-monospace">
                                                    <i className="bi bi-chat-left-text-fill me-1"></i>{" "}
                                                    PURPOSE{" "}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </label>
                                                <textarea
                                                    className="form-control border-dark"
                                                    rows="3"
                                                    placeholder="e.g. For college admission, employment, etc."
                                                    value={purpose}
                                                    onChange={(e) =>
                                                        setPurpose(
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                    disabled={loading}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark">
                                        <button
                                            type="button"
                                            className="btn btn-dark fw-bold px-4 btn-press-retro"
                                            onClick={handleCancelStep2}
                                            disabled={loading}
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn border-2 border-dark fw-bold px-4 btn-press-retro text-dark"
                                            style={{
                                                backgroundColor: headerBgColor,
                                            }}
                                            disabled={loading}
                                        >
                                            SEND REQUEST
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <PublicConfirmation
                show={showConfirm}
                title="SUBMIT REQUEST?"
                message="Are you sure you want to request these documents?"
                confirmText="YES, SEND IT"
                confirmColor="#F4D03F"
                iconClass="bi-send-fill"
                onConfirm={handleFinalSubmit}
                onCancel={() => setShowConfirm(false)}
            />

            <Loading
                show={loading}
                message={
                    step === 1 ? "VERIFYING IDENTITY..." : "SENDING REQUEST..."
                }
            />
        </>
    );
}
