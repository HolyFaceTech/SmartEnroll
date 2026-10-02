import React, { useState, useEffect } from "react";
import axios from "axios";
import Toast from "../utils/toast";

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
    const [availableSections, setAvailableSections] = useState([]);
    const [targetStatus, setTargetStatus] = useState("");

    const [formData, setFormData] = useState({
        info: {
            name: "",
            lrn: "",
            strand: "",
            grade_level: "",
            section_id: "",
            section_name: "",
            school_year: "",
            semester: "",
        },
        subjects: [],
        fees: { tuition: 0, miscellaneous: 0, books: 0, total: 0 },
        signatories: { adviser: "", registrar: "", finance: "" },
        terms: { parent_name: "", student_name: "" },
        or_number: "",
    });

    useEffect(() => {
        if (student) {
            setFetchingData(true);
            setTargetStatus(student.status || "enrolled");
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            axios
                .get(`${apiPrefix}/students/${student.id}/cor-data`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    setAvailableSections(res.data.available_sections);
                    setFormData({
                        info: {
                            name: `${student.last_name}, ${student.first_name} ${student.middle_name || ""} ${student.suffix || ""}`.toUpperCase(),
                            lrn: student.lrn,
                            strand: student.academic?.strand?.code || "N/A",
                            grade_level: student.academic?.grade_level,
                            section_id: student.academic?.section_id || "",
                            section_name: student.academic?.section?.name || "",
                            school_year:
                                student.academic?.school_year || "2026-2027",
                            semester: student.academic?.term || "1st Semester",
                        },
                        subjects: res.data.suggested_subjects.map((s) => ({
                            code: s.code,
                            desc: s.description,
                            sched: "",
                            teacher: "",
                        })),
                        fees: {
                            tuition: 5000,
                            miscellaneous: 1500,
                            books: 2000,
                            total: 8500,
                        },
                        signatories: {
                            adviser:
                                student.academic?.section?.adviser_name || "",
                            registrar: "",
                            finance: "",
                        },
                        terms: { parent_name: "", student_name: "" },
                        or_number:
                            res.data.default_or ||
                            "OR-" + Math.floor(100000 + Math.random() * 900000),
                    });
                })
                .catch(() =>
                    Toast.fire({
                        icon: "error",
                        title: "Failed to load data.",
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

    const handleDownloadPDF = async () => {
        if (!formData.info.section_id)
            return Toast.fire({
                icon: "warning",
                title: "Select a section first.",
            });
        setSubmitting(true);
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");

        try {
            await axios.put(
                `${apiPrefix}/students/${student.id}/status`,
                { status: targetStatus },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const response = await axios.post(
                `${apiPrefix}/cor/generate-url`,
                { ...formData, printed_by: "Admin" },
                { headers: { Authorization: `Bearer ${token}` } },
            );

            window.open(response.data.url, "_blank");
            Toast.fire({
                icon: "success",
                title: "COR Generated & Status Updated!",
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
                style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}
            ></div>
            <div
                className="modal fade show d-block"
                style={{ zIndex: 1055, overflowY: "auto" }}
            >
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content border-2 border-dark rounded-0 shadow-lg card-retro">
                        <div className="modal-header bg-dark text-white border-bottom border-dark rounded-0 py-3">
                            <h5 className="modal-title fw-bold font-monospace mx-auto">
                                <i className="bi bi-printer-fill me-2 text-warning"></i>{" "}
                                PREVIEW & EDIT COR
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white position-absolute end-0 me-3"
                                onClick={onClose}
                            ></button>
                        </div>
                        <div className="modal-body bg-light p-4">
                            {fetchingData ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border"></div>
                                </div>
                            ) : (
                                <div className="container-fluid font-monospace small">
                                    <div className="row mb-3 g-2">
                                        <div className="col-md-3">
                                            <label className="fw-bold mb-1 text-primary">
                                                CHANGE STATUS:
                                            </label>
                                            <select
                                                className="form-select border-dark rounded-0 fw-bold bg-warning bg-opacity-25"
                                                value={targetStatus}
                                                onChange={(e) =>
                                                    setTargetStatus(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="enrolled">
                                                    ENROLLED
                                                </option>
                                                <option value="pending">
                                                    PENDING
                                                </option>
                                                <option value="cleared">
                                                    CLEARED
                                                </option>
                                            </select>
                                        </div>
                                        <div className="col-md-5">
                                            <label className="fw-bold mb-1">
                                                SECTION ASSIGNMENT:
                                            </label>
                                            <select
                                                className="form-select border-dark rounded-0 fw-bold"
                                                value={formData.info.section_id}
                                                onChange={(e) =>
                                                    setFormData((p) => ({
                                                        ...p,
                                                        info: {
                                                            ...p.info,
                                                            section_id:
                                                                e.target.value,
                                                        },
                                                    }))
                                                }
                                            >
                                                <option value="" disabled>
                                                    -- Select --
                                                </option>
                                                {availableSections.map(
                                                    (sec) => (
                                                        <option
                                                            key={sec.id}
                                                            value={sec.id}
                                                            disabled={
                                                                sec.enrolled_count >=
                                                                sec.capacity
                                                            }
                                                        >
                                                            {sec.name} (
                                                            {sec.enrolled_count}
                                                            /{sec.capacity}){" "}
                                                            {sec.enrolled_count >=
                                                            sec.capacity
                                                                ? "(FULL)"
                                                                : ""}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="fw-bold mb-1">
                                                OFFICIAL RECEIPT (OR) NO:
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control border-dark rounded-0 text-danger fw-bold bg-white"
                                                value={formData.or_number}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        or_number:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* SUBJECTS TABLE */}
                                    <div className="d-flex justify-content-between align-items-end mb-1 mt-4">
                                        <label className="fw-bold">
                                            SUBJECTS (Editable):
                                        </label>
                                        <button
                                            className="btn btn-sm btn-dark rounded-0 py-0"
                                            onClick={addRow}
                                            style={{ fontSize: "10px" }}
                                        >
                                            <i className="bi bi-plus-lg"></i>{" "}
                                            ADD SUBJECT
                                        </button>
                                    </div>
                                    <div className="table-responsive bg-white border border-dark mb-3">
                                        <table
                                            className="table table-sm table-bordered mb-0"
                                            style={{ fontSize: "11px" }}
                                        >
                                            <thead className="table-secondary text-center">
                                                <tr>
                                                    <th width="15%">CODE</th>
                                                    <th width="35%">
                                                        DESCRIPTION
                                                    </th>
                                                    <th width="20%">
                                                        SCHEDULE
                                                    </th>
                                                    <th width="20%">TEACHER</th>
                                                    <th width="10%">ACTION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.subjects.map(
                                                    (sub, idx) => (
                                                        <tr key={idx}>
                                                            <td className="p-0">
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm border-0 rounded-0 text-center fw-bold"
                                                                    placeholder="CODE"
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
                                                            <td className="p-0">
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm border-0 rounded-0"
                                                                    placeholder="DESCRIPTION"
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
                                                            <td className="p-0">
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm border-0 rounded-0 text-center"
                                                                    placeholder="-- --"
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
                                                            <td className="p-0">
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm border-0 rounded-0 text-center"
                                                                    placeholder="-- --"
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
                                                            <td className="text-center p-0 align-middle">
                                                                <button
                                                                    className="btn btn-sm text-danger"
                                                                    onClick={() =>
                                                                        removeRow(
                                                                            idx,
                                                                        )
                                                                    }
                                                                >
                                                                    <i className="bi bi-x-lg"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* FEES & SIGNATORIES */}
                                    <div className="row g-2">
                                        <div className="col-md-6">
                                            <div className="card rounded-0 border-dark h-100">
                                                <div className="card-header py-1 bg-warning fw-bold border-bottom border-dark small">
                                                    FEES
                                                </div>
                                                <div className="card-body p-2">
                                                    {[
                                                        "tuition",
                                                        "miscellaneous",
                                                        "books",
                                                    ].map((fee) => (
                                                        <div
                                                            className="input-group input-group-sm mb-1"
                                                            key={fee}
                                                        >
                                                            <span className="input-group-text bg-white border-dark rounded-0 w-50 text-uppercase">
                                                                {fee}:
                                                            </span>
                                                            <input
                                                                type="number"
                                                                className="form-control border-dark rounded-0 text-end"
                                                                value={
                                                                    formData
                                                                        .fees[
                                                                        fee
                                                                    ]
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const val =
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0;
                                                                    const newFees =
                                                                        {
                                                                            ...formData.fees,
                                                                            [fee]: val,
                                                                        };
                                                                    newFees.total =
                                                                        newFees.tuition +
                                                                        newFees.miscellaneous +
                                                                        newFees.books;
                                                                    setFormData(
                                                                        (
                                                                            p,
                                                                        ) => ({
                                                                            ...p,
                                                                            fees: newFees,
                                                                        }),
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                    <div className="d-flex justify-content-between fw-bold bg-secondary bg-opacity-25 p-1 border border-dark mt-2">
                                                        <span>TOTAL:</span>
                                                        <span>
                                                            PHP{" "}
                                                            {formData.fees.total.toLocaleString(
                                                                undefined,
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="card rounded-0 border-dark h-100">
                                                <div className="card-header py-1 bg-info fw-bold border-bottom border-dark small">
                                                    SIGNATORIES
                                                </div>
                                                <div className="card-body p-2">
                                                    {[
                                                        "adviser",
                                                        "registrar",
                                                        "finance",
                                                    ].map((sig) => (
                                                        <div
                                                            key={sig}
                                                            className="mb-1"
                                                        >
                                                            <label
                                                                className="fw-bold mb-0 text-muted text-uppercase"
                                                                style={{
                                                                    fontSize:
                                                                        "10px",
                                                                }}
                                                            >
                                                                {sig}:
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm border-dark rounded-0 fw-bold text-uppercase"
                                                                value={
                                                                    formData
                                                                        .signatories[
                                                                        sig
                                                                    ]
                                                                }
                                                                onChange={(e) =>
                                                                    setFormData(
                                                                        (
                                                                            p,
                                                                        ) => ({
                                                                            ...p,
                                                                            signatories:
                                                                                {
                                                                                    ...p.signatories,
                                                                                    [sig]: e
                                                                                        .target
                                                                                        .value,
                                                                                },
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TERMS */}
                                    <div className="card rounded-0 border-dark mt-3">
                                        <div className="card-header py-1 bg-danger text-white fw-bold border-bottom border-dark small">
                                            PULL-OUT AGREEMENT SIGNATORIES
                                            (TERMS)
                                        </div>
                                        <div className="card-body p-2 row g-2">
                                            <div className="col-md-6">
                                                <input
                                                    type="text"
                                                    className="form-control border-dark rounded-0 fw-bold text-uppercase"
                                                    placeholder="PARENT / GUARDIAN NAME"
                                                    value={
                                                        formData.terms
                                                            .parent_name
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((p) => ({
                                                            ...p,
                                                            terms: {
                                                                ...p.terms,
                                                                parent_name:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <input
                                                    type="text"
                                                    className="form-control border-dark rounded-0 fw-bold text-uppercase"
                                                    placeholder="STUDENT NAME"
                                                    value={
                                                        formData.terms
                                                            .student_name
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((p) => ({
                                                            ...p,
                                                            terms: {
                                                                ...p.terms,
                                                                student_name:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer bg-white border-top border-dark">
                            <button
                                className="btn btn-secondary rounded-0 fw-bold px-4 btn-press-retro border-dark border-2"
                                onClick={onClose}
                            >
                                CLOSE
                            </button>
                            <button
                                className="btn btn-success rounded-0 fw-bold px-4 btn-press-retro border-dark border-2"
                                onClick={handleDownloadPDF}
                                disabled={submitting}
                            >
                                {submitting
                                    ? "PROCESSING..."
                                    : "SAVE & DOWNLOAD COR"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
