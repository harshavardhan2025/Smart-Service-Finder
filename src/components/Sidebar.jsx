import { useState, useEffect } from "react";
import { FaBars, FaHome, FaBook, FaGift, FaUser, FaTimes, FaPercent, FaTools, FaHeadset } from "react-icons/fa";
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
  const isLoggedIn = !!sessionStorage.getItem("userId");
  const userRole = sessionStorage.getItem("userRole");

  const links = [
    { to: "/", icon: <FaHome />, label: "Home Page" }
  ];

  let sidebarSubtitle = "Explore Local Professionals";

  if (isLoggedIn) {
    if (userRole === "user") {
      sidebarSubtitle = "Customer Navigation";
      links.push(
        { to: "/user-dashboard", icon: <FaUser />, label: "My Dashboard" },
        { to: "/my-bookings", icon: <FaBook />, label: "My Bookings" },
        { to: "/plans-offers", icon: <FaPercent />, label: "Plans & Offers" },
        { to: "/reviews", icon: <FaGift />, label: "Reviews & Rewards" },
        { to: "/support", icon: <FaHeadset />, label: "Get Support" },
        { to: "/profile", icon: <FaUser />, label: "My Profile" }
      );
    } else if (userRole === "worker") {
      sidebarSubtitle = "Worker Navigation";
      links.push(
        { to: "/worker-dashboard", icon: <FaUser />, label: "Worker Dashboard" },
        { to: "/worker-dashboard", state: { resetTab: "profile" }, icon: <FaUser />, label: "My Profile" }
      );
    } else if (userRole === "admin") {
      sidebarSubtitle = "Administrator Navigation";
      links.push(
        { to: "/admin-dashboard", icon: <FaUser />, label: "Admin Dashboard" }
      );
    }
  } else {
    links.push(
      { to: "/plans-offers", icon: <FaPercent />, label: "Plans & Offers" }
    );
  }

  const handleLogout = () => {
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("authToken");
    localStorage.removeItem("manualLocationSet");
    localStorage.removeItem("authSession");
    alert("Logged out successfully! 👋");
    window.location.href = "/";
  };

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
        <div style={{ marginBottom: "30px", paddingTop: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "10px", whiteSpace: "nowrap" }}>
            <FaTools style={{ color: "var(--primary)" }} />
            <span>Work<span style={{ color: "#c1851dff" }}>zy</span></span>
          </h2>
          <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
            {sidebarSubtitle}
          </p>
        </div>

        {/* Nav Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, overflowY: "auto" }}>
          {links.map(({ to, state, icon, label }) => (
            <Link
              key={label}
              to={to}
              state={state}
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

          {/* Dynamic Login/Signup/Logout for Mobile/Sidebar view */}
          <div style={{ margin: "20px 0 0 0", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" }}>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Logout
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link to="/login" onClick={() => setOpen(false)} style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "transparent",
                      color: "white",
                      border: "1px solid var(--border-color)",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Login
                  </button>
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)} style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "var(--primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Signup
                  </button>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <p style={{ fontSize: "11px", color: "var(--text-secondary)", textAlign: "center", margin: 0, paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          Workzy © 2026
        </p>
      </div>
    </div>
  );
}

export default Sidebar;
