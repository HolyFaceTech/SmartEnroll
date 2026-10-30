import React, { useState, useEffect } from "react";
import Toast from "../utils/toast";

export default function ClaimRequestModal({
    show,
    onClose,
    onProceed,
    selectedRequest,
}) {
    const [claimedBy, setClaimedBy] = useState("");

    useEffect(() => {
        if (show && selectedRequest) {
            const student = selectedRequest.student || {};
            const fullName =
                `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""} ${student.suffix || ""}`.trim();
            setClaimedBy(fullName);
        } else {
            setClaimedBy("");
        }
    }, [show, selectedRequest]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!claimedBy.trim()) {
            return Toast.fire({
                icon: "warning",
                title: "Please enter the name of the person claiming the document.",
            });
        }
        onProceed(claimedBy.trim());
    };

    if (!show) return null;

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
                            style={{ backgroundColor: "#34495e" }}
                        >
                            <h5 className="modal-title fw-bold font-monospace">
                                <i className="bi bi-box-arrow-right me-2"></i>
                                RELEASE DOCUMENT
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                            ></button>
                        </div>

                        <div className="modal-body bg-light p-4">
                            <form onSubmit={handleSubmit}>
                                <div className="card border-2 border-dark mb-4">
                                    <div className="card-body p-4 text-center">
                                        <label className="form-label small fw-bold font-monospace mb-3">
                                            <i className="bi bi-person-check-fill me-2"></i>{" "}
                                            CLAIMED / RECEIVED BY{" "}
                                            <span className="text-danger ms-1">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control border-dark border-2 text-center fs-6 fw-bold mx-auto"
                                            placeholder="e.g., Juan Santos Dela Cruz Jr."
                                            value={claimedBy}
                                            onChange={(e) =>
                                                setClaimedBy(e.target.value)
                                            }
                                            required
                                        />
                                        <div className="form-text mt-3 small text-muted font-monospace fst-italic">
                                            <i className="bi bi-info-circle-fill"></i>{" "}
                                            Please provide the name of the
                                            student or authorized representative
                                            claiming the document.
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2 pt-3 border-top border-dark">
                                    <button
                                        type="button"
                                        className="btn btn-dark fw-bold px-4 btn-press-retro"
                                        onClick={onClose}
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn border-2 border-dark fw-bold px-4 btn-press-retro d-flex align-items-center text-white"
                                        style={{ backgroundColor: "#34495e" }}
                                    >
                                        CONFIRM
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
