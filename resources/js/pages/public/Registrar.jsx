import React from "react";

export default function Registrar() {
    const staffMembers = [
        {
            name: "Jose Sixto González Dantes III",
            position: "Chief Registrar",
            role: "head",
            image: "/images/1.jpg",
        },
        {
            name: "Maria Altheyah Sofia Olivar Ablan",
            position: "Assistant Registrar",
            role: "staff",
            image: "/images/2.jpg",
        },
        {
            name: "Jason Joseph Francis Carlos Diaz Ejercito",
            position: "Records Officer",
            role: "staff",
            image: "/images/3.jpg",
        },
    ];

    const head = staffMembers.find((s) => s.role === "head");
    const staff = staffMembers.filter((s) => s.role === "staff");

    const StaffCard = ({ person }) => (
        <div
            className="card-retro h-100 border-3 border-dark bg-white"
            onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translate(-4px, -4px)")
            }
            onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translate(0, 0)")
            }
        >
            <div className="card-body text-center p-4">
                <div
                    className="mb-4 mx-auto border border-3 border-dark rounded-circle overflow-hidden bg-light"
                    style={{ width: "120px", height: "120px" }}
                >
                    <img
                        src={person.image}
                        alt={person.name}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                person.name,
                            )}&background=3F9AAE&color=fff&size=120&bold=true`;
                        }}
                    />
                </div>

                <h5 className="fw-black text-uppercase mb-1">{person.name}</h5>
                <span
                    className={`badge border border-dark rounded-0 px-3 py-2 shadow-sm btn-action-retro ${
                        person.role === "head"
                            ? "bg-warning text-dark"
                            : "bg-dark text-white"
                    }`}
                >
                    {person.position}
                </span>
            </div>
        </div>
    );

    return (
        <div className="container py-5 font-monospace">
            <div className="text-center mb-5">
                <h1
                    className="fw-black text-uppercase mb-2"
                    style={{ textShadow: "2px 2px 0px #F4D03F" }}
                >
                    <i className="bi bi-people-fill me-3"></i>Our Registrar Team
                </h1>
                <p className="text-muted fw-bold">
                    Dedicated professionals ready to assist with your academic
                    records.
                </p>
            </div>

            <div className="row justify-content-center g-4 mb-4">
                <div className="col-md-4 col-sm-8">
                    <StaffCard person={head} />
                </div>
            </div>

            <div className="row justify-content-center g-4">
                {staff.map((person, idx) => (
                    <div className="col-md-4 col-sm-6" key={idx}>
                        <StaffCard person={person} />
                    </div>
                ))}
            </div>
        </div>
    );
}
