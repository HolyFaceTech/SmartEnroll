import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Strands() {
    const [strands, setStrands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get("/api/public/strands")
            .then((res) => {
                setStrands(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const themeColors = ["#3F9AAE", "#F96E5B", "#F4D03F", "#55efc4", "#a29bfe"];

    const themeIcons = [
        "bi-laptop",
        "bi-calculator",
        "bi-palette",
        "bi-globe",
        "bi-briefcase-fill",
        "bi-heart-pulse",
        "bi-gear-fill",
        "bi-journal-text",
    ];

    const renderCards = () => {
        return strands.map((strand, index) => {
            const bgColor = themeColors[index % themeColors.length];
            const icon = themeIcons[index % themeIcons.length];

            return (
                <div
                    className="strand-card border-3 border-dark"
                    key={strand.id}
                    style={{ backgroundColor: bgColor }}
                    onClick={() =>
                        window.open(
                            `https://www.google.com/search?q=${encodeURIComponent(strand.description + " Senior High School")}`,
                            "_blank",
                        )
                    }
                    title="Click to learn more on Google"
                >
                    <div className="d-flex align-items-center h-100 p-3">
                        <div
                            className="bg-white border-2 border-dark rounded-circle d-flex justify-content-center align-items-center flex-shrink-0"
                            style={{
                                width: "65px",
                                height: "65px",
                                boxShadow: "2px 2px 0 #000",
                            }}
                        >
                            <i className={`bi ${icon} fs-2 text-dark`}></i>
                        </div>

                        <div className="ms-3 text-start text-dark overflow-hidden w-100">
                            <h4
                                className="fw-black mb-1 text-truncate"
                                style={{
                                    textShadow:
                                        "1px 1px 0px rgba(255,255,255,0.6)",
                                }}
                            >
                                {strand.code}
                            </h4>
                            <p className="small fw-bold mb-0 lh-sm fst-italic">
                                {strand.description}
                            </p>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div
            className="py-5 font-monospace overflow-hidden"
            style={{ minHeight: "60vh" }}
        >
            <style>
                {`
                @keyframes scrollX {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-100% - 1.5rem)); }
                }
                .marquee-container {
                    display: flex;
                    width: 100vw;
                    overflow: hidden;
                    gap: 1.5rem;
                    padding: 2rem 0;
                }
                .marquee-group {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    min-width: 100%;
                    animation: scrollX 20s linear infinite;
                }
                /* Humihinto ang scroll pag naka-hover */
                .marquee-container:hover .marquee-group {
                    animation-play-state: paused;
                }
                .strand-card {
                    width: 380px;
                    height: 120px;
                    cursor: pointer;
                    box-shadow: 6px 6px 0px #000;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .strand-card:hover {
                    transform: translate(-4px, -4px);
                    box-shadow: 10px 10px 0px #000 !important;
                }
                `}
            </style>

            <div className="container text-center mb-5">
                <h1
                    className="fw-black text-uppercase mb-2"
                    style={{ textShadow: "2px 2px 0px #F96E5B" }}
                >
                    <i className="bi bi-award-fill me-3"></i>Academic Strands
                </h1>
                <p className="text-muted fw-bold">
                    Explore the senior high school tracks we offer.
                </p>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div
                        className="spinner-border text-dark"
                        style={{ width: "3rem", height: "3rem" }}
                    ></div>
                    <p className="mt-3 fw-bold">Loading strands...</p>
                </div>
            ) : strands.length > 0 ? (
                <div className="marquee-container">
                    <div className="marquee-group">{renderCards()}</div>
                    <div className="marquee-group" aria-hidden="true">
                        {renderCards()}
                    </div>
                    <div className="marquee-group" aria-hidden="true">
                        {renderCards()}
                    </div>
                    <div className="marquee-group" aria-hidden="true">
                        {renderCards()}
                    </div>
                </div>
            ) : (
                <div className="text-center text-muted fw-bold py-5 container">
                    No strands available at the moment.
                </div>
            )}
        </div>
    );
}
