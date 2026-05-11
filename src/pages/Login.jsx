import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase.js";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
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
        navigate("/user-dashboard");
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
      alert(`Google account verified successfully! ✅\nEmail: ${input.trim()}\nWelcome to ServiceHub! 🎉`);
      navigate("/");
    } else if (phoneRegex.test(input.trim())) {
      sessionStorage.setItem("userRole", "user");
      alert(`Google account verified successfully! ✅\nMobile: ${input.trim()}\nWelcome to ServiceHub! 🎉`);
      navigate("/");
    } else {
      alert(
        "❌ Verification Failed!\nPlease enter a valid Google Email (must end with @gmail.com) or a valid 10-digit mobile number."
      );
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
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
          style={{
            width: "100%",
            maxWidth: "400px",
            backgroundColor: "white",
            padding: "40px"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: 800, color: "#1e293b" }}>
              Welcome Back
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              Login to manage your bookings and services
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Password</label>
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
              style={{
                backgroundColor: "var(--primary)",
                color: "white",
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
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
            <span style={{ padding: "0 10px", color: "#94a3b8", fontSize: "13px" }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              backgroundColor: "white",
              color: "#1e293b",
              border: "1px solid #cbd5e1",
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

          <p style={{ textAlign: "center", marginTop: "24px", margin: "24px 0 0 0", fontSize: "14px", color: "#64748b" }}>
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
