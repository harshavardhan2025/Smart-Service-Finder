import { Link, useNavigate } from "react-router-dom";
import { FaStar, FaMapMarkerAlt, FaCheckCircle, FaBolt, FaClock, FaLock, FaShieldAlt, FaMagic } from "react-icons/fa";

function WorkerProfile() {
  const navigate = useNavigate();
  const worker = JSON.parse(localStorage.getItem("selected_worker")) || {
    name: "Dr. Priya Sen",
    service: "Doctors & Medical",
    rating: 4.8,
    distance: "1.5 KM",
    city: "Bangalore",
    price: 599
  };

  const calculatedPrice = worker.price || (worker.service?.includes("Carpentry") ? 399 : worker.service?.includes("Plumbing") ? 299 : worker.service?.includes("Doctors") ? 599 : 349);

  const getResponseTime = (distanceKm) => {
    if (distanceKm === undefined) return "< 15 Mins (Fast)";
    if (distanceKm < 1) return "< 15 Mins (Fast)";
    if (distanceKm < 3) return "< 30 Mins (Standard)";
    if (distanceKm < 8) return "< 45 Mins (Moderate)";
    return "< 60 Mins (Extended)";
  };

  const handleInitiateBooking = () => {
    const userId = sessionStorage.getItem("userId");
    const userRole = sessionStorage.getItem("userRole");
    if (!userId || userRole !== "user") {
       if (userId) {
         alert("🔑 Customer Account Required!\n\nLogging you out now. Please log in with a customer account to schedule bookings.");
         sessionStorage.clear();
         localStorage.removeItem("userLocation");
         localStorage.removeItem("userCity");
         localStorage.removeItem("userCoordsLat");
         localStorage.removeItem("userCoordsLng");
       } else {
         alert("🔑 Sign-in Required!\n\nPlease login first to reserve this worker and complete the service schedule.");
       }
       navigate("/login");
       return;
    }
    navigate("/booking");
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    const cleanParts = parts.filter(p => !/^(dr|mr|ms|mrs)\.?$/i.test(p));
    if (cleanParts.length === 0) return name.charAt(0).toUpperCase();
    if (cleanParts.length === 1) return cleanParts[0].charAt(0).toUpperCase();
    return (cleanParts[0].charAt(0) + cleanParts[1].charAt(0)).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      "#0d9488", // Teal
      "#0284c7", // Sky
      "#4f46e5", // Indigo
      "#7c3aed", // Violet
      "#c026d3", // Fuchsia
      "#db2777", // Pink
      "#e11d48", // Rose
      "#2563eb", // Blue
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
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
            color: "var(--text-secondary)",
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
            position: "relative"
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              background: "var(--primary-grad)",
              padding: "40px 32px",
              color: "white",
              position: "relative"
            }}
          >
            {/* Verified Professional Badge */}
            <span
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                backgroundColor: "var(--primary)",
                backdropFilter: "blur(4px)",
                color: "white",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                border: "1px solid rgba(255, 255, 255, 0.15)"
              }}
            >
              Verified Professional <FaCheckCircle size={12} />
            </span>

            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              {/* Profile Avatar Badge with Color-Coded Initials */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: getAvatarColor(worker.name),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 800,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  color: "white",
                  border: "2px solid white",
                  flexShrink: 0
                }}
              >
                {getInitials(worker.name)}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "white" }}>
                  {worker.name}
                </h2>
              </div>
            </div>
          </div>

          {/* Profile details */}
          <div style={{ padding: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 20px", marginBottom: "28px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>Specialization</label>
                <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  {worker.service}
                </p>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>Location & Proximity</label>
                <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaMapMarkerAlt size={14} style={{ color: "var(--danger)" }} /> {worker.distanceKm !== undefined ? (worker.distanceKm < 0.5 ? "below 0.5 KM" : `${worker.distanceKm} KM`) : (worker.distance || "1.0 KM")} Away ({worker.city})
                </p>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>Overall Rating</label>
                <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: 700, color: "var(--warning)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaStar size={14} style={{ color: "var(--warning)" }} /> {worker.rating || "4.5"} / 5.0
                </p>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>Response Time</label>
                <p style={{ margin: "4px 0 0 0", fontSize: "16px", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaBolt size={14} style={{ color: "var(--warning)" }} /> {getResponseTime(worker.distanceKm)}
                </p>
              </div>
            </div>

            {/* Price section */}
            <div
              style={{
                backgroundColor: "var(--primary-light)",
                border: "1.5px solid var(--primary)",
                borderRadius: "16px",
                padding: "16px 20px",
                marginBottom: "28px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <span style={{ fontSize: "14px", color: "var(--primary-dark)", fontWeight: 600 }}>
                Standard Service Rate:
              </span>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--primary-dark)", display: "flex", alignItems: "center" }}>
                ₹{calculatedPrice}
                <span style={{ fontSize: "14px", fontWeight: 500, marginLeft: "4px", color: "var(--text-secondary)" }}>/ visit</span>
              </span>
            </div>

            <div style={{ marginBottom: "28px" }} />

            {/* Badges / Guarantees */}
            <div style={{ borderTop: "1.5px solid var(--border-color)", paddingTop: "24px", marginBottom: "32px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px 0" }}>Hub Guarantees</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <FaShieldAlt size={14} style={{ color: "var(--success)" }} /> Background verified & certified professional
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <FaMagic size={14} style={{ color: "#3b82f6" }} /> Equipped with modern, sanitized equipment
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <FaClock size={14} style={{ color: "var(--warning)" }} /> On-time service arrival guarantee
                </div>
              </div>
            </div>

            {/* Booking action button */}
            {sessionStorage.getItem("userId") && sessionStorage.getItem("userRole") === "user" ? (
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
                  boxShadow: "0 4px 14px rgba(49, 82, 91, 0.25)"
                }}
              >
                Proceed to Booking & Scheduling →
              </button>
            ) : (
              <button
                onClick={handleInitiateBooking}
                className="btn-secondary"
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxSizing: "border-box"
                }}
              >
                <FaLock size={14} /> Login to Book & Schedule
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerProfile;
