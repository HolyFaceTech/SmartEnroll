import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";

export default function SubjectModal({
    show,
    type,
    selectedSubject,
    strands,
    onClose,
    onSuccess,
    apiPrefix = "/api",
}) {
    const initialForm = {
        code: "",
        description: "",
        strand_id: "",
        grade_level: "11",
        term: "1st",
    };

    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (type === "edit" && selectedSubject) {
            setFormData({
                code: selectedSubject.code,
                description: selectedSubject.description,
                strand_id: selectedSubject.strand_id || "",
                grade_level: selectedSubject.grade_level,
                term: selectedSubject.term,
            });
        } else {
            setFormData(initialForm);
        }
    }, [type, selectedSubject, show]);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const payload = { ...formData };

        try {
            if (type === "create") {
                await axios.post(`${apiPrefix}/subjects`, payload);
                Toast.fire({ icon: "success", title: "Subject Created!" });
            } else {
                await axios.put(
                    `${apiPrefix}/subjects/${selectedSubject.id}`,
                    payload,
                );
                Toast.fire({ icon: "success", title: "Subject Updated!" });
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
                                        <i className="bi bi-book-half me-2"></i>
                                        NEW SUBJECT
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-pencil-square me-2"></i>
                                        EDIT SUBJECT
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
                                            SUBJECT CODE
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            className="form-control fw-bold border-dark border-2"
                                            placeholder="e.g. CORE01"
                                            value={formData.code}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold font-monospace">
                                            DESCRIPTION
                                        </label>
                                        <textarea
                                            name="description"
                                            className="form-control border-dark border-2"
                                            rows="2"
                                            placeholder="e.g. Oral Communication"
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
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
                                                SELECT A STRAND
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
                                                TERM
                                            </label>
                                            <select
                                                name="term"
                                                className="form-select border-dark border-2 fw-bold"
                                                value={formData.term}
                                                onChange={handleChange}
                                            >
                                                <option value="1st">
                                                    1st Term
                                                </option>
                                                <option value="2nd">
                                                    2nd Term
                                                </option>
                                                <option value="3rd">
                                                    3rd Term
                                                </option>
                                            </select>
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
