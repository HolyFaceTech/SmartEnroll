import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../../utils/toast";
import StudentModal from "../../components/StudentModal";
import StudentViewModal from "../../components/StudentViewModal";
import CORModal from "../../components/CORModal";
import StudentImport from "../../components/StudentImport";
import StudentConfirmation from "../../components/StudentConfirmation";
import Loading from "../../utils/Loading";

const BULK_DELETE_LIMIT = 50;

export default function Students() {
    const [students, setStudents] = useState([]);
    const [strands, setStrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("LOADING RECORDS...");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [fromItem, setFromItem] = useState(0);
    const [toItem, setToItem] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [modalState, setModalState] = useState({
        show: false,
        type: "create",
        data: null,
    });
    const [corState, setCorState] = useState({ show: false, data: null });
    const [showImport, setShowImport] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ show: false });
    const [selectedIds, setSelectedIds] = useState([]);
    const [openActionId, setOpenActionId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({
        top: "auto",
        right: 0,
        bottom: "auto",
    });

    const getToken = () =>
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const fetchData = async () => {
        setLoadingMessage("FETCHING RECORDS...");
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${getToken()}` };
            const [std, str] = await Promise.all([
                axios.get("/api/students", {
                    params: {
                        search: searchTerm,
                        page: currentPage,
                        per_page: itemsPerPage,
                    },
                    headers,
                }),
                axios.get("/api/strands", { headers }),
            ]);

            setStudents(std.data.data);
            setTotalUsers(std.data.total);
            setFromItem(std.data.from || 0);
            setToItem(std.data.to || 0);
            setLastPage(std.data.last_page);

            setStrands(str.data);
            setSelectedIds([]);
        } catch (e) {
            Toast.fire({ icon: "error", title: "Failed to load records." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => fetchData(), 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, currentPage, itemsPerPage]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".custom-dropdown-trigger")) {
                setOpenActionId(null);
            }
        };
        const handleScroll = () => {
            if (openActionId) setOpenActionId(null);
        };

        document.addEventListener("click", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            document.removeEventListener("click", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [openActionId]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const idsToSelect = students
                .slice(0, BULK_DELETE_LIMIT)
                .map((u) => u.id);
            setSelectedIds(idsToSelect);
            if (students.length > BULK_DELETE_LIMIT) {
                Toast.fire({
                    icon: "info",
                    title: `Selection limited to ${BULK_DELETE_LIMIT} students only for bulk delete.`,
                });
            }
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (e, id) => {
        if (e.target.checked) {
            if (selectedIds.length >= BULK_DELETE_LIMIT) {
                Toast.fire({
                    icon: "warning",
                    title: `Limit reached! You can only select up to ${BULK_DELETE_LIMIT} students at a time.`,
                });
                return;
            }
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
        }
    };

    const toggleDropdown = (id, e) => {
        e.stopPropagation();
        if (openActionId === id) {
            setOpenActionId(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const dropdownHeightEstimate = 320;
            let newPos = {};

            if (spaceBelow < dropdownHeightEstimate) {
                newPos = {
                    bottom: viewportHeight - rect.top,
                    right: window.innerWidth - rect.right,
                    top: "auto",
                };
            } else {
                newPos = {
                    top: rect.bottom,
                    right: window.innerWidth - rect.right,
                    bottom: "auto",
                };
            }
            setDropdownPos(newPos);
            setOpenActionId(id);
        }
    };

    const getFullName = (s) => {
        const middle = s.middle_name ? s.middle_name.trim() + " " : "";
        const suffix = s.suffix ? " " + s.suffix.trim() : "";
        return `${s.first_name} ${middle}${s.last_name}${suffix}`.trim();
    };

    const getStatusColor = (status) => {
        const s = status.toLowerCase();
        switch (s) {
            case "enrolled":
                return "bg-success text-white";
            case "pending":
                return "bg-warning text-dark";
            case "cleared":
                return "bg-primary text-white";
            case "on hold":
                return "bg-danger text-white";
            case "graduate":
                return "bg-info text-dark";
            case "drop out":
                return "bg-dark text-white";
            case "released":
                return "bg-secondary text-white";
            default:
                return "bg-light text-dark";
        }
    };

    const getStatusIconColorClass = (status) => {
        const s = status.toLowerCase();
        switch (s) {
            case "enrolled":
                return "text-success";
            case "pending":
                return "text-warning";
            case "cleared":
                return "text-primary";
            case "on hold":
                return "text-danger";
            case "graduate":
                return "text-info";
            case "drop out":
                return "text-dark";
            case "released":
                return "text-secondary";
            default:
                return "text-dark";
        }
    };

    const handleActionClick = (action, student = null) => {
        setOpenActionId(null);
        const fullName = student ? getFullName(student) : "";

        if (action === "delete_single") {
            setConfirmConfig({
                show: true,
                type: "delete_single",
                payload: student.id,
                title: "DELETE STUDENT?",
                message: (
                    <>
                        This action cannot be undone. Are you sure you want to
                        delete the records of <br /> <strong>{fullName}</strong>
                        ?
                    </>
                ),
                confirmText: "YES, DELETE IT",
                confirmColor: "#F96E5B",
                iconClass: "bi-trash-fill",
            });
        } else if (action === "delete_bulk") {
            const studentText = selectedIds.length > 1 ? "STUDENTS" : "STUDENT";
            setConfirmConfig({
                show: true,
                type: "delete_bulk",
                payload: selectedIds,
                title: `DELETE ${selectedIds.length} ${studentText}?`,
                message:
                    "This bulk action cannot be undone. Are you sure you want to proceed?",
                confirmText: "YES, DELETE THEM",
                confirmColor: "#F96E5B",
                iconClass: "bi-trash-fill",
            });
        } else {
            let icon = "bi-arrow-repeat";
            if (action === "released") icon = "bi-box-arrow-right";
            if (action === "cleared") icon = "bi-check-all";
            if (action === "enrolled") icon = "bi-person-check";
            if (action === "pending") icon = "bi-hourglass-split";
            if (action === "on hold") icon = "bi-pause-circle";
            if (action === "graduate") icon = "bi-mortarboard";
            if (action === "drop out") icon = "bi-x-circle";

            const iconColorClass = getStatusIconColorClass(action);

            setConfirmConfig({
                show: true,
                type: "status_change",
                payload: { id: student.id, status: action },
                title: `CHANGE STATUS TO ${action.toUpperCase()}?`,
                message: (
                    <>
                        Are you sure you want to change the status of <br />{" "}
                        <strong>{fullName}</strong> to{" "}
                        <strong
                            className={`text-uppercase border-bottom border-dark pb-1 ${iconColorClass}`}
                        >
                            {action}
                        </strong>
                        ?
                    </>
                ),
                confirmText: "YES, PROCEED",
                confirmColor: "#79C9C5",
                iconClass: `${icon} ${iconColorClass}`,
            });
        }
    };

    const executeConfirmAction = async () => {
        const { type, payload } = confirmConfig;
        setConfirmConfig({ show: false });

        setActionLoading(true);
        setLoadingMessage(
            type === "delete_single"
                ? "DELETING RECORD..."
                : type === "delete_bulk"
                  ? "DELETING RECORDS..."
                  : "UPDATING STATUS...",
        );

        const headers = { Authorization: `Bearer ${getToken()}` };

        try {
            if (type === "delete_single") {
                await axios.delete(`/api/students/${payload}`, { headers });
                Toast.fire({
                    icon: "success",
                    title: "Record removed successfully.",
                });
            } else if (type === "delete_bulk") {
                const res = await axios.post(
                    "/api/students/bulk-delete",
                    { ids: payload },
                    { headers },
                );
                setSelectedIds([]);
                Toast.fire({ icon: "success", title: res.data.message });
            } else if (type === "status_change") {
                const response = await axios.put(
                    `/api/students/${payload.id}/status`,
                    { status: payload.status },
                    { headers },
                );

                const finalStatus = response.data.new_status || payload.status;

                Toast.fire({
                    icon: "success",
                    title: `Status changed to ${finalStatus.toUpperCase()}`,
                });

                if (finalStatus.toLowerCase() === "enrolled") {
                    const studentToOpen = students.find(
                        (s) => s.id === payload.id,
                    );
                    if (studentToOpen) {
                        setCorState({ show: true, data: studentToOpen });
                    }
                }
            }
            await fetchData();
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: error.response?.data?.message || "Action failed.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const tableActionBtnStyle = {
        width: "35px",
        height: "35px",
        transition: "all 0.2s ease-in-out",
        boxShadow: "2px 2px 0 #000",
    };

    return (
        <div className="container-fluid fade-in mb-5">
            <div
                className="d-flex justify-content-between align-items-center mb-4 pb-3"
                style={{ borderBottom: "2px solid black" }}
            >
                <div>
                    <h2
                        className="fw-bold text-dark mb-0 font-monospace"
                        style={{ textShadow: "2px 2px 0 #fff" }}
                    >
                        STUDENTS MANAGEMENT
                    </h2>
                    <p className="text-muted small mb-0 font-monospace">
                        Manage Enrollment Profiles & Records
                    </p>
                </div>

                <div className="d-flex gap-2">
                    {selectedIds.length > 0 && (
                        <button
                            className="btn btn-danger btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2 text-white"
                            style={{ backgroundColor: "#F96E5B" }}
                            onClick={() => handleActionClick("delete_bulk")}
                            title="Delete Selected"
                        >
                            <i className="bi bi-trash-fill"></i> DELETE (
                            {selectedIds.length})
                        </button>
                    )}
                    <button
                        className="btn btn-info btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                        style={{ backgroundColor: "#55efc4" }}
                        onClick={() => setShowImport(true)}
                        title="Import CSV"
                    >
                        <i className="bi bi-file-earmark-spreadsheet-fill text-dark"></i>{" "}
                        IMPORT CSV
                    </button>
                    <button
                        className="btn btn-retro btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                        onClick={() =>
                            setModalState({
                                show: true,
                                type: "create",
                                data: null,
                            })
                        }
                        title="New Student"
                    >
                        <i className="bi bi-person-plus-fill"></i> NEW STUDENT
                    </button>
                </div>
            </div>

            <div className="card-retro">
                <div
                    className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2"
                    style={{ borderBottom: "2px solid black" }}
                >
                    <div className="d-flex align-items-center gap-2">
                        <span className="small fw-bold font-monospace">
                            SHOW:
                        </span>
                        <select
                            className="form-control form-control-sm font-monospace fw-bold text-center hide-arrow bg-light cursor-pointer"
                            style={{
                                width: "60px",
                                border: "2px solid black",
                                padding: "0",
                            }}
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span className="small fw-bold font-monospace">
                            entries
                        </span>
                    </div>

                    <div className="input-group" style={{ maxWidth: "300px" }}>
                        <span className="input-group-text bg-white border-dark border-2 border-end-0">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-dark border-2 border-start-0 ps-2 font-monospace"
                            placeholder="Search student..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 text-nowrap">
                            <thead
                                style={{
                                    backgroundColor: "var(--color-secondary)",
                                    borderBottom: "2px solid black",
                                }}
                            >
                                <tr className="text-uppercase small fw-bold">
                                    <th
                                        className="ps-4 py-3"
                                        style={{ width: "40px" }}
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-check-input border-dark border-2 cursor-pointer"
                                            onChange={handleSelectAll}
                                            checked={
                                                selectedIds.length > 0 &&
                                                selectedIds.length ===
                                                    Math.min(
                                                        students.length,
                                                        BULK_DELETE_LIMIT,
                                                    )
                                            }
                                        />
                                    </th>
                                    <th className="py-3 font-monospace text-dark">
                                        <i className="bi bi-person-badge-fill me-1"></i>{" "}
                                        Student Details
                                    </th>
                                    <th className="py-3 font-monospace text-dark text-center">
                                        <i className="bi bi-journal-text me-1"></i>{" "}
                                        Strand - Term
                                    </th>
                                    <th className="py-3 font-monospace text-dark text-center">
                                        <i className="bi bi-bar-chart-steps me-1"></i>{" "}
                                        Grade - Section
                                    </th>
                                    <th className="py-3 font-monospace text-dark text-center">
                                        <i className="bi bi-activity me-1"></i>{" "}
                                        Status
                                    </th>
                                    <th className="py-3 font-monospace text-dark text-center">
                                        <i className="bi bi-calendar-check me-1"></i>{" "}
                                        Created At
                                    </th>
                                    <th className="text-end pe-4 py-3 font-monospace text-dark">
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 && !loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-center py-5"
                                        >
                                            <div className="d-flex flex-column align-items-center justify-content-center">
                                                <i
                                                    className="bi bi-folder-x text-muted"
                                                    style={{ fontSize: "4rem" }}
                                                ></i>
                                                <h5 className="fw-bold font-monospace mt-3 text-dark">
                                                    NO STUDENTS FOUND
                                                </h5>
                                                <p className="text-muted small mb-4">
                                                    We couldn't find any records
                                                    matching your criteria in
                                                    the database.
                                                </p>
                                                <button
                                                    className="btn btn-retro border-2 border-dark fw-bold btn-press-retro px-4 py-2"
                                                    onClick={() =>
                                                        setModalState({
                                                            show: true,
                                                            type: "create",
                                                            data: null,
                                                        })
                                                    }
                                                >
                                                    <i className="bi bi-plus-lg me-2"></i>{" "}
                                                    ADD NEW STUDENT
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length > 0 ? (
                                    students.map((s) => {
                                        const fullName = getFullName(s);
                                        const defaultAvatar = `https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff&size=128`;
                                        const avatarUrl = s.requirement
                                            ?.photo_2x2
                                            ? `/storage/${s.requirement.photo_2x2}`
                                            : defaultAvatar;

                                        return (
                                            <tr
                                                key={s.id}
                                                style={{
                                                    borderBottom:
                                                        "1px solid #000",
                                                }}
                                            >
                                                <td className="ps-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input border-dark border-2 cursor-pointer"
                                                        checked={selectedIds.includes(
                                                            s.id,
                                                        )}
                                                        onChange={(e) =>
                                                            handleSelectOne(
                                                                e,
                                                                s.id,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="py-3">
                                                    <div className="d-flex align-items-center">
                                                        <img
                                                            src={avatarUrl}
                                                            className="rounded-circle me-3 border border-2 border-dark shadow-sm bg-white"
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                            alt="Avatar"
                                                            onError={(e) => {
                                                                e.target.src =
                                                                    defaultAvatar;
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                                                <span className="text-uppercase">
                                                                    {fullName}
                                                                </span>
                                                                {s.profile
                                                                    ?.gender ===
                                                                "Male" ? (
                                                                    <i
                                                                        className="bi bi-gender-male text-primary fs-6"
                                                                        title="Male"
                                                                    ></i>
                                                                ) : s.profile
                                                                      ?.gender ===
                                                                  "Female" ? (
                                                                    <i
                                                                        className="bi bi-gender-female fs-6"
                                                                        style={{
                                                                            color: "#e84393",
                                                                        }}
                                                                        title="Female"
                                                                    ></i>
                                                                ) : null}
                                                            </div>
                                                            <div className="small text-muted font-monospace fw-bold">
                                                                LRN: {s.lrn}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3 font-monospace fw-bold text-dark text-center">
                                                    {s.academic?.strand?.code ||
                                                        "N/A"}{" "}
                                                    - {""}
                                                    <small className="text-dark fw-bold">
                                                        {s.academic?.term ||
                                                            "N/A"}
                                                    </small>
                                                </td>
                                                <td className="py-3 font-monospace fw-bold text-dark text-center">
                                                    {s.academic?.grade_level ||
                                                        "11"}{" "}
                                                    - {""}
                                                    <small className="text-success fw-bold">
                                                        {s.academic?.section
                                                            ?.name || "TBA"}
                                                    </small>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span
                                                        className={`badge rounded-0 border border-dark px-3 py-2 btn-action-retro ${getStatusColor(s.status)}`}
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    >
                                                        {s.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-monospace small text-muted fw-bold text-center">
                                                    {new Date(
                                                        s.created_at,
                                                    ).toLocaleString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </td>
                                                <td className="text-end pe-4 py-3">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            className="btn btn-sm rounded-circle border-2 border-dark fw-bold bg-white btn-action-retro d-flex align-items-center justify-content-center"
                                                            style={
                                                                tableActionBtnStyle
                                                            }
                                                            onClick={() =>
                                                                setModalState({
                                                                    show: true,
                                                                    type: "view",
                                                                    data: s,
                                                                })
                                                            }
                                                            title="View Details"
                                                        >
                                                            <i className="bi bi-eye-fill text-dark"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm rounded-circle border-2 border-dark fw-bold btn-action-retro d-flex align-items-center justify-content-center"
                                                            style={{
                                                                ...tableActionBtnStyle,
                                                                backgroundColor:
                                                                    "#F4D03F",
                                                            }}
                                                            onClick={() =>
                                                                setModalState({
                                                                    show: true,
                                                                    type: "edit",
                                                                    data: s,
                                                                })
                                                            }
                                                            title="Edit Student"
                                                        >
                                                            <i className="bi bi-pencil-fill text-dark"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm rounded-circle border-2 border-dark fw-bold btn-action-retro d-flex align-items-center justify-content-center"
                                                            style={{
                                                                ...tableActionBtnStyle,
                                                                backgroundColor:
                                                                    "#F96E5B",
                                                            }}
                                                            onClick={() =>
                                                                handleActionClick(
                                                                    "delete_single",
                                                                    s,
                                                                )
                                                            }
                                                            title="Delete Student"
                                                        >
                                                            <i className="bi bi-trash-fill text-white"></i>
                                                        </button>

                                                        <button
                                                            className="btn btn-sm rounded-circle border-2 border-dark fw-bold btn-action-retro d-flex align-items-center justify-content-center custom-dropdown-trigger"
                                                            style={{
                                                                ...tableActionBtnStyle,
                                                                backgroundColor:
                                                                    "#34495e",
                                                            }}
                                                            onClick={(e) =>
                                                                toggleDropdown(
                                                                    s.id,
                                                                    e,
                                                                )
                                                            }
                                                            title="More Actions"
                                                        >
                                                            <i className="bi bi-three-dots text-white"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-center py-5"
                                        ></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div
                    className="card-footer bg-white py-3 px-4 d-flex justify-content-between align-items-center"
                    style={{ borderTop: "2px solid black" }}
                >
                    <small className="text-muted font-monospace">
                        Showing <strong>{totalUsers > 0 ? fromItem : 0}</strong>{" "}
                        to <strong>{toItem}</strong> of{" "}
                        <strong>{totalUsers}</strong> students
                    </small>
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li
                                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                            >
                                <button
                                    className="page-link border-2 border-dark text-dark fw-bold rounded-0 me-1"
                                    onClick={() =>
                                        setCurrentPage((prev) => prev - 1)
                                    }
                                >
                                    &laquo; PREV
                                </button>
                            </li>
                            <li className="page-item disabled">
                                <span className="page-link border-2 border-dark text-dark fw-bold rounded-0 mx-1 bg-warning">
                                    PAGE {currentPage} OF {lastPage}
                                </span>
                            </li>
                            <li
                                className={`page-item ${currentPage >= lastPage ? "disabled" : ""}`}
                            >
                                <button
                                    className="page-link border-2 border-dark text-dark fw-bold rounded-0 ms-1"
                                    onClick={() =>
                                        setCurrentPage((prev) => prev + 1)
                                    }
                                >
                                    NEXT &raquo;
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {openActionId && (
                <div
                    className="dropdown-menu show border-2 border-dark rounded-0 shadow-sm p-0 fade-in"
                    style={{
                        position: "fixed",
                        top: dropdownPos.top,
                        bottom: dropdownPos.bottom,
                        right: `${dropdownPos.right}px`,
                        zIndex: 9999,
                        minWidth: "220px",
                    }}
                >
                    {(() => {
                        const s = students.find((st) => st.id === openActionId);
                        if (!s) return null;
                        return (
                            <ul className="list-unstyled mb-0 font-monospace small">
                                <li>
                                    <h6 className="dropdown-header fw-bold text-dark border-bottom border-dark bg-light py-2">
                                        STATUS ACTIONS
                                    </h6>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item fw-bold text-warning py-2"
                                        onClick={() =>
                                            handleActionClick("pending", s)
                                        }
                                    >
                                        <i className="bi bi-hourglass-split me-2"></i>{" "}
                                        Pending
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item fw-bold text-success py-2"
                                        onClick={() =>
                                            handleActionClick("enrolled", s)
                                        }
                                    >
                                        <i className="bi bi-person-check me-2"></i>{" "}
                                        Enrolled
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={`dropdown-item fw-bold py-2 ${
                                            s.status.toLowerCase() ===
                                            "enrolled"
                                                ? "text-primary"
                                                : "text-muted"
                                        }`}
                                        onClick={() =>
                                            handleActionClick("cleared", s)
                                        }
                                        disabled={
                                            s.status.toLowerCase() !==
                                            "enrolled"
                                        }
                                        style={{
                                            cursor:
                                                s.status.toLowerCase() ===
                                                "enrolled"
                                                    ? "pointer"
                                                    : "not-allowed",
                                        }}
                                    >
                                        <i className="bi bi-check-all me-2"></i>{" "}
                                        Cleared
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item fw-bold text-danger py-2"
                                        onClick={() =>
                                            handleActionClick("on hold", s)
                                        }
                                    >
                                        <i className="bi bi-pause-circle me-2"></i>{" "}
                                        On Hold
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item fw-bold text-info py-2"
                                        onClick={() =>
                                            handleActionClick("graduate", s)
                                        }
                                    >
                                        <i className="bi bi-mortarboard me-2"></i>{" "}
                                        Graduate
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item fw-bold text-dark py-2"
                                        onClick={() =>
                                            handleActionClick("drop out", s)
                                        }
                                    >
                                        <i className="bi bi-x-circle me-2"></i>{" "}
                                        Drop Out
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item fw-bold text-secondary py-2"
                                        onClick={() =>
                                            handleActionClick("released", s)
                                        }
                                    >
                                        <i className="bi bi-box-arrow-right me-2"></i>{" "}
                                        Released
                                    </button>
                                </li>
                                <li>
                                    <hr className="dropdown-divider border-dark m-0" />
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item fw-bold text-muted py-2 bg-light"
                                        onClick={() =>
                                            handleActionClick("reset", s)
                                        }
                                    >
                                        <i className="bi bi-arrow-counterclockwise me-2"></i>{" "}
                                        Reset Status
                                    </button>
                                </li>
                                <li>
                                    <hr className="dropdown-divider border-dark m-0" />
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item fw-bold text-dark py-2 bg-warning bg-opacity-10"
                                        onClick={() => {
                                            setCorState({
                                                show: true,
                                                data: s,
                                            });
                                            setOpenActionId(null);
                                        }}
                                    >
                                        <i className="bi bi-file-earmark-pdf-fill text-danger me-2"></i>{" "}
                                        COR Preview
                                    </button>
                                </li>
                            </ul>
                        );
                    })()}
                </div>
            )}

            <StudentModal
                show={modalState.show && modalState.type !== "view"}
                type={modalState.type}
                selectedStudent={modalState.data}
                strands={strands}
                onClose={() =>
                    setModalState({ show: false, type: "create", data: null })
                }
                onSuccess={fetchData}
                openCorModal={(studentData) =>
                    setCorState({ show: true, data: studentData })
                }
            />

            <StudentViewModal
                show={modalState.show && modalState.type === "view"}
                selectedStudent={modalState.data}
                onClose={() =>
                    setModalState({ show: false, type: "view", data: null })
                }
            />

            <StudentImport
                show={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={fetchData}
            />

            <CORModal
                show={corState.show}
                student={corState.data}
                onClose={() => setCorState({ show: false, data: null })}
                onSuccess={fetchData}
            />

            <StudentConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeConfirmAction}
            />

            <Loading show={loading || actionLoading} message={loadingMessage} />
        </div>
    );
}
