import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHammer,
  FaWrench,
  FaBolt,
  FaSnowflake,
  FaBroom,
  FaPaintRoller,
  FaTruck,
  FaStethoscope,
  FaCalendarAlt,
  FaClock,
  FaRupeeSign,
  FaUserTie,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaBan,
  FaSyncAlt,
  FaCommentDots,
  FaStar,
  FaExclamationTriangle,
  FaArrowLeft,
  FaClipboardList,
  FaCheckDouble,
  FaPhoneAlt,
  FaMoon,
  FaSun,
  FaCheck,
  FaInfoCircle
} from "react-icons/fa";

const serviceIcons = {
  "Carpentry": <FaHammer />,
  "Plumbing": <FaWrench />,
  "Electrical": <FaBolt />,
  "AC Repair": <FaSnowflake />,
  "House Cleaning": <FaBroom />,
  "Interior Painting": <FaPaintRoller />,
  "Packers & Movers": <FaTruck />,
  "Doctors & Medical": <FaStethoscope />
};

function MyBookings() {
  const [liveBookings, setLiveBookings] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
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
  const [rescheduleSlot, setRescheduleSlot] = useState("");
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
    const count = booking.rescheduleCount || booking.reschedule_count || 0;
    if (count >= 2) {
      return { eligible: false, isInstant: false, reason: "Maximum reschedule limit of 2 times reached! Further rescheduling is not permitted." };
    }
    const scheduledDateTime = parseBookingDateTime(booking.date, booking.time);
    if (scheduledDateTime && !isNaN(scheduledDateTime.getTime())) {
      const now = new Date();
      const diffHours = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < 2) {
        return { eligible: false, isInstant: false, reason: "Rescheduling is only accepted at least 2 hours before the scheduled service time." };
      }
    }
    return { eligible: true, isInstant: false, reason: "", count, remaining: 2 - count };
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

  const RESCHEDULE_TIME_SLOTS = [
    { label: "9 AM", hour: 9 },
    { label: "11 AM", hour: 11 },
    { label: "1 PM", hour: 13 },
    { label: "3 PM", hour: 15 },
    { label: "5 PM", hour: 17 }
  ];

  const getMinRescheduleDate = () => {
    const now = new Date();
    // If all slots for today have completed (current hour >= 17 or no remaining slot), minimum date is tomorrow
    const hasRemainingSlotToday = RESCHEDULE_TIME_SLOTS.some(s => s.hour > now.getHours());
    if (!hasRemainingSlotToday) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getMaxRescheduleDate = () => {
    const base = new Date(getMinRescheduleDate());
    base.setDate(base.getDate() + 9);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, "0");
    const dd = String(base.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const isRescheduleSlotPast = (slotLabel, checkDate = rescheduleDate) => {
    if (!checkDate) return false;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (checkDate < todayStr || checkDate < getMinRescheduleDate()) return true;
    if (checkDate === todayStr) {
      const slotObj = RESCHEDULE_TIME_SLOTS.find(s => s.label === slotLabel);
      if (slotObj) {
        return slotObj.hour <= now.getHours();
      }
    }
    return false;
  };

  const isWorkerSlotOccupied = (slotLabel, dateOverride = rescheduleDate) => {
    if (!activeRescheduleBooking || !dateOverride) return false;
    const currentBid = activeRescheduleBooking._id || activeRescheduleBooking.id;
    return workerBusySlots.some(b => {
      const bId = b._id || b.id;
      if (bId === currentBid) return false;
      return b.date === dateOverride && b.time === slotLabel && !["Cancelled", "Rejected", "Refund Declined"].includes(b.status);
    });
  };

  const getNextAvailableRescheduleSlot = (targetDate) => {
    if (!targetDate) return "";
    for (const s of RESCHEDULE_TIME_SLOTS) {
      if (!isRescheduleSlotPast(s.label, targetDate) && !isWorkerSlotOccupied(s.label, targetDate)) {
        return s.label;
      }
    }
    return "";
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
      alert("Please select a valid date and an available time slot.");
      return;
    }
    const currentCount = activeRescheduleBooking.rescheduleCount || activeRescheduleBooking.reschedule_count || 0;
    if (currentCount >= 2) {
      alert("⚠️ Reschedule Limit Exceeded!\n\nYou have already rescheduled this appointment 2 times. Maximum reschedule limit reached.");
      return;
    }
    const origDateTime = parseBookingDateTime(activeRescheduleBooking.date, activeRescheduleBooking.time);
    if (origDateTime && !isNaN(origDateTime.getTime())) {
      const now = new Date();
      const diffHours = (origDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < 2) {
        alert("⚠️ Reschedule Restriction!\n\nRescheduling is only accepted at least 2 hours before the scheduled service time.");
        return;
      }
    }
    if (isRescheduleSlotPast(rescheduleSlot, rescheduleDate)) {
      alert(`⚠️ Time Slot Completed / Expired!\n\nThe slot "${rescheduleSlot}" on ${rescheduleDate} has already passed or completed. Please choose an upcoming available time slot.`);
      return;
    }
    if (isWorkerSlotOccupied(rescheduleSlot, rescheduleDate)) {
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
        const nextCount = currentCount + 1;
        setLiveBookings(prev => prev.map(b => (b._id === bid || b.id === bid) ? { ...b, date: rescheduleDate, time: rescheduleSlot, rescheduleCount: nextCount } : b));
        alert(`📅 Booking Rescheduled Successfully!\n\nYour ${activeRescheduleBooking.service} service has been rescheduled to ${rescheduleDate} at ${rescheduleSlot} without any penalty! (${nextCount}/2 reschedules used) 🎉`);
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

  const renderStatusBadge = (status) => {
    let label = status;
    let icon = <FaInfoCircle style={{ fontSize: "11px" }} />;
    let bg = "rgba(100, 116, 139, 0.12)";
    let color = "var(--text-secondary)";
    let border = "1px solid rgba(100, 116, 139, 0.3)";

    switch (status) {
      case "Pending":
      case "Upcoming":
        label = "Waiting for worker to accept";
        icon = <FaHourglassHalf style={{ fontSize: "11px" }} />;
        bg = "rgba(217, 119, 6, 0.12)";
        color = "#d97706";
        border = "1px solid rgba(217, 119, 6, 0.35)";
        break;
      case "Confirmed":
        label = "Booking Confirmed";
        icon = <FaCheckCircle style={{ fontSize: "11px" }} />;
        bg = "rgba(16, 185, 129, 0.12)";
        color = "#10b981";
        border = "1px solid rgba(16, 185, 129, 0.35)";
        break;
      case "Accepted":
        label = "Worker Assigned";
        icon = <FaUserTie style={{ fontSize: "11px" }} />;
        bg = "rgba(16, 185, 129, 0.12)";
        color = "#10b981";
        border = "1px solid rgba(16, 185, 129, 0.35)";
        break;
      case "On the Way":
        label = "Worker On the Way";
        icon = <FaTruck style={{ fontSize: "11px" }} />;
        bg = "rgba(16, 185, 129, 0.12)";
        color = "#10b981";
        border = "1px solid rgba(16, 185, 129, 0.35)";
        break;
      case "Started":
        label = "Service in Progress";
        icon = <FaBolt style={{ fontSize: "11px" }} />;
        bg = "rgba(59, 130, 246, 0.12)";
        color = "#3b82f6";
        border = "1px solid rgba(59, 130, 246, 0.35)";
        break;
      case "Completed":
      case "Paid Out":
        label = "Service Completed";
        icon = <FaCheckDouble style={{ fontSize: "11px" }} />;
        bg = "rgba(59, 130, 246, 0.12)";
        color = "#3b82f6";
        border = "1px solid rgba(59, 130, 246, 0.35)";
        break;
      case "Cancellation Pending":
        label = "Cancellation in Review";
        icon = <FaClock style={{ fontSize: "11px" }} />;
        bg = "rgba(234, 88, 12, 0.12)";
        color = "#ea580c";
        border = "1px solid rgba(234, 88, 12, 0.35)";
        break;
      case "Cancelled":
        label = "Booking Cancelled";
        icon = <FaTimesCircle style={{ fontSize: "11px" }} />;
        bg = "rgba(239, 68, 68, 0.12)";
        color = "#ef4444";
        border = "1px solid rgba(239, 68, 68, 0.35)";
        break;
      case "Rejected":
      case "Refund Declined":
      case "Escrow Declined":
      default:
        label = status === "Rejected" ? "Declined by Worker" : status;
        icon = <FaBan style={{ fontSize: "11px" }} />;
        bg = "rgba(239, 68, 68, 0.12)";
        color = "#ef4444";
        border = "1px solid rgba(239, 68, 68, 0.35)";
        break;
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "5px 12px",
          borderRadius: "16px",
          fontSize: "12px",
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          border: border,
          whiteSpace: "nowrap"
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", color: color }}>{icon}</span>
        <span style={{ color: color, fontWeight: 700 }}>{label}</span>
      </span>
    );
  };

  const counts = {
    All: liveBookings.length,
    Confirmed: liveBookings.filter(b => b.status === "Confirmed" || b.status === "Accepted" || b.status === "On the Way" || b.status === "Started").length,
    Pending: liveBookings.filter(b => b.status === "Pending" || b.status === "Upcoming").length,
    Done: liveBookings.filter(b => b.status === "Completed" || b.status === "Paid Out").length,
    Cancelled: liveBookings.filter(b => b.status === "Cancelled" || b.status === "Cancellation Pending" || b.status === "Rejected" || b.status === "Refund Declined" || b.status === "Escrow Declined").length
  };

  const filterTabs = [
    {
      id: "All",
      label: `All: ${counts.All}`,
      icon: <FaClipboardList style={{ fontSize: "12px" }} />,
      activeBg: "var(--primary, #2563eb)",
      activeColor: "#ffffff",
      defaultBg: "var(--bg-card)",
      defaultColor: "var(--text-main)",
      defaultBorder: "1px solid var(--border-color)"
    },
    {
      id: "Confirmed",
      label: `Confirmed: ${counts.Confirmed}`,
      icon: <FaCheckCircle style={{ fontSize: "12px" }} />,
      activeBg: "#16a34a",
      activeColor: "#ffffff",
      defaultBg: "rgba(22, 163, 74, 0.12)",
      defaultColor: "#16a34a",
      defaultBorder: "1px solid rgba(22, 163, 74, 0.35)"
    },
    {
      id: "Pending",
      label: `Pending: ${counts.Pending}`,
      icon: <FaHourglassHalf style={{ fontSize: "12px" }} />,
      activeBg: "#d97706",
      activeColor: "#ffffff",
      defaultBg: "rgba(217, 119, 6, 0.12)",
      defaultColor: "#d97706",
      defaultBorder: "1px solid rgba(217, 119, 6, 0.35)"
    },
    {
      id: "Completed",
      label: `Done: ${counts.Done}`,
      icon: <FaCheckDouble style={{ fontSize: "12px" }} />,
      activeBg: "#2563eb",
      activeColor: "#ffffff",
      defaultBg: "rgba(37, 99, 235, 0.12)",
      defaultColor: "#2563eb",
      defaultBorder: "1px solid rgba(37, 99, 235, 0.35)"
    },
    {
      id: "Cancelled",
      label: `Cancelled: ${counts.Cancelled}`,
      icon: <FaTimesCircle style={{ fontSize: "12px" }} />,
      activeBg: "#dc2626",
      activeColor: "#ffffff",
      defaultBg: "rgba(220, 38, 38, 0.12)",
      defaultColor: "#dc2626",
      defaultBorder: "1px solid rgba(220, 38, 38, 0.35)"
    }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-main)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "var(--text-main)"
      }}
    >
      {/* Clean Official Header */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderBottom: "1px solid var(--border-color)",
          padding: "24px 20px"
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <Link
            to="/"
            style={{
              color: "var(--primary, #2563eb)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "12px"
            }}
          >
            <FaArrowLeft style={{ fontSize: "11px" }} />
            <span style={{ color: "inherit" }}>Back to Home</span>
          </Link>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaClipboardList style={{ color: "var(--primary, #2563eb)", fontSize: "22px" }} />
            <span>My Bookings</span>
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13.5px" }}>
            Track and manage all your service bookings
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "20px 16px 40px 16px"
        }}
      >
        {/* Simple & Clean Filter Pills with Guaranteed High-Contrast Text in All Modes */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "20px"
          }}
        >
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab.id;
            const textColor = isSelected ? tab.activeColor : tab.defaultColor;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: isSelected ? `1.5px solid ${tab.activeBg}` : tab.defaultBorder,
                  backgroundColor: isSelected ? tab.activeBg : tab.defaultBg,
                  color: textColor,
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: isSelected ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none"
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", color: textColor }}>
                  {tab.icon}
                </span>
                <span style={{ color: textColor, fontWeight: 700, fontSize: "13px" }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bookings List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {(() => {
            const filtered = liveBookings.filter(b => {
              if (selectedFilter === "All") return true;
              if (selectedFilter === "Pending") return b.status === "Pending" || b.status === "Upcoming";
              if (selectedFilter === "Confirmed") return b.status === "Confirmed" || b.status === "Accepted" || b.status === "On the Way" || b.status === "Started";
              if (selectedFilter === "Completed") return b.status === "Completed" || b.status === "Paid Out";
              if (selectedFilter === "Cancelled") return b.status === "Cancelled" || b.status === "Cancellation Pending" || b.status === "Rejected" || b.status === "Refund Declined" || b.status === "Escrow Declined";
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  <div style={{ fontSize: "36px", color: "var(--text-secondary)", opacity: 0.6, marginBottom: "12px" }}>
                    <FaClipboardList />
                  </div>
                  <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
                    {selectedFilter === "All" ? "No bookings yet" : `No ${selectedFilter.toLowerCase()} bookings`}
                  </h3>
                  <p style={{ margin: "0 0 16px 0", color: "var(--text-secondary)", fontSize: "13.5px" }}>
                    {selectedFilter === "All"
                      ? "You haven't booked any services yet."
                      : "No service bookings found matching this filter."}
                  </p>
                  <Link
                    to="/"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 18px",
                      backgroundColor: "var(--primary, #2563eb)",
                      color: "#ffffff",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: "13px"
                    }}
                  >
                    <span>Book a Service →</span>
                  </Link>
                </div>
              );
            }

            return filtered.map((booking) => {
              const bid = booking._id || booking.id;
              const isReviewed = reviewedIds.has(bid);
              const count = booking.rescheduleCount || booking.reschedule_count || 0;
              const reschStatus = checkRescheduleEligibility(booking);

              return (
                <div
                  key={bid}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                  }}
                >
                  {/* Service Header Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginBottom: "12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{
                        fontSize: "20px",
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(37, 99, 235, 0.08)",
                        color: "var(--primary, #2563eb)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        {serviceIcons[booking.service] || <FaWrench />}
                      </span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
                          {booking.service}
                        </h3>
                        <div style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "3px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <FaUserTie style={{ fontSize: "11px", color: "var(--text-secondary)" }} />
                          <span style={{ color: "var(--text-secondary)" }}>
                            Professional: <strong style={{ color: "var(--text-main)" }}>{booking.workerName || booking.worker_name || "Verified Professional"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {renderStatusBadge(booking.status)}
                    </div>
                  </div>

                  {/* Clean Simple Details with Official UI Symbols */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      fontSize: "13.5px",
                      color: "var(--text-secondary)",
                      marginBottom: "14px"
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FaCalendarAlt style={{ color: "var(--primary, #2563eb)", fontSize: "12px" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Date: <strong style={{ color: "var(--text-main)" }}>{booking.date}</strong></span>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FaClock style={{ color: "var(--primary, #2563eb)", fontSize: "12px" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Time: <strong style={{ color: "var(--text-main)" }}>{booking.time}</strong></span>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FaRupeeSign style={{ color: "var(--primary, #2563eb)", fontSize: "12px" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Cost: <strong style={{ color: "var(--text-main)" }}>₹{booking.price || booking.amount || 0}</strong></span>
                    </div>
                    {count > 0 && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <FaSyncAlt style={{ color: count >= 2 ? "#dc2626" : "#d97706", fontSize: "12px" }} />
                        <span style={{ color: "var(--text-secondary)" }}>Rescheduled: <strong style={{ color: count >= 2 ? "#dc2626" : "#d97706" }}>{count}/2 times used</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Divider line */}
                  <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    
                    {/* Action buttons for active bookings */}
                    {!["Completed", "Paid Out", "Cancelled", "Rejected", "Cancellation Pending", "Refund Declined", "Escrow Declined"].includes(booking.status) && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveCancelBooking(booking)}
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.35)",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "13px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <FaBan style={{ fontSize: "11px", color: "#ef4444" }} />
                          <span style={{ color: "#ef4444", fontWeight: 700 }}>Cancel Booking & Refund</span>
                        </button>

                        {!reschStatus.isInstant && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!reschStatus.eligible) {
                                alert(`⚠️ Reschedule Restriction\n\n${reschStatus.reason}`);
                                return;
                              }
                              setActiveRescheduleBooking(booking);
                              const initialDate = getMinRescheduleDate();
                              setRescheduleDate(initialDate);
                              const initialSlot = getNextAvailableRescheduleSlot(initialDate) || "9 AM";
                              setRescheduleSlot(initialSlot);
                            }}
                            disabled={!reschStatus.eligible}
                            style={{
                              backgroundColor: reschStatus.eligible ? "rgba(59, 130, 246, 0.1)" : "var(--bg-main)",
                              color: reschStatus.eligible ? "var(--primary, #3b82f6)" : "var(--text-muted)",
                              border: reschStatus.eligible ? "1px solid rgba(59, 130, 246, 0.35)" : "1px solid var(--border-color)",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontWeight: 700,
                              cursor: reschStatus.eligible ? "pointer" : "not-allowed",
                              fontSize: "13px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                            title={reschStatus.eligible ? `Reschedule appointment (Allowed up to 2 times, min 2 hrs in advance. Used: ${count}/2)` : reschStatus.reason}
                          >
                            <FaCalendarAlt style={{ fontSize: "11px", color: reschStatus.eligible ? "var(--primary, #3b82f6)" : "var(--text-muted)" }} />
                            <span style={{ color: reschStatus.eligible ? "var(--primary, #3b82f6)" : "var(--text-muted)", fontWeight: 700 }}>
                              Reschedule Service {count > 0 ? `(${count}/2)` : ""}
                            </span>
                          </button>
                        )}

                        {["Accepted", "On the Way", "Started"].includes(booking.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatBooking(booking);
                              setChatMessages([]);
                            }}
                            style={{
                              backgroundColor: "rgba(16, 185, 129, 0.1)",
                              color: "#10b981",
                              border: "1px solid rgba(16, 185, 129, 0.35)",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontSize: "13px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <FaCommentDots style={{ fontSize: "12px", color: "#10b981" }} />
                            <span style={{ color: "#10b981", fontWeight: 700 }}>Chat with Provider</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Completed booking actions */}
                    {(booking.status === "Completed" || booking.status === "Paid Out") && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReview(booking)}
                          disabled={isReviewed}
                          style={{
                            backgroundColor: isReviewed ? "var(--bg-main)" : "var(--primary, #2563eb)",
                            color: isReviewed ? "var(--text-secondary)" : "#ffffff",
                            border: isReviewed ? "1px solid var(--border-color)" : "none",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontWeight: 700,
                            cursor: isReviewed ? "default" : "pointer",
                            fontSize: "13px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          {isReviewed ? (
                            <>
                              <FaCheck style={{ fontSize: "11px", color: "var(--text-secondary)" }} />
                              <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>Review Submitted</span>
                            </>
                          ) : (
                            <>
                              <FaStar style={{ fontSize: "12px", color: "#fbbf24" }} />
                              <span style={{ color: "#ffffff", fontWeight: 700 }}>Rate Service & Earn ₹50 Cashback</span>
                            </>
                          )}
                        </button>

                        {isReviewed && booking.status !== "Paid Out" && (
                          <button
                            type="button"
                            onClick={() => setActiveComplaintBooking(booking)}
                            style={{
                              backgroundColor: "transparent",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              padding: "8px 14px",
                              borderRadius: "8px",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontSize: "13px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <FaExclamationTriangle style={{ fontSize: "11px", color: "#dc2626" }} />
                            <span style={{ color: "#dc2626", fontWeight: 700 }}>Report Grievance</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* CUSTOM CANCELLATION & WALLET REFUND MODAL */}
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
              maxHeight: "85vh",
              overflowY: "auto",
              backgroundColor: "var(--bg-card)",
              borderRadius: "20px",
              padding: "28px",
              boxSizing: "border-box",
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
                <option value="Scheduler Conflict">Scheduler Conflict / Change of Plans</option>
                <option value="Found alternative worker">Found alternative worker</option>
                <option value="Worker did not arrive">Worker did not arrive</option>
                <option value="Pricing Dispute">Pricing / Charge Dispute</option>
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
                {submittingCancel ? "Cancelling..." : "Confirm & Refund"}
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
              maxHeight: "90vh",
              overflowY: "auto",
              backgroundColor: "var(--bg-card)",
              borderRadius: "24px",
              padding: "0",
              boxSizing: "border-box",
              boxShadow: "0 30px 70px rgba(31, 53, 59, 0.35), 0 0 0 1px rgba(49, 82, 91, 0.1)",
              border: "1px solid rgba(179, 222, 229, 0.4)",
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
                  <FaCalendarAlt style={{ fontSize: "11px" }} /> Reschedule Service
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
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><FaUserTie style={{ fontSize: "11px", color: "var(--text-secondary)" }} /> Assigned Expert: <strong>{activeRescheduleBooking.workerName || activeRescheduleBooking.worker_name || "Verified Professional"}</strong></span>
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
                    Free of Penalty
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
                  <strong style={{ color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "4px" }}><FaCalendarAlt style={{ fontSize: "11px" }} /> {activeRescheduleBooking.date}</strong>
                  <strong style={{ color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "4px" }}><FaClock style={{ fontSize: "11px" }} /> {activeRescheduleBooking.time}</strong>
                </div>

                {/* 📋 Reschedule Policy Badge & Notice */}
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(59, 130, 246, 0.06)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  fontSize: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaInfoCircle style={{ fontSize: "12px" }} /> Reschedule Policy:
                    </span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: (activeRescheduleBooking.rescheduleCount || activeRescheduleBooking.reschedule_count || 0) >= 1 ? "#d97706" : "#10b981",
                      backgroundColor: (activeRescheduleBooking.rescheduleCount || activeRescheduleBooking.reschedule_count || 0) >= 1 ? "rgba(217, 119, 6, 0.12)" : "rgba(16, 185, 129, 0.12)",
                      padding: "2px 8px",
                      borderRadius: "6px"
                    }}>
                      Used: {activeRescheduleBooking.rescheduleCount || activeRescheduleBooking.reschedule_count || 0}/2 Times
                    </span>
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    • Allowed maximum <strong>2 times</strong> per booking.<br />
                    • Rescheduling strictly accepted at least <strong>2 hours prior</strong> to scheduled service.
                  </div>
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
                  min={getMinRescheduleDate()}
                  max={getMaxRescheduleDate()}
                  value={rescheduleDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setRescheduleDate(newDate);
                    const nextAvail = getNextAvailableRescheduleSlot(newDate);
                    setRescheduleSlot(nextAvail);
                  }}
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
                {rescheduleDate < getMinRescheduleDate() && (
                  <div style={{
                    marginTop: "8px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    color: "#dc2626",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <FaBan style={{ color: "#dc2626", fontSize: "13px", flexShrink: 0 }} />
                    <span>All service slots for this date have completed. Please pick tomorrow or an upcoming date.</span>
                  </div>
                )}
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

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(54px, 1fr))", gap: "8px" }}>
                  {RESCHEDULE_TIME_SLOTS.map(({ label: slot }) => {
                    const isOccupied = isWorkerSlotOccupied(slot);
                    const isPast = isRescheduleSlotPast(slot);
                    const isUnavailable = isOccupied || isPast;
                    const isSelected = rescheduleSlot === slot && !isUnavailable;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => !isUnavailable && setRescheduleSlot(slot)}
                        style={{
                          padding: "11px 4px",
                          borderRadius: "12px",
                          border: isSelected
                            ? "2px solid var(--primary, #31525B)"
                            : isPast
                            ? "1.5px dashed var(--border-color, #cbd5e1)"
                            : isOccupied
                            ? "1.5px solid #fecaca"
                            : "1.5px solid var(--border-color, #e2e8f0)",
                          background: isSelected
                            ? "linear-gradient(145deg, #31525B 0%, #1F353B 100%)"
                            : isPast
                            ? "var(--bg-main, #f1f5f9)"
                            : isOccupied
                            ? "#fee2e2"
                            : "var(--bg-card, white)",
                          color: isSelected
                            ? "white"
                            : isPast
                            ? "var(--text-muted, #94a3b8)"
                            : isOccupied
                            ? "#dc2626"
                            : "var(--text-main, #334155)",
                          fontWeight: 800,
                          fontSize: "12px",
                          cursor: isUnavailable ? "not-allowed" : "pointer",
                          opacity: isPast ? 0.6 : 1,
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          boxShadow: isSelected ? "0 4px 12px rgba(49, 82, 91, 0.3)" : "none",
                          transform: isSelected ? "translateY(-1px)" : "none"
                        }}
                        title={isPast ? "This time slot has already completed for today" : isOccupied ? "Professional is already booked for this slot" : "Select slot"}
                      >
                        <span>{slot}</span>
                        {isPast ? (
                          <span style={{ fontSize: "8px", opacity: 0.85, fontWeight: 700, textTransform: "uppercase" }}>Passed</span>
                        ) : isOccupied ? (
                          <span style={{ fontSize: "8.5px", opacity: 0.9, fontWeight: 700, textTransform: "uppercase" }}>Booked</span>
                        ) : isSelected ? (
                          <span style={{ fontSize: "9px", opacity: 0.9, display: "inline-flex", alignItems: "center", gap: "3px" }}><FaCheck style={{ fontSize: "8px" }} /> Selected</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {RESCHEDULE_TIME_SLOTS.every(s => isRescheduleSlotPast(s.label) || isWorkerSlotOccupied(s.label)) && (
                  <div style={{
                    marginTop: "10px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "var(--danger, #ef4444)",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <FaExclamationTriangle style={{ color: "var(--danger)", fontSize: "13px", flexShrink: 0 }} />
                    <span>All slots for this date have completed or are booked. Please select a future date.</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                {(() => {
                  const countReached = (activeRescheduleBooking.rescheduleCount || activeRescheduleBooking.reschedule_count || 0) >= 2;
                  const isDateExpired = rescheduleDate < getMinRescheduleDate();
                  const isSlotExpired = !rescheduleSlot || isRescheduleSlotPast(rescheduleSlot, rescheduleDate);
                  const isBusy = isWorkerSlotOccupied(rescheduleSlot, rescheduleDate);
                  const isInvalid = countReached || isDateExpired || isSlotExpired || isBusy;
                  return (
                    <button
                      disabled={submittingReschedule || isInvalid}
                      onClick={handleConfirmReschedule}
                      style={{
                        flex: 1.6,
                        background: isInvalid 
                          ? "var(--border, #94a3b8)" 
                          : "linear-gradient(145deg, #31525B 0%, #1F353B 100%)",
                        color: isInvalid ? "var(--text-muted, #64748b)" : "white",
                        border: "none",
                        borderBottom: isInvalid ? "none" : "3px solid #0E1719",
                        padding: "13px 18px",
                        borderRadius: "14px",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor: (submittingReschedule || isInvalid) ? "not-allowed" : "pointer",
                        letterSpacing: "0.2px",
                        boxShadow: isInvalid ? "none" : "0 4px 14px rgba(49, 82, 91, 0.3)",
                        transition: "all 0.2s",
                        opacity: isInvalid ? 0.6 : 1
                      }}
                      title={isInvalid ? "Please choose an upcoming available date and slot" : "Confirm Reschedule"}
                    >
                      {submittingReschedule ? "Updating Schedule..." : "Confirm Reschedule"}
                    </button>
                  );
                })()}
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
              maxHeight: "85vh",
              overflowY: "auto",
              backgroundColor: "var(--bg-card)",
              borderRadius: "20px",
              padding: "28px",
              boxSizing: "border-box",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(0,0,0,0.05)"
            }}
          >
            <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 800, color: "var(--danger)", display: "flex", alignItems: "center", gap: 8 }}>
              <FaExclamationTriangle style={{ fontSize: "18px" }} /> Report Abuse or Grievance
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
                <option value="Abuse & Harassment">Verbal Abuse & Harassment</option>
                <option value="Financial Fraud">Overcharging / Financial Fraud</option>
                <option value="Poor Service Conduct">Extremely Poor Service Conduct</option>
                <option value="Safety Threat">Physical Threat / Safety Risk</option>
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
                {submittingComplaint ? "Filing Report..." : "Submit Abuse Report"}
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
              width: "94%",
              height: "auto",
              maxHeight: "85vh",
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
                  <FaCommentDots style={{ marginRight: "6px", fontSize: "14px" }} /> Chatting with {activeChatBooking.workerName || activeChatBooking.worker_name || "Service Provider"}
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
                  {chatTheme === 'light' ? <FaMoon style={{ fontSize: "13px" }} /> : <FaSun style={{ fontSize: "13px" }} />}
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
                    <FaPhoneAlt style={{ fontSize: "11px", marginRight: "4px" }} /> App Call
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
                  <div style={{ fontSize: "36px", margin: "0 0 10px 0", color: "var(--text-secondary)", opacity: 0.5 }}><FaCommentDots /></div>
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
