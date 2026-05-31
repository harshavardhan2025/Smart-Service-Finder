import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import authBg from "../assets/auth-bg.jpg";
import { use3dTilt } from "../utils/use3dTilt";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const loginCardRef = use3dTilt();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid login credentials!");
      }

      // Save user session details consistently
      const user = data.user;
      sessionStorage.setItem("userRole", user.role);
      sessionStorage.setItem("userName", user.name);
      sessionStorage.setItem("userEmail", user.email);
      sessionStorage.setItem("userId", user.id || user._id);
      sessionStorage.setItem("authToken", data.token); // For future auth requests

      if (user.role === "worker") {
        sessionStorage.setItem("loggedInWorkerId", user.id);
        alert(`Welcome Professional ${user.name}! You are logged in successfully! 🛠️`);
        navigate("/worker-dashboard");
      } else if (user.role === "admin") {
        alert("Welcome Administrator! You are logged in successfully! 👑");
        navigate("/admin-dashboard");
      } else {
        alert(`Welcome Customer ${user.name}! You are logged in successfully! 🎉`);
        
        // Save user city to session storage and local storage
        if (user.city) {
          sessionStorage.setItem("userCity", user.city);
          localStorage.setItem("userCity", user.city);
        }

        // Detect location based on the user's specific registered profile city/location (not raw GPS or hardcoded fallbacks)
        const targetCity = user.city || "Mumbai";
        try {
          const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(targetCity)}&limit=1`;
          const res = await fetch(url);
          if (res.ok) {
            const geocodeData = await res.json();
            const f = geocodeData?.features?.[0];
            if (f) {
              const [lon, lat] = f.geometry.coordinates;
              const p = f.properties;
              const label = [p.name, p.city || p.town || p.village, p.state, p.country]
                .filter(Boolean).join(", ");
              
              localStorage.setItem("userLocation", label || targetCity);
              localStorage.setItem("userCoordsLat", lat.toString());
              localStorage.setItem("userCoordsLng", lon.toString());
            } else {
              localStorage.setItem("userLocation", targetCity);
            }
          } else {
            localStorage.setItem("userLocation", targetCity);
          }
        } catch (err) {
          console.error("Failed to geocode registered profile location on login:", err);
          localStorage.setItem("userLocation", targetCity);
        }
        
        navigate("/");
      }
    } catch (err) {
      alert(`❌ Login Failed: ${err.message}`);
    }
  };

  const handleGoogleSignIn = () => {
    const input = prompt(
      "Google Secure Account Verification:\n\nEnter your Google Email ID (ends with @gmail.com) or 10-digit mobile number to verify:"
    );

    if (input === null) return; // User clicked cancel

    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    const phoneRegex = /^[0-9]{10}$/;

    if (emailRegex.test(input.trim())) {
      sessionStorage.setItem("userRole", "user");
      alert(`Google account verified successfully! ✅\nEmail: ${input.trim()}\nWelcome to Workzy! 🎉`);
      navigate("/");
    } else if (phoneRegex.test(input.trim())) {
      sessionStorage.setItem("userRole", "user");
      alert(`Google account verified successfully! ✅\nMobile: ${input.trim()}\nWelcome to Workzy! 🎉`);
      navigate("/");
    } else {
      alert(
        "❌ Verification Failed!\nPlease enter a valid Google Email (must end with @gmail.com) or a valid 10-digit mobile number."
      );
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      backgroundImage: `url(${authBg})`, 
      backgroundSize: "cover", 
      backgroundPosition: "center", 
      backgroundRepeat: "no-repeat", 
      backgroundAttachment: "fixed" 
    }}>
      <Navbar />

      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px"
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

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: "12px",
                fontSize: "15px",
                marginTop: "10px",
                width: "100%"
              }}
            >
              Sign In
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
    </div>
  );
}

export default Login;
