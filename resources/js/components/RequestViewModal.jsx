import React from "react";

export default function RequestViewModal({ show, selectedRequest, onClose }) {
    if (!show || !selectedRequest) return null;

    const student = selectedRequest.student || {};
    const academic = student.academic || {};
    const strand = academic.strand || {};
    const requirement = student.requirement || {};
    const releasedBy = selectedRequest.user || null;

    const fullName =
        `${student.first_name || ""} ${student.middle_name ? student.middle_name[0] + "." : ""} ${student.last_name || ""} ${student.suffix || ""}`.trim();

    const avatarUrl = requirement.photo_2x2
        ? `/storage/${requirement.photo_2x2}`
        : `https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff&size=128`;

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === "pending") return "bg-warning text-dark";
        if (s === "processing") return "bg-info text-dark";
        if (s === "done") return "bg-success text-white";
        if (s === "on hold") return "bg-danger text-white";
        if (s === "released") return "bg-secondary text-white";
        return "bg-dark text-white";
    };

    const calculateExpectedRelease = (createdAt, type) => {
        if (!createdAt) return "N/A";

        const docType = (type || "").toLowerCase();
        const isSevenDays =
            docType.includes("form 137") || docType.includes("good moral");

        const processingDays = isSevenDays ? 7 : 3;

        const expectedDate = new Date(createdAt);
        let addedDays = 0;

        expectedDate.setDate(expectedDate.getDate() + 1);

        while (addedDays < processingDays - 1) {
            expectedDate.setDate(expectedDate.getDate() + 1);
            if (expectedDate.getDay() !== 0 && expectedDate.getDay() !== 6) {
                addedDays++;
            }
        }

        return expectedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const expectedReleaseDateStr = calculateExpectedRelease(
        selectedRequest.created_at,
        selectedRequest.type,
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
                style={{ zIndex: 1050, overflowY: "auto" }}
            >
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content card-retro border-2 border-dark shadow">
                        <div
                            className="modal-header border-bottom border-dark text-white"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            <h5 className="modal-title fw-bold font-monospace">
                                <i className="bi bi-file-earmark-text-fill me-2"></i>
                                REQUEST DETAILS
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
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff&size=128`;
                                    }}
                                />
                                <h4
                                    className="fw-black text-dark mb-1 font-monospace text-uppercase"
                                    style={{ letterSpacing: "1px" }}
                                >
                                    {fullName}
                                </h4>
                                <div className="text-muted font-monospace small fw-bold mb-3">
                                    <i className="bi bi-person-vcard text-primary me-2"></i>{" "}
                                    {student.student_number || "TBA"}
                                </div>
                                <div
                                    className={`d-inline-block px-4 py-2 border border-2 border-dark font-monospace ${getStatusColor(selectedRequest.status)}`}
                                    style={{
                                        boxShadow: "4px 4px 0 rgba(0,0,0,0.2)",
                                        fontWeight: "bold",
                                        letterSpacing: "2px",
                                    }}
                                >
                                    {selectedRequest.status
                                        ? selectedRequest.status.toUpperCase()
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
                                            label: "LRN",
                                            icon: "bi-upc-scan",
                                            value: student.lrn || "N/A",
                                            color: "text-success",
                                        },
                                        {
                                            label: "Strand",
                                            icon: "bi-book-half",
                                            value: strand.code || "N/A",
                                        },
                                        {
                                            label: "Document Type",
                                            icon: "bi-file-earmark-medical-fill",
                                            value: selectedRequest.type,
                                            color: "text-primary",
                                        },
                                        {
                                            label: "Purpose",
                                            icon: "bi-chat-left-text-fill",
                                            value:
                                                selectedRequest.purpose ||
                                                "N/A",
                                            color: "fst-italic",
                                        },
                                        {
                                            label: "Date Requested",
                                            icon: "bi-calendar-plus-fill",
                                            value: new Date(
                                                selectedRequest.created_at,
                                            ).toLocaleString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }),
                                        },
                                        ...(selectedRequest.status?.toLowerCase() !==
                                            "released" &&
                                        selectedRequest.status?.toLowerCase() !==
                                            "denied"
                                            ? [
                                                  {
                                                      label: "Expected Release",
                                                      icon: "bi-clock-history",
                                                      value: `On or before ${expectedReleaseDateStr}`,
                                                      color: "text-danger",
                                                  },
                                              ]
                                            : []),
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
                                                ></i>{" "}
                                                {row.label}
                                            </span>
                                            <span
                                                className={`fw-bolder text-end font-monospace ${row.color || "text-dark"}`}
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

                            {selectedRequest.status?.toLowerCase() ===
                                "released" && (
                                <div className="card border-2 border-dark mb-4">
                                    <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                        <i className="bi bi-shield-check me-2"></i>{" "}
                                        AUDIT TRAIL
                                    </div>
                                    <div className="card-body p-3 bg-white">
                                        {[
                                            {
                                                label: "Released By",
                                                icon: "bi-person-badge-fill",
                                                value: releasedBy
                                                    ? `${releasedBy.first_name} ${releasedBy.last_name}`
                                                    : "Pending Release",
                                            },
                                            {
                                                label: "Released At",
                                                icon: "bi-calendar-check-fill",
                                                value: selectedRequest.released_at
                                                    ? new Date(
                                                          selectedRequest.released_at,
                                                      ).toLocaleString(
                                                          "en-US",
                                                          {
                                                              month: "short",
                                                              day: "numeric",
                                                              year: "numeric",
                                                              hour: "2-digit",
                                                              minute: "2-digit",
                                                          },
                                                      )
                                                    : "N/A",
                                            },
                                            {
                                                label: "Claimed By",
                                                icon: "bi-person-check-fill",
                                                value:
                                                    selectedRequest.claimed_by ||
                                                    "N/A",
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
                                                    ></i>{" "}
                                                    {row.label}
                                                </span>
                                                <span className="fw-bolder text-uppercase text-end font-monospace text-dark">
                                                    {row.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
