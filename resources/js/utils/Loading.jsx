import React from "react";
import { createPortal } from "react-dom";

export default function Loading({ show, message = "PROCESSING..." }) {
    if (!show) return null;

    return createPortal(
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(4px)",
                margin: 0,
                padding: 0,
            }}
        >
            <div
                className="card-retro border-2 border-dark shadow-lg p-5 text-center d-flex flex-column align-items-center justify-content-center fade-in"
                style={{ minWidth: "320px", backgroundColor: "#FFE2AF" }}
            >
                <i
                    className="bi bi-mortarboard-fill mb-3 toga-spin"
                    style={{
                        fontSize: "4.5rem",
                        color: "var(--color-primary)",
                        textShadow: "3px 3px 0 #000",
                    }}
                ></i>
                <h5
                    className="fw-bold font-monospace text-dark mb-0"
                    style={{ letterSpacing: "1px" }}
                >
                    {message}
                </h5>
            </div>
        </div>,
        document.body,
    );
}
