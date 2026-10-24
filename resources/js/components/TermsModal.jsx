import React, { useState, useEffect } from "react";
import { Offcanvas } from "react-bootstrap";

export default function TermsModal({ show, handleClose }) {
    const [isAgreed, setIsAgreed] = useState(false);

    useEffect(() => {
        if (show) {
            setIsAgreed(false);
        }
    }, [show]);

    const onAccept = () => {
        if (isAgreed) {
            handleClose();
        }
    };

    return (
        <Offcanvas
            show={show}
            onHide={handleClose}
            placement="end"
            backdrop="static"
            keyboard={false}
            style={{
                backgroundColor: "#FFF8E7",
                width: "100%",
                maxWidth: "400px",
            }}
        >
            <Offcanvas.Header className="bg-dark border-bottom border-dark">
                <Offcanvas.Title className="fw-bold font-monospace text-white">
                    <i
                        className="bi bi-shield-lock-fill me-2"
                        style={{ color: "#F4D03F" }}
                    ></i>
                    Terms & Privacy Policy
                </Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body
                className="font-monospace d-flex flex-column"
                style={{ fontSize: "0.9rem" }}
            >
                <div className="flex-grow-1 overflow-auto pe-2">
                    <h6 className="fw-bold mt-2 text-decoration-underline">
                        1. Data Privacy Agreement
                    </h6>
                    <p className="text-muted text-justify">
                        In compliance with the{" "}
                        <strong>
                            Data Privacy Act of 2012 (Republic Act 10173)
                        </strong>
                        , SmartEnroll is committed to protecting your personal
                        information. By using this system, you consent to the
                        collection, processing, and storage of your data solely
                        for <strong>enrollment and academic purposes</strong>.
                    </p>

                    <h6 className="fw-bold mt-3 text-decoration-underline">
                        2. Purpose of Data Collection
                    </h6>
                    <p className="text-muted mb-1">
                        Your personal data (e.g., LRN, birth certificate,
                        grades) is collected to:
                    </p>
                    <ul className="text-muted">
                        <li>
                            Process your admission and enrollment to Senior High
                            School.
                        </li>
                        <li>
                            Submit required reports to the Department of
                            Education (DepEd).
                        </li>
                        <li>
                            Generate student records and identification cards.
                        </li>
                    </ul>

                    <h6 className="fw-bold mt-3 text-decoration-underline">
                        3. User Responsibilities
                    </h6>
                    <p className="text-muted mb-1">
                        As a user of this system, you agree to:
                    </p>
                    <ul className="text-muted">
                        <li>
                            Provide accurate and truthful information.
                            Falsification of documents is subject to
                            disciplinary action.
                        </li>
                        <li>
                            Keep your account credentials confidential. The
                            school is not liable for unauthorized access due to
                            negligence.
                        </li>
                    </ul>

                    <h6 className="fw-bold mt-3 text-decoration-underline">
                        4. Intellectual Property
                    </h6>
                    <p className="text-muted text-justify">
                        The design, layout, and source code of SmartEnroll are
                        the intellectual property of the institution.
                        Unauthorized reproduction or modification is strictly
                        prohibited.
                    </p>

                    <h6 className="fw-bold mt-3 text-decoration-underline">
                        5. Data Retention & Disposal
                    </h6>
                    <p className="text-muted text-justify">
                        Your personal data will be kept secure and retained only
                        for as long as necessary to fulfill the academic and
                        administrative purposes of{" "}
                        <strong>
                            Holy Face of Jesus Lyceum of San Jose Inc.
                        </strong>{" "}
                        After your records are officially released, physical and
                        digital files will be securely disposed of.
                    </p>
                </div>

                <hr className="border-dark my-3" />

                <div className="alert alert-warning border-dark rounded-0 mb-3 p-3">
                    <div className="form-check d-flex align-items-start gap-2 m-0">
                        <input
                            className="form-check-input border-dark mt-1"
                            type="checkbox"
                            id="agreeCheck"
                            style={{
                                transform: "scale(1.3)",
                                cursor: "pointer",
                            }}
                            checked={isAgreed}
                            onChange={(e) => setIsAgreed(e.target.checked)}
                        />
                        <label
                            className="form-check-label fw-bold small"
                            htmlFor="agreeCheck"
                            style={{ cursor: "pointer", lineHeight: "1.4" }}
                        >
                            I HAVE READ, UNDERSTOOD, AND AGREE TO THE TERMS AND
                            PRIVACY POLICY.
                        </label>
                    </div>
                </div>

                <div className="text-center mt-2 mb-2">
                    <button
                        className={`btn w-100 fw-bold py-3 border-2 border-dark ${
                            isAgreed
                                ? "btn-success text-dark btn-retro-effect"
                                : "btn-light text-muted"
                        }`}
                        style={{
                            boxShadow: isAgreed ? "4px 4px 0px #000" : "none",
                            transition: "all 0.2s ease",
                        }}
                        onClick={onAccept}
                        disabled={!isAgreed}
                    >
                        {isAgreed ? (
                            <>
                                <i className="bi bi-check-circle-fill me-2"></i>
                                AGREE & CONTINUE
                            </>
                        ) : (
                            "PLEASE CHECK THE BOX"
                        )}
                    </button>
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    );
}
