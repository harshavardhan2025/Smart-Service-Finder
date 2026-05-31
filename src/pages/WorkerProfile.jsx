import { Link, useNavigate } from "react-router-dom";

function WorkerProfile() {
  const navigate = useNavigate();
  // Retrieve the selected worker details from localStorage, with a beautiful default fallback
  const worker = JSON.parse(localStorage.getItem("selected_worker")) || {
    name: "Dr. Priya Sen",
    service: "Doctors & Medical",
    rating: 4.8,
    distance: "1.5 KM",
    city: "Bangalore",
    price: 599
  };

  const calculatedPrice = worker.price || (worker.service.includes("Carpentry") ? 399 : worker.service.includes("Plumbing") ? 299 : worker.service.includes("Doctors") ? 599 : 349);

  const handleInitiateBooking = () => {
    // 🛡️ FRONT-LINE FIREWALL: Verify valid user credentials before releasing slots!
    if (!sessionStorage.getItem("userId")) {
       alert("🔑 Sign-in Required!\n\nPlease login first to reserve this worker and complete the service schedule.");
       navigate("/login");
       return;
    }
    navigate("/booking");
  };

  return (
    <div
      className="fade-in dashboard-container"
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Breadcrumb / Back button */}
        <Link
          to="/"
          style={{
            color: "#64748b",
            textDecoration: "none",
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "24px",
            fontWeight: 600
          }}
        >
          ← Back to Services
        </Link>

        {/* Premium Profile card */}
        <div
          className="premium-card"
          style={{
            padding: 0,
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              background: "var(--primary-grad)",
              padding: "40px 32px",
              color: "white"
            }}
          >
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              {/* Profile Avatar Badge */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: 800,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
                }}
              >
                👤
              </div>
              <div>
                <span
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "inline-block",
                    marginBottom: "8px"
                  }}
                >
                  Verified Professional ✅
                </span>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 800 }}>
                  {worker.name}
                </h2>
              </div>
            </div>
          </div>

          {/* Profile details */}
          <div style={{ padding: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Specialization</label>
                <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{worker.service}</p>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Location / City</label>
                <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>🏙️ {worker.city}</p>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Proximity Distance</label>
                <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>📍 {worker.distance || "1.0 KM"} Away</p>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Overall Rating</label>
                <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: 700, color: "#eab308" }}>⭐ {worker.rating} / 5.0</p>
              </div>
            </div>

            {/* Price section */}
            <div
              style={{
                backgroundColor: "var(--primary-light)",
                border: "1.5px solid var(--primary)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "var(--primary-dark)", fontWeight: 700, textTransform: "uppercase" }}>Standard Service Rate</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "22px", fontWeight: 800, color: "var(--primary-dark)" }}>
                  ₹{calculatedPrice} <span style={{ fontSize: "13px", fontWeight: 500 }}>/ visit</span>
                </p>
              </div>
              <div style={{ fontSize: "32px" }}>💰</div>
            </div>

            <div style={{ marginBottom: "28px" }} />

            {/* Badges / Guarantees */}
            <div style={{ borderTop: "1.5px solid var(--border-color)", paddingTop: "24px", marginBottom: "32px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px 0" }}>Hub Guarantees</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <span>🛡️</span> Background verified & certified professional
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <span>✨</span> Equipped with modern, sanitized equipment
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <span>⏱️</span> On-time service arrival guarantee
                </div>
              </div>
            </div>

            {/* Booking action button */}
            {sessionStorage.getItem("userId") ? (
              <button
                onClick={handleInitiateBooking}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "var(--primary-grad)",
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Proceed to Booking & Scheduling →
              </button>
            ) : (
              <button
                onClick={() => {
                  alert("🔑 Sign-in Required!\n\nPlease login first to reserve this worker and complete the service schedule.");
                  navigate("/login");
                }}
                className="btn-secondary"
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "block",
                  textAlign: "center",
                  boxSizing: "border-box"
                }}
              >
                🔒 Login to Book & Schedule
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerProfile;
