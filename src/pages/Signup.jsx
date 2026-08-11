import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import authBg from "../assets/auth-bg.jpg";
import authMobileBg from "../assets/auth-mobile-bg.png";
import { use3dTilt } from "../utils/use3dTilt";

// Safe JSON parser – prevents "Unexpected token" errors when backend
// returns HTML instead of JSON (e.g. proxy error when backend is down).
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

// Result Popup — handles 3 types: success | exists | fail
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
    success: {
      icon: "✅",
      title: "Registration Successful!",
      titlecolor: "var(--success)",
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
      titlecolor: "var(--danger)",
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
        <p style={{ margin: "0 0 26px 0", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          {result.message}
        </p>

        {result.type === "success" && (
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {sessionStorage.getItem("userRole") ? "Logging you in and redirecting to your dashboard..." : "Redirecting..."}
          </p>
        )}

        {result.type === "exists" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                backgroundcolor: "var(--warning)",
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
                color: "var(--text-secondary)",
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
              backgroundcolor: "var(--danger)",
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
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole]         = useState("user");
  const [profession, setProfession] = useState("Carpentry");
  const [city, setCity]         = useState("");

  const [isLoading, setIsLoading] = useState(window.location.hash.includes("access_token"));
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
      const data = await safeJson(response);

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

      // 🔒 Persist login for 1 week across browser sessions
      localStorage.setItem("authSession", JSON.stringify({
        userRole: data.user.role,
        userName: data.user.name,
        userEmail: data.user.email,
        userId: data.user.id || data.user._id,
        authToken: data.token,
        isWorker: data.user.isWorker || false,
        workerProfileId: data.user.workerProfileId || null,
        loggedInWorkerId: data.user.role === "worker" ? (data.user.workerProfileId || data.user.id) : null,
        userCity: data.user.city || null,
        expiry: Date.now() + 7 * 24 * 60 * 60 * 1000
      }));

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
      const data = await safeJson(response);
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

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Result Popup */}
      <ResultPopup
        result={popupResult}
        onClose={() => setPopupResult(null)}
        navigate={navigate}
      />

      <div
        className="auth-wrapper"
        style={{
          flex: 1,
          display: "flex", justifyContent: "center", alignItems: "center",
          padding: isMobile ? "24px 14px" : "48px 24px",
          backgroundImage: `url(${isMobile ? authMobileBg : authBg})`,
          backgroundSize: "100% 100%", backgroundPosition: "center center", backgroundRepeat: "no-repeat",
          backgroundColor: "#b4d5fa"
        }}>
        <div
          className="premium-card"
          ref={signupCardRef}
          style={{ width: "100%", maxWidth: "440px", backgroundColor: "var(--bg-card)", padding: isMobile ? "26px 20px" : "36px", boxSizing: "border-box", borderRadius: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
        >
          <div style={{ textAlign: "center", marginBottom: "22px" }}>
            <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 800, color: "var(--text-main)" }}>
              Create an Account
            </h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
              Join Workzy to book services or offer your expertise
            </p>
          </div>

          {/* Quick Google Sign Up */}
          <button
            type="button"
            onClick={() => launchGoogleAuth({ 
              role, 
              name: name.trim() || undefined, 
              phone: phone.trim() || undefined, 
              profession: role === "worker" ? profession : undefined, 
              city: role === "worker" ? (city.trim() || "Mumbai") : "Mumbai" 
            })}
            disabled={isLoading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "12px 18px",
              background: "var(--bg-card)",
              border: "1.5px solid var(--border)",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-main)",
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              transition: "all 0.2s",
              marginBottom: "16px"
            }}
          >
            <GoogleIcon />
            <span>Sign up with Google</span>
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", margin: "14px 0 18px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ padding: "0 12px", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>or sign up with email</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          {/* Direct Normal Signup Form */}
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Full Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Harsha Vardhan" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }} 
                required 
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Phone Number *</label>
              <input 
                type="tel" 
                placeholder="e.g. 9876543210" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }} 
                required 
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Email Address *</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }} 
                required 
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Password *</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 40px 10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }} 
                  required 
                />
                <span
                  role="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "var(--text-muted)",
                    padding: "4px",
                    userSelect: "none"
                  }}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Account Type</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }}
              >
                <option value="user">👤 Customer (Book Services)</option>
                <option value="worker">🛠️ Service Provider (Offer Services)</option>
              </select>
            </div>

            {role === "worker" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Select Profession *</label>
                  <select 
                    value={profession} 
                    onChange={(e) => setProfession(e.target.value)} 
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }}
                  >
                    {PROFESSIONS.map((g) =>
                      <optgroup key={g.group} label={g.group}>
                        {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Serving Location (City / District) *</label>
                  <input 
                    type="text" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    placeholder="e.g. Mumbai or Visakhapatnam" 
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }} 
                    required={role === "worker"}
                  />
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                padding: "13px", 
                fontSize: "15px", 
                fontWeight: 700,
                marginTop: "6px", 
                width: "100%", 
                background: "linear-gradient(135deg, #dfb453 0%, #f1a829 100%)", 
                border: "none",
                borderRadius: "10px", 
                color: "white", 
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 8px 24px rgba(223, 180, 83, 0.3)",
                transition: "all 0.2s"
              }}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
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
