import React from "react";
import { Modal, Accordion } from "react-bootstrap";

export default function AuthHelpModal({ show, onClose }) {
    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            size="lg"
            contentClassName="card-retro border-2 border-dark shadow rounded-0 font-monospace"
        >
            <div
                className="modal-header border-bottom border-dark text-white rounded-0"
                style={{
                    backgroundColor: "var(--color-primary)",
                }}
            >
                <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-shield-lock-fill text-warning fs-4"></i>
                    <h5 className="modal-title fw-bold m-0 ls-1">
                        AUTHENTICATION GUIDE
                    </h5>
                </div>
                <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={onClose}
                ></button>
            </div>

            <div className="modal-body bg-light p-4">
                <p className="text-muted small mb-4 text-center">
                    Having trouble accessing the system? Check our updated
                    security guides below.
                </p>

                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0" className="rounded-0">
                        <Accordion.Header>
                            <i className="bi bi-box-arrow-in-right me-2"></i>{" "}
                            HOW TO LOGIN (ADMIN, HEAD & STAFF)
                        </Accordion.Header>
                        <Accordion.Body className="bg-white">
                            <ul className="list-unstyled mb-0">
                                <li className="mb-2">
                                    <span className="step-badge">1</span>
                                    Enter your registered <b>Email Address</b>.
                                </li>
                                <li className="mb-2">
                                    <span className="step-badge">2</span>
                                    Enter your secure <b>Password</b>.
                                </li>
                                <li className="mb-2">
                                    <span className="step-badge">3</span>
                                    Check the <b>reCAPTCHA</b> box ("I'm not a
                                    robot") for security verification.
                                </li>
                                <li className="mb-2">
                                    <span className="step-badge">4</span>
                                    (Optional) Check <b>"Remember Me"</b> to
                                    stay logged in even after closing your
                                    browser.
                                </li>
                                <li>
                                    <span className="step-badge">5</span>
                                    Click <b>"ACCESS PORTAL"</b>. You will be
                                    securely redirected to your dashboard based
                                    on your assigned role.
                                </li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="1" className="rounded-0">
                        <Accordion.Header>
                            <i className="bi bi-key-fill me-2"></i> I FORGOT MY
                            PASSWORD
                        </Accordion.Header>
                        <Accordion.Body className="bg-white">
                            <ul className="list-unstyled mb-0">
                                <li className="mb-2">
                                    <span className="step-badge">1</span>
                                    Click the <b>"Forgot Password?"</b> link
                                    below the login form.
                                </li>
                                <li className="mb-2">
                                    <span className="step-badge">2</span>
                                    Enter your registered email and complete the{" "}
                                    <b>reCAPTCHA</b> security check.
                                </li>
                                <li className="mb-2">
                                    <span className="step-badge">3</span>
                                    Check your email inbox (and spam folder) for
                                    the secure <b>Reset Link</b>.
                                </li>
                                <li>
                                    <span className="step-badge">4</span>
                                    Click the link and create a new password.
                                    <br />
                                    <small className="text-danger fw-bold mt-1 d-block">
                                        *Note: Passwords must now contain at
                                        least 8 characters, including 1
                                        uppercase letter, 1 lowercase letter, 1
                                        number, and 1 special character.
                                    </small>
                                </li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="2" className="rounded-0">
                        <Accordion.Header>
                            <i className="bi bi-envelope-check-fill me-2"></i>{" "}
                            EMAIL NOT VERIFIED?
                        </Accordion.Header>
                        <Accordion.Body className="bg-white">
                            <p className="small text-muted mb-2">
                                For system security, all accounts must verify
                                their email address before accessing the portal.
                            </p>
                            <ul className="list-unstyled mb-0">
                                <li className="mb-2">
                                    <span className="step-badge">1</span>
                                    If you attempt to log in with an unverified
                                    email, you will be automatically redirected
                                    to the <b>Verification Page</b>.
                                </li>
                                <li className="mb-2">
                                    <span className="step-badge">2</span>
                                    Click the <b>
                                        "RESEND VERIFICATION LINK"
                                    </b>{" "}
                                    button to receive a new secure link.
                                </li>
                                <li>
                                    <span className="step-badge">3</span>
                                    Open your email inbox and click the provided
                                    link to activate your account.
                                </li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </div>

            <div className="modal-footer bg-white border-top border-dark d-flex justify-content-center py-3 rounded-0">
                <button
                    className="btn btn-dark rounded-0 fw-bold px-5 btn-retro-effect"
                    onClick={onClose}
                >
                    GOT IT, THANKS!
                </button>
            </div>
        </Modal>
    );
}
