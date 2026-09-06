import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash, FaUser, FaHardHat, FaChevronDown, FaChevronUp, FaShieldAlt, FaLock, FaEnvelope } from "react-icons/fa";
import { fetchAllWorkersCached } from "../utils/workerService";
import safeJson from "../utils/safeJson";
import { useGoogleLogin } from "@react-oauth/google";
import { useRef } from "react";
import authBg from "../assets/auth-bg.jpg";
import authMobileBg from "../assets/auth-mobile-bg.png";

// ── Professions list (for Join as Service Provider) ─────────────────────────
const PROFESSIONS = [
  { group: "Main Services", options: ["Carpentry", "Plumbing", "Electrical", "Beauty, Salon & Spa", "Doctors & Medical"] },
  { group: "Cleaning", options: ["House Cleaning", "Floor cleaning", "Utensils Cleaning", "Sofa & Carpet Cleaning"] },
  { group: "Painting", options: ["Interior Painting", "Exterior Painting", "Wall Putty Coating", "Wood Polishing"] },
  { group: "Mechanical", options: ["Two-Wheeler (Bikes)", "Four-Wheeler (Cars)"] },
  { group: "Automobile Cleaning", options: ["Car Wash", "Bike Wash"] },
  { group: "Appliance Repair", options: ["AC Repair", "Washing Machine", "Refrigerator", "Geyser", "TV & Electronics"] },
  { group: "IT & Tech", options: ["Computer Repair", "Network Setup", "Smart Home Installation"] },
  { group: "Home & Maintenance", options: ["Pest Control", "Termite Treatment", "Waterproofing"] },
  { group: "Specializations", options: ["Photography", "Events", "Packers & Movers", "Mechanic"] },
];

const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Visakhapatnam", "Bhopal", "Patna", "Vadodara", "Ludhiana", "Agra", "Nashik", "Rajkot", "Meerut", "Varanasi", "Kakinada", "Vijayawada", "Guntur", "Tirupati", "Rajahmundry", "Kadapa", "Nellore", "Kurnool", "Anantapur", "Warangal", "Karimnagar", "Nizamabad", "Khammam", "Secunderabad", "Coimbatore", "Madurai", "Trichy", "Salem", "Erode", "Tiruppur", "Mysuru", "Mangalore", "Belgaum", "Hubli", "Dharwad", "Gulbarga",
];

// ── Google "G" SVG Icon ────────────────────────────────────
function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.7-1.57 2.68-3.88 2.68-6.57z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.23l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5H.95C.35 6.2.01 7.57.01 9s.34 2.8 1.04 4l2.92-2.3z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.41 0 9 0 5.5 0 2.43 2.11.95 5.1l2.97 2.3c.7-2.12 2.69-3.82 5.03-3.82z"/>
    </svg>
  );
}


// ── Login Result Popup Modal ───────────────────────────────────────────────
function LoginResultPopup({ popup, onClose, onSwitchTab, onOpenJoinForm, navigate }) {
  if (!popup) return null;

  const config = {
    not_found: {
      icon: "🔍",
      title: popup.title || "Account Not Found",
      titleColor: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
      primaryBtnText: "📝 Create a New Account",
      primaryAction: () => { onClose(); navigate("/signup"); },
      secondaryBtnText: "Try Again",
      secondaryAction: onClose,
    },
    not_provider: {
      icon: "🛠️",
      title: popup.title || "No Provider Account Found",
      titleColor: "#1e3a8a",
      bg: "#eff6ff",
      border: "#bfdbfe",
      primaryBtnText: "🛠️ Register as Service Provider",
      primaryAction: () => { onClose(); onOpenJoinForm(); },
      secondaryBtnText: "👤 Sign In as Customer",
      secondaryAction: () => { onClose(); onSwitchTab("user"); },
    },
    worker_only: {
      icon: "🛠️",
      title: popup.title || "Service Provider Account",
      titleColor: "#065f46",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      primaryBtnText: "🛠️ Switch to Service Provider Tab",
      primaryAction: () => { onClose(); onSwitchTab("provider"); },
      secondaryBtnText: "Close",
      secondaryAction: onClose,
    },
    blocked: {
      icon: "🚫",
      title: popup.title || "Account Blocked",
      titleColor: "#991b1b",
      bg: "#fef2f2",
      border: "#fecaca",
      primaryBtnText: "📞 Contact Support",
      primaryAction: () => { onClose(); navigate("/support"); },
      secondaryBtnText: "Close",
      secondaryAction: onClose,
    },
    error: {
      icon: "❌",
      title: popup.title || "Sign In Failed",
      titleColor: "#991b1b",
      bg: "#fef2f2",
      border: "#fecaca",
      primaryBtnText: "Try Again",
      primaryAction: onClose,
    }
  }[popup.type] || {
    icon: "⚠️",
    title: popup.title || "Notice",
    titleColor: "#92400e",
    bg: "#fffbeb",
    border: "#fde68a",
    primaryBtnText: "OK",
    primaryAction: onClose,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)",
      display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
    }}>
      <div style={{
        background: "var(--bg-card, #ffffff)",
        border: `2px solid ${config.border}`,
        borderRadius: "24px", padding: "40px 36px", maxWidth: "420px", width: "100%",
        textAlign: "center", boxShadow: "0 25px 80px rgba(0,0,0,0.25)",
        animation: "loginPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both"
      }}>
        <div style={{ fontSize: "56px", marginBottom: "14px", lineHeight: 1, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}>
          {config.icon}
        </div>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "22px", fontWeight: 800, color: config.titleColor, letterSpacing: "-0.3px" }}>
          {config.title}
        </h2>
        <p style={{ margin: "0 0 28px 0", fontSize: "14px", color: "var(--text-secondary, #64748b)", lineHeight: 1.7 }}>
          {popup.message}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {config.primaryBtnText && (
            <button
              onClick={config.primaryAction}
              style={{
                background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
                color: "white", border: "none", borderRadius: "14px",
                padding: "14px 24px", fontSize: "14px", fontWeight: 700,
                cursor: "pointer", boxShadow: "0 6px 20px rgba(30, 58, 95, 0.3)",
                transition: "all 0.2s", letterSpacing: "0.3px"
              }}
            >
              {config.primaryBtnText}
            </button>
          )}
          {config.secondaryBtnText && (
            <button
              onClick={config.secondaryAction}
              style={{
                background: "transparent", color: "var(--text-muted, #64748b)",
                border: "2px solid var(--border, #e2e8f0)", borderRadius: "14px",
                padding: "12px 24px", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              {config.secondaryBtnText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared status banner ─────────────────────────────────────────────────
const StatusBanner = ({ status }) => status ? (
  <div style={{
    padding: "12px 16px", borderRadius: "12px", marginBottom: "16px",
    fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px",
    animation: "loginFadeIn 0.3s ease-out forwards",
    backgroundColor: status.type === "success" ? "rgba(22, 163, 74, 0.08)" : "rgba(220, 38, 38, 0.06)",
    color: status.type === "success" ? "#15803d" : "#dc2626",
    border: `1px solid ${status.type === "success" ? "rgba(22, 163, 74, 0.2)" : "rgba(220, 38, 38, 0.15)"}`,
  }}>
    <span style={{ fontSize: "16px", flexShrink: 0 }}>{status.type === "success" ? "✅" : "❌"}</span>
    <span style={{ lineHeight: 1.5 }}>{status.message}</span>
  </div>
) : null;

// ── Spinner ───────────────────────────────────────────────────────────────
const Spinner = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
    <span style={{
      width: "16px", height: "16px",
      border: "2.5px solid rgba(255,255,255,0.3)",
      borderTopColor: "white",
      borderRadius: "50%",
      display: "inline-block",
      animation: "loginSpin 0.6s linear infinite",
    }} />
    Processing...
  </span>
);

// ── Shared Input Field Component ──────────────────────────────────────────
const InputField = ({ icon: Icon, label, id, type = "text", placeholder, value, onChange, error, children, ...rest }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    <label htmlFor={id} style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
      {label}
    </label>
    <div style={{ position: "relative" }}>
      {Icon && (
        <span style={{
          position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
          color: "var(--text-muted)", display: "flex", alignItems: "center", pointerEvents: "none",
        }}>
          <Icon size={14} />
        </span>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: Icon ? "10px 14px 10px 40px" : "10px 14px",
          borderRadius: "12px",
          border: error ? "2px solid rgba(220, 38, 38, 0.3)" : "2px solid var(--border, #e2e8f0)",
          background: "var(--bg-card, #ffffff)",
          color: "var(--text-main)",
          fontSize: "14px", fontWeight: 500,
          outline: "none",
          transition: "all 0.2s ease",
        }}
        onFocus={(e) => { e.target.style.borderColor = "#2d5a9e"; e.target.style.boxShadow = "0 0 0 3px rgba(45, 90, 158, 0.1)"; }}
        onBlur={(e) => { e.target.style.borderColor = error ? "rgba(220, 38, 38, 0.3)" : "var(--border, #e2e8f0)"; e.target.style.boxShadow = "none"; }}
        {...rest}
      />
      {children}
    </div>
  </div>
);

function Login() {
  const [activeTab, setActiveTab] = useState("user"); // "user" | "provider"

  // Separate form state for User tab
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Separate form state for Provider tab
  const [providerEmail, setProviderEmail] = useState("");
  const [providerPassword, setProviderPassword] = useState("");
  const [showProviderPassword, setShowProviderPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(window.location.hash.includes("access_token"));
  const [loginStatus, setLoginStatus] = useState(null);
  const [popupModal, setPopupModal] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Join-as-provider sub-form state
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [showJoinPassword, setShowJoinPassword] = useState(false);
  const [joinProfession, setJoinProfession] = useState("");
  const [joinCity, setJoinCity] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState(null);

  const navigate = useNavigate();

  // ── Helper to convert server error string to structured popup ─────────────
  const parseErrorToPopup = (errMsg) => {
    const msg = errMsg || "";
    if (
      msg.toLowerCase().includes("no account found") || 
      msg.toLowerCase().includes("sign up first") || 
      msg.toLowerCase().includes("does not exist")
    ) {
      return {
        type: "not_found",
        title: "Account Not Found",
        message: msg || "No registered account found with this email. Please sign up to create a new account."
      };
    }
    if (
      msg.toLowerCase().includes("service provider only") || 
      msg.toLowerCase().includes("switch to the service provider tab")
    ) {
      return {
        type: "worker_only",
        title: "Service Provider Account",
        message: msg || "This account is registered strictly as a Service Provider. Please switch to the Service Provider tab to sign in."
      };
    }
    if (
      msg.toLowerCase().includes("no service provider profile") || 
      msg.toLowerCase().includes("registered as a customer") ||
      msg.toLowerCase().includes("switch to the user tab")
    ) {
      return {
        type: "not_provider",
        title: "Customer Account",
        message: msg || "This account is registered as a Customer. Please switch to the User tab to sign in."
      };
    }
    if (msg.toLowerCase().includes("blocked")) {
      return {
        type: "blocked",
        title: "Account Access Blocked",
        message: msg || "Your account has been permanently blocked by administrative control."
      };
    }
    return null;
  };

  // ── Google OAuth handler ─────────────────────────────────────────────────
  const handleGoogleLoginWithToken = async (accessToken, targetLoginAs = "user") => {
    setIsLoading(true);
    setLoginStatus({ type: "success", message: "Verifying Google Authentication... 🔑" });
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, loginAs: targetLoginAs }),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        setIsLoading(false);
        const popup = parseErrorToPopup(data.error);
        if (popup) {
          setPopupModal(popup);
        }
        setLoginStatus({ type: "error", message: data.error || "Google Sign-In failed!" });
        return;
      }
      handleLoginSuccess(data, data.loginContext || targetLoginAs);
    } catch (err) {
      setIsLoading(false);
      setLoginStatus({ type: "error", message: "Network error! Backend is unreachable." });
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = params.get("access_token");
      if (accessToken) {
        const flow = sessionStorage.getItem("pendingGoogleFlow") || "user";
        handleGoogleLoginWithToken(accessToken, flow);
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
        sessionStorage.removeItem("pendingGoogleFlow");
      }
    }

    const redirectError = sessionStorage.getItem("google_auth_error");
    if (redirectError) {
      const popup = parseErrorToPopup(redirectError);
      if (popup) {
        setPopupModal(popup);
      }
      setLoginStatus({ type: "error", message: redirectError });
      sessionStorage.removeItem("google_auth_error");
    }
    fetchAllWorkersCached();
    const savedCity = localStorage.getItem("userCity");
    if (savedCity) {
      fetch(`/api/workers/geocode?q=${encodeURIComponent(savedCity)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.lat && data?.lon) {
            localStorage.setItem("userLocation", data.label || savedCity);
            localStorage.setItem("userCoordsLat", String(parseFloat(data.lat)));
            localStorage.setItem("userCoordsLng", String(parseFloat(data.lon)));
          }
        })
        .catch(() => { });
    }
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Shared session writer ────────────────────────────────────────────────
  const handleLoginSuccess = (data, forcedContext = null) => {
    const user = data.user;
    if (!user) {
      setLoginStatus({ type: "error", message: "Authentication response is missing user data." });
      setIsLoading(false);
      return;
    }

    const context = forcedContext || data.loginContext || (user.role === "admin" ? "admin" : (user.role === "worker" ? "provider" : "user"));
    const activeRole = context === "admin" ? "admin" : (context === "provider" ? "worker" : "user");

    // Clear previous sessions to avoid data bleeding
    sessionStorage.removeItem("loggedInWorkerId");
    sessionStorage.removeItem("workerSession_email");
    sessionStorage.removeItem("workerSession_profileId");
    sessionStorage.removeItem("workerSession_name");

    // ── Session write ────────────────────────────────────
    sessionStorage.setItem("userRole", activeRole);
    sessionStorage.setItem("actualRole", user.actualRole || user.role);
    sessionStorage.setItem("userName", user.name);
    sessionStorage.setItem("userEmail", user.email);
    sessionStorage.setItem("userId", user.id || user._id);
    sessionStorage.setItem("authToken", data.token);
    sessionStorage.setItem("isWorker", String(user.isWorker || false));
    sessionStorage.setItem("workerProfileId", user.workerProfileId || "");
    sessionStorage.setItem("loginContext", context);

    // ── Worker session (only when acting in provider role) ─────────
    if (activeRole === "worker" || user.isWorker) {
      const wId = user.workerProfileId || (data.worker ? data.worker.id : (user.id || user._id));
      sessionStorage.setItem("loggedInWorkerId", String(wId));
      sessionStorage.setItem("workerSession_email", user.email);
      sessionStorage.setItem("workerSession_profileId", String(wId));
      sessionStorage.setItem("workerSession_name", user.name);
    }

    localStorage.removeItem("manualLocationSet");

    // ── Persist session for 1 week ────────────────────────────────────────
    localStorage.setItem("authSession", JSON.stringify({
      userRole: activeRole,
      actualRole: user.actualRole || user.role,
      loginContext: context,
      userName: user.name,
      userEmail: user.email,
      userId: user.id || user._id,
      authToken: data.token,
      isWorker: user.isWorker || false,
      workerProfileId: user.workerProfileId || null,
      loggedInWorkerId: (activeRole === "worker" || user.isWorker) ? (user.workerProfileId || user.id || user._id) : null,
      userCity: user.city || null,
      expiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }));

    window.dispatchEvent(new Event("storage"));

    // ── Redirect logic ────────────────────────────────────────────────────
    if (activeRole === "admin" || user.role === "admin") {
      setLoginStatus({ type: "success", message: "Welcome Administrator! Redirecting... 👑" });
      setTimeout(() => navigate("/admin-dashboard"), 800);
    } else if (activeRole === "worker" || context === "provider") {
      setLoginStatus({ type: "success", message: `Welcome ${user.name}! Redirecting to worker dashboard... 🛠️` });
      setTimeout(() => navigate("/worker-dashboard"), 800);
    } else {
      // Regular user / Customer
      setLoginStatus({ type: "success", message: `Welcome ${user.name}! Redirecting... 🎉` });
      if (user.city) {
        sessionStorage.setItem("userCity", user.city);
        localStorage.setItem("userCity", user.city);
      }
      const targetCity = user.city || "Kakinada";
      setTimeout(() => navigate("/"), 800);
      fetch(`/api/workers/geocode?q=${encodeURIComponent(targetCity)}`)
        .then(res => res.ok ? res.json() : null)
        .then(geoData => {
          if (geoData?.lat && geoData?.lon) {
            localStorage.setItem("userLocation", geoData.label || targetCity);
            localStorage.setItem("userCoordsLat", String(parseFloat(geoData.lat)));
            localStorage.setItem("userCoordsLng", String(parseFloat(geoData.lon)));
          }
        })
        .catch(() => { });
    }
  };

  // ── User Login ───────────────────────────────────────────────────────────
  const handleUserLogin = async (e) => {
    e.preventDefault();
    if (!userEmail || !userPassword) {
      setLoginStatus({ type: "error", message: "Please fill in email and password!" });
      return;
    }
    setIsLoading(true);
    setLoginStatus(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: userPassword, loginAs: "user" }),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        setIsLoading(false);
        const popup = parseErrorToPopup(data.error);
        if (popup) {
          setPopupModal(popup);
        }
        setLoginStatus({ type: "error", message: data.error || "Invalid email or password!" });
        return;
      }
      handleLoginSuccess(data, data.loginContext || "user");
    } catch (err) {
      setIsLoading(false);
      setLoginStatus({ type: "error", message: "Network error! Backend is unreachable." });
    }
  };

  // ── Provider Login ───────────────────────────────────────────────────────
  const handleProviderLogin = async (e) => {
    e.preventDefault();
    if (!providerEmail || !providerPassword) {
      setLoginStatus({ type: "error", message: "Please fill in provider email and password!" });
      return;
    }
    setIsLoading(true);
    setLoginStatus(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: providerEmail, password: providerPassword, loginAs: "provider" }),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        setIsLoading(false);
        const popup = parseErrorToPopup(data.error);
        if (popup) {
          setPopupModal(popup);
        }
        setLoginStatus({ type: "error", message: data.error || "Invalid email or password!" });
        return;
      }
      handleLoginSuccess(data, data.loginContext || "provider");
    } catch (err) {
      setIsLoading(false);
      setLoginStatus({ type: "error", message: "Network error! Backend is unreachable." });
    }
  };

  // ── Join as Service Provider ─────────────────────────────────────────────
  const handleJoinAsWorker = async (e) => {
    e.preventDefault();
    setJoinStatus(null);

    // All fields are mandatory
    if (!joinName.trim() || !joinPhone.trim() || !joinEmail || !joinPassword || !joinProfession || !joinCity) {
      setJoinStatus({ type: "error", message: "Please fill in all fields (Name, Phone, Email, Password, Profession, Location)." });
      return;
    }
    // Phone validation
    if (!/^\d{10}$/.test(joinPhone.trim())) {
      setJoinStatus({ type: "error", message: "Please enter a valid 10-digit phone number." });
      return;
    }
    // Password strength
    const hasLetter = /[a-zA-Z]/.test(joinPassword);
    const hasNumber = /[0-9]/.test(joinPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(joinPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      setJoinStatus({ type: "error", message: "Password must have at least one letter, one number, and one special character." });
      return;
    }

    setIsJoining(true);
    try {
      // Try to register as a brand-new worker account
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: joinName.trim(),
          email: joinEmail,
          password: joinPassword,
          phone: joinPhone.trim(),
          role: "worker",
          profession: joinProfession,
          city: joinCity,
        }),
      });
      const data = await safeJson(response);

      // If account already exists, try upgrading via join-as-worker
      if (response.status === 400 && data.error?.toLowerCase().includes("already exists")) {
        const joinResp = await fetch("/api/auth/join-as-worker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: joinEmail,
            password: joinPassword,
            profession: joinProfession,
            city: joinCity,
          }),
        });
        const joinData = await safeJson(joinResp);
        if (!joinResp.ok) {
          setIsJoining(false);
          setJoinStatus({ type: "error", message: joinData.error || "Registration failed. Please try again." });
          return;
        }
        setJoinStatus({ type: "success", message: `🎉 Service provider profile created! Logging you in...` });
        setTimeout(() => {
          setIsJoining(false);
          handleLoginSuccess(joinData, "provider");
        }, 900);
        return;
      }

      if (!response.ok) {
        setIsJoining(false);
        setJoinStatus({ type: "error", message: data.error || "Registration failed. Please try again." });
        return;
      }

      // New account created — auto-login
      setJoinStatus({ type: "success", message: `🎉 Worker account created for ${joinName.trim()}! Logging you in...` });
      setTimeout(() => {
        setIsJoining(false);
        // For new registration, we need to login since register doesn't return a session
        handleProviderAutoLogin(joinEmail, joinPassword);
      }, 900);
    } catch (err) {
      setIsJoining(false);
      setJoinStatus({ type: "error", message: "Network error! Backend is unreachable." });
    }
  };

  // Auto-login helper after new worker registration
  const handleProviderAutoLogin = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, loginAs: "provider" }),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        setJoinStatus({ type: "success", message: "Account created! Please sign in with your credentials above." });
        setProviderEmail(email);
        setShowJoinForm(false);
        return;
      }
      handleLoginSuccess(data, data.loginContext || "provider");
    } catch (err) {
      setJoinStatus({ type: "success", message: "Account created! Please sign in with your credentials above." });
      setProviderEmail(email);
      setShowJoinForm(false);
    }
  };

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const pendingGoogleFlowRef = useRef("user");

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await handleGoogleLoginWithToken(tokenResponse.access_token, pendingGoogleFlowRef.current);
    },
    onError: (error) => {
      setIsLoading(false);
      const errMsg = error?.error || error?.message || "";
      if (typeof errMsg === "string" && errMsg.toLowerCase().includes("closed")) {
        setLoginStatus(null);
        return;
      }
      setLoginStatus({ type: "error", message: "Google Sign-In failed or was cancelled." });
    },
    ux_mode: isMobile ? "redirect" : "popup",
  });

  const handleGoogleSignIn = (flow = "user_login") => {
    const targetLoginAs = flow === "provider_login" ? "provider" : "user";
    pendingGoogleFlowRef.current = targetLoginAs;
    sessionStorage.setItem("pendingGoogleFlow", targetLoginAs);
    setIsLoading(true);
    setLoginStatus({ type: "success", message: "Connecting to Google... 🔑" });
    googleLogin();
  };


  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary, #f8fafc)" }}>
      <Navbar />

      <div style={{
        flex: 1, display: "flex", justifyContent: "center", alignItems: isMobile ? "flex-start" : "center",
        padding: isMobile ? "20px 8px" : "24px 16px",
        backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,58,95,0.8) 40%, rgba(45,90,158,0.75) 100%), url(${isMobile ? authMobileBg : authBg})`,
        backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
        position: "relative", overflowX: "hidden", overflowY: "auto",
      }}>
        {/* Animated background elements */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{
            position: "absolute", width: "600px", height: "600px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(223, 180, 83, 0.08) 0%, transparent 70%)",
            top: "-200px", right: "-100px", animation: "loginFloat 20s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", width: "400px", height: "400px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45, 90, 158, 0.12) 0%, transparent 70%)",
            bottom: "-150px", left: "-100px", animation: "loginFloat 25s ease-in-out infinite reverse",
          }} />
          <div style={{
            position: "absolute", width: "200px", height: "200px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%)",
            top: "30%", left: "20%", animation: "loginFloat 15s ease-in-out infinite",
          }} />
        </div>

        <div style={{
          display: "flex", width: "100%", maxWidth: isMobile ? "340px" : "760px",
          borderRadius: "20px", overflow: "hidden",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          position: "relative", zIndex: 1,
          animation: "loginSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}>

          {/* ── Left Panel (Desktop Only) ────────────────────────────── */}
          {!isMobile && (
            <div style={{
              width: "280px", flexShrink: 0,
              background: "linear-gradient(135deg, #0c1929 0%, #1a365d 50%, #1e3a5f 100%)",
              padding: "24px 20px", display: "flex", flexDirection: "column",
              justifyContent: "center", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                <div style={{
                  position: "absolute", width: "300px", height: "300px", borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(223, 180, 83, 0.12) 0%, transparent 70%)",
                  top: "-80px", right: "-80px",
                }} />
                <div style={{
                  position: "absolute", width: "200px", height: "200px", borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(45, 90, 158, 0.15) 0%, transparent 70%)",
                  bottom: "-60px", left: "-60px",
                }} />
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #dfb453 0%, #f1a829 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "16px", boxShadow: "0 6px 18px rgba(223, 180, 83, 0.3)",
                }}>
                  <FaShieldAlt size={20} color="white" />
                </div>

                <h2 style={{
                  fontSize: "26px", fontWeight: 900, color: "white",
                  lineHeight: 1.2, marginBottom: "8px", letterSpacing: "-0.5px",
                }}>
                  Sign in to<br />
                  <span style={{ background: "linear-gradient(135deg, #dfb453, #f1a829)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Workzy
                  </span>
                </h2>

                <p style={{
                  fontSize: "13px", color: "rgba(255, 255, 255, 0.6)",
                  lineHeight: 1.6, marginBottom: "20px",
                }}>
                  Your trusted platform to find and book skilled service providers near you.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { icon: "✓", text: "Secure & verified accounts" },
                    { icon: "✓", text: "Book services in a few clicks" },
                    { icon: "✓", text: "Available across India" },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "8px 10px", borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}>
                      <span style={{ fontSize: "16px" }}>{item.icon}</span>
                      <span style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Right Panel (Form) ──────────────────────────────────── */}
          <div style={{
            flex: 1, background: "var(--bg-card, #ffffff)",
            padding: isMobile ? "20px 16px" : "20px 24px",
            overflowY: "auto", maxHeight: isMobile ? "100%" : "80vh",
          }}>
            {/* ── Header ──────────────────────────────────────────── */}
            <div style={{ marginBottom: isMobile ? "12px" : "18px" }}>
              <h1 style={{
                margin: "0 0 4px", fontSize: isMobile ? "21px" : "24px",
                fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.5px",
              }}>
                Sign In
              </h1>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.6 }}>
                Manage your bookings and services securely
              </p>
            </div>

            {/* ── Tab Switcher ─────────────────────────────────────── */}
            <div style={{
              display: "flex", gap: "4px",
              background: "var(--bg-secondary, #f1f5f9)", borderRadius: "14px",
              padding: "4px", marginBottom: "16px",
            }}>
              <button
                id="tab-login-user"
                onClick={() => { setActiveTab("user"); setLoginStatus(null); setJoinStatus(null); setShowJoinForm(false); }}
                style={{
                  flex: 1, padding: "12px 8px", border: "none", borderRadius: "11px",
                  fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  background: activeTab === "user" ? "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)" : "transparent",
                  color: activeTab === "user" ? "white" : "var(--text-muted)",
                  boxShadow: activeTab === "user" ? "0 4px 16px rgba(30, 58, 95, 0.3)" : "none",
                }}
              >
                <FaUser size={12} />
                Customer
              </button>
              <button
                id="tab-login-provider"
                onClick={() => { setActiveTab("provider"); setLoginStatus(null); setJoinStatus(null); }}
                style={{
                  flex: 1, padding: "12px 8px", border: "none", borderRadius: "11px",
                  fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  background: activeTab === "provider" ? "linear-gradient(135deg, #065f46 0%, #059669 100%)" : "transparent",
                  color: activeTab === "provider" ? "white" : "var(--text-muted)",
                  boxShadow: activeTab === "provider" ? "0 4px 16px rgba(5, 150, 105, 0.3)" : "none",
                }}
              >
                <FaHardHat size={12} />
                Service Provider
              </button>
            </div>

            {/* ── Status ──────────────────────────────────────────── */}
            <StatusBanner status={loginStatus} />

            {/* ════════════════════════════════════════════════════════
                TAB A — LOGIN AS USER
            ════════════════════════════════════════════════════════ */}
            {activeTab === "user" && (
              <>
                <form onSubmit={handleUserLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <InputField
                    icon={FaEnvelope}
                    label="Email Address"
                    id="user-email"
                    type="email"
                    placeholder="name@example.com"
                    value={userEmail}
                    onChange={(e) => { setUserEmail(e.target.value); setLoginStatus(null); }}
                    error={loginStatus?.type === "error"}
                    required
                  />

                  <InputField
                    icon={FaLock}
                    label="Password"
                    id="user-password"
                    type={showUserPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={userPassword}
                    onChange={(e) => { setUserPassword(e.target.value); setLoginStatus(null); }}
                    error={loginStatus?.type === "error"}
                    required
                    style={{ paddingRight: "44px" }}
                  >
                    <span
                      role="button"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                      style={{
                        position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        color: "var(--text-muted)", padding: "4px", userSelect: "none",
                      }}
                    >
                      {showUserPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </span>
                  </InputField>

                  <button
                    id="user-login-btn"
                    type="submit"
                    disabled={isLoading}
                    style={{
                      padding: "12px", fontSize: "15px", fontWeight: 700, marginTop: "2px",
                      width: "100%", border: "none", borderRadius: "14px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.7 : 1,
                      background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
                      color: "white",
                      boxShadow: "0 8px 28px rgba(30, 58, 95, 0.3)",
                      transition: "all 0.3s ease",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {isLoading ? <Spinner /> : "Sign In"}
                  </button>
                </form>

                {/* Divider + Google */}
                <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--border, #e2e8f0)" }} />
                  <span style={{ padding: "0 16px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>or</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border, #e2e8f0)" }} />
                </div>
                <button
                  id="user-google-btn"
                  type="button"
                  onClick={() => handleGoogleSignIn("user_login")}
                  style={{
                    padding: "12px", fontSize: "14px", fontWeight: 600, width: "100%",
                    display: "flex", justifyContent: "center", alignItems: "center", gap: "10px",
                    borderRadius: "14px", cursor: "pointer",
                    background: "var(--bg-card, #ffffff)",
                    border: "2px solid var(--border, #e2e8f0)",
                    color: "var(--text-main)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4285F4"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(66, 133, 244, 0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border, #e2e8f0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <GoogleIcon size={18} />
                  Continue with Google
                </button>

                <p style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: "var(--text-muted)" }}>
                  Don't have an account?{" "}
                  <Link to="/signup" style={{ color: "#2d5a9e", fontWeight: 700, textDecoration: "none" }}>Create Account</Link>
                </p>
              </>
            )}

            {/* ════════════════════════════════════════════════════════
                TAB B — SERVICE PROVIDER
            ════════════════════════════════════════════════════════ */}
            {activeTab === "provider" && (
              <>
                <form onSubmit={handleProviderLogin} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <InputField
                    icon={FaEnvelope}
                    label="Provider Email"
                    id="provider-email"
                    type="email"
                    placeholder="your@email.com"
                    value={providerEmail}
                    onChange={(e) => { setProviderEmail(e.target.value); setLoginStatus(null); }}
                    error={loginStatus?.type === "error"}
                    required
                  />

                  <InputField
                    icon={FaLock}
                    label="Password"
                    id="provider-password"
                    type={showProviderPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={providerPassword}
                    onChange={(e) => { setProviderPassword(e.target.value); setLoginStatus(null); }}
                    error={loginStatus?.type === "error"}
                    required
                    style={{ paddingRight: "44px" }}
                  >
                    <span
                      role="button"
                      onClick={() => setShowProviderPassword(!showProviderPassword)}
                      style={{
                        position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        color: "var(--text-muted)", padding: "4px", userSelect: "none",
                      }}
                    >
                      {showProviderPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </span>
                  </InputField>

                  <button
                    id="provider-login-btn"
                    type="submit"
                    disabled={isLoading}
                    style={{
                      padding: "12px", fontSize: "15px", fontWeight: 700, marginTop: "2px",
                      width: "100%", border: "none", borderRadius: "14px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.7 : 1,
                      background: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
                      color: "white",
                      boxShadow: "0 8px 28px rgba(5, 150, 105, 0.3)",
                      transition: "all 0.3s ease",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {isLoading ? <Spinner /> : "🛠️ Sign In as Provider"}
                  </button>
                </form>

                {/* Google Sign-In for Provider */}
                <div style={{ display: "flex", alignItems: "center", margin: "22px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--border, #e2e8f0)" }} />
                  <span style={{ padding: "0 16px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>or</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border, #e2e8f0)" }} />
                </div>
                <button
                  id="provider-google-btn"
                  type="button"
                  onClick={() => handleGoogleSignIn("provider_login")}
                  style={{
                    padding: "12px", fontSize: "14px", fontWeight: 600, width: "100%",
                    display: "flex", justifyContent: "center", alignItems: "center", gap: "10px",
                    borderRadius: "14px", cursor: "pointer",
                    background: "var(--bg-card, #ffffff)",
                    border: "2px solid rgba(5, 150, 105, 0.2)",
                    color: "var(--text-main)",
                    transition: "all 0.2s",
                    marginBottom: "20px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#059669"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(5, 150, 105, 0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(5, 150, 105, 0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <GoogleIcon size={18} />
                  Continue with Google as Provider
                </button>



                <p style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: "var(--text-muted)" }}>
                  New to Workzy?{" "}
                  <Link to="/signup" state={{ role: "worker" }} style={{ color: "#059669", fontWeight: 700, textDecoration: "none" }}>Sign up as a provider</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Login Result Popup Modal */}
      <LoginResultPopup
        popup={popupModal}
        onClose={() => setPopupModal(null)}
        onSwitchTab={(tab) => {
          setActiveTab(tab);
          setLoginStatus(null);
        }}
        onOpenJoinForm={() => {
          setActiveTab("provider");
          setShowJoinForm(true);
          setLoginStatus(null);
        }}
        navigate={navigate}
      />

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "20px 24px",
        color: "var(--text-secondary)", fontSize: "13px",
        backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border)",
        fontWeight: 500,
      }}>
        © 2026 Workzy Inc. All rights reserved. Made with ❤️ by PS-152 Team.
      </footer>

      <style>{`
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        @keyframes loginFadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loginPopIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes loginSlideUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes loginFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}

export default Login;
