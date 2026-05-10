import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBookings, updateWalletBalance, addTransaction } from "../data/sharedStore";

const serviceIcons = {
  "Carpentry": "🪚",
  "Plumbing": "🔧",
  "Electrical": "⚡",
  "AC Repair": "❄️",
  "House Cleaning": "🧹",
  "Interior Painting": "🎨",
  "Packers & Movers": "📦",
  "Doctors & Medical": "🩺"
};

function MyBookings() {
  const [liveBookings, setLiveBookings] = useState([]);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const navigate = useNavigate();

  const syncBookings = async () => {
    const customerId = localStorage.getItem("userId");
    const cName = localStorage.getItem("userName") || "Verified Client";
    if (!customerId) return;

    try {
       // 🛰️ COMPOSITE SYNCHRONIZATION: Load Bookings & Real Reviews simultaneously!
       const [bResp, rResp] = await Promise.all([
          fetch(`http://localhost:5000/api/bookings?customer_id=${customerId}`),
          fetch(`http://localhost:5000/api/reviews?customer_name=${encodeURIComponent(cName)}`)
       ]);
       const bData = await bResp.json();
       const rData = await rResp.json();

       if (Array.isArray(bData)) setLiveBookings(bData);
       if (Array.isArray(rData)) {
          // Auto-Hydrate accurate reviewed ID matrix flawlessly!
          const committedIds = new Set(rData.map(r => r.booking_id));
          setReviewedIds(committedIds);
       }
    } catch(err) { console.error("Cloud bookings sync failed."); }
  };

  useEffect(() => {
    syncBookings();
    // Poll every 3 seconds for real-time synchronization
    const interval = setInterval(syncBookings, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReview = (booking) => {
     // 🚀 DYNAMIC PASSTHROUGH: The backend auto-filters correctly, simply redirect effortlessly!
     navigate("/reviews");
  };

  const handleComplaint = (booking) => {
    const bid = booking._id || booking.id;
    // 🚀 DYNAMIC ESCALATION: Transfer control instantly to physical Support Desk flawlessly!
    navigate("/support", { state: { bookingId: bid, service: booking.service } });
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "Completed":
        return { color: "#2563eb", bg: "#dbeafe" };
      case "Accepted":
      case "Confirmed":
        return { color: "#16a34a", bg: "#dcfce7" };
      case "Rejected":
        return { color: "#ef4444", bg: "#fee2e2" };
      case "Upcoming":
      default:
        return { color: "#d97706", bg: "#fef3c7" };
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', 'Segoe UI', sans-serif"
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "white",
          padding: "40px 24px 30px 24px"
        }}
      >
        <Link
          to="/"
          style={{
            color: "#94a3b8",
            textDecoration: "none",
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "16px"
          }}
        >
          ← Back to Home
        </Link>
        <h1 style={{ margin: "0 0 6px 0", fontSize: "28px", fontWeight: 800 }}>
          📋 My Bookings
        </h1>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
          Track and manage all your service bookings
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "28px 20px"
        }}
      >
        {/* Summary Pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "28px",
            flexWrap: "wrap"
          }}
        >
          {[
            { label: "Total", count: liveBookings.length, color: "#1e293b", bg: "#f1f5f9" },
            { label: "Confirmed/Accepted", count: liveBookings.filter(b => b.status === "Confirmed" || b.status === "Accepted").length, color: "#16a34a", bg: "#dcfce7" },
            { label: "Upcoming/Pending", count: liveBookings.filter(b => b.status === "Upcoming").length, color: "#d97706", bg: "#fef3c7" },
            { label: "Completed", count: liveBookings.filter(b => b.status === "Completed" || b.status === "Paid Out").length, color: "#2563eb", bg: "#dbeafe" }
          ].map(({ label, count, color, bg }) => (
            <div
              key={label}
              style={{
                backgroundColor: bg,
                color,
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600
              }}
            >
              {label}: {count}
            </div>
          ))}
        </div>

        {/* Booking Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {liveBookings.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                backgroundColor: "white",
                borderRadius: "16px",
                border: "1.5px dashed #cbd5e1"
              }}
            >
              <p style={{ fontSize: "36px", margin: "0 0 12px 0" }}>🔍</p>
              <h4 style={{ margin: "0 0 4px 0", color: "#475569", fontWeight: 700 }}>No bookings found</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>You haven't booked any services yet.</p>
            </div>
          ) : (
            liveBookings.map((booking) => {
              const { color, bg } = getStatusStyles(booking.status);
              const bid = booking._id || booking.id;
              const isReviewed = reviewedIds.has(bid);
              
              return (
                <div
                  key={bid}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "14px",
                    padding: "20px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                    border: "1px solid #f1f5f9",
                    transition: "box-shadow 0.2s",
                    cursor: "default"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)")}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "14px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "28px" }}>
                        {serviceIcons[booking.service] || "🛠️"}
                      </span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>
                          {booking.service}
                        </h3>
                        <p style={{ margin: "3px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                          👷 Verified Professional Assigned
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      style={{
                        backgroundColor: bg,
                        color,
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {/* Details Row */}
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      flexWrap: "wrap",
                      fontSize: "13px",
                      color: "#475569",
                      paddingTop: "12px",
                      borderTop: "1px solid #f1f5f9"
                    }}
                  >
                    <span>📅 Date: {booking.date}</span>
                    <span>🕐 Time: {booking.time}</span>
                    <span style={{ fontWeight: 700, color: "#0284c7" }}>💰 Cost: ₹{booking.price || booking.amount || 0}</span>
                  </div>

                  {(booking.status === "Completed" || booking.status === "Paid Out") && (
                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed #cbd5e1", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <button 
                        onClick={() => handleReview(booking)}
                        disabled={isReviewed}
                        style={{
                          backgroundColor: isReviewed ? "#f1f5f9" : "#f59e0b",
                          color: isReviewed ? "#94a3b8" : "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          cursor: isReviewed ? "default" : "pointer",
                          fontSize: "13px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        {isReviewed ? "✅ Review Submitted & Cashback Claimed" : "⭐ Leave Review & Earn ₹50 Wallet Cashback"}
                      </button>

                      <button 
                        onClick={() => handleComplaint(booking)}
                        style={{
                          backgroundColor: "#fee2e2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "13px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fecaca"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                      >
                        ⚠️ Report Grievance
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default MyBookings;
