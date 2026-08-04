import React, { useState, useEffect } from "react";
import axios from "axios";
import Toast from "../utils/toast";

export default function CORModal({
    show,
    student,
    onClose,
    onSuccess, // NEW PROP: Para mag-refresh ang table pagtapos
    apiPrefix = "/api",
}) {
    if (!show || !student) return null;

    // STATES
    const [fetchingData, setFetchingData] = useState(true); // Initial Load
    const [submitting, setSubmitting] = useState(false); // Button Action
    const [availableSections, setAvailableSections] = useState([]);

    // STATUS STATE
    const [targetStatus, setTargetStatus] = useState("");

    // FORM DATA
    const [formData, setFormData] = useState({
        info: {
            name: "",
            lrn: "",
            strand: "",
            grade_level: "",
            section_id: "",
            section_name: "",
            school_year: "",
            term: "",
        },
        subjects: [],
        fees: { tuition: 0, miscellaneous: 0, books: 0, total: 0 },
        signatories: {
            adviser: "",
            registrar: "",
            finance: "",
        },
        or_number: "",
    });

    // --- INITIAL FETCH ---
    useEffect(() => {
        if (student) {
            setFetchingData(true);
            setTargetStatus(student.status || "enrolled");

            axios
                .get(`${apiPrefix}/students/${student.id}/cor-data`)
                .then((res) => {
                    // FIX: Kunin natin yung fresh "student" data mula sa database
                    const {
                        available_sections,
                        suggested_subjects,
                        student: freshStudent,
                    } = res.data;
                    setAvailableSections(available_sections);

                    // Generate YYYY-NNNNN format
                    const currentYear = new Date().getFullYear();
                    const randomDigits = Math.floor(
                        10000 + Math.random() * 90000,
                    ); // 5 digits
                    const generatedOR = `${currentYear}-${randomDigits}`;

                    setFormData({
                        info: {
                            // Gamitin ang freshStudent para sigurado tayong may section at strand data
                            name: `${freshStudent.last_name}, ${freshStudent.first_name} ${freshStudent.middle_name || ""} ${freshStudent.suffix || ""}`.toUpperCase(),
                            lrn: freshStudent.lrn,
                            strand: freshStudent.strand?.code || "N/A",
                            grade_level: freshStudent.grade_level,
                            section_id: freshStudent.section_id || "",
                            section_name: freshStudent.section?.name || "",
                            school_year:
                                freshStudent.school_year ||
                                `${currentYear}-${currentYear + 1}`,
                            term: freshStudent.term || "1st",
                        },
                        subjects: suggested_subjects.map((s) => ({
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
                            adviser: freshStudent.section?.adviser_name || "",
                            registrar: "",
                            finance: "",
                        },
                        or_number: generatedOR,
                    });
                })
                .catch((err) => {
                    console.error(err);
                    Toast.fire({
                        icon: "error",
                        title: "Failed to load data.",
                    });
                })
                .finally(() => setFetchingData(false));
        }
    }, [student, apiPrefix]);

    // --- HANDLERS ---
    const handleSectionChange = (e) => {
        const secId = e.target.value;
        const selectedSec = availableSections.find((s) => s.id == secId);
        setFormData((prev) => ({
            ...prev,
            info: {
                ...prev.info,
                section_id: secId,
                section_name: selectedSec ? selectedSec.name : "",
            },
            signatories: {
                ...prev.signatories,
                adviser: selectedSec ? selectedSec.adviser_name || "" : "",
            },
        }));
    };

    const handleFeeChange = (e) => {
        const { name, value } = e.target;
        const val = parseFloat(value) || 0;
        const newFees = { ...formData.fees, [name]: val };
        newFees.total = newFees.tuition + newFees.miscellaneous + newFees.books;
        setFormData((prev) => ({ ...prev, fees: newFees }));
    };

    const handleSigChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            signatories: {
                ...prev.signatories,
                [e.target.name]: e.target.value,
            },
        }));
    };

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

    // --- DOWNLOAD & UPDATE ---
    const handleDownloadPDF = async () => {
        if (!formData.info.section_id) {
            Toast.fire({
                icon: "warning",
                title: "Student has no assigned section.",
            });
            return;
        }

        setSubmitting(true); // BUTTON SPINNER ONLY

        Toast.fire({
            icon: "info",
            title: "Generating Document...",
        });

        try {
            // GENERATE PDF DIRECTLY (Inalis na ang Step 1 Update Status)
            const response = await axios.post(`${apiPrefix}/cor/generate-url`, {
                ...formData,
                printed_by: "Admin",
            });

            window.open(response.data.url, "_blank");

            Toast.fire({
                icon: "success",
                title: `COR Generated Successfully!`,
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            let msg = "Action Failed.";
            if (
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                msg = error.response.data.message;
            }
            Toast.fire({ icon: "error", title: msg });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1050 }}
            ></div>
            <div
                className="modal fade show d-block"
                style={{ zIndex: 1055, overflowY: "auto" }}
            >
                <div className="modal-dialog modal-lg">
                    <div className="modal-content border-2 border-dark rounded-0 shadow-lg">
                        {/* HEADER */}
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

                        {/* BODY */}
                        <div className="modal-body bg-light">
                            {fetchingData ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border"></div>
                                    <p className="mt-2 font-monospace small">
                                        Fetching Student Data...
                                    </p>
                                </div>
                            ) : (
                                <div className="container-fluid font-monospace small">
                                    {/* TOP ROW */}
                                    <div className="row mb-3 g-2 align-items-end">
                                        <div className="col-md-3">
                                            <label className="fw-bold mb-1 text-primary">
                                                CURRENT STATUS:
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm border-dark rounded-0 fw-bold bg-secondary bg-opacity-10 text-uppercase text-muted"
                                                value={targetStatus}
                                                readOnly
                                                disabled
                                            />
                                        </div>

                                        <div className="col-md-5">
                                            <label className="fw-bold mb-1 text-muted">
                                                ASSIGNED SECTION:
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm border-dark rounded-0 fw-bold bg-secondary bg-opacity-10 text-muted"
                                                value={
                                                    formData.info
                                                        .section_name ||
                                                    "UNASSIGNED"
                                                }
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="fw-bold mb-1">
                                                OFFICIAL RECEIPT NO:
                                            </label>
                                            {/* ⭐ PLACEHOLDER RESTORED */}
                                            <input
                                                type="text"
                                                className="form-control form-control-sm border-dark rounded-0 text-danger fw-bold"
                                                placeholder="OR NUMBER"
                                                value={formData.or_number}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        or_number:
                                                            e.target.value,
                                                    })
                                                }
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    {/* SUBJECTS TABLE */}
                                    <div className="d-flex justify-content-between align-items-end mb-1">
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
                                                                {/* ⭐ PLACEHOLDER RESTORED */}
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm border-0 rounded-0 text-center fw-bold"
                                                                    placeholder="SUBJ CODE"
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
                                                    {/* ⭐ PLACEHOLDER RESTORED */}
                                                    <div className="input-group input-group-sm mb-1">
                                                        <span className="input-group-text bg-white border-dark rounded-0 w-50">
                                                            Tuition:
                                                        </span>
                                                        <span className="input-group-text bg-light border-dark rounded-0 border-end-0 fw-bold">
                                                            PHP
                                                        </span>
                                                        <input
                                                            type="number"
                                                            name="tuition"
                                                            className="form-control border-dark border-start-0 rounded-0 text-end fw-bold"
                                                            placeholder="0.00"
                                                            value={
                                                                formData.fees
                                                                    .tuition
                                                            }
                                                            onChange={
                                                                handleFeeChange
                                                            }
                                                        />
                                                    </div>
                                                    <div className="input-group input-group-sm mb-1">
                                                        <span className="input-group-text bg-white border-dark rounded-0 w-50">
                                                            Misc:
                                                        </span>
                                                        <span className="input-group-text bg-light border-dark rounded-0 border-end-0 fw-bold">
                                                            PHP
                                                        </span>
                                                        <input
                                                            type="number"
                                                            name="miscellaneous"
                                                            className="form-control border-dark border-start-0 rounded-0 text-end fw-bold"
                                                            placeholder="0.00"
                                                            value={
                                                                formData.fees
                                                                    .miscellaneous
                                                            }
                                                            onChange={
                                                                handleFeeChange
                                                            }
                                                        />
                                                    </div>
                                                    <div className="input-group input-group-sm mb-1">
                                                        <span className="input-group-text bg-white border-dark rounded-0 w-50">
                                                            Books:
                                                        </span>
                                                        <span className="input-group-text bg-light border-dark rounded-0 border-end-0 fw-bold">
                                                            PHP
                                                        </span>
                                                        <input
                                                            type="number"
                                                            name="books"
                                                            className="form-control border-dark border-start-0 rounded-0 text-end fw-bold"
                                                            placeholder="0.00"
                                                            value={
                                                                formData.fees
                                                                    .books
                                                            }
                                                            onChange={
                                                                handleFeeChange
                                                            }
                                                        />
                                                    </div>
                                                    <div className="d-flex justify-content-between fw-bold bg-secondary bg-opacity-25 p-1 border border-dark mt-2">
                                                        <span>TOTAL:</span>
                                                        <span className="text-danger fs-6">
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
                                                    {/* PLACEHOLDER RESTORED */}
                                                    <label
                                                        className="fw-bold mb-0 text-muted"
                                                        style={{
                                                            fontSize: "10px",
                                                        }}
                                                    >
                                                        CLASS ADVISER:
                                                    </label>
                                                    <input
                                                        name="adviser"
                                                        className="form-control form-control-sm border-dark rounded-0 mb-1 fw-bold text-uppercase"
                                                        placeholder="ADVISER NAME"
                                                        value={
                                                            formData.signatories
                                                                .adviser
                                                        }
                                                        onChange={
                                                            handleSigChange
                                                        }
                                                    />
                                                    <label
                                                        className="fw-bold mb-0 text-muted"
                                                        style={{
                                                            fontSize: "10px",
                                                        }}
                                                    >
                                                        REGISTRAR:
                                                    </label>
                                                    <input
                                                        name="registrar"
                                                        className="form-control form-control-sm border-dark rounded-0 mb-1 fw-bold text-uppercase"
                                                        placeholder="REGISTRAR NAME"
                                                        value={
                                                            formData.signatories
                                                                .registrar
                                                        }
                                                        onChange={
                                                            handleSigChange
                                                        }
                                                    />
                                                    <label
                                                        className="fw-bold mb-0 text-muted"
                                                        style={{
                                                            fontSize: "10px",
                                                        }}
                                                    >
                                                        FINANCE:
                                                    </label>
                                                    <input
                                                        name="finance"
                                                        className="form-control form-control-sm border-dark rounded-0 fw-bold text-uppercase"
                                                        placeholder="FINANCE OFFICER"
                                                        value={
                                                            formData.signatories
                                                                .finance
                                                        }
                                                        onChange={
                                                            handleSigChange
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* FOOTER - BUTTON WITH TOGA SPINNER */}
                        <div className="modal-footer bg-light border-top border-dark d-flex justify-content-between py-3">
                            <button
                                className="btn btn-success rounded-0 fw-bold px-4 btn-retro-effect"
                                onClick={handleDownloadPDF}
                                disabled={submitting} // Disabled while submitting
                            >
                                {submitting ? (
                                    <>
                                        <i className="bi bi-mortarboard-fill toga-spin me-2"></i>
                                        PROCESSING...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-file-earmark-pdf-fill me-2"></i>
                                        DOWNLOAD COR
                                    </>
                                )}
                            </button>
                            <button
                                className="btn btn-secondary rounded-0 fw-bold px-4 btn-retro-effect"
                                onClick={onClose}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
