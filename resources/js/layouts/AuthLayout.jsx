import React from "react";
import { Outlet, useLocation } from "react-router-dom";

export default function AuthLayout() {
    const location = useLocation();

    let leftConfig = {
        bg: "#F4D03F",
        title: "SMARTENROLL",
        subtitle: "Official HFJLSJI Enrollment System",
        img: "/images/login.svg",
    };

    if (location.pathname.includes("forgot-password")) {
        leftConfig = {
            bg: "#79C9C5",
            title: "ACCOUNT RECOVERY",
            subtitle: "Don't worry, we got you covered.",
            img: "/images/forgot.svg",
        };
    } else if (location.pathname.includes("password-reset")) {
        leftConfig = {
            bg: "#F96E5B",
            title: "SECURE YOUR ACCOUNT",
            subtitle: "Create a strong password.",
            img: "/images/reset.svg",
        };
    } else if (location.pathname.includes("verify-email")) {
        leftConfig = {
            bg: "#3F9AAE",
            title: "VERIFICATION",
            subtitle: "Secure your access.",
            img: "/images/login.svg",
        };
    }

    return (
        <div className="container-fluid p-0">
            <div className="row g-0 vh-100">
                <div
                    className="col-md-6 d-none d-md-flex flex-column justify-content-center align-items-center p-5"
                    style={{
                        backgroundColor: leftConfig.bg,
                        transition: "background-color 0.5s ease",
                    }}
                >
                    <h1
                        className="display-4 fw-bold mb-3 text-center text-white font-monospace"
                        style={{ textShadow: "3px 3px 0 #000" }}
                    >
                        {leftConfig.title}
                    </h1>
                    <p className="lead fw-bold mb-4 text-center text-dark font-monospace">
                        {leftConfig.subtitle}
                    </p>
                    <img
                        src={leftConfig.img}
                        alt="Illustration"
                        className="img-fluid fade-in"
                        style={{
                            maxWidth: "80%",
                            filter: "drop-shadow(4px 4px 0 #000)",
                        }}
                    />
                </div>

                <div
                    className="col-12 col-md-6 d-flex justify-content-center align-items-center p-4"
                    style={{ backgroundColor: "var(--color-bg)" }}
                >
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
