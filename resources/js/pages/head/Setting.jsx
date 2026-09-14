import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../../utils/toast";
import moment from "moment";
import SettingModal from "../../components/SettingModal";
import SettingConfirmation from "../../components/SettingConfirmation";
import Loading from "../../utils/Loading";

export default function Setting() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const [displayMonth, setDisplayMonth] = useState(moment());

    const [modalConfig, setModalConfig] = useState({
        show: false,
        type: "create",
    });
    const [confirmConfig, setConfirmConfig] = useState({ show: false });
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchSettings = async () => {
        try {
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");
            const res = await axios.get("/api/settings", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const fetchedSettings = res.data;
            setSettings(fetchedSettings);

            if (fetchedSettings && fetchedSettings.start_date) {
                setDisplayMonth(moment(fetchedSettings.start_date));
            }
        } catch (error) {
            console.error(error);
            Toast.fire({
                icon: "error",
                title: "Failed to load enrollment settings.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleDeleteClick = () => {
        setConfirmConfig({
            show: true,
            title: "RESET SCHEDULE?",
            message:
                "This will remove the current enrollment dates and settings.",
            confirmText: "YES, RESET",
            confirmColor: "#ff7675",
            iconClass: "bi-calendar-x",
        });
    };

    const executeDelete = async () => {
        setConfirmConfig({ show: false });
        setIsDeleting(true);

        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        try {
            await axios.delete("/api/settings", {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchSettings();
            window.dispatchEvent(new Event("settings-updated"));
            Toast.fire({
                icon: "success",
                title: "Schedule reset successfully.",
            });
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "Action failed to reset schedule.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const generateCalendar = () => {
        const startDay = displayMonth.clone().startOf("month").startOf("week");
        const endDay = displayMonth.clone().endOf("month").endOf("week");
        const day = startDay.clone().subtract(1, "day");
        const calendar = [];

        while (day.isBefore(endDay, "day")) {
            calendar.push(
                Array(7)
                    .fill(0)
                    .map(() => day.add(1, "day").clone()),
            );
        }
        return calendar;
    };

    const nextMonth = () =>
        setDisplayMonth(displayMonth.clone().add(1, "month"));
    const prevMonth = () =>
        setDisplayMonth(displayMonth.clone().subtract(1, "month"));

    if (loading)
        return (
            <div className="text-center py-5">
                <div
                    className="spinner-border border-dark"
                    style={{ width: "3rem", height: "3rem" }}
                ></div>
            </div>
        );

    const btnClass =
        "btn font-monospace fw-bold btn-retro-effect border-2 border-dark rounded-0 py-2 d-flex align-items-center justify-content-center";

    return (
        <div className="container-fluid fade-in mb-5">
            <div
                className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 gap-3"
                style={{ borderBottom: "2px solid black" }}
            >
                <div>
                    <h2
                        className="fw-bold mb-0 font-monospace text-uppercase"
                        style={{ textShadow: "2px 2px 0 #fff" }}
                    >
                        ENROLLMENT SETTINGS
                    </h2>
                    <p className="text-muted small mb-0 font-monospace fw-bold">
                        Manage Academic Year & Semester Schedule
                    </p>
                </div>

                {!settings?.start_date && (
                    <div>
                        <button
                            className={`${btnClass} px-4 shadow-sm`}
                            style={{
                                backgroundColor: "#3F9AAE",
                                color: "#fff",
                            }}
                            onClick={() =>
                                setModalConfig({ show: true, type: "create" })
                            }
                        >
                            <i className="bi bi-calendar-plus me-2"></i> SETUP
                            SCHEDULE
                        </button>
                    </div>
                )}
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-9">
                    <div className="card-retro overflow-hidden">
                        <div
                            className="text-white px-4 py-3 d-flex flex-wrap justify-content-between align-items-center border-bottom border-dark font-monospace fw-bold"
                            style={{ backgroundColor: "#F96E5B" }}
                        >
                            <div className="d-flex align-items-center gap-3">
                                <button
                                    className="btn btn-dark btn-sm rounded-0 border border-white btn-action-retro"
                                    onClick={prevMonth}
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                                <h4
                                    className="mb-0 text-uppercase fw-bold m-0"
                                    style={{ letterSpacing: "1px" }}
                                >
                                    <i className="bi bi-calendar-week me-2"></i>
                                    {displayMonth.format("MMMM YYYY")}
                                </h4>
                                <button
                                    className="btn btn-dark btn-sm rounded-0 border border-white btn-action-retro"
                                    onClick={nextMonth}
                                >
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </div>

                            <div className="d-flex align-items-center mt-3 mt-md-0">
                                {settings?.school_year && (
                                    <span className="badge bg-dark border border-white text-white rounded-0 px-3 py-2 fs-6 shadow-sm btn-action-retro">
                                        S.Y. {settings.school_year} |{" "}
                                        {settings.term} TERM
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="card-body p-0 d-flex flex-column bg-light">
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(7, 1fr)",
                                    borderBottom: "2px solid black",
                                    backgroundColor: "#FFE2AF",
                                }}
                            >
                                {[
                                    "SUN",
                                    "MON",
                                    "TUE",
                                    "WED",
                                    "THU",
                                    "FRI",
                                    "SAT",
                                ].map((day) => (
                                    <div
                                        key={day}
                                        className="text-center fw-bold font-monospace py-2 border-end border-dark text-dark"
                                        style={{ borderRightWidth: "2px" }}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="d-flex flex-column flex-grow-1">
                                {generateCalendar().map((week, wIndex) => (
                                    <div
                                        key={wIndex}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(7, 1fr)",
                                            flexGrow: 1,
                                        }}
                                    >
                                        {week.map((day, dIndex) => {
                                            const isCurrentMonth =
                                                day.month() ===
                                                displayMonth.month();
                                            const isEnrollmentDay =
                                                settings?.start_date &&
                                                day.isBetween(
                                                    settings.start_date,
                                                    settings.end_date,
                                                    "day",
                                                    "[]",
                                                );

                                            return (
                                                <div
                                                    key={dIndex}
                                                    className="border-end border-bottom border-dark position-relative p-2"
                                                    style={{
                                                        minHeight: "115px",
                                                        backgroundColor:
                                                            isEnrollmentDay
                                                                ? "#ffeaa7"
                                                                : isCurrentMonth
                                                                  ? "#fff"
                                                                  : "#f8f9fa",
                                                        opacity: isCurrentMonth
                                                            ? 1
                                                            : 0.5,
                                                    }}
                                                >
                                                    <span
                                                        className={`fw-bold font-monospace fs-6 ${isEnrollmentDay ? "text-dark" : "text-muted"}`}
                                                    >
                                                        {day.format("D")}
                                                    </span>

                                                    {isEnrollmentDay && (
                                                        <div className="position-absolute top-50 start-50 translate-middle w-100 text-center px-1">
                                                            <div
                                                                className="badge bg-primary border border-dark text-white rounded-0 py-1 w-100 btn-action-retro"
                                                                style={{
                                                                    fontSize:
                                                                        "0.65rem",
                                                                    letterSpacing:
                                                                        "1px",
                                                                    boxShadow:
                                                                        "2px 2px 0px #000",
                                                                }}
                                                            >
                                                                ENROLLMENT
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-3">
                    <div className="card-retro mb-4">
                        <div className="card-header border-bottom border-dark bg-dark text-white fw-bold font-monospace px-4 py-2">
                            <i className="bi bi-info-circle-fill me-2"></i>{" "}
                            STATUS
                        </div>
                        <div className="card-body p-4 d-flex flex-column font-monospace">
                            {settings?.start_date ? (
                                <>
                                    <div className="mb-4">
                                        <small className="text-muted fw-bold d-block mb-1">
                                            START DATE:
                                        </small>
                                        <h5 className="fw-bold m-0">
                                            {moment(settings.start_date).format(
                                                "MMMM D, YYYY",
                                            )}
                                        </h5>
                                    </div>
                                    <div className="mb-4">
                                        <small className="text-muted fw-bold d-block mb-1">
                                            END DATE:
                                        </small>
                                        <h5 className="fw-bold m-0">
                                            {moment(settings.end_date).format(
                                                "MMMM D, YYYY",
                                            )}
                                        </h5>
                                    </div>

                                    <hr className="border-dark opacity-100" />

                                    <div className="mt-2 text-center">
                                        <small className="text-muted fw-bold d-block mb-2">
                                            SYSTEM STATUS
                                        </small>
                                        {moment().isBetween(
                                            settings.start_date,
                                            settings.end_date,
                                            "day",
                                            "[]",
                                        ) ? (
                                            <div
                                                className="badge bg-success border border-dark rounded-0 fs-6 p-2 w-100 shadow-sm btn-action-retro"
                                                style={{
                                                    boxShadow: "2px 2px 0 #000",
                                                }}
                                            >
                                                <i className="bi bi-door-open-fill me-2"></i>{" "}
                                                ONGOING
                                            </div>
                                        ) : (
                                            <div
                                                className="badge bg-warning text-dark border border-dark rounded-0 fs-6 p-2 w-100 shadow-sm btn-action-retro"
                                                style={{
                                                    boxShadow: "2px 2px 0 #000",
                                                }}
                                            >
                                                <i className="bi bi-door-closed-fill me-2"></i>{" "}
                                                CLOSED
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <i className="bi bi-exclamation-triangle display-3 text-danger d-block mb-3"></i>
                                    <h5 className="fw-bold">NO ACTIVE DATA</h5>
                                    <p className="small text-muted mb-0">
                                        Setup a schedule to view details.
                                    </p>
                                </div>
                            )}
                        </div>

                        {settings?.start_date && (
                            <div className="card-footer bg-white border-top border-dark p-3 d-flex flex-column gap-2">
                                <button
                                    className={`${btnClass} w-100`}
                                    style={{
                                        backgroundColor: "#f6e58d",
                                        color: "#000",
                                    }}
                                    onClick={() =>
                                        setModalConfig({
                                            show: true,
                                            type: "edit",
                                        })
                                    }
                                >
                                    <i className="bi bi-pencil-square me-2"></i>
                                    UPDATE SCHEDULE
                                </button>

                                <button
                                    className={`${btnClass} w-100`}
                                    style={{
                                        backgroundColor: "#ff7675",
                                        color: "#fff",
                                    }}
                                    onClick={handleDeleteClick}
                                >
                                    <i className="bi bi-trash-fill me-2"></i>
                                    RESET SCHEDULE
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SettingModal
                show={modalConfig.show}
                type={modalConfig.type}
                currentSettings={settings}
                onClose={() => setModalConfig({ show: false, type: "create" })}
                onSuccess={() => {
                    setModalConfig({ show: false, type: "create" });
                    fetchSettings();
                    window.dispatchEvent(new Event("settings-updated"));
                }}
            />

            <SettingConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeDelete}
            />
            <Loading show={isDeleting} message="REMOVING SCHEDULE..." />
        </div>
    );
}
