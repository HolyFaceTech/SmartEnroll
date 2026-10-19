import React, { useState, useEffect } from "react";
import axios from "axios";
import Toast from "../utils/toast";
import Loading from "../utils/Loading";
import StudentConfirmation from "./StudentConfirmation";

export default function CORModal({
    show,
    student,
    onClose,
    onSuccess,
    apiPrefix = "/api",
}) {
    if (!show || !student) return null;

    const [fetchingData, setFetchingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ show: false });
    const [photoUrl, setPhotoUrl] = useState(null);

    const [formData, setFormData] = useState({
        info: {
            name: "",
            lrn: "",
            student_number: "",
            strand: "",
            grade_level: "",
            section_name: "",
            school_year: "",
            term: "",
        },
        category: "",
        course: "",
        subjects: [],
        fees: [
            { description: "TUITION FEE", amount: 5000 },
            { description: "MISCELLANEOUS FEE", amount: 1500 },
            { description: "MODULES / BOOKS", amount: 2000 },
        ],
        signatories: { adviser: "", registrar: "", finance: "" },
        terms: { parent_name: "", student_name: "" },
        or_number: "",
    });

    const isGrade12ThirdTerm =
        String(formData.info.grade_level).includes("12") &&
        String(formData.info.term).toLowerCase().includes("3");

    const previewDateTime = new Date().toLocaleString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    useEffect(() => {
        if (student) {
            setFetchingData(true);
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            axios
                .get(`${apiPrefix}/students/${student.id}/cor-data`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    const fetchedStudent = res.data.student;

                    setPhotoUrl(res.data.photo_url);
                    const studentName =
                        `${fetchedStudent.first_name} ${fetchedStudent.middle_name || ""} ${fetchedStudent.last_name} ${fetchedStudent.suffix || ""}`
                            .trim()
                            .toUpperCase();

                    // FORMAT: HF-YYGTNNNNN
                    const currentYearStr = new Date()
                        .getFullYear()
                        .toString()
                        .slice(-2);
                    const gradeStr =
                        String(
                            fetchedStudent.academic?.grade_level || "",
                        ).replace(/\D/g, "") || "0";
                    const termStr =
                        String(fetchedStudent.academic?.term || "1").replace(
                            /\D/g,
                            "",
                        ) || "1";

                    let stNumStr = "00000";
                    if (fetchedStudent.student_number) {
                        const parsed = fetchedStudent.student_number.replace(
                            /\D/g,
                            "",
                        );
                        stNumStr = parsed.slice(-5).padStart(5, "0");
                    } else {
                        stNumStr = Math.floor(
                            10000 + Math.random() * 90000,
                        ).toString();
                    }
                    const generatedAssessmentNo = `HF-${currentYearStr}${gradeStr}${termStr}${stNumStr}`;

                    setFormData({
                        info: {
                            name: studentName,
                            lrn: fetchedStudent.lrn,
                            student_number:
                                fetchedStudent.student_number || "TBA",
                            strand:
                                fetchedStudent.academic?.strand?.code || "N/A",
                            grade_level:
                                fetchedStudent.academic?.grade_level || "N/A",
                            section_name:
                                fetchedStudent.academic?.section?.name || "TBA",
                            school_year:
                                fetchedStudent.academic?.school_year ||
                                "2026-2027",
                            term: fetchedStudent.academic?.term || "1st",
                        },
                        category: "",
                        course: "",
                        subjects: res.data.suggested_subjects.map((s) => ({
                            code: s.code,
                            desc: s.description,
                            sched: "",
                            teacher: "",
                        })),
                        fees: [
                            { description: "TUITION FEE", amount: 5000 },
                            { description: "MISCELLANEOUS FEE", amount: 1500 },
                            { description: "MODULES / BOOKS", amount: 2000 },
                        ],
                        signatories: {
                            adviser:
                                fetchedStudent.academic?.section
                                    ?.adviser_name || "",
                            registrar: "",
                            finance: "",
                        },
                        terms: {
                            parent_name:
                                fetchedStudent.family?.guardian_name?.toUpperCase() ||
                                "",
                            student_name: studentName,
                        },
                        or_number: generatedAssessmentNo,
                    });
                })
                .catch((error) =>
                    Toast.fire({
                        icon: "error",
                        title:
                            error.response?.data?.message ||
                            "Failed to load data.",
                    }),
                )
                .finally(() => setFetchingData(false));
        }
    }, [student, apiPrefix]);

    const handleSubjectChange = (index, field, value) => {
        const updatedSubjects = [...formData.subjects];
        updatedSubjects[index][field] = value;
        setFormData((prev) => ({ ...prev, subjects: updatedSubjects }));
    };

    const addRow = () => {
        const newSubject = { code: "", desc: "", sched: "", teacher: "" };
        setFormData((prev) => ({
            ...prev,
            subjects: [...prev.subjects, newSubject],
        }));
    };

    const removeRow = (index) => {
        const updatedSubjects = [...formData.subjects];
        updatedSubjects.splice(index, 1);
        setFormData((prev) => ({ ...prev, subjects: updatedSubjects }));
    };

    const handleFeeChange = (index, field, value) => {
        const updatedFees = [...formData.fees];
        updatedFees[index][field] =
            field === "amount" ? parseFloat(value) || 0 : value;
        setFormData((prev) => ({ ...prev, fees: updatedFees }));
    };

    const addFeeRow = () => {
        const newFee = { description: "", amount: 0 };
        setFormData((prev) => ({ ...prev, fees: [...prev.fees, newFee] }));
    };

    const removeFeeRow = (index) => {
        const updatedFees = [...formData.fees];
        updatedFees.splice(index, 1);
        setFormData((prev) => ({ ...prev, fees: updatedFees }));
    };

    const calculateTotalFees = () => {
        return formData.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    };

    const confirmDownload = () => {
        setConfirmConfig({
            show: true,
            title: "PRINT OFFICIAL COR?",
            message:
                "Are you sure you want to finalize and print this Certificate of Registration?",
            confirmText: "YES, PRINT IT",
            confirmColor: "#74b9ff",
            iconClass: "bi-printer-fill",
        });
    };

    const executeDownload = async () => {
        setConfirmConfig({ show: false });
        setSubmitting(true);
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");

        try {
            const response = await axios.post(
                `${apiPrefix}/cor/generate-url`,
                {
                    ...formData,
                    category: isGrade12ThirdTerm ? formData.category : "",
                    course: isGrade12ThirdTerm ? formData.course : "",
                    total_fees: calculateTotalFees(),
                    printed_by: "Admin",
                },
                { headers: { Authorization: `Bearer ${token}` } },
            );

            window.open(response.data.url, "_blank");
            Toast.fire({
                icon: "success",
                title: "COR Generated Successfully!",
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: error.response?.data?.message || "Action Failed.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1045 }}
            ></div>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ zIndex: 1050, overflowY: "auto" }}
            >
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content card-retro border-2 border-dark shadow">
                        <div
                            className="modal-header border-bottom border-dark text-dark"
                            style={{ backgroundColor: "#74b9ff" }}
                        >
                            <h5 className="modal-title fw-bold font-monospace">
                                <i className="bi bi-file-earmark-text-fill me-2"></i>
                                MANAGE CERTIFICATE OF REGISTRATION
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                            ></button>
                        </div>

                        <div className="modal-body bg-light p-4 font-monospace">
                            {fetchingData ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-dark"></div>
                                </div>
                            ) : (
                                <div>
                                    <div className="card border-2 border-dark mb-4 shadow-sm">
                                        <div className="card-body bg-white d-flex justify-content-between align-items-center p-4">
                                            <div
                                                className="text-center"
                                                style={{ width: "1.5in" }}
                                            >
                                                <img
                                                    src="/images/logo.png"
                                                    alt="School Logo"
                                                    style={{
                                                        width: "1.5in",
                                                        height: "auto",
                                                    }}
                                                    onError={(e) =>
                                                        (e.target.style.display =
                                                            "none")
                                                    }
                                                />
                                            </div>
                                            <div className="text-center flex-grow-1 px-3">
                                                <h4
                                                    className="fw-bold mb-1"
                                                    style={{
                                                        fontFamily:
                                                            "'Times New Roman', Times, serif",
                                                    }}
                                                >
                                                    HOLY FACE OF JESUS LYCEUM OF
                                                    SAN JOSE INC.
                                                </h4>
                                                <p
                                                    className="mb-0 fst-italic"
                                                    style={{ fontSize: "12px" }}
                                                >
                                                    BLOCK 5 LOT 28-34 VALENTINO
                                                    VILLAGE, SAN JOSE,
                                                    RODRIGUEZ, RIZAL
                                                </p>
                                                <p
                                                    className="mb-0 fst-italic"
                                                    style={{ fontSize: "12px" }}
                                                >
                                                    Contact No.: 0924-274-0388
                                                </p>
                                                <h5
                                                    className="fw-bold mt-3 text-decoration-underline"
                                                    style={{
                                                        letterSpacing: "1px",
                                                    }}
                                                >
                                                    CERTIFICATE OF REGISTRATION
                                                </h5>
                                            </div>
                                            <div
                                                className="text-end"
                                                style={{ width: "1.5in" }}
                                            >
                                                <div
                                                    className="border border-dark border-2 d-flex align-items-center justify-content-center text-center text-muted fw-bold ms-auto bg-light"
                                                    style={{
                                                        width: "1.5in",
                                                        height: "1.5in",
                                                        overflow: "hidden",
                                                        fontSize: "10px",
                                                    }}
                                                >
                                                    {photoUrl ? (
                                                        <img
                                                            src={photoUrl}
                                                            alt="2x2"
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="w-100 text-center">
                                                            2x2 PHOTO
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card border-2 border-dark mb-4 shadow-sm">
                                        <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                            <i className="bi bi-person-lines-fill me-2"></i>{" "}
                                            STUDENT INFORMATION
                                        </div>
                                        <div className="card-body bg-white row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold font-monospace">
                                                    STUDENT NAME:
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control border-dark bg-light text-muted fw-bold"
                                                    value={formData.info.name}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold font-monospace">
                                                    STRAND:
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control border-dark bg-light text-muted fw-bold text-uppercase"
                                                    value={formData.info.strand}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold font-monospace">
                                                    LRN:
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control border-dark bg-light text-muted fw-bold"
                                                    value={formData.info.lrn}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold font-monospace">
                                                    SCHOOL YEAR & TERM:
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control border-dark bg-light text-muted fw-bold text-uppercase"
                                                    value={`${formData.info.school_year} | ${formData.info.term}`}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold font-monospace">
                                                    STUDENT NO.:
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control border-dark bg-light text-muted fw-bold text-uppercase"
                                                    value={
                                                        formData.info
                                                            .student_number
                                                    }
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold font-monospace">
                                                    GRADE & SECTION:
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control border-dark bg-light text-muted fw-bold text-uppercase"
                                                    value={`${formData.info.grade_level} - ${formData.info.section_name}`}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card border-2 border-dark mb-4 shadow-sm">
                                        <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace d-flex justify-content-between align-items-center">
                                            <span>
                                                <i className="bi bi-journal-text me-2"></i>{" "}
                                                SUBJECT LOAD
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-dark fw-bold font-monospace btn-press-retro border-2 border-dark rounded-0"
                                                onClick={addRow}
                                            >
                                                <i className="bi bi-plus-lg me-1"></i>{" "}
                                                ADD ROW
                                            </button>
                                        </div>
                                        <div className="card-body bg-white p-0">
                                            <div className="table-responsive">
                                                <table className="table table-bordered align-middle mb-0 border-dark">
                                                    <thead className="table-secondary text-center small border-dark">
                                                        <tr>
                                                            <th
                                                                width="15%"
                                                                className="py-2 border-dark"
                                                            >
                                                                CODE
                                                            </th>
                                                            <th
                                                                width="40%"
                                                                className="py-2 border-dark"
                                                            >
                                                                DESCRIPTION
                                                            </th>
                                                            <th
                                                                width="20%"
                                                                className="py-2 border-dark"
                                                            >
                                                                SCHEDULE
                                                            </th>
                                                            <th
                                                                width="20%"
                                                                className="py-2 border-dark"
                                                            >
                                                                INSTRUCTOR
                                                            </th>
                                                            <th
                                                                width="5%"
                                                                className="py-2 border-dark"
                                                            >
                                                                ACTION
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {formData.subjects.map(
                                                            (sub, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="p-1 border-dark">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control border-0 rounded-0 font-monospace text-center fw-bold bg-transparent"
                                                                            placeholder="e.g. ENG101"
                                                                            value={
                                                                                sub.code
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                handleSubjectChange(
                                                                                    idx,
                                                                                    "code",
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td className="p-1 border-dark">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control border-0 rounded-0 font-monospace fw-bold bg-transparent"
                                                                            placeholder="Subject Description"
                                                                            value={
                                                                                sub.desc
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                handleSubjectChange(
                                                                                    idx,
                                                                                    "desc",
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td className="p-1 border-dark">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control border-0 rounded-0 font-monospace text-center fw-bold bg-transparent"
                                                                            placeholder="e.g. M-W 8AM"
                                                                            value={
                                                                                sub.sched
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                handleSubjectChange(
                                                                                    idx,
                                                                                    "sched",
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td className="p-1 border-dark">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control border-0 rounded-0 font-monospace text-center fw-bold bg-transparent"
                                                                            placeholder="Teacher Name"
                                                                            value={
                                                                                sub.teacher
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                handleSubjectChange(
                                                                                    idx,
                                                                                    "teacher",
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td className="text-center p-1 bg-light border-dark">
                                                                        <button
                                                                            className="btn btn-sm border border-dark border-2 fw-bold btn-press-retro ms-2"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    "#F96E5B",
                                                                            }}
                                                                            onClick={() =>
                                                                                removeRow(
                                                                                    idx,
                                                                                )
                                                                            }
                                                                            title="Remove row"
                                                                        >
                                                                            <i className="bi bi-trash text-white"></i>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row g-4 mb-4">
                                        <div className="col-md-6">
                                            <div className="card border-2 border-dark h-100 shadow-sm">
                                                <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace d-flex justify-content-between align-items-center">
                                                    <span>
                                                        <i className="bi bi-cash-coin me-2"></i>{" "}
                                                        ASSESSMENT OF FEES
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-secondary fw-bold font-monospace border-dark border-2 rounded-0 btn-press-retro"
                                                        onClick={addFeeRow}
                                                    >
                                                        <i className="bi bi-plus-lg me-1"></i>{" "}
                                                        ADD FEE
                                                    </button>
                                                </div>
                                                <div className="card-body bg-white p-3 d-flex flex-column">
                                                    <div>
                                                        {formData.fees.map(
                                                            (fee, idx) => (
                                                                <div
                                                                    className="d-flex align-items-center mb-2 gap-2"
                                                                    key={idx}
                                                                >
                                                                    <button
                                                                        className="btn btn-sm border border-dark border-2 fw-bold btn-press-retro ms-2"
                                                                        style={{
                                                                            backgroundColor:
                                                                                "#F96E5B",
                                                                        }}
                                                                        onClick={() =>
                                                                            removeFeeRow(
                                                                                idx,
                                                                            )
                                                                        }
                                                                    >
                                                                        <i className="bi bi-trash text-white"></i>
                                                                    </button>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control border-dark font-monospace text-uppercase fw-bold"
                                                                        value={
                                                                            fee.description
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleFeeChange(
                                                                                idx,
                                                                                "description",
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder="Fee Description"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        className="form-control border-dark font-monospace text-end fw-bold"
                                                                        style={{
                                                                            width: "130px",
                                                                        }}
                                                                        value={
                                                                            fee.amount
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleFeeChange(
                                                                                idx,
                                                                                "amount",
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            ),
                                                        )}
                                                        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-dark border-2 fw-bold mb-4">
                                                            <span>
                                                                TOTAL
                                                                ASSESSMENT:
                                                            </span>
                                                            <span className="text-danger fs-5 border border-dark px-3 py-1 bg-light">
                                                                PHP{" "}
                                                                {calculateTotalFees().toLocaleString(
                                                                    undefined,
                                                                    {
                                                                        minimumFractionDigits: 2,
                                                                    },
                                                                )}
                                                            </span>
                                                        </div>

                                                        <label className="form-label small fw-bold font-monospace text-danger">
                                                            ASSESSMENT NO.
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control border-dark text-danger fw-bold fs-5 mb-1 text-center"
                                                            value={
                                                                formData.or_number
                                                            }
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    or_number:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="Enter Assessment Number"
                                                        />
                                                        <div
                                                            className="text-muted fst-italic text-center mb-2"
                                                            style={{
                                                                fontSize:
                                                                    "10px",
                                                            }}
                                                        >
                                                            This is a
                                                            registration and
                                                            assessment form
                                                            only, not an
                                                            official receipt.
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto pt-5">
                                                        <input
                                                            type="text"
                                                            className="form-control border-dark text-uppercase fw-bold text-center"
                                                            value={
                                                                formData
                                                                    .signatories
                                                                    .finance
                                                            }
                                                            onChange={(e) =>
                                                                setFormData(
                                                                    (p) => ({
                                                                        ...p,
                                                                        signatories:
                                                                            {
                                                                                ...p.signatories,
                                                                                finance:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="Enter Finance Officer Name"
                                                        />
                                                        <label className="form-label small fw-bold text-center font-monospace w-100">
                                                            FINANCE OFFICER
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="card border-2 border-dark h-100 shadow-sm">
                                                <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                                    <i className="bi bi-award-fill me-2"></i>{" "}
                                                    ACADEMIC SIGNATORIES
                                                </div>
                                                <div className="card-body bg-white text-center d-flex flex-column p-3">
                                                    <div className="text-start mt-4">
                                                        <input
                                                            type="text"
                                                            className="form-control border-dark text-uppercase text-center mb-2 fw-bold"
                                                            value={
                                                                formData
                                                                    .signatories
                                                                    .adviser
                                                            }
                                                            onChange={(e) =>
                                                                setFormData(
                                                                    (p) => ({
                                                                        ...p,
                                                                        signatories:
                                                                            {
                                                                                ...p.signatories,
                                                                                adviser:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="Enter Class Adviser Name"
                                                        />
                                                        <label className="form-label small fw-bold text-center font-monospace w-100">
                                                            CLASS ADVISER
                                                        </label>
                                                    </div>

                                                    <div
                                                        className="flex-grow-1 d-flex justify-content-center align-items-center my-3 p-2"
                                                        style={{
                                                            minHeight: "120px",
                                                        }}
                                                    >
                                                        <span
                                                            className="fw-bold text-uppercase"
                                                            style={{
                                                                fontSize:
                                                                    "1.75rem",
                                                                opacity: 0.15,
                                                                fontFamily:
                                                                    "'Times New Roman', serif",
                                                            }}
                                                        >
                                                            Holy Face Sealed
                                                        </span>
                                                    </div>

                                                    <div className="text-start mt-auto pt-5">
                                                        <input
                                                            type="text"
                                                            className="form-control border-dark text-uppercase fw-bold text-center"
                                                            value={
                                                                formData
                                                                    .signatories
                                                                    .registrar
                                                            }
                                                            onChange={(e) =>
                                                                setFormData(
                                                                    (p) => ({
                                                                        ...p,
                                                                        signatories:
                                                                            {
                                                                                ...p.signatories,
                                                                                registrar:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="Enter School Registrar Name"
                                                        />
                                                        <label className="form-label small fw-bold text-center font-monospace w-100">
                                                            SCHOOL REGISTRAR
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {isGrade12ThirdTerm && (
                                        <div className="card border-2 border-dark mb-4 shadow-sm">
                                            <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                                <i className="bi bi-ui-checks me-2"></i>{" "}
                                                CATEGORY / FUTURE TRACK
                                            </div>
                                            <div className="card-body bg-white">
                                                <div className="d-flex flex-wrap gap-4">
                                                    {[
                                                        "Pursuing Higher Education",
                                                        "Pursuing Advance TVL",
                                                        "Work or Employment",
                                                        "Start a Business",
                                                    ].map((cat) => (
                                                        <div
                                                            className="form-check"
                                                            key={cat}
                                                        >
                                                            <input
                                                                className="form-check-input border-dark"
                                                                type="checkbox"
                                                                checked={
                                                                    formData.category ===
                                                                    cat
                                                                }
                                                                onChange={() =>
                                                                    setFormData(
                                                                        {
                                                                            ...formData,
                                                                            category:
                                                                                cat,
                                                                        },
                                                                    )
                                                                }
                                                                id={`cat-${cat.replace(/\s+/g, "-")}`}
                                                            />
                                                            <label
                                                                className="form-check-label fw-bold font-monospace small"
                                                                htmlFor={`cat-${cat.replace(/\s+/g, "-")}`}
                                                            >
                                                                {cat}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                                {formData.category ===
                                                    "Pursuing Higher Education" && (
                                                    <div className="mt-3">
                                                        <label className="form-label small fw-bold font-monospace">
                                                            COURSE TO BE TAKEN:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control border-dark fw-bold text-uppercase"
                                                            value={
                                                                formData.course
                                                            }
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    course: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            }
                                                            placeholder="Enter Course here"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        className="text-center text-dark fw-bold font-monospace mb-4"
                                        style={{
                                            fontSize: "11px",
                                            lineHeight: "1.5",
                                        }}
                                    >
                                        <i className="fst-italic">
                                            VALID ONLY WITH SIGNATURES AND
                                            SCHOOL DRY SEAL.
                                        </i>
                                        <br />
                                        <span
                                            className="text-muted fw-normal fst-italic"
                                            style={{ fontSize: "10px" }}
                                        >
                                            Any alteration or forgery of this
                                            document is strictly prohibited and
                                            punishable by law under Article 172
                                            of the Revised Penal Code
                                            (Falsification of Public/Official
                                            Documents) and Republic Act No.
                                            10175.
                                        </span>
                                    </div>

                                    <div className="position-relative my-4 text-center">
                                        <hr
                                            className="border-dark"
                                            style={{
                                                borderTop: "2px dashed #000",
                                                opacity: 1,
                                            }}
                                        />
                                        <span
                                            className="position-absolute top-50 start-50 translate-middle bg-light px-3 text-muted fw-bold font-monospace small"
                                            style={{ zIndex: 1 }}
                                        >
                                            <i className="bi bi-scissors me-1"></i>{" "}
                                            CUT HERE
                                        </span>
                                    </div>

                                    <div className="card border-2 border-dark mb-2 shadow-sm">
                                        <div className="card-header border-bottom border-dark bg-white fw-bold font-monospace">
                                            <i className="bi bi-file-earmark-lock-fill me-2"></i>{" "}
                                            PULL-OUT AGREEMENT
                                        </div>
                                        <div className="card-body bg-white row g-3">
                                            <div className="col-12 mb-2">
                                                <p
                                                    className="small mb-2 text-muted font-monospace"
                                                    style={{
                                                        textAlign: "justify",
                                                        lineHeight: "1.5",
                                                    }}
                                                >
                                                    I understand that upon
                                                    signing this Certificate of
                                                    Registration, the student is
                                                    officially enrolled. Should
                                                    I decide to pull out or
                                                    cancel the enrollment at any
                                                    given time, I agree to pay
                                                    the penalty fee of{" "}
                                                    <strong className="text-danger">
                                                        PHP 500.00
                                                    </strong>{" "}
                                                    and abide by the school's
                                                    strict policies regarding
                                                    tuition refunds and the
                                                    release of transfer
                                                    credentials.
                                                </p>
                                            </div>
                                            <div className="col-md-6 mt-4">
                                                <input
                                                    type="text"
                                                    className="form-control border-dark bg-light text-muted fw-bold text-center border-top-0 border-start-0 border-end-0 border-bottom border-2 rounded-0"
                                                    value={
                                                        formData.terms
                                                            .parent_name
                                                    }
                                                    readOnly
                                                    placeholder="Parent / Guardian Name"
                                                />
                                                <label className="form-label small fw-bold font-monospace text-center w-100">
                                                    PARENT / GUARDIAN SIGNATURE
                                                </label>
                                            </div>
                                            <div className="col-md-6 mt-4">
                                                <input
                                                    type="text"
                                                    className="form-control border-dark bg-light text-muted fw-bold text-center border-top-0 border-start-0 border-end-0 border-bottom border-2 rounded-0"
                                                    value={
                                                        formData.terms
                                                            .student_name
                                                    }
                                                    readOnly
                                                    placeholder="Student Name"
                                                />
                                                <label className="form-label small fw-bold font-monospace text-center w-100">
                                                    STUDENT SIGNATURE
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="text-muted fst-italic font-monospace text-center mt-2 mb-4"
                                        style={{ fontSize: "11px" }}
                                    >
                                        School Year: {formData.info.school_year}{" "}
                                        | Term: {formData.info.term} | Date
                                        &amp; Time: {previewDateTime}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer bg-light border-top border-dark p-3">
                            <button
                                type="button"
                                className="btn btn-dark fw-bold px-4 btn-press-retro"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                className="btn border-2 border-dark fw-bold px-4 btn-press-retro d-flex align-items-center"
                                style={{ backgroundColor: "#74b9ff" }}
                                onClick={confirmDownload}
                                disabled={submitting || fetchingData}
                            >
                                PRINT COR
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <StudentConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeDownload}
            />

            <Loading show={submitting} message="GENERATING OFFICIAL COR..." />
        </>
    );
}
