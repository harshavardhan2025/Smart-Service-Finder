import { useEffect, useState } from "react";
import {
  FaBars,
  FaHome,
  FaBook,
  FaGift,
  FaUser,
  FaTimes,
  FaPercent,
  FaTools,
  FaHeadset,
  FaMoon,
  FaSun,
  FaSignOutAlt,
} from "react-icons/fa";
import { NavLink, Link } from "react-router-dom";

function Sidebar() {
  const [open, setOpen] = useState(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth <= 768
  );

  const [authVersion, setAuthVersion] = useState(0);

  /* =========================================================
     RESPONSIVE SCREEN DETECTION
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =========================================================
     INITIALIZE THEME
  ========================================================= */

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("theme") || "light";

    setTheme(savedTheme);

    document.documentElement.setAttribute(
      "data-theme",
      savedTheme
    );
  }, []);

  /* =========================================================
     SYNC THEME FROM OTHER COMPONENTS / TABS
  ========================================================= */

  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme =
        localStorage.getItem("theme") || "light";

      setTheme(savedTheme);

      document.documentElement.setAttribute(
        "data-theme",
        savedTheme
      );
    };

    window.addEventListener(
      "workzy-theme-change",
      handleThemeChange
    );

    window.addEventListener(
      "storage",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "workzy-theme-change",
        handleThemeChange
      );

      window.removeEventListener(
        "storage",
        handleThemeChange
      );
    };
  }, []);

  /* =========================================================
     CLOSE SIDEBAR WHEN ESCAPE IS PRESSED
  ========================================================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* =========================================================
     AUTH INFORMATION
  ========================================================= */

  const isLoggedIn =
    !!sessionStorage.getItem("userId");

  const userRole =
    sessionStorage.getItem("userRole") || "";

  /* =========================================================
     TOGGLE SIDEBAR
  ========================================================= */

  const toggleSidebar = () => {
    setOpen((previous) => !previous);
  };

  const closeSidebar = () => {
    setOpen(false);
  };

  /* =========================================================
     THEME TOGGLE
  ========================================================= */

  const toggleTheme = () => {
    const nextTheme =
      theme === "light" ? "dark" : "light";

    setTheme(nextTheme);

    localStorage.setItem(
      "theme",
      nextTheme
    );

    document.documentElement.setAttribute(
      "data-theme",
      nextTheme
    );

    /*
      Custom event is required because the normal
      "storage" event does not fire in the same tab
      that changed localStorage.
    */
    window.dispatchEvent(
      new Event("workzy-theme-change")
    );
  };

  /* =========================================================
     NAVIGATION LINKS
  ========================================================= */

  const links = [
    {
      to: "/",
      icon: <FaHome />,
      label: "Home Page",
    },
  ];

  let sidebarSubtitle =
    "Explore Local Professionals";

  if (isLoggedIn) {
    /* ================= USER ================= */

    if (userRole === "user") {
      sidebarSubtitle =
        "Customer Navigation";

      links.push(
        {
          to: "/user-dashboard",
          icon: <FaUser />,
          label: "My Dashboard",
        },
        {
          to: "/my-bookings",
          icon: <FaBook />,
          label: "My Bookings",
        },
        {
          to: "/plans-offers",
          icon: <FaPercent />,
          label: "Plans & Offers",
        },
        {
          to: "/reviews",
          icon: <FaGift />,
          label: "Reviews & Rewards",
        },
        {
          to: "/support",
          icon: <FaHeadset />,
          label: "Get Support",
        },
        {
          to: "/profile",
          icon: <FaUser />,
          label: "My Profile",
        }
      );
    }

    /* ================= WORKER ================= */

    else if (userRole === "worker") {
      sidebarSubtitle =
        "Worker Navigation";

      links.push(
        {
          to: "/worker-dashboard",
          icon: <FaUser />,
          label: "Worker Dashboard",
        },
        {
          to: "/worker-dashboard",
          state: {
            resetTab: "profile",
          },
          icon: <FaUser />,
          label: "My Profile",
        }
      );
    }

    /* ================= ADMIN ================= */

    else if (userRole === "admin") {
      sidebarSubtitle =
        "Administrator Navigation";

      links.push({
        to: "/admin-dashboard",
        icon: <FaUser />,
        label: "Admin Dashboard",
      });
    }
  }

  /* ================= GUEST ================= */

  else {
    links.push({
      to: "/plans-offers",
      icon: <FaPercent />,
      label: "Plans & Offers",
    });
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("authToken");

    localStorage.removeItem(
      "manualLocationSet"
    );

    localStorage.removeItem(
      "authSession"
    );

    setOpen(false);

    setAuthVersion(
      (previous) => previous + 1
    );

    /*
      Use a small timeout so the sidebar closes
      before navigating.
    */
    setTimeout(() => {
      window.location.href = "/";
    }, 50);
  };

  /* =========================================================
     ACTIVE LINK STYLE
  ========================================================= */

  const getLinkStyle = ({ isActive }) => ({
    color: isActive
      ? "#ffffff"
      : "#cbd5e1",

    textDecoration: "none",

    display: "flex",
    alignItems: "center",

    gap: "14px",

    padding: "13px 15px",

    borderRadius: "12px",

    fontSize: "14.5px",

    fontWeight: isActive
      ? 800
      : 600,

    background: isActive
      ? "linear-gradient(135deg, rgba(49,82,91,0.95), rgba(31,53,59,0.95))"
      : "transparent",

    border:
      isActive
        ? "1px solid rgba(179,222,229,0.18)"
        : "1px solid transparent",

    boxShadow: isActive
      ? "0 5px 14px rgba(0,0,0,0.18)"
      : "none",

    transition:
      "all 0.2s cubic-bezier(0.4,0,0.2,1)",

    width: "100%",

    boxSizing: "border-box",
  });

  return (
    <>
      {/* =====================================================
          GLOBAL SIDEBAR STYLES
      ===================================================== */}

      <style>{`
        .workzy-sidebar-link:hover {
          background: rgba(255,255,255,0.08) !important;
          color: #ffffff !important;
          transform: translateX(4px);
        }

        .workzy-sidebar-link:focus-visible {
          outline: 2px solid #B3DEE5;
          outline-offset: 2px;
        }

        .workzy-sidebar-action:hover {
          background: rgba(255,255,255,0.12) !important;
        }

        .workzy-sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .workzy-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .workzy-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 10px;
        }

        .workzy-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.25);
        }

        @media (max-width: 768px) {
          .workzy-sidebar-panel {
            width: min(300px, 88vw) !important;
          }
        }
      `}</style>

      {/* =====================================================
          HAMBURGER / CLOSE BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={
          open
            ? "Close navigation menu"
            : "Open navigation menu"
        }
        aria-expanded={open}
        style={{
          position: "fixed",

          top: isMobile
            ? "10px"
            : "12px",

          left: open
            ? "calc(min(280px, 88vw) - 48px)"
            : isMobile
              ? "10px"
              : "18px",

          zIndex: 1102,

          width: "36px",
          height: "36px",

          padding: 0,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          background:
            "rgba(255,255,255,0.12)",

          color: "#ffffff",

          border:
            "1px solid rgba(255,255,255,0.22)",

          borderBottom:
            "1px solid rgba(255,255,255,0.22)",

          borderRadius: "9px",

          cursor: "pointer",

          boxShadow:
            "0 4px 12px rgba(0,0,0,0.18)",

          backdropFilter:
            "blur(10px)",

          transition:
            "all 0.2s ease",
        }}
      >
        {open ? (
          <FaTimes size={16} />
        ) : (
          <FaBars size={16} />
        )}
      </button>

      {/* =====================================================
          BACKDROP
      ===================================================== */}

      {open && (
        <div
          onClick={closeSidebar}
          aria-hidden="true"
          style={{
            position: "fixed",

            inset: 0,

            background:
              "rgba(0,0,0,0.48)",

            backdropFilter:
              "blur(4px)",

            WebkitBackdropFilter:
              "blur(4px)",

            zIndex: 1098,
          }}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className="workzy-sidebar-panel"
        aria-label="Main navigation"
        style={{
          width: "280px",

          height: "100dvh",

          background:
            "linear-gradient(180deg, #0f172a 0%, #111827 55%, #0b1220 100%)",

          color: "#ffffff",

          position: "fixed",

          top: 0,

          left: open
            ? 0
            : "-310px",

          padding:
            "24px 18px 18px",

          boxSizing: "border-box",

          zIndex: 1100,

          boxShadow: open
            ? "10px 0 35px rgba(0,0,0,0.40)"
            : "none",

          transition:
            "left 0.3s cubic-bezier(0.4,0,0.2,1)",

          display: "flex",

          flexDirection: "column",

          overflow: "hidden",
        }}
      >

        {/* ===================================================
            LOGO / HEADER
        =================================================== */}

        <div
          style={{
            marginBottom: "18px",

            paddingTop: "28px",

            paddingBottom: "18px",

            borderBottom:
              "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: "10px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",

                borderRadius: "11px",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "linear-gradient(135deg, #31525B, #B3DEE5)",

                color: "#ffffff",

                boxShadow:
                  "0 6px 16px rgba(49,82,91,0.35)",
              }}
            >
              <FaTools size={17} />
            </div>

            <h2
              style={{
                margin: 0,

                fontSize: "22px",

                fontWeight: 800,

                letterSpacing:
                  "0.3px",

                whiteSpace:
                  "nowrap",
              }}
            >
              Work
              <span
                style={{
                  color: "#f1a829",
                }}
              >
                zy
              </span>
            </h2>
          </div>

          <p
            style={{
              margin:
                "8px 0 0 48px",

              fontSize: "11.5px",

              color: "#94a3b8",

              fontWeight: 500,
            }}
          >
            {sidebarSubtitle}
          </p>
        </div>

        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav
          key={authVersion}
          className="workzy-sidebar-scroll"
          style={{
            display: "flex",

            flexDirection: "column",

            gap: "6px",

            flex: 1,

            overflowY: "auto",

            paddingRight: "3px",
          }}
        >
          {links.map(
            ({
              to,
              state,
              icon,
              label,
            }) => (
              <NavLink
                key={`${label}-${to}`}
                to={to}
                state={state}
                onClick={closeSidebar}
                className="workzy-sidebar-link"
                style={getLinkStyle}
              >
                <span
                  style={{
                    width: "22px",

                    display: "flex",

                    alignItems: "center",

                    justifyContent:
                      "center",

                    fontSize: "17px",
                  }}
                >
                  {icon}
                </span>

                <span>
                  {label}
                </span>
              </NavLink>
            )
          )}

          {/* =================================================
              THEME TOGGLE
          ================================================= */}

          <div
            style={{
              marginTop: "14px",

              paddingTop: "14px",

              borderTop:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className="workzy-sidebar-action"
              style={{
                width: "100%",

                padding:
                  "11px 13px",

                background:
                  "rgba(255,255,255,0.06)",

                color: "#ffffff",

                border:
                  "1px solid rgba(255,255,255,0.12)",

                borderBottom:
                  "1px solid rgba(255,255,255,0.12)",

                borderRadius: "11px",

                fontWeight: 700,

                fontSize: "12.5px",

                cursor: "pointer",

                display: "flex",

                alignItems: "center",

                justifyContent:
                  "space-between",

                boxShadow: "none",

                transform: "none",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {theme === "dark" ? (
                  <FaSun />
                ) : (
                  <FaMoon />
                )}

                Appearance
              </span>

              <span
                style={{
                  color:
                    theme === "dark"
                      ? "#f1a829"
                      : "#38bdf8",

                  fontWeight: 800,
                }}
              >
                {theme === "dark"
                  ? "Light"
                  : "Dark"}
              </span>
            </button>
          </div>

          {/* =================================================
              AUTH ACTIONS
          ================================================= */}

          <div
            style={{
              marginTop: "12px",

              paddingTop: "12px",

              borderTop:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",

                  padding: "11px",

                  display: "flex",

                  alignItems: "center",

                  justifyContent:
                    "center",

                  gap: "8px",

                  background:
                    "linear-gradient(135deg, #ef4444, #b91c1c)",

                  color: "#ffffff",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  borderBottom:
                    "3px solid #991b1b",

                  borderRadius: "10px",

                  fontWeight: 800,

                  cursor: "pointer",

                  boxShadow:
                    "0 5px 12px rgba(239,68,68,0.20)",
                }}
              >
                <FaSignOutAlt />

                Logout
              </button>
            ) : (
              <div
                style={{
                  display: "flex",

                  flexDirection:
                    "column",

                  gap: "8px",
                }}
              >
                <Link
                  to="/login"
                  onClick={closeSidebar}
                  style={{
                    textDecoration:
                      "none",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      width: "100%",

                      padding: "11px",

                      background:
                        "rgba(255,255,255,0.06)",

                      color: "#ffffff",

                      border:
                        "1px solid rgba(255,255,255,0.16)",

                      borderBottom:
                        "1px solid rgba(255,255,255,0.16)",

                      borderRadius:
                        "10px",

                      fontWeight: 700,

                      cursor: "pointer",

                      boxShadow: "none",
                    }}
                  >
                    Login
                  </button>
                </Link>

                <Link
                  to="/signup"
                  onClick={closeSidebar}
                  style={{
                    textDecoration:
                      "none",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      width: "100%",

                      padding: "11px",

                      background:
                        "linear-gradient(135deg, #31525B, #1F353B)",

                      color: "#ffffff",

                      border:
                        "1px solid rgba(179,222,229,0.15)",

                      borderBottom:
                        "3px solid #0E1719",

                      borderRadius:
                        "10px",

                      fontWeight: 800,

                      cursor: "pointer",

                      boxShadow:
                        "0 5px 12px rgba(49,82,91,0.25)",
                    }}
                  >
                    Signup
                  </button>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div
          style={{
            marginTop: "14px",

            paddingTop: "14px",

            borderTop:
              "1px solid rgba(255,255,255,0.08)",

            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "10.5px",

              color: "#64748b",

              margin: 0,

              fontWeight: 500,
            }}
          >
            Workzy © 2026
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
