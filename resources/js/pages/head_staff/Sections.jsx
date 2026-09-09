import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../../utils/toast";
import Loading from "../../utils/Loading";
import SectionModal from "../../components/SectionModal";
import SectionConfirmation from "../../components/SectionConfirmation";
import SectionListModal from "../../components/SectionListModal";

const BULK_DELETE_LIMIT = 50;

export default function Sections() {
    const [sections, setSections] = useState([]);
    const [strandsList, setStrandsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalSections, setTotalSections] = useState(0);
    const [fromItem, setFromItem] = useState(0);
    const [toItem, setToItem] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("create");
    const [selectedSection, setSelectedSection] = useState(null);

    const [showListModal, setShowListModal] = useState(false);
    const [listData, setListData] = useState({
        sectionId: "",
        sectionName: "",
        gradeLevel: "",
        students: [],
    });

    const [confirmConfig, setConfirmConfig] = useState({ show: false });
    const [selectedIds, setSelectedIds] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("LOADING RECORDS...");

    const getToken = () =>
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const fetchSections = async () => {
        setLoadingMessage("FETCHING SECTIONS...");
        setLoading(true);
        try {
            const res = await axios.get("/api/sections", {
                params: {
                    search: searchTerm,
                    page: currentPage,
                    per_page: itemsPerPage,
                },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setSections(res.data.data);
            setTotalSections(res.data.total);
            setFromItem(res.data.from || 0);
            setToItem(res.data.to || 0);
            setLastPage(res.data.last_page);
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to load sections." });
        } finally {
            setLoading(false);
        }
    };

    const fetchStrands = async () => {
        try {
            const res = await axios.get("/api/strands?per_page=100", {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setStrandsList(res.data.data || []);
        } catch (error) {
            console.error("Failed to load strands for dropdown.");
        }
    };

    useEffect(() => {
        fetchStrands();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => fetchSections(), 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, currentPage, itemsPerPage]);

    const handleOpenCreate = () => {
        setModalType("create");
        setSelectedSection(null);
        setShowModal(true);
    };

    const handleOpenEdit = (section) => {
        setModalType("edit");
        setSelectedSection(section);
        setShowModal(true);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const idsToSelect = sections
                .slice(0, BULK_DELETE_LIMIT)
                .map((s) => s.id);
            setSelectedIds(idsToSelect);
            if (sections.length > BULK_DELETE_LIMIT) {
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
                    title: `Limit reached! Max ${BULK_DELETE_LIMIT} sections.`,
                });
                return;
            }
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
        }
    };

    const handleDeleteClick = (section) => {
        setConfirmConfig({
            show: true,
            type: "single_delete",
            payload: section.id,
            title: "DELETE SECTION?",
            message: (
                <>
                    This action cannot be undone. Are you sure you want to
                    delete <br />
                    <strong>{section.name}</strong>?
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
            title: `DELETE ${selectedIds.length} SECTIONS?`,
            message:
                "This bulk action cannot be undone. Are you sure you want to proceed?",
            confirmText: "YES, DELETE THEM",
            confirmColor: "#F96E5B",
            iconClass: "bi-trash-fill",
        });
    };

    const handleExportCSVClick = (sectionId, sectionName) => {
        setConfirmConfig({
            show: true,
            type: "export_csv",
            payload: { sectionId, sectionName },
            title: "EXPORT CSV?",
            message: (
                <>
                    Are you sure you want to download the Full Data CSV for{" "}
                    <br />
                    <strong>{sectionName}</strong>?
                </>
            ),
            confirmText: "YES, EXPORT",
            confirmColor: "#55efc4",
            iconClass: "bi-filetype-csv",
        });
    };

    const handleOpenListModal = async (sectionId, sectionName) => {
        setActionLoading(true);
        setLoadingMessage("LOADING CLASS LIST...");
        try {
            const res = await axios.get("/api/sections/export-pdf", {
                params: { section_id: sectionId },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setListData({
                sectionId,
                sectionName,
                gradeLevel: res.data.grade_level,
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
                sectionId: listData.sectionId,
                sectionName: listData.sectionName,
            },
            title: "EXPORT PDF?",
            message: (
                <>
                    Are you sure you want to log and download the PDF Masterlist
                    for <br />
                    <strong>{listData.sectionName}</strong>?
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
            return await executeExportCSV(
                payload.sectionId,
                payload.sectionName,
            );
        if (type === "export_pdf")
            return await executeExportPDF(
                payload.sectionId,
                payload.sectionName,
            );

        setActionLoading(true);
        setLoadingMessage(
            type === "single_delete"
                ? "DELETING SECTION..."
                : "DELETING SECTIONS...",
        );

        try {
            if (type === "single_delete") {
                await axios.delete(`/api/sections/${payload}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                Toast.fire({
                    icon: "success",
                    title: "Section removed successfully.",
                });
            } else if (type === "bulk_delete") {
                const res = await axios.post(
                    "/api/sections/bulk-delete",
                    { ids: payload },
                    { headers: { Authorization: `Bearer ${getToken()}` } },
                );
                setSelectedIds([]);
                Toast.fire({ icon: "success", title: res.data.message });
            }
            await fetchSections();
        } catch (error) {
            Toast.fire({ icon: "error", title: "Action failed." });
        } finally {
            setActionLoading(false);
        }
    };

    const executeExportCSV = async (sectionId, sectionName) => {
        setActionLoading(true);
        setLoadingMessage("GENERATING CSV...");
        try {
            const res = await axios.get("/api/sections/export-csv", {
                params: { section_id: sectionId },
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

            const males = students.filter(
                (s) => s.profile?.gender !== "Female",
            );
            const females = students.filter(
                (s) => s.profile?.gender === "Female",
            );

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
                "SECTION",
                "GRADE LEVEL",
                "MODALITY",
                "CURRENT SCHOOL ATTENDED",
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

            csvRows.push([
                `SECTION: ${sectionName}`,
                `TOTAL ENROLLED: ${students.length}`,
                ...Array(29).fill(""),
            ]);
            csvRows.push(headers);

            const mapStudentRow = (s, i) => [
                i + 1,
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
                sectionName,
                s.academic?.grade_level || "N/A",
                s.academic?.learning_modality || "N/A",
                s.academic?.current_school_attended || "N/A",
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
            ];

            csvRows.push(["MALE", ...Array(29).fill("")]);
            males.forEach((s, index) => csvRows.push(mapStudentRow(s, index)));

            csvRows.push(["FEMALE", ...Array(29).fill("")]);
            females.forEach((s, index) =>
                csvRows.push(mapStudentRow(s, index)),
            );

            const csvContent =
                "data:text/csv;charset=utf-8," +
                csvRows
                    .map((e) => e.map((item) => `"${item}"`).join(","))
                    .join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute(
                "download",
                `${sectionName}MasterList${new Date().getFullYear()}.csv`,
            );
            document.body.appendChild(link);
            link.click();
            link.remove();

            Toast.fire({
                icon: "success",
                title: "CSV Downloaded Successfully.",
            });
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to export CSV." });
        } finally {
            setActionLoading(false);
        }
    };

    const executeExportPDF = async (sectionId, sectionName) => {
        setActionLoading(true);
        setLoadingMessage("LOGGING & DOWNLOADING PDF...");
        try {
            const res = await axios.get("/api/sections/export-pdf", {
                params: { section_id: sectionId, log: true },
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
                link.setAttribute(
                    "download",
                    `${sectionName}MasterList${new Date().getFullYear()}.pdf`,
                );
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(blobUrl);
                Toast.fire({
                    icon: "success",
                    title: "PDF Downloaded Successfully!",
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
                        SECTION MANAGEMENT
                    </h2>
                    <p className="text-muted small mb-0 font-monospace">
                        Manage Class Capacity & Records
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
                        <i className="bi bi-plus-square-fill"></i> NEW SECTION
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
                                onChange={handleSelectAll}
                                checked={
                                    selectedIds.length === sections.length &&
                                    sections.length > 0
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
                            placeholder="Search section..."
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
                {sections.length === 0 && !loading ? (
                    <div className="col-12 text-center py-5 d-flex flex-column align-items-center justify-content-center">
                        <i
                            className="bi bi-grid-3x3-gap text-muted"
                            style={{ fontSize: "4rem" }}
                        ></i>
                        <h5 className="fw-bold font-monospace mt-3 text-dark">
                            NO SECTIONS FOUND
                        </h5>
                        <p className="text-muted small mb-4">
                            No sections matching your search criteria in the
                            database.
                        </p>
                        <button
                            className="btn btn-retro border-2 border-dark fw-bold btn-press-retro px-4 py-2"
                            onClick={handleOpenCreate}
                        >
                            <i className="bi bi-plus-lg me-2"></i> ADD NEW
                            SECTION
                        </button>
                    </div>
                ) : (
                    sections.map((section) => {
                        const enrolled = section.enrolled_count || 0;
                        const capacity = section.capacity || 40;
                        const isFull = enrolled >= capacity;

                        return (
                            <div
                                key={section.id}
                                className="col-md-6 col-lg-4 col-xl-3"
                            >
                                <div className="card-retro h-100 position-relative bg-white d-flex flex-column">
                                    <div
                                        style={{
                                            height: "14px",
                                            backgroundColor:
                                                section.grade_level === "11"
                                                    ? "#F96E5B"
                                                    : "#F4D03F",
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
                                                section.id,
                                            )}
                                            onChange={(e) =>
                                                handleSelectOne(e, section.id)
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
                                                title={section.name}
                                            >
                                                {section.name}
                                            </h3>
                                        </div>
                                        <div className="small text-muted font-monospace fw-bold mb-3">
                                            {section.strand?.code} &bull; GRADE{" "}
                                            {section.grade_level}
                                        </div>

                                        <div className="mt-auto mb-3">
                                            <div className="d-flex justify-content-between small fw-bold font-monospace mb-1">
                                                <span>STUDENTS:</span>
                                                <span
                                                    className={
                                                        isFull
                                                            ? "text-danger"
                                                            : "text-success"
                                                    }
                                                >
                                                    {enrolled} / {capacity}
                                                </span>
                                            </div>
                                            <div
                                                className="progress border border-2 border-dark rounded-pill"
                                                style={{
                                                    height: "10px",
                                                    backgroundColor: "#f1f2f6",
                                                }}
                                            >
                                                <div
                                                    className={`progress-bar rounded-pill ${isFull ? "bg-danger" : "bg-success"}`}
                                                    style={{
                                                        width: `${(enrolled / capacity) * 100}%`,
                                                    }}
                                                ></div>
                                            </div>
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
                                                        section.id,
                                                        section.name,
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
                                                        section.id,
                                                        section.name,
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
                                                    handleOpenEdit(section)
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
                                                    handleDeleteClick(section)
                                                }
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="card-retro bg-white py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <small className="text-muted font-monospace fw-bold">
                    Showing <strong>{totalSections > 0 ? fromItem : 0}</strong>{" "}
                    to <strong>{toItem}</strong> of{" "}
                    <strong>{totalSections}</strong> sections
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

            <SectionModal
                show={showModal}
                type={modalType}
                selectedSection={selectedSection}
                strands={strandsList}
                onClose={() => setShowModal(false)}
                onSuccess={fetchSections}
            />
            <SectionListModal
                show={showListModal}
                sectionName={listData.sectionName}
                gradeLevel={listData.gradeLevel}
                students={listData.students}
                onClose={() => setShowListModal(false)}
                onExportPdf={handleExportPDFClick}
            />
            <SectionConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={handleConfirmAction}
            />
            <Loading show={loading || actionLoading} message={loadingMessage} />
        </div>
    );
}
