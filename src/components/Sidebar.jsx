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

function Sidebar({ open: controlledOpen, onClose: controlledOnClose }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

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
        closeSidebar();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledOnClose]);

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
    if (open) {
      closeSidebar();
    } else {
      setInternalOpen(true);
    }
  };

  const closeSidebar = () => {
    if (typeof controlledOnClose === "function") {
      controlledOnClose();
    }
    setInternalOpen(false);
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

  const links = [];

  let sidebarSubtitle =
    "Explore Local Professionals";

  if (isLoggedIn) {
    /* ================= USER ================= */

    if (userRole === "user") {
      sidebarSubtitle =
        "Customer Navigation";

      links.push(
        {
          to: "/",
          icon: <FaHome />,
          label: "Home Page",
        },
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
          icon: <FaTools />,
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
    links.push(
      {
        to: "/",
        icon: <FaHome />,
        label: "Home Page",
      },
      {
        to: "/plans-offers",
        icon: <FaPercent />,
        label: "Plans & Offers",
      }
    );
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

    closeSidebar();

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
      ? "var(--primary-dark)"
      : "var(--text-secondary)",

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
      ? "var(--primary-light)"
      : "transparent",

    border:
      isActive
        ? "1px solid var(--primary)"
        : "1px solid transparent",

    boxShadow: isActive
      ? "0 4px 10px rgba(0,0,0,0.05)"
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
          background: var(--bg-card-hover) !important;
          color: var(--primary) !important;
          transform: translateX(4px);
        }

        .workzy-sidebar-link:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        .workzy-sidebar-action:hover {
          background: var(--bg-card-hover) !important;
        }

        .workzy-sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .workzy-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .workzy-sidebar-scroll::-webkit-scrollbar-thumb {
          background: var(--primary-glow);
          border-radius: 10px;
        }

        .workzy-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--primary);
        }

        @media (max-width: 768px) {
          .workzy-sidebar-panel {
            width: min(300px, 88vw) !important;
          }
        }
      `}</style>

      {/* =====================================================
          HAMBURGER / CLOSE BUTTON (Standalone Fallback Only)
      ===================================================== */}

      {!isControlled && (
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
              "var(--bg-card-hover)",

            color: "var(--text-main)",

            border:
              "1.5px solid var(--border-color)",

            borderBottom:
              "1.5px solid var(--border-color)",

            borderRadius: "12px",

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
      )}

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
            "var(--bg-card)",

          color: "var(--text-main)",

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
            paddingTop: "14px",
            paddingBottom: "16px",
            borderBottom: "1.5px solid var(--border-color)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaTools style={{ color: "var(--primary)", fontSize: "20px", flexShrink: 0 }} />

              <h2
                style={{
                  margin: 0,
                  fontSize: "21px",
                  fontWeight: 800,
                  letterSpacing: "-0.4px",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "var(--text-main)" }}>Work</span>
                <span style={{ color: "var(--warning, #f59e0b)" }}>zy</span>
              </h2>
            </div>

            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close navigation menu"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "9px",
                border: "1.5px solid var(--border-color)",
                background: "var(--bg-card-hover)",
                color: "var(--text-main)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <FaTimes size={15} />
            </button>
          </div>

          <p
            style={{
              margin: "8px 0 0 46px",
              fontSize: "11.5px",
              color: "var(--text-secondary)",
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
                "1.5px solid var(--border-color)",
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
                  "var(--bg-card-hover)",

                color: "var(--text-main)",

                border:
                  "1.5px solid var(--border-color)",

                borderBottom:
                  "1.5px solid var(--border-color)",

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
                      ? "var(--warning)"
                      : "var(--primary)",

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
                "1px solid var(--border-color)",
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
                    "var(--danger-grad)",

                  color: "#ffffff",

                  border:
                    "1px solid var(--border-color)",

                  borderBottom:
                    "3px solid var(--danger)",

                  borderRadius: "10px",

                  fontWeight: 800,

                  cursor: "pointer",

                  boxShadow:
                    "0 5px 12px var(--danger-light)",
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
                        "transparent",

                      color: "var(--text-main)",

                      border:
                        "1.5px solid var(--border-color)",

                      borderBottom:
                        "1.5px solid var(--border-color)",

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
                        "var(--primary-grad)",

                      color: "white",

                      border:
                        "1px solid var(--primary-glow)",

                      borderBottom:
                        "3px solid var(--primary-hover)",

                      borderRadius:
                        "10px",

                      fontWeight: 800,

                      cursor: "pointer",

                      boxShadow:
                        "0 5px 12px var(--primary-glow)",
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
              "1px solid var(--border-color)",

            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "10.5px",

              color: "var(--text-secondary)",

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
