import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Modal } from "react-bootstrap";

export default function LRNCheckModal({ show, onClose, onProceed }) {
    const [lrn, setLrn] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCheck = async (e) => {
        e.preventDefault();
        if (lrn.length !== 12)
            return Swal.fire("Invalid", "LRN must be 12 digits.", "warning");

        setLoading(true);

        try {
            const res = await axios.post("/api/public/check-lrn", { lrn });

            if (res.data.is_freshman) {
                onProceed({ type: "new", lrn });
                setLrn("");
            }
        } catch (error) {
            if (error.response && error.response.status === 403) {
                Swal.fire({
                    title: "RECORD FOUND",
                    html: `
                        <div class="text-start">
                            <p class="mb-2">Our system detected that this LRN already exists.</p>
                            <div class="alert alert-warning border-dark rounded-0 small fw-bold">
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                Online web enrollment is exclusive for Freshmen/New Students.
                            </div>
                            <p class="mb-0 fw-bold">Please proceed to the Registrar's Office for your enrollment updating.</p>
                        </div>
                    `,
                    icon: "info",
                    confirmButtonText: "I UNDERSTAND",
                    confirmButtonColor: "#2d3436",
                    customClass: { popup: "card-retro font-monospace" },
                }).then(() => {
                    onClose();
                });
            } else {
                Swal.fire("Error", "Server Error. Please try again.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            backdrop="static"
            keyboard={false}
        >
            <div className="modal-content modal-retro-content font-monospace">
                <div className="modal-header-retro d-flex justify-content-between align-items-center bg-primary">
                    <div className="d-flex align-items-center gap-2 text-white">
                        <i className="bi bi-person-bounding-box fs-4"></i>
                        <h5
                            className="fw-black m-0 ls-1"
                            style={{ textShadow: "1px 1px 0 #000" }}
                        >
                            NEW STUDENT CHECK
                        </h5>
                    </div>
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={onClose}
                        disabled={loading}
                    ></button>
                </div>

                <div
                    className="modal-body p-4"
                    style={{ backgroundColor: "#fcfbf4" }}
                >
                    <form onSubmit={handleCheck}>
                        <div className="mb-4 text-center">
                            <label className="form-label fw-bold small text-muted">
                                ENTER LEARNER REFERENCE NO.
                            </label>
                            <input
                                type="text"
                                className="form-control border-2 border-dark rounded-0 fw-bold text-center fs-3"
                                placeholder="123456789012"
                                value={lrn}
                                onChange={(e) =>
                                    setLrn(
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 12),
                                    )
                                }
                                maxLength={12}
                                required
                                disabled={loading}
                                style={{ letterSpacing: "3px" }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-dark w-100 rounded-0 fw-bold btn-retro-effect py-3"
                            disabled={loading}
                            style={{ letterSpacing: "1px" }}
                        >
                            {loading ? (
                                <span>
                                    <i className="bi bi-gear-fill spin-anim me-2"></i>
                                    CHECKING DATABASE...
                                </span>
                            ) : (
                                <span>
                                    PROCEED TO ENROLLMENT{" "}
                                    <i className="bi bi-arrow-right-short fs-5 align-middle"></i>
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </Modal>
    );
}
