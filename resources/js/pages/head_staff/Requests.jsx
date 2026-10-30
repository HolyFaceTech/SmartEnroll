import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Toast from "../../utils/toast";
import Loading from "../../utils/Loading";
import RequestConfirmation from "../../components/RequestConfirmation";
import RequestViewModal from "../../components/RequestViewModal";
import ClaimRequestModal from "../../components/ClaimRequestModal";

const BULK_DELETE_LIMIT = 50;

export default function Requests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [inputValue, setInputValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const searchTimeoutRef = useRef(null);

    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("LOADING RECORDS...");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [fromItem, setFromItem] = useState(0);
    const [toItem, setToItem] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [selectedIds, setSelectedIds] = useState([]);
    const [confirmConfig, setConfirmConfig] = useState({ show: false });
    const [modalState, setModalState] = useState({ show: false, data: null });

    const [openActionId, setOpenActionId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({
        top: "auto",
        right: 0,
        bottom: "auto",
    });
    const [claimModalState, setClaimModalState] = useState({
        show: false,
        data: null,
    });

    const getToken = () =>
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const fetchData = async () => {
        setLoadingMessage("FETCHING REQUESTS...");
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${getToken()}` };
            const res = await axios.get("/api/staff/requests", {
                params: {
                    search: searchTerm,
                    page: currentPage,
                    per_page: itemsPerPage,
                },
                headers,
            });

            setRequests(res.data.data);
            setTotalItems(res.data.total);
            setFromItem(res.data.from || 0);
            setToItem(res.data.to || 0);
            setLastPage(res.data.last_page);
            setSelectedIds([]);
        } catch (e) {
            Toast.fire({ icon: "error", title: "Failed to load requests." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchTerm, currentPage, itemsPerPage]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setInputValue(val);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(val);
            setCurrentPage(1);
        }, 800);
    };

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

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const idsToSelect = requests
                .slice(0, BULK_DELETE_LIMIT)
                .map((r) => r.id);
            setSelectedIds(idsToSelect);
            if (requests.length > BULK_DELETE_LIMIT) {
                Toast.fire({
                    icon: "info",
                    title: `Selection limited to ${BULK_DELETE_LIMIT} requests only for bulk delete.`,
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
                    title: `Limit reached! You can only select up to ${BULK_DELETE_LIMIT} requests at a time.`,
                });
                return;
            }
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
        }
    };

    const getStatusIconColorClass = (status) => {
        const s = status.toLowerCase();
        if (s === "pending") return "text-warning";
        if (s === "processing") return "text-info";
        if (s === "done") return "text-success";
        if (s === "on hold") return "text-danger";
        if (s === "denied") return "text-dark";
        return "text-dark";
    };

    const handleActionClick = (actionType, reqData = null) => {
        setOpenActionId(null);
        const fullName = reqData
            ? `${reqData.student?.first_name} ${reqData.student?.last_name}`
            : "";

        if (actionType === "delete_single") {
            setConfirmConfig({
                show: true,
                type: "delete_single",
                payload: reqData.id,
                title: "DELETE REQUEST?",
                message: (
                    <>
                        This action cannot be undone. Are you sure you want to
                        delete the records of <br />
                        <strong>{fullName}</strong>?
                    </>
                ),
                confirmText: "YES, DELETE IT",
                confirmColor: "#F96E5B",
                iconClass: "bi-trash-fill",
            });
        } else if (actionType === "delete_bulk") {
            const requestText = selectedIds.length > 1 ? "REQUESTS" : "REQUEST";
            setConfirmConfig({
                show: true,
                type: "delete_bulk",
                payload: selectedIds,
                title: `DELETE ${selectedIds.length} ${requestText}?`,
                message:
                    "This bulk action cannot be undone. Are you sure you want to proceed?",
                confirmText: "YES, DELETE THEM",
                confirmColor: "#F96E5B",
                iconClass: "bi-trash-fill",
            });
        } else if (actionType === "released") {
            setClaimModalState({ show: true, data: reqData });
        } else {
            let icon = "bi-arrow-repeat";
            if (actionType === "pending") icon = "bi-hourglass-split";
            if (actionType === "processing") icon = "bi-arrow-repeat";
            if (actionType === "done") icon = "bi-check-circle-fill";
            if (actionType === "on hold") icon = "bi-pause-circle-fill";
            if (actionType === "denied") icon = "bi-x-circle-fill";

            const iconColorClass = getStatusIconColorClass(actionType);
            setConfirmConfig({
                show: true,
                type: "status_change",
                payload: {
                    id: reqData.id,
                    status: actionType,
                    claimed_by: null,
                },
                title: `CHANGE STATUS TO ${actionType.toUpperCase()}?`,
                message: (
                    <>
                        Are you sure you want to change the status of <br />
                        <strong>{fullName}</strong> to{" "}
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

    const handleReleaseProceed = (claimedByName) => {
        const reqData = claimModalState.data;
        setClaimModalState({ show: false, data: null });

        setConfirmConfig({
            show: true,
            type: "status_change",
            payload: {
                id: reqData.id,
                status: "released",
                claimed_by: claimedByName,
            },
            title: `CONFIRM RELEASE?`,
            message: (
                <>
                    Confirm release of document to <br />
                    <strong>{claimedByName}</strong>?
                </>
            ),
            confirmText: "YES, PROCEED",
            confirmColor: "#79C9C5",
            iconClass: `bi-box-arrow-right text-dark`,
        });
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
                await axios.delete(`/api/staff/requests/${payload}`, {
                    headers,
                });
                Toast.fire({
                    icon: "success",
                    title: "Request deleted successfully.",
                });
            } else if (type === "delete_bulk") {
                await axios.post(
                    "/api/staff/requests/bulk-delete",
                    { ids: payload },
                    { headers },
                );
                setSelectedIds([]);
                Toast.fire({
                    icon: "success",
                    title: "Requests deleted successfully.",
                });
            } else if (type === "status_change") {
                const res = await axios.put(
                    `/api/staff/requests/${payload.id}/status`,
                    { status: payload.status, claimed_by: payload.claimed_by },
                    { headers },
                );
                Toast.fire({ icon: "success", title: res.data.message });
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

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === "pending") return "bg-warning text-dark";
        if (s === "processing") return "bg-info text-dark";
        if (s === "done") return "bg-success text-white";
        if (s === "on hold") return "bg-danger text-white";
        if (s === "released") return "bg-secondary text-white";
        if (s === "denied") return "bg-dark text-white";
        return "bg-light text-dark";
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
                        DOCUMENT REQUESTS
                    </h2>
                    <p className="text-muted small mb-0 font-monospace">
                        Manage Document Requests & Releasing
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-danger btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center gap-2 text-white"
                        style={{ backgroundColor: "#F96E5B" }}
                        onClick={() => handleActionClick("delete_bulk")}
                        disabled={selectedIds.length === 0}
                    >
                        <i className="bi bi-trash-fill"></i> DELETE (
                        {selectedIds.length})
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
                            className="form-control form-control-sm font-monospace fw-bold text-center border-dark cursor-pointer"
                            style={{ width: "60px", padding: "0" }}
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
                    <div className="input-group" style={{ maxWidth: "300px" }}>
                        <span className="input-group-text bg-white border-dark border-2 border-end-0">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-dark border-2 border-start-0 ps-2 font-monospace"
                            placeholder="Search request..."
                            value={inputValue}
                            onChange={handleSearchChange}
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
                                                        requests.length,
                                                        BULK_DELETE_LIMIT,
                                                    )
                                            }
                                        />
                                    </th>
                                    <th className="py-3 font-monospace text-dark">
                                        <i className="bi bi-person-badge-fill me-1"></i>{" "}
                                        Student
                                    </th>
                                    <th className="py-3 font-monospace text-dark">
                                        <i className="bi bi-file-earmark-text-fill me-1"></i>{" "}
                                        Type
                                    </th>
                                    <th className="py-3 font-monospace text-dark">
                                        <i className="bi bi-chat-left-text-fill me-1"></i>{" "}
                                        Purpose
                                    </th>
                                    <th className="py-3 font-monospace text-dark text-center">
                                        <i className="bi bi-activity me-1"></i>{" "}
                                        Status
                                    </th>
                                    <th className="py-3 font-monospace text-dark text-center">
                                        <i className="bi bi-calendar-event me-1"></i>{" "}
                                        Requested
                                    </th>
                                    <th className="text-end pe-4 py-3 font-monospace text-dark">
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.length === 0 && !loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="p-0 border-0"
                                        >
                                            <div className="text-center py-5 d-flex flex-column align-items-center justify-content-center w-100">
                                                <i
                                                    className="bi bi-folder-x text-muted"
                                                    style={{ fontSize: "4rem" }}
                                                ></i>
                                                <h5 className="fw-bold font-monospace mt-3 text-dark">
                                                    NO REQUESTS FOUND
                                                </h5>
                                                <p className="text-muted small mb-4">
                                                    We couldn't find any records
                                                    matching your criteria in
                                                    the database.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => {
                                        const st = req.student || {};
                                        const fullName = `${st.first_name || ""} ${st.middle_name || ""} ${st.last_name || ""} ${st.suffix || ""}`;
                                        const avatar = st.requirement?.photo_2x2
                                            ? `/storage/${st.requirement.photo_2x2}`
                                            : `https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff&size=128`;

                                        return (
                                            <tr
                                                key={req.id}
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
                                                            req.id,
                                                        )}
                                                        onChange={(e) =>
                                                            handleSelectOne(
                                                                e,
                                                                req.id,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="py-3">
                                                    <div className="d-flex align-items-center">
                                                        <img
                                                            src={avatar}
                                                            className="rounded-circle me-3 border border-2 border-dark shadow-sm bg-white"
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                            alt="Avatar"
                                                            onError={(e) =>
                                                                (e.target.src = `https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff&size=128`)
                                                            }
                                                        />
                                                        <div>
                                                            <div className="fw-bold text-dark text-uppercase">
                                                                {fullName}
                                                            </div>
                                                            <div className="small text-muted font-monospace fw-bold">
                                                                LRN: {st.lrn}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td
                                                    className="py-3 font-monospace fw-bold text-dark"
                                                    style={{
                                                        maxWidth: "200px",
                                                    }}
                                                >
                                                    <div
                                                        className="text-truncate"
                                                        title={req.type}
                                                    >
                                                        {req.type}
                                                    </div>
                                                </td>
                                                <td
                                                    className="py-3 font-monospace text-muted fst-italic"
                                                    style={{
                                                        maxWidth: "250px",
                                                    }}
                                                >
                                                    <div
                                                        className="text-truncate"
                                                        title={
                                                            req.purpose || "N/A"
                                                        }
                                                    >
                                                        <small>
                                                            {req.purpose ||
                                                                "N/A"}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span
                                                        className={`badge rounded-0 border border-dark px-3 py-2 btn-action-retro ${getStatusColor(req.status)}`}
                                                    >
                                                        {req.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-monospace small text-muted fw-bold text-center">
                                                    {new Date(
                                                        req.created_at,
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </td>
                                                <td className="text-end pe-4 py-3">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            className="btn btn-sm rounded-circle border-2 border-dark fw-bold bg-white btn-action-retro d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: "35px",
                                                                height: "35px",
                                                                boxShadow:
                                                                    "2px 2px 0 #000",
                                                            }}
                                                            onClick={() =>
                                                                setModalState({
                                                                    show: true,
                                                                    data: req,
                                                                })
                                                            }
                                                            title="View Request"
                                                        >
                                                            <i className="bi bi-eye-fill text-dark"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm rounded-circle border-2 border-dark fw-bold btn-action-retro d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: "35px",
                                                                height: "35px",
                                                                backgroundColor:
                                                                    "#F96E5B",
                                                                boxShadow:
                                                                    "2px 2px 0 #000",
                                                            }}
                                                            onClick={() =>
                                                                handleActionClick(
                                                                    "delete_single",
                                                                    req,
                                                                )
                                                            }
                                                            title="Delete"
                                                        >
                                                            <i className="bi bi-trash-fill text-white"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm rounded-circle border-2 border-dark fw-bold btn-action-retro custom-dropdown-trigger d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: "35px",
                                                                height: "35px",
                                                                backgroundColor:
                                                                    "#34495e",
                                                                boxShadow:
                                                                    "2px 2px 0 #000",
                                                            }}
                                                            onClick={(e) =>
                                                                toggleDropdown(
                                                                    req.id,
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
                                        );
                                    })
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
                        Showing {totalItems > 0 ? fromItem : 0} to {toItem} of{" "}
                        {totalItems} requests
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
                        minWidth: "200px",
                    }}
                >
                    {(() => {
                        const r = requests.find(
                            (req) => req.id === openActionId,
                        );
                        if (!r) return null;

                        const isReleased =
                            r.status.toLowerCase() === "released";

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
                                                "released" ||
                                            r.status.toLowerCase() === "pending"
                                                ? "text-muted"
                                                : "text-warning"
                                        }`}
                                        onClick={() =>
                                            handleActionClick("pending", r)
                                        }
                                        disabled={
                                            r.status.toLowerCase() ===
                                                "released" ||
                                            r.status.toLowerCase() === "pending"
                                        }
                                        style={{
                                            cursor:
                                                r.status.toLowerCase() !==
                                                    "released" ||
                                                r.status.toLowerCase() !==
                                                    "pending"
                                                    ? "pointer"
                                                    : "not-allowed",
                                        }}
                                    >
                                        <i className="bi bi-hourglass-split me-2"></i>{" "}
                                        Pending
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={`dropdown-item fw-bold py-2 ${
                                            r.status.toLowerCase() ===
                                                "released" ||
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
                                                "released" ||
                                            r.status.toLowerCase() ===
                                                "processing"
                                        }
                                        style={{
                                            cursor:
                                                r.status.toLowerCase() !==
                                                    "released" ||
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
                                        className={`dropdown-item fw-bold py-2 ${
                                            r.status.toLowerCase() ===
                                                "released" ||
                                            r.status.toLowerCase() === "done"
                                                ? "text-muted"
                                                : "text-success"
                                        }`}
                                        onClick={() =>
                                            handleActionClick("done", r)
                                        }
                                        disabled={
                                            r.status.toLowerCase() ===
                                                "released" ||
                                            r.status.toLowerCase() === "done"
                                        }
                                        style={{
                                            cursor:
                                                r.status.toLowerCase() !==
                                                    "released" ||
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
                                    <button
                                        className={`dropdown-item fw-bold py-2 ${
                                            r.status.toLowerCase() ===
                                                "released" ||
                                            r.status.toLowerCase() === "on hold"
                                                ? "text-muted"
                                                : "text-danger"
                                        }`}
                                        onClick={() =>
                                            handleActionClick("on hold", r)
                                        }
                                        disabled={
                                            r.status.toLowerCase() ===
                                                "released" ||
                                            r.status.toLowerCase() === "on hold"
                                        }
                                        style={{
                                            cursor:
                                                r.status.toLowerCase() !==
                                                    "released" ||
                                                r.status.toLowerCase() !==
                                                    "on hold"
                                                    ? "pointer"
                                                    : "not-allowed",
                                        }}
                                    >
                                        <i className="bi bi-pause-circle-fill me-2"></i>{" "}
                                        On Hold
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={`dropdown-item fw-bold py-2 ${
                                            r.status.toLowerCase() ===
                                                "released" ||
                                            r.status.toLowerCase() === "denied"
                                                ? "text-muted"
                                                : "text-dark"
                                        }`}
                                        onClick={() =>
                                            handleActionClick("denied", r)
                                        }
                                        disabled={
                                            r.status.toLowerCase() ===
                                                "released" ||
                                            r.status.toLowerCase() === "denied"
                                        }
                                        style={{
                                            cursor:
                                                r.status.toLowerCase() !==
                                                    "released" ||
                                                r.status.toLowerCase() !==
                                                    "denied"
                                                    ? "pointer"
                                                    : "not-allowed",
                                        }}
                                    >
                                        <i className="bi bi-x-circle-fill me-2"></i>{" "}
                                        Denied
                                    </button>
                                </li>
                                <li>
                                    <hr className="dropdown-divider border-dark m-0" />
                                </li>
                                <li>
                                    <button
                                        className={`dropdown-item fw-bold py-2 bg-warning bg-opacity-10 ${
                                            r.status.toLowerCase() ===
                                            "released"
                                                ? "text-muted"
                                                : "text-dark"
                                        }`}
                                        onClick={() =>
                                            handleActionClick("released", r)
                                        }
                                        disabled={
                                            r.status.toLowerCase() ===
                                            "released"
                                        }
                                        style={{
                                            cursor:
                                                r.status.toLowerCase() !==
                                                "released"
                                                    ? "pointer"
                                                    : "not-allowed",
                                        }}
                                    >
                                        <i className="bi bi-box-arrow-right text-secondary me-2"></i>{" "}
                                        Release Document
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
                                                "pending" || !r.previous_status
                                        }
                                        style={{
                                            cursor: !(
                                                r.status.toLowerCase() ===
                                                    "pending" ||
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

            <RequestViewModal
                show={modalState.show}
                selectedRequest={modalState.data}
                onClose={() => setModalState({ show: false, data: null })}
            />
            <ClaimRequestModal
                show={claimModalState.show}
                selectedRequest={claimModalState.data}
                onClose={() => setClaimModalState({ show: false, data: null })}
                onProceed={handleReleaseProceed}
            />
            <RequestConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeConfirmAction}
            />
            <Loading show={loading || actionLoading} message={loadingMessage} />
        </div>
    );
}
