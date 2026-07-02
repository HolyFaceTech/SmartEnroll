import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";

export default function StrandModal({
    show,
    type,
    selectedStrand,
    onClose,
    onSuccess,
    apiPrefix = "/api",
}) {
    const initialForm = { code: "", description: "" };
    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (type === "edit" && selectedStrand) {
            setFormData(selectedStrand);
        } else {
            setFormData(initialForm);
        }
    }, [type, selectedStrand, show]);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (type === "create") {
                await axios.post(`${apiPrefix}/strands`, formData);
                Toast.fire({
                    icon: "success",
                    title: "Strand Created Successfully!",
                });
            } else {
                await axios.put(
                    `${apiPrefix}/strands/${selectedStrand.id}`,
                    formData,
                );
                Toast.fire({
                    icon: "success",
                    title: "Strand Updated Successfully!",
                });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
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

    if (!show) return null;

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1040 }}
            ></div>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ zIndex: 1050 }}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div
                        className="modal-content card-retro border-dark"
                        style={{
                            border: "2px solid black",
                            borderRadius: "12px",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            className="modal-header text-white"
                            style={{
                                backgroundColor: "var(--color-primary)",
                                borderBottom: "2px solid black",
                            }}
                        >
                            <h5 className="modal-title fw-bold font-monospace">
                                {type === "create" ? (
                                    <>
                                        <i className="bi bi-plus-circle me-2"></i>
                                        NEW STRAND
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-pencil-square me-2"></i>
                                        EDIT STRAND
                                    </>
                                )}
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                disabled={isLoading}
                            ></button>
                        </div>

                        <div className="modal-body bg-light p-4">
                            <form onSubmit={handleSubmit}>
                                <fieldset disabled={isLoading}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold font-monospace">
                                            STRAND CODE
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            className="form-control fw-bold border-dark border-2"
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

                                    <div className="mb-4">
                                        <label className="form-label small fw-bold font-monospace">
                                            DESCRIPTION
                                        </label>
                                        <textarea
                                            name="description"
                                            className="form-control border-dark border-2"
                                            rows="3"
                                            placeholder="e.g. Science, Technology, Engineering..."
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-4">
                                        <button
                                            type="submit"
                                            className="btn btn-retro px-4 py-2 fw-bold d-flex align-items-center border-dark"
                                            style={
                                                type === "edit"
                                                    ? {
                                                          backgroundColor:
                                                              "#F4D03F",
                                                      }
                                                    : {}
                                            }
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <i className="bi bi-mortarboard-fill me-2 toga-spin"></i>
                                                    <span>PROCESSING...</span>
                                                </>
                                            ) : type === "create" ? (
                                                <>
                                                    <i className="bi bi-check-circle-fill me-2"></i>
                                                    <span>SUBMIT</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-floppy-fill me-2"></i>
                                                    <span>SAVE CHANGES</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-retro bg-dark px-4 py-2 fw-bold d-flex align-items-center border-dark"
                                            onClick={onClose}
                                            disabled={isLoading}
                                        >
                                            <span>CANCEL</span>
                                        </button>
                                    </div>
                                </fieldset>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
