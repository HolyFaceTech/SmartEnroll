import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Toast from "../../utils/toast";
import StudentModal from "../../components/StudentModal";
import ImportStudentModal from "../../components/ImportStudentModal";
import CORModal from "../../components/CORModal";

// 1. Helper for Strand and Section Colors (9 Retro Colors)
const getBadgeColor = (id) => {
    if (!id) return { bg: "#f8f9fa", text: "#000" }; // Default kung walang id
    const palettes = [
        { bg: "#FF9F43", text: "#000" }, // Orange
        { bg: "#1DD1A1", text: "#000" }, // Mint Green
        { bg: "#5F27CD", text: "#FFF" }, // Purple
        { bg: "#FF6B6B", text: "#FFF" }, // Coral/Red
        { bg: "#54A0FF", text: "#000" }, // Light Blue
        { bg: "#F368E0", text: "#FFF" }, // Pink
        { bg: "#00D2D3", text: "#000" }, // Cyan
        { bg: "#FECA57", text: "#000" }, // Yellow
        { bg: "#8395A7", text: "#FFF" }, // Gray
    ];
    let num =
        typeof id === "string"
            ? id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
            : id;
    return palettes[num % palettes.length];
};

// 2. Helper for Status Colors
const getStatusColor = (status) => {
    const s = status ? status.toLowerCase() : "";
    switch (s) {
        case "pending":
            return { bg: "#FECA57", text: "#000" }; // Yellow
        case "enrolled":
            return { bg: "#1DD1A1", text: "#000" }; // Mint Green
        case "passed":
            return { bg: "#54A0FF", text: "#000" }; // Light Blue
        case "dropout":
            return { bg: "#FF6B6B", text: "#FFF" }; // Coral/Red
        case "graduate":
            return { bg: "#5F27CD", text: "#FFF" }; // Purple
        case "released":
            return { bg: "#8395A7", text: "#FFF" }; // Gray
        default:
            return { bg: "#fff", text: "#000" }; // Default
    }
};

export default function Students() {
    const [students, setStudents] = useState([]);
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
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);

    const [showCorModal, setShowCorModal] = useState(false);
    const [corStudent, setCorStudent] = useState(null);

    const [openActionId, setOpenActionId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({
        top: 0,
        right: 0,
        bottom: "auto",
    });

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(".action-dropdown-container")) {
                setOpenActionId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            const [studRes, strandRes] = await Promise.all([
                axios.get(`/api/students`, {
                    params: {
                        page: currentPage,
                        limit: itemsPerPage,
                        search: debouncedSearch,
                    },
                }),
                axios.get("/api/strands", { params: { limit: 100 } }),
            ]);
            setStudents(studRes.data.data);
            setTotalItems(studRes.data.total);
            setTotalPages(studRes.data.last_page);
            setStrands(
                strandRes.data.data
                    ? strandRes.data.data
                    : strandRes.data || [],
            );
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

    const handleSelectAll = (e) =>
        setSelectedIds(e.target.checked ? students.map((s) => s.id) : []);
    const handleSelectOne = (id) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );

    const handleOpenCreate = () => {
        setModalType("create");
        setSelectedStudent(null);
        setShowModal(true);
    };

    const handleOpenEdit = (student) => {
        Swal.fire({
            title: "EDIT RECORD?",
            html: `Are you sure you want to update the record for <strong>${student.first_name} ${student.last_name}</strong>?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#F4D03F",
            cancelButtonColor: "#2d3436",
            confirmButtonText: "YES, PROCEED!",
            cancelButtonText: "CANCEL",
            background: "#FFE2AF",
            color: "#000",
            customClass: {
                popup: "card-retro",
                confirmButton: "btn-retro bg-warning border-dark",
                cancelButton: "btn-retro bg-dark border-dark",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                // Bubukas lang ang StudentModal kapag pinindot ang YES
                setModalType("edit");
                setSelectedStudent(student);
                setShowModal(true);
            }
        });
    };

    const handleSuccessEnroll = (studentData) => {
        fetchData(); // Refresh list background
        setCorStudent(studentData);
        setShowCorModal(true);
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        Swal.fire({
            title: `DELETE ${selectedIds.length} STUDENTS?`,
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "YES, DELETE!",
            background: "#FFE2AF",
            color: "#000",
            buttonsStyling: false,
            customClass: {
                popup: "card-retro",
                confirmButton:
                    "btn btn-danger btn-retro border-dark text-white fw-bold me-3",
                cancelButton:
                    "btn btn-dark btn-retro border-dark text-white fw-bold",
            },
            didOpen: () =>
                Swal.getConfirmButton().style.setProperty(
                    "background-color",
                    "#F96E5B",
                    "important",
                ),
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.post(`/api/students/bulk-delete`, {
                        ids: selectedIds,
                    });
                    fetchData();
                    Toast.fire({ icon: "success", title: "Records deleted." });
                } catch (error) {
                    Toast.fire({ icon: "error", title: "Failed to delete." });
                }
            }
        });
    };

    const handleDelete = (student) => {
        Swal.fire({
            title: "DELETE STUDENT?",
            html: `You are about to delete <strong>${student.last_name}</strong>.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "YES, DELETE!",
            background: "#FFE2AF",
            color: "#000",
            buttonsStyling: false,
            customClass: {
                popup: "card-retro",
                confirmButton:
                    "btn btn-danger btn-retro border-dark text-white fw-bold me-3",
                cancelButton:
                    "btn btn-dark btn-retro border-dark text-white fw-bold",
            },
            didOpen: () =>
                Swal.getConfirmButton().style.setProperty(
                    "background-color",
                    "#F96E5B",
                    "important",
                ),
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`/api/students/${student.id}`);
                    fetchData();
                    Toast.fire({ icon: "success", title: "Record deleted." });
                } catch (error) {
                    Toast.fire({ icon: "error", title: "Failed to delete." });
                }
            }
        });
    };

    const toggleDropdown = (e, id) => {
        if (openActionId === id) {
            setOpenActionId(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        // Check if there is enough space at the bottom; if not, open upwards
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 280) {
            setDropdownPos({
                top: "auto",
                bottom: window.innerHeight - rect.top,
                right: window.innerWidth - rect.right,
            });
        } else {
            setDropdownPos({
                top: rect.bottom,
                bottom: "auto",
                right: window.innerWidth - rect.right,
            });
        }
        setOpenActionId(id);
    };

    // CHANGE STATUS FUNCTION
    const handleChangeStatus = (student, newStatus) => {
        setOpenActionId(null); // Close dropdown
        Swal.fire({
            title: "UPDATE STATUS?",
            html: `Change ${student.first_name}'s status to <strong>${newStatus.toUpperCase()}</strong>?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "YES, UPDATE!",
            background: "#FFE2AF",
            color: "#000",
            buttonsStyling: false,
            customClass: {
                popup: "card-retro",
                confirmButton:
                    "btn btn-success btn-retro border-dark text-dark fw-bold me-3",
                cancelButton:
                    "btn btn-dark btn-retro border-dark text-white fw-bold",
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.put(`/api/students/${student.id}/status`, {
                        status: newStatus,
                    });
                    fetchData();
                    Toast.fire({
                        icon: "success",
                        title: "Status updated successfully!",
                    });
                } catch (error) {
                    Toast.fire({
                        icon: "error",
                        title:
                            error.response?.data?.message ||
                            "Failed to update status.",
                    });
                }
            }
        });
    };

    // Helper functions
    const renderValue = (val) =>
        val !== null && val !== undefined && val !== "" ? val : "-";

    const formatDateOnly = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString();
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleString();
    };

    const calculateAge = (dob) => {
        if (!dob) return "-";
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Helper to format JSON correctly (For Requirements and Fees)
    const formatJSONField = (data) => {
        if (!data) return "-";
        try {
            const parsed = typeof data === "string" ? JSON.parse(data) : data;

            if (Array.isArray(parsed)) {
                return parsed.length > 0 ? parsed.join(", ") : "-";
            } else if (typeof parsed === "object" && parsed !== null) {
                const formattedEntries = Object.entries(parsed)
                    .map(([key, value]) => {
                        if (value === true || value === "true") return key;
                        if (
                            value === false ||
                            value === "false" ||
                            value === null
                        )
                            return null;
                        return `${key}: ${value}`;
                    })
                    .filter(Boolean);

                return formattedEntries.length > 0
                    ? formattedEntries.join(", ")
                    : "-";
            }
            return String(parsed);
        } catch (error) {
            return String(data);
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
                        STUDENT MASTER RECORDS
                    </h2>
                    <p className="text-muted small mb-0 font-monospace fw-bold">
                        Manage all student applications and profiles
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-retro px-4 py-2 bg-success text-white border-dark"
                        onClick={() => setShowImportModal(true)}
                    >
                        <i className="bi bi-filetype-csv text-white"></i>{" "}
                        <span className="d-none d-sm-inline ms-2">
                            IMPORT CSV
                        </span>
                    </button>
                    {selectedIds.length > 0 && (
                        <button
                            className="btn btn-retro px-4 py-2 bg-danger text-white border-dark"
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
                            NEW STUDENT
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
                            className="form-select form-select-sm font-monospace fw-bold border-dark"
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
                        style={{ maxHeight: "650px" }}
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
                                                students.length > 0 &&
                                                selectedIds.length ===
                                                    students.length
                                            }
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        ID
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Student No.
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        LRN
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
                                        Status
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Birth Date
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Age
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Gender
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Place of Birth
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Citizenship
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Civil Status
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Religion
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        2x2 Picture
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        E-Sign
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Home Address
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Provincial Address
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Email
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Contact No.
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Prev. School
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Strand
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Section
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Modality
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark text-center">
                                        Grade Level
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark text-center">
                                        Gen. Avg
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark text-center">
                                        Term
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        School Year
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Employer Name
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Employer Contact
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Father Name
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Father Occupation
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Father Contact
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Mother Name
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Mother Occupation
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Mother Contact
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Guardian Name
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Guardian Occ.
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Guardian Contact
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Requirements
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Prev. Status
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Released By
                                    </th>
                                    <th className="py-3 font-monospace text-dark border-dark">
                                        Released At
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
                                            colSpan="49"
                                            className="text-center py-5"
                                        >
                                            <div className="spinner-border border-3 border-dark text-dark"></div>
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="49"
                                            className="text-center py-5 fw-bold font-monospace"
                                        >
                                            NO STUDENT RECORDS FOUND...
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((s) => {
                                        const statusStyle = getStatusColor(
                                            s.status,
                                        );
                                        const strandStyle = s.strand?.id
                                            ? getBadgeColor(s.strand.id)
                                            : { bg: "#f8f9fa", text: "#000" };

                                        return (
                                            <tr
                                                key={s.id}
                                                style={{
                                                    borderBottom:
                                                        "1px solid #000",
                                                }}
                                            >
                                                <td className="ps-4 border-dark">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input border-dark"
                                                        checked={selectedIds.includes(
                                                            s.id,
                                                        )}
                                                        onChange={() =>
                                                            handleSelectOne(
                                                                s.id,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td
                                                    className="font-monospace text-muted small border-dark"
                                                    title={s.id}
                                                >
                                                    {s.id.substring(0, 8)}...
                                                </td>
                                                <td className="fw-bold text-dark font-monospace border-dark">
                                                    {renderValue(
                                                        s.student_number,
                                                    )}
                                                </td>
                                                <td className="fw-bold text-primary font-monospace border-dark">
                                                    {renderValue(s.lrn)}
                                                </td>
                                                <td className="fw-bold border-dark">
                                                    {renderValue(s.first_name)}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(s.middle_name)}
                                                </td>
                                                <td className="fw-bold border-dark">
                                                    {renderValue(s.last_name)}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(s.suffix)}
                                                </td>
                                                <td className="border-dark">
                                                    <span
                                                        className="badge border border-dark rounded-0 px-2 py-1 font-monospace"
                                                        style={{
                                                            backgroundColor:
                                                                statusStyle.bg,
                                                            color: statusStyle.text,
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
                                                        {renderValue(
                                                            s.status,
                                                        ).toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="border-dark font-monospace">
                                                    {formatDateOnly(
                                                        s.date_of_birth,
                                                    )}
                                                </td>
                                                <td className="border-dark font-monospace">
                                                    {calculateAge(
                                                        s.date_of_birth,
                                                    )}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(s.gender)}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(
                                                        s.place_of_birth,
                                                    )}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(s.citizenship)}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(
                                                        s.civil_status,
                                                    )}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(s.religion)}
                                                </td>
                                                {/* 2X2 PICTURE COLUMN */}
                                                <td
                                                    className="border-dark font-monospace"
                                                    style={{
                                                        maxWidth: "150px",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {s["2x2_picture"] ? (
                                                        <a
                                                            href={`/storage/${s["2x2_picture"]}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary text-decoration-underline fw-bold small"
                                                            title="View 2x2 Picture"
                                                        >
                                                            {s["2x2_picture"]
                                                                .split("/")
                                                                .pop()}
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted">
                                                            -
                                                        </span>
                                                    )}
                                                </td>

                                                {/* E-SIGN COLUMN */}
                                                <td
                                                    className="border-dark font-monospace"
                                                    style={{
                                                        maxWidth: "150px",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {s.e_sign ? (
                                                        <a
                                                            href={`/storage/${s.e_sign}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary text-decoration-underline fw-bold small"
                                                            title="View E-Signature"
                                                        >
                                                            {s.e_sign
                                                                .split("/")
                                                                .pop()}
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    className="border-dark"
                                                    style={{
                                                        maxWidth: "200px",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                    title={s.home_address}
                                                >
                                                    {renderValue(
                                                        s.home_address,
                                                    )}
                                                </td>
                                                <td
                                                    className="border-dark"
                                                    style={{
                                                        maxWidth: "200px",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                    title={s.provincial_address}
                                                >
                                                    {renderValue(
                                                        s.provincial_address,
                                                    )}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(s.email)}
                                                </td>
                                                <td className="border-dark fw-bold">
                                                    {renderValue(
                                                        s.contact_number,
                                                    )}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(
                                                        s.current_school_attended,
                                                    )}
                                                </td>
                                                <td className="border-dark">
                                                    {s.strand?.code ? (
                                                        <span
                                                            className="badge border border-dark rounded-0 px-2 py-1 font-monospace"
                                                            style={{
                                                                backgroundColor:
                                                                    strandStyle.bg,
                                                                color: strandStyle.text,
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
                                                            {s.strand.code}
                                                        </span>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                                <td className="border-dark">
                                                    {s.section?.name ? (
                                                        <span
                                                            className="badge border border-dark rounded-0 px-2 py-1 font-monospace"
                                                            style={{
                                                                backgroundColor:
                                                                    strandStyle.bg,
                                                                color: strandStyle.text,
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
                                                            {s.section.name.toUpperCase()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted fst-italic">
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="border-dark">
                                                    {s.learning_modality ? (
                                                        <span
                                                            className={`badge border border-dark rounded-0 px-2 py-1 font-monospace ${
                                                                s.learning_modality
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        "modular",
                                                                    )
                                                                    ? "bg-danger text-white"
                                                                    : s.learning_modality
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                "face",
                                                                            )
                                                                      ? "bg-primary text-white"
                                                                      : "bg-light text-dark"
                                                            }`}
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
                                                            {s.learning_modality.toUpperCase()}
                                                        </span>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                                <td className="border-dark fw-bold text-center">
                                                    {renderValue(s.grade_level)}
                                                </td>
                                                <td className="border-dark font-monospace text-center fw-bold text-success">
                                                    {renderValue(
                                                        s.general_average,
                                                    )}
                                                </td>
                                                <td className="border-dark text-center">
                                                    {renderValue(s.term)}
                                                </td>
                                                <td className="border-dark font-monospace">
                                                    {renderValue(s.school_year)}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(
                                                        s.employer_name,
                                                    )}
                                                </td>
                                                <td className="border-dark font-monospace">
                                                    {renderValue(
                                                        s.employer_contact,
                                                    )}
                                                </td>
                                                <td className="border-dark fw-bold">
                                                    {renderValue(s.father_name)}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(
                                                        s.father_occupation,
                                                    )}
                                                </td>
                                                <td className="border-dark fw-bold">
                                                    {renderValue(
                                                        s.father_contact,
                                                    )}
                                                </td>
                                                <td className="border-dark fw-bold">
                                                    {renderValue(s.mother_name)}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(
                                                        s.mother_occupation,
                                                    )}
                                                </td>
                                                <td className="border-dark fw-bold">
                                                    {renderValue(
                                                        s.mother_contact,
                                                    )}
                                                </td>
                                                <td className="border-dark fw-bold">
                                                    {renderValue(
                                                        s.guardian_name,
                                                    )}
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(
                                                        s.guardian_occupation,
                                                    )}
                                                </td>
                                                <td className="border-dark fw-bold">
                                                    {renderValue(
                                                        s.guardian_contact,
                                                    )}
                                                </td>
                                                <td
                                                    className="border-dark small"
                                                    style={{
                                                        maxWidth: "150px",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                    title={formatJSONField(
                                                        s.requirements,
                                                    )}
                                                >
                                                    {formatJSONField(
                                                        s.requirements,
                                                    )}
                                                </td>
                                                <td className="border-dark">
                                                    <span
                                                        className="badge border border-dark rounded-0 px-2 py-1 font-monospace"
                                                        style={{
                                                            backgroundColor:
                                                                statusStyle.bg,
                                                            color: statusStyle.text,
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
                                                        {renderValue(
                                                            s.previous_status,
                                                        ).toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="border-dark">
                                                    {renderValue(s.released_by)}
                                                </td>
                                                <td className="border-dark font-monospace small">
                                                    {formatDateTime(
                                                        s.released_at,
                                                    )}
                                                </td>
                                                <td className="border-dark font-monospace small">
                                                    {formatDateTime(
                                                        s.created_at,
                                                    )}
                                                </td>
                                                <td className="border-dark font-monospace small">
                                                    {formatDateTime(
                                                        s.updated_at,
                                                    )}
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
                                                                    s,
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
                                                            title="Edit student"
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
                                                                handleDelete(s)
                                                            }
                                                            onMouseEnter={(e) =>
                                                                (e.currentTarget.style.transform =
                                                                    "translate(-1px, -1px)")
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.transform =
                                                                    "translate(0, 0)")
                                                            }
                                                            title="Delete student"
                                                        >
                                                            <i className="bi bi-trash-fill text-white"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm rounded-0 border-2 border-dark fw-bold d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: "32px",
                                                                height: "32px",
                                                                backgroundColor:
                                                                    "#fff",
                                                                boxShadow:
                                                                    "2px 2px 0 #000",
                                                            }}
                                                            onClick={(e) =>
                                                                toggleDropdown(
                                                                    e,
                                                                    s.id,
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
                                                            title="More Actions"
                                                        >
                                                            <i className="bi bi-three-dots-vertical text-dark"></i>
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
                        Showing Student Records:{" "}
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

            {/* --- FIXED DROPDOWN MENU PARA SA ACTIONS --- */}
            {openActionId && (
                <div
                    className="dropdown-menu show border-2 border-dark rounded-0 shadow p-0 fade-in action-dropdown-container"
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
                        const s = students.find((st) => st.id === openActionId);
                        if (!s) return null;
                        return (
                            <>
                                <div className="bg-light border-bottom border-dark p-2 text-center small fw-bold font-monospace">
                                    STATUS ACTIONS
                                </div>
                                <button
                                    className="dropdown-item font-monospace small fw-bold py-2 text-warning"
                                    onClick={() =>
                                        handleChangeStatus(s, "pending")
                                    }
                                >
                                    <i className="bi bi-hourglass-split me-2"></i>{" "}
                                    Pending
                                </button>
                                <button
                                    className="dropdown-item font-monospace small fw-bold py-2 text-success"
                                    onClick={() =>
                                        handleChangeStatus(s, "passed")
                                    }
                                >
                                    <i className="bi bi-check-circle-fill me-2"></i>{" "}
                                    Passed
                                </button>
                                <button
                                    className="dropdown-item font-monospace small fw-bold py-2 text-danger"
                                    onClick={() =>
                                        handleChangeStatus(s, "failed")
                                    }
                                >
                                    <i className="bi bi-x-circle-fill me-2"></i>{" "}
                                    Failed
                                </button>
                                <button
                                    className="dropdown-item font-monospace small fw-bold py-2 text-info"
                                    onClick={() =>
                                        handleChangeStatus(s, "graduate")
                                    }
                                >
                                    <i className="bi bi-mortarboard-fill me-2"></i>{" "}
                                    Graduate
                                </button>
                                <button
                                    className="dropdown-item font-monospace small fw-bold py-2"
                                    style={{ color: "#FF6B6B" }}
                                    onClick={() =>
                                        handleChangeStatus(s, "dropout")
                                    }
                                >
                                    <i className="bi bi-person-x-fill me-2"></i>{" "}
                                    Dropout
                                </button>
                                <button
                                    className="dropdown-item font-monospace small fw-bold py-2 text-dark"
                                    onClick={() =>
                                        handleChangeStatus(s, "released")
                                    }
                                >
                                    <i className="bi bi-box-arrow-right me-2"></i>{" "}
                                    Released
                                </button>

                                <div className="dropdown-divider border-dark m-0"></div>

                                <button
                                    className="dropdown-item font-monospace small fw-bold py-2"
                                    onClick={() => {
                                        setOpenActionId(null);
                                        setCorStudent(s);
                                        setShowCorModal(true);
                                    }}
                                >
                                    <i className="bi bi-file-earmark-arrow-down-fill me-2"></i>{" "}
                                    Download COR
                                </button>
                                <button
                                    className="dropdown-item font-monospace small fw-bold py-2 text-secondary"
                                    onClick={() =>
                                        handleChangeStatus(s, "reset")
                                    }
                                >
                                    <i className="bi bi-arrow-counterclockwise me-2"></i>{" "}
                                    Reset Status
                                </button>
                            </>
                        );
                    })()}
                </div>
            )}

            <StudentModal
                show={showModal}
                type={modalType}
                selectedStudent={selectedStudent}
                strands={strands}
                onClose={() => setShowModal(false)}
                onSuccess={fetchData}
                onSuccessEnroll={handleSuccessEnroll}
                apiPrefix="/api"
            />
            <ImportStudentModal
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={fetchData}
                apiPrefix="/api"
            />

            <CORModal
                show={showCorModal}
                student={corStudent}
                onClose={() => setShowCorModal(false)}
                onSuccess={fetchData}
                apiPrefix="/api"
            />
        </div>
    );
}
