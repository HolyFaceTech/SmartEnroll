import React from "react";
import { Modal } from "react-bootstrap";

export default function PublicConfirmation({
    show,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText,
    confirmColor = "#3F9AAE",
    iconClass = "bi-question-circle-fill",
}) {
    if (!show) return null;

    return (
        <Modal
            show={show}
            onHide={onCancel}
            centered
            backdrop="static"
            keyboard={false}
            dialogClassName="modal-retro-wrapper"
        >
            <div
                className="modal-content card-retro border-3 border-dark shadow-lg font-monospace"
                style={{ backgroundColor: "#FFE2AF" }}
            >
                <div
                    className="modal-header border-bottom border-3 border-dark d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: confirmColor }}
                >
                    <h5 className="modal-title fw-black text-dark text-uppercase m-0 ls-1">
                        {title}
                    </h5>
                    <button
                        type="button"
                        className="btn-close border border-dark bg-white shadow-sm"
                        onClick={onCancel}
                    ></button>
                </div>

                <div className="modal-body text-center py-5 bg-white">
                    {iconClass && (
                        <i
                            className={`bi ${iconClass} d-block mb-3`}
                            style={{
                                fontSize: "4.5rem",
                                color: confirmColor,
                                textShadow: "3px 3px 0 #000",
                            }}
                        ></i>
                    )}
                    <p
                        className="fs-6 fw-bold mb-0 text-dark"
                        style={{ lineHeight: "1.6" }}
                    >
                        {message}
                    </p>
                </div>

                <div className="modal-footer border-top border-3 border-dark d-flex justify-content-center bg-light p-3">
                    <button
                        type="button"
                        className="btn btn-dark fw-bold px-4 btn-retro-effect border-2 border-dark"
                        onClick={onCancel}
                    >
                        CANCEL
                    </button>
                    <button
                        type="button"
                        className="btn fw-bold px-4 btn-retro-effect text-dark border-2 border-dark"
                        style={{ backgroundColor: confirmColor }}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
