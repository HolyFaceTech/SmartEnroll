import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";

export default function SectionModal({
    show,
    type,
    selectedSection,
    strands,
    onClose,
    onSuccess,
    apiPrefix = "/api",
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (type === "create") {
                await axios.post(`${apiPrefix}/sections`, formData);
                Toast.fire({
                    icon: "success",
                    title: "Section Created Successfully!",
                });
            } else {
                await axios.put(
                    `${apiPrefix}/sections/${selectedSection.id}`,
                    formData,
                );
                Toast.fire({
                    icon: "success",
                    title: "Section Updated Successfully!",
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
                                        <i className="bi bi-plus-square me-2"></i>
                                        NEW SECTION
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-pencil-square me-2"></i>
                                        EDIT SECTION
                                    </>
                                )}
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white opacity-100"
                                onClick={onClose}
                                disabled={isLoading}
                            ></button>
                        </div>

                        <div className="modal-body bg-light p-4">
                            <form onSubmit={handleSubmit}>
                                <fieldset disabled={isLoading}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold font-monospace">
                                            SECTION NAME
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control fw-bold border-dark border-2"
                                            placeholder="e.g. Einstein"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold font-monospace">
                                            STRAND
                                        </label>
                                        <select
                                            name="strand_id"
                                            className="form-select border-dark border-2 fw-bold"
                                            value={formData.strand_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>
                                                Select Strand
                                            </option>
                                            {Array.isArray(strands) &&
                                                strands.map((strand) => (
                                                    <option
                                                        key={strand.id}
                                                        value={strand.id}
                                                    >
                                                        {strand.code} -{" "}
                                                        {strand.description}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div className="row mb-4">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                GRADE LEVEL
                                            </label>
                                            <select
                                                name="grade_level"
                                                className="form-select border-dark border-2 fw-bold"
                                                value={formData.grade_level}
                                                onChange={handleChange}
                                            >
                                                <option value="11">
                                                    Grade 11
                                                </option>
                                                <option value="12">
                                                    Grade 12
                                                </option>
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                CAPACITY
                                            </label>
                                            <input
                                                type="number"
                                                name="capacity"
                                                className="form-control border-dark border-2 fw-bold"
                                                value={formData.capacity}
                                                onChange={handleChange}
                                                min="1"
                                                required
                                            />
                                        </div>
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
