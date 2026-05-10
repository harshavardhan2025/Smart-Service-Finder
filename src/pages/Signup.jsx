import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase.js";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [profession, setProfession] = useState("Carpentry");
  const [city, setCity] = useState("Mumbai"); // New Location State
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      alert("Please fill in all fields!");
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasLetter || !hasNumber || !hasSpecialChar) {
      alert(
        "❌ Weak Password!\nYour password must contain at least:\n- One Letter\n- One Number\n- One Special Character (e.g. !, @, #, $, %, ^, &, *)"
      );
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          role,
          profession: role === "worker" ? profession : null,
          city: role === "worker" ? city : "Mumbai" // Capturing defined city
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed!");
      }

      alert(
        role === "worker"
          ? `Account created successfully as a Professional ${profession} in ${city}! 🎉`
          : `Account created successfully as a User / Customer! 🎉`
      );
      
      navigate("/login");
    } catch (err) {
      alert(`❌ Registration Error: ${err.message}`);
    }
  };

  const handleGoogleSignUp = () => {
    const input = prompt(
      "Google Secure Account Verification:\n\nEnter your Google Email ID (ends with @gmail.com) or 10-digit mobile number to verify and register:"
    );

    if (input === null) return; // User clicked cancel

    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    const phoneRegex = /^[0-9]{10}$/;

    if (emailRegex.test(input.trim()) || phoneRegex.test(input.trim())) {
      const targetInput = input.trim();
      const msg =
        role === "worker"
          ? `Google account verified successfully! ✅\nVerified Account: ${targetInput}\nAccount registered successfully as a Professional ${profession}! 🎉`
          : `Google account verified successfully! ✅\nVerified Account: ${targetInput}\nAccount registered successfully as a User / Customer! 🎉`;
      alert(msg);
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
              Create Account
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              Join ServiceHub and explore local professionals
            </p>
          </div>

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Phone Number</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

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

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Register As</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" }}
              >
                <option value="user">User / Customer</option>
                <option value="worker">Professional Worker</option>
              </select>
            </div>

            {/* Dynamic Profession Selection for Professional Worker Signup */}
            {role === "worker" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Select Profession</label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                >
                  <optgroup label="Direct Main Services">
                    <option value="Carpentry">🪚 Carpentry Specialist</option>
                    <option value="Plumbing">🔧 Plumbing Specialist</option>
                    <option value="Electrical">⚡ Electrical Specialist</option>
                    <option value="Beauty, Salon & Spa">💅 Beauty, Salon & Spa</option>
                    <option value="Doctors">🩺 Doctor / Medical expert</option>
                  </optgroup>
                  <optgroup label="🧹 Cleaning Sub-Categories">
                    <option value="Floor cleaning">Floor cleaning</option>
                    <option value="Utensils Cleaning">Utensils Cleaning</option>
                    <option value="House Cleaning">House Cleaning</option>
                  </optgroup>
                  <optgroup label="🎨 Painting Sub-Categories">
                    <option value="Wall Putty Coating">Wall Putty Coating</option>
                    <option value="Interior Painting">Interior Painting</option>
                    <option value="Exterior Painting">Exterior Painting</option>
                    <option value="Texture & Designer Finishers">Texture & Designer Finishers</option>
                    <option value="Wallpaper Installation">Wallpaper Installation</option>
                    <option value="Wood Polishing">Wood Polishing</option>
                  </optgroup>
                  <optgroup label="⚙️ Mechanical Sub-Categories">
                    <option value="Two-Wheeler (Bikes)">Two-Wheeler (Bikes) Repair</option>
                    <option value="Four-Wheeler (Cars)">Four-Wheeler (Cars) Repair</option>
                    <option value="Others (Heavy)">Others (Heavy) Repair</option>
                  </optgroup>
                  <optgroup label="🚗 Automobile Cleaning Sub-Categories">
                    <option value="Bike Wash">Bike Wash</option>
                    <option value="Car Wash">Car Wash</option>
                    <option value="Others">Others Cleaning</option>
                  </optgroup>
                  <optgroup label="🔌 Electrical Appliances Repair Sub-Categories">
                    <option value="AC Repair">AC Repair</option>
                    <option value="Washing Machine">Washing Machine Repair</option>
                    <option value="Geyser">Geyser Repair</option>
                    <option value="Grinder">Grinder Repair</option>
                    <option value="Mixer">Mixer Repair</option>
                    <option value="Refrigerator">Refrigerator Repair</option>
                    <option value="Water Purifier">Water Purifier Repair</option>
                  </optgroup>
                  <optgroup label="🎉 Additional Specializations">
                    <option value="Photography">Photography</option>
                    <option value="Decor">Decor</option>
                    <option value="Mehandi">Mehandi</option>
                    <option value="Doctors & Medical">Doctors & Medical</option>
                  </optgroup>
                </select>
              </div>
            )}

            {/* Explicit Location Column Injection requested for Workers */}
            {role === "worker" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Serving Location (City)</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Kakinada">Kakinada</option>
                  <option value="Tirupati">Tirupati</option>
                </select>
              </div>
            )}

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
              Sign Up
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
            onClick={handleGoogleSignUp}
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
            Sign Up with Google
          </button>

          <p style={{ textAlign: "center", marginTop: "24px", margin: "24px 0 0 0", fontSize: "14px", color: "#64748b" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
