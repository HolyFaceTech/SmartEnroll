import React from "react";

export default function StrandListModal({
    show,
    onClose,
    strandCode,
    students,
    onExportPdf,
}) {
    if (!show) return null;

    const groupedStudents = students.reduce((acc, student) => {
        const section = student.section_name || "UNASSIGNED SECTION";
        if (!acc[section]) acc[section] = { Male: [], Female: [] };

        const gender = student.gender === "Female" ? "Female" : "Male";
        acc[section][gender].push(student);
        return acc;
    }, {});

    const renderTable = (list, genderLabel) => (
        <div className="mb-4">
            <div
                className="bg-light p-2 fw-bold border border-dark border-bottom-0 font-monospace text-uppercase d-flex align-items-center"
                style={{ fontSize: "0.95rem" }}
            >
                <i
                    className={`bi ${genderLabel === "MALE" ? "bi-gender-male text-primary" : "bi-gender-female text-danger"} me-2 fs-5`}
                ></i>
                {genderLabel} ({list.length})
            </div>

            <div className="table-responsive border border-dark border-2">
                <table
                    className="table table-hover mb-0 font-monospace"
                    style={{
                        fontSize: "0.85rem",
                        backgroundColor: "#fff",
                        borderColor: "#000",
                    }}
                >
                    <thead
                        className="text-white"
                        style={{ backgroundColor: "var(--color-dark)" }}
                    >
                        <tr>
                            <th
                                className="text-center py-2"
                                style={{ width: "10%", borderColor: "#000" }}
                            >
                                <i className="bi bi-hash"></i> NO.
                            </th>
                            <th
                                className="text-center py-2"
                                style={{ width: "20%", borderColor: "#000" }}
                            >
                                <i className="bi bi-person-badge-fill me-1"></i>{" "}
                                STUDENT NO.
                            </th>
                            <th
                                className="text-center py-2"
                                style={{ width: "20%", borderColor: "#000" }}
                            >
                                <i className="bi bi-credit-card-2-front-fill me-1"></i>{" "}
                                LRN
                            </th>
                            <th
                                className="py-2"
                                style={{ width: "35%", borderColor: "#000" }}
                            >
                                <i className="bi bi-person-vcard-fill me-1"></i>{" "}
                                FULL NAME
                            </th>
                            <th
                                className="text-center py-2"
                                style={{ width: "15%", borderColor: "#000" }}
                            >
                                <i className="bi bi-journal-bookmark-fill me-1"></i>{" "}
                                MODALITY
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="text-center fst-italic text-muted py-3"
                                    style={{ borderColor: "#000" }}
                                >
                                    No {genderLabel.toLowerCase()} students
                                </td>
                            </tr>
                        ) : (
                            list.map((s, i) => {
                                const mName = s.middle_name
                                    ? `${s.middle_name[0]}.`
                                    : "";
                                const fullName =
                                    `${s.last_name}, ${s.first_name} ${mName} ${s.suffix || ""}`.trim();

                                return (
                                    <tr key={s.id}>
                                        <td
                                            className="text-center fw-bold text-muted"
                                            style={{ borderColor: "#000" }}
                                        >
                                            {i + 1}
                                        </td>
                                        <td
                                            className="text-center fw-bold"
                                            style={{ borderColor: "#000" }}
                                        >
                                            {s.student_number || "-"}
                                        </td>
                                        <td
                                            className="text-center"
                                            style={{ borderColor: "#000" }}
                                        >
                                            {s.lrn}
                                        </td>
                                        <td
                                            className="text-uppercase fw-bold text-dark"
                                            style={{ borderColor: "#000" }}
                                        >
                                            {fullName}
                                        </td>
                                        <td
                                            className="text-center text-muted fw-bold"
                                            style={{ borderColor: "#000" }}
                                        >
                                            {s.learning_modality?.toUpperCase() ||
                                                "N/A"}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1055 }}
            ></div>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ zIndex: 1060, overflowY: "auto" }}
            >
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div
                        className="modal-content card-retro border-2 border-dark shadow-lg"
                        style={{
                            backgroundColor: "#FFE2AF",
                            borderRadius: "10px",
                        }}
                    >
                        <div
                            className="modal-header border-bottom border-dark"
                            style={{
                                backgroundColor: "var(--color-primary)",
                                borderTopLeftRadius: "8px",
                                borderTopRightRadius: "8px",
                            }}
                        >
                            <h5 className="modal-title fw-bold font-monospace text-white d-flex align-items-center">
                                <i className="bi bi-list-check me-2 fs-4"></i>
                                MASTER LIST: {strandCode}
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                            ></button>
                        </div>

                        <div
                            className="modal-body bg-white p-4"
                            style={{ minHeight: "50vh" }}
                        >
                            {Object.keys(groupedStudents).length === 0 ? (
                                <div className="text-center py-5 d-flex flex-column justify-content-center align-items-center h-100">
                                    <i
                                        className="bi bi-person-x-fill text-muted mb-3"
                                        style={{ fontSize: "4rem" }}
                                    ></i>
                                    <h5 className="text-dark font-monospace fw-bold">
                                        NO ENROLLED STUDENTS FOUND
                                    </h5>
                                </div>
                            ) : (
                                Object.entries(groupedStudents).map(
                                    ([sectionName, genders]) => (
                                        <div key={sectionName} className="mb-5">
                                            <h5
                                                className="fw-bold font-monospace text-dark p-3 mb-3 d-flex justify-content-between align-items-center"
                                                style={{
                                                    border: "2px solid #000",
                                                    backgroundColor: "#ff7675",
                                                    boxShadow: "3px 3px 0 #000",
                                                }}
                                            >
                                                <span>
                                                    <i className="bi bi-diagram-2-fill me-2 opacity-75"></i>
                                                    SECTION:{" "}
                                                    <span
                                                        className="text-white text-uppercase fs-4 ms-1"
                                                        style={{
                                                            letterSpacing:
                                                                "1px",
                                                        }}
                                                    >
                                                        {sectionName}
                                                    </span>
                                                </span>
                                                <span
                                                    className="badge border border-dark text-dark"
                                                    style={{
                                                        backgroundColor: "#fff",
                                                        fontSize: "0.9rem",
                                                    }}
                                                >
                                                    TOTAL:{" "}
                                                    {genders.Male.length +
                                                        genders.Female.length}
                                                </span>
                                            </h5>

                                            {renderTable(genders.Male, "MALE")}
                                            {renderTable(
                                                genders.Female,
                                                "FEMALE",
                                            )}
                                        </div>
                                    ),
                                )
                            )}

                            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-dark">
                                <button
                                    type="button"
                                    className="btn btn-dark fw-bold px-4 btn-press-retro"
                                    onClick={onClose}
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="button"
                                    className="btn border-2 border-dark fw-bold px-4 btn-press-retro d-flex align-items-center"
                                    style={{ backgroundColor: "#ff7675" }}
                                    onClick={onExportPdf}
                                    disabled={students.length === 0}
                                >
                                    EXPORT PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
