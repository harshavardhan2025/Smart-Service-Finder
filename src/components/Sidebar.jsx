import { useState, useEffect } from "react";
import { FaBars, FaHome, FaBook, FaGift, FaUser, FaTimes, FaPercent } from "react-icons/fa";
import { Link } from "react-router-dom";

function Sidebar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Keep theme synced with the global system toggle
  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000); // Quick check to sync instantly
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const isDark = theme === "dark";

  return (
    <div>
      {/* Premium Hamburger Button aligned perfectly inside Navbar height */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          top: "16px",
          left: "24px",
          zIndex: 1100,
          background: "transparent",
          border: "none",
          fontSize: "22px",
          color: isDark ? "#f8fafc" : "#1e293b",
          cursor: "pointer",
          padding: "6px 10px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease-in-out"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
          e.currentTarget.style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.transform = "scale(1)";
        }}
        aria-label="Toggle sidebar"
      >
        {open ? <FaTimes /> : <FaBars />}
      </button>

      {/* Backdrop with modern blur effect */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 999,
            backdropFilter: "blur(4px)",
            transition: "all 0.3s"
          }}
        />
      )}

      {/* Sidebar Panel */}
      <div
        style={{
          width: "280px",
          height: "100vh",
          background: isDark ? "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" : "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          color: "white",
          position: "fixed",
          top: 0,
          left: open ? 0 : "-300px",
          padding: "36px 24px",
          boxSizing: "border-box",
          zIndex: 1000,
          boxShadow: open ? "8px 0 32px rgba(0,0,0,0.4)" : "none",
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Logo / Title */}
        <div style={{ marginBottom: "40px", paddingTop: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
            🛠️ Service<span style={{ color: "var(--primary)" }}>Hub</span>
          </h2>
          <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Navigate Customer Dashboard
          </p>
        </div>

        {/* Nav Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          {[
            { to: "/", icon: <FaHome />, label: "Home Page" },
            { to: "/my-bookings", icon: <FaBook />, label: "My Bookings" },
            { to: "/plans-offers", icon: <FaPercent />, label: "Plans & Offers" },
            { to: "/reviews", icon: <FaGift />, label: "Reviews & Rewards" },
            { to: "/profile", icon: <FaUser />, label: "My Profile" },
          ].map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              style={{
                color: "#e2e8f0",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 16px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 600,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#e2e8f0";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <span style={{ fontSize: "18px", display: "flex", alignItems: "center" }}>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <p style={{ fontSize: "11px", color: "#64748b", textAlign: "center", margin: 0, paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          ServiceHub © 2026
        </p>
      </div>
    </div>
  );
}

export default Sidebar;
