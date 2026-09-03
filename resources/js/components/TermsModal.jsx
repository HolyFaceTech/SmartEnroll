import React from "react";
import { Offcanvas } from "react-bootstrap";

export default function TermsModal({ show, handleClose }) {
    return (
        <Offcanvas
            show={show}
            onHide={handleClose}
            placement="end"
            style={{ backgroundColor: "#FFF8E7" }}
        >
            <Offcanvas.Header
                closeButton
                closeVariant="white"
                className="bg-dark border-bottom border-dark"
            >
                <Offcanvas.Title className="fw-bold font-monospace text-white">
                    <i
                        className="bi bi-shield-lock-fill me-2"
                        style={{ color: "var(--color-primary)" }}
                    ></i>
                    Terms & Privacy Policy
                </Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body
                className="font-monospace"
                style={{ fontSize: "0.9rem" }}
            >
                <h6 className="fw-bold mt-2 text-decoration-underline">
                    1. Data Privacy Agreement
                </h6>
                <p className="text-muted">
                    In compliance with the{" "}
                    <strong>
                        Data Privacy Act of 2012 (Republic Act 10173)
                    </strong>
                    , SmartEnroll is committed to protecting your personal
                    information. By using this system, you consent to the
                    collection, processing, and storage of your data solely for{" "}
                    <strong>enrollment and academic purposes</strong>.
                </p>

                <h6 className="fw-bold mt-3 text-decoration-underline">
                    2. Purpose of Data Collection
                </h6>
                <p className="text-muted">
                    Your personal data (e.g., LRN, birth certificate, grades) is
                    collected to:
                </p>
                <ul className="text-muted">
                    <li>
                        Process your admission and enrollment to Senior High
                        School.
                    </li>
                    <li>
                        Submit required reports to the Department of Education
                        (DepEd).
                    </li>
                    <li>Generate student records and identification cards.</li>
                </ul>

                <h6 className="fw-bold mt-3 text-decoration-underline">
                    3. User Responsibilities
                </h6>
                <p className="text-muted">
                    As a user of this system, you agree to:
                </p>
                <ul className="text-muted">
                    <li>
                        Provide accurate and truthful information. Falsification
                        of documents is subject to disciplinary action.
                    </li>
                    <li>
                        Keep your account credentials (email & password){" "}
                        <strong>confidential</strong>. The school is not liable
                        for unauthorized access due to negligence.
                    </li>
                    <li>
                        Log out of your account after every session, especially
                        on public devices.
                    </li>
                </ul>

                <h6 className="fw-bold mt-3 text-decoration-underline">
                    4. Intellectual Property
                </h6>
                <p className="text-muted">
                    The design, layout, and source code of SmartEnroll are the
                    intellectual property of the institution. Unauthorized
                    reproduction or modification is strictly prohibited.
                </p>

                <hr className="border-dark my-4" />

                <div className="alert alert-warning border-dark rounded-0">
                    <small>
                        <strong>Note:</strong> By clicking "Login" or "Submit",
                        you acknowledge that you have read and understood these
                        terms.
                    </small>
                </div>

                <div className="text-center mt-4 mb-3">
                    <button
                        className="btn btn-retro w-100 fw-bold py-2"
                        onClick={handleClose}
                    >
                        I UNDERSTAND & AGREE
                    </button>
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    );
}
