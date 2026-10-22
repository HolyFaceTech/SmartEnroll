import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../../utils/toast";
import Loading from "../../utils/Loading";
import KeepsConfirmation from "../../components/KeepsConfirmation";

export default function Keeps({ title }) {
    const [viewMode, setViewMode] = useState("folders");
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [fileSearchTerm, setFileSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalFolders, setTotalFolders] = useState(0);
    const [fromItem, setFromItem] = useState(0);
    const [toItem, setToItem] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [selectedFolder, setSelectedFolder] = useState(null);
    const [files, setFiles] = useState([]);
    const [selectedFileIds, setSelectedFileIds] = useState([]);

    const [confirmConfig, setConfirmConfig] = useState({ show: false });
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("LOADING...");

    const getToken = () =>
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const fetchFolders = async () => {
        setLoadingMessage("FETCHING FOLDERS...");
        setLoading(true);
        try {
            const res = await axios.get("/api/keeps", {
                params: {
                    search: searchTerm,
                    page: currentPage,
                    per_page: itemsPerPage,
                },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setFolders(res.data.data);
            setTotalFolders(res.data.total);
            setFromItem(res.data.from || 0);
            setToItem(res.data.to || 0);
            setLastPage(res.data.last_page);
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to load folders." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === "folders") {
            const delayDebounceFn = setTimeout(() => fetchFolders(), 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchTerm, currentPage, itemsPerPage, viewMode]);

    const fetchFiles = async (folderId, searchKeyword) => {
        setActionLoading(true);
        setLoadingMessage(
            searchKeyword ? "SEARCHING FILES..." : "OPENING FOLDER...",
        );
        try {
            const res = await axios.get(`/api/keeps/${folderId}`, {
                params: { search: searchKeyword },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setFiles(res.data.files);
        } catch (error) {
            Toast.fire({ icon: "error", title: "Failed to load files." });
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === "files" && selectedFolder) {
            const delayDebounceFn = setTimeout(() => {
                fetchFiles(selectedFolder.id, fileSearchTerm);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [fileSearchTerm, viewMode, selectedFolder?.id]);

    const handleOpenFolder = (student) => {
        setSelectedFolder(student);
        setFiles([]);
        setSelectedFileIds([]);
        setFileSearchTerm("");
        setViewMode("files");
    };

    const handleBackToFolders = () => {
        setViewMode("folders");
        setSelectedFolder(null);
        setFiles([]);
        setSelectedFileIds([]);
        setFileSearchTerm("");
    };

    const handleSelectAllFiles = (e) => {
        if (e.target.checked) setSelectedFileIds(files.map((f) => f.id));
        else setSelectedFileIds([]);
    };

    const handleSelectOneFile = (e, id) => {
        if (e.target.checked) setSelectedFileIds([...selectedFileIds, id]);
        else
            setSelectedFileIds(
                selectedFileIds.filter((itemId) => itemId !== id),
            );
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return "0 MB";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const mbValue = bytes / Math.pow(k, 2);
        return `${mbValue.toFixed(dm)} MB`;
    };

    const getFileIcon = (ext) => {
        if (ext.toLowerCase() === "pdf") return "bi-filetype-pdf text-danger";
        return "bi-image-fill text-info";
    };

    const confirmDelete = (fileId = null) => {
        const isSingle = fileId !== null;
        const idsToDelete = isSingle ? [fileId] : selectedFileIds;
        if (idsToDelete.length === 0) return;

        const fileText = idsToDelete.length === 1 ? "FILE" : "FILES";
        const pronounText = idsToDelete.length === 1 ? "IT" : "THEM";

        setConfirmConfig({
            show: true,
            type: "delete",
            payload: idsToDelete,
            title:
                idsToDelete.length === 1
                    ? "DELETE FILE?"
                    : `DELETE ${idsToDelete.length} FILES?`,
            message: `This action cannot be undone and will permanently remove the ${fileText.toLowerCase()} from storage. Proceed?`,
            confirmText: `YES, DELETE ${pronounText}`,
            confirmColor: "#F96E5B",
            iconClass: "bi-trash-fill",
        });
    };

    const confirmDownload = () => {
        if (selectedFileIds.length === 0) return;

        const pronounText = selectedFileIds.length === 1 ? "IT" : "THEM";

        setConfirmConfig({
            show: true,
            type: "download",
            payload: selectedFileIds,
            title:
                selectedFileIds.length === 1
                    ? "DOWNLOAD FILE?"
                    : `DOWNLOAD ${selectedFileIds.length} FILES?`,
            message: `Are you sure you want to download ${selectedFileIds.length === 1 ? "this file" : `${selectedFileIds.length} files`} as a ZIP archive?`,
            confirmText: `YES, DOWNLOAD ${pronounText}`,
            confirmColor: "#79C9C5",
            iconClass: "bi-file-earmark-zip-fill",
        });
    };

    const executeAction = async () => {
        const { type, payload } = confirmConfig;
        setConfirmConfig({ show: false });

        if (type === "delete") {
            setActionLoading(true);
            setLoadingMessage("DELETING FILES...");
            try {
                const res = await axios.post(
                    `/api/keeps/${selectedFolder.id}/delete-files`,
                    { files: payload },
                    { headers: { Authorization: `Bearer ${getToken()}` } },
                );
                Toast.fire({ icon: "success", title: res.data.message });
                setSelectedFileIds([]);
                fetchFiles(selectedFolder.id, fileSearchTerm);
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: error.response?.data?.message || "Delete failed.",
                });
            } finally {
                setActionLoading(false);
            }
        } else if (type === "download") {
            setActionLoading(true);
            setLoadingMessage("GENERATING ZIP...");
            try {
                const res = await axios.post(
                    `/api/keeps/${selectedFolder.id}/download-zip`,
                    { files: payload },
                    {
                        headers: { Authorization: `Bearer ${getToken()}` },
                        responseType: "blob",
                    },
                );
                const blobUrl = window.URL.createObjectURL(
                    new Blob([res.data]),
                );
                const link = document.createElement("a");
                link.href = blobUrl;
                link.setAttribute(
                    "download",
                    `${selectedFolder.lrn}_files.zip`,
                );
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(blobUrl);
                Toast.fire({
                    icon: "success",
                    title: "ZIP Downloaded Successfully!",
                });
            } catch (error) {
                Toast.fire({ icon: "error", title: "Failed to generate ZIP." });
            } finally {
                setActionLoading(false);
            }
        }
    };

    return (
        <div className="container-fluid fade-in mb-5">
            <div
                className="d-flex justify-content-between align-items-center mb-4 pb-3"
                style={{ borderBottom: "2px solid black" }}
            >
                <div>
                    <h2
                        className="fw-bold text-dark mb-0 font-monospace"
                        style={{ textShadow: "2px 2px 0 #FFFFFF" }}
                    >
                        {title.toUpperCase()}
                    </h2>

                    <div className="text-muted small mb-0 font-monospace fw-bold mt-1">
                        {viewMode === "folders" ? (
                            "Manage student requirement folders"
                        ) : (
                            <>
                                <span
                                    className="text-primary"
                                    style={{
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                    }}
                                    onClick={handleBackToFolders}
                                >
                                    Folders
                                </span>
                                <span className="mx-2">/</span>
                                <span className="text-dark">
                                    {selectedFolder?.first_name}{" "}
                                    {selectedFolder?.middle_name}{" "}
                                    {selectedFolder?.last_name}{" "}
                                    {selectedFolder?.suffix}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div>
                    {viewMode === "files" && (
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-danger btn-press-retro border-2 border-dark fw-bold px-4 py-2 d-flex align-items-center gap-2 text-white"
                                style={{
                                    backgroundColor:
                                        selectedFileIds.length > 0
                                            ? "#F96E5B"
                                            : "#f5b7b1",
                                    color:
                                        selectedFileIds.length > 0
                                            ? "#fff"
                                            : "#fff",
                                    transition: "all 0.2s",
                                }}
                                onClick={() => confirmDelete(null)}
                                disabled={selectedFileIds.length === 0}
                            >
                                <i className="bi bi-trash-fill"></i> DELETE (
                                {selectedFileIds.length > 0
                                    ? selectedFileIds.length
                                    : "0"}
                                )
                            </button>
                            <button
                                className="btn btn-retro btn-press-retro border-2 border-dark px-4 py-2 d-flex align-items-center gap-2"
                                style={{
                                    backgroundColor:
                                        selectedFileIds.length > 0
                                            ? "#79C9C5"
                                            : "#a8ebd8",
                                    color: "#000",
                                    transition: "all 0.2s",
                                }}
                                onClick={confirmDownload}
                                disabled={selectedFileIds.length === 0}
                            >
                                <i className="bi bi-file-earmark-zip-fill"></i>{" "}
                                DOWNLOAD (
                                {selectedFileIds.length > 0
                                    ? selectedFileIds.length
                                    : "0"}
                                )
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {viewMode === "folders" ? (
                <>
                    <div className="card-retro mb-4">
                        <div className="card-body p-3 d-flex justify-content-between align-items-center flex-wrap gap-3 bg-white">
                            <div className="d-flex align-items-center gap-2">
                                <span className="small fw-bold font-monospace">
                                    Show:
                                </span>
                                <select
                                    className="form-control form-control-sm font-monospace fw-bold text-center border-dark border-2 cursor-pointer"
                                    style={{ width: "60px" }}
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
                                    Entries
                                </span>
                            </div>
                            <div
                                className="input-group shadow-sm"
                                style={{ maxWidth: "350px" }}
                            >
                                <span className="input-group-text bg-white border-dark border-2 border-end-0">
                                    <i className="bi bi-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-dark border-2 border-start-0 ps-2 font-monospace"
                                    placeholder="Search folder..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        {folders.length === 0 && !loading ? (
                            <div className="col-12 text-center py-5 d-flex flex-column align-items-center justify-content-center">
                                <i
                                    className="bi bi-folder-x text-muted"
                                    style={{ fontSize: "4rem" }}
                                ></i>
                                <h5 className="fw-bold font-monospace mt-3 text-dark">
                                    NO FOLDERS FOUND
                                </h5>
                                <p className="text-muted small mb-4">
                                    We couldn't find any records matching your
                                    criteria in the database.
                                </p>
                            </div>
                        ) : (
                            folders.map((student) => (
                                <div
                                    key={student.id}
                                    className="col-md-6 col-lg-4 col-xl-3"
                                >
                                    <div className="card-retro h-100 bg-white d-flex flex-column">
                                        <div
                                            style={{
                                                height: "14px",
                                                backgroundColor: "#f6e58d",
                                                borderBottom: "3px solid #000",
                                                borderTopLeftRadius: "6px",
                                                borderTopRightRadius: "6px",
                                            }}
                                        ></div>
                                        <div className="card-body p-4 d-flex flex-column flex-grow-1">
                                            <div className="d-flex align-items-center mb-3">
                                                <i
                                                    className="bi bi-folder-fill text-warning me-2"
                                                    style={{
                                                        fontSize: "2rem",
                                                        textShadow:
                                                            "1px 1px 0 #000",
                                                    }}
                                                ></i>
                                                <h5
                                                    className="fw-bold mb-0 font-monospace text-truncate"
                                                    title={`${student.last_name}, ${student.first_name}`}
                                                >
                                                    {student.last_name}
                                                    {student.suffix
                                                        ? ` ${student.suffix}`
                                                        : ""}
                                                    , {student.first_name}{" "}
                                                    {student.middle_name}
                                                </h5>
                                            </div>
                                            <div className="small font-monospace mb-2">
                                                <strong>LRN:</strong>{" "}
                                                {student.lrn}
                                            </div>
                                            <div className="small font-monospace mb-2">
                                                <strong>STUDENT NO:</strong>{" "}
                                                {student.student_number ||
                                                    "N/A"}
                                            </div>
                                            <div className="small font-monospace text-muted mt-auto mb-3">
                                                Created:{" "}
                                                {new Date(
                                                    student.created_at,
                                                ).toLocaleDateString()}
                                            </div>
                                            <button
                                                className="btn btn-warning w-100 fw-bold border-2 border-dark btn-press-retro font-monospace"
                                                onClick={() =>
                                                    handleOpenFolder(student)
                                                }
                                            >
                                                <i className="bi bi-folder2-open me-2"></i>{" "}
                                                OPEN FOLDER
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="card-retro bg-white py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <small className="text-muted font-monospace fw-bold">
                            Showing{" "}
                            <strong>{totalFolders > 0 ? fromItem : 0}</strong>{" "}
                            to <strong>{toItem}</strong> of{" "}
                            <strong>{totalFolders}</strong> keeps
                        </small>
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li
                                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                                >
                                    <button
                                        className="page-link border-2 border-dark text-dark fw-bold rounded-0 me-1"
                                        onClick={() =>
                                            setCurrentPage((prev) => prev - 1)
                                        }
                                    >
                                        &laquo; PREV
                                    </button>
                                </li>
                                <li className="page-item disabled">
                                    <span className="page-link border-2 border-dark text-dark fw-bold rounded-0 mx-1 bg-warning">
                                        PAGE {currentPage} OF {lastPage || 1}
                                    </span>
                                </li>
                                <li
                                    className={`page-item ${currentPage >= lastPage ? "disabled" : ""}`}
                                >
                                    <button
                                        className="page-link border-2 border-dark text-dark fw-bold rounded-0 ms-1"
                                        onClick={() =>
                                            setCurrentPage((prev) => prev + 1)
                                        }
                                    >
                                        NEXT &raquo;
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </>
            ) : (
                <>
                    <div className="card-retro mb-4">
                        <div className="card-body p-3 d-flex justify-content-between align-items-center flex-wrap gap-3 bg-white">
                            <div className="d-flex align-items-center gap-3">
                                <span className="small fw-bold font-monospace">
                                    Select
                                </span>
                                <input
                                    type="checkbox"
                                    className="form-check-input border-dark border-2 cursor-pointer m-0"
                                    style={{ width: "20px", height: "20px" }}
                                    checked={
                                        selectedFileIds.length ===
                                            files.length && files.length > 0
                                    }
                                    onChange={handleSelectAllFiles}
                                />
                                <span className="small fw-bold font-monospace">
                                    All Files
                                </span>
                            </div>

                            <div
                                className="input-group shadow-sm"
                                style={{ maxWidth: "350px" }}
                            >
                                <span className="input-group-text bg-white border-dark border-2 border-end-0">
                                    <i className="bi bi-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-dark border-2 border-start-0 ps-2 font-monospace"
                                    placeholder="Search file..."
                                    value={fileSearchTerm}
                                    onChange={(e) =>
                                        setFileSearchTerm(e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="row g-4">
                        {files.length === 0 && !actionLoading ? (
                            <div className="col-12 text-center py-5 d-flex flex-column align-items-center justify-content-center">
                                <i
                                    className="bi bi-folder-x text-muted"
                                    style={{ fontSize: "4rem" }}
                                ></i>
                                <h5 className="fw-bold font-monospace mt-3 text-dark">
                                    NO FILES FOUND
                                </h5>
                                <p className="text-muted small mb-4">
                                    We couldn't find any records matching your
                                    criteria in the database.
                                </p>
                            </div>
                        ) : (
                            files.map((file) => (
                                <div
                                    key={file.id}
                                    className="col-md-6 col-lg-4"
                                >
                                    <div
                                        className="card-retro bg-white d-flex flex-column h-100 p-0 position-relative cursor-pointer"
                                        style={{ transition: "transform 0.1s" }}
                                        onClick={() =>
                                            window.open(file.path, "_blank")
                                        }
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.transform =
                                                "translate(-2px, -2px)")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.transform =
                                                "translate(0, 0)")
                                        }
                                    >
                                        <div className="card-body p-3 d-flex flex-column">
                                            <div className="small fw-bold font-monospace text-muted mb-2 text-truncate text-uppercase">
                                                {file.category}
                                            </div>

                                            <div
                                                className="d-flex align-items-center gap-3 border border-dark border-2 p-3 mt-auto"
                                                style={{
                                                    backgroundColor: "#f8f9fa",
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input border-dark border-2 cursor-pointer m-0 flex-shrink-0"
                                                    style={{
                                                        width: "20px",
                                                        height: "20px",
                                                    }}
                                                    checked={selectedFileIds.includes(
                                                        file.id,
                                                    )}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    onChange={(e) =>
                                                        handleSelectOneFile(
                                                            e,
                                                            file.id,
                                                        )
                                                    }
                                                />

                                                <i
                                                    className={`${getFileIcon(file.extension)} fs-1`}
                                                ></i>

                                                <div
                                                    className="flex-grow-1 overflow-hidden"
                                                    style={{
                                                        lineHeight: "1.2",
                                                    }}
                                                >
                                                    <div
                                                        className="fw-bold font-monospace text-truncate small text-dark"
                                                        title={file.name.replace(
                                                            /^[0-9]+_/,
                                                            "",
                                                        )}
                                                    >
                                                        {file.name.replace(
                                                            /^[0-9]+_/,
                                                            "",
                                                        )}
                                                    </div>
                                                    <small
                                                        className="text-muted font-monospace"
                                                        style={{
                                                            fontSize: "0.75rem",
                                                        }}
                                                    >
                                                        {formatBytes(file.size)}
                                                    </small>
                                                </div>

                                                <button
                                                    className="btn btn-sm btn-danger border-dark border-2 flex-shrink-0 btn-press-retro px-3 ms-2"
                                                    style={{
                                                        backgroundColor:
                                                            "#F96E5B",
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmDelete(file.id);
                                                    }}
                                                >
                                                    <i className="bi bi-trash-fill"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
            <KeepsConfirmation
                {...confirmConfig}
                onCancel={() => setConfirmConfig({ show: false })}
                onConfirm={executeAction}
            />
            <Loading show={loading || actionLoading} message={loadingMessage} />
        </div>
    );
}
