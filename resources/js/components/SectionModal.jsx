import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";
import SectionConfirmation from "./SectionConfirmation";
import Loading from "../utils/Loading";

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
    const [confirmConfig, setConfirmConfig] = useState({ show: false });

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

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const actionName = type === "create" ? "CREATE" : "UPDATE";
        const btnColor = type === "create" ? "#3F9AAE" : "#F4D03F";
        const icon =
            type === "create" ? "bi-plus-square-fill" : "bi-pencil-square";

        const messageContent =
            type === "create" ? (
                "Are you sure you want to create this new section?"
            ) : (
                <>
                    Are you sure you want to save changes for <br />
                    <strong>{formData.name}</strong>?
                </>
            );

        setConfirmConfig({
            show: true,
            title: `CONFIRM ${actionName}?`,
            message: messageContent,
            confirmText: `YES, ${actionName}`,
            confirmColor: btnColor,
            iconClass: icon,
        });
    };

    const executeSubmit = async () => {
        setConfirmConfig({ show: false });
        setIsLoading(true);

        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (type === "create") {
                const res = await axios.post(
                    `${apiPrefix}/sections`,
                    formData,
                    { headers },
                );
                Toast.fire({
                    icon: "success",
                    title: res.data.message || "Section Created Successfully!",
                });
            } else {
                const res = await axios.put(
                    `${apiPrefix}/sections/${selectedSection.id}`,
                    formData,
                    { headers },
                );
                Toast.fire({
                    icon: "success",
                    title: res.data.message || "Section Updated Successfully!",
                });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            let msg = "Action Failed";
            if (error.response?.status === 422) {
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

    const isUpdate = type === "edit";
    const headerBgColor = isUpdate ? "#F4D03F" : "var(--color-primary)";
    const headerTextColor = isUpdate ? "text-dark" : "text-white";

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
                            className={`modal-header border-bottom border-dark ${headerTextColor}`}
                            style={{ backgroundColor: headerBgColor }}
                        >
                            <h5 className="modal-title fw-bold font-monospace">
                                {type === "create" ? (
                                    <>
                                        <i className="bi bi-grid-3x3-gap-fill me-2"></i>
                                        CREATE SECTION
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-pencil-square me-2"></i>
                                        UPDATE SECTION
                                    </>
                                )}
                            </h5>
                            <button
                                type="button"
                                className={`btn-close ${!isUpdate ? "btn-close-white" : ""}`}
                                onClick={onClose}
                            ></button>
                        </div>

                        <div className="modal-body bg-light">
                            <form onSubmit={handleFormSubmit}>
                                <div className="card border-2 border-dark mb-4">
                                    <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                        <i className="bi bi-info-square-fill me-2"></i>{" "}
                                        SECTION DETAILS
                                    </div>
                                    <div className="card-body row g-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-door-open-fill me-1"></i>{" "}
                                                SECTION NAME{" "}
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control border-dark fw-bold text-uppercase"
                                                placeholder="e.g. EINSTEIN"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-diagram-3-fill me-1"></i>{" "}
                                                STRAND{" "}
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                name="strand_id"
                                                className="form-select border-dark"
                                                value={formData.strand_id}
                                                onChange={handleChange}
                                                required
                                                disabled={isLoading}
                                            >
                                                <option value="">
                                                    Select Strand
                                                </option>
                                                {strands.map((strand) => (
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

                                        <div className="col-6">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-bar-chart-steps me-1"></i>{" "}
                                                GRADE LEVEL{" "}
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                name="grade_level"
                                                className="form-select border-dark"
                                                value={formData.grade_level}
                                                onChange={handleChange}
                                                required
                                                disabled={isLoading}
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
                                                <i className="bi bi-people-fill me-1"></i>{" "}
                                                CAPACITY{" "}
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="number"
                                                name="capacity"
                                                className="form-control border-dark"
                                                value={formData.capacity}
                                                onChange={handleChange}
                                                min="1"
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark">
                                    <button
                                        type="button"
                                        className="btn btn-dark fw-bold px-4 btn-press-retro"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        type="submit"
                                        className={`btn border-2 border-dark fw-bold px-4 btn-press-retro d-flex align-items-center ${!isUpdate ? "text-white" : "text-dark"}`}
                                        style={{
                                            backgroundColor: headerBgColor,
                                        }}
                                        disabled={isLoading}
                                    >
                                        {type === "create"
                                            ? "CREATE SECTION"
                                            : "SAVE CHANGES"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <SectionConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeSubmit}
            />

            <Loading
                show={isLoading}
                message={
                    type === "create"
                        ? "CREATING SECTION..."
                        : "SAVING CHANGES..."
                }
            />
        </>
    );
}
