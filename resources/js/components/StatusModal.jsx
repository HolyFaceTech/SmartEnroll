import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";
import StatusConfirmation from "./StatusConfirmation";
import Loading from "../utils/Loading";

export default function StatusModal({
    show,
    type,
    selectedStatus,
    onClose,
    onSuccess,
    apiPrefix = "/api",
}) {
    const initialForm = {
        name: "",
        description: "",
    };

    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ show: false });

    useEffect(() => {
        if ((type === "edit" || type === "view") && selectedStatus) {
            setFormData({
                name: selectedStatus.name || "",
                description: selectedStatus.description || "",
                status: selectedStatus.status || "processing",
                done_at: selectedStatus.done_at,
                created_at: selectedStatus.created_at,
            });
        } else {
            setFormData(initialForm);
        }
    }, [type, selectedStatus, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const actionName = type === "create" ? "CREATE" : "UPDATE";
        const btnColor = type === "create" ? "#3F9AAE" : "#F4D03F";
        const icon =
            type === "create" ? "bi-plus-square-fill" : "bi-pencil-square";

        const messageContent =
            type === "create" ? (
                "Are you sure you want to create this new system status?"
            ) : (
                <>
                    Are you sure you want to update the records of <br />{" "}
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
                    `${apiPrefix}/statuses`,
                    formData,
                    { headers },
                );
                Toast.fire({
                    icon: "success",
                    title: res.data.message || "Status Created Successfully!",
                });
            } else {
                const res = await axios.put(
                    `${apiPrefix}/statuses/${selectedStatus.id}`,
                    formData,
                    { headers },
                );
                Toast.fire({
                    icon: "success",
                    title: res.data.message || "Status Updated Successfully!",
                });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            let msg = "Action Failed";
            if (error.response?.status === 422)
                msg = Object.values(error.response.data.errors)
                    .flat()
                    .join("\n");
            else if (error.response?.data?.message)
                msg = error.response.data.message;
            Toast.fire({ icon: "error", title: msg });
        } finally {
            setIsLoading(false);
        }
    };

    if (!show) return null;

    const isUpdate = type === "edit";
    const headerBgColor = isUpdate ? "#F4D03F" : "var(--color-primary)";
    const headerTextColor = isUpdate ? "text-dark" : "text-white";

    const getBadgeColor = (status) => {
        return status?.toLowerCase() === "done"
            ? "bg-success text-white"
            : "bg-warning text-dark";
    };

    if (type === "view") {
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
                                style={{
                                    backgroundColor: "var(--color-primary)",
                                }}
                            >
                                <h5 className="modal-title fw-bold font-monospace">
                                    <i className="bi bi-info-square-fill me-2"></i>{" "}
                                    STATUS DETAILS
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={onClose}
                                ></button>
                            </div>
                            <div className="modal-body bg-light">
                                <div className="text-center mb-4 mt-2">
                                    <h4
                                        className="fw-black text-dark mb-1 font-monospace text-uppercase"
                                        style={{ letterSpacing: "1px" }}
                                    >
                                        {formData.name}
                                    </h4>
                                    <div
                                        className={`d-inline-block px-4 py-2 mt-2 border border-2 border-dark font-monospace ${getBadgeColor(formData.status)}`}
                                        style={{
                                            boxShadow:
                                                "4px 4px 0 rgba(0,0,0,0.2)",
                                            fontWeight: "bold",
                                            letterSpacing: "2px",
                                        }}
                                    >
                                        {formData.status
                                            ? formData.status.toUpperCase()
                                            : "N/A"}
                                    </div>
                                </div>
                                <div className="card border-2 border-dark mb-4">
                                    <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                        <i className="bi bi-card-list me-2"></i>{" "}
                                        INFORMATION DETAILS
                                    </div>
                                    <div className="card-body p-3 bg-white">
                                        <div
                                            className="mb-3 border-bottom border-dark border-1"
                                            style={{
                                                borderBottomStyle: "dashed",
                                            }}
                                        >
                                            <span className="fw-bold text-muted small text-uppercase font-monospace d-block mb-1">
                                                <i className="bi bi-card-text me-2"></i>{" "}
                                                Description:
                                            </span>
                                            <p className="font-monospace fw-bold text-dark mb-3">
                                                {formData.description}
                                            </p>
                                        </div>
                                        <div
                                            className="d-flex justify-content-between align-items-center py-2 border-bottom border-dark border-1"
                                            style={{
                                                borderBottomStyle: "dashed",
                                            }}
                                        >
                                            <span className="fw-bold text-muted small text-uppercase font-monospace">
                                                Created At:
                                            </span>
                                            <span className="fw-bolder font-monospace text-dark text-end">
                                                {formData.created_at
                                                    ? new Date(
                                                          formData.created_at,
                                                      ).toLocaleDateString()
                                                    : ""}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center py-2">
                                            <span className="fw-bold text-muted small text-uppercase font-monospace">
                                                Done At:
                                            </span>
                                            <span
                                                className={`fw-bolder font-monospace text-end ${formData.done_at ? "text-success" : "text-muted"}`}
                                            >
                                                {formData.done_at
                                                    ? new Date(
                                                          formData.done_at,
                                                      ).toLocaleDateString()
                                                    : "-/-/-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-end gap-2 pt-3 border-top border-dark">
                                    <button
                                        type="button"
                                        className="btn btn-dark fw-bold px-4 btn-press-retro"
                                        onClick={onClose}
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

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
                                <i
                                    className={`bi ${type === "create" ? "bi-plus-square-fill" : "bi-pencil-square"} me-2`}
                                ></i>
                                {type === "create"
                                    ? "CREATE STATUS"
                                    : "UPDATE STATUS"}
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
                                        <i className="bi bi-clipboard-data-fill me-2"></i>{" "}
                                        STATUS DETAILS
                                    </div>
                                    <div className="card-body row g-3">
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-tag-fill me-1"></i>{" "}
                                                STATUS NAME{" "}
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control border-dark"
                                                placeholder="e.g., Server Update"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold font-monospace">
                                                <i className="bi bi-card-text me-1"></i>{" "}
                                                DESCRIPTION{" "}
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>
                                            <textarea
                                                name="description"
                                                className="form-control border-dark"
                                                rows="3"
                                                placeholder="Brief description of this status..."
                                                value={formData.description}
                                                onChange={handleChange}
                                                required
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
                                            ? "SUBMIT"
                                            : "SAVE CHANGES"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <StatusConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeSubmit}
            />
            <Loading
                show={isLoading}
                message={
                    type === "create"
                        ? "CREATING STATUS..."
                        : "SAVING CHANGES..."
                }
            />
        </>
    );
}
