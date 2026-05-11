import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
// Dynamically enhanced to consume real Mongo cloud telemetry

function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState("status");
  const [isActive, setIsActive] = useState(true);
  const [openMapId, setOpenMapId] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Load the logged-in worker ID dynamically from localStorage, fallback to 1 (Rahul Sharma)
  const selectedWorkerId = Number(sessionStorage.getItem("loggedInWorkerId")) || 1;

  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [sysNotifications, setSysNotifications] = useState([]);
  const [profile, setProfile] = useState({
    name: sessionStorage.getItem("userName") || "Worker",
    profession: "...",
    phone: "...",
    email: sessionStorage.getItem("userEmail") || "",
    city: "...",
    rating: 5.0,
    totalReviews: 0,
    joinedDate: "...",
    photo: "👷"
  });
  const [editProfile, setEditProfile] = useState({ ...profile });

  // Pull real runtime data directly from active Mongo Cloud Backend
  const syncStore = async () => {
    const currentUserId = sessionStorage.getItem("userId");
    const userEmail = sessionStorage.getItem("userEmail");
    if (!currentUserId || !userEmail) return;

    try {
      let targetWorkerMongoId = null;

      // 1. DISCOVER AUTHENTIC WORKER ID VIA EMAIL INDEXING FIRST
      const workerResp = await fetch(`http://localhost:5000/api/workers`);
      if (workerResp.ok) {
        const allWorkers = await workerResp.json();
        const match = allWorkers.find(w => w.email === userEmail || w._id === currentUserId);
        if (match) {
          targetWorkerMongoId = match._id; // Authentic Primary Key established
          setProfile({
            name: match.name,
            profession: match.service,
            phone: "9876543210",
            email: match.email,
            city: match.city,
            rating: match.rating || 5.0,
            walletBalance: match.walletBalance || 0,
            totalReviews: 1,
            joinedDate: "May 2026",
            mongoId: match._id,
            photo: match.service && match.service.includes("Doctors") ? "🩺" : "👷"
          });
          setIsActive(match.status === "Active");
        }
      }

      // 2. EXECUTE RELATIONAL QUERY USING AUTHENTIC PRIMARY KEY
      if (targetWorkerMongoId) {
        const bookingResp = await fetch(`http://localhost:5000/api/bookings?worker_id=${targetWorkerMongoId}`);
        if (bookingResp.ok) {
          const data = await bookingResp.json();
          setBookings(data);
        }
      }
    } catch (err) {
       console.error("Worker Sync Failed:", err);
    }
  };

  const handleAcceptOrder = async (bookingId) => {
    try {
      await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ status: "Accepted" })
      });
      alert("✅ Order accepted successfully! The customer has been notified. 🚀");
      syncStore();
    } catch (err) { alert("Update failed"); }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ status: newStatus })
      });
      alert(`Status updated to: ${newStatus}`);
      syncStore();
    } catch (err) { alert("Update failed"); }
  };

  const handleRejectOrder = async (bookingId) => {
    if (window.confirm("Are you sure you want to reject this customer order?")) {
       try {
          await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
             method: "PATCH",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ status: "Rejected" })
          });
          alert("❌ Request rejected successfully.");
          syncStore();
       } catch (err) { alert("Failed to reject"); }
    }
  };

  const handleMarkNotificationsRead = () => {
    // Placeholder
    alert("Marked all read locally.");
  };

  useEffect(() => {
    syncStore();
  }, [selectedWorkerId]);

  useEffect(() => {
    const interval = setInterval(syncStore, 3000);
    return () => clearInterval(interval);
  }, [selectedWorkerId]);

  // Dynamically compute physical earnings directly from active database bookings instantly
  const dynamicRevenueTotal = bookings
    .filter(b => b.status === "Paid Out")
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  // Combine real DB notifications with the bookings map
  const notifications = [
    ...sysNotifications.map((n) => ({
      id: n.id,
      type: "system",
      icon: n.type === "success" ? "✅" : n.type === "warning" ? "⚠️" : "🔔",
      title: n.title,
      message: n.message,
      time: new Date(n.timestamp).toLocaleTimeString(),
      read: n.read
    })),
    ...bookings.filter(b => ["Pending", "Upcoming", "Accepted", "On the Way", "Started"].includes(b.status)).map((b) => ({
      id: `b-${b._id}`,
      bookingId: b._id,
      bookingStatus: b.status,
      type: "booking",
      icon: "📅",
      title: `Job Request: ${b.service || 'New Order'}`,
      message: `Request for ${b.service} on ${b.date} at ${b.time}. Customer location details included below.`,
      customerAddr: b.address || "Client Location",
      workerAddr: profile.city || "Worker Area",
      time: "Real-time",
      read: false
    }))
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const totalEarnings = bookings.filter(b => b.status === "Completed" || b.status === "Upcoming" || b.status === "Accepted").reduce((sum, b) => sum + b.amount, 0);
  const complaintsRatingDeduction = complaints.filter(c => c.adminVerdict === "Valid").reduce((sum, c) => sum + (c.ratingDeducted || 0.2), 0);
  const finalRating = Math.max(1, (profile.rating - complaintsRatingDeduction)).toFixed(1);

  const sidebarTabs = [
    { id: "status", label: "My Status", icon: "🟢" },
    { id: "bookings", label: "All Bookings", icon: "📋" },
    { id: "notifications", label: `Alerts (${unreadCount})`, icon: "🔔" },
    { id: "earnings", label: "My Earnings", icon: "💰" },
    { id: "profile", label: "My Profile", icon: "👤" },
  ];

  const statusStyle = (s) => ({
    padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
    backgroundColor: s === "Completed" ? "var(--primary-light)" : s === "Upcoming" ? "#fff3e0" : s === "Accepted" ? "var(--primary-light)" : "#fee2e2",
    color: s === "Completed" ? "var(--primary-dark)" : s === "Upcoming" ? "#e65100" : s === "Accepted" ? "#16a34a" : "#ef4444"
  });

  return (
    <div className="dashboard-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1 }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width: 270, backgroundColor: "var(--bg-card)", borderRight: "1px solid var(--border-color)", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 8, transition: "background-color 0.3s" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 36 }}>{profile.photo || "👷"}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>{profile.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{profile.profession}</div>
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700, backgroundColor: isActive ? "#16a34a" : "#dc2626", color: "white" }}>
                  {isActive ? "🟢 Active" : "🔴 Inactive"}
                </span>
              </div>
            </div>
          </div>

          {sidebarTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", width: "100%",
                borderRadius: 8, border: "none", textAlign: "left", fontSize: 14, fontWeight: 600, cursor: "pointer",
                backgroundColor: activeTab === tab.id ? "var(--primary)" : "transparent",
                color: activeTab === tab.id ? "white" : "var(--text-secondary)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) { e.currentTarget.style.backgroundColor = "var(--primary-glow)"; e.currentTarget.style.color = "var(--primary)"; e.currentTarget.style.transform = "translateX(5px)"; } }}
              onMouseLeave={e => { if (activeTab !== tab.id) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.transform = "translateX(0)"; } }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, padding: 36, overflowY: "auto" }}>

          {/* STATUS TAB */}
          {activeTab === "status" && (
            <div className="fade-in">
              <h2 style={{ margin: "0 0 24px", fontWeight: 800, color: "var(--text-primary)" }}>My Availability Status</h2>
              <div className="premium-card" style={{ maxWidth: 480 }}>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{ fontSize: 72, textShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>{isActive ? "🟢" : "🔴"}</div>
                  <h2 style={{ margin: "12px 0 6px", color: "var(--text-primary)" }}>{isActive ? "You are Active" : "You are Inactive"}</h2>
                  <p style={{ color: "#64748b", margin: 0 }}>
                    {isActive ? "Customers can see and book your services right now." : "You are currently not accepting new bookings."}
                  </p>
                </div>
                <button 
                  onClick={async () => {
                    const newStatus = !isActive ? "Active" : "Inactive";
                    if (profile.mongoId) {
                      try {
                        await fetch(`http://localhost:5000/api/workers/${profile.mongoId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: newStatus })
                        });
                        setIsActive(!isActive);
                        alert(`Status saved globally as ${newStatus}!`);
                      } catch(e) { alert("Cloud sync failed"); }
                    } else {
                      setIsActive(!isActive);
                    }
                  }} 
                  style={{
                    width: "100%", padding: "16px", fontSize: 16, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer",
                    backgroundColor: isActive ? "#ef4444" : "var(--primary)", color: "white", transition: "all 0.2s"
                  }}
                >
                  {isActive ? "🔴 Set Myself Inactive" : "🟢 Set Myself Active"}
                </button>
              </div>
            </div>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === "bookings" && (
            <div className="fade-in">
              <h2 style={{ margin: "0 0 24px", fontWeight: 800, color: "var(--text-primary)" }}>All Job Bookings</h2>
              <div className="premium-card">
                {bookings.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px" }}>No jobs booked under your profile yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1.5px solid var(--border-color)", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "12px 8px" }}>Customer</th>
                        <th style={{ padding: "12px 8px" }}>Service</th>
                        <th style={{ padding: "12px 8px" }}>Timings</th>
                        <th style={{ padding: "12px 8px" }}>Address</th>
                        <th style={{ padding: "12px 8px" }}>Payment</th>
                        <th style={{ padding: "12px 8px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b._id} style={{ borderBottom: "1px solid #e2e8f0", fontSize: 14 }}>
                          <td style={{ padding: "14px 8px", fontWeight: 700 }}>{b.customer_name || "Verified Customer"}</td>
                          <td style={{ padding: "14px 8px" }}>{b.service}</td>
                          <td style={{ padding: "14px 8px" }}>📅 {b.date}<br />🕐 {b.time}</td>
                          <td style={{ padding: "14px 8px" }}>{b.address}</td>
                          <td style={{ padding: "14px 8px", fontWeight: 700, color: "var(--primary)" }}>₹{b.price}</td>
                          <td style={{ padding: "14px 8px" }}>
                            <span style={statusStyle(b.status)}>{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0, fontWeight: 800, color: "var(--text-primary)" }}>Real-time Alerts Feed</h2>
                {unreadCount > 0 && (
                  <button onClick={handleMarkNotificationsRead} style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", backgroundColor: "white", cursor: "pointer", fontWeight: 600 }}>Mark all as read</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "64px 0" }}>
                  <div style={{ fontSize: 56 }}>🔔</div>
                  <h3 style={{ margin: "16px 0 4px" }}>All caught up!</h3>
                  <p style={{ margin: 0 }}>No new alerts or bookings at the moment.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {notifications.map((n) => (
                    <div key={n.id} className="premium-card" style={{ padding: 24, borderLeft: `6px solid ${n.type === "booking" ? "var(--primary)" : "#eab308"}` }}>
                      <div style={{ display: "flex", gap: 14 }}>
                        <span style={{ fontSize: 24 }}>{n.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <h4 style={{ margin: 0, fontWeight: 800, color: "var(--text-primary)" }}>{n.title}</h4>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{n.time}</span>
                          </div>
                          <p style={{ margin: "6px 0 12px", color: "var(--text-secondary)", fontSize: 14, lineHeight: "1.5" }}>{n.message}</p>
                        </div>
                      </div>

                      {n.type === "booking" && (
                        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginTop: 12 }}>
                          <div style={{ marginBottom: "12px" }}>
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(n.workerAddr)}&destination=${encodeURIComponent(n.customerAddr)}`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "6px", 
                                color: "white", 
                                backgroundColor: "#4285F4", 
                                padding: "8px 12px", 
                                borderRadius: "6px", 
                                textDecoration: "none", 
                                fontWeight: "600",
                                fontSize: "13px"
                              }}
                            >
                              📍 View Route on Google Maps
                            </a>
                          </div>
                          <div style={{ display: "flex", gap: 12 }}>
                            {n.bookingStatus === "Pending" && (
                              <>
                                <button onClick={() => handleAcceptOrder(n.bookingId)}
                                  style={{ padding: "10px 20px", backgroundColor: "var(--success)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                  Accept Order ✅
                                </button>
                                <button onClick={() => handleRejectOrder(n.bookingId)}
                                  style={{ padding: "10px 20px", backgroundColor: "#f43f5e", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                  Reject Request ❌
                                </button>
                              </>
                            )}

                            {n.bookingStatus === "Accepted" && (
                              <button onClick={() => handleStatusChange(n.bookingId, "On the Way")}
                                style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                Mark as 'On the Way' 🛵
                              </button>
                            )}

                            {n.bookingStatus === "On the Way" && (
                              <button onClick={() => handleStatusChange(n.bookingId, "Started")}
                                style={{ padding: "10px 20px", backgroundColor: "#f59e0b", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                Mark as 'Started Job' 🛠️
                              </button>
                            )}

                            {n.bookingStatus === "Started" && (
                              <button onClick={() => handleStatusChange(n.bookingId, "Completed")}
                                style={{ padding: "10px 20px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                Mark as 'Completed' ✨
                              </button>
                            )}

                            {n.bookingStatus === "Rejected" && (
                              <span style={{ fontSize: 13, backgroundColor: "#fee2e2", color: "#b91c1c", padding: "8px 14px", borderRadius: 8, fontWeight: 700 }}>
                                ✗ Rejected & Cancelled
                              </span>
                            )}

                            {n.bookingStatus === "Cancelled" && (
                              <span style={{ fontSize: 13, backgroundColor: "#fee2e2", color: "#b91c1c", padding: "8px 14px", borderRadius: 8, fontWeight: 700 }}>
                                ✗ Cancelled
                              </span>
                            )}

                            <button onClick={() => setOpenMapId(openMapId === n.id ? null : n.id)}
                              style={{ padding: "10px 20px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
                              {openMapId === n.id ? "Hide Map Route 🗺️" : "Show Route to Customer 🗺️"}
                            </button>
                          </div>

                          {openMapId === n.id && (
                            <div style={{ marginTop: 12, border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                              <div style={{ backgroundColor: "#1e293b", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                <span>📍 From: <strong>{n.workerAddr}</strong></span>
                                <span>🏠 To: <strong>{n.customerAddr}</strong></span>
                              </div>
                              <iframe
                                title={`route-map-${n.id}`}
                                width="100%"
                                height="260"
                                frameBorder="0"
                                style={{ display: "block" }}
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=72.7,18.9,72.95,19.15&layer=mapnik&marker=19.05,72.83`}
                              />
                              <div style={{ padding: "10px 16px", backgroundColor: "#f8fafc", fontSize: 12, color: "#64748b", display: "flex", gap: 16 }}>
                                <span>🛣️ Est. Distance: ~5-8 km</span>
                                <span>⏱️ Est. Time: ~15-25 mins</span>
                                <a href={`https://www.google.com/maps/dir/${encodeURIComponent(n.workerAddr)}/${encodeURIComponent(n.customerAddr)}`} target="_blank" rel="noreferrer"
                                  style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none", marginLeft: "auto" }}>
                                  Open in Google Maps ↗
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EARNINGS TAB */}
          {activeTab === "earnings" && (
            <div className="fade-in">
              <h2 style={{ margin: "0 0 24px", fontWeight: 800, color: "var(--text-primary)" }}>My Earnings</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 32 }}>
                <div className="premium-card" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Total Earned</div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: "var(--primary)", marginTop: 8 }}>₹{dynamicRevenueTotal}</div>
                </div>
                <div className="premium-card" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Jobs Received</div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: "var(--secondary)", marginTop: 8 }}>{bookings.length}</div>
                </div>
                <div className="premium-card" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Avg Per Job</div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: "#f59e0b", marginTop: 8 }}>
                    ₹{bookings.length > 0 ? Math.round(totalEarnings / bookings.length) : 0}
                  </div>
                </div>
              </div>

              <div className="premium-card">
                <h3 style={{ margin: "0 0 18px", fontWeight: 800, color: "var(--text-primary)" }}>Completed & Incoming Payments</h3>
                {bookings.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>No payment transactions found.</p>
                ) : (
                  bookings.map(b => (
                    <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>{b.service}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{b.customer} · {b.date}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: "var(--primary)" }}>+₹{b.amount}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="fade-in">
              <h2 style={{ margin: "0 0 24px", fontWeight: 800, color: "var(--text-primary)" }}>My Profile</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

                {/* Profile Card */}
                <div className="premium-card">
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 64, textShadow: "0 10px 20px rgba(0,0,0,0.15)" }}>{profile.photo || "👷"}</div>
                    <h3 style={{ margin: "12px 0 4px", color: "var(--text-primary)" }}>{profile.name}</h3>
                    <div style={{ color: "var(--primary)", fontWeight: 700 }}>{profile.profession}</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ color: "#eab308", fontSize: 18 }}>{"⭐".repeat(Math.round(parseFloat(finalRating)))}</span>
                      <span style={{ fontWeight: 800, marginLeft: 6 }}>{finalRating}</span>
                      <span style={{ color: "#94a3b8", fontSize: 13 }}> ({profile.totalReviews} reviews)</span>
                    </div>
                  </div>
                  {[
                    ["📍 City", profile.city],
                    ["📞 Phone", profile.phone],
                    ["📧 Email", profile.email],
                    ["📅 Joined", profile.joinedDate],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: 14 }}>
                      <span style={{ color: "#64748b" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{val}</span>
                    </div>
                  ))}
                  {!editMode ? (
                    <button onClick={() => { setEditProfile({ ...profile }); setEditMode(true); }} style={{ width: "100%", marginTop: 18, padding: "12px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                      ✏️ Edit Profile
                    </button>
                  ) : (
                    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                      <input value={editProfile.name} onChange={e => setEditProfile({ ...editProfile, name: e.target.value })} placeholder="Name" style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                      <input value={editProfile.profession} onChange={e => setEditProfile({ ...editProfile, profession: e.target.value })} placeholder="Profession" style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                      <input value={editProfile.city} onChange={e => setEditProfile({ ...editProfile, city: e.target.value })} placeholder="City" style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                      <input value={editProfile.phone} onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })} placeholder="Phone" style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => { setProfile({ ...editProfile }); setEditMode(false); alert("Profile updated!"); }} style={{ flex: 1, padding: "10px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save</button>
                        <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: "10px", backgroundColor: "#e2e8f0", color: "#475569", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Complaints Section */}
                <div className="premium-card">
                  <h3 style={{ margin: "0 0 16px", fontWeight: 800, color: "var(--text-primary)" }}>Customer Complaints</h3>
                  {complaints.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>
                      <div style={{ fontSize: 40 }}>✅</div>
                      <p>No complaints on your profile!</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {complaints.map(c => (
                        <div key={c.id} style={{ border: "1px solid #fee2e2", borderRadius: 10, padding: 16, backgroundColor: "#fff5f5" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <strong style={{ color: "#c62828" }}>Complaint #{c.id}</strong>
                            <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: 20, backgroundColor: c.adminVerdict === "Valid" ? "#ffebee" : c.adminVerdict === "Pending" ? "#fff3e0" : "var(--primary-light)", color: c.adminVerdict === "Valid" ? "#c62828" : c.adminVerdict === "Pending" ? "#e65100" : "var(--primary-dark)", fontWeight: 700 }}>
                              Admin: {c.adminVerdict}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>👤 {c.customer} · {c.date}</div>
                          <div style={{ fontSize: 14, color: "#1e293b", marginBottom: 8 }}>"{c.desc}"</div>
                          {c.adminVerdict === "Valid" && (
                            <div style={{ backgroundColor: "#ffebee", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#c62828", fontWeight: 600 }}>
                              ⬇️ Rating deducted by -{c.ratingDeducted || 0.2} due to this verified complaint.
                            </div>
                          )}
                          <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>Status: {c.status}</div>
                        </div>
                      ))}
                      {complaintsRatingDeduction > 0 && (
                        <div style={{ backgroundColor: "#fff3e0", borderRadius: 8, padding: 14, fontSize: 13, color: "#e65100", marginTop: 8 }}>
                          ⚠️ Your effective rating: <strong>{finalRating} ⭐</strong> (deducted {complaintsRatingDeduction} for verified complaints)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;
