/* global google */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import authBg from "../assets/auth-bg.jpg";
import authMobileBg from "../assets/auth-mobile-bg.png";
import { use3dTilt } from "../utils/use3dTilt";
import { fetchAllWorkersCached } from "../utils/workerService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null); // { type: 'success'|'error', message: '' }
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const loginCardRef = use3dTilt();

  // Prefetch workers & location data while user is on login page
  // so home page loads workers instantly after login
  useEffect(() => {
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
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLoginSuccess = (data) => {
    const user = data.user;
    sessionStorage.setItem("userRole", user.role);
    sessionStorage.setItem("userName", user.name);
    sessionStorage.setItem("userEmail", user.email);
    sessionStorage.setItem("userId", user.id || user._id);
    sessionStorage.setItem("authToken", data.token);

    if (user.role === "worker") {
      sessionStorage.setItem("loggedInWorkerId", user.id);
      setLoginStatus({ type: "success", message: `Welcome ${user.name}! Redirecting to dashboard... 🛠️` });
      setTimeout(() => navigate("/worker-dashboard"), 600);
    } else if (user.role === "admin") {
      setLoginStatus({ type: "success", message: "Welcome Administrator! Redirecting... 👑" });
      setTimeout(() => navigate("/admin-dashboard"), 600);
    } else {
      setLoginStatus({ type: "success", message: `Welcome ${user.name}! Redirecting... 🎉` });

      if (user.city) {
        sessionStorage.setItem("userCity", user.city);
        localStorage.setItem("userCity", user.city);
      }

      setTimeout(() => navigate("/"), 600);

      const targetCity = user.city || "Mumbai";
      fetch(`/api/workers/geocode?q=${encodeURIComponent(targetCity)}`)
        .then(res => res.ok ? res.json() : null)
        .then(geoData => {
          if (geoData?.lat && geoData?.lon) {
            localStorage.setItem("userLocation", geoData.label || targetCity);
            localStorage.setItem("userCoordsLat", String(parseFloat(geoData.lat)));
            localStorage.setItem("userCoordsLng", String(parseFloat(geoData.lon)));
          } else {
            localStorage.setItem("userLocation", targetCity);
          }
        })
        .catch(() => localStorage.setItem("userLocation", targetCity));
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

      const data = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        setLoginStatus({ type: "error", message: data.error || "Invalid email or password!" });
        return;
      }

      handleLoginSuccess(data);
    } catch (err) {
      setIsLoading(false);
      setLoginStatus({ type: "error", message: "Network error! Please check your connection." });
    }
  };

  const handleGoogleSignIn = () => {
    if (!window.google) {
      setLoginStatus({ type: "error", message: "Google SDK is not loaded yet. Please refresh or try again!" });
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || "565022097960-4l136709q4clm2a1l9231f855d0j0eef.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      callback: async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          setIsLoading(true);
          setLoginStatus({ type: "success", message: "Verifying Google Authentication... 🔑" });

          try {
            const response = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken: tokenResponse.access_token
              })
            });

            const data = await response.json();

            if (!response.ok) {
              setIsLoading(false);
              setLoginStatus({ type: "error", message: data.error || "Google Sign-In failed!" });
              return;
            }

            handleLoginSuccess(data);
          } catch (err) {
            setIsLoading(false);
            setLoginStatus({ type: "error", message: "Network error during Google Sign-In!" });
          }
        }
      }
    });

    client.requestAccessToken();
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column"
    }}>
      <Navbar />

      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 20px",
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
            width: "100%",
            maxWidth: "400px",
            backgroundColor: "var(--bg-card)",
            padding: "40px"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: 800, color: "var(--text-main)" }}>
              Welcome Back
            </h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px" }}>
              Login to manage your bookings and services
            </p>
          </div>

          {/* Inline Status Message */}
          {loginStatus && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                marginBottom: "18px",
                fontSize: "13px",
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
              <span style={{ fontSize: "18px" }}>
                {loginStatus.type === "success" ? "✅" : "❌"}
              </span>
              {loginStatus.message}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setLoginStatus(null); }}
                style={{ 
                  width: "100%", 
                  boxSizing: "border-box",
                  borderColor: loginStatus?.type === "error" ? "#fecaca" : undefined,
                  transition: "border-color 0.2s"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginStatus(null); }}
                style={{ 
                  width: "100%", 
                  boxSizing: "border-box",
                  borderColor: loginStatus?.type === "error" ? "#fecaca" : undefined,
                  transition: "border-color 0.2s"
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{
                padding: "12px",
                fontSize: "15px",
                marginTop: "10px",
                width: "100%",
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
                position: "relative"
              }}
            >
              {isLoading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ 
                    width: "16px", height: "16px", 
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
          <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}></div>
            <span style={{ padding: "0 10px", color: "var(--text-muted)", fontSize: "13px" }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}></div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn-secondary"
            style={{
              padding: "12px",
              fontSize: "15px",
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

          <p style={{ textAlign: "center", marginTop: "24px", margin: "24px 0 0 0", fontSize: "14px", color: "var(--text-muted)" }}>
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
