import React from "react";
import { Modal } from "react-bootstrap";

export default function StatusCheckModal({ show, student, onClose }) {
    if (!student) return null;

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === "enrolled") return "bg-success text-white";
        if (s === "on hold") return "bg-danger text-white";
        if (s === "graduate") return "bg-info text-dark";
        if (s === "drop out") return "bg-dark text-white";
        if (s === "released") return "bg-secondary text-white";
        return "bg-warning text-dark";
    };

    const fullName =
        `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""} ${student.suffix || ""}`.trim();

    const avatarUrl = student.photo_2x2
        ? `/storage/${student.photo_2x2}`
        : `https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff&size=128`;

    const gradeLevel = student.grade_level ? student.grade_level : "N/A";
    const sectionName = student.section?.name ? student.section.name : "TBA";
    const combinedGradeSection = `${gradeLevel} - ${sectionName}`;

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
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            <h5 className="modal-title fw-bold font-monospace">
                                <i className="bi bi-file-earmark-person-fill me-2"></i>
                                STUDENT RECORD
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
                                    src={avatarUrl}
                                    className="rounded-circle border border-dark border-2 mb-3 bg-white shadow-sm"
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        objectFit: "cover",
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
                                    <i className="bi bi-person-vcard text-primary me-2"></i>
                                    {student.student_number || "TBA"}
                                </div>
                                <div
                                    className={`d-inline-block px-4 py-2 border border-2 border-dark font-monospace ${getStatusColor(student.status)}`}
                                    style={{
                                        boxShadow: "4px 4px 0 rgba(0,0,0,0.2)",
                                        fontWeight: "bold",
                                        letterSpacing: "2px",
                                    }}
                                >
                                    {student.status
                                        ? student.status.toUpperCase()
                                        : "PENDING"}
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
                                            label: "LRN",
                                            icon: "bi-upc-scan",
                                            value: student.lrn || "N/A",
                                            color: "text-success",
                                        },
                                        {
                                            label: "Strand",
                                            icon: "bi-book-half",
                                            value:
                                                student.strand?.code || "N/A",
                                            color: "text-primary",
                                        },
                                        {
                                            label: "Grade & Section",
                                            icon: "bi-people-fill",
                                            value: combinedGradeSection,
                                        },
                                        {
                                            label: "Term",
                                            icon: "bi-calendar-event-fill",
                                            value: student.term
                                                ? `${student.term} Term`
                                                : "N/A",
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
                                    * This is a system-generated student record
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
