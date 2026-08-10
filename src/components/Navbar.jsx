import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../App.css";
import Sidebar from "./Sidebar";
import { FaTools, FaTag, FaBell, FaSun, FaMoon, FaUser, FaCrown, FaSignOutAlt } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const isLoggedIn = !!sessionStorage.getItem("userId") && !isAuthPage;
  const userRole = sessionStorage.getItem("userRole") || "user";
  const userName = sessionStorage.getItem("userName") || "";
  const displayName = userName.split(" ")[0]; // First name only

  // Sync state with localStorage and document body attribute
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [logoutToast, setLogoutToast] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchNotifications = async () => {
      try {
        const userId = sessionStorage.getItem("userId") || "";
        const res = await fetch(`/api/notifications?role=${userRole}&user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch(e) { console.error("Notifications fetch fail"); }
    };
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 8000);
    return () => clearInterval(timer);
  }, [isLoggedIn, userRole]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("manualLocationSet");
    localStorage.removeItem("authSession");

    // Purge cached AI greetings
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("aiBanner_")) {
        localStorage.removeItem(k);
      }
    });

    // Show brief toast then redirect (no browser alert)
    setLogoutToast(true);
    setTimeout(() => {
      navigate("/");
      window.location.reload();
    }, 1200);
  };

  const isDark = theme === "dark";
  const isCustomerView = !isLoggedIn || userRole === "user";

  return (
    <>
      <Sidebar />

      {/* Logout toast — shown briefly after logout, no browser alert */}
      {logoutToast && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
          background: "#1e293b", color: "white", padding: "12px 24px",
          borderRadius: "12px", zIndex: 99999, fontWeight: 700, fontSize: "14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "8px",
          animation: "fadeIn 0.2s ease"
        }}>
          👋 Logged out successfully! Redirecting...
        </div>
      )}

      <div
        className="navbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 24px",
          background: "var(--bg-card)",
          color: "var(--text-main)",
          borderBottom: "1.5px solid var(--border-color)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          transition: "all 0.3s ease",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "inherit",
            paddingLeft: isMobile ? "32px" : "48px",
            transition: "padding-left 0.25s ease-in-out"
          }}
        >
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: "22px", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
            <FaTools style={{ color: "var(--primary)" }} />
            <span><span style={{ color: "var(--text-main)" }}>Work</span><span style={{ color: "var(--warning)" }}>zy</span></span>
          </h2>
        </Link>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          
          {/* PLANS & OFFERS NAV LINK */}
          {isCustomerView && (
            <Link
              to="/plans-offers"
              style={{ 
                textDecoration: "none", 
                color: "var(--text-main)", 
                fontWeight: 700, 
                fontSize: isMobile ? "13px" : "14px", 
                display: "flex", 
                alignItems: "center", 
                gap: "6px",
                marginRight: isMobile ? "2px" : "8px",
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-main)"}
            >
              <FaTag size={13} style={{ color: "var(--warning)" }} /> Plans & Offers
            </Link>
          )}

          {/* NOTIFICATION BELL & MESSAGES (Active on Header for both Mobile & Desktop) */}
          {isLoggedIn && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: "none",
                  border: "1.5px solid var(--border-color)",
                  padding: "8px",
                  fontSize: "18px",
                  cursor: "pointer",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--bg-card-hover)",
                  color: "var(--text-main)",
                  transition: "all 0.2s",
                  position: "relative"
                }}
                title="Notifications"
              >
                <FaBell size={16} />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      fontSize: "10px",
                      fontWeight: "bold",
                      borderRadius: "50%",
                      width: "16px",
                      height: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid var(--bg-card)"
                    }}
                  >
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>

              {/* Glassmorphic Dropdown Drawer */}
              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "45px",
                    right: 0,
                    width: isMobile ? "280px" : "320px",
                    maxHeight: "360px",
                    backgroundColor: "var(--bg-card)",
                    backdropFilter: "var(--blur)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "16px",
                    boxShadow: "var(--shadow-3d)",
                    zIndex: 1000,
                    overflowY: "auto",
                    padding: "16px",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--text-main)" }}>Notifications & Messages</h4>
                    <button
                      onClick={async () => {
                        try {
                          const userId = sessionStorage.getItem("userId") || "";
                          const res = await fetch("/api/notifications/mark-read", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ role: userRole, user_id: userId })
                          });
                          if (res.ok) {
                            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                          }
                        } catch(e) { console.error("Mark read error"); }
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {notifications.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", padding: "16px 0" }}>No new messages or notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          style={{
                            padding: "10px",
                            borderRadius: "10px",
                            backgroundColor: n.is_read ? "var(--bg-card-hover)" : "var(--primary-light)",
                            borderLeft: n.is_read ? "3px solid transparent" : "3px solid var(--primary)",
                            fontSize: "12px",
                            transition: "background-color 0.2s"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 800 }}>{n.title || "Notification"}</span>
                            <span style={{ fontSize: "9px", color: "var(--text-secondary)" }}>
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DESKTOP ONLY HEADER CONTROLS (Theme Toggle, Dashboard, Logout) */}
          {!isMobile && (
            <>

              {/* PREMIUM SUN/MOON THEME TOGGLE BUTTON */}
              <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                style={{
                  background: "none",
                  padding: "8px",
                  fontSize: "20px",
                  cursor: "pointer",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--bg-card-hover)",
                  color: "var(--text-main)",
                  transition: "all 0.2s",
                  border: "1.5px solid var(--border-color)",
                  boxShadow: "none"
                }}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <FaSun size={18} style={{ color: "var(--warning)" }} /> : <FaMoon size={18} style={{ color: "var(--primary)" }} />}
              </button>

              {isLoggedIn ? (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

                  {/* Logged-in user greeting chip */}
                  {displayName && (
                    <span style={{
                      fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)",
                      background: "var(--bg-card)", padding: "5px 12px",
                      borderRadius: "20px", border: "1.5px solid var(--border-color)",
                      whiteSpace: "nowrap"
                    }}>
                      Hi, {displayName} 👋
                    </span>
                  )}

                  {/* Worker Dashboard Quick Link */}
                  {sessionStorage.getItem("userRole") === "worker" && (
                    <Link to="/worker-dashboard" state={{ resetTab: "status" }} style={{ textDecoration: "none" }}>
                      <button
                        style={{
                          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                          color: "white", border: "none", padding: "9px 16px", cursor: "pointer",
                          borderRadius: "10px", fontWeight: 700, fontSize: "13.5px",
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          boxShadow: "0 4px 12px rgba(5,150,105,0.3)", transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                      >
                        <FaTools size={13} /> My Panel
                      </button>
                    </Link>
                  )}

                  {/* User Dashboard Quick Link */}
                  {sessionStorage.getItem("userRole") === "user" && (
                    <Link to="/user-dashboard" style={{ textDecoration: "none" }}>
                      <button
                        style={{
                          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          color: "white", border: "none", padding: "9px 16px", cursor: "pointer",
                          borderRadius: "10px", fontWeight: 700, fontSize: "13.5px",
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          boxShadow: "0 4px 12px rgba(79,70,229,0.3)", transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                      >
                        <FaUser size={13} /> My Dashboard
                      </button>
                    </Link>
                  )}

                  {/* Admin Dashboard Quick Link */}
                  {sessionStorage.getItem("userRole") === "admin" && (
                    <Link to="/admin-dashboard" state={{ resetTab: "overview" }} style={{ textDecoration: "none" }}>
                      <button
                        style={{
                          background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                          color: "white", border: "none", padding: "9px 16px", cursor: "pointer",
                          borderRadius: "10px", fontWeight: 700, fontSize: "13.5px",
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          boxShadow: "0 4px 12px rgba(217,119,6,0.3)", transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                      >
                        <FaCrown size={13} /> Admin Panel
                      </button>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    style={{
                      background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                      color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)",
                      padding: "9px 14px", cursor: "pointer", borderRadius: "10px",
                      fontWeight: 800, fontSize: "13px",
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      boxShadow: "0 4px 14px rgba(225,29,72,0.35)", transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                    title="Logout"
                  >
                    <FaSignOutAlt size={14} /> Logout
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <Link to="/login" style={{ textDecoration: "none" }}>
                    <button
                      style={{
                        backgroundColor: "transparent",
                        color: "var(--text-main)",
                        border: "1.5px solid var(--border-color)",
                        borderRadius: "20px",
                        padding: "8px 20px",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Login
                    </button>
                  </Link>

                  <Link to="/signup" style={{ textDecoration: "none" }}>
                    <button
                      style={{
                        backgroundColor: "var(--text-main)",
                        color: "var(--bg-card)",
                        border: "none",
                        borderRadius: "20px",
                        padding: "8px 20px",
                        fontSize: "14px",
                        fontWeight: 700,
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Signup
                    </button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
