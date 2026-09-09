import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast"; // Using Toast

export default function SectionDrawer({
    show,
    type,
    selectedSection,
    strands, // Passed from parent
    onClose,
    onSuccess, // Callback to refresh parent
    apiPrefix = "/api", // Default Admin
}) {
    const initialForm = {
        name: "",
        strand_id: "",
        grade_level: "11",
        capacity: "40",
    };

    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (type === "edit" && selectedSection) {
            setFormData({
                name: selectedSection.name,
                strand_id: selectedSection.strand_id,
                grade_level: selectedSection.grade_level,
                capacity: selectedSection.capacity,
            });
        } else {
            setFormData(initialForm);
        }
    }, [type, selectedSection, show]);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    // SMART SUBMIT HANDLER
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (type === "create") {
                await axios.post(`${apiPrefix}/sections`, formData);
                // SUCCESS TOAST
                Toast.fire({
                    icon: "success",
                    title: "Section Created Successfully!",
                });
            } else {
                await axios.put(
                    `${apiPrefix}/sections/${selectedSection.id}`,
                    formData,
                );
                // SUCCESS TOAST
                Toast.fire({
                    icon: "success",
                    title: "Section Updated Successfully!",
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
                                <i className="bi bi-plus-square me-2"></i>NEW
                                SECTION
                            </>
                        ) : (
                            <>
                                <i className="bi bi-pencil-square me-2"></i>EDIT
                                SECTION
                            </>
                        )}
                    </h5>
                    <button
                        type="button"
                        className="btn-close btn-close-white opacity-100"
                        onClick={onClose}
                    ></button>
                </div>

                <div className="offcanvas-body bg-light">
                    <form
                        onSubmit={handleSubmit}
                        className="d-flex flex-column gap-4"
                    >
                        <div className="card-retro p-4 bg-white">
                            <h6 className="fw-bold mb-3 pb-2 border-bottom border-dark font-monospace text-uppercase text-primary">
                                Section Details
                            </h6>

                            {/* SECTION NAME */}
                            <div className="mb-3">
                                <label className="form-label small fw-bold font-monospace">
                                    SECTION NAME
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control fw-bold"
                                    placeholder="e.g. Einstein"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* STRAND DROPDOWN */}
                            <div className="mb-3">
                                <label className="form-label small fw-bold font-monospace">
                                    STRAND
                                </label>
                                <select
                                    name="strand_id"
                                    className="form-select"
                                    value={formData.strand_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Strand</option>
                                    {strands.map((strand) => (
                                        <option
                                            key={strand.id}
                                            value={strand.id}
                                        >
                                            {strand.code} - {strand.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* GRADE LEVEL & CAPACITY */}
                            <div className="row">
                                <div className="col-6">
                                    <label className="form-label small fw-bold font-monospace">
                                        GRADE LEVEL
                                    </label>
                                    <select
                                        name="grade_level"
                                        className="form-select"
                                        value={formData.grade_level}
                                        onChange={handleChange}
                                    >
                                        <option value="11">Grade 11</option>
                                        <option value="12">Grade 12</option>
                                    </select>
                                </div>
                                <div className="col-6">
                                    <label className="form-label small fw-bold font-monospace">
                                        CAPACITY
                                    </label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        className="form-control"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

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
                                "CREATE SECTION"
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
