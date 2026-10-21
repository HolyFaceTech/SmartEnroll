import React, { useState, useRef } from "react";
import axios from "axios";
import Toast from "../utils/toast";
import SubjectConfirmation from "./SubjectConfirmation";
import Loading from "../utils/Loading";

export default function SubjectImport({
    show,
    onClose,
    onSuccess,
    apiPrefix = "/api",
}) {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ show: false });
    const fileInputRef = useRef(null);

    if (!show) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 2 * 1024 * 1024) {
                Toast.fire({
                    icon: "error",
                    title: "File is too large. Maximum size is 2MB.",
                });
                setFile(null);
                e.target.value = null;
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleClearFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    const handleConfirmImportClick = () => {
        if (!file) {
            return Toast.fire({
                icon: "warning",
                title: "Please select a CSV file first.",
            });
        }

        setConfirmConfig({
            show: true,
            title: "CONFIRM IMPORT",
            message: (
                <>
                    Are you sure you want to import <br />{" "}
                    <strong>{file.name}</strong>?
                </>
            ),
            confirmText: "YES, IMPORT IT",
            confirmColor: "#55efc4",
            iconClass: "bi-file-earmark-spreadsheet-fill",
        });
    };

    const executeImport = async () => {
        setConfirmConfig({ show: false });
        setIsLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");

        try {
            const res = await axios.post(
                `${apiPrefix}/subjects/import`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            Toast.fire({ icon: "success", title: res.data.message });
            handleClearFile();
            onSuccess();
            onClose();
        } catch (error) {
            Toast.fire({
                icon: "error",
                title:
                    error.response?.data?.message || "Check your CSV format.",
            });
        } finally {
            setIsLoading(false);
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
                style={{ zIndex: 1050 }}
            >
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content card-retro border-2 border-dark shadow">
                        <div
                            className="modal-header border-bottom border-dark text-dark"
                            style={{ backgroundColor: "#55efc4" }}
                        >
                            <h5 className="modal-title fw-bold font-monospace">
                                <i className="bi bi-file-earmark-spreadsheet-fill me-2"></i>
                                IMPORT SUBJECTS CSV
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                disabled={isLoading}
                            ></button>
                        </div>

                        <div className="modal-body bg-light p-4">
                            <div className="alert bg-white border border-dark border-2 text-start p-3 mb-4 rounded-0 shadow-sm">
                                <h6 className="fw-bold font-monospace mb-2 text-danger">
                                    <i className="bi bi-info-circle-fill me-2"></i>
                                    IMPORT ADVISORY & FORMAT
                                </h6>
                                <ul className="small font-monospace mb-2 ps-3 text-muted">
                                    <li className="mb-1">
                                        <strong>Max Size:</strong> 2MB per file.
                                    </li>
                                    <li className="mb-1">
                                        <strong>File Type:</strong> Strictly{" "}
                                        <span className="badge bg-dark text-white">
                                            .csv
                                        </span>{" "}
                                        only.
                                    </li>
                                    <li className="mb-1">
                                        <strong>Transaction Logic:</strong>
                                        If any row contains a duplicate code or
                                        unregistered strand, the entire file
                                        will be rejected to prevent partial
                                        uploads.
                                    </li>
                                </ul>

                                <p className="small fw-bold font-monospace mb-1 mt-3">
                                    EXACT CSV HEADER COLUMNS REQUIRED:
                                </p>
                                <div
                                    className="border border-dark p-3 bg-light font-monospace small text-muted"
                                    style={{
                                        fontSize: "0.75rem",
                                        wordWrap: "break-word",
                                        lineHeight: "1.8",
                                    }}
                                >
                                    code, description, grade_level, term,
                                    strand_code
                                </div>
                            </div>

                            <div className="mt-2 text-center">
                                {!file && (
                                    <div
                                        className="p-4 mb-3 position-relative rounded-0"
                                        style={{
                                            border: "2px dashed #000",
                                            backgroundColor: "#fdfbf7",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        <input
                                            type="file"
                                            accept=".csv"
                                            className="position-absolute w-100 h-100 top-0 start-0 opacity-0"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            required
                                            disabled={isLoading}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <div className="d-flex flex-column align-items-center pointer-events-none">
                                            <i
                                                className="bi bi-cloud-arrow-up-fill text-dark mb-2"
                                                style={{ fontSize: "2.5rem" }}
                                            ></i>
                                            <span className="fw-bold font-monospace text-dark fs-6">
                                                CLICK OR DRAG CSV FILE HERE
                                            </span>
                                            <span className="small text-muted font-monospace mt-1">
                                                Maximum file size: 2MB
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {file && (
                                    <div className="d-flex justify-content-between align-items-center bg-white border border-2 border-dark p-3 font-monospace mb-4 shadow-sm text-start">
                                        <div className="d-flex align-items-center overflow-hidden">
                                            <i className="bi bi-filetype-csv text-success fs-2 me-3"></i>
                                            <div>
                                                <div
                                                    className="text-truncate fw-bold text-dark"
                                                    style={{
                                                        maxWidth: "250px",
                                                    }}
                                                >
                                                    {file.name}
                                                </div>
                                                <div className="text-muted small">
                                                    {(
                                                        file.size /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)}{" "}
                                                    MB
                                                </div>
                                            </div>
                                        </div>
                                        {!isLoading && (
                                            <button
                                                type="button"
                                                className="btn btn-sm border border-dark border-2 fw-bold btn-press-retro px-3 ms-2"
                                                style={{
                                                    backgroundColor: "#F96E5B",
                                                }}
                                                onClick={handleClearFile}
                                                title="Remove File"
                                            >
                                                <i className="bi bi-trash-fill text-white"></i>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer bg-light border-top border-dark p-3 d-flex justify-content-end">
                            <button
                                type="button"
                                className="btn btn-dark fw-bold px-4 btn-press-retro"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                className="btn border-2 border-dark fw-bold px-4 btn-press-retro d-flex align-items-center"
                                style={{ backgroundColor: "#55efc4" }}
                                onClick={handleConfirmImportClick}
                                disabled={isLoading || !file}
                            >
                                UPLOAD & IMPORT
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <SubjectConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeImport}
            />
            <Loading show={isLoading} message="IMPORTING CSV DATA..." />
        </>
    );
}
