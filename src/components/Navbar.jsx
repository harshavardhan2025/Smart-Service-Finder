import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../App.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const isLoggedIn = !!localStorage.getItem("userRole") && !isAuthPage;
  const userRole = localStorage.getItem("userRole") || "user";

  // Sync state with localStorage and document body attribute
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    alert("Logged out successfully! 👋");
    navigate("/");
  };

  const isDark = theme === "dark";

  // Shift logo to the right ONLY when sidebar hamburger menu is rendered (customers/non-logged users)
  const isCustomerView = !isLoggedIn || userRole === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        backgroundColor: "var(--bg-card)",
        color: "var(--text-primary)",
        borderBottom: "1px solid var(--border-color)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
      }}
    >
      <Link 
        to="/" 
        style={{ 
          textDecoration: "none", 
          color: "inherit", 
          paddingLeft: isCustomerView ? "48px" : "0px", 
          transition: "padding-left 0.25s ease-in-out" 
        }}
      >
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: "22px", letterSpacing: "-0.5px" }}>
          🛠️ Service<span style={{ color: "var(--primary)" }}>Hub</span>
        </h2>
      </Link>

      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        
        {/* PLANS & OFFERS NAV LINK */}
        <Link 
          to="/plans-offers" 
          style={{ 
            textDecoration: "none", 
            color: "var(--text-secondary)", 
            fontWeight: 700, 
            fontSize: "14px", 
            display: "flex", 
            alignItems: "center", 
            gap: "6px",
            marginRight: "8px",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          🏷️ Plans & Offers
        </Link>

        {/* PREMIUM SUN/MOON THEME TOGGLE BUTTON */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          style={{
            background: "none",
            border: "none",
            padding: "8px",
            fontSize: "20px",
            cursor: "pointer",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--border-color)",
            color: "var(--text-primary)",
            transition: "all 0.2s"
          }}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {isLoggedIn ? (
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* Worker Dashboard Quick Link */}
            {localStorage.getItem("userRole") === "worker" && (
              <Link to="/worker-dashboard" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    cursor: "pointer",
                    borderRadius: "8px",
                    fontWeight: 600
                  }}
                >
                  🛠️ Worker Panel
                </button>
              </Link>
            )}

            {/* User Dashboard Quick Link */}
            {localStorage.getItem("userRole") === "user" && (
              <Link to="/user-dashboard" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    cursor: "pointer",
                    borderRadius: "8px",
                    fontWeight: 600
                  }}
                >
                  👤 My Dashboard
                </button>
              </Link>
            )}

            {/* Admin Dashboard Quick Link */}
            {localStorage.getItem("userRole") === "admin" && (
              <Link to="/admin-dashboard" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    cursor: "pointer",
                    borderRadius: "8px",
                    fontWeight: 600
                  }}
                >
                  👑 Admin Panel
                </button>
              </Link>
            )}
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                padding: "10px 18px",
                cursor: "pointer",
                borderRadius: "8px",
                fontWeight: 600
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link to="/login">
              <button
                style={{
                  backgroundColor: "transparent",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "none"
                }}
              >
                Login
              </button>
            </Link>

            <Link to="/signup">
              <button
                style={{
                  backgroundColor: "var(--primary)",
                  color: "white"
                }}
              >
                Signup
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;
