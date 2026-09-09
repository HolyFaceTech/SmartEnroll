import React from "react";

export default function SectionConfirmation({
    show,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText,
    confirmColor,
    iconClass,
}) {
    if (!show) return null;

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1060 }}
            ></div>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ zIndex: 1065 }}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div
                        className="modal-content card-retro border-2 border-dark shadow-lg"
                        style={{ backgroundColor: "#FFE2AF" }}
                    >
                        <div
                            className="modal-header border-bottom border-dark"
                            style={{ backgroundColor: confirmColor }}
                        >
                            <h5 className="modal-title fw-bold font-monospace text-dark">
                                {title}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onCancel}
                            ></button>
                        </div>
                        <div className="modal-body text-center py-5">
                            {iconClass && (
                                <i
                                    className={`bi ${iconClass} d-block mb-3`}
                                    style={{
                                        fontSize: "4.5rem",
                                        color: confirmColor,
                                        textShadow: "2px 2px 0 #000",
                                    }}
                                ></i>
                            )}
                            <p className="fs-5 mb-0 font-monospace text-dark">
                                {message}
                            </p>
                        </div>
                        <div className="modal-footer border-top border-dark d-flex justify-content-center">
                            <button
                                type="button"
                                className="btn btn-dark fw-bold px-4 btn-press-retro"
                                onClick={onCancel}
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                className="btn border-dark border-2 fw-bold px-4 btn-press-retro text-dark"
                                style={{ backgroundColor: confirmColor }}
                                onClick={onConfirm}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
