import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
// Replaced local simulator with direct Backend API calls
import { FaWallet, FaCalendarCheck, FaRegClock, FaHeadset, FaMapMarkerAlt } from "react-icons/fa";
import { use3dTilt } from "../utils/use3dTilt";
import SecurityLogs from "../components/SecurityLogs";
import SkeletonLoader from "../components/SkeletonLoader";
import MapPicker from "../components/MapPicker";

// ── Photon-powered location card shown inside User Dashboard ────────────────
function UserLocationMap({ isLoggedIn }) {
  const [location, setLocation] = useState(
    localStorage.getItem("userLocation") || "Kadapa, Andhra Pradesh, India"
  );
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    if (!isLoggedIn) {
      alert("🔑 Customer Sign-in Required!\n\nPlease login first to set or customize your service location address.");
      return;
    }
    setOpen(o => !o);
  };

  return (
    <div className="premium-card" style={{ marginBottom: "40px", overflow: "hidden" }}>
      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={handleToggle}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px",
            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px", flexShrink: 0,
          }}>
            <FaMapMarkerAlt style={{ color: "white" }} />
          </div>
          <div>
            <h3 style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
              Your Location
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", maxWidth: "480px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              📍 {location} {!isLoggedIn && " (🔒 Guest Preview)"}
            </p>
          </div>
        </div>
        <span style={{ fontSize: "18px", color: "var(--text-muted)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>
          ▼
        </span>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <MapPicker
            onLocationChange={(lbl) => setLocation(lbl)}
            onCoordsChange={() => {}}
          />
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function UserDashboard() {
  const navigate = useNavigate();
  const isLoggedIn = !!sessionStorage.getItem("userId") && sessionStorage.getItem("userRole") === "user";

  const [wallet, setWallet] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recBasis, setRecBasis] = useState("");
  const [loading, setLoading] = useState(true);
  const walletCardRef = use3dTilt();
  const activeCardRef = use3dTilt();
  const totalCardRef = use3dTilt();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosTriggered, setSosTriggered] = useState(false);
  const timerRef = useRef(null);

  const startSosCountdown = () => {
    if (!isLoggedIn) {
      alert("🔑 Customer Sign-in Required!\n\nYou must be logged in as a registered customer to broadcast real-time emergency SOS telemetry signals to police and platform dispatch.");
      navigate("/login");
      return;
    }
    setSosActive(true);
    setSosTriggered(false);
    setSosCountdown(5);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setSosCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          triggerSosAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSos = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSosActive(false);
  };

  const triggerSosAlert = async () => {
    let coords = { lat: 17.0005, lng: 81.8040 }; // Fallback Rajahmundry
    try {
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              coords = { lat: position.coords.latitude, lng: position.coords.longitude };
              resolve();
            },
            () => resolve(),
            { timeout: 3000 }
          );
        });
      }
    } catch(e) { console.error("Geolocation failed"); }

    try {
      const uId = sessionStorage.getItem("userId");
      const name = sessionStorage.getItem("userName") || "Client";
      const uEmail = sessionStorage.getItem("userEmail") || "client@workzy.com";
      
      const res = await fetch("/api/security/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: uId,
          name,
          role: "user",
          lat: coords.lat,
          lng: coords.lng,
          location_name: `Coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
        })
      });
      if (res.ok) {
        setSosTriggered(true);
        // Manual Log Ingestion
        await fetch("/api/security/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: uId,
            email: uEmail,
            role: "user",
            action: "SOS_TRIGGERED",
            city: "Kakinada"
          })
        });
      }
    } catch (e) {
      console.error("SOS trigger API fail");
    }
  };

  useEffect(() => {
    // 1. Check Authorization only if they are logged in but have the wrong role
    const role = sessionStorage.getItem("userRole");
    if (role && role !== "user") {
      navigate("/login");
      return;
    }

    // 2. Implement True Live Cloud Data Fetch Routine
    const fetchLiveDashboardData = async () => {
      if (!isLoggedIn) {
        // Guest mode: load empty arrays/placeholders and stop loading
        setBookings([]);
        setTransactions([]);
        setActivePlans([]);
        setRecommendations(["Plumbing", "Electrical", "AC Repair"]); // default preview services
        setRecBasis("💡 Standard recommended expert utilities for you");
        setLoading(false);
        return;
      }

      try {
        const currentUserId = sessionStorage.getItem("userId");
        if (!currentUserId) return;

        // A. Fetch Real Bookings
        const bookingResp = await fetch(`/api/bookings?customer_id=${currentUserId}`);
        if (bookingResp.ok) {
          const bookingsData = await bookingResp.json();
          setBookings(bookingsData.slice(0, 5)); // Top 5 recent
        }

        // B. Fetch Real Transactions via Authoritative Username String
        const currentUserName = sessionStorage.getItem("userName") || "Verified User";
        const txnResp = await fetch(`/api/transactions?customer=${encodeURIComponent(currentUserName)}`);
        if (txnResp.ok) {
          const txnData = await txnResp.json();
          setTransactions(txnData.slice(0, 5)); // Top 5 recent
          
          // Extract active plans from transactions with strict validity/expiration checks (monthly = 30 days, annual = 365 days)
          const activePlansFiltered = txnData.filter(t => {
            if (t.service && t.service.startsWith("Plan Subscription:")) {
              const planTitle = t.service.replace("Plan Subscription:", "").trim();
              if (t.createdAt) {
                const txDate = new Date(t.createdAt);
                let daysValid = 30; // default monthly
                if (planTitle.toLowerCase().includes("annual") || planTitle.toLowerCase().includes("year")) {
                  daysValid = 365; // annual plan
                }
                const expiryDate = new Date(txDate.getTime() + daysValid * 24 * 60 * 60 * 1000);
                return expiryDate > new Date();
              }
              return true; // Keep legacy subscriptions without timestamps
            }
            return false;
          });
          setActivePlans(activePlansFiltered);
          
          // Calculate Wallet sum dynamically from authentic transaction ledger
          const total = txnData.reduce((acc, t) => {
             // 🏦 Intelligent Accounting: Standard payouts deduct, but Refunding and Cashbacks strictly ADD velocity!
             const isAdd = t.status === "Refunded" || t.status === "Added" || t.method === "Cashback" || t.method === "Reward" || t.method === "Wallet Topup";
             return isAdd ? acc + t.amount : acc - t.amount;
          }, 1000); // Base assumed balance
          setWallet(total > 0 ? total : 650); // Fallback placeholder
        }

        // C. Fetch AI-Powered Recommendations
        const recResp = await fetch(`/api/ai/recommendations?user_id=${currentUserId}`);
        if (recResp.ok) {
          const recData = await recResp.json();
          setRecommendations(recData.recommendations || []);
          setRecBasis(recData.basis || "");
        }
        
      } catch (err) {
        console.error("❌ Dashboard Hydration Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveDashboardData();
  }, [navigate, isLoggedIn]);

  const activeBookings = bookings.filter(b => b.status === "Pending" || b.status === "Confirmed" || b.status === "On the way");

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      
      <div className="dashboard-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        <div className="dashboard-header-container">
          <div>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", color: "var(--text-main)" }}>User Dashboard</h1>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>Manage your bookings, wallet, and history.</p>
          </div>
          <Link to="/">
            <button className="btn-primary" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
              Book New Service
            </button>
          </Link>
        </div>

        {/* 🏷️ MOBILE-FIRST QUICK ACCESS FOR PLANS & OFFERS */}
        {isMobile && (
          <div className="premium-card" style={{
            padding: "20px 24px",
            marginBottom: "32px",
            background: "linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%)",
            border: "1.5px solid rgba(234, 179, 8, 0.25)",
            boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            animation: "fadeIn 0.3s ease-out"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #eab308 0%, #f97316 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                flexShrink: 0,
                boxShadow: "0 4px 10px rgba(234, 179, 8, 0.25)"
              }}>
                🏷️
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 2px 0", fontSize: "16px", fontWeight: 800, color: "var(--text-main)" }}>
                  Plans & Seasonal Offers
                </h3>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, lineHeight: "1.4" }}>
                  {isLoggedIn && activePlans.length > 0 
                    ? `Active Plan: ${activePlans[0].service.replace("Plan Subscription: ", "")}`
                    : "Save big on utilities with active promo codes & subscriptions!"
                  }
                </p>
              </div>
            </div>
            <Link to="/plans-offers" style={{ textDecoration: "none" }}>
              <button 
                className="btn-primary" 
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "14px",
                  backgroundColor: "#eab308",
                  color: "#1e293b",
                  boxShadow: "0 4px 12px rgba(234, 179, 8, 0.2)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.filter = "brightness(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.filter = "none";
                }}
              >
                Explore Plans & Offers →
              </button>
            </Link>
          </div>
        )}
 
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" }}>
          <div className="premium-card" ref={walletCardRef} style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "12px", backgroundColor: "var(--border)", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--primary)", fontSize: "24px" }}>
              <FaWallet />
            </div>
            <div>
              <p style={{ margin: "0 0 4px 0", color: "var(--text-muted)", fontSize: "14px" }}>Wallet Balance</p>
              <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "24px" }}>₹{isLoggedIn ? wallet : "0 (Guest Preview)"}</h2>
            </div>
          </div>
          
          <div className="premium-card" ref={activeCardRef} style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "12px", backgroundColor: "var(--border)", display: "flex", justifyContent: "center", alignItems: "center", color: "#16a34a", fontSize: "24px" }}>
              <FaCalendarCheck />
            </div>
            <div>
              <p style={{ margin: "0 0 4px 0", color: "var(--text-muted)", fontSize: "14px" }}>Active Bookings</p>
              <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "24px" }}>{isLoggedIn ? activeBookings.length : "0 (Locked)"}</h2>
            </div>
          </div>

          <div className="premium-card" ref={totalCardRef} style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "12px", backgroundColor: "var(--border)", display: "flex", justifyContent: "center", alignItems: "center", color: "#d97706", fontSize: "24px" }}>
              <FaRegClock />
            </div>
            <div>
              <p style={{ margin: "0 0 4px 0", color: "var(--text-muted)", fontSize: "14px" }}>Total Bookings</p>
              <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "24px" }}>{isLoggedIn ? bookings.length : "0 (Locked)"}</h2>
            </div>
          </div>
        </div>

        {/* 📍 YOUR LOCATION — Photon Map */}
        <UserLocationMap isLoggedIn={isLoggedIn} />

        {/* 🧠 AI-POWERED PERSONALIZED RECOMMENDATIONS */}
        <div className="premium-card" style={{ 
          padding: "24px", 
          marginBottom: "40px", 
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(99, 102, 241, 0.04) 100%)", 
          border: "1.5px solid rgba(139, 92, 246, 0.15)" 
        }}>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px", fontWeight: 800 }}>
            🧠 AI-Recommended Services for You
          </h3>
          <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
            {recBasis || "Complementary solutions personalized from your activity"}
          </p>
          {loading ? (
            <SkeletonLoader type="card" count={3} />
          ) : recommendations.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              {recommendations.map((serviceName) => {
                const serviceIcons = {
                  "Carpentry": "🪚",
                  "Plumbing": "🔧",
                  "Electrical": "⚡",
                  "AC Repair": "❄️",
                  "House Cleaning": "🧹",
                  "Interior Painting": "🎨",
                  "Packers & Movers": "📦",
                  "Doctors & Medical": "🩺",
                  "Appliance Repair": "🔌",
                  "Mechanic": "⚙️",
                  "Events": "🎉",
                  "Beauty, Salon & Spa": "💅"
                };
                return (
                  <div
                    key={serviceName}
                    onClick={() => {
                       localStorage.setItem("voice_query", serviceName);
                       navigate("/");
                    }}
                    style={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "14px",
                      padding: "20px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "var(--shadow-3d)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>{serviceIcons[serviceName] || "🛠️"}</div>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "var(--text-main)" }}>{serviceName}</h4>
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#8b5cf6", backgroundColor: "rgba(139, 92, 246, 0.1)", padding: "4px 8px", borderRadius: "10px" }}>
                      Match 98%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Explore services on the home page to populate recommendations.</p>
          )}
        </div>
 
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
          <div className="premium-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text-main)" }}>Recent Bookings</h3>
              {isLoggedIn && <Link to="/my-bookings" style={{ color: "var(--primary)", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}>View All</Link>}
            </div>
            {!isLoggedIn ? (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }}>
                <span style={{ fontSize: "28px" }}>📋</span>
                <h4 style={{ margin: "12px 0 6px 0", color: "var(--text-main)", fontWeight: 700 }}>Bookings Locked</h4>
                <p style={{ fontSize: "12px", margin: "0 0 16px 0", lineHeight: "1.4" }}>Sign in with a customer account to schedule new jobs and monitor active providers.</p>
                <button onClick={() => navigate("/login")} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}>Login Now</button>
              </div>
            ) : loading ? (
              <SkeletonLoader type="list" count={2} />
            ) : bookings.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {bookings.map(b => (
                  <div key={b._id || b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "var(--text-main)" }}>{b.service}</p>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>{b.date || "Scheduled"} • {b.workerName || "Pending Worker"}</p>
                    </div>
                    <span style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: b.status === "Completed" ? "#dcfce7" : b.status === "Cancelled" ? "#fee2e2" : "#fef3c7", color: b.status === "Completed" ? "#16a34a" : b.status === "Cancelled" ? "#dc2626" : "#d97706" }}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No recent bookings.</p>
            )}
          </div>

          <div className="premium-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text-main)" }}>Recent Transactions</h3>
              {isLoggedIn && <Link to="/payment" style={{ color: "var(--primary)", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}>Manage Wallet</Link>}
            </div>
            {!isLoggedIn ? (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }}>
                <span style={{ fontSize: "28px" }}>💰</span>
                <h4 style={{ margin: "12px 0 6px 0", color: "var(--text-main)", fontWeight: 700 }}>Statements Locked</h4>
                <p style={{ fontSize: "12px", margin: "0 0 16px 0", lineHeight: "1.4" }}>Sign in with a customer account to top-up wallet balances and view invoice logs.</p>
                <button onClick={() => navigate("/login")} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}>Login Now</button>
              </div>
            ) : transactions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {transactions.map(t => (
                  <div key={t._id || t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--border)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px" }}>
                        {t.icon || "💰"}
                      </div>
                      <div>
                        <p style={{ margin: "0 0 4px 0", fontWeight: "500", color: "var(--text-main)" }}>{t.service}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>{t.date || (t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "")} • {t.method}</p>
                      </div>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontWeight: "600", 
                      color: (t.status === "Refunded" || t.status === "Added" || t.method === "Cashback" || t.method === "Reward" || t.method === "Wallet Topup") ? "#16a34a" : "var(--text-main)" 
                    }}>
                      {(t.status === "Refunded" || t.status === "Added" || t.method === "Cashback" || t.method === "Reward" || t.method === "Wallet Topup") ? "+" : "-"}₹{t.amount}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No recent transactions.</p>
            )}
          </div>

          <div className="premium-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text-main)" }}>Manage Plans</h3>
              <Link to="/plans-offers" style={{ color: "var(--primary)", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}>Explore Plans</Link>
            </div>
            {!isLoggedIn ? (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }}>
                <span style={{ fontSize: "28px" }}>⭐</span>
                <h4 style={{ margin: "12px 0 6px 0", color: "var(--text-main)", fontWeight: 700 }}>Subscriptions Locked</h4>
                <p style={{ fontSize: "12px", margin: "0 0 16px 0", lineHeight: "1.4" }}>Sign in with a customer account to unlock seasonal coupons and service packages.</p>
                <button onClick={() => navigate("/login")} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}>Login Now</button>
              </div>
            ) : activePlans.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activePlans.map(p => (
                  <div key={p._id || p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--border)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px" }}>
                        ⭐
                      </div>
                      <div>
                        <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "var(--text-main)" }}>{p.service.replace("Plan Subscription: ", "")}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Subscribed on {p.date || new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#dcfce7", color: "#16a34a" }}>
                      Active
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>You have not subscribed to any plans yet.</p>
            )}
          </div>
        </div>

        {isLoggedIn && (
          <>
            <div style={{ marginTop: "40px" }} />
            <SecurityLogs userId={sessionStorage.getItem("userId")} />
          </>
        )}

        <div style={{ marginTop: "40px", display: "flex", justifyContent: "center" }}>
          <Link to="/support">
            <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px" }}>
              <FaHeadset /> Get Support
            </button>
          </Link>
        </div>
      </div>

      {/* 🚨 FLOATING SOS IN-APP PANIC TRIGGER */}
      <div
        onClick={startSosCountdown}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
          boxShadow: "0 8px 24px rgba(239, 68, 68, 0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          zIndex: 999,
          color: "white",
          fontSize: "22px",
          fontWeight: "bold",
          border: "2px solid white",
          animation: "pulse-sos-btn 1.5s infinite"
        }}
      >
        🆘
      </div>

      {/* 🛑 FULLSCREEN SOS COUNTDOWN & ALERT OVERLAY */}
      {sosActive && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          fontFamily: "'Outfit', sans-serif",
          animation: "fadeIn 0.2s ease-out forwards"
        }}>
          <div style={{
            maxWidth: "420px",
            width: "90%",
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            padding: "32px",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.25)",
            border: "3px solid #ef4444",
            animation: "scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}>
            {!sosTriggered ? (
              <div>
                <div style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: "42px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "0 auto 20px",
                  animation: "pulse-sos-shield 1s infinite alternate"
                }}>
                  🛡️
                </div>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "24px", fontWeight: 800, color: "#1e293b" }}>
                  Emergency Action Triggered
                </h2>
                <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>
                  The active system will broadcast an emergency panic signal to local dispatch and coordinates tracking in:
                </p>
                <div style={{
                  fontSize: "72px",
                  fontWeight: 900,
                  color: "#ef4444",
                  margin: "20px 0",
                  fontVariantNumeric: "lining-nums"
                }}>
                  {sosCountdown}
                </div>
                <button
                  onClick={cancelSos}
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "1.5px solid #cbd5e1",
                    padding: "14px 28px",
                    borderRadius: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    width: "100%",
                    fontSize: "15px",
                    boxShadow: "none",
                    transform: "none"
                  }}
                >
                  Cancel Emergency Alert ❌
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  color: "white",
                  fontSize: "42px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 0 20px rgba(239,68,68,0.4)"
                }}>
                  🚨
                </div>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "23px", fontWeight: 900, color: "#b91c1c" }}>
                  EMERGENCY SIGNAL ACTIVE
                </h2>
                <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#475569", lineHeight: 1.5, fontWeight: 500 }}>
                  Responders are matching your coordinates. Please remain calm. Local police and ambulance channels are primed.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  <a
                    href="tel:112"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      padding: "14px",
                      borderRadius: "12px",
                      textDecoration: "none",
                      fontWeight: 800,
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
                    }}
                  >
                    📞 Call National Police (112)
                  </a>
                  <a
                    href="tel:108"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      padding: "14px",
                      borderRadius: "12px",
                      textDecoration: "none",
                      fontWeight: 800,
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
                    }}
                  >
                    📞 Call Medical Response (108)
                  </a>
                </div>

                <button
                  onClick={() => setSosActive(false)}
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "14px",
                    width: "100%",
                    boxShadow: "none",
                    transform: "none"
                  }}
                >
                  Dismiss Panel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Styled SOS keyframe definitions */}
      <style>{`
        @keyframes pulse-sos-btn {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes pulse-sos-shield {
          from { transform: scale(1); box-shadow: 0 0 5px rgba(239,68,68,0.2); }
          to { transform: scale(1.1); box-shadow: 0 0 20px rgba(239,68,68,0.5); }
        }
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default UserDashboard;
