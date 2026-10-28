import React from "react";
import { Accordion } from "react-bootstrap";

export default function FAQ() {
    return (
        <div className="container py-5 font-monospace">
            <div className="text-center mb-5">
                <h1
                    className="fw-black text-uppercase mb-2"
                    style={{ textShadow: "2px 2px 0px #3F9AAE" }}
                >
                    <i className="bi bi-question-circle-fill me-3"></i>Help &
                    FAQ
                </h1>
                <p className="text-muted fw-bold">
                    Frequently asked questions and step-by-step guides.
                </p>
            </div>

            <div className="row align-items-center g-5">
                <div className="col-lg-5 text-center d-none d-lg-block">
                    <img
                        src="/images/faq.svg"
                        alt="FAQ Illustration"
                        className="img-fluid floating-img w-100"
                        style={{
                            maxWidth: "450px",
                            filter: "drop-shadow(6px 6px 0px rgba(0,0,0,0.15))",
                        }}
                    />
                </div>

                <div className="col-lg-7">
                    <Accordion
                        defaultActiveKey="0"
                        className="border-3 border-dark shadow-lg accordion-public"
                    >
                        {/* 1. HOW TO ENROLL */}
                        <Accordion.Item
                            eventKey="0"
                            className="border-bottom border-dark rounded-0"
                        >
                            <Accordion.Header className="fw-bold">
                                <i className="bi bi-person-plus-fill me-2"></i>{" "}
                                HOW TO ENROLL (NEW STUDENTS)
                            </Accordion.Header>
                            <Accordion.Body className="bg-light">
                                <ul className="list-unstyled mb-0">
                                    <li className="mb-2">
                                        <strong>1.</strong> Click the{" "}
                                        <b>"ENROLL NOW"</b> button on the home
                                        page.
                                    </li>
                                    <li className="mb-2">
                                        <strong>2.</strong> Enter your 12-Digit
                                        LRN. The system will verify if you are a
                                        new student.
                                    </li>
                                    <li className="mb-2">
                                        <strong>3.</strong> Fill out the
                                        Freshman Enrollment Form completely. You
                                        can optionally upload scanned soft
                                        copies of your documents.
                                    </li>
                                    <li className="mb-2">
                                        <strong>4.</strong> Submit your
                                        application. A success window will show
                                        your pending requirements.
                                    </li>
                                    <li>
                                        <strong>5.</strong> Check your email for
                                        the confirmation and proceed to the
                                        Registrar's Office to submit your
                                        physical/hard copy requirements.
                                    </li>
                                </ul>
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* 2. HOW TO REQUEST DOCUMENTS (UPDATED) */}
                        <Accordion.Item
                            eventKey="1"
                            className="border-bottom border-dark rounded-0"
                        >
                            <Accordion.Header className="fw-bold">
                                <i className="bi bi-file-earmark-text-fill me-2"></i>{" "}
                                HOW TO REQUEST DOCUMENTS
                            </Accordion.Header>
                            <Accordion.Body className="bg-light">
                                <ul className="list-unstyled mb-0">
                                    <li className="mb-2">
                                        <strong>1.</strong> Click the{" "}
                                        <b>"REQUEST DOCUMENT"</b> button on the
                                        home page.
                                    </li>
                                    <li className="mb-2">
                                        <strong>2.</strong> Enter your{" "}
                                        <b>LRN</b> and <b>Date of Birth</b> for
                                        security verification.
                                    </li>
                                    <li className="mb-2">
                                        <strong>3.</strong> Select one or more
                                        documents using the checkboxes and state
                                        your purpose.
                                    </li>
                                    <li className="mb-2">
                                        <strong>4.</strong> Submit the request
                                        and check your email.
                                    </li>
                                    <li>
                                        <div
                                            className="alert alert-warning border-dark p-2 mt-2 fw-bold"
                                            style={{ fontSize: "0.85rem" }}
                                        >
                                            <i className="bi bi-info-circle-fill me-1"></i>
                                            Processing Time: Standard documents
                                            take 3 days, while Form 137 and Good
                                            Moral take 7 days. Counting starts
                                            the next day after requesting and
                                            skips weekends and holidays.
                                        </div>
                                    </li>
                                </ul>
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* 3. HOW TO CHECK STATUS */}
                        <Accordion.Item
                            eventKey="2"
                            className="border-bottom border-dark rounded-0"
                        >
                            <Accordion.Header className="fw-bold">
                                <i className="bi bi-search me-2"></i> HOW TO
                                CHECK STATUS
                            </Accordion.Header>
                            <Accordion.Body className="bg-light">
                                <ul className="list-unstyled mb-0">
                                    <li className="mb-2">
                                        <strong>1.</strong> Locate the{" "}
                                        <b>"CHECK ENROLLMENT STATUS"</b> search
                                        bar at the top navigation menu.
                                    </li>
                                    <li className="mb-2">
                                        <strong>2.</strong> Enter your 12-Digit
                                        LRN and press Enter or the search icon.
                                    </li>
                                    <li>
                                        <strong>3.</strong> A window will appear
                                        showing your current Enrollment Status,
                                        Grade Level, and assigned Section.
                                    </li>
                                </ul>
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* 4. HOW TO DOWNLOAD ANNEX (NEW) */}
                        <Accordion.Item
                            eventKey="3"
                            className="border-bottom border-dark rounded-0"
                        >
                            <Accordion.Header className="fw-bold">
                                <i className="bi bi-cloud-arrow-down-fill me-2"></i>{" "}
                                HOW TO DOWNLOAD DEPED ANNEX
                            </Accordion.Header>
                            <Accordion.Body className="bg-light">
                                <ul className="list-unstyled mb-0">
                                    <li className="mb-2">
                                        <strong>1.</strong> Hover or click on
                                        the <b>"ANNEX"</b> link in the top
                                        navigation menu.
                                    </li>
                                    <li className="mb-2">
                                        <strong>2.</strong> Click on the
                                        dropdown item labeled{" "}
                                        <em>
                                            "DEPED Order no. 011, s. 2026 SHS
                                            Application Form Annex E & F"
                                        </em>
                                        .
                                    </li>
                                    <li>
                                        <strong>3.</strong> Confirm the download
                                        when prompted. The files will be
                                        downloaded as a ZIP folder.
                                    </li>
                                </ul>
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* 5. REQUIREMENTS (UPDATED) */}
                        <Accordion.Item eventKey="4" className="rounded-0">
                            <Accordion.Header className="fw-bold">
                                <i className="bi bi-folder-check me-2"></i> WHAT
                                ARE THE REQUIREMENTS?
                            </Accordion.Header>
                            <Accordion.Body className="bg-light">
                                <div className="row fw-bold small">
                                    <div className="col-md-6">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item bg-transparent">
                                                <i className="bi bi-check-lg text-success me-2"></i>{" "}
                                                PSA Birth Certificate
                                            </li>
                                            <li className="list-group-item bg-transparent">
                                                <i className="bi bi-check-lg text-success me-2"></i>{" "}
                                                Report Card (Form 138)
                                            </li>
                                            <li className="list-group-item bg-transparent">
                                                <i className="bi bi-check-lg text-success me-2"></i>{" "}
                                                2x2 Picture (2pcs)
                                            </li>
                                            <li className="list-group-item bg-transparent">
                                                <i className="bi bi-check-lg text-success me-2"></i>{" "}
                                                DEPED Annex E & F
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="col-md-6">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item bg-transparent">
                                                <i className="bi bi-check-lg text-success me-2"></i>{" "}
                                                Form 137 / SF10
                                            </li>
                                            <li className="list-group-item bg-transparent">
                                                <i className="bi bi-check-lg text-success me-2"></i>{" "}
                                                Certificate of Good Moral
                                            </li>
                                            <li className="list-group-item bg-transparent">
                                                <i className="bi bi-check-lg text-success me-2"></i>{" "}
                                                Diploma / Cert of Completion
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
