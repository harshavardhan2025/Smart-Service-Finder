import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import authBg from "../assets/auth-bg.jpg";
import authMobileBg from "../assets/auth-mobile-bg.png";
import { use3dTilt } from "../utils/use3dTilt";
import { fetchAllWorkersCached } from "../utils/workerService";

// Safe JSON parser – prevents "Unexpected token 'A'" errors when backend
// is unreachable and the proxy/server returns an HTML error page instead of JSON.
const safeJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  // Non-JSON body (HTML error page from proxy or server) – return a safe error object
  const text = await response.text();
  console.error("Non-JSON response received:", text.slice(0, 200));
  return { error: "Server is unreachable – please try again shortly." };
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null); // { type: 'success'|'error', message: '' }
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const loginCardRef = use3dTilt();

  const handleGoogleLoginWithToken = async (accessToken) => {
    setIsLoading(true);
    setLoginStatus({ type: "success", message: "Verifying Google Authentication... 🔑" });
    console.log("📡 Sending token to backend /api/auth/google...");
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken })
      });
      console.log(`📡 Backend responded with status: ${response.status}`);
      const data = await safeJson(response);
      console.log("📡 Backend responded with data:", data);
      if (!response.ok) {
        console.error("❌ Backend token verification failed:", data.error);
        setIsLoading(false);
        setLoginStatus({ type: "error", message: data.error || "Google Sign-In failed!" });
        return;
      }
      console.log("✅ Google login verified successfully, calling handleLoginSuccess...");
      handleLoginSuccess(data);
    } catch (err) {
      console.error("💥 Fetch error verifying Google token:", err);
      setIsLoading(false);
      setLoginStatus({ type: "error", message: "Network error! The backend server is unreachable. Please ensure it is running." });
    }
  };

  // Prefetch workers & location data while user is on login page
  // so home page loads workers instantly after login
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Check for Google OAuth2 redirect token in URL hash
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        window.history.replaceState(null, null, window.location.pathname);
        const flow = sessionStorage.getItem("google_auth_flow");
        if (flow === "signup") {
          navigate(`/signup#access_token=${accessToken}`);
        } else {
          handleGoogleLoginWithToken(accessToken);
        }
      }
    }

    // Check for mock redirect auth errors
    const redirectError = sessionStorage.getItem("google_auth_error");
    if (redirectError) {
      setLoginStatus({ type: "error", message: redirectError });
      sessionStorage.removeItem("google_auth_error");
    }

    // Warm up the worker cache in background
    fetchAllWorkersCached();

    // If user has a saved city, prefetch geocode too
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
        .catch(() => {});
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLoginSuccess = (data) => {
    console.log("🔑 handleLoginSuccess called with data:", data);
    const user = data.user;
    if (!user) {
      console.error("❌ user object is missing in response data!");
      setLoginStatus({ type: "error", message: "Authentication response is missing user data." });
      setIsLoading(false);
      return;
    }
    console.log("👤 Logged in user:", user);
    sessionStorage.setItem("userRole", user.role);
    sessionStorage.setItem("userName", user.name);
    sessionStorage.setItem("userEmail", user.email);
    sessionStorage.setItem("userId", user.id || user._id);
    sessionStorage.setItem("authToken", data.token);
    localStorage.removeItem("manualLocationSet");

    if (user.role === "worker") {
      sessionStorage.setItem("loggedInWorkerId", user.id);
      setLoginStatus({ type: "success", message: `Welcome ${user.name}! Redirecting to dashboard... 🛠️` });
      console.log("🚀 Redirecting worker to /worker-dashboard...");
      setTimeout(() => navigate("/worker-dashboard"), 600);
    } else if (user.role === "admin") {
      setLoginStatus({ type: "success", message: "Welcome Administrator! Redirecting... 👑" });
      console.log("🚀 Redirecting admin to /admin-dashboard...");
      setTimeout(() => navigate("/admin-dashboard"), 600);
    } else {
      setLoginStatus({ type: "success", message: `Welcome ${user.name}! Redirecting... 🎉` });

      if (user.city) {
        sessionStorage.setItem("userCity", user.city);
        localStorage.setItem("userCity", user.city);
      }

      const targetCity = user.city || "Mumbai";

      console.log("🚀 Redirecting customer to /...");
      setTimeout(() => navigate("/"), 600);

      // Trigger background geocoding request to refresh coordinates in case of changes
      fetch(`/api/workers/geocode?q=${encodeURIComponent(targetCity)}`)
        .then(res => res.ok ? res.json() : null)
        .then(geoData => {
          console.log("🛰️ Geocode response received:", geoData);
          if (geoData?.lat && geoData?.lon) {
            localStorage.setItem("userLocation", geoData.label || targetCity);
            localStorage.setItem("userCoordsLat", String(parseFloat(geoData.lat)));
            localStorage.setItem("userCoordsLng", String(parseFloat(geoData.lon)));
          }
        })
        .catch((err) => {
          console.error("💥 Geocode fetch failed:", err);
        });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginStatus({ type: "error", message: "Please fill in all fields!" });
      return;
    }

    setIsLoading(true);
    setLoginStatus(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await safeJson(response);

      if (!response.ok) {
        setIsLoading(false);
        setLoginStatus({ type: "error", message: data.error || "Invalid email or password!" });
        return;
      }

      handleLoginSuccess(data);
    } catch (err) {
      setIsLoading(false);
      setLoginStatus({ type: "error", message: "Network error! The backend server is unreachable. Please ensure it is running on port 5000." });
    }
  };

  const handleGoogleSignIn = () => {
    console.log("🔍 handleGoogleSignIn clicked.");
    sessionStorage.setItem("google_auth_flow", "login");

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "849555982996-giolb22mkrfbg8c4ut0ohbv1ps9giv2o.apps.googleusercontent.com";
    const redirectUri = window.location.origin;
    const scope = encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=select_account`;

    const isLocalIp = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(window.location.hostname);

    if (isMobile && isLocalIp) {
      console.log("📱 Mobile device with local IP detected. Google OAuth does not allow local IPs. Redirecting to Mock Google Auth...");
      setLoginStatus({ type: "success", message: "Real Google Sign-In requires localhost or HTTPS. Launching Mock Google Sign-in for local IP testing..." });
      setTimeout(() => {
        window.location.href = "/google-auth?redirect=true";
      }, 1500);
      return;
    }

    // Always redirect on the same page
    console.log("📡 Redirecting user to Google OAuth on the same page...");
    window.location.href = authUrl;
  };


  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column"
    }}>
      <Navbar />

      <div
        className="auth-wrapper"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: isMobile ? "20px 12px" : "40px 20px",
          backgroundImage: `url(${isMobile ? authMobileBg : authBg})`, 
          backgroundSize: "cover", 
          backgroundPosition: "center", 
          backgroundRepeat: "no-repeat" 
        }}
      >
        <div
          className="premium-card"
          ref={loginCardRef}
          style={{
            width: isMobile ? "92%" : "100%",
            maxWidth: isMobile ? "340px" : "400px",
            backgroundColor: "var(--bg-card)",
            padding: isMobile ? "24px 20px" : "40px"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: isMobile ? "20px" : "30px" }}>
            <h1 style={{ margin: isMobile ? "0 0 4px 0" : "0 0 8px 0", fontSize: isMobile ? "22px" : "28px", fontWeight: 800, color: "var(--text-main)" }}>
              Welcome Back
            </h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: isMobile ? "12px" : "14px" }}>
              Login to manage your bookings and services
            </p>
          </div>

          {/* Inline Status Message */}
          {loginStatus && (
            <div
              style={{
                padding: isMobile ? "10px 14px" : "12px 16px",
                borderRadius: "10px",
                marginBottom: isMobile ? "12px" : "18px",
                fontSize: isMobile ? "12px" : "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                animation: "fadeIn 0.3s ease-out forwards",
                backgroundColor: loginStatus.type === "success" ? "#dcfce7" : "#fee2e2",
                color: loginStatus.type === "success" ? "#15803d" : "#dc2626",
                border: `1px solid ${loginStatus.type === "success" ? "#bbf7d0" : "#fecaca"}`
              }}
            >
              <span style={{ fontSize: "16px" }}>
                {loginStatus.type === "success" ? "✅" : "❌"}
              </span>
              {loginStatus.message}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, color: "var(--text-main)" }}>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setLoginStatus(null); }}
                style={{ 
                  width: "100%", 
                  boxSizing: "border-box",
                  padding: isMobile ? "10px" : "12px",
                  borderColor: loginStatus?.type === "error" ? "#fecaca" : undefined,
                  transition: "border-color 0.2s"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, color: "var(--text-main)" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginStatus(null); }}
                  style={{ 
                    width: "100%", 
                    boxSizing: "border-box",
                    padding: isMobile ? "10px" : "12px",
                    paddingRight: "40px",
                    borderColor: loginStatus?.type === "error" ? "#fecaca" : undefined,
                    transition: "border-color 0.2s"
                  }}
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
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{
                padding: isMobile ? "10px" : "12px",
                fontSize: isMobile ? "14px" : "15px",
                marginTop: "6px",
                width: "100%",
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
                position: "relative",
                background: "linear-gradient(135deg, #dfb453 0%, #f1a829 100%)",
                borderBottom: "4px solid #a67c1e",
                color: "white",
                boxShadow: "0 10px 30px rgba(223, 180, 83, 0.25)"
              }}
            >
              {isLoading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ 
                    width: "14px", height: "14px", 
                    border: "2px solid rgba(255,255,255,0.3)", 
                    borderTopColor: "white", 
                    borderRadius: "50%", 
                    display: "inline-block",
                    animation: "spin 0.6s linear infinite"
                  }} />
                  Signing In...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          {/* Social Divider */}
          <div style={{ display: "flex", alignItems: "center", margin: isMobile ? "16px 0" : "20px 0" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}></div>
            <span style={{ padding: "0 10px", color: "var(--text-muted)", fontSize: "12px" }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}></div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn-secondary"
            style={{
              padding: isMobile ? "10px" : "12px",
              fontSize: isMobile ? "14px" : "15px",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "none"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: "10px" }}>
              <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.7-1.57 2.68-3.88 2.68-6.57z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.23l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z"/>
              <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5H.95C.35 6.2.01 7.57.01 9s.34 2.8 1.04 4l2.92-2.3z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.41 0 9 0 5.5 0 2.43 2.11.95 5.1l2.97 2.3c.7-2.12 2.69-3.82 5.03-3.82z"/>
            </svg>
            Sign In with Google
          </button>

          <p style={{ textAlign: "center", marginTop: isMobile ? "16px" : "24px", margin: isMobile ? "16px 0 0 0" : "24px 0 0 0", fontSize: isMobile ? "13px" : "14px", color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
              Sign up
            </Link>
          </p>


        </div>
      </div>

      {/* Modern Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          color: "var(--text-secondary)",
          fontSize: "14px",
          backgroundColor: "var(--bg-card)",
          borderTop: "1px solid var(--border-color)",
          fontWeight: 500
        }}
      >
        © 2026 Workzy Inc. All rights reserved. Made with ❤️ by PS-152 Team.
      </footer>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Login;
