import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Toast from "../../utils/toast";
import UserDrawer from "../../components/UserDrawer";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showDrawer, setShowDrawer] = useState(false);
    const [drawerType, setDrawerType] = useState("create");
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/users`, {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search: debouncedSearch,
                },
            });
            setUsers(res.data.data);
            setTotalItems(res.data.total);
            setTotalPages(res.data.last_page);
            setSelectedIds([]);
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: "error", title: "Failed to load users." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [currentPage, itemsPerPage, debouncedSearch]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = users.map((u) => u.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(
                selectedIds.filter((selectedId) => selectedId !== id),
            );
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleOpenCreate = () => {
        setDrawerType("create");
        setSelectedUser(null);
        setShowDrawer(true);
    };

    const handleOpenEdit = (user) => {
        Swal.fire({
            title: "UPDATE USER?",
            html: `Proceed to edit the records of <strong>${user.first_name}</strong>?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#F4D03F",
            cancelButtonColor: "#2d3436",
            confirmButtonText: "YES, PROCEED!",
            background: "#FFE2AF",
            color: "#000",
            customClass: {
                popup: "card-retro",
                confirmButton: "btn-retro border-dark text-dark fw-bold",
                cancelButton:
                    "btn-retro bg-dark border-dark text-white fw-bold",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                setDrawerType("edit");
                setSelectedUser(user);
                setShowDrawer(true);
            }
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;

        Swal.fire({
            title: `DELETE ${selectedIds.length} USER${selectedIds.length > 1 ? "S" : ""}?`,
            text: "Users will be moved to the recycle bin.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#F96E5B",
            cancelButtonColor: "#2d3436",
            confirmButtonText: "YES, DELETE!",
            background: "#FFE2AF",
            color: "#000",
            customClass: {
                popup: "card-retro",
                confirmButton: "btn-retro bg-danger border-dark",
                cancelButton: "btn-retro bg-dark border-dark",
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.post(`/api/users/bulk-delete`, {
                        ids: selectedIds,
                    });
                    fetchUsers();
                    Toast.fire({
                        icon: "success",
                        title: "Users removed successfully.",
                    });
                } catch (error) {
                    Toast.fire({
                        icon: "error",
                        title: "Failed to delete users.",
                    });
                }
            }
        });
    };

    const handleDelete = (id, firstName) => {
        Swal.fire({
            title: "DELETE USER?",
            html: `<strong>${firstName}</strong> will be moved to the recycle bin.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#F96E5B",
            cancelButtonColor: "#2d3436",
            confirmButtonText: "YES, DELETE IT!",
            background: "#FFE2AF",
            color: "#000",
            customClass: {
                popup: "card-retro",
                confirmButton: "btn-retro bg-danger border-dark",
                cancelButton: "btn-retro bg-dark border-dark",
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`/api/users/${id}`);
                    fetchUsers();
                    Toast.fire({
                        icon: "success",
                        title: "User removed successfully.",
                    });
                } catch (error) {
                    const msg =
                        error.response?.data?.message ||
                        "Failed to delete user.";
                    Toast.fire({ icon: "error", title: msg });
                }
            }
        });
    };

    return (
        <div className="container-fluid fade-in mb-5">
            <div
                className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 gap-3"
                style={{ borderBottom: "2px solid black" }}
            >
                <div>
                    <h2
                        className="fw-bold text-dark mb-0 font-monospace text-uppercase"
                        style={{ textShadow: "2px 2px 0 #fff" }}
                    >
                        USER RECORDS
                    </h2>
                    <p className="text-muted small mb-0 font-monospace fw-bold">
                        Manage system administrators, staff, and account access
                        levels.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    {selectedIds.length > 0 && (
                        <button
                            className="btn btn-retro px-4 py-2 d-flex align-items-center gap-2 fade-in"
                            style={{
                                backgroundColor: "#F96E5B",
                            }}
                            onClick={handleBulkDelete}
                        >
                            <i className="bi bi-trash-fill"></i>{" "}
                            <span className="d-none d-sm-inline ms-2">
                                DELETE
                            </span>{" "}
                            ({selectedIds.length})
                        </button>
                    )}
                    <button
                        className="btn btn-retro px-4 py-2 d-flex align-items-center gap-2"
                        onClick={handleOpenCreate}
                    >
                        <i className="bi bi-plus-square-fill"></i>{" "}
                        <span className="d-none d-sm-inline ms-2">
                            NEW USER
                        </span>
                    </button>
                </div>
            </div>

            <div className="card-retro">
                <div
                    className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-3"
                    style={{ borderBottom: "2px solid black" }}
                >
                    <div className="d-flex align-items-center gap-2">
                        <span className="small fw-bold font-monospace">
                            SHOW:
                        </span>
                        <select
                            className="form-select form-select-sm font-monospace fw-bold"
                            style={{ width: "80px", border: "2px solid black" }}
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
                            ENTRIES
                        </span>
                    </div>

                    <div className="input-group" style={{ maxWidth: "350px" }}>
                        <span className="input-group-text bg-white border-dark border-2 border-end-0">
                            {searchTerm !== debouncedSearch ? (
                                <div
                                    className="spinner-border spinner-border-sm text-dark"
                                    role="status"
                                ></div>
                            ) : (
                                <i className="bi bi-search"></i>
                            )}
                        </span>
                        <input
                            type="text"
                            className="form-control border-dark border-2 border-start-0 ps-2 font-monospace"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="card-body p-0">
                    <div
                        className="table-responsive"
                        style={{ maxHeight: "600px" }}
                    >
                        <table className="table table-hover align-middle mb-0 text-nowrap">
                            <thead
                                className="sticky-top"
                                style={{
                                    backgroundColor: "var(--color-secondary)",
                                    borderBottom: "2px solid black",
                                    zIndex: 10,
                                }}
                            >
                                <tr className="text-uppercase small fw-bold">
                                    <th className="ps-4 py-3 border-dark">
                                        <input
                                            type="checkbox"
                                            className="form-check-input border-dark"
                                            checked={
                                                users.length > 0 &&
                                                selectedIds.length ===
                                                    users.length
                                            }
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        ID
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        First Name
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Middle Name
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Last Name
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Suffix
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Email
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Contact No.
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Birthday
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Gender
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Role
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Status
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Verified At
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Last Login
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Created At
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Updated At
                                    </th>
                                    <th className="text-end pe-4 py-3 font-monospace text-dark border-dark sticky-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="17"
                                            className="text-center py-5"
                                        >
                                            <div className="spinner-border border-3 border-dark text-dark"></div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="17"
                                            className="text-center py-5 fw-bold font-monospace"
                                        >
                                            NO USERS RECORDS FOUND
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => {
                                        const isSelf =
                                            currentUser &&
                                            user.id === currentUser.id;

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
                                                <td className="ps-4 py-3 border-dark">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input border-dark"
                                                        checked={selectedIds.includes(
                                                            user.id,
                                                        )}
                                                        onChange={() =>
                                                            handleSelectOne(
                                                                user.id,
                                                            )
                                                        }
                                                        disabled={isSelf}
                                                    />
                                                </td>
                                                <td
                                                    className="py-3 font-monospace border-dark text-muted"
                                                    style={{
                                                        maxWidth: "150px",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                    title={user.id}
                                                >
                                                    {user.id}
                                                </td>
                                                <td className="py-3 fw-bold border-dark">
                                                    {user.first_name}
                                                </td>
                                                <td className="py-3 border-dark">
                                                    {user.middle_name || "-"}
                                                </td>
                                                <td className="py-3 fw-bold border-dark">
                                                    {user.last_name}
                                                </td>
                                                <td className="py-3 border-dark">
                                                    {user.suffix || "-"}
                                                </td>
                                                <td className="py-3 font-monospace border-dark">
                                                    {user.email}
                                                </td>
                                                <td className="py-3 font-monospace border-dark">
                                                    {user.contact_number || "-"}
                                                </td>
                                                <td className="py-3 font-monospace border-dark">
                                                    {user.birthday || "-"}
                                                </td>
                                                <td className="py-3 border-dark">
                                                    {user.gender || "-"}
                                                </td>
                                                <td className="py-3 border-dark">
                                                    <span
                                                        className={`badge rounded-0 border border-dark text-dark ${user.role === "super_admin" ? "bg-danger text-white" : user.role === "admin" ? "bg-warning" : "bg-white"}`}
                                                    >
                                                        {user.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 border-dark">
                                                    <span
                                                        className={`badge rounded-0 border border-dark px-2 py-1 ${user.status === "active" ? "bg-success" : "bg-danger"}`}
                                                    >
                                                        {user.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-monospace border-dark text-muted small">
                                                    {user.email_verified_at
                                                        ? new Date(
                                                              user.email_verified_at,
                                                          ).toLocaleString()
                                                        : "-"}
                                                </td>
                                                <td className="py-3 font-monospace border-dark text-muted small">
                                                    {user.login_at
                                                        ? new Date(
                                                              user.login_at,
                                                          ).toLocaleString()
                                                        : "-"}
                                                </td>
                                                <td className="py-3 font-monospace border-dark text-muted small">
                                                    {new Date(
                                                        user.created_at,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="py-3 font-monospace border-dark text-muted small">
                                                    {new Date(
                                                        user.updated_at,
                                                    ).toLocaleString()}
                                                </td>

                                                <td className="text-end pe-4 py-3 border-dark">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            className="btn btn-sm rounded-0 border-2 border-dark fw-bold d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: "32px",
                                                                height: "32px",
                                                                backgroundColor:
                                                                    "#F4D03F",
                                                                boxShadow:
                                                                    "2px 2px 0 #000",
                                                            }}
                                                            onClick={() =>
                                                                handleOpenEdit(
                                                                    user,
                                                                )
                                                            }
                                                            onMouseEnter={(e) =>
                                                                (e.currentTarget.style.transform =
                                                                    "translate(-1px, -1px)")
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.transform =
                                                                    "translate(0, 0)")
                                                            }
                                                            title="Edit User"
                                                        >
                                                            <i className="bi bi-pencil-fill text-dark"></i>
                                                        </button>

                                                        {isSelf ? (
                                                            <button
                                                                className="btn btn-sm rounded-0 border-2 border-dark d-flex align-items-center justify-content-center"
                                                                style={{
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    backgroundColor:
                                                                        "#e0e0e0",
                                                                    cursor: "not-allowed",
                                                                    opacity: 0.6,
                                                                }}
                                                                disabled
                                                                title="Self Delete Disabled"
                                                            >
                                                                <i className="bi bi-slash-circle text-muted"></i>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn btn-sm rounded-0 border-2 border-dark fw-bold d-flex align-items-center justify-content-center"
                                                                style={{
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    backgroundColor:
                                                                        "#F96E5B",
                                                                    boxShadow:
                                                                        "2px 2px 0 #000",
                                                                }}
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        user.id,
                                                                        user.first_name,
                                                                    )
                                                                }
                                                                onMouseEnter={(
                                                                    e,
                                                                ) =>
                                                                    (e.currentTarget.style.transform =
                                                                        "translate(-1px, -1px)")
                                                                }
                                                                onMouseLeave={(
                                                                    e,
                                                                ) =>
                                                                    (e.currentTarget.style.transform =
                                                                        "translate(0, 0)")
                                                                }
                                                                title="Delete User"
                                                            >
                                                                <i className="bi bi-trash-fill text-white"></i>
                                                            </button>
                                                        )}
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
                    className="card-footer bg-white py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-3"
                    style={{ borderTop: "2px solid black" }}
                >
                    <small className="text-muted font-monospace">
                        Showing User Records:{" "}
                        <strong>
                            {totalItems > 0
                                ? (currentPage - 1) * itemsPerPage + 1
                                : 0}
                        </strong>{" "}
                        to{" "}
                        <strong>
                            {Math.min(currentPage * itemsPerPage, totalItems)}
                        </strong>{" "}
                        of <strong>{totalItems}</strong>
                    </small>
                    <nav>
                        <ul className="pagination pagination-sm mb-0 shadow-sm">
                            <li
                                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                            >
                                <button
                                    className="page-link border-2 border-dark text-dark fw-bold rounded-0 me-1"
                                    onClick={() =>
                                        setCurrentPage(currentPage - 1)
                                    }
                                >
                                    &laquo; PREV
                                </button>
                            </li>
                            <li className="page-item disabled">
                                <span className="page-link border-2 border-dark text-dark fw-bold rounded-0 mx-1 bg-warning">
                                    PAGE {currentPage}
                                </span>
                            </li>
                            <li
                                className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                            >
                                <button
                                    className="page-link border-2 border-dark text-dark fw-bold rounded-0 ms-1"
                                    onClick={() =>
                                        setCurrentPage(currentPage + 1)
                                    }
                                >
                                    NEXT &raquo;
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <UserDrawer
                show={showDrawer}
                type={drawerType}
                selectedUser={selectedUser}
                onClose={() => setShowDrawer(false)}
                onSuccess={fetchUsers}
                apiPrefix="/api"
            />
        </div>
    );
}
