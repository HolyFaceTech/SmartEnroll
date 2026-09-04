import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";
import StrandConfirmation from "./StrandConfirmation";
import Loading from "../utils/Loading";

export default function StrandModal({
    show,
    type,
    selectedStrand,
    onClose,
    onSuccess,
}) {
    const initialForm = { code: "", description: "" };
    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ show: false });

    useEffect(() => {
        if (type === "edit" && selectedStrand) {
            setFormData(selectedStrand);
        } else {
            setFormData(initialForm);
        }
    }, [type, selectedStrand, show]);

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
                "Are you sure you want to create this new strand?"
            ) : (
                <>
                    Are you sure you want to save changes for <br />
                    <strong>{formData.code}</strong>?
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
                const res = await axios.post("/api/strands", formData, {
                    headers,
                });
                Toast.fire({
                    icon: "success",
                    title: res.data.message || "Strand Created Successfully!",
                });
            } else {
                const res = await axios.put(
                    `/api/strands/${selectedStrand.id}`,
                    formData,
                    { headers },
                );
                Toast.fire({
                    icon: "success",
                    title: res.data.message || "Strand Updated Successfully!",
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
                                        <i className="bi bi-diagram-3-fill me-2"></i>
                                        CREATE STRAND
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-pencil-square me-2"></i>
                                        UPDATE STRAND
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
                                        STRAND DETAILS
                                    </div>
                                    <div className="card-body row g-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-hash me-1"></i>{" "}
                                                STRAND CODE
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                name="code"
                                                className="form-control border-dark text-uppercase fw-bold"
                                                placeholder="e.g. STEM"
                                                value={formData.code}
                                                onChange={handleChange}
                                                required
                                                maxLength="20"
                                                disabled={isLoading}
                                            />
                                            <div className="form-text small fst-italic font-monospace mt-1">
                                                Unique identifier (e.g. ABM,
                                                GAS). Max 20 chars.
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-card-text me-1"></i>{" "}
                                                DESCRIPTION
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <textarea
                                                name="description"
                                                className="form-control border-dark"
                                                rows="3"
                                                placeholder="e.g. Science, Technology, Engineering, and Mathematics"
                                                value={formData.description}
                                                onChange={handleChange}
                                                required
                                                disabled={isLoading}
                                            ></textarea>
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
                                            ? "CREATE STRAND"
                                            : "SAVE CHANGES"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <StrandConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeSubmit}
            />

            <Loading
                show={isLoading}
                message={
                    type === "create"
                        ? "CREATING STRAND..."
                        : "SAVING CHANGES..."
                }
            />
        </>
    );
}
