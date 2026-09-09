import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../../utils/toast";
import Loading from "../../utils/Loading";
import StrandModal from "../../components/StrandModal";
import StrandConfirmation from "../../components/StrandConfirmation";
import StrandListModal from "../../components/StrandListModal";

const BULK_DELETE_LIMIT = 50;

export default function Strands() {
    const [strands, setStrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalStrands, setTotalStrands] = useState(0);
    const [fromItem, setFromItem] = useState(0);
    const [toItem, setToItem] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("create");
    const [selectedStrand, setSelectedStrand] = useState(null);

    const [showListModal, setShowListModal] = useState(false);
    const [listData, setListData] = useState({
        strandCode: "",
        strandId: "",
        students: [],
    });

    const [confirmConfig, setConfirmConfig] = useState({ show: false });
    const [selectedIds, setSelectedIds] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("LOADING RECORDS...");

    const getToken = () =>
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const fetchStrands = async () => {
        setLoadingMessage("FETCHING STRANDS...");
        setLoading(true);
        try {
            const res = await axios.get("/api/strands", {
                params: {
                    search: searchTerm,
                    page: currentPage,
                    per_page: itemsPerPage,
                },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setStrands(res.data.data);
            setTotalStrands(res.data.total);
            setFromItem(res.data.from || 0);
            setToItem(res.data.to || 0);
            setLastPage(res.data.last_page);
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to load strands." });
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
        const delayDebounceFn = setTimeout(() => fetchStrands(), 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, currentPage, itemsPerPage]);

    const handleOpenCreate = () => {
        setModalType("create");
        setSelectedStrand(null);
        setShowModal(true);
    };

    const handleOpenEdit = (strand) => {
        setModalType("edit");
        setSelectedStrand(strand);
        setShowModal(true);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const idsToSelect = strands
                .slice(0, BULK_DELETE_LIMIT)
                .map((s) => s.id);
            setSelectedIds(idsToSelect);
            if (strands.length > BULK_DELETE_LIMIT) {
                Toast.fire({
                    icon: "info",
                    title: `Selection limited to ${BULK_DELETE_LIMIT} items only for bulk delete.`,
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
                    title: `Limit reached! You can only select up to ${BULK_DELETE_LIMIT} strands at a time.`,
                });
                return;
            }
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
        }
    };

    const handleDeleteClick = (strand) => {
        setConfirmConfig({
            show: true,
            type: "single_delete",
            payload: strand.id,
            title: "DELETE STRAND?",
            message: (
                <>
                    This action cannot be undone. Are you sure you want to
                    delete <br />
                    <strong>{strand.code}</strong>?
                </>
            ),
            confirmText: "YES, DELETE IT",
            confirmColor: "#F96E5B",
            iconClass: "bi-trash-fill",
        });
    };

    const handleBulkDeleteClick = () => {
        if (selectedIds.length === 0) return;
        const text = selectedIds.length > 1 ? "STRANDS" : "STRAND";

        setConfirmConfig({
            show: true,
            type: "bulk_delete",
            payload: selectedIds,
            title: `DELETE ${selectedIds.length} ${text}?`,
            message:
                "This bulk action cannot be undone. Are you sure you want to proceed?",
            confirmText: "YES, DELETE THEM",
            confirmColor: "#F96E5B",
            iconClass: "bi-trash-fill",
        });
    };

    const handleExportCSVClick = (strandId, strandCode) => {
        setConfirmConfig({
            show: true,
            type: "export_csv",
            payload: { strandId, strandCode },
            title: "EXPORT CSV?",
            message: (
                <>
                    Are you sure you want to download the Full Data CSV for{" "}
                    <br />
                    <strong>{strandCode}</strong>?
                </>
            ),
            confirmText: "YES, EXPORT",
            confirmColor: "#55efc4",
            iconClass: "bi-filetype-csv",
        });
    };

    const handleOpenListModal = async (strandId, strandCode) => {
        setActionLoading(true);
        setLoadingMessage("LOADING MASTER LIST...");
        try {
            const res = await axios.get("/api/strands/export-pdf", {
                params: { strand_id: strandId },
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            setListData({
                strandId: strandId,
                strandCode: strandCode,
                students: res.data.students || [],
            });
            setShowListModal(true);
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to load master list." });
        } finally {
            setActionLoading(false);
        }
    };

    const handleExportPDFClick = () => {
        setShowListModal(false);
        setConfirmConfig({
            show: true,
            type: "export_pdf",
            payload: {
                strandId: listData.strandId,
                strandCode: listData.strandCode,
            },
            title: "EXPORT PDF?",
            message: (
                <>
                    Are you sure you want to log and download the PDF Masterlist
                    for <br />
                    <strong>{listData.strandCode}</strong>?
                </>
            ),
            confirmText: "YES, EXPORT",
            confirmColor: "#ff7675",
            iconClass: "bi-filetype-pdf",
        });
    };

    const handleConfirmAction = async () => {
        const { type, payload } = confirmConfig;
        setConfirmConfig({ show: false });

        if (type === "export_csv")
            return await executeExportCSV(payload.strandId, payload.strandCode);
        if (type === "export_pdf")
            return await executeExportPDF(payload.strandId, payload.strandCode);

        setActionLoading(true);
        setLoadingMessage(
            type === "single_delete"
                ? "DELETING STRAND..."
                : "DELETING STRANDS...",
        );

        try {
            if (type === "single_delete") {
                await axios.delete(`/api/strands/${payload}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                await fetchStrands();
                Toast.fire({
                    icon: "success",
                    title: "Strand removed successfully.",
                });
            } else if (type === "bulk_delete") {
                const res = await axios.post(
                    "/api/strands/bulk-delete",
                    { ids: payload },
                    { headers: { Authorization: `Bearer ${getToken()}` } },
                );
                setSelectedIds([]);
                await fetchStrands();
                Toast.fire({ icon: "success", title: res.data.message });
            }
        } catch (error) {
            let msg = "Action failed.";
            if (error.response?.status === 422)
                msg = Object.values(error.response.data.errors)
                    .flat()
                    .join("\n");
            else if (error.response?.data?.message)
                msg = error.response.data.message;
            Toast.fire({ icon: "error", title: msg });
        } finally {
            setActionLoading(false);
        }
    };

    const executeExportCSV = async (strandId, strandCode) => {
        setActionLoading(true);
        setLoadingMessage("GENERATING CSV...");
        try {
            const res = await axios.get("/api/strands/export-csv", {
                params: { strand_id: strandId },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            const students = res.data.students;

            if (students.length === 0) {
                Toast.fire({
                    icon: "info",
                    title: "No enrolled students found.",
                });
                return;
            }

            const grouped = students.reduce((acc, s) => {
                const sec = s.academic?.section?.name || "UNASSIGNED SECTION";
                if (!acc[sec]) acc[sec] = { Male: [], Female: [] };
                const g = s.profile?.gender === "Female" ? "Female" : "Male";
                acc[sec][g].push(s);
                return acc;
            }, {});

            let csvRows = [];
            const headers = [
                "NO.",
                "STUDENT NUMBER",
                "LRN",
                "LAST NAME",
                "FIRST NAME",
                "MIDDLE NAME",
                "SUFFIX",
                "GENDER",
                "DOB",
                "PLACE OF BIRTH",
                "CITIZENSHIP",
                "CIVIL STATUS",
                "RELIGION",
                "EMAIL",
                "CONTACT NUMBER",
                "HOME ADDRESS",
                "PROVINCIAL ADDRESS",
                "CURRENT SCHOOL ATTENDED",
                "SECTION",
                "GRADE LEVEL",
                "MODALITY",
                "GEN AVE",
                "FATHER'S NAME",
                "FATHER'S OCCUPATION",
                "FATHER'S CONTACT",
                "MOTHER'S NAME",
                "MOTHER'S OCCUPATION",
                "MOTHER'S CONTACT",
                "GUARDIAN'S NAME",
                "GUARDIAN'S OCCUPATION",
                "GUARDIAN'S CONTACT",
            ];

            Object.entries(grouped).forEach(([section, genders]) => {
                const total = genders.Male.length + genders.Female.length;

                csvRows.push([
                    `SECTION: ${section}`,
                    `TOTAL ENROLLED: ${total}`,
                    ...Array(headers.length - 2).fill(""),
                ]);
                csvRows.push(headers);

                let counter = 1;
                ["Male", "Female"].forEach((gender) => {
                    csvRows.push([
                        `${gender.toUpperCase()}`,
                        ...Array(headers.length - 1).fill(""),
                    ]);

                    genders[gender].forEach((s) => {
                        csvRows.push([
                            counter++,
                            s.student_number || "N/A",
                            s.lrn || "N/A",
                            s.last_name || "N/A",
                            s.first_name || "N/A",
                            s.middle_name || "",
                            s.suffix || "",
                            s.profile?.gender || "N/A",
                            s.profile?.date_of_birth || "N/A",
                            s.profile?.place_of_birth || "N/A",
                            s.profile?.citizenship || "N/A",
                            s.profile?.civil_status || "N/A",
                            s.profile?.religion || "N/A",
                            s.email || "N/A",
                            s.contact_number || "N/A",
                            s.profile?.home_address || "N/A",
                            s.profile?.provincial_address || "N/A",
                            s.academic?.current_school_attended || "N/A",
                            s.academic?.section?.name || "N/A",
                            s.academic?.grade_level || "N/A",
                            s.academic?.learning_modality || "N/A",
                            s.academic?.general_average || "N/A",
                            s.family?.father_name || "N/A",
                            s.family?.father_occupation || "N/A",
                            s.family?.father_contact || "N/A",
                            s.family?.mother_name || "N/A",
                            s.family?.mother_occupation || "N/A",
                            s.family?.mother_contact || "N/A",
                            s.family?.guardian_name || "N/A",
                            s.family?.guardian_occupation || "N/A",
                            s.family?.guardian_contact || "N/A",
                        ]);
                    });
                });
                csvRows.push([]);
            });

            const csvContent =
                "data:text/csv;charset=utf-8," +
                csvRows
                    .map((e) => e.map((item) => `"${item}"`).join(","))
                    .join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);

            const currentYear = new Date().getFullYear();
            link.setAttribute(
                "download",
                `${strandCode}MasterList${currentYear}.csv`,
            );

            document.body.appendChild(link);
            link.click();
            link.remove();

            Toast.fire({
                icon: "success",
                title: "CSV Downloaded & Logged Successfully.",
            });
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to export CSV." });
        } finally {
            setActionLoading(false);
        }
    };

    const executeExportPDF = async (strandId, strandCode) => {
        setActionLoading(true);
        setLoadingMessage("LOGGING & DOWNLOADING PDF...");
        try {
            const res = await axios.get("/api/strands/export-pdf", {
                params: { strand_id: strandId, log: true },
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            if (res.data.url) {
                const pdfRes = await axios.get(res.data.url, {
                    responseType: "blob",
                });

                const blob = new Blob([pdfRes.data], {
                    type: "application/pdf",
                });
                const blobUrl = window.URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = blobUrl;

                const currentYear = new Date().getFullYear();
                link.setAttribute(
                    "download",
                    `${strandCode}MasterList${currentYear}.pdf`,
                );

                document.body.appendChild(link);
                link.click();
                link.remove();

                // Clean up memory
                window.URL.revokeObjectURL(blobUrl);

                Toast.fire({
                    icon: "success",
                    title: "PDF Downloaded Successfully!",
                });
            } else {
                Toast.fire({
                    icon: "error",
                    title: "Failed to generate print URL.",
                });
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to log/download PDF." });
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
                        style={{ textShadow: "2px 2px 0 #FFFFFF" }}
                    >
                        STRANDS MANAGEMENT
                    </h2>
                    <p className="text-muted small mb-0 font-monospace">
                        Manage Senior High School Strands
                    </p>
                </div>
                <div className="d-flex gap-2">
                    {selectedIds.length > 0 && (
                        <button
                            className="btn btn-danger btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center gap-2 text-white"
                            style={{ backgroundColor: "#F96E5B" }}
                            onClick={handleBulkDeleteClick}
                        >
                            <i className="bi bi-trash-fill"></i> DELETE (
                            {selectedIds.length})
                        </button>
                    )}
                    <button
                        className="btn btn-retro btn-press-retro px-4 py-2 d-flex align-items-center gap-2"
                        onClick={handleOpenCreate}
                    >
                        <i className="bi bi-plus-square-fill"></i> NEW STRAND
                    </button>
                </div>
            </div>

            <div className="card-retro mb-4">
                <div className="card-body p-3 d-flex justify-content-between align-items-center flex-wrap gap-3 bg-white">
                    <div className="d-flex align-items-center gap-3">
                        <div className="form-check m-0 d-flex align-items-center gap-2">
                            <input
                                type="checkbox"
                                className="form-check-input border-dark border-2 cursor-pointer m-0"
                                id="selectAll"
                                onChange={handleSelectAll}
                                checked={
                                    selectedIds.length === strands.length &&
                                    strands.length > 0
                                }
                                style={{ width: "20px", height: "20px" }}
                            />
                        </div>
                        <div
                            style={{
                                borderLeft: "2px solid black",
                                height: "25px",
                            }}
                        ></div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="small fw-bold font-monospace">
                                SHOW:
                            </span>
                            <select
                                className="form-control form-control-sm font-monospace fw-bold text-center hide-arrow cursor-pointer"
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
                    </div>
                    <div
                        className="input-group shadow-sm"
                        style={{ maxWidth: "350px" }}
                    >
                        <span className="input-group-text bg-white border-dark border-2 border-end-0">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-dark border-2 border-start-0 ps-2 font-monospace"
                            placeholder="Search strand..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                {strands.length === 0 && !loading ? (
                    <div className="col-12 text-center py-5 d-flex flex-column align-items-center justify-content-center">
                        <i
                            className="bi bi-folder-x text-muted"
                            style={{ fontSize: "4rem" }}
                        ></i>
                        <h5 className="fw-bold font-monospace mt-3 text-dark">
                            NO STRANDS FOUND
                        </h5>
                        <p className="text-muted small mb-4">
                            No strands matching your search criteria in the
                            database.
                        </p>
                        <button
                            className="btn btn-retro border-2 border-dark fw-bold btn-press-retro px-4 py-2"
                            onClick={handleOpenCreate}
                        >
                            <i className="bi bi-plus-lg me-2"></i> ADD NEW
                            STRAND
                        </button>
                    </div>
                ) : (
                    strands.map((strand) => (
                        <div
                            key={strand.id}
                            className="col-md-6 col-lg-4 col-xl-3"
                        >
                            <div className="card-retro h-100 position-relative bg-white d-flex flex-column">
                                <div
                                    style={{
                                        height: "14px",
                                        backgroundColor: "#48dbfb",
                                        borderBottom: "3px solid #000",
                                        borderTopLeftRadius: "6px",
                                        borderTopRightRadius: "6px",
                                    }}
                                ></div>
                                <div
                                    className="position-absolute"
                                    style={{
                                        top: "25px",
                                        right: "15px",
                                        zIndex: 10,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        className="form-check-input border-dark border-2 cursor-pointer m-0"
                                        style={{
                                            width: "22px",
                                            height: "22px",
                                        }}
                                        checked={selectedIds.includes(
                                            strand.id,
                                        )}
                                        onChange={(e) =>
                                            handleSelectOne(e, strand.id)
                                        }
                                    />
                                </div>

                                <div className="card-body p-4 d-flex flex-column flex-grow-1">
                                    <div className="mb-2 pe-4">
                                        <h3
                                            className="fw-bold mb-1 text-uppercase font-monospace text-truncate"
                                            style={{
                                                fontSize: "1.4rem",
                                                color: "#2d3436",
                                            }}
                                            title={strand.code}
                                        >
                                            {strand.code}
                                        </h3>
                                    </div>
                                    <p
                                        className="text-muted small font-monospace flex-grow-1"
                                        style={{ lineHeight: "1.5" }}
                                    >
                                        {strand.description}
                                    </p>

                                    <div className="mb-3 mt-auto">
                                        <span
                                            className="badge bg-warning text-dark border border-2 border-dark font-monospace py-2 px-3 d-flex justify-content-between align-items-center w-100 shadow-sm"
                                            style={{ fontSize: "0.85rem" }}
                                        >
                                            <span>
                                                <i className="bi bi-people-fill me-2 fs-6"></i>{" "}
                                                ENROLLED:
                                            </span>
                                            <span className="fs-6">
                                                {strand.students_count || 0}
                                            </span>
                                        </span>
                                    </div>

                                    <hr className="my-2 border-top border-2 border-dark opacity-100" />

                                    <div className="d-flex gap-2 mb-2">
                                        <button
                                            className="btn flex-grow-1 font-monospace fw-bold btn-retro-effect"
                                            style={{
                                                backgroundColor: "#55efc4",
                                                color: "#000",
                                            }}
                                            onClick={() =>
                                                handleExportCSVClick(
                                                    strand.id,
                                                    strand.code,
                                                )
                                            }
                                        >
                                            <i className="bi bi-filetype-csv me-1"></i>{" "}
                                            CSV
                                        </button>
                                        <button
                                            className="btn flex-grow-1 font-monospace fw-bold btn-retro-effect"
                                            style={{
                                                backgroundColor:
                                                    "var(--color-primary)",
                                                color: "#fff",
                                            }}
                                            onClick={() =>
                                                handleOpenListModal(
                                                    strand.id,
                                                    strand.code,
                                                )
                                            }
                                        >
                                            <i className="bi bi-list-check me-1"></i>{" "}
                                            LIST
                                        </button>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn flex-grow-1 font-monospace fw-bold btn-retro-effect"
                                            style={{
                                                backgroundColor: "#f6e58d",
                                                color: "#000",
                                            }}
                                            onClick={() =>
                                                handleOpenEdit(strand)
                                            }
                                        >
                                            <i className="bi bi-pencil-fill me-2"></i>{" "}
                                            EDIT
                                        </button>
                                        <button
                                            className="btn font-monospace fw-bold px-3 btn-retro-effect"
                                            style={{
                                                backgroundColor: "#F96E5B",
                                                color: "#fff",
                                            }}
                                            onClick={() =>
                                                handleDeleteClick(strand)
                                            }
                                        >
                                            <i className="bi bi-trash-fill"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="card-retro bg-white py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <small className="text-muted font-monospace fw-bold">
                    Showing <strong>{totalStrands > 0 ? fromItem : 0}</strong>{" "}
                    to <strong>{toItem}</strong> of{" "}
                    <strong>{totalStrands}</strong> strands
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

            <StrandModal
                show={showModal}
                type={modalType}
                selectedStrand={selectedStrand}
                onClose={() => setShowModal(false)}
                onSuccess={fetchStrands}
            />
            <StrandListModal
                show={showListModal}
                strandCode={listData.strandCode}
                students={listData.students}
                onClose={() => setShowListModal(false)}
                onExportPdf={handleExportPDFClick}
            />
            <StrandConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={handleConfirmAction}
            />
            <Loading show={loading || actionLoading} message={loadingMessage} />
        </div>
    );
}
