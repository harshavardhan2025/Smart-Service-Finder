import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import authBg from "../assets/auth-bg.jpg";
import authMobileBg from "../assets/auth-mobile-bg.png";
import { use3dTilt } from "../utils/use3dTilt";

const PROFESSIONS = [
  { group: "Main Services", options: ["Carpentry", "Plumbing", "Electrical", "Beauty, Salon & Spa", "Doctors"] },
  { group: "Cleaning", options: ["Floor cleaning", "Utensils Cleaning", "House Cleaning"] },
  { group: "Painting", options: ["Wall Putty Coating", "Interior Painting", "Exterior Painting", "Texture & Designer Finishers", "Wallpaper Installation", "Wood Polishing"] },
  { group: "Mechanical", options: ["Two-Wheeler (Bikes)", "Four-Wheeler (Cars)", "Others (Heavy)"] },
  { group: "Automobile Cleaning", options: ["Bike Wash", "Car Wash", "Others"] },
  { group: "Appliance Repair", options: ["AC Repair", "Washing Machine", "Geyser", "Grinder", "Mixer", "Refrigerator", "Water Purifier"] },
  { group: "Specializations", options: ["Photography", "Decor", "Mehandi", "Doctors & Medical"] },
];

// Result Popup — handles 3 types: success | exists | fail
function ResultPopup({ result, onClose, navigate }) {
  useEffect(() => {
    if (result?.type === "success") {
      const role = sessionStorage.getItem("userRole");
      let targetPath = "/login";
      if (role) {
        targetPath = role === "worker" ? "/worker-dashboard" : "/";
      }
      const timer = setTimeout(() => navigate(targetPath), 2500);
      return () => clearTimeout(timer);
    }
  }, [result, navigate]);

  if (!result) return null;

  const config = {
    success: {
      icon: "✅",
      title: "Registration Successful!",
      titleColor: "#15803d",
      bg: "#f0fdf4",
      border: "#bbf7d0",
    },
    exists: {
      icon: "⚠️",
      title: "Account Already Exists",
      titleColor: "#92400e",
      bg: "#fffbeb",
      border: "#fde68a",
    },
    fail: {
      icon: "❌",
      title: "Registration Failed",
      titleColor: "#dc2626",
      bg: "#fff1f2",
      border: "#fecaca",
    },
  }[result.type] || {};

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(8px)",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div style={{
        background: config.bg || "white",
        border: `2px solid ${config.border || "#e2e8f0"}`,
        borderRadius: "22px",
        padding: "44px 40px",
        maxWidth: "400px",
        width: "90%",
        textAlign: "center",
        boxShadow: "0 28px 70px rgba(0,0,0,0.22)",
        animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both"
      }}>
        <div style={{ fontSize: "60px", marginBottom: "14px", lineHeight: 1 }}>
          {config.icon}
        </div>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "22px", fontWeight: 800, color: config.titleColor }}>
          {config.title}
        </h2>
        <p style={{ margin: "0 0 26px 0", fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>
          {result.message}
        </p>

        {result.type === "success" && (
          <p style={{ fontSize: "13px", color: "#94a3b8" }}>
            {sessionStorage.getItem("userRole") ? "Logging you in and redirecting to your dashboard..." : "Redirecting..."}
          </p>
        )}

        {result.type === "exists" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                backgroundColor: "#d97706",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "13px 28px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%"
              }}
            >
              🔑 Sign In to My Account
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                color: "#94a3b8",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "11px 28px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%"
              }}
            >
              Use a Different Account
            </button>
          </div>
        )}

        {result.type === "fail" && (
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "13px 32px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Try Again
          </button>
        )}
      </div>
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.72); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function Signup() {
  // ── State ──────────────────────────────────────────────────
  const [step, setStep] = useState("choose"); // "choose" | "worker-details" | "email-form"

  // Worker Google details
  const [wName, setWName]       = useState("");
  const [wPhone, setWPhone]     = useState("");
  const [wService, setWService] = useState("Carpentry");
  const [wCity, setWCity]       = useState("");

  // Email signup state
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState("user");
  const [profession, setProfession] = useState("Carpentry");
  const [city, setCity]         = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [popupResult, setPopupResult] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();
  const signupCardRef = use3dTilt();

  const handleGoogleSignUpWithToken = async (accessToken, extraBody) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, ...extraBody })
      });
      const data = await response.json();

      // ── Account already exists (409 from backend) ──
      if (response.status === 409) {
        setPopupResult({
          type: "exists",
          message: data.error || "An account with this Google email already exists. Please sign in instead."
        });
        return;
      }

      if (!response.ok) {
        setPopupResult({ type: "fail", message: data.error || "Registration failed. Please try again." });
        return;
      }

      if (!data.user?.email) {
        setPopupResult({ type: "fail", message: "Account verification failed. Could not confirm your account in our database." });
        return;
      }

      // Auto log-in on successful signup
      sessionStorage.setItem("userRole", data.user.role);
      sessionStorage.setItem("userName", data.user.name);
      sessionStorage.setItem("userEmail", data.user.email);
      sessionStorage.setItem("userId", data.user.id || data.user._id);
      sessionStorage.setItem("authToken", data.token);
      localStorage.removeItem("manualLocationSet");
      if (data.user.role === "worker") {
        sessionStorage.setItem("loggedInWorkerId", data.user.id);
      } else if (data.user.city) {
        sessionStorage.setItem("userCity", data.user.city);
        localStorage.setItem("userCity", data.user.city);
      }

      setPopupResult({
        type: "success",
        message: extraBody.role === "worker"
          ? `Welcome, ${data.user.name}! Your Worker account as ${extraBody.profession} in ${extraBody.city} has been created successfully.`
          : `Welcome, ${data.user.name}! Your Customer account has been created successfully.`
      });
    } catch (err) {
      setPopupResult({ type: "fail", message: `Technical Error: ${err.message}. Please check your connection.` });
    } finally {
      setIsLoading(false);
    }
  };

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

  // ── Email Signup Handler ───────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setPopupResult({ type: "fail", message: "Please fill in all required fields before submitting." });
      return;
    }
    if (role === "worker" && !city.trim()) {
      setPopupResult({ type: "fail", message: "Please enter your serving location." });
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      setPopupResult({ type: "fail", message: "Weak password! It must have at least one letter, one number, and one special character (e.g. @, #, !)." });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, role, profession: role === "worker" ? profession : null, city: role === "worker" ? city : "Mumbai" })
      });
      const data = await response.json();
      setIsLoading(false);

      // ── Account already exists ──
      if (response.status === 400 && data.error?.toLowerCase().includes("already exists")) {
        setPopupResult({
          type: "exists",
          message: `An account with ${email} already exists. You can sign in directly with your existing credentials.`
        });
        return;
      }

      if (!response.ok) {
        setPopupResult({ type: "fail", message: data.error || "Registration failed. Please try again." });
        return;
      }

      setPopupResult({
        type: "success",
        message: role === "worker"
          ? `Your Worker account as ${profession} in ${city} has been created successfully!`
          : `Your Customer account has been created successfully! Welcome aboard.`
      });
    } catch (err) {
      setIsLoading(false);
      setPopupResult({ type: "fail", message: `Network error: ${err.message}. Please check your connection.` });
    }
  };

  const launchGoogleAuth = (extraBody = {}) => {
    sessionStorage.setItem("google_auth_flow", "signup");
    sessionStorage.setItem("pending_google_signup", JSON.stringify(extraBody));

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "849555982996-giolb22mkrfbg8c4ut0ohbv1ps9giv2o.apps.googleusercontent.com";
    const redirectUri = window.location.origin;
    const scope = encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=select_account`;

    const isLocalIp = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(window.location.hostname);

    if (isMobile && isLocalIp) {
      console.log("📱 Mobile device with local IP detected. Google OAuth does not allow local IPs. Redirecting to Mock Google Auth...");
      setPopupResult({ 
        type: "fail", 
        message: "Google OAuth does not support local IP addresses (http://192.168.x.x) on mobile devices. Redirecting to Mock Google Sign-In so you can still test the signup flow..." 
      });
      setTimeout(() => {
        window.location.href = "/google-auth?redirect=true";
      }, 3000);
      return;
    }

    // Always redirect on the same page
    console.log("📡 Redirecting user to Google OAuth on the same page...");
    window.location.href = authUrl;
  };

  // ── Google Sign-Up for Customer ───────────────────────────
  const handleGoogleCustomer = () => {
    launchGoogleAuth({ role: "user", city: "Mumbai" });
  };

  // ── Google Sign-Up for Worker ─────────────────────────
  const handleGoogleWorker = (e) => {
    e.preventDefault();
    if (!wName.trim()) {
      setPopupResult({ type: "fail", message: "Please enter your full name." });
      return;
    }
    if (!wPhone.trim() || !/^[0-9]{10}$/.test(wPhone.trim())) {
      setPopupResult({ type: "fail", message: "Please enter a valid 10-digit phone number." });
      return;
    }
    if (!wCity.trim()) {
      setPopupResult({ type: "fail", message: "Please enter your serving location." });
      return;
    }
    launchGoogleAuth({ role: "worker", name: wName, phone: wPhone, profession: wService, city: wCity });
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Result Popup */}
      <ResultPopup
        result={popupResult}
        onClose={() => { setPopupResult(null); setStep("choose"); }}
        navigate={navigate}
      />

      <div
        className="auth-wrapper"
        style={{
          flex: 1,
          display: "flex", justifyContent: "center", alignItems: "center",
        padding: "40px 20px",
        backgroundImage: `url(${isMobile ? authMobileBg : authBg})`,
        backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat"
      }}>
        <div
          className="premium-card"
          ref={signupCardRef}
          style={{ width: "100%", maxWidth: "420px", backgroundColor: "var(--bg-card)", padding: "36px", boxSizing: "border-box" }}
        >

          {/* ─── STEP: CHOOSE METHOD ─── */}
          {step === "choose" && (
            <>
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <h1 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: 800, color: "var(--text-main)" }}>
                  Create Account
                </h1>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13.5px" }}>
                  Join Workzy – choose how you want to sign up
                </p>
              </div>

              {/* Two Google role cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                {/* Customer Card */}
                <button
                  onClick={handleGoogleCustomer}
                  disabled={isLoading}
                  style={{
                    display: "flex", alignItems: "center", gap: "16px",
                    padding: "18px 20px",
                    background: "linear-gradient(135deg, #eff6ff, #e0f2fe)",
                    border: "2px solid #bfdbfe",
                    borderRadius: "14px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    opacity: isLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(59,130,246,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <span style={{ fontSize: "32px" }}>👤</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#1e40af" }}>Sign up as Customer</div>
                    <div style={{ fontSize: "12px", color: "#60a5fa", marginTop: "2px" }}>Book services instantly. No extra details needed.</div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <GoogleIcon />
                  </div>
                </button>

                {/* Worker Card */}
                <button
                  onClick={() => setStep("worker-details")}
                  disabled={isLoading}
                  style={{
                    display: "flex", alignItems: "center", gap: "16px",
                    padding: "18px 20px",
                    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                    border: "2px solid #bbf7d0",
                    borderRadius: "14px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    opacity: isLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(34,197,94,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <span style={{ fontSize: "32px" }}>🛠️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#15803d" }}>Sign up as Worker</div>
                    <div style={{ fontSize: "12px", color: "#4ade80", marginTop: "2px" }}>Offer your services. Fill a few details first.</div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <GoogleIcon />
                  </div>
                </button>
              </div>

              {/* Divider + Email signup */}
              <div style={{ display: "flex", alignItems: "center", margin: "4px 0 16px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                <span style={{ padding: "0 10px", color: "var(--text-muted)", fontSize: "12px" }}>or use email instead</span>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              </div>
              <button
                type="button"
                onClick={() => setStep("email-form")}
                style={{
                  width: "100%", padding: "12px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px",
                  background: "transparent",
                  color: "var(--text-main)",
                  fontSize: "14px", fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                ✉️ Sign up with Email & Password
              </button>

              <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ─── STEP: WORKER DETAILS ─── */}
          {step === "worker-details" && (
            <>
              <button
                onClick={() => setStep("choose")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "6px",
                  color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px", padding: 0
                }}
              >
                ← Back
              </button>

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>🛠️</div>
                <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>
                  Worker Registration
                </h2>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
                  Fill in your details, then authenticate via Google
                </p>
              </div>

              <form onSubmit={handleGoogleWorker} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Harsha Vardhan"
                    value={wName}
                    onChange={(e) => setWName(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box" }}
                    required
                  />
                </div>

                {/* Phone */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Phone Number * <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(10 digits)</span></label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={wPhone}
                    onChange={(e) => setWPhone(e.target.value)}
                    maxLength={10}
                    style={{ width: "100%", boxSizing: "border-box" }}
                    required
                  />
                </div>

                {/* Service */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Service / Profession *</label>
                  <select
                    value={wService}
                    onChange={(e) => setWService(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  >
                    {PROFESSIONS.map((g) =>
                      <optgroup key={g.group} label={g.group}>
                        {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Location */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Serving Location * <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(District, State)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. East Godavari, Andhra Pradesh"
                    value={wCity}
                    onChange={(e) => setWCity(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box" }}
                    required
                  />
                </div>

                {/* Steps info pill */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 14px",
                  background: "rgba(66, 86, 100, 0.06)",
                  borderRadius: "10px",
                  border: "1px dashed rgba(66, 86, 100, 0.2)",
                  fontSize: "12.5px", color: "var(--primary)"
                }}>
                  <span>ℹ️</span>
                  <span>After submitting, you'll be taken to Google to authenticate your account.</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: "13px",
                    fontSize: "14px", fontWeight: 700,
                    borderRadius: "10px",
                    background: isLoading ? "#94a3b8" : "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                    color: "white",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex", justifyContent: "center", alignItems: "center", gap: "10px",
                    transition: "all 0.2s"
                  }}
                >
                  {isLoading ? (
                    <>
                      <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <GoogleIcon white />
                      Continue with Google
                    </>
                  )}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "18px", fontSize: "13px", color: "var(--text-muted)" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ─── STEP: EMAIL FORM ─── */}
          {step === "email-form" && (
            <>
              <button
                onClick={() => setStep("choose")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "6px",
                  color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px", padding: 0
                }}
              >
                ← Back
              </button>

              <div style={{ textAlign: "center", marginBottom: "22px" }}>
                <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>
                  Sign Up with Email
                </h2>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
                  Fill all the details to register your account
                </p>
              </div>

              <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Full Name</label>
                  <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Phone Number</label>
                  <input type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Email Address</label>
                  <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Register As</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                    <option value="user">User / Customer</option>
                    <option value="worker">Professional Worker</option>
                  </select>
                </div>
                {role === "worker" && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Select Profession</label>
                      <select value={profession} onChange={(e) => setProfession(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                        {PROFESSIONS.map((g) =>
                          <optgroup key={g.group} label={g.group}>
                            {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Serving Location</label>
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. East Godavari, Andhra Pradesh" style={{ width: "100%", boxSizing: "border-box" }} />
                    </div>
                  </>
                )}
                <button type="submit" className="btn-primary" style={{ padding: "12px", fontSize: "15px", marginTop: "6px", width: "100%" }}>
                  Sign Up
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
              </p>
            </>
          )}

        </div>
      </div>

      <footer style={{
        textAlign: "center", padding: "24px",
        color: "var(--text-muted)", fontSize: "14px",
        backgroundColor: "var(--bg-card)",
        borderTop: "1px solid var(--border)", fontWeight: 500
      }}>
        © 2026 Workzy Inc. All rights reserved. Made with ❤️ by PS-152 Team.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Google "G" SVG Icon ────────────────────────────────────
function GoogleIcon({ white = false }) {
  if (white) return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="white" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.7-1.57 2.68-3.88 2.68-6.57z"/>
      <path fill="rgba(255,255,255,0.85)" d="M9 18c2.43 0 4.47-.8 5.96-2.23l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z"/>
      <path fill="rgba(255,255,255,0.7)" d="M3.97 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5H.95C.35 6.2.01 7.57.01 9s.34 2.8 1.04 4l2.92-2.3z"/>
      <path fill="rgba(255,255,255,0.9)" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.41 0 9 0 5.5 0 2.43 2.11.95 5.1l2.97 2.3c.7-2.12 2.69-3.82 5.03-3.82z"/>
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.7-1.57 2.68-3.88 2.68-6.57z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.23l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5H.95C.35 6.2.01 7.57.01 9s.34 2.8 1.04 4l2.92-2.3z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.41 0 9 0 5.5 0 2.43 2.11.95 5.1l2.97 2.3c.7-2.12 2.69-3.82 5.03-3.82z"/>
    </svg>
  );
}

export default Signup;
