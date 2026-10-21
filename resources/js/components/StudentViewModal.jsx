import React, { useEffect, useState } from "react";

export default function StudentViewModal({ show, selectedStudent, onClose }) {
    const [fileSizes, setFileSizes] = useState({});

    useEffect(() => {
        if (show && selectedStudent && selectedStudent.requirement) {
            const keysMap = {
                psa: "psa",
                form137: "form_137",
                good_moral: "good_moral",
                diploma: "diploma",
                card: "form_138",
                picture: "photo_2x2",
            };

            const sizes = {};
            Object.keys(keysMap).forEach((reqId) => {
                const filePath = selectedStudent.requirement[keysMap[reqId]];
                if (filePath) {
                    fetch(encodeURI(`/storage/${filePath}`), {
                        method: "HEAD",
                    })
                        .then((res) => {
                            const size = res.headers.get("content-length");
                            if (size) {
                                setFileSizes((prev) => ({
                                    ...prev,
                                    [reqId]: (size / 1024 / 1024).toFixed(2),
                                }));
                            }
                        })
                        .catch(() => {});
                }
            });
        } else {
            setFileSizes({});
        }
    }, [show, selectedStudent]);

    if (!show || !selectedStudent) return null;

    const getFullName = (s) => {
        const middle = s.middle_name ? s.middle_name.trim() + " " : "";
        const suffix = s.suffix ? " " + s.suffix.trim() : "";
        return `${s.first_name} ${middle}${s.last_name}${suffix}`.trim();
    };

    const fullName = getFullName(selectedStudent);

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === "enrolled") return "bg-success text-white";
        if (s === "cleared") return "bg-primary text-white";
        if (s === "on hold") return "bg-danger text-white";
        if (s === "graduate") return "bg-info text-dark";
        if (s === "drop out") return "bg-dark text-white";
        if (s === "released") return "bg-secondary text-white";
        return "bg-warning text-dark";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        let dateObj = new Date(dateString);
        return dateObj.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        let dateObj = new Date(dateString);
        return dateObj.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const calculateAge = (dob) => {
        if (!dob) return "N/A";
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return `${age} yrs old`;
    };

    const reqDb = selectedStudent.requirement || {};
    let parsedHardCopies = {};
    if (typeof reqDb.hard_copies === "string") {
        try {
            parsedHardCopies = JSON.parse(reqDb.hard_copies);
        } catch (e) {}
    } else if (
        typeof reqDb.hard_copies === "object" &&
        reqDb.hard_copies !== null
    ) {
        parsedHardCopies = reqDb.hard_copies;
    } else if (selectedStudent.requirements) {
        try {
            parsedHardCopies =
                typeof selectedStudent.requirements === "string"
                    ? JSON.parse(selectedStudent.requirements)
                    : selectedStudent.requirements;
        } catch (e) {}
    }

    const defaultAvatar = `https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff&size=256`;
    const avatarUrl = reqDb.photo_2x2
        ? `/storage/${reqDb.photo_2x2}`
        : defaultAvatar;

    const softCopyMap = [
        { id: "psa", label: "PSA Birth Certificate", dbKey: "psa" },
        { id: "form137", label: "Form 137 / SF10", dbKey: "form_137" },
        { id: "good_moral", label: "Good Moral", dbKey: "good_moral" },
        { id: "diploma", label: "Grade 10 Diploma", dbKey: "diploma" },
        { id: "card", label: "Report Card (F138)", dbKey: "form_138" },
        { id: "picture", label: "2x2 Picture", dbKey: "photo_2x2" },
    ];

    const DataBox = ({
        label,
        value,
        col = "col-md-4",
        textColor = "text-dark",
        uppercase = true,
    }) => (
        <div
            className={`${col} border border-dark p-2 bg-white d-flex flex-column justify-content-start`}
        >
            <span
                className="d-block small text-muted fw-bold font-monospace text-uppercase mb-1"
                style={{ fontSize: "0.7rem", letterSpacing: "1px" }}
            >
                {label}
            </span>
            <span
                className={`fw-bolder font-monospace text-break ${textColor} ${uppercase ? "text-uppercase" : ""}`}
                style={{ wordBreak: "break-word" }}
            >
                {value || "N/A"}
            </span>
        </div>
    );

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
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div
                        className="modal-content card-retro border-2 border-dark shadow-lg"
                        style={{ backgroundColor: "#fdfbf7" }}
                    >
                        <div
                            className="modal-header border-bottom border-dark"
                            style={{
                                backgroundColor: "var(--color-primary)",
                            }}
                        >
                            <h4
                                className="modal-title fw-black font-monospace mb-0 text-white"
                                style={{ letterSpacing: "2px" }}
                            >
                                <i className="bi bi-file-earmark-person-fill me-2"></i>
                                STUDENT DATA
                            </h4>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                            ></button>
                        </div>

                        <div className="modal-body bg-light p-4 p-md-5 pb-3 pb-md-3 overflow-auto flex-grow-1 position-relative">
                            <div className="row mb-4 align-items-center">
                                <div className="col-md-9 order-2 order-md-1">
                                    <h1
                                        className="fw-black text-dark text-uppercase mb-1 text-break"
                                        style={{
                                            letterSpacing: "1px",
                                            fontSize:
                                                "clamp(1.8rem, 3vw, 2.5rem)",
                                            lineHeight: "1.1",
                                        }}
                                    >
                                        {fullName}
                                    </h1>
                                    <div className="d-flex flex-wrap gap-3 mt-3">
                                        <div
                                            className={`badge border border-dark border-2 p-2 px-3 font-monospace rounded-0 fs-6 ${getStatusColor(selectedStudent.status)}`}
                                            style={{
                                                boxShadow:
                                                    "4px 4px 0 rgba(0,0,0,0.2)",
                                                fontWeight: "bold",
                                                letterSpacing: "2px",
                                            }}
                                        >
                                            STATUS:{" "}
                                            {selectedStudent.status
                                                ? selectedStudent.status.toUpperCase()
                                                : "PENDING"}
                                        </div>
                                        <div
                                            className="badge border border-dark border-2 p-2 px-3 font-monospace rounded-0 fs-6 bg-white text-dark text-break"
                                            style={{
                                                boxShadow:
                                                    "4px 4px 0 rgba(0,0,0,0.2)",
                                                fontWeight: "bold",
                                                letterSpacing: "2px",
                                            }}
                                        >
                                            <i className="bi bi-upc-scan me-2"></i>
                                            NO:{" "}
                                            {selectedStudent.student_number ||
                                                "TBA"}
                                        </div>
                                        <div
                                            className="badge border border-dark border-2 p-2 px-3 font-monospace rounded-0 fs-6 bg-light text-primary text-break"
                                            style={{
                                                boxShadow:
                                                    "4px 4px 0 rgba(0,0,0,0.2)",
                                                fontWeight: "bold",
                                                letterSpacing: "2px",
                                            }}
                                        >
                                            <i className="bi bi-hash me-2"></i>
                                            LRN: {selectedStudent.lrn}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3 order-1 order-md-2 mb-3 mb-md-0 d-flex justify-content-md-end justify-content-center">
                                    <div
                                        className="border border-dark border-3 bg-white p-1 shadow flex-shrink-0"
                                        style={{
                                            width: "192px",
                                            height: "192px",
                                        }}
                                    >
                                        <img
                                            src={avatarUrl}
                                            alt="2x2 Picture"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                            onError={(e) => {
                                                e.target.src = defaultAvatar;
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <h5 className="fw-bold font-monospace bg-dark text-white p-2 border border-dark mb-0 text-uppercase">
                                I. Educational Background
                            </h5>
                            <div className="row g-0 mb-4 border-start border-top border-dark d-flex">
                                <DataBox
                                    col="col-md-3"
                                    label="Grade Level"
                                    value={
                                        selectedStudent.academic?.grade_level
                                            ? `Grade ${selectedStudent.academic?.grade_level}`
                                            : null
                                    }
                                />
                                <DataBox
                                    col="col-md-3"
                                    label="Term"
                                    value={selectedStudent.academic?.term}
                                />
                                <DataBox
                                    col="col-md-3"
                                    label="School Year"
                                    value={
                                        selectedStudent.academic?.school_year
                                    }
                                />
                                <DataBox
                                    col="col-md-3"
                                    label="Modality"
                                    value={
                                        selectedStudent.academic
                                            ?.learning_modality
                                    }
                                />

                                <DataBox
                                    col="col-md-3"
                                    label="Strand / Course"
                                    value={
                                        selectedStudent.academic?.strand?.code
                                    }
                                />
                                <DataBox
                                    col="col-md-3"
                                    label="Section"
                                    value={
                                        selectedStudent.academic?.section?.name
                                    }
                                />
                                <DataBox
                                    col="col-md-4"
                                    label="Previous School Attended"
                                    value={
                                        selectedStudent.academic
                                            ?.current_school_attended
                                    }
                                />
                                <DataBox
                                    col="col-md-2"
                                    label="Gen. Average"
                                    value={
                                        selectedStudent.academic
                                            ?.general_average
                                    }
                                />
                            </div>

                            <h5 className="fw-bold font-monospace bg-dark text-white p-2 border border-dark mb-0 text-uppercase">
                                II. Personal Data
                            </h5>
                            <div className="row g-0 mb-4 border-start border-top border-dark d-flex">
                                <DataBox
                                    col="col-md-3"
                                    label="Date of Birth"
                                    value={formatDate(
                                        selectedStudent.profile?.date_of_birth,
                                    )}
                                />
                                <DataBox
                                    col="col-md-2"
                                    label="Age"
                                    value={calculateAge(
                                        selectedStudent.profile?.date_of_birth,
                                    )}
                                />
                                <DataBox
                                    col="col-md-2"
                                    label="Gender"
                                    value={selectedStudent.profile?.gender}
                                />
                                <DataBox
                                    col="col-md-2"
                                    label="Civil Status"
                                    value={
                                        selectedStudent.profile?.civil_status
                                    }
                                />
                                <DataBox
                                    col="col-md-3"
                                    label="Religion"
                                    value={selectedStudent.profile?.religion}
                                />

                                <DataBox
                                    col="col-md-4"
                                    label="Place of Birth"
                                    value={
                                        selectedStudent.profile?.place_of_birth
                                    }
                                />
                                <DataBox
                                    col="col-md-3"
                                    label="Citizenship"
                                    value={selectedStudent.profile?.citizenship}
                                />
                                <DataBox
                                    col="col-md-2"
                                    label="Contact No."
                                    value={selectedStudent.contact_number}
                                />
                                <DataBox
                                    col="col-md-3"
                                    label="Email Address"
                                    value={selectedStudent.email}
                                    textColor="text-primary"
                                    uppercase={false}
                                />

                                <DataBox
                                    col="col-md-12"
                                    label="Present / Home Address"
                                    value={
                                        selectedStudent.profile?.home_address
                                    }
                                />
                                <DataBox
                                    col="col-md-12"
                                    label="Provincial Address"
                                    value={
                                        selectedStudent.profile
                                            ?.provincial_address
                                    }
                                />

                                <DataBox
                                    col="col-md-8"
                                    label="Employer Name (If Working)"
                                    value={
                                        selectedStudent.family?.employer_name
                                    }
                                />
                                <DataBox
                                    col="col-md-4"
                                    label="Employer Contact No."
                                    value={
                                        selectedStudent.family?.employer_contact
                                    }
                                />
                            </div>

                            <h5 className="fw-bold font-monospace bg-dark text-white p-2 border border-dark mb-0 text-uppercase">
                                III. Family Background
                            </h5>
                            <div className="row g-0 mb-4 border-start border-top border-dark d-flex">
                                <DataBox
                                    col="col-md-4"
                                    label="Father's Name"
                                    value={selectedStudent.family?.father_name}
                                />
                                <DataBox
                                    col="col-md-5"
                                    label="Father's Occupation"
                                    value={
                                        selectedStudent.family
                                            ?.father_occupation
                                    }
                                />
                                <DataBox
                                    col="col-md-3"
                                    label="Father's Contact No."
                                    value={
                                        selectedStudent.family?.father_contact
                                    }
                                />

                                <DataBox
                                    col="col-md-4"
                                    label="Mother's Name"
                                    value={selectedStudent.family?.mother_name}
                                />
                                <DataBox
                                    col="col-md-5"
                                    label="Mother's Occupation"
                                    value={
                                        selectedStudent.family
                                            ?.mother_occupation
                                    }
                                />
                                <DataBox
                                    col="col-md-3"
                                    label="Mother's Contact No."
                                    value={
                                        selectedStudent.family?.mother_contact
                                    }
                                />

                                <DataBox
                                    col="col-md-4"
                                    label="Guardian's Name (Emergency)"
                                    value={
                                        selectedStudent.family?.guardian_name
                                    }
                                    textColor="text-danger"
                                />
                                <DataBox
                                    col="col-md-5"
                                    label="Guardian's Occupation"
                                    value={
                                        selectedStudent.family
                                            ?.guardian_occupation
                                    }
                                />
                                <DataBox
                                    col="col-md-3"
                                    label="Guardian's Contact No."
                                    value={
                                        selectedStudent.family?.guardian_contact
                                    }
                                    textColor="text-danger"
                                />
                            </div>

                            <h5 className="fw-bold font-monospace bg-dark text-white p-2 border border-dark mb-0 text-uppercase">
                                IV. Documents & Requirements
                            </h5>
                            <div className="row g-0 border border-top-0 border-dark mb-4 bg-white p-3">
                                <div className="col-md-5 pe-md-4 border-md-end border-dark mb-4 mb-md-0">
                                    <h6
                                        className="fw-bold font-monospace text-uppercase mb-3"
                                        style={{ color: "#d35400" }}
                                    >
                                        <i className="bi bi-file-earmark-check-fill me-2"></i>
                                        Physical Copies
                                    </h6>
                                    <ul className="list-group list-group-flush border border-dark">
                                        {[
                                            {
                                                id: "psa",
                                                label: "PSA Birth Certificate",
                                            },
                                            {
                                                id: "form137",
                                                label: "Form 137 / SF10",
                                            },
                                            {
                                                id: "good_moral",
                                                label: "Good Moral",
                                            },
                                            {
                                                id: "diploma",
                                                label: "Grade 10 Diploma",
                                            },
                                            {
                                                id: "card",
                                                label: "Report Card (F138)",
                                            },
                                            {
                                                id: "picture",
                                                label: "2x2 Picture (2pcs)",
                                            },
                                            {
                                                id: "saf_annex_e_g11",
                                                label: "SAF Annex E (G11)",
                                            },
                                            {
                                                id: "saf_annex_e_g12",
                                                label: "SAF Annex E (G12)",
                                            },
                                        ].map((item) => {
                                            const isChecked =
                                                parsedHardCopies[item.id] ===
                                                    true ||
                                                parsedHardCopies[item.id] ===
                                                    "true";
                                            return (
                                                <li
                                                    key={item.id}
                                                    className="list-group-item d-flex justify-content-between align-items-center bg-light border-dark py-2"
                                                >
                                                    <span className="font-monospace small fw-bold text-dark">
                                                        {item.label}
                                                    </span>
                                                    {isChecked ? (
                                                        <i className="bi bi-check-square-fill text-success fs-5"></i>
                                                    ) : (
                                                        <i className="bi bi-x-square text-danger opacity-50 fs-5"></i>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                <div className="col-md-7 ps-md-4">
                                    <h6 className="fw-bold font-monospace text-uppercase mb-3 text-primary">
                                        <i className="bi bi-cloud-arrow-up-fill me-2"></i>
                                        Uploaded Files
                                    </h6>
                                    <div className="row g-2">
                                        {softCopyMap.map((item) => {
                                            const filePath = reqDb[item.dbKey];
                                            const size = fileSizes[item.id]
                                                ? `${fileSizes[item.id]} MB`
                                                : "Calculating...";

                                            if (!filePath) {
                                                return (
                                                    <div
                                                        className="col-md-6"
                                                        key={item.id}
                                                    >
                                                        <div
                                                            className="border border-dark p-2 text-center bg-light"
                                                            style={{
                                                                height: "70px",
                                                                opacity: 0.6,
                                                            }}
                                                        >
                                                            <i
                                                                className="bi bi-file-earmark-x text-muted fs-4 d-block"
                                                                style={{
                                                                    marginTop:
                                                                        "-1px",
                                                                }}
                                                            ></i>
                                                            <span
                                                                className="small font-monospace fw-bold text-muted"
                                                                style={{
                                                                    fontSize:
                                                                        "0.65rem",
                                                                }}
                                                            >
                                                                NO{" "}
                                                                {item.label.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            const isPdf = filePath
                                                .toLowerCase()
                                                .endsWith(".pdf");
                                            const iconClass = isPdf
                                                ? "bi-filetype-pdf text-danger"
                                                : "bi-image text-primary";
                                            const fileName = filePath
                                                .split("/")
                                                .pop()
                                                .replace(/^[0-9]+_/, "");

                                            return (
                                                <div
                                                    className="col-md-6"
                                                    key={item.id}
                                                >
                                                    <a
                                                        href={`/storage/${filePath}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-decoration-none text-dark d-block"
                                                        style={{
                                                            height: "70px",
                                                        }}
                                                    >
                                                        <div className="border border-dark border-2 p-2 bg-white btn-action-retro h-100 d-flex align-items-center shadow-sm">
                                                            <i
                                                                className={`${iconClass} me-3`}
                                                                style={{
                                                                    fontSize:
                                                                        "2rem",
                                                                }}
                                                            ></i>
                                                            <div
                                                                className="overflow-hidden w-100"
                                                                style={{
                                                                    lineHeight:
                                                                        "1.2",
                                                                }}
                                                            >
                                                                <div
                                                                    className="text-truncate fw-bold text-dark"
                                                                    style={{
                                                                        maxWidth:
                                                                            "150px",
                                                                        wordBreak:
                                                                            "break-word",
                                                                    }}
                                                                    title={
                                                                        fileName
                                                                    }
                                                                >
                                                                    {fileName}
                                                                </div>
                                                                <div className="text-muted small">
                                                                    {size}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 text-end">
                                        <small className="text-muted font-monospace fst-italic">
                                            * Click any file card above to view
                                            the actual document.
                                        </small>
                                    </div>
                                </div>
                            </div>
                            {selectedStudent.status?.toLowerCase() ===
                                "released" && (
                                <div
                                    className="alert border border-2 border-dark rounded-0 p-3 mt-4"
                                    style={{
                                        backgroundColor: "#dfe6e9",
                                        boxShadow: "4px 4px 0 rgba(0,0,0,0.2)",
                                    }}
                                >
                                    <h6
                                        className="fw-bold font-monospace text-uppercase text-dark mb-3"
                                        style={{
                                            borderBottom: "2px solid #2d3436",
                                            paddingBottom: "8px",
                                            letterSpacing: "1px",
                                        }}
                                    >
                                        <i className="bi bi-box-arrow-right me-2 text-primary"></i>
                                        Release Information
                                    </h6>
                                    <div className="row g-3">
                                        <div className="col-md-6 border-md-end border-dark">
                                            <span className="small font-monospace fw-bold text-muted text-uppercase d-block mb-1">
                                                Released By:
                                            </span>
                                            <span className="font-monospace fw-bolder text-dark fs-5 text-uppercase">
                                                <i className="bi bi-person-badge-fill me-2"></i>
                                                {selectedStudent.released_by ||
                                                    "Admin Staff"}
                                            </span>
                                        </div>
                                        <div className="col-md-6 ps-md-4">
                                            <span className="small font-monospace fw-bold text-muted text-uppercase d-block mb-1">
                                                Date & Time Released:
                                            </span>
                                            <span className="font-monospace fw-bolder text-dark fs-5 text-uppercase">
                                                <i className="bi bi-calendar-check-fill me-2"></i>
                                                {formatDateTime(
                                                    selectedStudent.released_at,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="d-flex justify-content-end gap-2 pt-3 border-top border-dark">
                                <button
                                    type="button"
                                    className="btn btn-dark fw-bold px-4 btn-press-retro"
                                    onClick={onClose}
                                >
                                    CLOSE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
