import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast"; // Using Toast

export default function StrandDrawer({
    show,
    type, // 'create' or 'edit'
    selectedStrand,
    onClose,
    onSuccess, // Callback to refresh parent table
    apiPrefix = "/api", // Default Admin
}) {
    const initialForm = { code: "", description: "" };
    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);

    // Populate form on Edit / Reset on Create
    useEffect(() => {
        if (type === "edit" && selectedStrand) {
            setFormData(selectedStrand);
        } else {
            setFormData(initialForm);
        }
    }, [type, selectedStrand, show]);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    // SMART SUBMIT HANDLER
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (type === "create") {
                await axios.post(`${apiPrefix}/strands`, formData);
                // SUCCESS TOAST
                Toast.fire({
                    icon: "success",
                    title: "Strand Created Successfully!",
                });
            } else {
                await axios.put(
                    `${apiPrefix}/strands/${selectedStrand.id}`,
                    formData,
                );
                // SUCCESS TOAST
                Toast.fire({
                    icon: "success",
                    title: "Strand Updated Successfully!",
                });
            }

            if (onSuccess) onSuccess(); // Refresh parent
            onClose(); // Close drawer
        } catch (error) {
            // ERROR TOAST
            let msg = "Action Failed";
            if (error.response && error.response.status === 422) {
                msg = Object.values(error.response.data.errors)
                    .flat()
                    .join("\n");
            } else if (error.response?.data?.message) {
                msg = error.response.data.message;
            }
            Toast.fire({ icon: "error", title: msg });
        } finally {
            setIsLoading(false);
        }
    };

    const drawerClass = show
        ? "offcanvas offcanvas-end show"
        : "offcanvas offcanvas-end";
    const backdropClass = show ? "offcanvas-backdrop fade show" : "";

    return (
        <>
            {show && (
                <div
                    className={backdropClass}
                    onClick={onClose}
                    style={{ zIndex: 1045 }}
                ></div>
            )}

            <div
                className={drawerClass}
                style={{
                    zIndex: 1050,
                    visibility: show ? "visible" : "hidden",
                    width: "400px",
                    borderLeft: "2px solid black",
                }}
            >
                {/* HEADER */}
                <div
                    className="offcanvas-header text-white"
                    style={{
                        backgroundColor: "var(--color-primary)",
                        borderBottom: "2px solid black",
                    }}
                >
                    <h5 className="offcanvas-title fw-bold font-monospace">
                        {type === "create" ? (
                            <>
                                <i className="bi bi-plus-circle me-2"></i>NEW
                                STRAND
                            </>
                        ) : (
                            <>
                                <i className="bi bi-pencil-square me-2"></i>EDIT
                                STRAND
                            </>
                        )}
                    </h5>
                    <button
                        type="button"
                        className="btn-close btn-close-white opacity-100"
                        onClick={onClose}
                    ></button>
                </div>

                {/* BODY */}
                <div className="offcanvas-body bg-light">
                    <form
                        onSubmit={handleSubmit}
                        className="d-flex flex-column gap-4"
                    >
                        <div className="card-retro p-4 bg-white">
                            <h6 className="fw-bold mb-3 pb-2 border-bottom border-dark font-monospace text-uppercase text-primary">
                                Strand Details
                            </h6>

                            <div className="mb-3">
                                <label className="form-label small fw-bold font-monospace">
                                    STRAND CODE
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    className="form-control text-uppercase fw-bold"
                                    placeholder="e.g. STEM"
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                    maxLength="10"
                                />
                                <div className="form-text small fst-italic">
                                    Unique identifier (ex. ABM, GAS)
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold font-monospace">
                                    DESCRIPTION
                                </label>
                                <textarea
                                    name="description"
                                    className="form-control"
                                    rows="3"
                                    placeholder="e.g. Science, Technology, Engineering..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            className="btn btn-retro py-3 fw-bold w-100 d-flex align-items-center justify-content-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <i className="bi bi-mortarboard-fill fs-5 me-2 toga-spin"></i>
                                    <span>PROCESSING...</span>
                                </>
                            ) : type === "create" ? (
                                "CREATE STRAND"
                            ) : (
                                "SAVE CHANGES"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
