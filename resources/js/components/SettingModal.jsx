import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";
import SettingConfirmation from "./SettingConfirmation";
import Loading from "../utils/Loading";
import moment from "moment";

export default function SettingModal({
    show,
    type,
    currentSettings,
    onClose,
    onSuccess,
}) {
    const initialForm = {
        start_date: "",
        end_date: "",
        school_year: "",
        term: "1st",
    };

    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ show: false });

    useEffect(() => {
        if (type === "edit" && currentSettings) {
            setFormData({
                start_date: currentSettings.start_date
                    ? moment(currentSettings.start_date).format("YYYY-MM-DD")
                    : "",
                end_date: currentSettings.end_date
                    ? moment(currentSettings.end_date).format("YYYY-MM-DD")
                    : "",
                school_year: currentSettings.school_year || "",
                term: currentSettings.term || "1st",
            });
        } else {
            setFormData(initialForm);
        }
    }, [type, currentSettings, show]);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const actionName = type === "create" ? "CREATE" : "UPDATE";
        const btnColor = type === "create" ? "#3F9AAE" : "#F4D03F";
        const icon =
            type === "create" ? "bi-calendar-plus" : "bi-pencil-square";

        const messageContent =
            type === "create" ? (
                "Are you sure you want to create this new schedule?"
            ) : (
                <>
                    Are you sure you want to save changes for <br />
                    <strong>Enrollment Schedule</strong>?
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
                const res = await axios.post("/api/settings", formData, {
                    headers,
                });
                Toast.fire({
                    icon: "success",
                    title: res.data.message || "Settings Created Successfully!",
                });
            } else {
                const res = await axios.put("/api/settings", formData, {
                    headers,
                });
                Toast.fire({
                    icon: "success",
                    title: res.data.message || "Settings Updated Successfully!",
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
                                        <i className="bi bi-calendar-plus me-2"></i>
                                        CREATE SCHEDULE
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-pencil-square me-2"></i>
                                        UPDATE SCHEDULE
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
                                        <i className="bi bi-gear-fill me-2"></i>{" "}
                                        CONFIGURATION
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold font-monospace">
                                                    <i className="bi bi-calendar-check-fill me-1"></i>{" "}
                                                    START DATE{" "}
                                                    <span className="text-danger ms-1">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="start_date"
                                                    className="form-control border-dark font-monospace"
                                                    value={formData.start_date}
                                                    onChange={handleChange}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold font-monospace">
                                                    <i className="bi bi-calendar-x-fill me-1"></i>{" "}
                                                    END DATE{" "}
                                                    <span className="text-danger ms-1">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="end_date"
                                                    className="form-control border-dark font-monospace"
                                                    value={formData.end_date}
                                                    onChange={handleChange}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold font-monospace">
                                                    <i className="bi bi-calendar3-fill me-1"></i>{" "}
                                                    SCHOOL YEAR{" "}
                                                    <span className="text-danger ms-1">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="school_year"
                                                    className="form-control border-dark font-monospace fw-bold"
                                                    placeholder="e.g., YYYY-YYYY"
                                                    value={formData.school_year}
                                                    onChange={handleChange}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold font-monospace">
                                                    <i className="bi bi-clock-history me-1"></i>{" "}
                                                    TERM{" "}
                                                    <span className="text-danger ms-1">
                                                        *
                                                    </span>
                                                </label>
                                                <select
                                                    name="term"
                                                    className="form-select border-dark font-monospace"
                                                    value={formData.term}
                                                    onChange={handleChange}
                                                    required
                                                    disabled={isLoading}
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

            <SettingConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeSubmit}
            />
            <Loading
                show={isLoading}
                message={
                    type === "create"
                        ? "CREATING SCHEDULE..."
                        : "SAVING CHANGES..."
                }
            />
        </>
    );
}
