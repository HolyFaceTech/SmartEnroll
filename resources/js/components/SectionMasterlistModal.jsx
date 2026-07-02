import React from "react";

export default function SectionMasterlistModal({
    show,
    onClose,
    loading,
    masterData,
    onDownloadPDF,
}) {
    if (!show) return null;

    const formatName = (s) => {
        const lastName = s.last_name || "";
        const suffix = s.suffix ? ` ${s.suffix}` : "";
        const firstName = s.first_name || "";
        const middleName = s.middle_name ? ` ${s.middle_name}` : "";
        return `${lastName}${suffix}, ${firstName}${middleName}`.toUpperCase();
    };

    const handleDownloadCSV = () => {
        if (!masterData) return;

        const headers = [
            "NO.",
            "STUDENT NAME",
            "SEX",
            "LRN",
            "STUDENT NUMBER",
            "MODALITY",
        ];
        const rows = [headers];

        let count = 1;
        rows.push(["MALE", "", "", "", "", ""]);
        masterData.males.forEach((s) => {
            rows.push([
                count++,
                `"${formatName(s)}"`,
                "M",
                `="${s.lrn || ""}"`,
                `="${s.student_number || "N/A"}"`,
                `"${s.learning_modality || "N/A"}"`,
            ]);
        });

        count = 1;
        rows.push([]);
        rows.push(["FEMALE", "", "", "", "", ""]);
        masterData.females.forEach((s) => {
            rows.push([
                count++,
                `"${formatName(s)}"`,
                "F",
                `="${s.lrn || ""}"`,
                `="${s.student_number || "N/A"}"`,
                `"${s.learning_modality || "N/A"}"`,
            ]);
        });

        const csvString = rows.map((e) => e.join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csvString], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
            "download",
            `Masterlist_${masterData.section.name}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            ></div>
            <div className="modal fade show d-block" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content border-2 border-dark rounded-0 shadow-lg">
                        <div className="modal-header bg-dark text-white border-bottom border-dark rounded-0 py-3">
                            <h5 className="modal-title fw-bold font-monospace mx-auto">
                                <i className="bi bi-file-earmark-person-fill me-2 text-warning"></i>{" "}
                                CLASS MASTER LIST
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white position-absolute end-0 me-3"
                                onClick={onClose}
                            ></button>
                        </div>

                        <div className="modal-body bg-secondary p-4 bg-opacity-10">
                            {loading || !masterData ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border border-dark"></div>
                                </div>
                            ) : (
                                <div
                                    className="bg-white border border-dark shadow p-4 mx-auto"
                                    style={{
                                        maxWidth: "95%",
                                        minHeight: "500px",
                                    }}
                                >
                                    <div className="text-center border-bottom border-dark border-2 pb-3 mb-4">
                                        <h1 className="fw-bold text-uppercase display-6 font-monospace mb-0">
                                            {masterData.section.name}
                                        </h1>
                                        <p className="text-muted font-monospace fw-bold mb-2">
                                            {
                                                masterData.section.strand
                                                    .description
                                            }
                                        </p>
                                        <div className="d-flex justify-content-center flex-wrap gap-2 mt-3">
                                            <span className="badge bg-white text-dark border border-dark rounded-0 px-3">
                                                GRADE{" "}
                                                {masterData.section.grade_level}
                                            </span>
                                            <span className="badge bg-white text-dark border border-dark rounded-0 px-3">
                                                {masterData.term} Term
                                            </span>
                                            <span className="badge bg-white text-dark border border-dark rounded-0 px-3">
                                                SY {masterData.school_year}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="table-responsive">
                                        <table
                                            className="table table-bordered border-dark mb-0 font-monospace small align-middle"
                                            style={{ minWidth: "900px" }}
                                        >
                                            <thead className="bg-light text-center">
                                                <tr>
                                                    <th style={{ width: "5%" }}>
                                                        #
                                                    </th>
                                                    <th
                                                        style={{ width: "35%" }}
                                                    >
                                                        STUDENT NAME
                                                    </th>
                                                    <th style={{ width: "5%" }}>
                                                        SEX
                                                    </th>
                                                    <th
                                                        style={{ width: "20%" }}
                                                    >
                                                        LRN
                                                    </th>
                                                    <th
                                                        style={{ width: "20%" }}
                                                    >
                                                        STUDENT NO.
                                                    </th>
                                                    <th
                                                        style={{ width: "15%" }}
                                                    >
                                                        MODALITY
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="table-secondary fw-bold border-top border-dark">
                                                    <td
                                                        colSpan="6"
                                                        className="ps-3"
                                                    >
                                                        <i className="bi bi-gender-male me-2"></i>{" "}
                                                        MALE
                                                    </td>
                                                </tr>
                                                {masterData.males.map(
                                                    (s, i) => (
                                                        <tr key={s.id}>
                                                            <td className="text-center fw-bold">
                                                                {i + 1}
                                                            </td>
                                                            <td className="text-uppercase fw-bold text-primary">
                                                                {formatName(s)}
                                                            </td>
                                                            <td className="text-center">
                                                                M
                                                            </td>
                                                            <td className="text-center">
                                                                {s.lrn}
                                                            </td>
                                                            <td className="text-center">
                                                                {s.student_number ||
                                                                    "N/A"}
                                                            </td>
                                                            <td className="text-center text-uppercase small fw-bold">
                                                                {s.learning_modality ||
                                                                    "N/A"}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                                {masterData.males.length ===
                                                    0 && (
                                                    <tr>
                                                        <td
                                                            colSpan="6"
                                                            className="text-center text-muted fst-italic py-2"
                                                        >
                                                            No Male Students
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* FEMALE SECTION */}
                                                <tr className="table-secondary fw-bold border-top border-dark">
                                                    <td
                                                        colSpan="6"
                                                        className="ps-3"
                                                    >
                                                        <i className="bi bi-gender-female me-2"></i>{" "}
                                                        FEMALE
                                                    </td>
                                                </tr>
                                                {masterData.females.map(
                                                    (s, i) => (
                                                        <tr key={s.id}>
                                                            <td className="text-center fw-bold">
                                                                {i + 1}
                                                            </td>
                                                            <td className="text-uppercase fw-bold text-danger">
                                                                {formatName(s)}
                                                            </td>
                                                            <td className="text-center">
                                                                F
                                                            </td>
                                                            <td className="text-center">
                                                                {s.lrn}
                                                            </td>
                                                            <td className="text-center">
                                                                {s.student_number ||
                                                                    "N/A"}
                                                            </td>
                                                            <td className="text-center text-uppercase small fw-bold">
                                                                {s.learning_modality ||
                                                                    "N/A"}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                                {masterData.females.length ===
                                                    0 && (
                                                    <tr>
                                                        <td
                                                            colSpan="6"
                                                            className="text-center text-muted fst-italic py-2"
                                                        >
                                                            No Female Students
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer bg-light border-top border-dark d-flex justify-content-end gap-2">
                            {masterData && (
                                <>
                                    <button
                                        className="btn btn-retro fw-bold px-4 py-2 bg-success border-dark"
                                        onClick={handleDownloadCSV}
                                    >
                                        <i className="bi bi-filetype-csv"></i>{" "}
                                        <span className="d-none d-sm-inline ms-2">
                                            DOWNLOAD CSV
                                        </span>
                                    </button>
                                    <button
                                        className="btn btn-retro fw-bold px-4 py-2 bg-danger border-dark"
                                        onClick={() =>
                                            onDownloadPDF(masterData.section.id)
                                        }
                                    >
                                        <i className="bi bi-printer-fill"></i>{" "}
                                        <span className="d-none d-sm-inline ms-2">
                                            PRINT PDF
                                        </span>
                                    </button>
                                </>
                            )}
                            <button
                                className="btn btn-retro fw-bold px-4 py-2 bg-dark border-dark"
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
