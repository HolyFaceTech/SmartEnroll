import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../../utils/toast";
import StatusModal from "../../components/StatusModal";
import StatusConfirmation from "../../components/StatusConfirmation";
import Loading from "../../utils/Loading";

const BULK_DELETE_LIMIT = 50;

export default function Status() {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalStatuses, setTotalStatuses] = useState(0);
    const [fromItem, setFromItem] = useState(0);
    const [toItem, setToItem] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("create");
    const [selectedStatus, setSelectedStatus] = useState(null);

    const [confirmConfig, setConfirmConfig] = useState({ show: false });
    const [selectedIds, setSelectedIds] = useState([]);

    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("LOADING RECORDS...");

    const [openActionId, setOpenActionId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({
        top: "auto",
        right: 0,
        bottom: "auto",
    });

    const getToken = () =>
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const fetchStatuses = async () => {
        setLoadingMessage("FETCHING RECORDS...");
        setLoading(true);
        try {
            const res = await axios.get("/api/statuses", {
                params: {
                    search: searchTerm,
                    page: currentPage,
                    per_page: itemsPerPage,
                },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setStatuses(res.data.data);
            setTotalStatuses(res.data.total);
            setFromItem(res.data.from || 0);
            setToItem(res.data.to || 0);
            setLastPage(res.data.last_page);
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "Failed to load system statuses.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUser =
            localStorage.getItem("user") || sessionStorage.getItem("user");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => fetchStatuses(), 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, currentPage, itemsPerPage]);

    // Dropdown Handling
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".custom-dropdown-trigger"))
                setOpenActionId(null);
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

    const toggleDropdown = (id, e) => {
        e.stopPropagation();
        if (openActionId === id) {
            setOpenActionId(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            if (spaceBelow < 250) {
                setDropdownPos({
                    bottom: viewportHeight - rect.top,
                    right: window.innerWidth - rect.right,
                    top: "auto",
                });
            } else {
                setDropdownPos({
                    top: rect.bottom,
                    right: window.innerWidth - rect.right,
                    bottom: "auto",
                });
            }
            setOpenActionId(id);
        }
    };

    const handleOpenCreate = () => {
        setModalType("create");
        setSelectedStatus(null);
        setShowModal(true);
    };

    const handleOpenEdit = (statusRecord) => {
        setModalType("edit");
        setSelectedStatus(statusRecord);
        setShowModal(true);
    };

    const handleOpenView = (statusRecord) => {
        setModalType("view");
        setSelectedStatus(statusRecord);
        setShowModal(true);
    };

    const handleActionClick = (actionType, statusData = null) => {
        setOpenActionId(null);

        if (actionType === "delete_single") {
            setConfirmConfig({
                show: true,
                type: "single_delete",
                payload: statusData.id,
                title: "DELETE STATUS?",
                message: (
                    <>
                        This action cannot be undone. Are you sure you want to
                        delete the records of <br />{" "}
                        <strong>{statusData.name}</strong>?
                    </>
                ),
                confirmText: "YES, DELETE IT",
                confirmColor: "#F96E5B",
                iconClass: "bi-trash-fill",
            });
        } else if (actionType === "delete_bulk") {
            const recordText = selectedIds.length > 1 ? "STATUSES" : "STATUS";
            setConfirmConfig({
                show: true,
                type: "bulk_delete",
                payload: selectedIds,
                title: `DELETE ${selectedIds.length} ${recordText}?`,
                message:
                    "This bulk action cannot be undone. Are you sure you want to proceed?",
                confirmText: "YES, DELETE THEM",
                confirmColor: "#F96E5B",
                iconClass: "bi-trash-fill",
            });
        } else {
            // Status Change (Processing, Done, Reset)
            let icon = "bi-arrow-repeat";
            let iconColorClass = "text-info";

            if (actionType === "processing") {
                icon = "bi-arrow-repeat";
                iconColorClass = "text-info";
            } else if (actionType === "done") {
                icon = "bi-check-circle-fill";
                iconColorClass = "text-success";
            } else if (actionType === "reset") {
                icon = "bi-arrow-counterclockwise";
                iconColorClass = "text-dark";
            }

            setConfirmConfig({
                show: true,
                type: "status_change",
                payload: { id: statusData.id, status: actionType },
                title: `CHANGE STATUS TO ${actionType.toUpperCase()}?`,
                message: (
                    <>
                        Are you sure you want to change the status of
                        <br />
                        <strong>{statusData.name}</strong> to{" "}
                        <strong
                            className={`text-uppercase border-bottom border-dark pb-1 ${iconColorClass}`}
                        >
                            {actionType}
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

    const handleConfirmAction = async () => {
        const { type, payload } = confirmConfig;
        setConfirmConfig({ show: false });

        setActionLoading(true);
        setLoadingMessage(
            type === "single_delete"
                ? "DELETING STATUS..."
                : type === "bulk_delete"
                  ? "DELETING STATUSES..."
                  : "UPDATING STATUS...",
        );

        try {
            if (type === "single_delete") {
                await axios.delete(`/api/statuses/${payload}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                Toast.fire({
                    icon: "success",
                    title: "System status removed successfully.",
                });
            } else if (type === "bulk_delete") {
                const res = await axios.post(
                    "/api/statuses/bulk-delete",
                    { ids: payload },
                    { headers: { Authorization: `Bearer ${getToken()}` } },
                );
                setSelectedIds([]);
                Toast.fire({ icon: "success", title: res.data.message });
            } else if (type === "status_change") {
                const res = await axios.put(
                    `/api/statuses/${payload.id}/status`,
                    { status: payload.status },
                    { headers: { Authorization: `Bearer ${getToken()}` } },
                );
                Toast.fire({ icon: "success", title: res.data.message });
            }
            await fetchStatuses();
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: error.response?.data?.message || "Action failed.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const idsToSelect = statuses
                .slice(0, BULK_DELETE_LIMIT)
                .map((s) => s.id);
            setSelectedIds(idsToSelect);
            if (statuses.length > BULK_DELETE_LIMIT)
                Toast.fire({
                    icon: "info",
                    title: `Selection limited to ${BULK_DELETE_LIMIT} requests only for bulk delete.`,
                });
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (e, id) => {
        if (e.target.checked) {
            if (selectedIds.length >= BULK_DELETE_LIMIT) {
                Toast.fire({
                    icon: "warning",
                    title: `Limit reached! You can only select up to ${BULK_DELETE_LIMIT} requests at a time.`,
                });
                return;
            }
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
        }
    };

    const tableActionBtnStyle = {
        width: "35px",
        height: "35px",
        transition: "all 0.2s ease-in-out",
        boxShadow: "2px 2px 0 #000",
    };

    return (
        <>
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
                            SYSTEM STATUSES
                        </h2>
                        <p className="text-muted small mb-0 font-monospace">
                            Manage enrollment & request process statuses
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        {selectedIds.length > 0 && (
                            <button
                                className="btn btn-danger btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2 text-white"
                                style={{ backgroundColor: "#F96E5B" }}
                                onClick={() => handleActionClick("delete_bulk")}
                            >
                                <i className="bi bi-trash-fill"></i> DELETE (
                                {selectedIds.length})
                            </button>
                        )}
                        <button
                            className="btn btn-retro btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                            onClick={handleOpenCreate}
                        >
                            <i className="bi bi-plus-square-fill"></i> NEW
                            STATUS
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
                                Show:
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
                                Entries
                            </span>
                        </div>

                        <div
                            className="input-group"
                            style={{ maxWidth: "300px" }}
                        >
                            <span className="input-group-text bg-white border-dark border-2 border-end-0">
                                <i className="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-dark border-2 border-start-0 ps-2 font-monospace"
                                placeholder="Search status..."
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
                                        backgroundColor:
                                            "var(--color-secondary)",
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
                                                            statuses.length,
                                                            BULK_DELETE_LIMIT,
                                                        )
                                                }
                                            />
                                        </th>
                                        <th className="py-3 font-monospace text-dark">
                                            <i className="bi bi-tag-fill me-1"></i>{" "}
                                            Status Name
                                        </th>
                                        <th className="py-3 font-monospace text-dark">
                                            <i className="bi bi-card-text me-1"></i>{" "}
                                            Description
                                        </th>
                                        <th className="py-3 font-monospace text-dark text-center">
                                            <i className="bi bi-activity me-1"></i>{" "}
                                            Progress
                                        </th>
                                        <th className="py-3 font-monospace text-dark text-center">
                                            <i className="bi bi-calendar-plus-fill me-1"></i>{" "}
                                            Created At
                                        </th>
                                        <th className="py-3 font-monospace text-dark text-center">
                                            <i className="bi bi-calendar-check-fill me-1"></i>{" "}
                                            Done At
                                        </th>
                                        <th className="text-end pe-4 py-3 font-monospace text-dark">
                                            <i className="bi bi-gear-fill me-1"></i>{" "}
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statuses.length === 0 && !loading ? (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="text-center py-5"
                                            >
                                                <div className="d-flex flex-column align-items-center justify-content-center">
                                                    <i
                                                        className="bi bi-folder-x text-muted"
                                                        style={{
                                                            fontSize: "4rem",
                                                        }}
                                                    ></i>
                                                    <h5 className="fw-bold font-monospace mt-3 text-dark">
                                                        NO STATUSES FOUND
                                                    </h5>
                                                    <p className="text-muted small mb-4">
                                                        We couldn't find any
                                                        records matching your
                                                        criteria in the
                                                        database.
                                                    </p>
                                                    <button
                                                        className="btn btn-retro border-2 border-dark fw-bold btn-press-retro px-4 py-2"
                                                        onClick={
                                                            handleOpenCreate
                                                        }
                                                    >
                                                        <i className="bi bi-plus-lg me-2"></i>{" "}
                                                        ADD NEW STATUS
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : statuses.length > 0 ? (
                                        statuses.map((statusRecord) => (
                                            <tr
                                                key={statusRecord.id}
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
                                                            statusRecord.id,
                                                        )}
                                                        onChange={(e) =>
                                                            handleSelectOne(
                                                                e,
                                                                statusRecord.id,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="py-3 align-middle">
                                                    <div className="fw-bold text-dark font-monospace text-uppercase">
                                                        {statusRecord.name}
                                                    </div>
                                                </td>
                                                <td className="py-3 align-middle">
                                                    <div
                                                        className="small text-muted font-monospace text-truncate fst-italic"
                                                        style={{
                                                            maxWidth: "250px",
                                                        }}
                                                    >
                                                        {
                                                            statusRecord.description
                                                        }
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span
                                                        className={`badge rounded-0 border border-dark text-dark px-3 py-2 btn-action-retro ${statusRecord.status === "done" ? "bg-success text-white" : "bg-warning"}`}
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    >
                                                        {statusRecord.status
                                                            ? statusRecord.status.toUpperCase()
                                                            : "PROCESSING"}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-monospace small text-muted fw-bold text-center">
                                                    {statusRecord.created_at
                                                        ? new Date(
                                                              statusRecord.created_at,
                                                          ).toLocaleDateString(
                                                              "en-US",
                                                              {
                                                                  month: "short",
                                                                  day: "numeric",
                                                                  year: "numeric",
                                                              },
                                                          )
                                                        : ""}
                                                </td>
                                                <td className="py-3 font-monospace small fw-bold text-center">
                                                    {statusRecord.done_at ? (
                                                        <span className="text-success">
                                                            {new Date(
                                                                statusRecord.done_at,
                                                            ).toLocaleDateString(
                                                                "en-US",
                                                                {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    year: "numeric",
                                                                },
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">
                                                            - -, -
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-end pe-4 py-3">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            className="btn btn-sm rounded-circle border-2 border-dark fw-bold bg-white btn-action-retro d-flex align-items-center justify-content-center"
                                                            style={
                                                                tableActionBtnStyle
                                                            }
                                                            onClick={() =>
                                                                handleOpenView(
                                                                    statusRecord,
                                                                )
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
                                                                handleOpenEdit(
                                                                    statusRecord,
                                                                )
                                                            }
                                                            title="Edit Status"
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
                                                                    statusRecord,
                                                                )
                                                            }
                                                            title="Delete Status"
                                                        >
                                                            <i className="bi bi-trash-fill text-white"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm rounded-circle border-2 border-dark fw-bold btn-action-retro custom-dropdown-trigger d-flex align-items-center justify-content-center"
                                                            style={{
                                                                ...tableActionBtnStyle,
                                                                backgroundColor:
                                                                    "#34495e",
                                                            }}
                                                            onClick={(e) =>
                                                                toggleDropdown(
                                                                    statusRecord.id,
                                                                    e,
                                                                )
                                                            }
                                                            title="Actions"
                                                        >
                                                            <i className="bi bi-three-dots text-white"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
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
                            Showing{" "}
                            <strong>{totalStatuses > 0 ? fromItem : 0}</strong>{" "}
                            to <strong>{toItem}</strong> of{" "}
                            <strong>{totalStatuses}</strong> statuses
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
                                        PAGE {currentPage} OF {lastPage || 1}
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
                        minWidth: "200px",
                    }}
                >
                    {(() => {
                        const r = statuses.find(
                            (req) => req.id === openActionId,
                        );
                        if (!r) return null;
                        return (
                            <ul className="list-unstyled mb-0 font-monospace small">
                                <li>
                                    <h6 className="dropdown-header fw-bold text-dark border-bottom border-dark bg-light py-2">
                                        STATUS ACTIONS
                                    </h6>
                                </li>
                                <li>
                                    <button
                                        className={`dropdown-item fw-bold py-2 ${
                                            r.status.toLowerCase() ===
                                            "processing"
                                                ? "text-muted"
                                                : "text-info"
                                        }`}
                                        onClick={() =>
                                            handleActionClick("processing", r)
                                        }
                                        disabled={
                                            r.status.toLowerCase() ===
                                            "processing"
                                        }
                                        style={{
                                            cursor:
                                                r.status.toLowerCase() !==
                                                "processing"
                                                    ? "pointer"
                                                    : "not-allowed",
                                        }}
                                    >
                                        <i className="bi bi-arrow-repeat me-2"></i>{" "}
                                        Processing
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={`dropdown-item fw-bold py-2 ${r.status.toLowerCase() === "done" ? "text-muted" : "text-success"}`}
                                        onClick={() =>
                                            handleActionClick("done", r)
                                        }
                                        disabled={
                                            r.status.toLowerCase() === "done"
                                        }
                                        style={{
                                            cursor:
                                                r.status.toLowerCase() !==
                                                "done"
                                                    ? "pointer"
                                                    : "not-allowed",
                                        }}
                                    >
                                        <i className="bi bi-check-circle-fill me-2"></i>{" "}
                                        Done
                                    </button>
                                </li>
                                <li>
                                    <hr className="dropdown-divider border-dark m-0" />
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item fw-bold text-muted py-2 bg-light"
                                        onClick={() =>
                                            handleActionClick("reset", r)
                                        }
                                        disabled={
                                            r.status.toLowerCase() ===
                                                "processing" ||
                                            !r.previous_status
                                        }
                                        style={{
                                            cursor: !(
                                                r.status.toLowerCase() ===
                                                    "processing" ||
                                                !r.previous_status
                                            )
                                                ? "pointer"
                                                : "not-allowed",
                                        }}
                                    >
                                        <i className="bi bi-arrow-counterclockwise me-2"></i>{" "}
                                        Reset Status
                                    </button>
                                </li>
                            </ul>
                        );
                    })()}
                </div>
            )}

            <StatusModal
                show={showModal}
                type={modalType}
                selectedStatus={selectedStatus}
                onClose={() => setShowModal(false)}
                onSuccess={fetchStatuses}
                apiPrefix="/api"
            />
            <StatusConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={handleConfirmAction}
            />
            <Loading show={loading || actionLoading} message={loadingMessage} />
        </>
    );
}
