import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import LRNCheckModal from "../../components/LRNCheckModal";
import RequestModal from "../../components/RequestModal";
import EnrollmentModal from "../../components/EnrollmentModal";
import Strands from "./Strands";
import Registrar from "./Registrar";
import FAQ from "./FAQ";

export default function Home() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showLRN, setShowLRN] = useState(false);
    const [showRequest, setShowRequest] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [wizardData, setWizardData] = useState(null);

    const [displayMonth, setDisplayMonth] = useState(moment());

    useEffect(() => {
        document.documentElement.style.scrollBehavior = "smooth";

        axios
            .get("/api/public/settings")
            .then((res) => {
                setSettings(res.data);
                if (res.data && res.data.start_date) {
                    setDisplayMonth(moment(res.data.start_date));
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Fetch Error:", error.response || error);
                setLoading(false);
            });

        return () => {
            document.documentElement.style.scrollBehavior = "auto";
        };
    }, []);

    const isOpen =
        settings?.start_date &&
        moment().isBetween(settings.start_date, settings.end_date, "day", "[]");

    const handleCloseWizard = () => {
        setShowWizard(false);
        setWizardData(null);
        window.location.reload();
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
    const grid = `linear-gradient(to right, rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)`;

    return (
        <div className="position-relative w-100 font-monospace">
            <section
                id="home"
                className="position-relative"
                style={{
                    minHeight: "85vh",
                    paddingTop: "6rem",
                    backgroundColor: "#FFE2AF",
                    backgroundImage: grid,
                    backgroundSize: "20px 20px",
                }}
            >
                <div
                    className="position-absolute w-100 h-100 overflow-hidden"
                    style={{
                        zIndex: 0,
                        pointerEvents: "none",
                        top: 0,
                        left: 0,
                    }}
                >
                    <i
                        className="bi bi-book position-absolute text-dark display-1"
                        style={{
                            top: "10%",
                            left: "5%",
                            opacity: "0.05",
                            transform: "rotate(-15deg)",
                        }}
                    ></i>
                    <i
                        className="bi bi-mortarboard position-absolute text-dark display-1"
                        style={{
                            top: "10%",
                            right: "5%",
                            opacity: "0.05",
                            transform: "rotate(15deg)",
                        }}
                    ></i>
                    <i
                        className="bi bi-laptop position-absolute text-dark display-1"
                        style={{
                            bottom: "10%",
                            left: "5%",
                            opacity: "0.05",
                            transform: "rotate(-15deg)",
                        }}
                    ></i>
                    <i
                        className="bi bi-pencil position-absolute text-dark display-1"
                        style={{
                            bottom: "10%",
                            right: "5%",
                            opacity: "0.05",
                            transform: "rotate(15deg)",
                        }}
                    ></i>
                </div>

                <div
                    className="container position-relative"
                    style={{ zIndex: 1 }}
                >
                    <div className="row align-items-center g-5 mb-5">
                        <div className="col-lg-6 text-center text-lg-start">
                            <div className="d-inline-block bg-white border border-2 border-dark px-3 py-1 mb-3 shadow-sm btn-action-retro">
                                <span
                                    className="fw-bold text-uppercase text-dark small"
                                    style={{ letterSpacing: "2px" }}
                                >
                                    🚀 WELCOME TO SMARTENROLL
                                </span>
                            </div>

                            <h1
                                className="display-1 fw-black text-uppercase mb-4"
                                style={{
                                    color: "#2d3436",
                                    textShadow: "4px 4px 0 #3F9AAE",
                                    lineHeight: "0.9",
                                    letterSpacing: "-2px",
                                }}
                            >
                                YOUR FUTURE <br /> STARTS HERE🎓
                            </h1>

                            <p
                                className="shadow-sm btn-action-retro lead fw-bold text-muted mb-5 bg-white p-3 border border-dark mx-auto mx-lg-0"
                                style={{
                                    maxWidth: "600px",
                                    boxShadow: "4px 4px 0px #000",
                                }}
                            >
                                The official online enrollment portal. Manage
                                your academic journey with ease and security.
                            </p>

                            <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-3">
                                <button
                                    className={`btn btn-lg px-4 py-3 fw-black border-2 border-dark d-inline-flex align-items-center justify-content-center gap-2 ${isOpen ? "btn-retro-effect text-white" : "btn-secondary opacity-75"}`}
                                    style={{
                                        boxShadow: isOpen
                                            ? "4px 4px 0px #000"
                                            : "none",
                                        backgroundColor: isOpen
                                            ? "#3F9AAE"
                                            : "",
                                    }}
                                    onClick={() => setShowLRN(true)}
                                    disabled={!isOpen}
                                >
                                    {isOpen ? (
                                        <>
                                            <i className="bi bi-pencil-square"></i>{" "}
                                            ENROLL NOW!
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-lock-fill"></i>{" "}
                                            ENROLLMENT CLOSED
                                        </>
                                    )}
                                </button>

                                <button
                                    className="btn btn-warning btn-lg px-4 py-3 fw-black border-2 border-dark d-inline-flex align-items-center justify-content-center gap-2 btn-retro-effect text-dark"
                                    style={{
                                        boxShadow: "4px 4px 0px #000",
                                    }}
                                    onClick={() => setShowRequest(true)}
                                >
                                    <i className="bi bi-file-earmark-text"></i>{" "}
                                    REQUEST DOCUMENT
                                </button>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <div
                                className="card-retro overflow-hidden border-dark"
                                style={{
                                    borderBottomWidth: "3px",
                                    borderRightWidth: "3px",
                                }}
                            >
                                <div
                                    className="text-white px-3 py-3 d-flex flex-wrap justify-content-between align-items-center border-bottom border-dark font-monospace fw-bold"
                                    style={{ backgroundColor: "#F96E5B" }}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            className="btn btn-dark btn-sm rounded-0 border border-white btn-action-retro px-2"
                                            onClick={prevMonth}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                        <h5
                                            className="mb-0 text-uppercase fw-bold m-0 d-flex align-items-center px-2"
                                            style={{ letterSpacing: "1px" }}
                                        >
                                            <i className="bi bi-calendar-week me-2 d-none d-sm-inline"></i>
                                            {displayMonth.format("MMMM YYYY")}
                                        </h5>
                                        <button
                                            className="btn btn-dark btn-sm rounded-0 border border-white btn-action-retro px-2"
                                            onClick={nextMonth}
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </div>

                                    {settings?.school_year && (
                                        <div className="d-flex align-items-center mt-2 mt-sm-0 shadow-sm btn-action-retro">
                                            <span
                                                className="badge bg-dark border border-white text-white rounded-0 px-3 py-2"
                                                style={{
                                                    fontSize: "0.8rem",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                S.Y. {settings.school_year} |{" "}
                                                {settings.term} TERM
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="card-body p-0 d-flex flex-column bg-white">
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(7, 1fr)",
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
                                                style={{
                                                    borderRightWidth: "1px",
                                                    fontSize: "0.8rem",
                                                }}
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="d-flex flex-column">
                                        {loading ? (
                                            <div className="text-center py-5">
                                                <div className="spinner-border border-dark"></div>
                                            </div>
                                        ) : (
                                            generateCalendar().map(
                                                (week, wIndex) => (
                                                    <div
                                                        key={wIndex}
                                                        style={{
                                                            display: "grid",
                                                            gridTemplateColumns:
                                                                "repeat(7, 1fr)",
                                                        }}
                                                    >
                                                        {week.map(
                                                            (day, dIndex) => {
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
                                                                        key={
                                                                            dIndex
                                                                        }
                                                                        className="border-end border-bottom border-dark position-relative p-2 d-flex flex-column"
                                                                        style={{
                                                                            minHeight:
                                                                                "85px",
                                                                            backgroundColor:
                                                                                isEnrollmentDay
                                                                                    ? "#ffeaa7"
                                                                                    : isCurrentMonth
                                                                                      ? "#fff"
                                                                                      : "#f8f9fa",
                                                                            opacity:
                                                                                isCurrentMonth
                                                                                    ? 1
                                                                                    : 0.4,
                                                                            borderRightWidth:
                                                                                "1px",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            className={`fw-bold fs-6 ${isEnrollmentDay ? "text-dark" : "text-muted"}`}
                                                                        >
                                                                            {day.format(
                                                                                "D",
                                                                            )}
                                                                        </span>
                                                                        {isEnrollmentDay && (
                                                                            <div className="mt-auto text-center w-100 px-1 pb-1 ">
                                                                                <div
                                                                                    className=" border border-dark text-white py-1 w-100 shadow-sm btn-action-retro"
                                                                                    style={{
                                                                                        backgroundColor:
                                                                                            "#3F9AAE",
                                                                                        fontSize:
                                                                                            "0.55rem",
                                                                                        letterSpacing:
                                                                                            "1px",
                                                                                        boxShadow:
                                                                                            "2px 2px 0px #000",
                                                                                    }}
                                                                                >
                                                                                    OPEN
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                ),
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="strands"
                style={{
                    backgroundColor: "#ffffff",
                    backgroundImage: grid,
                    backgroundSize: "20px 20px",
                    paddingTop: "60px",
                    paddingBottom: "40px",
                    borderTop: "3px solid #000",
                }}
            >
                <Strands />
            </section>

            <section
                id="registrar"
                style={{
                    backgroundColor: "#79C9C5",
                    backgroundImage: grid,
                    backgroundSize: "20px 20px",
                    paddingTop: "60px",
                    paddingBottom: "60px",
                    borderTop: "3px solid #000",
                    borderBottom: "3px solid #000",
                }}
            >
                <Registrar />
            </section>

            <section
                id="faq"
                style={{
                    backgroundColor: "#FFE2AF",
                    backgroundImage: grid,
                    backgroundSize: "20px 20px",
                    paddingTop: "60px",
                    paddingBottom: "80px",
                }}
            >
                <FAQ />
            </section>

            <LRNCheckModal
                show={showLRN}
                onClose={() => setShowLRN(false)}
                onProceed={(data) => {
                    setWizardData(data);
                    setShowLRN(false);
                    setShowWizard(true);
                }}
            />

            <RequestModal
                show={showRequest}
                onClose={() => setShowRequest(false)}
            />

            {showWizard && (
                <EnrollmentModal
                    initialData={wizardData}
                    settings={settings}
                    onClose={handleCloseWizard}
                />
            )}
        </div>
    );
}
