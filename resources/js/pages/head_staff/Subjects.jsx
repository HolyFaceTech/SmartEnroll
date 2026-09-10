import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../../utils/toast";
import Loading from "../../utils/Loading";
import SubjectModal from "../../components/SubjectModal";
import SubjectConfirmation from "../../components/SubjectConfirmation";
import SubjectImport from "../../components/SubjectImport";

const BULK_DELETE_LIMIT = 50;

export default function Subjects({ apiPrefix = "/api" }) {
    const [subjects, setSubjects] = useState([]);
    const [strandsList, setStrandsList] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("LOADING RECORDS...");

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [filterStrand, setFilterStrand] = useState("");
    const [filterGrade, setFilterGrade] = useState("");
    const [filterTerm, setFilterTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalSubjects, setTotalSubjects] = useState(0);
    const [fromItem, setFromItem] = useState(0);
    const [toItem, setToItem] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("create");
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ show: false });

    const [selectedIds, setSelectedIds] = useState([]);

    const getToken = () =>
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const tableActionBtnStyle = {
        width: "35px",
        height: "35px",
        transition: "all 0.2s ease-in-out",
        boxShadow: "2px 2px 0 #000",
    };

    const fetchStrands = async () => {
        try {
            const res = await axios.get(`${apiPrefix}/strands?per_page=100`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setStrandsList(res.data.data || []);
        } catch (error) {
            console.error("Failed to load strands for dropdown.");
        }
    };

    const fetchSubjects = async () => {
        setLoadingMessage("FETCHING SUBJECTS...");
        setLoading(true);
        try {
            const res = await axios.get(`${apiPrefix}/subjects`, {
                params: {
                    search: debouncedSearchTerm,
                    strand_id: filterStrand,
                    grade_level: filterGrade,
                    term: filterTerm,
                    page: currentPage,
                    per_page: itemsPerPage,
                },
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            if (res.data.data) {
                setSubjects(res.data.data);
                setTotalSubjects(res.data.total);
                setFromItem(res.data.from || 0);
                setToItem(res.data.to || 0);
                setLastPage(res.data.last_page);
            } else {
                setSubjects(res.data);
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to load subjects." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStrands();
    }, []);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    useEffect(() => {
        fetchSubjects();
    }, [
        debouncedSearchTerm,
        filterStrand,
        filterGrade,
        filterTerm,
        currentPage,
        itemsPerPage,
    ]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const idsToSelect = subjects
                .slice(0, BULK_DELETE_LIMIT)
                .map((s) => s.id);
            setSelectedIds(idsToSelect);
            if (subjects.length > BULK_DELETE_LIMIT) {
                Toast.fire({
                    icon: "info",
                    title: `Selection limited to ${BULK_DELETE_LIMIT} items only.`,
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
                    title: `Limit reached! Max ${BULK_DELETE_LIMIT} subjects.`,
                });
                return;
            }
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
        }
    };

    const handleOpenCreate = () => {
        setModalType("create");
        setSelectedSubject(null);
        setShowModal(true);
    };

    const handleOpenEdit = (subject) => {
        setModalType("edit");
        setSelectedSubject(subject);
        setShowModal(true);
    };

    const handleDeleteClick = (subject) => {
        setConfirmConfig({
            show: true,
            type: "single_delete",
            payload: subject.id,
            title: "DELETE SUBJECT?",
            message: (
                <>
                    This action cannot be undone. Are you sure you want to
                    delete <br />
                    <strong>{subject.code}</strong>?
                </>
            ),
            confirmText: "YES, DELETE IT",
            confirmColor: "#F96E5B",
            iconClass: "bi-trash-fill",
        });
    };

    const handleBulkDeleteClick = () => {
        if (selectedIds.length === 0) return;
        setConfirmConfig({
            show: true,
            type: "bulk_delete",
            payload: selectedIds,
            title: `DELETE ${selectedIds.length} SUBJECTS?`,
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
            type === "single_delete"
                ? "DELETING SUBJECT..."
                : "DELETING SUBJECTS...",
        );

        try {
            if (type === "single_delete") {
                await axios.delete(`${apiPrefix}/subjects/${payload}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                Toast.fire({
                    icon: "success",
                    title: "Subject removed successfully.",
                });
            } else if (type === "bulk_delete") {
                const res = await axios.post(
                    `${apiPrefix}/subjects/bulk-delete`,
                    { ids: payload },
                    { headers: { Authorization: `Bearer ${getToken()}` } },
                );
                setSelectedIds([]);
                Toast.fire({ icon: "success", title: res.data.message });
            }
            await fetchSubjects();
        } catch (error) {
            Toast.fire({ icon: "error", title: "Action failed." });
        } finally {
            setActionLoading(false);
        }
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
                        SUBJECT MANAGEMENT
                    </h2>
                    <p className="text-muted small mb-0 font-monospace">
                        Curriculum & Subjects List
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

                    <button
                        className="btn btn-info btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                        style={{ backgroundColor: "#55efc4" }}
                        onClick={() => setShowImportModal(true)}
                        title="Import CSV"
                    >
                        <i className="bi bi-file-earmark-spreadsheet-fill text-dark"></i>{" "}
                        IMPORT SUBJECT
                    </button>

                    <button
                        className="btn btn-retro btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                        onClick={handleOpenCreate}
                        title="New Subject"
                    >
                        <i className="bi bi-plus-square-fill"></i> NEW SUBJECT
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

                    <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap flex-grow-1">
                        <select
                            className="form-control form-control-sm border-dark border-2 font-monospace fw-bold text-center cursor-pointer"
                            style={{ maxWidth: "160px" }}
                            value={filterStrand}
                            onChange={(e) => {
                                setFilterStrand(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">ALL STRANDS</option>
                            {strandsList.map((st) => (
                                <option key={st.id} value={st.id}>
                                    {st.code}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-control form-control-sm border-dark border-2 font-monospace fw-bold text-center cursor-pointer"
                            style={{ maxWidth: "130px" }}
                            value={filterGrade}
                            onChange={(e) => {
                                setFilterGrade(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">ALL GRADES</option>
                            <option value="11">Grade 11</option>
                            <option value="12">Grade 12</option>
                        </select>

                        <select
                            className="form-control form-control-sm border-dark border-2 font-monospace fw-bold text-center cursor-pointer"
                            style={{ maxWidth: "150px" }}
                            value={filterTerm}
                            onChange={(e) => {
                                setFilterTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">ALL TERMS</option>
                            <option value="1st">1st Term</option>
                            <option value="2nd">2nd Term</option>
                            <option value="3rd">3rd Term</option>
                        </select>
                    </div>

                    <div
                        className="input-group"
                        style={{ maxWidth: "300px", minWidth: "200px" }}
                    >
                        <span className="input-group-text bg-white border-dark border-2 border-end-0">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-dark border-2 border-start-0 ps-2 font-monospace"
                            placeholder="Search subject..."
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
                                                        subjects.length,
                                                        BULK_DELETE_LIMIT,
                                                    )
                                            }
                                        />
                                    </th>
                                    <th className="py-3 font-monospace text-dark">
                                        <i className="bi bi-code-square me-1"></i>{" "}
                                        Code
                                    </th>
                                    <th className="py-3 font-monospace text-dark">
                                        <i className="bi bi-text-paragraph me-1"></i>{" "}
                                        Description
                                    </th>
                                    <th className="py-3 font-monospace text-dark text-center">
                                        <i className="bi bi-diagram-3-fill me-1"></i>{" "}
                                        Strand
                                    </th>
                                    <th className="py-3 font-monospace text-dark text-center">
                                        <i className="bi bi-bar-chart-steps me-1"></i>{" "}
                                        Grade / Term
                                    </th>
                                    <th className="text-end pe-4 py-3 font-monospace text-dark">
                                        <i className="bi bi-gear-fill me-1"></i>{" "}
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.length === 0 && !loading ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center py-5"
                                        >
                                            <div className="d-flex flex-column align-items-center justify-content-center">
                                                <i
                                                    className="bi bi-folder-x text-muted"
                                                    style={{ fontSize: "4rem" }}
                                                ></i>
                                                <h5 className="fw-bold font-monospace mt-3 text-dark">
                                                    NO SUBJECTS FOUND
                                                </h5>
                                                <p className="text-muted small mb-4">
                                                    We couldn't find any records
                                                    matching your criteria in
                                                    the database.
                                                </p>
                                                <button
                                                    className="btn btn-retro border-2 border-dark fw-bold btn-press-retro px-4 py-2"
                                                    onClick={handleOpenCreate}
                                                >
                                                    <i className="bi bi-plus-lg me-2"></i>{" "}
                                                    ADD NEW SUBJECT
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : subjects.length > 0 ? (
                                    subjects.map((subject) => (
                                        <tr
                                            key={subject.id}
                                            style={{
                                                borderBottom: "1px solid #000",
                                            }}
                                        >
                                            <td className="ps-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input border-dark border-2 cursor-pointer"
                                                    checked={selectedIds.includes(
                                                        subject.id,
                                                    )}
                                                    onChange={(e) =>
                                                        handleSelectOne(
                                                            e,
                                                            subject.id,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="py-3 fw-bold font-monospace">
                                                {subject.code}
                                            </td>
                                            <td
                                                className="py-3"
                                                style={{ maxWidth: "300px" }}
                                            >
                                                <div
                                                    className="text-truncate"
                                                    title={subject.description}
                                                    style={{ cursor: "help" }}
                                                >
                                                    {subject.description}
                                                </div>
                                            </td>
                                            <td className="py-3 text-center">
                                                <span
                                                    className="badge rounded-0 border border-dark text-dark bg-white px-3 py-2 btn-action-retro"
                                                    style={{
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    {subject.strand?.code ||
                                                        "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-3 font-monospace small fw-bold text-center">
                                                G{subject.grade_level}
                                                <span className="mx-2 text-muted">
                                                    |
                                                </span>
                                                {subject.term}
                                            </td>
                                            <td className="text-end pe-4 py-3">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button
                                                        className="btn btn-sm rounded-circle border-2 border-dark fw-bold btn-action-retro d-flex align-items-center justify-content-center"
                                                        style={{
                                                            ...tableActionBtnStyle,
                                                            backgroundColor:
                                                                "#F4D03F",
                                                        }}
                                                        onClick={() =>
                                                            handleOpenEdit(
                                                                subject,
                                                            )
                                                        }
                                                        title="Edit Subject"
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
                                                            handleDeleteClick(
                                                                subject,
                                                            )
                                                        }
                                                        title="Delete Subject"
                                                    >
                                                        <i className="bi bi-trash-fill text-white"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
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
                        <strong>{totalSubjects > 0 ? fromItem : 0}</strong> to{" "}
                        <strong>{toItem}</strong> of{" "}
                        <strong>{totalSubjects}</strong> subjects
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

            <SubjectModal
                show={showModal}
                type={modalType}
                selectedSubject={selectedSubject}
                strands={strandsList}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    fetchSubjects();
                    setSelectedIds([]);
                }}
                apiPrefix={apiPrefix}
            />

            <SubjectImport
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    fetchSubjects();
                    setSelectedIds([]);
                }}
                apiPrefix={apiPrefix}
            />

            <SubjectConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={handleConfirmAction}
            />

            <Loading show={loading || actionLoading} message={loadingMessage} />
        </div>
    );
}
