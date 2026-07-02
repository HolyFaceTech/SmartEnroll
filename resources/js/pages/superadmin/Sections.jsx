import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Toast from "../../utils/toast";
import SectionModal from "../../components/SectionModal";
import SectionMasterlistModal from "../../components/SectionMasterlistModal";

const getStrandColor = (id) => {
    const palettes = [
        { bg: "#FF9F43", text: "#000" },
        { bg: "#1DD1A1", text: "#000" },
        { bg: "#5F27CD", text: "#FFF" },
        { bg: "#FF6B6B", text: "#FFF" },
        { bg: "#54A0FF", text: "#000" },
        { bg: "#F368E0", text: "#FFF" },
        { bg: "#00D2D3", text: "#000" },
        { bg: "#FECA57", text: "#000" },
        { bg: "#8395A7", text: "#FFF" },
    ];
    let num =
        typeof id === "string"
            ? id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
            : id;
    return palettes[num % palettes.length];
};

export default function Sections() {
    const [sections, setSections] = useState([]);
    const [strands, setStrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("create");
    const [selectedSection, setSelectedSection] = useState(null);
    const [showMasterList, setShowMasterList] = useState(false);
    const [masterData, setMasterData] = useState(null);
    const [loadingMaster, setLoadingMaster] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [secRes, strandRes] = await Promise.all([
                axios.get(`/api/sections`, {
                    params: {
                        page: currentPage,
                        limit: itemsPerPage,
                        search: debouncedSearch,
                    },
                }),
                axios.get("/api/strands", { params: { limit: 100 } }),
            ]);
            setSections(secRes.data.data);
            setTotalItems(secRes.data.total);
            setTotalPages(secRes.data.last_page);

            const strandArray = strandRes.data.data
                ? strandRes.data.data
                : strandRes.data;
            setStrands(strandArray || []);
            setSelectedIds([]);
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to load data." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPage, itemsPerPage, debouncedSearch]);

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(sections.map((s) => s.id));
        else setSelectedIds([]);
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id))
            setSelectedIds(
                selectedIds.filter((selectedId) => selectedId !== id),
            );
        else setSelectedIds([...selectedIds, id]);
    };

    const handleOpenCreate = () => {
        setModalType("create");
        setSelectedSection(null);
        setShowModal(true);
    };

    const handleOpenEdit = (section) => {
        Swal.fire({
            title: "UPDATE SECTION?",
            html: `Proceed to edit the records of <strong>${section.name}</strong>?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#F4D03F",
            cancelButtonColor: "#2d3436",
            confirmButtonText: "YES, PROCEED!",
            background: "#FFE2AF",
            color: "#000",
            customClass: {
                popup: "card-retro",
                confirmButton: "btn-retro bg-warning border-dark",
                cancelButton: "btn-retro bg-dark border-dark",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                setModalType("edit");
                setSelectedSection(section);
                setShowModal(true);
            }
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        const sectionWord = selectedIds.length > 1 ? "SECTIONS" : "SECTION";

        Swal.fire({
            title: `DELETE ${selectedIds.length} ${sectionWord}?`,
            text: "Sections will be moved to the recycle bin.",
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
                    await axios.post(`/api/sections/bulk-delete`, {
                        ids: selectedIds,
                    });
                    fetchData();
                    Toast.fire({
                        icon: "success",
                        title: "Sections removed successfully.",
                    });
                } catch (error) {
                    Toast.fire({
                        icon: "error",
                        title: "Failed to delete sections.",
                    });
                }
            }
        });
    };

    const handleDelete = (section) => {
        Swal.fire({
            title: "DELETE SECTION?",
            html: `<strong>${section.name}</strong> will be moved to the recycle bin.`,
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
                    await axios.delete(`/api/sections/${section.id}`);
                    fetchData();
                    Toast.fire({
                        icon: "success",
                        title: "Section removed successfully.",
                    });
                } catch (error) {
                    Toast.fire({
                        icon: "error",
                        title: "Failed to delete section.",
                    });
                }
            }
        });
    };

    const handleViewMasterList = async (sectionId) => {
        setShowMasterList(true);
        setLoadingMaster(true);
        setMasterData(null);
        try {
            const res = await axios.get(
                `/api/sections/${sectionId}/masterlist`,
            );
            setMasterData(res.data);
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to load list." });
            setShowMasterList(false);
        } finally {
            setLoadingMaster(false);
        }
    };

    const handleDownloadPDF = async (sectionId) => {
        Toast.fire({ icon: "info", title: "Generating PDF..." });
        try {
            const response = await axios.get(
                `/api/sections/${sectionId}/masterlist/generate-url`,
            );
            window.open(response.data.url, "_blank");
            Toast.fire({ icon: "success", title: "Download Started!" });
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to generate link." });
        }
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
                        SECTION RECORDS
                    </h2>
                    <p className="text-muted small mb-0 font-monospace fw-bold">
                        Organize Classes & Capacity
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
                            NEW SECTION
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
                                <div className="spinner-border spinner-border-sm text-dark"></div>
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
                                    <th
                                        className="ps-4 py-3 border-dark"
                                        style={{ width: "40px" }}
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-check-input border-dark"
                                            checked={
                                                sections.length > 0 &&
                                                selectedIds.length ===
                                                    sections.length
                                            }
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        ID
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Section Name
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Strand
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark text-center">
                                        Grade Level
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark text-center">
                                        Students Enrolled
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
                                            colSpan="9"
                                            className="text-center py-5"
                                        >
                                            <div className="spinner-border border-3 border-dark text-dark"></div>
                                        </td>
                                    </tr>
                                ) : sections.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="9"
                                            className="text-center py-5 fw-bold font-monospace"
                                        >
                                            NO SECTION RECORDS FOUND...
                                        </td>
                                    </tr>
                                ) : (
                                    sections.map((section) => {
                                        const enrolled =
                                            section.enrolled_count || 0;
                                        const capacity = section.capacity || 40;
                                        const isFull = enrolled >= capacity;
                                        const bColor = section.strand
                                            ? getStrandColor(section.strand.id)
                                            : { bg: "#000", text: "#fff" };

                                        return (
                                            <tr
                                                key={section.id}
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
                                                            section.id,
                                                        )}
                                                        onChange={() =>
                                                            handleSelectOne(
                                                                section.id,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td
                                                    className="py-3 font-monospace border-dark text-muted"
                                                    style={{
                                                        maxWidth: "80px",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                    title={section.id}
                                                >
                                                    {section.id}
                                                </td>
                                                <td className="py-3 border-dark">
                                                    <span
                                                        className="badge rounded-0 border border-dark px-2 py-1 fs-6 font-monospace text-dark bg-primary text-white"
                                                        style={{
                                                            boxShadow:
                                                                "2px 2px 0 #000",
                                                        }}
                                                        onMouseEnter={(e) =>
                                                            (e.currentTarget.style.transform =
                                                                "translate(-1px, -1px)")
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.currentTarget.style.transform =
                                                                "translate(0, 0)")
                                                        }
                                                    >
                                                        {section.name}
                                                    </span>
                                                </td>
                                                <td className="py-3 border-dark">
                                                    {section.strand && (
                                                        <span
                                                            className="badge rounded-0 border border-dark px-2 py-1 font-monospace"
                                                            style={{
                                                                backgroundColor:
                                                                    bColor.bg,
                                                                color: bColor.text,
                                                                boxShadow:
                                                                    "2px 2px 0 #000",
                                                            }}
                                                            onMouseEnter={(e) =>
                                                                (e.currentTarget.style.transform =
                                                                    "translate(-1px, -1px)")
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.transform =
                                                                    "translate(0, 0)")
                                                            }
                                                        >
                                                            {
                                                                section.strand
                                                                    .code
                                                            }
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 font-monospace border-dark fw-bold text-center">
                                                    G{section.grade_level}
                                                </td>
                                                <td className="py-3 font-monospace border-dark text-center">
                                                    <span
                                                        className={`fw-bold ${isFull ? "text-danger" : "text-success"}`}
                                                    >
                                                        {enrolled} / {capacity}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-monospace border-dark text-muted small">
                                                    {new Date(
                                                        section.created_at,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="py-3 font-monospace border-dark text-muted small">
                                                    {new Date(
                                                        section.updated_at,
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
                                                                    "#00d2d3",
                                                                boxShadow:
                                                                    "2px 2px 0 #000",
                                                            }}
                                                            onClick={() =>
                                                                handleViewMasterList(
                                                                    section.id,
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
                                                            title="Master List"
                                                        >
                                                            <i className="bi bi-list-task text-dark"></i>
                                                        </button>
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
                                                                    section,
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
                                                            title="Edit Section"
                                                        >
                                                            <i className="bi bi-pencil-fill text-dark"></i>
                                                        </button>
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
                                                                    section,
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
                                                            title="Delete Section"
                                                        >
                                                            <i className="bi bi-trash-fill text-white"></i>
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
                    className="card-footer bg-white py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-3"
                    style={{ borderTop: "2px solid black" }}
                >
                    <small className="text-muted font-monospace">
                        Showing Section Records:{" "}
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

            <SectionMasterlistModal
                show={showMasterList}
                onClose={() => setShowMasterList(false)}
                loading={loadingMaster}
                masterData={masterData}
                onDownloadPDF={handleDownloadPDF}
            />

            <SectionModal
                show={showModal}
                type={modalType}
                selectedSection={selectedSection}
                strands={strands}
                onClose={() => setShowModal(false)}
                onSuccess={fetchData}
                apiPrefix="/api"
            />
        </div>
    );
}
