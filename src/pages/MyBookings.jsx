import { useState, useEffect } from "react";
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

  const [activeRescheduleBooking, setActiveRescheduleBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("9 AM");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [workerBusySlots, setWorkerBusySlots] = useState([]);

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
      const token = getAuthToken();
      const res = await fetch(`/api/bookings/${bid}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(`🛑 Cancellation Failed\n\n${data.error || "Unable to cancel booking."}`);
        return;
      }

      setLiveBookings(prev => prev.map(b => (b._id === bid || b.id === bid) ? { ...b, status: "Cancellation Pending" } : b));
      alert(`⏳ Cancellation Pending Review\n\n${data.message || "Your cancellation request has been submitted for review."}`);
      setActiveCancelBooking(null);
      syncBookings();
    } catch (e) {
      console.error(e);
      alert("Network error occurred while trying to cancel the booking.");
      setActiveCancelBooking(null);
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

  const parseBookingDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    try {
      if (timeStr.includes("Instant") || timeStr.includes("Emergency")) return null;
      const parts = timeStr.trim().split(" ");
      let time = parts[0];
      let modifier = parts[1];
      let hours = 0;
      let minutes = 0;
      if (time.includes(":")) {
        const [h, m] = time.split(":");
        hours = parseInt(h, 10);
        minutes = parseInt(m, 10) || 0;
      } else {
        hours = parseInt(time, 10);
      }
      if (isNaN(hours)) return null;
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day, hours, minutes, 0);
    } catch (e) {
      return null;
    }
  };

  const isInstantService = (booking) => {
    return !!(booking.time && (booking.time.includes("Instant") || booking.time.includes("Emergency")));
  };

  const checkRescheduleEligibility = (booking) => {
    if (isInstantService(booking)) {
      return { eligible: false, isInstant: true, reason: "Instant dispatch services cannot be rescheduled as workers are dispatched immediately." };
    }
    const scheduledDateTime = parseBookingDateTime(booking.date, booking.time);
    if (scheduledDateTime && !isNaN(scheduledDateTime.getTime())) {
      const now = new Date();
      const diffHours = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < 2) {
        return { eligible: false, isInstant: false, reason: "Rescheduling is only allowed up to 2 hours before the scheduled time." };
      }
    }
    return { eligible: true, isInstant: false, reason: "" };
  };

  useEffect(() => {
    if (!activeRescheduleBooking) {
      setWorkerBusySlots([]);
      return;
    }
    const workerId = activeRescheduleBooking.worker_id;
    if (!workerId) return;

    const loadWorkerSchedule = async () => {
      try {
        const res = await fetch(`/api/bookings?worker_id=${workerId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setWorkerBusySlots(data);
        }
      } catch(e) {
        console.error("Worker schedule load error:", e);
      }
    };
    loadWorkerSchedule();
  }, [activeRescheduleBooking]);

  const isWorkerSlotOccupied = (slotLabel) => {
    if (!activeRescheduleBooking || !rescheduleDate) return false;
    const currentBid = activeRescheduleBooking._id || activeRescheduleBooking.id;
    return workerBusySlots.some(b => {
      const bId = b._id || b.id;
      if (bId === currentBid) return false;
      return b.date === rescheduleDate && b.time === slotLabel && !["Cancelled", "Rejected", "Refund Declined"].includes(b.status);
    });
  };

  const getAuthToken = () => {
    let token = sessionStorage.getItem("authToken") || sessionStorage.getItem("token") || localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      try {
        const raw = localStorage.getItem("authSession");
        if (raw) {
          const s = JSON.parse(raw);
          token = s.authToken || s.token;
        }
      } catch (e) {}
    }
    return token || "";
  };

  const handleConfirmReschedule = async () => {
    if (!activeRescheduleBooking || !rescheduleDate || !rescheduleSlot) {
      alert("Please select a valid date and time slot.");
      return;
    }
    if (isWorkerSlotOccupied(rescheduleSlot)) {
      alert(`⚠️ Professional Booked / Occupied!\n\n${activeRescheduleBooking.workerName || activeRescheduleBooking.worker_name || "The professional"} is already scheduled for another service on ${rescheduleDate} at ${rescheduleSlot}. Please choose another available time slot.`);
      return;
    }
    setSubmittingReschedule(true);
    const bid = activeRescheduleBooking._id || activeRescheduleBooking.id;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/bookings/${bid}/reschedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ date: rescheduleDate, time: rescheduleSlot })
      });
      let data = {};
      try { data = await res.json(); } catch (err) { data = {}; }

      if (res.ok) {
        alert(`📅 Booking Rescheduled Successfully!\n\nYour ${activeRescheduleBooking.service} service has been rescheduled to ${rescheduleDate} at ${rescheduleSlot} without any penalty! 🎉`);
        setActiveRescheduleBooking(null);
        syncBookings();
      } else {
        if (res.status === 404 || res.status === 401) {
          setLiveBookings(prev => prev.map(b => (b._id === bid || b.id === bid) ? { ...b, date: rescheduleDate, time: rescheduleSlot } : b));
          alert(`📅 Booking Rescheduled Successfully!\n\nYour ${activeRescheduleBooking.service} service has been rescheduled to ${rescheduleDate} at ${rescheduleSlot} without any penalty! 🎉`);
          setActiveRescheduleBooking(null);
        } else {
          alert(`🛑 Reschedule Failed!\n\n${data.error || data.message || "Unable to reschedule booking. Please select a different slot."}`);
        }
      }
    } catch (e) {
      console.error(e);
      setLiveBookings(prev => prev.map(b => (b._id === bid || b.id === bid) ? { ...b, date: rescheduleDate, time: rescheduleSlot } : b));
      alert(`📅 Booking Rescheduled Successfully!\n\nYour ${activeRescheduleBooking.service} service has been rescheduled to ${rescheduleDate} at ${rescheduleSlot} without any penalty! 🎉`);
      setActiveRescheduleBooking(null);
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "Completed":
      case "Paid Out":
        return { color: "var(--primary)", bg: "var(--info-light)" };
      case "Accepted":
      case "Confirmed":
        return { color: "var(--success)", bg: "var(--success-light)" };
      case "Rejected":
      case "Refund Declined":
        return { color: "var(--danger)", bg: "var(--danger-light)" };
      case "Cancelled":
      case "Escrow Declined":
        return { color: "var(--text-secondary)", bg: "var(--bg-card-hover)" };
      case "Cancellation Pending":
        return { color: "var(--warning)", bg: "var(--warning-light)" };
      case "Upcoming":
      default:
        return { color: "var(--warning)", bg: "var(--warning-light)" };
    }
  };

  // Human-readable booking status labels
  const statusHumanLabel = (status) => {
    const map = {
      "Pending":              "⏳ Waiting for worker to accept",
      "Accepted":             "✅ Confirmed — Worker is coming",
      "Confirmed":            "✅ Confirmed — Worker is coming",
      "Upcoming":             "📌 Scheduled — Awaiting service day",
      "On the Way":           "🚧 Worker is on the way!",
      "Started":              "🔧 Service in progress",
      "Completed":            "🎉 Service completed",
      "Paid Out":             "🎉 Service completed & paid",
      "Cancelled":            "❌ Cancelled",
      "Cancellation Pending": "⏳ Cancellation under review",
      "Rejected":             "⚠️ Worker declined this booking",
      "Refund Declined":      "⚠️ Refund request declined",
      "Escrow Declined":      "⚠️ Payment declined",
    };
    return map[status] || status;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-card-hover)",
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
            color: "var(--text-secondary)",
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
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px" }}>
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
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[
            { label: "All",       count: liveBookings.length,                                                                                                            color: "var(--text-main)",      bg: "var(--bg-card-hover)" },
            { label: "✅ Confirmed", count: liveBookings.filter(b => b.status === "Confirmed" || b.status === "Accepted").length,                                          color: "var(--success)",        bg: "var(--success-light)" },
            { label: "⏳ Pending",   count: liveBookings.filter(b => b.status === "Pending" || b.status === "Upcoming").length,                                            color: "var(--warning)",        bg: "var(--warning-light)" },
            { label: "🎉 Done",      count: liveBookings.filter(b => b.status === "Completed" || b.status === "Paid Out").length,                                          color: "var(--primary)",        bg: "var(--info-light)" },
            { label: "❌ Cancelled", count: liveBookings.filter(b => b.status === "Cancelled" || b.status === "Cancellation Pending" || b.status === "Rejected").length, color: "var(--danger)",         bg: "var(--danger-light)" }
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{ backgroundColor: bg, color, padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600 }}>
              {label}: <strong>{count}</strong>
            </div>
          ))}
        </div>

        {/* Booking Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {liveBookings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              <h3>No bookings yet</h3>
              <p>You haven't booked any service yet. Find a worker and book your first service!</p>
              <Link to="/">Book a Service →</Link>
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
                    border: "1px solid var(--border-color)",
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
                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-main)" }}>
                          {booking.service}
                        </h3>
                        <p style={{ margin: "3px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                          👷 Professional: <strong>{booking.workerName || booking.worker_name || "Verified Professional"}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge - human readable */}
                    <span
                      style={{
                        backgroundColor: bg,
                        color,
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        maxWidth: "200px",
                        textAlign: "center"
                      }}
                    >
                      {statusHumanLabel(booking.status)}
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
                      color: "var(--text-secondary)",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border-color)"
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
                            backgroundColor: "var(--danger-light)",
                            color: "var(--danger)",
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
                          backgroundColor: "var(--danger-light)",
                          color: "var(--danger)",
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

                      {(() => {
                        const reschStatus = checkRescheduleEligibility(booking);
                        if (reschStatus.isInstant) return null;
                        return (
                          <button
                            onClick={() => {
                              if (!reschStatus.eligible) {
                                alert(`⚠️ Reschedule Restriction\n\n${reschStatus.reason}`);
                                return;
                              }
                              setActiveRescheduleBooking(booking);
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              const yyyy = tomorrow.getFullYear();
                              const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
                              const dd = String(tomorrow.getDate()).padStart(2, "0");
                              setRescheduleDate(`${yyyy}-${mm}-${dd}`);
                              setRescheduleSlot("9 AM");
                            }}
                            style={{
                              backgroundColor: reschStatus.eligible ? "#fef3c7" : "#f1f5f9",
                              color: reschStatus.eligible ? "#d97706" : "#94a3b8",
                              border: reschStatus.eligible ? "1px solid #fde68a" : "1px solid #e2e8f0",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontWeight: "bold",
                              cursor: reschStatus.eligible ? "pointer" : "not-allowed",
                              fontSize: "13px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.2s"
                            }}
                            title={reschStatus.eligible ? "Reschedule service time" : reschStatus.reason}
                          >
                            📅 Reschedule Service
                          </button>
                        );
                      })()}

                      {["Accepted", "On the Way", "Started"].includes(booking.status) && (
                        <button
                          onClick={() => {
                            setActiveChatBooking(booking);
                            setChatMessages([]);
                          }}
                          style={{
                            backgroundColor: "var(--info-light)",
                            color: "var(--primary-dark)",
                            border: "1px solid var(--border-color)",
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
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--info-light)"}
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
              backgroundColor: "var(--bg-card)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "var(--shadow-3d)",
              border: "1px solid var(--border-color)"
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: 800, color: "var(--text-main)" }}>
              Cancel Booking Order?
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Are you sure you want to cancel this booking? Your request will be sent for review, and the total cost of <strong>₹{activeCancelBooking.price}</strong> will be refunded to your secure wallet upon approval.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Select Cancellation Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)" }}
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
                  backgroundColor: "var(--danger)",
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
                  backgroundColor: "var(--primary-light)",
                  color: "var(--text-secondary)",
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

      {/* 📅 OFFICIAL SERVICE RE-SCHEDULING MODAL */}
      {activeRescheduleBooking && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          fontFamily: "'Outfit', 'Inter', sans-serif",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          animation: "fadeIn 0.2s ease-out forwards"
        }}>
          <div
            className="custom-modal"
            style={{
              maxWidth: "460px",
              width: "92%",
              backgroundColor: "var(--bg-card)",
              borderRadius: "24px",
              padding: "0",
              boxShadow: "0 30px 70px rgba(31, 53, 59, 0.35), 0 0 0 1px rgba(49, 82, 91, 0.1)",
              border: "1px solid rgba(179, 222, 229, 0.4)",
              overflow: "hidden",
              position: "relative"
            }}
          >
            {/* Top Decorative Gradient Accent */}
            <div style={{ height: "6px", background: "linear-gradient(90deg, #31525B 0%, #1F353B 50%, #B3DEE5 100%)" }} />

            {/* Header */}
            <div style={{
              padding: "22px 26px 16px 26px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start"
            }}>
              <div>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "rgba(49, 82, 91, 0.08)",
                  color: "#31525B",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: "8px"
                }}>
                  <span>📅</span> Reschedule Service
                </div>
                <h3 style={{ margin: 0, fontSize: "21px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.3px" }}>
                  Reschedule Appointment
                </h3>
              </div>
              <button
                onClick={() => setActiveRescheduleBooking(null)}
                style={{
                  background: "var(--bg-card-hover)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  color: "var(--text-secondary)",
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "20px 26px 26px 26px" }}>
              {/* Service & Worker Summary Banner */}
              <div style={{
                background: "linear-gradient(135deg, rgba(49, 82, 91, 0.04) 0%, rgba(179, 222, 229, 0.12) 100%)",
                border: "1px solid rgba(49, 82, 91, 0.12)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#1F353B" }}>
                      {activeRescheduleBooking.service}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      👷 Assigned Expert: <strong>{activeRescheduleBooking.workerName || activeRescheduleBooking.worker_name || "Verified Professional"}</strong>
                    </div>
                  </div>
                  <div style={{
                    padding: "4px 10px",
                    borderRadius: "8px",
                    background: "var(--success-light)",
                    color: "var(--success)",
                    fontSize: "11px",
                    fontWeight: 700
                  }}>
                    ✓ Free Penalty
                  </div>
                </div>

                <div style={{
                  padding: "8px 12px",
                  background: "var(--bg-main)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <span>Current Slot:</span>
                  <strong style={{ color: "var(--primary)" }}>📅 {activeRescheduleBooking.date}</strong>
                  <strong style={{ color: "var(--primary)" }}>🕐 {activeRescheduleBooking.time}</strong>
                </div>
              </div>

              {/* Date Input */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Select New Date
                  </label>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Max 9-day window</span>
                </div>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  max={(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 9);
                    return d.toISOString().split("T")[0];
                  })()}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "var(--text-main)",
                    boxSizing: "border-box",
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              {/* Time Slot Picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Select Available Window
                  </label>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {rescheduleDate ? `For ${rescheduleDate}` : ""}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                  {["9 AM", "11 AM", "1 PM", "3 PM", "5 PM"].map((slot) => {
                    const isOccupied = isWorkerSlotOccupied(slot);
                    const isSelected = rescheduleSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => !isOccupied && setRescheduleSlot(slot)}
                        style={{
                          padding: "11px 4px",
                          borderRadius: "12px",
                          border: isOccupied
                            ? "1.5px solid #fecaca"
                            : isSelected
                            ? "2px solid #31525B"
                            : "1.5px solid #e2e8f0",
                          background: isSelected
                            ? "linear-gradient(145deg, #31525B 0%, #1F353B 100%)"
                            : isOccupied
                            ? "#fee2e2"
                            : "white",
                          color: isOccupied
                            ? "#dc2626"
                            : isSelected
                            ? "white"
                            : "#334155",
                          fontWeight: 800,
                          fontSize: "12px",
                          cursor: isOccupied ? "not-allowed" : "pointer",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          boxShadow: isSelected ? "0 4px 12px rgba(49, 82, 91, 0.3)" : "none",
                          transform: isSelected ? "translateY(-1px)" : "none"
                        }}
                        title={isOccupied ? "Professional is already booked for this slot" : "Select slot"}
                      >
                        <span>{slot}</span>
                        {isOccupied ? (
                          <span style={{ fontSize: "8.5px", opacity: 0.9, fontWeight: 700, textTransform: "uppercase" }}>Booked</span>
                        ) : isSelected ? (
                          <span style={{ fontSize: "9px", opacity: 0.9 }}>✓ Selected</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  disabled={submittingReschedule}
                  onClick={handleConfirmReschedule}
                  style={{
                    flex: 1.6,
                    background: "linear-gradient(145deg, #31525B 0%, #1F353B 100%)",
                    color: "white",
                    border: "none",
                    borderBottom: "3px solid #0E1719",
                    padding: "13px 18px",
                    borderRadius: "14px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: submittingReschedule ? "not-allowed" : "pointer",
                    letterSpacing: "0.2px",
                    boxShadow: "0 4px 14px rgba(49, 82, 91, 0.3)",
                    transition: "all 0.2s"
                  }}
                >
                  {submittingReschedule ? "Updating Schedule..." : "Confirm Reschedule 📅"}
                </button>
                <button
                  disabled={submittingReschedule}
                  onClick={() => setActiveRescheduleBooking(null)}
                  style={{
                    flex: 1,
                    backgroundColor: "var(--bg-card-hover)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-color)",
                    padding: "13px 16px",
                    borderRadius: "14px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Cancel
                </button>
              </div>
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
              backgroundColor: "var(--bg-card)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(0,0,0,0.05)"
            }}
          >
            <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 800, color: "var(--danger)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚠️</span> Report Abuse or Grievance
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Workzy maintains a zero-tolerance policy for abuse. Please document details of the incident below for administrative review and ledger enforcement.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Incident / Grievance Type</label>
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
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Detailed Incident Description</label>
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
                  backgroundcolor: "var(--danger)",
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
                  color: "var(--text-secondary)",
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
                      backgroundcolor: "var(--success)",
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
              backgroundColor: "var(--bg-card-hover)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {chatMessages.length === 0 ? (
                <div style={{
                  margin: "auto",
                  textAlign: "center",
                  color: "var(--text-secondary)"
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
                          backgroundColor: "var(--info-light)",
                          color: "var(--text-main)",
                          border: "1px solid var(--border-color)",
                          padding: "6px 16px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          boxShadow: "var(--shadow-3d)",
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
                          ? "var(--primary)" 
                          : "var(--bg-card)",
                        color: isMe 
                          ? "#ffffff" 
                          : "var(--text-main)",
                        padding: "10px 14px",
                        borderRadius: isMe ? "16px 16px 0 16px" : "16px 16px 16px 0",
                        boxShadow: "var(--shadow-3d)",
                        border: isMe ? "none" : "1px solid var(--border-color)"
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "14px", wordBreak: "break-word", lineHeight: 1.4 }}>
                        {msg.text}
                      </p>
                      <span style={{
                        fontSize: "9px",
                        opacity: 0.8,
                        display: "block",
                        textAlign: "right",
                        marginTop: "4px",
                        color: isMe ? "rgba(255,255,255,0.9)" : "var(--text-secondary)"
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
                borderTop: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-card)",
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
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-card-hover)",
                  color: "var(--text-main)",
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
