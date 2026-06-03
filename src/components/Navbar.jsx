import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../App.css";
import Sidebar from "./Sidebar";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const isLoggedIn = !!sessionStorage.getItem("userId") && !isAuthPage;
  const userRole = sessionStorage.getItem("userRole") || "user";

  // Sync state with localStorage and document body attribute
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("authToken");
    alert("Logged out successfully! 👋");
    navigate("/");
  };

  const isDark = theme === "dark";
  const isCustomerView = !isLoggedIn || userRole === "user";

  return (
    <>
      <Sidebar />
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
            paddingLeft: "48px", 
            transition: "padding-left 0.25s ease-in-out" 
          }}
        >
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: "22px", letterSpacing: "-0.5px" }}>
            🛠️ Work<span style={{ color: "var(--primary)" }}>zy</span>
          </h2>
        </Link>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          
          {/* PLANS & OFFERS NAV LINK */}
          {isCustomerView && !isMobile && (
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
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
            >
              🏷️ Plans & Offers
            </Link>
          )}

          {isLoggedIn && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
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
                  transition: "all 0.2s",
                  position: "relative"
                }}
                title="Notifications"
              >
                🔔
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
                    width: "320px",
                    maxHeight: "360px",
                    backgroundColor: "rgba(255, 255, 255, 0.85)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                    overflowY: "auto",
                    padding: "16px",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>Notifications</h4>
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
                      <p style={{ margin: 0, fontSize: "12px", color: "#64748b", textAlign: "center", padding: "16px 0" }}>No new notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          style={{
                            padding: "10px",
                            borderRadius: "10px",
                            backgroundColor: n.is_read ? "rgba(0,0,0,0.02)" : "rgba(139, 92, 246, 0.08)",
                            borderLeft: n.is_read ? "3px solid transparent" : "3px solid #8b5cf6",
                            fontSize: "12px",
                            transition: "background-color 0.2s"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 800 }}>{n.title || "Notification"}</span>
                            <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: "#475569", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
            !isMobile && (
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                 {/* Worker Dashboard Quick Link */}
                 {sessionStorage.getItem("userRole") === "worker" && (
                   <Link to="/worker-dashboard" state={{ resetTab: "status" }} style={{ textDecoration: "none" }}>
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
                 {sessionStorage.getItem("userRole") === "user" && (
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
                 {sessionStorage.getItem("userRole") === "admin" && (
                   <Link to="/admin-dashboard" state={{ resetTab: "overview" }} style={{ textDecoration: "none" }}>
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
            )
          ) : (
            !isMobile && (
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
            )
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
