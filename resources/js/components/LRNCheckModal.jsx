import React, { useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";
import Loading from "../utils/Loading";

export default function LRNCheckModal({ show, onClose, onProceed }) {
    const [lrn, setLrn] = useState("");
    const [loading, setLoading] = useState(false);

    const [recordFound, setRecordFound] = useState(false);

    const handleCheck = async (e) => {
        e.preventDefault();

        if (lrn.length !== 12) {
            return Toast.fire({
                icon: "warning",
                title: "LRN must be exactly 12 digits.",
            });
        }

        setLoading(true);

        try {
            const res = await axios.post("/api/public/check-lrn", { lrn });

            if (res.data.is_freshman) {
                onProceed({ type: "new", lrn });
                handleCloseModal();
            }
        } catch (error) {
            if (error.response && error.response.status === 403) {
                setRecordFound(true);
            } else {
                Toast.fire({
                    icon: "error",
                    title: "Server Error. Please try again.",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setLrn("");
        setRecordFound(false);
        onClose();
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
                        {!recordFound ? (
                            <>
                                <div
                                    className="modal-header border-bottom border-dark text-white"
                                    style={{ backgroundColor: "#3F9AAE" }}
                                >
                                    <h5 className="modal-title fw-bold font-monospace">
                                        <i className="bi bi-person-bounding-box me-2"></i>
                                        NEW STUDENT CHECK
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={handleCloseModal}
                                        disabled={loading}
                                    ></button>
                                </div>

                                <div className="modal-body bg-light p-4">
                                    <form onSubmit={handleCheck}>
                                        <div className="card border-2 border-dark mb-4">
                                            <div className="card-body p-4 text-center">
                                                <label className="form-label small fw-bold font-monospace mb-3">
                                                    <i className="bi bi-search me-2"></i>{" "}
                                                    LRN VERIFICATION{" "}
                                                    <span className="text-danger ms-1">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control border-dark border-2 text-center fs-3 fw-bold mx-auto"
                                                    placeholder="ENTER LEARNER REFERENCE NO."
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
                                                    maxLength={12}
                                                    required
                                                    disabled={loading}
                                                />
                                                <div className="form-text mt-3 small text-muted font-monospace fst-italic">
                                                    <i className="bi bi-info-circle-fill"></i>{" "}
                                                    Please provide your valid
                                                    12-digit LRN.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-end gap-2 pt-3 border-top border-dark">
                                            <button
                                                type="button"
                                                className="btn btn-dark fw-bold px-4 btn-press-retro"
                                                onClick={handleCloseModal}
                                                disabled={loading}
                                            >
                                                CANCEL
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn border-2 border-dark fw-bold px-4 btn-press-retro d-flex align-items-center text-white"
                                                style={{
                                                    backgroundColor: "#3F9AAE",
                                                }}
                                                disabled={loading}
                                            >
                                                PROCEED
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    className="modal-header border-bottom border-dark text-dark"
                                    style={{ backgroundColor: "#F4D03F" }}
                                >
                                    <h5 className="modal-title fw-bold font-monospace">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        RECORD FOUND
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-dark"
                                        onClick={handleCloseModal}
                                        disabled={loading}
                                    ></button>
                                </div>

                                <div className="modal-body bg-light p-4">
                                    <div className="text-center font-monospace mt-2 fs-6">
                                        <span className="d-block mb-3">
                                            Our system detected that this LRN
                                            already exists.
                                        </span>
                                        <span
                                            className="alert border border-dark rounded-0 small fw-bold text-dark mx-auto d-block fst-italic"
                                            style={{
                                                backgroundColor: "#FFE2AF",
                                            }}
                                        >
                                            <i className="bi bi-info-circle-fill me-1"></i>{" "}
                                            Online web enrollment is exclusive
                                            for{" "}
                                            <span className="text-success">
                                                Freshmen/New Students
                                            </span>
                                            .
                                        </span>
                                        <span className="d-block mb-0 fw-bold">
                                            Please proceed to the Registrar's
                                            Office for your enrollment updating.
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-center pt-3 mt-4 border-top border-dark">
                                        <button
                                            type="button"
                                            className="btn border-2 border-dark fw-bold px-4 py-2 w-100 btn-press-retro text-dark"
                                            style={{
                                                backgroundColor: "#F4D03F",
                                                letterSpacing: "1px",
                                            }}
                                            onClick={handleCloseModal}
                                        >
                                            I UNDERSTAND
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Loading show={loading} message="CHECKING LRN RECORD..." />
        </>
    );
}
