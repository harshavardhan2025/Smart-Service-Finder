import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash, FaUser, FaTools } from "react-icons/fa";
import authBg from "../assets/auth-bg.jpg";
import authMobileBg from "../assets/auth-mobile-bg.png";
import { triggerGoogleAuth } from "../utils/googleAuth";

// Safe JSON parser
const safeJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  console.error("Non-JSON response:", text.slice(0, 200));
  return { error: "Server is unreachable – please ensure the backend is running on port 5000." };
};

const PROFESSIONS = [
  { group: "Main Services", options: ["Carpentry", "Plumbing", "Electrical", "Beauty, Salon & Spa", "Doctors"] },
  { group: "Cleaning", options: ["Floor cleaning", "Utensils Cleaning", "House Cleaning"] },
  { group: "Painting", options: ["Wall Putty Coating", "Interior Painting", "Exterior Painting", "Texture & Designer Finishers", "Wallpaper Installation", "Wood Polishing"] },
  { group: "Mechanical", options: ["Two-Wheeler (Bikes)", "Four-Wheeler (Cars)", "Others (Heavy)"] },
  { group: "Automobile Cleaning", options: ["Bike Wash", "Car Wash", "Others"] },
  { group: "Appliance Repair", options: ["AC Repair", "Washing Machine", "Geyser", "Grinder", "Mixer", "Refrigerator", "Water Purifier"] },
  { group: "Specializations", options: ["Photography", "Decor", "Mehandi", "Doctors & Medical"] },
];

// ── Google "G" SVG Icon ────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.7-1.57 2.68-3.88 2.68-6.57z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.23l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5H.95C.35 6.2.01 7.57.01 9s.34 2.8 1.04 4l2.92-2.3z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.41 0 9 0 5.5 0 2.43 2.11.95 5.1l2.97 2.3c.7-2.12 2.69-3.82 5.03-3.82z"/>
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
    success: { icon: "✅", title: "Registration Successful!", titleColor: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
    exists:  { icon: "⚠️", title: "Account Already Exists", titleColor: "#92400e", bg: "#fffbeb", border: "#fde68a" },
    fail:    { icon: "❌", title: "Registration Failed", titleColor: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
  }[result.type] || {};

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div style={{ background: config.bg || "white", border: `2px solid ${config.border || "#e2e8f0"}`, borderRadius: "22px", padding: "44px 40px", maxWidth: "400px", width: "90%", textAlign: "center", boxShadow: "0 28px 70px rgba(0,0,0,0.22)", animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <div style={{ fontSize: "60px", marginBottom: "14px", lineHeight: 1 }}>{config.icon}</div>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "22px", fontWeight: 800, color: config.titleColor }}>{config.title}</h2>
        <p style={{ margin: "0 0 26px 0", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7 }}>{result.message}</p>

        {result.type === "success" && (
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {sessionStorage.getItem("userRole") ? "Logging you in and redirecting..." : "Redirecting..."}
          </p>
        )}
        {result.type === "exists" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => navigate("/login")} style={{ backgroundColor: "var(--warning)", color: "white", border: "none", borderRadius: "12px", padding: "13px 28px", fontSize: "14px", fontWeight: 700, cursor: "pointer", width: "100%" }}>🔑 Sign In to My Account</button>
            <button onClick={onClose} style={{ backgroundColor: "transparent", color: "var(--text-secondary)", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "11px 28px", fontSize: "13px", fontWeight: 600, cursor: "pointer", width: "100%" }}>Use a Different Account</button>
          </div>
        )}
        {result.type === "fail" && (
          <button onClick={onClose} style={{ backgroundColor: "var(--danger)", color: "white", border: "none", borderRadius: "12px", padding: "13px 32px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Try Again</button>
        )}
      </div>
      <style>{`@keyframes popIn { 0% { opacity: 0; transform: scale(0.72); } 100% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

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

  // ── Google OAuth Return ────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        window.history.replaceState(null, null, window.location.pathname);
        const flow = sessionStorage.getItem("google_auth_flow");
        if (flow === "signup") {
          const pendingSignupStr = sessionStorage.getItem("pending_google_signup");
          const extraBody = pendingSignupStr ? JSON.parse(pendingSignupStr) : {};
          handleGoogleSignUpWithToken(accessToken, extraBody);
        }
      }
    }
    const redirectError = sessionStorage.getItem("google_auth_error");
    if (redirectError) {
      setPopupResult({ type: "fail", message: redirectError });
      sessionStorage.removeItem("google_auth_error");
    }
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Launch Google Auth ─────────────────────────────────────
  const launchGoogleAuth = (extraBody = {}) => {
    setIsLoading(true);

    triggerGoogleAuth({
      flow: "signup",
      extraBody,
      navigate,
      onSuccess: async (accessToken) => {
        await handleGoogleSignUpWithToken(accessToken, extraBody);
      },
      onError: (errMsg) => {
        setIsLoading(false);
        setPopupResult({ type: "fail", message: errMsg });
      },
      onFallback: () => {
        setIsLoading(false);
        navigate("/google-auth?redirect=true");
      },
    });
  };

  // ── Customer Google Signup ─────────────────────────────────
  const handleCustomerGoogle = () => {
    launchGoogleAuth({ role: "user" });
  };

  // ── Worker Google Signup (after filling details) ───────────
  const handleWorkerGoogle = () => {
    if (!workerName.trim()) { setPopupResult({ type: "fail", message: "Please enter your full name." }); return; }
    if (!workerPhone.trim() || !/^\d{10}$/.test(workerPhone.trim())) { setPopupResult({ type: "fail", message: "Please enter a valid 10-digit phone number." }); return; }
    if (!workerCity.trim()) { setPopupResult({ type: "fail", message: "Please enter your serving location." }); return; }

    launchGoogleAuth({
      role: "worker",
      name: workerName.trim(),
      phone: workerPhone.trim(),
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
        body: JSON.stringify({ name, email, password, phone, role: emailRole, profession: emailRole === "worker" ? emailProfession : null, city: emailRole === "worker" ? emailCity : "Mumbai" })
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <ResultPopup result={popupResult} onClose={() => setPopupResult(null)} navigate={navigate} />

      <div
        className="auth-wrapper"
        style={{
          flex: 1, display: "flex", justifyContent: "center", alignItems: "center",
          padding: isMobile ? "24px 14px" : "48px 24px",
          backgroundImage: `url(${isMobile ? authMobileBg : authBg})`,
          backgroundSize: "100% 100%", backgroundPosition: "center center", backgroundRepeat: "no-repeat",
          backgroundColor: "#b4d5fa"
        }}
      >
        <div
          className="premium-card"
          style={{
            width: "100%", maxWidth: "440px", backgroundColor: "var(--bg-card)",
            padding: isMobile ? "26px 20px" : "36px", boxSizing: "border-box",
            borderRadius: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          }}
        >
          {/* ═══════════════════════════════════════════════════════
              STEP 1: CHOOSE SIGNUP METHOD
          ═══════════════════════════════════════════════════════ */}
          {step === "choose" && (
            <>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <h1 style={{ margin: "0 0 6px", fontSize: isMobile ? "24px" : "28px", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.5px" }}>
                  Create Account
                </h1>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
                  Join Workzy – choose how you want to sign up
                </p>
              </div>

              {/* ── Card: Sign up as Customer ──────────────────── */}
              <button
                type="button"
                onClick={handleCustomerGoogle}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "14px",
                  padding: "18px 16px", marginBottom: "12px",
                  background: "linear-gradient(135deg, rgba(66, 133, 244, 0.06) 0%, rgba(52, 168, 83, 0.06) 100%)",
                  border: "1.5px solid rgba(66, 133, 244, 0.2)",
                  borderRadius: "14px", cursor: "pointer", transition: "all 0.2s",
                  textAlign: "left", position: "relative",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(66,133,244,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{
                  width: "46px", height: "46px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", color: "white", flexShrink: 0,
                }}>
                  <FaUser size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-main)", marginBottom: "2px" }}>
                    Sign up as Customer
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    Book services instantly. No extra details needed.
                  </div>
                </div>
                <GoogleIcon />
              </button>

              {/* ── Card: Sign up as Worker ────────────────────── */}
              <button
                type="button"
                onClick={() => setStep("worker-details")}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "14px",
                  padding: "18px 16px", marginBottom: "16px",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)",
                  border: "1.5px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "14px", cursor: "pointer", transition: "all 0.2s",
                  textAlign: "left", position: "relative",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,185,129,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{
                  width: "46px", height: "46px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", color: "white", flexShrink: 0,
                }}>
                  <FaTools size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-main)", marginBottom: "2px" }}>
                    Sign up as Worker
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    Offer your services. Fill a few details first.
                  </div>
                </div>
                <GoogleIcon />
              </button>

              {/* ── Divider ────────────────────────────────────── */}
              <div style={{ display: "flex", alignItems: "center", margin: "4px 0 16px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                <span style={{ padding: "0 12px", color: "var(--text-muted)", fontSize: "12px" }}>or use email instead</span>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              </div>

              {/* ── Email & Password Button ────────────────────── */}
              <button
                type="button"
                onClick={() => setStep("email-form")}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "13px 18px",
                  background: "var(--bg-card-hover)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
                  fontSize: "14px", fontWeight: 600, color: "var(--text-main)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                📧 Sign up with Email & Password
              </button>

              <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 2: WORKER DETAILS FORM
          ═══════════════════════════════════════════════════════ */}
          {step === "worker-details" && (
            <>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>🛠️</div>
                <h1 style={{ margin: "0 0 6px", fontSize: isMobile ? "20px" : "22px", fontWeight: 800, color: "var(--text-main)" }}>
                  Worker Registration
                </h1>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "12.5px" }}>
                  Fill in your details, then authenticate via Google
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Full Name *</label>
                  <input
                    type="text" placeholder="e.g. Harsha Vardhan"
                    value={workerName} onChange={(e) => setWorkerName(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: "10px", border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px", outline: "none" }}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Phone Number * <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 400 }}>(10 digits)</span></label>
                  <input
                    type="tel" placeholder="e.g. 9876543210"
                    value={workerPhone} onChange={(e) => setWorkerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: "10px", border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px", outline: "none" }}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Service / Profession *</label>
                  <select
                    value={workerProfession} onChange={(e) => setWorkerProfession(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: "10px", border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px", outline: "none" }}
                  >
                    {PROFESSIONS.map((g) =>
                      <optgroup key={g.group} label={g.group}>
                        {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Serving Location * <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 400 }}>(District, State)</span></label>
                  <input
                    type="text" placeholder="e.g. East Godavari, Andhra Pradesh"
                    value={workerCity} onChange={(e) => setWorkerCity(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: "10px", border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px", outline: "none" }}
                    required
                  />
                </div>

                <div style={{ background: "var(--info-light)", border: "1px solid rgba(14, 165, 233, 0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>ℹ️</span>
                  After submitting, you'll be taken to Google to authenticate your account.
                </div>

                <button
                  type="button"
                  onClick={handleWorkerGoogle}
                  disabled={isLoading}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    padding: "13px", borderRadius: "12px",
                    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    border: "none", color: "white", fontSize: "15px", fontWeight: 700,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 8px 24px rgba(5, 150, 105, 0.3)", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              </div>

              <p style={{ textAlign: "center", marginTop: "18px", fontSize: "13px", color: "var(--text-muted)" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
              </p>

              <button
                type="button"
                onClick={() => setStep("choose")}
                style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
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
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h1 style={{ margin: "0 0 6px", fontSize: isMobile ? "22px" : "24px", fontWeight: 800, color: "var(--text-main)" }}>
                  Sign up with Email
                </h1>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
                  Create your account using email & password
                </p>
              </div>

              <form onSubmit={handleEmailSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Full Name *</label>
                  <input type="text" placeholder="e.g. Harsha Vardhan" value={name} onChange={(e) => setName(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }} required />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Phone Number *</label>
                  <input type="tel" placeholder="e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }} required />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Email Address *</label>
                  <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }} required />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Password *</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 40px 10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }} required />
                    <span role="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-muted)", padding: "4px", userSelect: "none" }}>
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Account Type</label>
                  <select value={emailRole} onChange={(e) => setEmailRole(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }}>
                    <option value="user">👤 Customer (Book Services)</option>
                    <option value="worker">🛠️ Service Provider (Offer Services)</option>
                  </select>
                </div>

                {emailRole === "worker" && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Select Profession *</label>
                      <select value={emailProfession} onChange={(e) => setEmailProfession(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }}>
                        {PROFESSIONS.map((g) =>
                          <optgroup key={g.group} label={g.group}>
                            {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Serving Location *</label>
                      <input type="text" value={emailCity} onChange={(e) => setEmailCity(e.target.value)} placeholder="e.g. Mumbai or Kadapa"
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }} required={emailRole === "worker"} />
                    </div>
                  </>
                )}

                <button type="submit" disabled={isLoading}
                  style={{
                    padding: "13px", fontSize: "15px", fontWeight: 700, marginTop: "4px", width: "100%",
                    background: "linear-gradient(135deg, #dfb453 0%, #f1a829 100%)", border: "none",
                    borderRadius: "10px", color: "white", cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 8px 24px rgba(223, 180, 83, 0.3)", transition: "all 0.2s"
                  }}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "18px", fontSize: "13px", color: "var(--text-muted)" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
              </p>

              <button
                type="button"
                onClick={() => setStep("choose")}
                style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                ← Back to options
              </button>
            </>
          )}
        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "14px", backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border)", fontWeight: 500 }}>
        © 2026 Workzy Inc. All rights reserved. Made with ❤️ by PS-152 Team.
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Signup;
