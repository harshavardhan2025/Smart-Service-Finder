import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash, FaUser, FaTools, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaRocket, FaCheckCircle } from "react-icons/fa";
import safeJson from "../utils/safeJson";
import { useGoogleLogin } from "@react-oauth/google";
import { useRef } from "react";
import authBg from "../assets/auth-bg.jpg";
import authMobileBg from "../assets/auth-mobile-bg.png";

const PROFESSIONS = [
  { group: "Main Services", options: ["Carpentry", "Plumbing", "Electrical", "Beauty, Salon & Spa", "Doctors"] },
  { group: "Cleaning", options: ["Floor cleaning", "Utensils Cleaning", "House Cleaning", "Sofa & Carpet Cleaning"] },
  { group: "Painting", options: ["Wall Putty Coating", "Interior Painting", "Exterior Painting", "Texture & Designer Finishers", "Wallpaper Installation", "Wood Polishing"] },
  { group: "Mechanical", options: ["Two-Wheeler (Bikes)", "Four-Wheeler (Cars)", "Others (Heavy)"] },
  { group: "Automobile Cleaning", options: ["Bike Wash", "Car Wash", "Others"] },
  { group: "Appliance Repair", options: ["AC Repair", "Washing Machine", "Geyser", "Grinder", "Mixer", "Refrigerator", "Water Purifier", "TV & Electronics"] },
  { group: "IT & Tech", options: ["Computer Repair", "Network Setup", "Smart Home Installation"] },
  { group: "Home & Maintenance", options: ["Pest Control", "Termite Treatment", "Waterproofing"] },
  { group: "Specializations", options: ["Photography", "Decor", "Mehandi", "Doctors & Medical"] },
];

// ── Google "G" SVG Icon ────────────────────────────────────
function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.7-1.57 2.68-3.88 2.68-6.57z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.23l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5H.95C.35 6.2.01 7.57.01 9s.34 2.8 1.04 4l2.92-2.3z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.41 0 9 0 5.5 0 2.43 2.11.95 5.1l2.97 2.3c.7-2.12 2.69-3.82 5.03-3.82z" />
    </svg>
  );
}

// ── Result Popup ──────────────────────────────────────────
function ResultPopup({ result, onClose, navigate }) {
  useEffect(() => {
    if (result?.type === "success") {
      const role = sessionStorage.getItem("userRole");
      let targetPath = "/login";
      if (role) {
        targetPath = role === "worker" ? "/worker-dashboard" : "/";
      }
      const timer = setTimeout(() => navigate(targetPath), 800);
      return () => clearTimeout(timer);
    }
  }, [result, navigate]);

  if (!result) return null;

  const config = {
    success: { icon: "✅", title: "Registration Successful!", titleColor: "#15803d", bg: "rgba(22, 163, 74, 0.04)", border: "rgba(22, 163, 74, 0.2)" },
    exists: { icon: "⚠️", title: "Account Already Exists", titleColor: "#92400e", bg: "rgba(245, 158, 11, 0.04)", border: "rgba(245, 158, 11, 0.2)" },
    fail: { icon: "❌", title: "Registration Failed", titleColor: "#dc2626", bg: "rgba(220, 38, 38, 0.04)", border: "rgba(220, 38, 38, 0.2)" },
  }[result.type] || {};

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)",
      display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
    }}>
      <div style={{
        background: "var(--bg-card, white)",
        border: `2px solid ${config.border || "#e2e8f0"}`,
        borderRadius: "24px", padding: "44px 40px", maxWidth: "420px", width: "95%",
        textAlign: "center",
        boxShadow: "0 30px 80px rgba(0, 0, 0, 0.25)",
        animation: "signupPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both"
      }}>
        <div style={{ fontSize: "60px", marginBottom: "16px", lineHeight: 1, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}>
          {config.icon}
        </div>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "22px", fontWeight: 800, color: config.titleColor, letterSpacing: "-0.3px" }}>
          {config.title}
        </h2>
        <p style={{ margin: "0 0 28px 0", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          {result.message}
        </p>

        {result.type === "success" && (
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {sessionStorage.getItem("userRole") ? "Logging you in and redirecting..." : "Redirecting..."}
          </p>
        )}
        {result.type === "exists" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => navigate("/login")} style={{
              background: "linear-gradient(135deg, #1e3a5f, #2d5a9e)", color: "white",
              border: "none", borderRadius: "14px", padding: "14px 28px",
              fontSize: "14px", fontWeight: 700, cursor: "pointer", width: "100%",
              boxShadow: "0 6px 20px rgba(30, 58, 95, 0.3)",
            }}>
              🔑 Sign In to My Account
            </button>
            <button onClick={onClose} style={{
              background: "transparent", color: "var(--text-secondary)",
              border: "2px solid var(--border, #e2e8f0)", borderRadius: "14px",
              padding: "12px 28px", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", width: "100%",
            }}>
              Use a Different Account
            </button>
          </div>
        )}
        {result.type === "fail" && (
          <button onClick={onClose} style={{
            background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "white",
            border: "none", borderRadius: "14px", padding: "14px 36px",
            fontSize: "14px", fontWeight: 700, cursor: "pointer",
            boxShadow: "0 6px 20px rgba(220, 38, 38, 0.3)",
          }}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────
const Spinner = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
    <span style={{
      width: "16px", height: "16px",
      border: "2.5px solid rgba(255,255,255,0.3)",
      borderTopColor: "white",
      borderRadius: "50%",
      display: "inline-block",
      animation: "signupSpin 0.6s linear infinite",
    }} />
    Processing...
  </span>
);

// ── Shared Input Field Component ──────────────────────────────────────────
const InputField = ({ icon: Icon, label, hint, id, type = "text", placeholder, value, onChange, children, focusColor = "#2d5a9e", ...rest }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <label htmlFor={id} style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
      {label} {hint && <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 400, textTransform: "none" }}>{hint}</span>}
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
        id={id} type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: Icon ? "12px 14px 12px 40px" : "12px 14px",
          borderRadius: "12px",
          border: "2px solid var(--border, #e2e8f0)",
          background: "var(--bg-card, #ffffff)",
          color: "var(--text-main)", fontSize: "14px", fontWeight: 500,
          outline: "none", transition: "all 0.2s ease",
        }}
        onFocus={(e) => { e.target.style.borderColor = focusColor; e.target.style.boxShadow = `0 0 0 3px ${focusColor}15`; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border, #e2e8f0)"; e.target.style.boxShadow = "none"; }}
        {...rest}
      />
      {children}
    </div>
  </div>
);

function Signup() {
  // ── State ──────────────────────────────────────────────────
  const [step, setStep] = useState("choose"); // "choose" | "worker-details" | "email-form"

  // Worker details
  const [workerName, setWorkerName] = useState("");
  const [workerPhone, setWorkerPhone] = useState("");
  const [workerProfession, setWorkerProfession] = useState("Carpentry");
  const [workerCity, setWorkerCity] = useState("");

  // Email form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailRole, setEmailRole] = useState("user");
  const [emailProfession, setEmailProfession] = useState("Carpentry");
  const [emailCity, setEmailCity] = useState("");

  const [isLoading, setIsLoading] = useState(window.location.hash.includes("access_token"));
  const [popupResult, setPopupResult] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = params.get("access_token");
      if (accessToken) {
        let extraBody = {};
        try {
          const stored = sessionStorage.getItem("pendingGoogleData");
          if (stored) extraBody = JSON.parse(stored);
        } catch (e) {
          extraBody = { role: "user" }; // fallback
        }
        handleGoogleSignUpWithToken(accessToken, extraBody);
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
        sessionStorage.removeItem("pendingGoogleData");
      }
    }
  }, []);

  // ── Google OAuth Token Handler ─────────────────────────────
  const handleGoogleSignUpWithToken = async (accessToken, extraBody) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, ...extraBody })
      });
      const data = await safeJson(response);

      if (response.status === 409) {
        setPopupResult({ type: "exists", message: data.error || "An account with this Google email already exists. Please sign in instead." });
        return;
      }
      if (!response.ok) {
        setPopupResult({ type: "fail", message: data.error || "Registration failed. Please try again." });
        return;
      }
      if (!data.user?.email) {
        setPopupResult({ type: "fail", message: "Account verification failed." });
        return;
      }

      // Auto log-in
      sessionStorage.setItem("userRole", data.user.role);
      sessionStorage.setItem("userName", data.user.name);
      sessionStorage.setItem("userEmail", data.user.email);
      sessionStorage.setItem("userId", data.user.id || data.user._id);
      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("isWorker", String(data.user.isWorker || false));
      sessionStorage.setItem("workerProfileId", data.user.workerProfileId || "");
      localStorage.removeItem("manualLocationSet");
      if (data.user.role === "worker") {
        sessionStorage.setItem("loggedInWorkerId", data.user.workerProfileId || data.user.id);
        sessionStorage.setItem("workerSession_email", data.user.email);
        sessionStorage.setItem("workerSession_profileId", String(data.user.workerProfileId || data.user.id));
        sessionStorage.setItem("workerSession_name", data.user.name);
      } else if (data.user.city) {
        sessionStorage.setItem("userCity", data.user.city);
        localStorage.setItem("userCity", data.user.city);
      }

      localStorage.setItem("authSession", JSON.stringify({
        userRole: data.user.role, userName: data.user.name, userEmail: data.user.email,
        userId: data.user.id || data.user._id, authToken: data.token,
        isWorker: data.user.isWorker || false, workerProfileId: data.user.workerProfileId || null,
        loggedInWorkerId: data.user.role === "worker" ? (data.user.workerProfileId || data.user.id) : null,
        userCity: data.user.city || null, expiry: Date.now() + 7 * 24 * 60 * 60 * 1000
      }));

      setPopupResult({
        type: "success",
        message: extraBody.role === "worker"
          ? `Welcome, ${data.user.name}! Your Worker account as ${extraBody.profession} in ${extraBody.city} has been created.`
          : `Welcome, ${data.user.name}! Your Customer account has been created.`
      });
    } catch (err) {
      setPopupResult({ type: "fail", message: `Technical Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Launch Google Auth ─────────────────────────────────────
  const pendingGoogleDataRef = useRef({});

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await handleGoogleSignUpWithToken(tokenResponse.access_token, pendingGoogleDataRef.current);
    },
    onError: (error) => {
      setIsLoading(false);
      const errMsg = error?.error || error?.message || "";
      if (typeof errMsg === "string" && errMsg.toLowerCase().includes("closed")) return;
      setPopupResult({ type: "fail", message: "Google Sign-In failed or was cancelled." });
    },
    ux_mode: isMobile ? "redirect" : "popup",
  });

  const launchGoogleAuth = (extraBody = {}) => {
    pendingGoogleDataRef.current = extraBody;
    sessionStorage.setItem("pendingGoogleData", JSON.stringify(extraBody));
    setIsLoading(true);
    googleLogin();
  };

  // ── Customer Google Signup ─────────────────────────────────
  const handleCustomerGoogle = () => {
    launchGoogleAuth({ role: "user" });
  };

  // ── Worker Google Signup (after filling details) ───────────
  const handleWorkerGoogle = () => {
    if (!workerName.trim()) { setPopupResult({ type: "fail", message: "Please enter your full name." }); return; }
    const cleanPhone = workerPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setPopupResult({ type: "fail", message: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9." });
      return;
    }
    if (!workerCity.trim()) { setPopupResult({ type: "fail", message: "Please enter your serving location." }); return; }

    launchGoogleAuth({
      role: "worker",
      name: workerName.trim(),
      phone: cleanPhone,
      profession: workerProfession,
      city: workerCity.trim(),
    });
  };

  // ── Email Signup Handler ───────────────────────────────────
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setPopupResult({ type: "fail", message: "Please fill in all required fields." });
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setPopupResult({ type: "fail", message: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9." });
      return;
    }
    if (emailRole === "worker" && !emailCity.trim()) {
      setPopupResult({ type: "fail", message: "Please enter your serving location." });
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      setPopupResult({ type: "fail", message: "Password must have at least one letter, one number, and one special character." });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone: cleanPhone, role: emailRole, profession: emailRole === "worker" ? emailProfession : null, city: emailRole === "worker" ? emailCity : "Mumbai" })
      });
      const data = await safeJson(response);
      setIsLoading(false);

      if (!response.ok) {
        if (data.error?.toLowerCase().includes("registered as") || data.error?.toLowerCase().includes("already exists")) {
          setPopupResult({ type: "exists", message: data.error });
        } else {
          setPopupResult({ type: "fail", message: data.error || "Registration failed." });
        }
        return;
      }

      // Auto log-in on successful signup or dual-role activation
      if (data.token && data.user) {
        const activeRole = data.loginContext === "provider" ? "worker" : (data.user.role || emailRole);
        sessionStorage.setItem("userRole", activeRole);
        sessionStorage.setItem("actualRole", data.user.actualRole || data.user.role);
        sessionStorage.setItem("userName", data.user.name || name);
        sessionStorage.setItem("userEmail", data.user.email || email);
        sessionStorage.setItem("userId", data.user.id || data.user._id);
        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("isWorker", String(data.user.isWorker || false));
        sessionStorage.setItem("workerProfileId", data.user.workerProfileId || "");
        sessionStorage.setItem("loginContext", data.loginContext || (activeRole === "worker" ? "provider" : "user"));

        if (activeRole === "worker" || data.user.isWorker) {
          const wId = data.user.workerProfileId || (data.worker ? data.worker.id : (data.user.id || data.user._id));
          sessionStorage.setItem("loggedInWorkerId", String(wId));
          sessionStorage.setItem("workerSession_email", data.user.email);
          sessionStorage.setItem("workerSession_profileId", String(wId));
          sessionStorage.setItem("workerSession_name", data.user.name);
        } else if (data.user.city) {
          sessionStorage.setItem("userCity", data.user.city);
          localStorage.setItem("userCity", data.user.city);
        }

        localStorage.setItem("authSession", JSON.stringify({
          userRole: activeRole,
          actualRole: data.user.actualRole || data.user.role,
          loginContext: data.loginContext || (activeRole === "worker" ? "provider" : "user"),
          userName: data.user.name,
          userEmail: data.user.email,
          userId: data.user.id || data.user._id,
          authToken: data.token,
          isWorker: data.user.isWorker || false,
          workerProfileId: data.user.workerProfileId || null,
          loggedInWorkerId: (activeRole === "worker" || data.user.isWorker) ? (data.user.workerProfileId || data.user.id || data.user._id) : null,
          userCity: data.user.city || null,
          expiry: Date.now() + 7 * 24 * 60 * 60 * 1000
        }));

        window.dispatchEvent(new Event("storage"));
      }

      setPopupResult({
        type: "success",
        message: data.message || (emailRole === "worker"
          ? `Welcome! Your Worker account as ${emailProfession} in ${emailCity} is active!`
          : `Welcome! Your Customer account is active with full access to both roles!`)
      });
    } catch (err) {
      setIsLoading(false);
      setPopupResult({ type: "fail", message: `Network error: ${err.message}` });
    }
  };


  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary, #f8fafc)" }}>
      <Navbar />
      <ResultPopup result={popupResult} onClose={() => setPopupResult(null)} navigate={navigate} />

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
            position: "absolute", width: "500px", height: "500px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(223, 180, 83, 0.08) 0%, transparent 70%)",
            top: "-150px", left: "-100px", animation: "signupFloat 20s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", width: "400px", height: "400px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(5, 150, 105, 0.08) 0%, transparent 70%)",
            bottom: "-100px", right: "-100px", animation: "signupFloat 25s ease-in-out infinite reverse",
          }} />
        </div>

        <div style={{
          display: "flex", width: "100%", maxWidth: isMobile ? "340px" : "760px",
          borderRadius: "20px", overflow: "hidden",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          position: "relative", zIndex: 1,
          animation: "signupSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
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
                  background: "radial-gradient(circle, rgba(5, 150, 105, 0.12) 0%, transparent 70%)",
                  top: "-80px", right: "-80px",
                }} />
                <div style={{
                  position: "absolute", width: "200px", height: "200px", borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(223, 180, 83, 0.1) 0%, transparent 70%)",
                  bottom: "-60px", left: "-60px",
                }} />
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "16px", boxShadow: "0 6px 18px rgba(5, 150, 105, 0.3)",
                }}>
                  <FaRocket size={20} color="white" />
                </div>

                <h2 style={{
                  fontSize: "26px", fontWeight: 900, color: "white",
                  lineHeight: 1.2, marginBottom: "8px", letterSpacing: "-0.5px",
                }}>
                  Join the<br />
                  <span style={{ background: "linear-gradient(135deg, #dfb453, #f1a829)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Workzy
                  </span>{" "}
                  community
                </h2>

                <p style={{
                  fontSize: "13px", color: "rgba(255, 255, 255, 0.6)",
                  lineHeight: 1.6, marginBottom: "20px",
                }}>
                  Create your account today and access thousands of skilled professionals or start earning from your profession.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { icon: <FaCheckCircle />, text: "Free account creation" },
                    { icon: <FaCheckCircle />, text: "Verified professionals only" },
                    { icon: <FaCheckCircle />, text: "Instant access to all features" },
                    { icon: <FaCheckCircle />, text: "24/7 customer support" },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "8px 10px", borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.04)",
                    }}>
                      <span style={{ color: "#10b981", fontSize: "12px", flexShrink: 0, display: "flex" }}>
                        {item.icon}
                      </span>
                      <span style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.75)", fontWeight: 500 }}>
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

            {/* ═══════════════════════════════════════════════════════
                STEP 1: CHOOSE SIGNUP METHOD
            ═══════════════════════════════════════════════════════ */}
            {step === "choose" && (
              <>
                <div style={{ marginBottom: "18px" }}>
                  <h1 style={{
                    margin: "0 0 4px", fontSize: isMobile ? "21px" : "24px",
                    fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.5px",
                  }}>
                    Create Account
                  </h1>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.6 }}>
                    Choose how you'd like to join Workzy
                  </p>
                </div>

                {/* ── Card: Sign up as Customer ──────────────────── */}
                <button
                  type="button"
                  onClick={handleCustomerGoogle}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "16px",
                    padding: "20px 18px", marginBottom: "14px",
                    background: "var(--bg-card, white)",
                    border: "2px solid var(--border, #e2e8f0)",
                    borderRadius: "16px", cursor: "pointer", transition: "all 0.3s ease",
                    textAlign: "left", position: "relative",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(45, 90, 158, 0.12)"; e.currentTarget.style.borderColor = "#2d5a9e"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--border, #e2e8f0)"; }}
                >
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "14px",
                    background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", flexShrink: 0,
                    boxShadow: "0 6px 16px rgba(45, 90, 158, 0.25)",
                  }}>
                    <FaUser size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)", marginBottom: "3px" }}>
                      Sign up as Customer
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      Book services instantly with Google
                    </div>
                  </div>
                  <GoogleIcon size={22} />
                </button>

                {/* ── Card: Sign up as Worker ────────────────────── */}
                <button
                  type="button"
                  onClick={() => setStep("worker-details")}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "16px",
                    padding: "20px 18px", marginBottom: "20px",
                    background: "var(--bg-card, white)",
                    border: "2px solid var(--border, #e2e8f0)",
                    borderRadius: "16px", cursor: "pointer", transition: "all 0.3s ease",
                    textAlign: "left", position: "relative",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(5, 150, 105, 0.12)"; e.currentTarget.style.borderColor = "#059669"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--border, #e2e8f0)"; }}
                >
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "14px",
                    background: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", flexShrink: 0,
                    boxShadow: "0 6px 16px rgba(5, 150, 105, 0.25)",
                  }}>
                    <FaTools size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)", marginBottom: "3px" }}>
                      Sign up as Worker
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      Start earning from your skills
                    </div>
                  </div>
                  <GoogleIcon size={22} />
                </button>

                {/* ── Divider ────────────────────────────────────── */}
                <div style={{ display: "flex", alignItems: "center", margin: "4px 0 20px" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--border, #e2e8f0)" }} />
                  <span style={{ padding: "0 16px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>or</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border, #e2e8f0)" }} />
                </div>

                {/* ── Email & Password Button ────────────────────── */}
                <button
                  type="button"
                  onClick={() => setStep("email-form")}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    padding: "14px 18px",
                    background: "var(--bg-card, white)",
                    border: "2px solid var(--border, #e2e8f0)",
                    borderRadius: "14px", cursor: "pointer", transition: "all 0.2s",
                    fontSize: "14px", fontWeight: 700, color: "var(--text-main)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#dfb453"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(223, 180, 83, 0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border, #e2e8f0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <FaEnvelope size={14} />
                  Sign up with Email & Password
                </button>

                <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--text-muted)" }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "#2d5a9e", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
                </p>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════
                STEP 2: WORKER DETAILS FORM
            ═══════════════════════════════════════════════════════ */}
            {step === "worker-details" && (
              <>
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "12px",
                      background: "linear-gradient(135deg, #065f46, #059669)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 6px 16px rgba(5, 150, 105, 0.25)",
                    }}>
                      <FaTools size={18} color="white" />
                    </div>
                    <div>
                      <h1 style={{ margin: 0, fontSize: isMobile ? "22px" : "24px", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.3px" }}>
                        Worker Registration
                      </h1>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
                        Fill your details, then authenticate via Google
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <InputField
                    icon={FaUser}
                    label="Full Name" id="worker-name"
                    placeholder="e.g. Harsha Vardhan"
                    value={workerName} onChange={(e) => setWorkerName(e.target.value)}
                    focusColor="#059669" required
                  />

                  <InputField
                    icon={FaPhone}
                    label="Phone Number" hint="(10 digits)" id="worker-phone"
                    type="tel" placeholder="e.g. 9876543210"
                    value={workerPhone} onChange={(e) => setWorkerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10} focusColor="#059669" required
                  />

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                      Service / Profession *
                    </label>
                    <select
                      value={workerProfession} onChange={(e) => setWorkerProfession(e.target.value)}
                      style={{
                        width: "100%", boxSizing: "border-box", padding: "12px 14px",
                        borderRadius: "12px", border: "2px solid var(--border, #e2e8f0)",
                        background: "var(--bg-card, #fff)", color: "var(--text-main)",
                        fontSize: "14px", fontWeight: 500, outline: "none", transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#059669"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border, #e2e8f0)"}
                    >
                      {PROFESSIONS.map((g) =>
                        <optgroup key={g.group} label={g.group}>
                          {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <InputField
                    icon={FaMapMarkerAlt}
                    label="Serving Location" hint="(District, State)" id="worker-city"
                    placeholder="e.g. East Godavari, Andhra Pradesh"
                    value={workerCity} onChange={(e) => setWorkerCity(e.target.value)}
                    focusColor="#059669" required
                  />

                  <div style={{
                    background: "rgba(5, 150, 105, 0.05)",
                    border: "1px solid rgba(5, 150, 105, 0.15)",
                    borderRadius: "12px", padding: "12px 16px",
                    fontSize: "13px", color: "var(--text-secondary)",
                    display: "flex", alignItems: "center", gap: "10px",
                  }}>
                    <span style={{ fontSize: "18px", flexShrink: 0 }}>ℹ️</span>
                    After submitting, you'll be taken to Google to authenticate your account.
                  </div>

                  <button
                    type="button"
                    onClick={handleWorkerGoogle}
                    disabled={isLoading}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                      padding: "14px", borderRadius: "14px",
                      background: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
                      border: "none", color: "white", fontSize: "15px", fontWeight: 700,
                      cursor: isLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 8px 28px rgba(5, 150, 105, 0.3)",
                      transition: "all 0.3s ease", letterSpacing: "0.3px",
                    }}
                  >
                    {isLoading ? <Spinner /> : <><GoogleIcon size={18} /> Continue with Google</>}
                  </button>
                </div>

                <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-muted)" }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "#059669", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
                </p>

                <button
                  type="button"
                  onClick={() => setStep("choose")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    margin: "12px auto 0", background: "none", border: "none",
                    color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", padding: "6px 12px", borderRadius: "8px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-main)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                >
                  ← Back to options
                </button>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════
                STEP 3: EMAIL & PASSWORD FORM
            ═══════════════════════════════════════════════════════ */}
            {step === "email-form" && (
              <>
                <div style={{ marginBottom: "24px" }}>
                  <h1 style={{
                    margin: "0 0 6px", fontSize: isMobile ? "22px" : "26px",
                    fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.3px",
                  }}>
                    Sign up with Email
                  </h1>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>
                    Create your account using email & password
                  </p>
                </div>

                <form onSubmit={handleEmailSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <InputField
                    icon={FaUser}
                    label="Full Name" id="signup-name"
                    placeholder="e.g. Harsha Vardhan"
                    value={name} onChange={(e) => setName(e.target.value)}
                    focusColor="#dfb453" required
                  />

                  <InputField
                    icon={FaPhone}
                    label="Phone Number" hint="(10 digits)" id="signup-phone"
                    type="tel" placeholder="e.g. 9876543210"
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    focusColor="#dfb453" required
                  />

                  <InputField
                    icon={FaEnvelope}
                    label="Email Address" id="signup-email"
                    type="email" placeholder="name@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    focusColor="#dfb453" required
                  />

                  <InputField
                    icon={FaLock}
                    label="Password" id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    focusColor="#dfb453" required
                  >
                    <span
                      role="button" onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        color: "var(--text-muted)", padding: "4px", userSelect: "none",
                      }}
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </span>
                  </InputField>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                      Account Type
                    </label>
                    <select value={emailRole} onChange={(e) => setEmailRole(e.target.value)}
                      style={{
                        width: "100%", boxSizing: "border-box", padding: "12px 14px",
                        borderRadius: "12px", border: "2px solid var(--border, #e2e8f0)",
                        background: "var(--bg-card, #fff)", color: "var(--text-main)",
                        fontSize: "14px", fontWeight: 500, outline: "none", transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#dfb453"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border, #e2e8f0)"}
                    >
                      <option value="user">👤 Customer (Book Services)</option>
                      <option value="worker">🛠️ Service Provider (Offer Services)</option>
                    </select>
                  </div>

                  {emailRole === "worker" && (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                          Select Profession *
                        </label>
                        <select value={emailProfession} onChange={(e) => setEmailProfession(e.target.value)}
                          style={{
                            width: "100%", boxSizing: "border-box", padding: "12px 14px",
                            borderRadius: "12px", border: "2px solid var(--border, #e2e8f0)",
                            background: "var(--bg-card, #fff)", color: "var(--text-main)",
                            fontSize: "14px", fontWeight: 500, outline: "none", transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#dfb453"}
                          onBlur={(e) => e.target.style.borderColor = "var(--border, #e2e8f0)"}
                        >
                          {PROFESSIONS.map((g) =>
                            <optgroup key={g.group} label={g.group}>
                              {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </optgroup>
                          )}
                        </select>
                      </div>
                      <InputField
                        icon={FaMapMarkerAlt}
                        label="Serving Location" id="signup-city"
                        placeholder="e.g. Mumbai or Kadapa"
                        value={emailCity} onChange={(e) => setEmailCity(e.target.value)}
                        focusColor="#dfb453" required={emailRole === "worker"}
                      />
                    </>
                  )}

                  <button type="submit" disabled={isLoading}
                    style={{
                      padding: "14px", fontSize: "15px", fontWeight: 700, marginTop: "4px",
                      width: "100%", border: "none", borderRadius: "14px",
                      background: "linear-gradient(135deg, #dfb453 0%, #f1a829 100%)",
                      color: "white", cursor: isLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 8px 28px rgba(223, 180, 83, 0.3)",
                      transition: "all 0.3s ease", letterSpacing: "0.3px",
                      opacity: isLoading ? 0.7 : 1,
                    }}>
                    {isLoading ? <Spinner /> : "Create Account"}
                  </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-muted)" }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "#2d5a9e", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
                </p>

                <button
                  type="button"
                  onClick={() => setStep("choose")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    margin: "12px auto 0", background: "none", border: "none",
                    color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", padding: "6px 12px", borderRadius: "8px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-main)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                >
                  ← Back to options
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <footer style={{
        textAlign: "center", padding: "20px 24px",
        color: "var(--text-secondary)", fontSize: "13px",
        backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border)",
        fontWeight: 500,
      }}>
        © 2026 Workzy Inc. All rights reserved. Made with ❤️ by PS-152 Team.
      </footer>

      <style>{`
        @keyframes signupSpin { to { transform: rotate(360deg); } }
        @keyframes signupPopIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes signupSlideUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes signupFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}

export default Signup;
