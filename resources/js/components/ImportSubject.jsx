import React, { useState } from "react";
import axios from "axios";
import Toast from "../utils/toast";

export default function ImportSubject({
    show,
    onClose,
    onSuccess,
    apiPrefix = "/api",
}) {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            Toast.fire({
                icon: "warning",
                title: "Please select a file first.",
            });
            return;
        }

        setIsLoading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axios.post(
                `${apiPrefix}/subjects/import`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total,
                        );
                        setUploadProgress(percentCompleted);
                    },
                },
            );
            Toast.fire({ icon: "success", title: res.data.message });
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "Failed to import CSV. Please check the file format.",
            });
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
        }
    };

    const handleClose = () => {
        setFile(null);
        setUploadProgress(0);
        onClose();
    };

    if (!show) return null;

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1040 }}
            ></div>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ zIndex: 1050 }}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div
                        className="modal-content card-retro border-dark"
                        style={{
                            border: "2px solid black",
                            borderRadius: "12px",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            className="modal-header text-white"
                            style={{
                                backgroundColor: "var(--color-primary)",
                                borderBottom: "2px solid black",
                            }}
                        >
                            <h5 className="modal-title fw-bold font-monospace">
                                <i className="bi bi-filetype-csv text-white me-2"></i>
                                IMPORT SUBJECTS
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={handleClose}
                                disabled={isLoading}
                            ></button>
                        </div>

                        <div className="modal-body bg-light p-4">
                            <form onSubmit={handleSubmit}>
                                <fieldset disabled={isLoading}>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold font-monospace">
                                            SELECT CSV FILE
                                        </label>
                                        <input
                                            type="file"
                                            accept=".csv, .txt"
                                            className="form-control border-dark border-2 bg-white"
                                            onChange={handleFileChange}
                                            required
                                        />

                                        {isLoading && (
                                            <div className="mt-3 fade-in">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <small className="fw-bold font-monospace text-success">
                                                        UPLOADING...
                                                    </small>
                                                    <small className="fw-bold font-monospace text-success">
                                                        {uploadProgress}%
                                                    </small>
                                                </div>
                                                <div
                                                    className="progress rounded-0 border border-dark"
                                                    style={{
                                                        height: "10px",
                                                        backgroundColor:
                                                            "#FFE2AF",
                                                    }}
                                                >
                                                    <div
                                                        className="progress-bar bg-success progress-bar-striped progress-bar-animated border-end border-dark"
                                                        style={{
                                                            width: `${uploadProgress}%`,
                                                            borderRight:
                                                                "2px solid black",
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="form-text small fst-italic mt-2">
                                            Format Header:{" "}
                                            <code>
                                                code, description, strand_code,
                                                grade_level, term
                                            </code>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-4">
                                        <button
                                            type="submit"
                                            className="btn btn-retro px-4 py-2 fw-bold d-flex align-items-center border-dark bg-success"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <i className="bi bi-mortarboard-fill me-2 toga-spin"></i>
                                                    <span>PROCESSING...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-arrow-up-circle me-2"></i>
                                                    <span>IMPORT FILE</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-retro bg-dark px-4 py-2 fw-bold d-flex align-items-center border-dark"
                                            onClick={onClose}
                                            disabled={isLoading}
                                        >
                                            <span>CANCEL</span>
                                        </button>
                                    </div>
                                </fieldset>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
