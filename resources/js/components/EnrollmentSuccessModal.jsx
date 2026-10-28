import React from "react";

export default function EnrollmentSuccessModal({
    show,
    onClose,
    studentName,
    gradeLevel = "11",
}) {
    if (!show) return null;

    const priorityDocs = [
        { label: "PSA Birth Certificate" },
        { label: "Report Card (Form 138)" },
        { label: "2x2 Picture (2pcs)" },
    ];

    if (gradeLevel === "11") {
        priorityDocs.push({ label: "SAF Annex E & F (Grade 11)" });
    } else if (gradeLevel === "12") {
        priorityDocs.push({ label: "SAF Annex E & F (Grade 12)" });
    }

    const supportingDocs = [
        { label: "Form 137 / SF10" },
        { label: "Good Moral Certificate" },
        { label: "Diploma / Certificate" },
    ];

    const RequirementList = ({ title, docs }) => (
        <div className="mb-4 text-start">
            <h6 className="fw-bold font-monospace text-muted border-bottom border-dark pb-2 mb-3">
                <i className="bi bi-folder-symlink-fill me-2"></i>
                {title}
            </h6>
            <div className="d-flex flex-column gap-2 ms-2">
                {docs.map((doc, idx) => (
                    <div
                        key={idx}
                        className="d-flex align-items-center justify-content-between p-2 border border-dark bg-white shadow-sm"
                    >
                        <span className="small fw-bold font-monospace text-dark">
                            {doc.label}
                        </span>
                        <span className="badge bg-danger border border-dark rounded-0 px-2 py-1 shadow-sm font-monospace text-white">
                            <i className="bi bi-clock-history me-1"></i> TO
                            FOLLOW
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1060 }}
            ></div>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ zIndex: 1065, overflowY: "auto" }}
            >
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div
                        className="modal-content card-retro border-dark shadow font-monospace"
                        style={{ backgroundColor: "#55efc4" }}
                    >
                        <div className="modal-header border-bottom border-dark d-flex justify-content-between align-items-center">
                            <h5 className="modal-title fw-black text-dark text-uppercase m-0 ls-1">
                                <i className="bi bi-check-circle-fill me-2"></i>
                                APPLICATION SUCCESSFUL
                            </h5>
                        </div>

                        <div className="modal-body text-center py-4 bg-light px-4">
                            <i
                                className="bi bi-envelope-check-fill d-block mb-3"
                                style={{
                                    fontSize: "4rem",
                                    color: "#3F9AAE",
                                    textShadow: "2px 2px 0 #000",
                                }}
                            ></i>

                            <h4 className="fw-black text-dark text-uppercase mb-2">
                                CONGRATULATIONS, {studentName}!
                            </h4>
                            <p className="fs-6 fw-bold text-muted mb-4">
                                Your enrollment application has been submitted
                                successfully. Please check your email for
                                additional instructions.
                            </p>

                            <div className="card-retro border-2 border-dark text-start bg-white p-4 shadow-sm mb-2">
                                <h5 className="fw-bold font-monospace text-dark text-center mb-4 text-decoration-underline">
                                    PENDING HARD COPY REQUIREMENTS
                                </h5>

                                <div className="row">
                                    <div className="col-md-6">
                                        <RequirementList
                                            title="PRIORITY DOCUMENTS"
                                            docs={priorityDocs}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <RequirementList
                                            title="SUPPORTING DOCUMENTS"
                                            docs={supportingDocs}
                                        />
                                    </div>
                                </div>

                                <div className="alert alert-warning border-2 border-dark rounded-0 mt-3 p-3 shadow-sm mb-0">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    <strong>REMINDER:</strong> Please submit the
                                    hard copies of the following requirements to
                                    the Registrar's Office as soon as possible
                                    to officially complete your enrollment.
                                </div>
                            </div>
                            <div className="d-flex justify-content-center pt-3 mt-4 border-top border-dark">
                                <button
                                    type="button"
                                    className="btn border-2 border-dark fw-bold px-4 py-2 w-100 btn-press-retro text-dark"
                                    style={{ backgroundColor: "#55efc4" }}
                                    onClick={onClose}
                                >
                                    I UNDERSTAND
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
