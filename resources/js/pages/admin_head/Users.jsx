import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Toast from "../../utils/toast";
import UserModal from "../../components/UserModal";
import UserImport from "../../components/UserImport";
import UserConfirmation from "../../components/UserConfirmation";
import Loading from "../../utils/Loading";

const BULK_DELETE_LIMIT = 50;

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [fromItem, setFromItem] = useState(0);
    const [toItem, setToItem] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("create");
    const [selectedUser, setSelectedUser] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);

    const [confirmConfig, setConfirmConfig] = useState({ show: false });
    const [selectedIds, setSelectedIds] = useState([]);

    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("LOADING RECORDS...");

    const getToken = () =>
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const fetchUsers = async () => {
        setLoadingMessage("FETCHING RECORDS...");
        setLoading(true);
        try {
            const res = await axios.get("/api/users", {
                params: {
                    search: searchTerm,
                    page: currentPage,
                    per_page: itemsPerPage,
                },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setUsers(res.data.data);
            setTotalUsers(res.data.total);
            setFromItem(res.data.from || 0);
            setToItem(res.data.to || 0);
            setLastPage(res.data.last_page);
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to load users." });
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
        const delayDebounceFn = setTimeout(() => fetchUsers(), 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, currentPage, itemsPerPage]);

    const handleOpenCreate = () => {
        setModalType("create");
        setSelectedUser(null);
        setShowModal(true);
    };
    const handleOpenEdit = (user) => {
        setModalType("edit");
        setSelectedUser(user);
        setShowModal(true);
    };
    const handleOpenView = (user) => {
        setModalType("view");
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleDeleteClick = (userToDelete) => {
        const fullName = getFullName(userToDelete);
        setConfirmConfig({
            show: true,
            type: "single_delete",
            payload: userToDelete.id,
            title: "DELETE USER?",
            message: (
                <>
                    This action cannot be undone. Are you sure you want to
                    delete the records of <br /> <strong>{fullName}</strong>?
                </>
            ),
            confirmText: "YES, DELETE IT",
            confirmColor: "#F96E5B",
            iconClass: "bi-trash-fill",
        });
    };

    const handleBulkDeleteClick = () => {
        if (selectedIds.length === 0) return;

        const userText = selectedIds.length > 1 ? "USERS" : "USER";

        setConfirmConfig({
            show: true,
            type: "bulk_delete",
            payload: selectedIds,
            title: `DELETE ${selectedIds.length} ${userText}?`,
            message:
                "This bulk action cannot be undone. Are you sure you want to proceed?",
            confirmText: "YES, DELETE THEM",
            confirmColor: "#F96E5B",
            iconClass: "bi-trash-fill",
        });
    };

    const handleConfirmAction = async () => {
        const { type, payload } = confirmConfig;
        setConfirmConfig({ show: false });

        setActionLoading(true);
        setLoadingMessage(
            type === "single_delete" ? "DELETING USER..." : "DELETING USERS...",
        );

        try {
            if (type === "single_delete") {
                await axios.delete(`/api/users/${payload}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                await fetchUsers();
                Toast.fire({
                    icon: "success",
                    title: "User removed successfully.",
                });
            } else if (type === "bulk_delete") {
                const res = await axios.post(
                    "/api/users/bulk-delete",
                    { ids: payload },
                    { headers: { Authorization: `Bearer ${getToken()}` } },
                );
                setSelectedIds([]);
                await fetchUsers();
                Toast.fire({ icon: "success", title: res.data.message });
            }
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
            const selectableUsers = users.filter(
                (u) => !currentUser || u.id !== currentUser.id,
            );
            const idsToSelect = selectableUsers
                .slice(0, BULK_DELETE_LIMIT)
                .map((u) => u.id);

            setSelectedIds(idsToSelect);

            if (selectableUsers.length > BULK_DELETE_LIMIT) {
                Toast.fire({
                    icon: "info",
                    title: `Selection limited to ${BULK_DELETE_LIMIT} users only for bulk delete.`,
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
                    title: `Limit reached! You can only select up to ${BULK_DELETE_LIMIT} users at a time.`,
                });
                return;
            }
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
        }
    };

    const getFullName = (u) =>
        `${u.first_name || ""} ${u.middle_name ? u.middle_name[0] + "." : ""} ${u.last_name || ""} ${u.suffix || ""}`.trim();
    const isAdmin = currentUser?.role === "admin";

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
                            USERS MANAGEMENT
                        </h2>
                        <p className="text-muted small mb-0 font-monospace">
                            Manage Administrators, Heads, & Staff
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        {selectedIds.length > 0 && (
                            <button
                                className="btn btn-danger btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2 text-white"
                                style={{ backgroundColor: "#F96E5B" }}
                                onClick={handleBulkDeleteClick}
                                title="Delete Selected"
                            >
                                <i className="bi bi-trash-fill"></i> DELETE (
                                {selectedIds.length})
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                className="btn btn-info btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                                style={{ backgroundColor: "#55efc4" }}
                                onClick={() => setShowImportModal(true)}
                                title="Import CSV"
                            >
                                <i className="bi bi-file-earmark-spreadsheet-fill text-dark"></i>{" "}
                                IMPORT CSV
                            </button>
                        )}
                        <button
                            className="btn btn-retro btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                            onClick={handleOpenCreate}
                            title="New User"
                        >
                            <i className="bi bi-person-plus-fill"></i> NEW USER
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
                                placeholder="Search user..."
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
                                                            users.filter(
                                                                (u) =>
                                                                    !currentUser ||
                                                                    u.id !==
                                                                        currentUser.id,
                                                            ).length,
                                                            BULK_DELETE_LIMIT,
                                                        )
                                                }
                                            />
                                        </th>
                                        <th className="py-3 font-monospace text-dark">
                                            <i className="bi bi-person-badge-fill me-1"></i>{" "}
                                            User Details
                                        </th>
                                        <th className="py-3 font-monospace text-dark text-center">
                                            <i className="bi bi-shield-lock-fill me-1"></i>{" "}
                                            Role
                                        </th>
                                        <th className="py-3 font-monospace text-dark">
                                            <i className="bi bi-gender-ambiguous me-1"></i>{" "}
                                            Gender
                                        </th>
                                        <th className="py-3 font-monospace text-dark text-end">
                                            <i className="bi bi-telephone-fill me-1"></i>{" "}
                                            Contact #
                                        </th>
                                        <th className="py-3 font-monospace text-dark">
                                            <i className="bi bi-clock-history me-1"></i>{" "}
                                            Login At
                                        </th>
                                        <th className="text-end pe-4 py-3 font-monospace text-dark">
                                            <i className="bi bi-gear-fill me-1"></i>{" "}
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 && !loading ? (
                                        <tr>
                                            <td
                                                colSpan="8"
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
                                                        NO USERS FOUND
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
                                                        ADD NEW USER
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : users.length > 0 ? (
                                        users.map((user) => {
                                            const isSelf =
                                                currentUser &&
                                                user.id === currentUser.id;
                                            const isRestrictedForHead =
                                                currentUser?.role === "head" &&
                                                (user.role === "admin" ||
                                                    user.role === "head");
                                            const fullName = getFullName(user);

                                            return (
                                                <tr
                                                    key={user.id}
                                                    className={
                                                        isSelf
                                                            ? "bg-info bg-opacity-10"
                                                            : ""
                                                    }
                                                    style={{
                                                        borderBottom:
                                                            "1px solid #000",
                                                    }}
                                                >
                                                    <td className="ps-4 py-3">
                                                        {!isSelf &&
                                                            !isRestrictedForHead && (
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input border-dark border-2 cursor-pointer"
                                                                    checked={selectedIds.includes(
                                                                        user.id,
                                                                    )}
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleSelectOne(
                                                                            e,
                                                                            user.id,
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={`https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff`}
                                                                className="rounded-circle me-3 border border-2 border-dark shadow-sm"
                                                                width="45"
                                                                height="45"
                                                                alt="Avatar"
                                                            />
                                                            <div>
                                                                <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                                                    {fullName}
                                                                    {isSelf && (
                                                                        <span
                                                                            className="badge bg-dark text-white border border-dark rounded-0"
                                                                            style={{
                                                                                fontSize:
                                                                                    "0.6rem",
                                                                            }}
                                                                        >
                                                                            YOU
                                                                        </span>
                                                                    )}
                                                                    <span
                                                                        style={{
                                                                            width: "12px",
                                                                            height: "12px",
                                                                            borderRadius:
                                                                                "50%",
                                                                            backgroundColor:
                                                                                user.status ===
                                                                                "active"
                                                                                    ? "#00b894"
                                                                                    : "#d63031",
                                                                            border: "2px solid #000",
                                                                            display:
                                                                                "inline-block",
                                                                            cursor: "help",
                                                                        }}
                                                                        title={
                                                                            user.status
                                                                                ? user.status.toUpperCase()
                                                                                : "ACTIVE"
                                                                        }
                                                                    ></span>
                                                                </div>
                                                                <div className="small text-muted font-monospace">
                                                                    {user.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span
                                                            className={`badge rounded-0 border border-dark text-dark px-3 py-2 btn-action-retro ${user.role === "admin" ? "bg-warning" : user.role === "head" ? "bg-info" : "bg-white"}`}
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                            }}
                                                        >
                                                            {user.role.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 font-monospace fw-bold">
                                                        {user.gender ===
                                                            "Male" && (
                                                            <span
                                                                style={{
                                                                    color: "#0984e3",
                                                                }}
                                                            >
                                                                <i className="bi bi-gender-male me-1"></i>
                                                                Male
                                                            </span>
                                                        )}
                                                        {user.gender ===
                                                            "Female" && (
                                                            <span
                                                                style={{
                                                                    color: "#e84393",
                                                                }}
                                                            >
                                                                <i className="bi bi-gender-female me-1"></i>
                                                                Female
                                                            </span>
                                                        )}
                                                        {!user.gender && "-"}
                                                    </td>
                                                    <td className="py-3 font-monospace fw-bold text-dark text-end">
                                                        {user.contact_number ||
                                                            "-"}
                                                    </td>
                                                    <td className="py-3 font-monospace small text-muted fw-bold">
                                                        {user.login_at
                                                            ? new Date(
                                                                  user.login_at,
                                                              ).toLocaleString(
                                                                  "en-US",
                                                                  {
                                                                      month: "short",
                                                                      day: "numeric",
                                                                      year: "numeric",
                                                                      hour: "numeric",
                                                                      minute: "2-digit",
                                                                  },
                                                              )
                                                            : "Never logged in"}
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
                                                                        user,
                                                                    )
                                                                }
                                                                title="View Details"
                                                            >
                                                                <i className="bi bi-eye-fill text-dark"></i>
                                                            </button>

                                                            {isRestrictedForHead ? (
                                                                <button
                                                                    className="btn btn-sm rounded-circle border-2 border-dark bg-secondary opacity-50 d-flex align-items-center justify-content-center"
                                                                    style={
                                                                        tableActionBtnStyle
                                                                    }
                                                                    disabled
                                                                    title="Restricted"
                                                                >
                                                                    <i className="bi bi-lock-fill text-white"></i>
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        className="btn btn-sm rounded-circle border-2 border-dark fw-bold btn-action-retro d-flex align-items-center justify-content-center"
                                                                        style={{
                                                                            ...tableActionBtnStyle,
                                                                            backgroundColor:
                                                                                "#F4D03F",
                                                                        }}
                                                                        onClick={() =>
                                                                            handleOpenEdit(
                                                                                user,
                                                                            )
                                                                        }
                                                                        title="Edit User"
                                                                    >
                                                                        <i className="bi bi-pencil-fill text-dark"></i>
                                                                    </button>
                                                                    {!isSelf && (
                                                                        <button
                                                                            className="btn btn-sm rounded-circle border-2 border-dark fw-bold btn-action-retro d-flex align-items-center justify-content-center"
                                                                            style={{
                                                                                ...tableActionBtnStyle,
                                                                                backgroundColor:
                                                                                    "#F96E5B",
                                                                            }}
                                                                            onClick={() =>
                                                                                handleDeleteClick(
                                                                                    user,
                                                                                )
                                                                            }
                                                                            title="Delete User"
                                                                        >
                                                                            <i className="bi bi-trash-fill text-white"></i>
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="8"
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
                            <strong>{totalUsers > 0 ? fromItem : 0}</strong> to{" "}
                            <strong>{toItem}</strong> of{" "}
                            <strong>{totalUsers}</strong> users
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

            <UserModal
                show={showModal}
                type={modalType}
                selectedUser={selectedUser}
                onClose={() => setShowModal(false)}
                onSuccess={fetchUsers}
                apiPrefix="/api"
            />
            <UserImport
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={fetchUsers}
            />

            <UserConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={handleConfirmAction}
            />

            <Loading show={loading || actionLoading} message={loadingMessage} />
        </>
    );
}
