import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

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
    const customerId = sessionStorage.getItem("userId");
    const cName = sessionStorage.getItem("userName") || "Verified Client";
    if (!customerId) return;

    try {
      // 🛰️ COMPOSITE SYNCHRONIZATION: Load Bookings & Real Reviews simultaneously!
      const [bResp, rResp] = await Promise.all([
        fetch(`/api/bookings?customer_id=${customerId}`),
        fetch(`/api/reviews?customer_name=${encodeURIComponent(cName)}`)
      ]);
      const bData = await bResp.json();
      const rData = await rResp.json();

      if (Array.isArray(bData)) setLiveBookings(bData);
      if (Array.isArray(rData)) {
        // Auto-Hydrate accurate reviewed ID matrix flawlessly!
        const committedIds = new Set(rData.map(r => r.booking_id));
        setReviewedIds(committedIds);
      }
    } catch (err) { console.error("Cloud bookings sync failed."); }
  };

  useEffect(() => {
    syncBookings();
    // Poll every 3 seconds for real-time synchronization
    const interval = setInterval(syncBookings, 10000); // Scaled sync cycle to 10 seconds to reduce network overhead
    return () => clearInterval(interval);
  }, []);

  const [activeComplaintBooking, setActiveComplaintBooking] = useState(null);
  const [issueType, setIssueType] = useState("Abuse");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [activeCancelBooking, setActiveCancelBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("Scheduler Conflict");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatTheme, setChatTheme] = useState('light'); // 'light' | 'dark'
  const [globalCallActive, setGlobalCallActive] = useState(() => {
    return sessionStorage.getItem("activeCallState") === "ringing" || sessionStorage.getItem("activeCallState") === "connected";
  });

  useEffect(() => {
    const handleStateChange = (e) => {
      const { activeCall } = e.detail;
      setGlobalCallActive(activeCall === 'ringing' || activeCall === 'connected');
    };
    window.addEventListener("callStateChanged", handleStateChange);
    return () => window.removeEventListener("callStateChanged", handleStateChange);
  }, []);

  const handleStartCall = () => {
    if (!activeChatBooking) return;
    window.dispatchEvent(new CustomEvent("initiateCall", {
      detail: {
        bookingId: activeChatBooking._id || activeChatBooking.id,
        targetName: activeChatBooking.workerName || activeChatBooking.worker_name || "Service Provider"
      }
    }));
  };

  useEffect(() => {
    if (!activeChatBooking) return;
    const bid = activeChatBooking._id || activeChatBooking.id;
    if (!bid) return;

    const fetchMessages = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) { console.warn("Chat: No auth token found"); return; }
        const res = await fetch(`/api/chat/booking/${bid}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setChatMessages(data);
        } else {
          const errBody = await res.json().catch(() => ({}));
          console.warn("Chat fetch error:", res.status, errBody.error || "");
        }
      } catch (err) {
        console.error("Error fetching chat messages:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChatBooking]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeChatBooking) return;
    const bid = activeChatBooking._id || activeChatBooking.id;
    if (!bid) return;
    const textToSend = newMessage;
    setNewMessage("");

    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) { alert("Please log in to send messages."); return; }
      const res = await fetch(`/api/chat/booking/${bid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text: textToSend })
      });
      if (res.ok) {
        const msg = await res.json();
        setChatMessages(prev => [...prev, msg]);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Send message failed:", res.status, errData);
        alert(errData.error || "Failed to send message. Please try again.");
        setNewMessage(textToSend); // Restore message on failure
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Network error. Please check your connection.");
      setNewMessage(textToSend); // Restore message on failure
    }
  };

  const handleReview = (booking) => {
    // 🚀 DYNAMIC PASSTHROUGH: The backend auto-filters correctly, simply redirect effortlessly!
    navigate("/reviews");
  };

  const handleConfirmCancel = async () => {
    if (!activeCancelBooking) return;
    setSubmittingCancel(true);
    const bid = activeCancelBooking._id || activeCancelBooking.id;
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`/api/bookings/${bid}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`⚖️ Cancellation Requested Successfully!\n\nYour refund request is now pending Administrator review. Once approved, the full amount of ₹${activeCancelBooking.price} will be credited back to your secure Wallet balance! 💵`);
        setActiveCancelBooking(null);
        syncBookings();
      } else {
        alert(`🛑 Cancellation Request Failed!\n\n${data.error || "Unable to request cancellation. Please try again later."}`);
      }
    } catch (e) {
      console.error(e);
      alert("🛑 Network Error: Could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleConfirmComplaint = async () => {
    if (!activeComplaintBooking) return;
    setSubmittingComplaint(true);
    const bid = activeComplaintBooking._id || activeComplaintBooking.id;
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bid,
          issue_type: issueType,
          description: complaintDesc,
          reported_by: sessionStorage.getItem("userName") || "Client"
        })
      });
      if (res.ok) {
        alert("⚖️ Grievance Formally Recorded!\n\nYour complaint has been logged. Administrators will review and take necessary action.");
        setActiveComplaintBooking(null);
        setComplaintDesc("");
      } else {
        alert("Failed to record grievance.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "Completed":
      case "Paid Out":
        return { color: "var(--primary)", bg: "#b4d0e7" };
      case "Accepted":
      case "Confirmed":
        return { color: "#16a34a", bg: "#dcfce7" };
      case "Rejected":
      case "Refund Declined":
        return { color: "#ef4444", bg: "#fee2e2" };
      case "Cancelled":
      case "Escrow Declined":
        return { color: "#4b5563", bg: "#f3f4f6" };
      case "Cancellation Pending":
        return { color: "#ea580c", bg: "#ffedd5" };
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
        className="dashboard-header-block"
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
        className="bookings-content dashboard-content"
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
            { label: "Completed", count: liveBookings.filter(b => b.status === "Completed" || b.status === "Paid Out").length, color: "var(--primary)", bg: "#b4d0e7" }
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
                backgroundColor: "var(--bg-card)",
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
                  className="booking-card"
                  style={{
                    backgroundColor: "var(--bg-card)",
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
                    className="booking-card-header"
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
                          👷 Professional: <strong>{booking.workerName || booking.worker_name || "Verified Professional"}</strong>
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
                    className="booking-card-details"
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
                    <span style={{ fontWeight: 700, color: "var(--primary)" }}>💰 Cost: ₹{booking.price || booking.amount || 0}</span>
                  </div>

                  {(booking.status === "Completed" || booking.status === "Paid Out") && (
                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed #cbd5e1", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
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

                      {isReviewed && booking.status !== "Paid Out" && (
                        <button
                          onClick={() => setActiveComplaintBooking(booking)}
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
                      )}
                    </div>
                  )}

                  {!["Completed", "Paid Out", "Cancelled", "Rejected", "Cancellation Pending", "Refund Declined", "Escrow Declined"].includes(booking.status) && (
                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed #cbd5e1", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => setActiveCancelBooking(booking)}
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
                        ❌ Cancel Booking & Refund
                      </button>

                      {["Accepted", "On the Way", "Started"].includes(booking.status) && (
                        <button
                          onClick={() => {
                            setActiveChatBooking(booking);
                            setChatMessages([]);
                          }}
                          style={{
                            backgroundColor: "#e0f2fe",
                            color: "#0284c7",
                            border: "1px solid #bae6fd",
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
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#bae6fd"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#e0f2fe"}
                        >
                          💬 Chat with Provider
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ❌ CUSTOM CANCELLATION & WALLET REFUND MODAL */}
      {activeCancelBooking && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          fontFamily: "'Outfit', sans-serif",
          backdropFilter: "blur(8px)",
          animation: "fadeIn 0.2s ease-out forwards"
        }}>
          <div
            className="custom-modal"
            style={{
              maxWidth: "400px",
              width: "90%",
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(0,0,0,0.05)"
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: 800, color: "#1e293b" }}>
              Cancel Booking Order?
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
              Are you sure you want to cancel this booking? The total cost of <strong>₹{activeCancelBooking.price}</strong> will be immediately refunded back to your secure wallet.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Select Cancellation Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              >
                <option value="Scheduler Conflict">📅 Scheduler Conflict / Change of Plans</option>
                <option value="Found alternative worker">👷 Found alternative worker</option>
                <option value="Worker did not arrive">💤 Worker did not arrive</option>
                <option value="Pricing Dispute">💰 Pricing / Charge Dispute</option>
                <option value="Other">Other Reason</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                disabled={submittingCancel}
                onClick={handleConfirmCancel}
                style={{
                  flex: 1,
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                {submittingCancel ? "Cancelling..." : "Confirm & Refund 💵"}
              </button>
              <button
                disabled={submittingCancel}
                onClick={() => setActiveCancelBooking(null)}
                style={{
                  flex: 1,
                  backgroundColor: "#e2e8f0",
                  color: "#475569",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px",
                  boxShadow: "none",
                  transform: "none"
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ CUSTOM ABUSE & GRIEVANCE REPORTING MODAL */}
      {activeComplaintBooking && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          fontFamily: "'Outfit', sans-serif",
          backdropFilter: "blur(8px)",
          animation: "fadeIn 0.2s ease-out forwards"
        }}>
          <div
            className="custom-modal"
            style={{
              maxWidth: "440px",
              width: "90%",
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(0,0,0,0.05)"
            }}
          >
            <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 800, color: "#b91c1c", display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚠️</span> Report Abuse or Grievance
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
              Workzy maintains a zero-tolerance policy for abuse. Please document details of the incident below for administrative review and ledger enforcement.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Incident / Grievance Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              >
                <option value="Abuse & Harassment">🚨 Verbal Abuse & Harassment</option>
                <option value="Financial Fraud">💰 Overcharging / Financial Fraud</option>
                <option value="Poor Service Conduct">🧼 Extremely Poor Service Conduct</option>
                <option value="Safety Threat">🛡️ Physical Threat / Safety Risk</option>
                <option value="Other">Other Incident</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Detailed Incident Description</label>
              <textarea
                rows={4}
                value={complaintDesc}
                onChange={(e) => setComplaintDesc(e.target.value)}
                placeholder="Please describe exactly what happened (dates, comments, specific actions)..."
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "13px", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                disabled={submittingComplaint}
                onClick={handleConfirmComplaint}
                style={{
                  flex: 1,
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                {submittingComplaint ? "Filing Report..." : "Submit Abuse Report ⚖️"}
              </button>
              <button
                disabled={submittingComplaint}
                onClick={() => setActiveComplaintBooking(null)}
                style={{
                  flex: 1,
                  backgroundColor: "#e2e8f0",
                  color: "#475569",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px",
                  boxShadow: "none",
                  transform: "none"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💬 CHAT WINDOW MODAL */}
      {activeChatBooking && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          fontFamily: "'Outfit', sans-serif",
          backdropFilter: "blur(8px)",
        }}>
          <div
            style={{
              maxWidth: "500px",
              width: "90%",
              height: "600px",
              maxHeight: "80vh",
              backgroundColor: chatTheme === 'light' ? "white" : "#111827",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: chatTheme === 'light' ? "1px solid rgba(0,0,0,0.05)" : "1px solid #1f2937",
              overflow: "hidden",
              transition: "all 0.3s"
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: "16px 20px",
              background: chatTheme === 'light' 
                ? "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)" 
                : "linear-gradient(135deg, #1e1b4b 0%, #030712 100%)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: chatTheme === 'light' ? "none" : "1px solid #1f2937"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
                  💬 Chatting with {activeChatBooking.workerName || activeChatBooking.worker_name || "Service Provider"}
                </h3>
                <span style={{ fontSize: "11px", opacity: 0.8 }}>
                  Booking ID: #{activeChatBooking._id ? activeChatBooking._id.substring(activeChatBooking._id.length - 6).toUpperCase() : ""}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => setChatTheme(prev => prev === 'light' ? 'dark' : 'light')}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "white",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title="Switch Chat Theme"
                >
                  {chatTheme === 'light' ? "🌙" : "☀️"}
                </button>
                {!globalCallActive && (
                  <button
                    onClick={handleStartCall}
                    style={{
                      backgroundColor: "#16a34a",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 8px rgba(22,163,74,0.3)"
                    }}
                  >
                    📞 App Call
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveChatBooking(null);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "24px",
                    cursor: "pointer",
                    lineHeight: 1
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div style={{
              flex: 1,
              padding: "20px",
              backgroundColor: chatTheme === 'light' ? "#eef2f6" : "#0b0f19",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {chatMessages.length === 0 ? (
                <div style={{
                  margin: "auto",
                  textAlign: "center",
                  color: chatTheme === 'light' ? "#6b7280" : "#4b5563"
                }}>
                  <p style={{ fontSize: "40px", margin: "0 0 10px 0" }}>💬</p>
                  <p style={{ fontSize: "13px", margin: 0 }}>No messages yet. Say hello to get started!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender_id === sessionStorage.getItem("userId");
                  const isSystemCall = msg.text.startsWith("📞");

                  if (isSystemCall) {
                    return (
                      <div
                        key={msg._id || msg.id}
                        style={{
                          alignSelf: "center",
                          backgroundColor: chatTheme === 'light' ? "#e0e7ff" : "#1e1b4b",
                          color: chatTheme === 'light' ? "#3730a3" : "#c7d2fe",
                          padding: "6px 16px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          textAlign: "center",
                          margin: "6px 0",
                          maxWidth: "85%",
                          lineHeight: 1.4,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px"
                        }}
                      >
                        <span>{msg.text}</span>
                        <span style={{ fontSize: "9px", opacity: 0.7 }}>
                          ({new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id || msg.id}
                      style={{
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "75%",
                        backgroundColor: isMe 
                          ? (chatTheme === 'light' ? "#6366f1" : "#4f46e5") 
                          : (chatTheme === 'light' ? "white" : "#1f2937"),
                        color: isMe 
                          ? "white" 
                          : (chatTheme === 'light' ? "#1f2937" : "#f9fafb"),
                        padding: "10px 14px",
                        borderRadius: isMe ? "16px 16px 0 16px" : "16px 16px 16px 0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        border: isMe ? "none" : (chatTheme === 'light' ? "1px solid #e5e7eb" : "1px solid #374151")
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "14px", wordBreak: "break-word", lineHeight: 1.4 }}>
                        {msg.text}
                      </p>
                      <span style={{
                        fontSize: "9px",
                        opacity: 0.7,
                        display: "block",
                        textAlign: "right",
                        marginTop: "4px",
                        color: isMe ? "rgba(255,255,255,0.8)" : (chatTheme === 'light' ? "#6b7280" : "#9ca3af")
                      }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer / Input Form */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: "14px 20px",
                borderTop: chatTheme === 'light' ? "1px solid #cbd5e1" : "1px solid #1f2937",
                backgroundColor: chatTheme === 'light' ? "white" : "#111827",
                display: "flex",
                gap: "10px"
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: chatTheme === 'light' ? "1px solid #cbd5e1" : "1px solid #374151",
                  backgroundColor: chatTheme === 'light' ? "white" : "#0b0f19",
                  color: chatTheme === 'light' ? "#1f2937" : "#f9fafb",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: chatTheme === 'light' ? "#6366f1" : "#4f46e5",
                  color: "white",
                  border: "none",
                  padding: "0 18px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px",
                  boxShadow: "none",
                  transform: "none"
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookings;
