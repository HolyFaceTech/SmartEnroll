import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
} from "chart.js";
import { Doughnut, Pie, Bar, Line } from "react-chartjs-2";
import Toast from "../../utils/toast";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
);

const centerTextPlugin = {
    id: "centerText",
    beforeDraw: function (chart) {
        if (chart.config.type !== "doughnut") return;
        const {
            ctx,
            chartArea: { top, bottom, left, right, height },
        } = chart;
        ctx.save();
        const fontSize = (height / 114).toFixed(2);
        ctx.font = `bold ${fontSize}em monospace`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = "#000";

        const dataset = chart.config.data.datasets[0];
        const grandTotal = dataset.data.reduce((a, b) => a + b, 0);
        const visibleTotal = dataset.data.reduce((a, b, index) => {
            return chart.getDataVisibility(index) ? a + b : a;
        }, 0);

        const percentage =
            grandTotal > 0 ? Math.round((visibleTotal / grandTotal) * 100) : 0;
        ctx.fillText(percentage + "%", (left + right) / 2, (top + bottom) / 2);
        ctx.restore();
    },
};

export default function SuperAdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState("");

    const [loginActivity, setLoginActivity] = useState({
        labels: [],
        datasets: [],
    });

    const [pendingStatuses, setPendingStatuses] = useState([]);

    const fetchData = async (filter = "") => {
        setLoading(true);
        try {
            const res = await axios.get(
                `/api/super-admin/analytics?year=${filter}`,
            );
            setData(res.data);
            setActiveFilter(res.data.filter_used || filter || "All Time");

            setLoginActivity({
                labels: res.data.super_admin.login_activity.labels,
                datasets: [
                    {
                        label: "System Logins",
                        data: res.data.super_admin.login_activity.data,
                        borderColor: "#3F9AAE",
                        backgroundColor: "#3F9AAE",
                        pointBackgroundColor: "#fff",
                        borderWidth: 3,
                        tension: 0.3,
                    },
                ],
            });

            setPendingStatuses(res.data.super_admin.pending_statuses);

            if (filter) {
                Toast.fire({
                    icon: "info",
                    title: `Viewing Data for: ${filter}`,
                });
            }
        } catch (error) {
            console.error("Error:", error);
            Toast.fire({
                icon: "error",
                title: "Failed to load God View analytics",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilterSubmit = (e) => {
        if (e.key === "Enter") {
            if (searchFilter.trim() === "") {
                fetchData("");
                return;
            }
            const isValidFormat = /^(\d{4}|\d{4}-\d{4})$/.test(
                searchFilter.trim(),
            );
            if (!isValidFormat) {
                Toast.fire({
                    icon: "error",
                    title: "Invalid Format!",
                    text: "Please use 'YYYY' or 'YYYY-YYYY'",
                });
                return;
            }
            fetchData(searchFilter.trim());
        }
    };

    const toggleStatusTask = async (id, currentIsDone) => {
        const newIsDone = !currentIsDone;
        setPendingStatuses(
            pendingStatuses.map((task) =>
                task.id === id ? { ...task, isDone: newIsDone } : task,
            ),
        );

        try {
            await axios.put(`/api/super-admin/statuses/${id}/toggle`, {
                isDone: newIsDone,
            });
            Toast.fire({
                icon: "success",
                title: newIsDone
                    ? "Status marked as Complete!"
                    : "Status marked as Pending",
            });
        } catch (error) {
            setPendingStatuses(
                pendingStatuses.map((task) =>
                    task.id === id ? { ...task, isDone: currentIsDone } : task,
                ),
            );
            Toast.fire({ icon: "error", title: "Failed to update status." });
        }
    };

    if (loading)
        return (
            <div
                className="d-flex flex-column align-items-center justify-content-center"
                style={{ height: "60vh" }}
            >
                <div
                    className="spinner-border border-4 border-dark"
                    style={{ width: "3rem", height: "3rem" }}
                    role="status"
                ></div>
                <span className="mt-3 fw-bold font-monospace">
                    Loading God View...
                </span>
            </div>
        );

    if (!data)
        return <div className="p-5 text-center fw-bold">NO DATA AVAILABLE</div>;

    const { cards, charts } = data;
    const retroColors = ["#3F9AAE", "#F96E5B", "#F4D03F", "#2D3436", "#79C9C5"];
    const border = "#000";

    const totalStrandStudents = charts.students_per_strand.reduce(
        (a, b) => a + b.value,
        0,
    );
    const strandData = {
        labels: charts.students_per_strand.map((i) => {
            const pct =
                totalStrandStudents > 0
                    ? Math.round((i.value / totalStrandStudents) * 100)
                    : 0;
            return `${i.label} (${pct}%)`;
        }),
        datasets: [
            {
                data: charts.students_per_strand.map((i) => i.value),
                backgroundColor: retroColors,
                borderColor: border,
                borderWidth: 2,
            },
        ],
    };

    const sectionData = {
        labels: charts.sections_per_strand.map((i) => i.label),
        datasets: [
            {
                data: charts.sections_per_strand.map((i) => i.value),
                backgroundColor: [...retroColors].reverse(),
                borderColor: border,
                borderWidth: 2,
            },
        ],
    };

    const demoData = {
        labels: charts.demographics.map((i) => i.label),
        datasets: [
            {
                label: "Enrolled Students",
                data: charts.demographics.map((i) => i.value),
                backgroundColor: ["#3F9AAE", "#F4D03F"],
                borderColor: border,
                borderWidth: 2,
                borderRadius: 0,
                barThickness: 120,
            },
        ],
    };

    const trendData = {
        labels: charts.enrollment_trend.labels,
        datasets: [
            {
                label: "Enrolled",
                data: charts.enrollment_trend.enrolled,
                borderColor: "#3F9AAE",
                backgroundColor: "#3F9AAE",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 2,
                tension: 0,
                borderWidth: 3,
            },
            {
                label: "Pending",
                data: charts.enrollment_trend.pending,
                borderColor: "#F4D03F",
                backgroundColor: "#F4D03F",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 2,
                tension: 0,
                borderWidth: 3,
            },
            {
                label: "Released",
                data: charts.enrollment_trend.released,
                borderColor: "#2D3436",
                backgroundColor: "#2D3436",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 2,
                tension: 0,
                borderWidth: 3,
            },
            {
                label: "Graduates",
                data: charts.enrollment_trend.graduate,
                borderColor: "#79C9C5",
                backgroundColor: "#79C9C5",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 2,
                tension: 0,
                borderWidth: 3,
            },
            {
                label: "Dropouts",
                data: charts.enrollment_trend.dropped,
                borderColor: "#F96E5B",
                backgroundColor: "#F96E5B",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 2,
                tension: 0,
                borderWidth: 3,
            },
        ],
    };

    const totalReleased = charts.enrollment_trend.released.reduce(
        (a, b) => a + b,
        0,
    );
    const totalGraduate = charts.enrollment_trend.graduate.reduce(
        (a, b) => a + b,
        0,
    );
    const totalDropped = charts.enrollment_trend.dropped.reduce(
        (a, b) => a + b,
        0,
    );

    const horizontalBarData = {
        labels: ["Released", "Graduates", "Dropouts"],
        datasets: [
            {
                label: "Total Count",
                data: [totalReleased, totalGraduate, totalDropped],
                backgroundColor: ["#2D3436", "#79C9C5", "#F96E5B"],
                borderColor: border,
                borderWidth: 2,
                barThickness: 40,
            },
        ],
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: { font: { family: "monospace" }, color: "#000" },
            },
        },
    };

    return (
        <div className="container-fluid fade-in mb-5">
            <div
                className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3"
                style={{ borderBottom: "2px solid black" }}
            >
                <div>
                    <h2
                        className="fw-bold mb-0 font-monospace text-uppercase"
                        style={{ textShadow: "2px 2px 0 #fff" }}
                    >
                        ANALYTICS DASHBOARD
                    </h2>
                    <p className="text-muted small mb-0 font-monospace fw-bold">
                        Overview for:{" "}
                        <span className="text-primary bg-light px-2 border border-dark">
                            {activeFilter}
                        </span>
                    </p>
                </div>
                <div className="d-flex align-items-center mt-2 mt-md-0">
                    <div
                        className="input-group shadow-sm"
                        style={{ maxWidth: "300px" }}
                    >
                        <span className="input-group-text bg-white border-dark border-2 border-end-0">
                            <i className="bi bi-funnel-fill"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-dark border-2 border-start-0 ps-2 font-monospace"
                            placeholder="Filter Year (YYYY)..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            onKeyDown={handleFilterSubmit}
                        />
                    </div>
                </div>
            </div>

            <div className="row g-3 mb-3">
                <StatCard
                    title="TOTAL ENROLLED"
                    value={cards.total_enrolled}
                    icon="bi-person-check-fill"
                    bgColor="#3F9AAE"
                />
                <StatCard
                    title="PENDING / PASSED"
                    value={cards.total_pending}
                    icon="bi-hourglass-split"
                    bgColor="#F4D03F"
                />
                <StatCard
                    title="FRESHMEN (G11)"
                    value={cards.total_g11}
                    icon="11"
                    isTextIcon
                    bgColor="#79C9C5"
                />
                <StatCard
                    title="OLD STUDENTS (G12)"
                    value={cards.total_g12}
                    icon="12"
                    isTextIcon
                    bgColor="#F96E5B"
                />
            </div>
            <div className="row g-3 mb-4">
                <StatCard
                    title="MALE STUDENTS"
                    value={cards.total_male}
                    icon="bi-gender-male"
                    bgColor="#2980b9"
                    textColor="#fff"
                />
                <StatCard
                    title="FEMALE STUDENTS"
                    value={cards.total_female}
                    icon="bi-gender-female"
                    bgColor="#e74c3c"
                    textColor="#fff"
                />
                <StatCard
                    title="FACE-TO-FACE (F2F)"
                    value={cards.total_f2f}
                    icon="bi-backpack-fill"
                    bgColor="#27ae60"
                    textColor="#fff"
                />
                <StatCard
                    title="MODULAR (DISTANCE)"
                    value={cards.total_modular}
                    icon="bi-journal-richtext"
                    bgColor="#8e44ad"
                    textColor="#fff"
                />
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-4">
                    <div className="card-retro h-100">
                        <div
                            className="card-header bg-white fw-bold border-bottom-0 py-3 px-4 font-monospace"
                            style={{ borderBottom: "2px solid black" }}
                        >
                            ENROLLED PER STRAND
                        </div>
                        <div
                            className="card-body p-3 d-flex justify-content-center align-items-center"
                            style={{ height: "300px" }}
                        >
                            <Doughnut
                                data={strandData}
                                options={commonOptions}
                                plugins={[centerTextPlugin]}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card-retro h-100">
                        <div
                            className="card-header bg-white fw-bold border-bottom-0 py-3 px-4 font-monospace"
                            style={{ borderBottom: "2px solid black" }}
                        >
                            SECTIONS PER STRAND
                        </div>
                        <div
                            className="card-body p-3 d-flex justify-content-center align-items-center"
                            style={{ height: "300px" }}
                        >
                            <Pie data={sectionData} options={commonOptions} />
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card-retro h-100">
                        <div
                            className="card-header bg-white fw-bold border-bottom-0 py-3 px-4 font-monospace"
                            style={{ borderBottom: "2px solid black" }}
                        >
                            FRESHMEN VS OLD (ENROLLED)
                        </div>
                        <div
                            className="card-body p-3"
                            style={{ height: "300px" }}
                        >
                            <Bar data={demoData} options={commonOptions} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card-retro">
                        <div
                            className="card-header bg-white fw-bold py-3 px-4 font-monospace"
                            style={{ borderBottom: "2px solid black" }}
                        >
                            ENROLLMENT TREND (Yearly)
                        </div>
                        <div
                            className="card-body p-4"
                            style={{ height: "400px" }}
                        >
                            <Line
                                data={trendData}
                                options={{
                                    ...commonOptions,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: { stepSize: 1 },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-lg-8">
                    <div className="card-retro h-100">
                        <div
                            className="card-header bg-white fw-bold py-3 px-4 font-monospace d-flex justify-content-between align-items-center"
                            style={{ borderBottom: "2px solid black" }}
                        >
                            <span>
                                <i className="bi bi-graph-up-arrow me-2 text-primary"></i>{" "}
                                SYSTEM LOGIN ACTIVITY
                            </span>
                            <span className="badge bg-dark border border-white text-white">
                                Last 7 Days
                            </span>
                        </div>
                        <div
                            className="card-body p-4 bg-white"
                            style={{ height: "350px" }}
                        >
                            <Line
                                data={loginActivity}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: true } },
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card-retro h-100">
                        <div
                            className="card-header bg-white fw-bold py-3 px-4 font-monospace"
                            style={{ borderBottom: "2px solid black" }}
                        >
                            <i className="bi bi-bar-chart-steps me-2 text-danger"></i>{" "}
                            OUTCOME TOTALS
                        </div>
                        <div
                            className="card-body p-4 bg-white"
                            style={{ height: "350px" }}
                        >
                            <Bar
                                data={horizontalBarData}
                                options={{
                                    indexAxis: "y",
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: {
                                            beginAtZero: true,
                                            ticks: { stepSize: 1 },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card-retro">
                        <div
                            className="card-header bg-white fw-bold py-3 px-4 font-monospace d-flex justify-content-between align-items-center"
                            style={{ borderBottom: "2px solid black" }}
                        >
                            <span>
                                <i className="bi bi-list-check me-2 text-warning"></i>{" "}
                                SYSTEM STATUSES TO-DO
                            </span>
                            <button
                                className="btn btn-sm btn-dark font-monospace fw-bold rounded-0"
                                style={{ border: "1px solid black" }}
                            >
                                Manage Statuses &rarr;
                            </button>
                        </div>
                        <div className="card-body p-0 bg-light">
                            <ul className="list-group list-group-flush font-monospace">
                                {pendingStatuses.length === 0 ? (
                                    <li className="list-group-item p-4 text-center text-muted fw-bold">
                                        No pending statuses found.
                                    </li>
                                ) : (
                                    pendingStatuses.map((task) => (
                                        <li
                                            key={task.id}
                                            className="list-group-item d-flex justify-content-between align-items-center p-4 border-bottom border-dark"
                                            style={{
                                                backgroundColor: task.isDone
                                                    ? "#e9ecef"
                                                    : "#fff",
                                            }}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div
                                                    style={{
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() =>
                                                        toggleStatusTask(
                                                            task.id,
                                                            task.isDone,
                                                        )
                                                    }
                                                >
                                                    {task.isDone ? (
                                                        <i className="bi bi-check-square-fill fs-3 text-success"></i>
                                                    ) : (
                                                        <i className="bi bi-square fs-3 text-dark"></i>
                                                    )}
                                                </div>
                                                <div>
                                                    <h5
                                                        className={`mb-1 fw-bold ${task.isDone ? "text-decoration-line-through text-muted" : "text-dark"}`}
                                                    >
                                                        {task.title}
                                                    </h5>
                                                    <span
                                                        className={`badge ${task.type === "Maintenance" ? "bg-danger" : "bg-primary"} border border-dark text-white rounded-0 me-2`}
                                                    >
                                                        {task.type}
                                                    </span>
                                                    <small className="text-muted fw-bold">
                                                        <i className="bi bi-calendar me-1"></i>{" "}
                                                        Target: {task.dueDate}
                                                    </small>
                                                </div>
                                            </div>
                                            <div>
                                                <button className="btn btn-sm btn-outline-dark rounded-0 fw-bold">
                                                    <i className="bi bi-pencil-fill"></i>{" "}
                                                    Edit
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    bgColor,
    textColor = "#000",
    isTextIcon,
}) {
    return (
        <div className="col-md-3 col-sm-6">
            <div
                className="card-retro h-100 p-3"
                style={{ backgroundColor: "#fff" }}
            >
                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <p
                            className="mb-1 fw-bold font-monospace text-uppercase text-muted"
                            style={{ fontSize: "0.7rem" }}
                        >
                            {title}
                        </p>
                        <h2
                            className="fw-bold mb-0"
                            style={{
                                color: "#000",
                                textShadow: "1px 1px 0 #ddd",
                            }}
                        >
                            {value}
                        </h2>
                    </div>
                    <div
                        className="d-flex align-items-center justify-content-center border border-2 border-dark"
                        style={{
                            width: "45px",
                            height: "45px",
                            backgroundColor: bgColor,
                            color: textColor,
                            borderRadius: "8px",
                            boxShadow: "3px 3px 0 #000",
                        }}
                    >
                        {isTextIcon ? (
                            <span className="fw-bold fs-5">{icon}</span>
                        ) : (
                            <i className={`bi ${icon} fs-4`}></i>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
