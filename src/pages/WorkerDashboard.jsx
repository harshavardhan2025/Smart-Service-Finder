import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import RouteMap from "../components/RouteMap";
import SecurityLogs from "../components/SecurityLogs";
import SkeletonLoader from "../components/SkeletonLoader";

function WorkerDashboard() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState(window.innerWidth <= 768 ? "menu" : "status");
  const [isActive, setIsActive] = useState(true);
  const [openMapId, setOpenMapId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [sosCategory, setSosCategory] = useState("General Emergency");
  const [sosActive, setSosActive] = useState(() => sessionStorage.getItem("sosActive") === "true");
  const [sosLoading, setSosLoading] = useState(false);
  const [activeSosNotificationId, setActiveSosNotificationId] = useState(() => sessionStorage.getItem("activeSosNotificationId") || null);
  const [adminResolvedAlert, setAdminResolvedAlert] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && activeTab === "menu") {
        setActiveTab("status");
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab]);

  // Load the logged-in worker ID dynamically from localStorage, fallback to 1 (Rahul Sharma)
  const selectedWorkerId = Number(sessionStorage.getItem("loggedInWorkerId")) || 1;

  const [activeRejectBooking, setActiveRejectBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("Schedule Conflict");
  const [submittingReject, setSubmittingReject] = useState(false);

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
        targetName: activeChatBooking.customer_name || "Customer"
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
        setNewMessage(textToSend);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Network error. Please check your connection.");
      setNewMessage(textToSend);
    }
  };
  const [bookings, setBookings] = useState([]);
  const [workerReviews, setWorkerReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTexts, setReplyTexts] = useState({});
  const complaints = [];
  const sysNotifications = [];

  const [profile, setProfile] = useState({
    name: sessionStorage.getItem("userName") || "Worker",
    profession: "...",
    phone: "...",
    email: sessionStorage.getItem("userEmail") || "",
    city: "...",
    rating: 5.0,
    totalReviews: 0,
    joinedDate: "...",
    mongoId: null,
    photo: "👷"
  });
  const [editProfile, setEditProfile] = useState({ ...profile });
 
  // ── BULLETPROOF SURVIVAL SUBSYSTEM: Persist security indicators across browser refreshes ──
  useEffect(() => {
    sessionStorage.setItem("sosActive", sosActive);
    if (activeSosNotificationId) {
      sessionStorage.setItem("activeSosNotificationId", activeSosNotificationId);
    } else {
      sessionStorage.removeItem("activeSosNotificationId");
    }
  }, [sosActive, activeSosNotificationId]);

  const location = useLocation();

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    const isWorker = sessionStorage.getItem("isWorker") === "true";
    const userId = sessionStorage.getItem("userId");
    if (!userId || (role !== "worker" && !isWorker && role !== "admin")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (location.state && location.state.resetTab) {
      setActiveTab(location.state.resetTab);
      // Clean up state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Pull real runtime data directly from active Mongo Cloud Backend
  const syncStore = async () => {
    const currentUserId = sessionStorage.getItem("userId");
    const userEmail = sessionStorage.getItem("userEmail");
    if (!currentUserId || !userEmail) return;

    try {
      let targetWorkerMongoId = null;
      let userPhone = "Not Provided";

      // 1. FETCH USER PROFILE FOR ACTUAL PHONE NUMBER
      const userProfileResp = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${sessionStorage.getItem("authToken")}` }
      });
      if (userProfileResp.ok) {
        const uData = await userProfileResp.json();
        userPhone = uData.phone || "Not Provided";
      }

      // 2. DISCOVER AUTHENTIC WORKER ID VIA EMAIL INDEXING
      const workerResp = await fetch(`/api/workers?adminView=true`);
      if (workerResp.ok) {
        const allWorkers = await workerResp.json();
        const match = allWorkers.find(w => 
          (w.email && userEmail && w.email.toLowerCase() === userEmail.toLowerCase()) || 
          w._id === currentUserId
        );
        if (match) {
          // 🛑 CRITICAL SECURITY FIREWALL: Eject instantly if admin has issued a block verdict!
          if (match.status === "Blocked") {
             alert("🚨 CRITICAL ALERT: Access Revoked.\n\nYour professional account has been permanently BLOCKED by administration due to platform violations. Logging out now.");
             sessionStorage.clear();
             window.location.href = "/login";
             return;
          }

          targetWorkerMongoId = match._id; // Authentic Primary Key established
          const p = {
            name: match.name,
            profession: match.service,
            phone: userPhone,
            email: match.email,
            city: match.city,
            rating: match.rating || 5.0,
            walletBalance: match.walletBalance || 0,
            totalReviews: match.reviews || 0,
            joinedDate: "May 2026",
            mongoId: match._id,
            photo: match.service && match.service.includes("Doctors") ? "🩺" : "👷"
          };
          setProfile(p);
          setEditProfile(prev => {
            // Only update editProfile draft if they are not actively editing
            return editMode ? prev : p;
          });
          setIsActive(match.status === "Active");
        } else if (sessionStorage.getItem("userRole") !== "admin") {
          // No worker record found in DB for this email -> immediately eject to Customer Home
          console.warn("No worker record found in database for email:", userEmail);
          sessionStorage.setItem("userRole", "user");
          sessionStorage.setItem("isWorker", "false");
          sessionStorage.removeItem("loggedInWorkerId");
          sessionStorage.removeItem("workerSession_email");
          sessionStorage.removeItem("workerSession_profileId");
          sessionStorage.removeItem("workerSession_name");
          alert("⚠️ No Service Provider profile exists for this account.\n\nRedirecting to Customer Home.");
          navigate("/");
          return;
        }
      }

      // 2. EXECUTE RELATIONAL QUERY USING AUTHENTIC PRIMARY KEY
      if (targetWorkerMongoId) {
        const bookingResp = await fetch(`/api/bookings?worker_id=${targetWorkerMongoId}`, {
          headers: {
            "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`
          }
        });
        if (bookingResp.ok) {
          const data = await bookingResp.json();
          setBookings(data);
        }

        const reviewResp = await fetch(`/api/reviews?worker_id=${targetWorkerMongoId}`);
        if (reviewResp.ok) {
          const data = await reviewResp.json();
          setWorkerReviews(data);
        }
      }

      // 3. REAL-TIME DISPATCH RESOLUTION HOOK: Monitor if administrators resolved active SOS physically
      if (activeSosNotificationId && sosActive) {
        const sosCheckResp = await fetch(`/api/notifications/${activeSosNotificationId}`);
        if (sosCheckResp.ok) {
           const checkData = await sosCheckResp.json();
           if (checkData.success && checkData.notification) {
              // Handshake Protocol: Set indicator rather than forced UI cancellation
              setAdminResolvedAlert(checkData.notification.is_read);
           }
        }
      }
    } catch (err) {
       console.error("Worker Sync Failed:", err);
    } finally {
       setLoading(false);
    }
  };

  const handleAcceptOrder = async (bookingId) => {
    const currentBusy = bookings.some(b => ["Accepted", "On the Way", "Started"].includes(b.status));
    if (currentBusy) {
      alert("❌ CONCURRENCY BLOCKED!\n\nYou are already actively executing an ongoing ride or job order! Complete your current assignment before accepting another task.");
      return;
    }

    try {
      await fetch(`/api/bookings/${bookingId}`, {
         method: "PATCH",
         headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`
         },
         body: JSON.stringify({ status: "Accepted" })
      });
      alert("✅ Order accepted successfully! The customer has been notified. 🚀");
      syncStore();
    } catch (err) { alert("Update failed"); }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
         method: "PATCH",
         headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`
         },
         body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Status updated to: ${newStatus}`);
        syncStore();
      } else {
        alert(`🛑 Status Update Failed!\n\n${data.error || "Unable to update booking status. Please try again."}`);
      }
    } catch (err) {
      console.error(err);
      alert("🛑 Network Error: Could not reach the server. Please check your connection and try again.");
    }
  };

  const handleConfirmReject = async () => {
    if (!activeRejectBooking) return;
    setSubmittingReject(true);
    
    try {
      const res = await fetch(`/api/bookings/${activeRejectBooking.id}`, {
         method: "PATCH",
         headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`
         },
         body: JSON.stringify({ status: "Rejected", reason: rejectReason })
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Order Rejected Successfully!\n\nThe customer has been fully refunded.");
        setActiveRejectBooking(null);
        syncStore();
      } else {
        alert(`🛑 Rejection Failed!\n\n${data.error || "Unable to reject this booking. Please try again."}`);
      }
    } catch (err) {
      console.error(err);
      alert("🛑 Network Error: Could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleTriggerSOS = async () => {
    const hasOngoingJob = bookings.some(b => ["Accepted", "On the Way", "Started"].includes(b.status));
    if (!isActive) {
      alert("❌ SOS CANCELLED: Emergency Broadcast restricts mobilization to active profiles. Toggle status to 'Active' to initiate.");
      return;
    }
    if (!hasOngoingJob) {
      alert("❌ SOS BLOCKED: Dispatch telemetry remains dormant in idle times. SOS functions strictly during active, accepted, or ongoing consumer rides.");
      return;
    }

    if (!window.confirm("⚠️ WARNING: This will immediately alert emergency responders and platform administrators with your current location. Do you wish to proceed?")) {
      return;
    }
    setSosLoading(true);
    let locationStr = "Location coordinates unavailable";
    const sendAlert = async (locStr, latVal = null, lngVal = null) => {
      try {
        const activeBooking = bookings.find(b => ["Accepted", "On the Way", "Started"].includes(b.status));
        const body = {
          user_id: sessionStorage.getItem("userId") || profile.mongoId || "unknown",
          name: profile.name,
          role: "worker",
          booking_id: activeBooking ? (activeBooking._id || activeBooking.id) : undefined,
          lat: latVal,
          lng: lngVal,
          location_name: locStr
        };

        const res = await fetch("/api/security/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.notification) {
             setActiveSosNotificationId(data.notification._id);
          }
          setSosActive(true);
          alert("🚨 SOS ALERT BROADCASTED TO ADMIN & EMERGENCY TEAMS! Please stay calm. Assistance is being mobilized.");
        } else {
          throw new Error("Failed to broadcast");
        }
      } catch(err) {
        alert("❌ Network fail broadcasting SOS. Please CALL emergency services immediately at 112 or 100.");
      } finally {
        setSosLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          locationStr = `Latitude: ${latitude}, Longitude: ${longitude}`;
          sendAlert(locationStr, latitude, longitude);
        },
        (error) => {
          locationStr = `GPS permission denied / unavailable (Fallback to Profile City: ${profile.city})`;
          sendAlert(locationStr);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 0 
        }
      );
    } else {
      locationStr = `Geolocation not supported by browser (Fallback to Profile City: ${profile.city})`;
      sendAlert(locationStr);
    }
  };

  const handleMarkNotificationsRead = () => {
    // Handled inline — no alert needed
  };

  useEffect(() => {
    syncStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkerId]);

  useEffect(() => {
    const interval = setInterval(syncStore, 5000); // Accelerated update telemetry cadence to 5s for extreme emergency responsiveness
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkerId]);

  // ── GRANULAR REVENUE ACCOUNTING SUBSYSTEM ──
  
  // 1. Fully Paid Out & Available in physical account (Admin cleared)
  const releasedEarnings = bookings
    .filter(b => b.status === "Paid Out")
    .reduce((sum, b) => sum + (parseFloat(b.price) || parseFloat(b.amount) || 0), 0);

  // 2. Job complete, but funds are physically held in platform Escrow awaiting Admin disbursement
  const pendingEscrow = bookings
    .filter(b => b.status === "Completed")
    .reduce((sum, b) => sum + (parseFloat(b.price) || parseFloat(b.amount) || 0), 0);

  // 3. Ongoing, accepted, or queued jobs representing future pipeline value
  const upcomingProjected = bookings
    .filter(b => ["Pending", "Accepted", "On the Way", "Started"].includes(b.status))
    .reduce((sum, b) => sum + (parseFloat(b.price) || parseFloat(b.amount) || 0), 0);


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
      bookingDate: b.date,
      bookingTime: b.time,
      time: "Real-time",
      read: false
    }))
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const activeValidBookings = bookings.filter(b => !["Rejected", "Cancelled"].includes(b.status));
  const complaintsRatingDeduction = complaints.filter(c => c.adminVerdict === "Valid").reduce((sum, c) => sum + (c.ratingDeducted || 0.2), 0);
  const finalRating = Math.max(1, (profile.rating - complaintsRatingDeduction)).toFixed(1);

  const pendingBookingsCount = bookings.filter(b => b.status === "Pending").length;
  const sidebarTabs = [
    { id: "status",        label: "My Status",          icon: "🟢" },
    { id: "bookings",      label: "My Bookings",         icon: "📋", badge: pendingBookingsCount },
    { id: "reviews",       label: "Reviews & Feedback",  icon: "⭐" },
    { id: "notifications", label: `Alerts`,              icon: "🔔", badge: unreadCount },
    { id: "earnings",      label: "My Earnings",         icon: "💰" },
    { id: "profile",       label: "My Profile",          icon: "👤" },
    { id: "security-logs", label: "Security Logs",       icon: "🛡️" },
    { id: "sos",           label: "SOS Emergency",        icon: "🚨" },
  ];

  const statusStyle = (s) => ({
    padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
    backgroundColor: s === "Completed" ? "var(--primary-light)" : s === "Upcoming" ? "#fff3e0" : s === "Accepted" ? "var(--primary-light)" : "#fee2e2",
    color: s === "Completed" ? "var(--primary-dark)" : s === "Upcoming" ? "#e65100" : s === "Accepted" ? "#16a34a" : "#ef4444"
  });

  const handleSaveProfile = async () => {
    if (!editProfile.name.trim() || !editProfile.profession.trim() || !editProfile.city.trim()) {
      alert("Name, Profession, and City are required!");
      return;
    }
    try {
      const token = sessionStorage.getItem("authToken");
      const userId = sessionStorage.getItem("userId");
      if (token && profile.mongoId) {
        // 1. Update Worker profile in DB
        const workerResp = await fetch(`/api/workers/${profile.mongoId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: editProfile.name,
            service: editProfile.profession,
            city: editProfile.city
          })
        });

        // 2. Update User profile in DB
        let userOk = true;
        if (userId) {
          const userResp = await fetch(`/api/users/${userId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              name: editProfile.name,
              city: editProfile.city,
              phone: editProfile.phone
            })
          });
          userOk = userResp.ok;
        }

        if (workerResp.ok && userOk) {
          setProfile({ ...editProfile });
          setEditMode(false);
          alert("Profile updated successfully!");

          // Update storage sessions
          sessionStorage.setItem("userName", editProfile.name);
          sessionStorage.setItem("userCity", editProfile.city);
          const authSession = JSON.parse(localStorage.getItem("authSession") || "{}");
          authSession.userName = editProfile.name;
          authSession.userCity = editProfile.city;
          localStorage.setItem("authSession", JSON.stringify(authSession));

          // Dispatch event to refresh Navbar instantly
          window.dispatchEvent(new Event("storage"));
          
          syncStore(); // Refresh
        } else {
          alert("Failed to update profile details on the server.");
        }
      } else {
        setProfile({ ...editProfile });
        setEditMode(false);
        alert("Profile updated locally!");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating profile.");
    }
  };

  return (
    <div className="dashboard-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div className="dashboard-body">

        {/* ── LEFT SIDEBAR ── */}
        {(!isMobile || activeTab === "menu") && (
          <div className="dashboard-sidebar">
          
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

          {sidebarTabs.map(tab => {
            const isSosTab = tab.id === "sos";
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", width: "100%",
                  borderRadius: 8, border: isSosTab ? "1.5px solid #ef4444" : "none", textAlign: "left", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  backgroundColor: activeTab === tab.id 
                    ? (isSosTab ? "#b91c1c" : "var(--primary)") 
                    : (isSosTab ? "#fff5f5" : "transparent"),
                  color: activeTab === tab.id 
                    ? "white" 
                    : (isSosTab ? "#ef4444" : "var(--text-secondary)"),
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isSosTab && activeTab !== tab.id ? "0 2px 4px rgba(239,68,68,0.1)" : "none"
                }}
                onMouseEnter={e => { 
                  if (activeTab !== tab.id) { 
                    e.currentTarget.style.backgroundColor = isSosTab ? "#fee2e2" : "var(--primary-glow)"; 
                    e.currentTarget.style.color = isSosTab ? "#ef4444" : "var(--primary)"; 
                    e.currentTarget.style.transform = "translateX(5px)"; 
                  } 
                }}
                onMouseLeave={e => { 
                  if (activeTab !== tab.id) { 
                    e.currentTarget.style.backgroundColor = isSosTab ? "#fff5f5" : "transparent"; 
                    e.currentTarget.style.color = isSosTab ? "#ef4444" : "var(--text-secondary)"; 
                    e.currentTarget.style.transform = "translateX(0)"; 
                  } 
                }}
              >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label}
                {tab.badge > 0 && (
                  <span className="tab-count-badge">{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
        )}

        {/* ── MAIN CONTENT ── */}
        {(!isMobile || activeTab !== "menu") && (
          <div className="dashboard-content">
            {isMobile && (
              <button 
                onClick={() => setActiveTab("menu")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  color: "var(--primary)",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  marginBottom: "20px",
                  borderBottom: "4px solid var(--primary-dark)"
                }}
              >
                ← Back to Dashboard Menu
              </button>
            )}

          {/* ONLINE STATUS BANNER — shown on all tabs so worker always knows their visibility */}
          <div className={`worker-status-banner ${isActive ? "worker-status-online" : "worker-status-offline"}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className={`status-dot ${isActive ? "status-dot-online" : "status-dot-offline"}`} />
              <span>{isActive ? "🟢 You are ONLINE — Customers can find and book you" : "🔴 You are OFFLINE — You are hidden from customer searches"}</span>
            </div>
            <button
              onClick={async () => {
                const newStatus = !isActive ? "Active" : "Inactive";
                if (profile.mongoId) {
                  try {
                    await fetch(`/api/workers/${profile.mongoId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionStorage.getItem("authToken")}` },
                      body: JSON.stringify({ status: newStatus })
                    });
                    setIsActive(!isActive);
                  } catch (e) { console.error("Status toggle failed"); }
                } else { setIsActive(!isActive); }
              }}
              style={{
                padding: "7px 16px", borderRadius: "8px", border: "none", fontWeight: 700,
                fontSize: "12px", cursor: "pointer",
                background: isActive ? "rgba(220,38,38,0.1)" : "rgba(16,185,129,0.1)",
                color: isActive ? "#dc2626" : "#059669"
              }}
            >
              {isActive ? "Go Offline" : "Go Online"}
            </button>
          </div>

          {/* STATUS TAB */}
          {activeTab === "status" && (
            <div className="fade-in">
              <div className="section-header">
                <h2>🟢 My Availability Status</h2>
                <p>Control whether customers can see and book your services</p>
              </div>
              <div className="premium-card" style={{ maxWidth: 480 }}>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{ fontSize: 72, textShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>{isActive ? "🟢" : "🔴"}</div>
                  <h2 style={{ margin: "12px 0 6px", color: "var(--text-primary)" }}>{isActive ? "You are ONLINE" : "You are OFFLINE"}</h2>
                  <p style={{ color: "var(--text-secondary)", margin: "0 0 6px 0", fontSize: "14px" }}>
                    {isActive ? "Customers can see and book your services right now." : "You are currently hidden from customer search results."}
                  </p>
                  {isActive && <p style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>✅ Showing up in Home, Search & Nearby Results</p>}
                </div>
                <button 
                  onClick={async () => {
                    const newStatus = !isActive ? "Active" : "Inactive";
                    if (profile.mongoId) {
                      try {
                        await fetch(`/api/workers/${profile.mongoId}`, {
                          method: "PATCH",
                          headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`
                          },
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
                {loading ? (
                  <SkeletonLoader type="list" count={3} />
                ) : bookings.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px" }}>No jobs booked under your profile yet.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: "800px", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1.5px solid var(--border-color)", color: "var(--text-secondary)" }}>
                          <th style={{ padding: "12px 8px" }}>Customer</th>
                          <th style={{ padding: "12px 8px" }}>Service</th>
                          <th style={{ padding: "12px 8px" }}>Timings</th>
                          <th style={{ padding: "12px 8px" }}>Address</th>
                          <th style={{ padding: "12px 8px" }}>Payment</th>
                          <th style={{ padding: "12px 8px" }}>Status</th>
                          <th style={{ padding: "12px 8px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b._id} style={{ borderBottom: "1px solid var(--border-color)", fontSize: 14 }}>
                            <td style={{ padding: "14px 8px", fontWeight: 700 }}>{b.customer_name || "Verified Customer"}</td>
                            <td style={{ padding: "14px 8px" }}>{b.service}</td>
                            <td style={{ padding: "14px 8px" }}>📅 {b.date}<br />🕐 {b.time}</td>
                            <td style={{ padding: "14px 8px" }}>{b.address}</td>
                            <td style={{ padding: "14px 8px", fontWeight: 700, color: "var(--primary)" }}>₹{b.price}</td>
                            <td style={{ padding: "14px 8px" }}>
                              <span style={statusStyle(b.status)}>{b.status}</span>
                            </td>
                            <td style={{ padding: "14px 8px" }}>
                              {["Accepted", "On the Way", "Started"].includes(b.status) && (
                                <button 
                                  onClick={() => {
                                    setSosCategory(`Ongoing Emergency during Job with ${b.customer_name || 'Customer'}`);
                                    setActiveTab("sos");
                                  }}
                                  style={{ 
                                    padding: "6px 14px", 
                                    backgroundColor: "var(--danger)", 
                                    color: "white", 
                                    border: "none", 
                                    borderRadius: "8px", 
                                    fontSize: "12px", 
                                    fontWeight: 800, 
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    boxShadow: "0 2px 8px rgba(239,68,68,0.2)"
                                  }}
                                >
                                  🚨 SOS
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                  <button onClick={handleMarkNotificationsRead} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }}>Mark all as read</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "64px 0" }}>
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
                        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16, marginTop: 12 }}>
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
                                <button onClick={() => setActiveRejectBooking({ id: n.bookingId })}
                                  style={{ padding: "10px 20px", backgroundColor: "#f43f5e", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                  Reject Request ❌
                                </button>
                              </>
                            )}

                            {n.bookingStatus === "Accepted" && (
                              (() => {
                                const now = new Date();
                                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                const isFuture = n.bookingDate && n.bookingDate > todayStr && !(n.bookingTime && n.bookingTime.includes("Instant"));
                                return isFuture ? (
                                  <span style={{ fontSize: 13, backgroundColor: "var(--bg-card-hover)", color: "var(--text-secondary)", padding: "10px 16px", borderRadius: 8, fontWeight: 800, border: "1.5px dashed #cbd5e1", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                    ⏳ Dispatch Locked: Arriving on {n.bookingDate} ({n.bookingTime})
                                  </span>
                                ) : (
                                  <button onClick={() => handleStatusChange(n.bookingId, "On the Way")}
                                    style={{ padding: "10px 20px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                    Mark as 'On the Way' 🛵
                                  </button>
                                );
                              })()
                            )}

                            {n.bookingStatus === "On the Way" && (
                              <button onClick={() => handleStatusChange(n.bookingId, "Started")}
                                style={{ padding: "10px 20px", backgroundColor: "var(--warning)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                Mark as 'Started Job' 🛠️
                              </button>
                            )}

                            {n.bookingStatus === "Started" && (
                              <button onClick={() => handleStatusChange(n.bookingId, "Completed")}
                                style={{ padding: "10px 20px", backgroundColor: "var(--success)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                Mark as 'Completed' ✨
                              </button>
                            )}

                            {n.bookingStatus === "Rejected" && (
                              <span style={{ fontSize: 13, backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "8px 14px", borderRadius: 8, fontWeight: 700 }}>
                                ✗ Rejected & Cancelled
                              </span>
                            )}

                            {n.bookingStatus === "Cancelled" && (
                              <span style={{ fontSize: 13, backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "8px 14px", borderRadius: 8, fontWeight: 700 }}>
                                ✗ Cancelled
                              </span>
                            )}

                            {["Accepted", "On the Way", "Started"].includes(n.bookingStatus) && (
                              <button onClick={() => {
                                const matchedBooking = bookings.find(b => b._id === n.bookingId);
                                if (matchedBooking) {
                                  setActiveChatBooking(matchedBooking);
                                  setChatMessages([]);
                                } else {
                                  setActiveChatBooking({
                                    _id: n.bookingId,
                                    workerName: profile.name,
                                    worker_name: profile.name,
                                    customer_name: n.title.split(":").slice(1).join(":").trim() || "Customer"
                                  });
                                  setChatMessages([]);
                                }
                              }}
                              style={{ 
                                padding: "10px 20px", 
                                backgroundColor: "#e0f2fe", 
                                color: "#0284c7", 
                                border: "1px solid #bae6fd", 
                                borderRadius: 8, 
                                fontWeight: 700, 
                                cursor: "pointer", 
                                display: "inline-flex", 
                                gap: 6, 
                                alignItems: "center" 
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#bae6fd"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#e0f2fe"}
                              >
                                💬 Chat with Customer
                              </button>
                            )}

                            <button onClick={() => setOpenMapId(openMapId === n.id ? null : n.id)}
                              style={{ padding: "10px 20px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
                              {openMapId === n.id ? "Hide Map Route 🗺️" : "Show Route to Customer 🗺️"}
                            </button>

                            {["Accepted", "On the Way", "Started"].includes(n.bookingStatus) && (
                              <button onClick={() => { 
                                setSosCategory(`Dangerous incident during Job #${n.bookingId} with customer`);
                                setActiveTab("sos"); 
                              }}
                                style={{ 
                                  padding: "10px 24px", 
                                  backgroundColor: "var(--danger)", 
                                  color: "white", 
                                  border: "none", 
                                  borderRadius: 8, 
                                  fontWeight: 850, 
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  boxShadow: "0 6px 15px rgba(239,68,68,0.3)"
                                }}>
                                🚨 EMERGENCY SOS
                              </button>
                            )}
                          </div>

                          {openMapId === n.id && (
                            <div style={{ marginTop: 12, border: "1px solid var(--border-color)", borderRadius: 10, overflow: "hidden" }}>
                              <div style={{ backgroundColor: "var(--text-main)", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                <span>📍 From: <strong>{n.workerAddr}</strong></span>
                                <span>🏠 To: <strong>{n.customerAddr}</strong></span>
                              </div>
                              <RouteMap startAddress={n.workerAddr} endAddress={n.customerAddr} />
                              <div style={{ padding: "10px 16px", backgroundColor: "var(--bg-card-hover)", fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 16 }}>
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
              <h2 style={{ margin: "0 0 24px", fontWeight: 800, color: "var(--text-primary)" }}>My Earnings Ledger</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, marginBottom: 36 }}>
                <div className="premium-card" style={{ borderTop: "6px solid #16a34a", textAlign: "center", padding: "28px 20px", boxShadow: "0 10px 20px rgba(22,163,74,0.05)" }}>
                  <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.8px" }}>✓ Released Balance</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "var(--success)", marginTop: 10 }}>₹{releasedEarnings}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, fontWeight: 600 }}>Funds disemburdened to account</div>
                </div>
                <div className="premium-card" style={{ borderTop: "6px solid #ea580c", textAlign: "center", padding: "28px 20px", boxShadow: "0 10px 20px rgba(234,88,12,0.05)" }}>
                  <div style={{ fontSize: 11, color: "#ea580c", fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.8px" }}>🔒 Held In Escrow</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#ea580c", marginTop: 10 }}>₹{pendingEscrow}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, fontWeight: 600 }}>Awaiting admin disbursement</div>
                </div>
                <div className="premium-card" style={{ borderTop: "6px solid var(--primary)", textAlign: "center", padding: "28px 20px", boxShadow: "0 10px 20px rgba(66,86,100,0.05)" }}>
                  <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.8px" }}>⏳ Projected Intake</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "var(--primary)", marginTop: 10 }}>₹{upcomingProjected}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, fontWeight: 600 }}>Active outstanding workflows</div>
                </div>
                <div className="premium-card" style={{ borderTop: "6px solid var(--text-secondary)", textAlign: "center", padding: "28px 20px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.8px" }}>📊 Total Services</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "var(--text-main)", marginTop: 10 }}>{activeValidBookings.length}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, fontWeight: 600 }}>Aggregate service count</div>
                </div>
              </div>

              <div className="premium-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1.5px solid var(--border-color)", paddingBottom: 14 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, color: "var(--text-primary)" }}>Transactional Payments Matrix</h3>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700 }}>Automatic physical ledger sync</span>
                </div>
                {activeValidBookings.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 32 }}>No valid payment projections or records discovered.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {activeValidBookings.map(b => (
                      <div key={b._id || b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px solid var(--border-color)" }}>
                        <div>
                          <div style={{ fontWeight: 750, color: "var(--text-main)", fontSize: 15 }}>{b.service}</div>
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>👤 Client: <strong style={{ color: "var(--text-main)" }}>{b.customer_name || b.customer}</strong> · 📅 {b.date}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          <div style={{ fontWeight: 900, fontSize: 20, color: b.status === "Paid Out" ? "var(--success)" : b.status === "Completed" ? "var(--warning)" : "var(--text-secondary)" }}>
                            ₹{b.price}
                          </div>
                          <span style={{ 
                            fontSize: 10, 
                            padding: "4px 10px", 
                            borderRadius: 20, 
                            fontWeight: 850, 
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            backgroundColor: b.status === "Paid Out" ? "var(--success-light)" : b.status === "Completed" ? "var(--warning-light)" : "var(--primary-light)",
                            color: b.status === "Paid Out" ? "var(--success)" : b.status === "Completed" ? "var(--warning)" : "var(--text-secondary)"
                          }}>
                            {b.status === "Paid Out" ? "✓ Paid Out" : b.status === "Completed" ? "🔒 Locked Escrow" : "⌛ Pipeline"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="fade-in">
              <h2 style={{ margin: "0 0 24px", fontWeight: 800, color: "var(--text-primary)" }}>My Profile</h2>
              <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

                {/* Profile Card */}
                <div className="premium-card">
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 64, textShadow: "0 10px 20px rgba(0,0,0,0.15)" }}>{profile.photo || "👷"}</div>
                    <h3 style={{ margin: "12px 0 4px", color: "var(--text-primary)" }}>{profile.name}</h3>
                    <div style={{ color: "var(--primary)", fontWeight: 700 }}>{profile.profession}</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ color: "var(--warning)", fontSize: 18 }}>{"⭐".repeat(Math.round(parseFloat(finalRating)))}</span>
                      <span style={{ fontWeight: 800, marginLeft: 6 }}>{finalRating}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: 13 }}> ({profile.totalReviews} reviews)</span>
                    </div>
                  </div>
                  {[
                    ["📍 City", profile.city],
                    ["📞 Phone", profile.phone],
                    ["📧 Email", profile.email],
                    ["📅 Joined", profile.joinedDate],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-color)", fontSize: 14 }}>
                      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{val}</span>
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
                        <button onClick={handleSaveProfile} style={{ flex: 1, padding: "10px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save</button>
                        <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: "10px", backgroundColor: "#e2e8f0", color: "var(--text-secondary)", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Complaints Section */}
                <div className="premium-card">
                  <h3 style={{ margin: "0 0 16px", fontWeight: 800, color: "var(--text-primary)" }}>Customer Complaints</h3>
                  {complaints.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: 32 }}>
                      <div style={{ fontSize: 40 }}>✅</div>
                      <p>No complaints on your profile!</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {complaints.map(c => (
                        <div key={c.id} style={{ border: "1px solid #fee2e2", borderRadius: 10, padding: 16, backgroundColor: "#fff5f5" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <strong style={{ color: "var(--danger)" }}>Complaint #{c.id}</strong>
                            <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: 20, backgroundColor: c.adminVerdict === "Valid" ? "#ffebee" : c.adminVerdict === "Pending" ? "#fff3e0" : "var(--primary-light)", color: c.adminVerdict === "Valid" ? "#c62828" : c.adminVerdict === "Pending" ? "#e65100" : "var(--primary-dark)", fontWeight: 700 }}>
                              Admin: {c.adminVerdict}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>👤 {c.customer} · {c.date}</div>
                          <div style={{ fontSize: 14, color: "var(--text-main)", marginBottom: 8 }}>"{c.desc}"</div>
                          {c.adminVerdict === "Valid" && (
                            <div style={{ backgroundColor: "var(--danger-light)", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>
                              ⬇️ Rating deducted by -{c.ratingDeducted || 0.2} due to this verified complaint.
                            </div>
                          )}
                          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-secondary)" }}>Status: {c.status}</div>
                        </div>
                      ))}
                      {complaintsRatingDeduction > 0 && (
                        <div style={{ backgroundColor: "var(--warning-light)", borderRadius: 8, padding: 14, fontSize: 13, color: "var(--warning)", marginTop: 8 }}>
                          ⚠️ Your effective rating: <strong>{finalRating} ⭐</strong> (deducted {complaintsRatingDeduction} for verified complaints)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* REVIEWS & FEEDBACK TAB */}
          {activeTab === "reviews" && (
            <div className="fade-in" style={{ maxWidth: 800, margin: "0 auto" }}>
              <h2 style={{ margin: "0 0 24px", fontWeight: 800, color: "var(--text-primary)" }}>⭐ Customer Reviews & Feedback</h2>
              
              <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 28 }}>
                {/* Stats Panel */}
                <div className="premium-card" style={{ padding: 24, textAlign: "center" }}>
                  <h3 style={{ margin: "0 0 8px", color: "var(--text-secondary)", fontSize: 14 }}>AVERAGE RATING</h3>
                  <div style={{ fontSize: 48, fontWeight: 900, color: "var(--warning)", margin: "12px 0" }}>
                    ⭐ {finalRating}
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
                    Based on {workerReviews.length} customer ratings
                  </p>
                </div>

                {/* Sentiment & Quick Stats */}
                <div className="premium-card" style={{ padding: 24 }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>Performance Badges</h3>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {parseFloat(finalRating) >= 4.5 && (
                      <span style={{ backgroundColor: "#ecfdf5", color: "#047857", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid #a7f3d0" }}>
                        🏆 Top Performer
                      </span>
                    )}
                    {workerReviews.filter(r => r.rating === 5).length > 0 && (
                      <span style={{ backgroundColor: "var(--warning-light)", color: "var(--warning)", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid #fde68a" }}>
                        ✨ 5-Star Expert ({workerReviews.filter(r => r.rating === 5).length})
                      </span>
                    )}
                    {workerReviews.some(r => r.comment && r.comment.toLowerCase().includes("punctual")) && (
                      <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid #bfdbfe" }}>
                        ⏱️ Highly Punctual
                      </span>
                    )}
                    {workerReviews.some(r => r.comment && r.comment.toLowerCase().includes("clean")) && (
                      <span style={{ backgroundColor: "#f5f3ff", color: "#6d28d9", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid #ddd6fe" }}>
                        🧹 Extremely Neat
                      </span>
                    )}
                    <span style={{ backgroundColor: "var(--bg-card-hover)", color: "var(--text-secondary)", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid #cbd5e1" }}>
                      💬 {workerReviews.filter(r => r.reply).length} Replies Sent
                    </span>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {loading ? (
                  <SkeletonLoader type="list" count={2} />
                ) : workerReviews.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: 48 }}>📝</div>
                    <h3 style={{ margin: "12px 0 4px" }}>No reviews yet</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>Once customers complete bookings and rate your work, they will show up here.</p>
                  </div>
                ) : (
                  workerReviews.map((r) => {
                    const rid = r._id || r.id;
                    const stars = "★".repeat(r.rating || 5) + "☆".repeat(5 - (r.rating || 5));
                    
                    // Simple Sentiment Tag Generator based on rating
                    let sentimentTag = "Punctual";
                    let tagBg = "#eff6ff", tagColor = "#1d4ed8", tagBorder = "#bfdbfe";
                    if (r.rating === 5) {
                      sentimentTag = "Exemplary Professional";
                      tagBg = "#ecfdf5"; tagColor = "#047857"; tagBorder = "#a7f3d0";
                    } else if (r.rating <= 3) {
                      sentimentTag = "Critical Review";
                      tagBg = "#fff5f5"; tagColor = "#e53e3e"; tagBorder = "#fed7d7";
                    } else if (r.comment && r.comment.toLowerCase().includes("quick")) {
                      sentimentTag = "Super Fast Service";
                      tagBg = "#f5f3ff"; tagColor = "#6d28d9"; tagBorder = "#ddd6fe";
                    }

                    return (
                      <div key={rid} className="premium-card" style={{ padding: 24, borderLeft: r.rating >= 4 ? "5px solid #10b981" : "5px solid #ef4444" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                              👤 {r.customer_name || "Verified Customer"}
                            </h4>
                            <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                              💼 {r.service} · 📅 {r.date}
                            </p>
                          </div>
                          
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <span style={{ color: "var(--warning)", fontSize: 18, fontWeight: "bold" }}>{stars}</span>
                            <span style={{ backgroundColor: tagBg, color: tagColor, border: `1px solid ${tagBorder}`, padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>
                              {sentimentTag}
                            </span>
                          </div>
                        </div>

                        {r.comment && (
                          <p style={{ margin: "0 0 16px 0", fontSize: 14, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5, padding: "10px 14px", backgroundColor: "var(--bg-card-hover)", borderRadius: 8 }}>
                            "{r.comment}"
                          </p>
                        )}

                        {/* Threaded Reply Segment */}
                        <div style={{ borderTop: "1.5px dashed var(--border-color)", paddingTop: 16, marginTop: 14 }}>
                          {r.reply ? (
                            <div style={{ backgroundColor: "rgba(198, 173, 143, 0.15)", border: "1px solid var(--accent)", borderRadius: 12, padding: "12px 16px", marginLeft: 20 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--primary)" }}>💬 Your Professional Response</span>
                                <span style={{ fontSize: 11, color: "var(--secondary)" }}>📅 {r.replyDate}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: 13, color: "var(--text-main)", lineHeight: 1.5 }}>
                                {r.reply}
                              </p>
                            </div>
                          ) : (
                            <div style={{ marginLeft: 20 }}>
                              <textarea
                                placeholder="Type a polite response to this review..."
                                value={replyTexts[rid] || ""}
                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [rid]: e.target.value }))}
                                rows={2}
                                style={{
                                  width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--border-color)",
                                  fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", marginBottom: 8
                                }}
                              />
                              <button
                                onClick={async () => {
                                  const text = replyTexts[rid];
                                  if (!text || !text.trim()) {
                                    alert("Please type a response first!");
                                    return;
                                  }
                                  try {
                                    const resp = await fetch(`/api/reviews/${rid}/reply`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ reply: text })
                                    });
                                    if (resp.ok) {
                                      const updatedReview = await resp.json();
                                      // Sync in-memory reviews state instantly
                                      setWorkerReviews(prev => prev.map(item => item._id === rid || item.id === rid ? updatedReview : item));
                                      setReplyTexts(prev => ({ ...prev, [rid]: "" }));
                                      alert("Response posted successfully!");
                                    } else {
                                      alert("Failed to submit response.");
                                    }
                                  } catch (e) { console.error("Reply fail:", e); }
                                }}
                                style={{
                                  padding: "6px 14px", backgroundColor: "var(--primary)", color: "white",
                                  border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer"
                                }}
                              >
                                Post Response
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SECURITY LOGS TAB */}
          {activeTab === "security-logs" && (
            <div className="fade-in" style={{ maxWidth: 800, margin: "0 auto" }}>
              <h2 style={{ margin: "0 0 24px", fontWeight: 800, color: "var(--text-primary)" }}>My Security Dashboard</h2>
              <SecurityLogs userId={sessionStorage.getItem("userId")} />
            </div>
          )}

          {/* SOS EMERGENCY TAB */}
          {activeTab === "sos" && (
            <div className="fade-in" style={{ maxWidth: 800, margin: "0 auto" }}>
              <style>{`
                @keyframes pulse-sos {
                  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.8); transform: scale(1); }
                  70% { box-shadow: 0 0 0 25px rgba(239, 68, 68, 0); transform: scale(1.06); }
                  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); transform: scale(1); }
                }
                @keyframes siren-flash {
                  0% { background-color: rgba(239, 68, 68, 0.08); }
                  50% { background-color: rgba(239, 68, 68, 0.25); }
                  100% { background-color: rgba(239, 68, 68, 0.08); }
                }
              `}</style>

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                <span style={{ fontSize: 36 }}>🚨</span>
                <h2 style={{ margin: 0, fontWeight: 850, color: "var(--danger)", fontSize: 28 }}>Emergency & Worker Safety Center</h2>
              </div>

              {(!sosActive && !(isActive && bookings.some(b => ["Accepted", "On the Way", "Started"].includes(b.status)))) ? (
                <div className="premium-card" style={{ 
                  borderTop: "8px solid var(--text-secondary)", 
                  padding: "60px 40px", 
                  textAlign: "center", 
                  backgroundColor: "var(--bg-card)",
                  border: "2px dashed var(--border-color)",
                  boxShadow: "none"
                }}>
                  <div style={{ fontSize: 72, marginBottom: 20 }}>🔒</div>
                  <h3 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 900, color: "var(--text-primary)" }}>SOS EMERGENCY CONSOLE LOCKED</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 560, margin: "0 auto 24px", lineHeight: 1.6, fontWeight: 600 }}>
                    To ensure resource protection and prevent accidental mobilize alerts, the dispatcher emergency console remains dormant during offline periods.
                  </p>
                  <div style={{ 
                    display: "inline-block", 
                    padding: "12px 24px", 
                    backgroundColor: "var(--danger-light)", 
                    color: "var(--danger)", 
                    borderRadius: "10px", 
                    fontSize: "14px", 
                    fontWeight: 800 
                  }}>
                    🚨 REQUIRED: You must have 'Active' Status & an Ongoing Assigned Booking to broadcast.
                  </div>
                </div>
              ) : sosActive ? (
                <div style={{
                  animation: "siren-flash 1.5s infinite",
                  border: "4px solid #ef4444",
                  borderRadius: 20,
                  padding: 48,
                  textAlign: "center",
                  boxShadow: "0 15px 40px rgba(239, 68, 68, 0.25)",
                  backgroundColor: "var(--bg-card)",
                  marginBottom: 32
                }}>
                  <div style={{ fontSize: 88, animation: "pulse 1s infinite" }}>🚨</div>
                  <h1 style={{ color: "var(--danger)", fontSize: 32, fontWeight: 900, marginTop: 16, textTransform: "uppercase", letterSpacing: "1.5px" }}>SOS ACTIVATED</h1>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", maxWidth: 600, margin: "16px auto", lineHeight: 1.6 }}>
                    Distress alert sent! Workzy platform administrators have been notified with your current coordinates. Emergency systems activated.
                  </p>

                  {adminResolvedAlert && (
                    <div className="fade-in" style={{ 
                      backgroundColor: "#fff7ed", 
                      border: "3px solid #ea580c", 
                      borderRadius: 16, 
                      padding: "24px", 
                      margin: "24px auto", 
                      maxWidth: 640, 
                      textAlign: "center",
                      boxShadow: "0 10px 25px rgba(234, 88, 12, 0.15)",
                      animation: "pulse-sos 2.5s infinite"
                    }}>
                      <h3 style={{ color: "#ea580c", margin: "0 0 10px", fontWeight: 900, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span>⚠️</span> ADMIN LOGGED INCIDENT AS RESOLVED
                      </h3>
                      <p style={{ color: "#7c2d12", fontSize: 15, margin: "0 0 20px", fontWeight: 700, lineHeight: 1.5 }}>
                        Platform dispatchers have flagged this investigation complete. Are you fully secure at this moment?
                      </p>
                      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                        <button 
                          onClick={() => {
                            setSosActive(false);
                            setActiveSosNotificationId(null);
                            setAdminResolvedAlert(false);
                            alert("🟢 Physical safety verified. Distress siren permanently stood down.");
                          }}
                          style={{ backgroundColor: "var(--success)", color: "white", border: "none", padding: "14px 24px", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", flex: 1, boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}
                        >
                          ✅ Yes, I Am Safe Now
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await fetch(`/api/notifications/${activeSosNotificationId}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  is_read: false,
                                  title: `🔥 CRITICAL RE-ALERT: ${profile.name} STILL UNRESOLVED!`,
                                  message: `🚨 EMERGENCY RE-ESCALATED BY FIELD AGENT!\n\n` +
                                           `Worker explicitly REJECTED the administration resolution status.\n` +
                                           `Worker asserts they are STILL IN PHYSICAL INCONVENIENCE / DANGER at ${new Date().toLocaleString()}.\n` +
                                           `Send emergency responders immediately.`
                                })
                              });
                              setAdminResolvedAlert(false);
                              alert("🔥 RE-ALERT DISPATCHED! Admin telemetry updated to MAXIMUM urgency. Stand by for immediate physical contact.");
                            } catch(e) { alert("Failed to dispatch escalation signal."); }
                          }}
                          style={{ backgroundColor: "var(--danger)", color: "white", border: "none", padding: "14px 24px", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", flex: 1, boxShadow: "0 4px 12px rgba(220,38,38,0.3)" }}
                        >
                          🚨 NO, RE-ALERT ADMIN!
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "center", gap: 20, margin: "36px 0" }}>
                    <a href="tel:112" style={{ textDecoration: "none", flex: 1, maxWidth: 260 }}>
                      <div style={{ backgroundColor: "var(--danger)", color: "white", padding: "18px", borderRadius: 14, fontWeight: 800, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 10px 20px rgba(239,68,68,0.3)" }}>
                        📞 Call 112
                      </div>
                    </a>
                    <a href="tel:100" style={{ textDecoration: "none", flex: 1, maxWidth: 260 }}>
                      <div style={{ backgroundColor: "var(--text-main)", color: "white", padding: "18px", borderRadius: 14, fontWeight: 800, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 10px 20px rgba(30,41,59,0.3)" }}>
                        🚓 Police (100)
                      </div>
                    </a>
                  </div>

                  <button 
                    onClick={async () => {
                      if(window.confirm("Are you absolutely sure you want to stand down the SOS? Clear this only if your physical safety is assured.")) {
                        try {
                          if (activeSosNotificationId) {
                            await fetch(`/api/notifications/${activeSosNotificationId}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ 
                                is_read: true,
                                title: `🟢 STAND-DOWN: ${profile.name} is Safe`,
                                message: `✅ DISTRESS EVENT MANUALLY DISARMED.\n\nWorker confirmed all-clear at ${new Date().toLocaleString()}. Safety restoration successful.`
                              })
                            });
                          }
                        } catch(e) { console.error("Failed to stand down server-side", e); }
                        
                        setSosActive(false);
                        setActiveSosNotificationId(null);
                        alert("SOS disarmed. Platform administrators informed that you are safe!");
                      }
                    }} 
                    style={{ border: "2px solid #cbd5e1", backgroundColor: "transparent", color: "var(--text-secondary)", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                  >
                    Cancel & Clear Warning
                  </button>
                </div>
              ) : (
                <div className="premium-card" style={{ borderTop: "8px solid #ef4444", padding: 40, marginBottom: 32 }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Instant Emergency Broadcast</h3>
                  <p style={{ margin: "0 0 30px", color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                    Felt unsafe, had an accident, or threatened? Activate the SOS immediately. We capture your exact telemetry coordinates and broadcast an instantaneous visual alert to platform security.
                  </p>

                  <div style={{ marginBottom: 32 }}>
                    <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Select Safety Classification:</label>
                    <select 
                      value={sosCategory} 
                      onChange={(e) => setSosCategory(e.target.value)} 
                      style={{ width: "100%", padding: 16, borderRadius: 10, border: "2px solid var(--border-color)", fontWeight: 700, fontSize: 15, backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
                    >
                      <option value="General Safety Emergency">🚨 General Incident Emergency</option>
                      <option value="Unsafe customer behavior / Threat">👤 Dangerous customer environment</option>
                      <option value="Physical Assault / Aggressive Contact">🚫 Verbal or Physical Harassment</option>
                      <option value="Accident / Injury during service">🩹 Serious Injury/Accident on Site</option>
                      <option value="Urgent Medical Trauma">🏥 Immediate Medical Trauma Crisis</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}>
                    <button 
                      onClick={handleTriggerSOS} 
                      disabled={sosLoading}
                      style={{
                        width: 190,
                        height: 190,
                        borderRadius: "50%",
                        backgroundcolor: "var(--danger)",
                        color: "white",
                        border: "none",
                        fontSize: 32,
                        fontWeight: 900,
                        cursor: sosLoading ? "wait" : "pointer",
                        animation: "pulse-sos 2s infinite",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        boxShadow: "0 12px 32px rgba(239,68,68,0.3)",
                        letterSpacing: "1px"
                      }}
                    >
                      {sosLoading ? "⌛" : (
                        <>
                          <span style={{ fontSize: 40 }}>🆘</span>
                          <span>SOS</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-secondary)", fontWeight: 700 }}>TAP TO TRIGGER EMERGENCY BROADCAST</p>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
                <div className="premium-card">
                  <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🚑</span> National Quick-Dial Helplines
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                      ["All-in-One Emergency", "112", "🚔"],
                      ["Police Direct", "100", "🚓"],
                      ["Medical Ambulances", "102", "🚑"],
                      ["Women Safety Helpline", "1091", "👮‍♀️"],
                    ].map(([name, num, icon]) => (
                      <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid var(--border-color)" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{icon} {name}</span>
                        <a href={`tel:${num}`} style={{ fontWeight: 800, color: "var(--danger)", fontSize: 14, textDecoration: "none", backgroundColor: "#fff5f5", padding: "6px 14px", borderRadius: 8, border: "1px solid #fee2e2" }}>
                          {num}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="premium-card">
                  <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🛡️</span> On-Site Defensive Measures
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 8 }}>
                    <li>Maintain constant awareness of entry and exit egress routes.</li>
                    <li>Ensure personal portable devices remain charged and readily operational.</li>
                    <li>Pre-evaluate high-risk geographic environments prior to job commitment.</li>
                    <li>If a situation intensifies, prioritize physical extraction over professional gear.</li>
                    <li>Trigger the digital SOS as early as possible if security risk is perceived.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
        )}
      </div>

      {/* 🚨 FLOATING SOS IN-APP PANIC TRIGGER */}
      <div
        onClick={() => {
          setActiveTab("sos");
          handleTriggerSOS();
        }}
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
          animation: "pulse-sos-btn-worker 1.5s infinite"
        }}
      >
        🆘
      </div>

      <style>{`
        @keyframes pulse-sos-btn-worker {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
      {/* ❌ CUSTOM REJECTION MODAL */}
      {activeRejectBooking && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 9999,
          fontFamily: "'Outfit', sans-serif", backdropFilter: "blur(8px)",
          animation: "fadeIn 0.2s ease-out forwards"
        }}>
          <div style={{
            maxWidth: "400px", width: "90%", backgroundColor: "var(--bg-card)",
            borderRadius: "20px", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(0,0,0,0.05)"
          }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: 800, color: "var(--text-main)" }}>
              Reject Booking Order?
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Are you sure you want to reject this booking? The customer will be immediately refunded. Please select a reason for rejection.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Select Rejection Reason</label>
              <select 
                value={rejectReason} 
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              >
                <option value="Schedule Conflict">📅 Scheduler Conflict</option>
                <option value="Outside Service Area">🗺️ Outside Service Area</option>
                <option value="Emergency">🚨 Personal Emergency</option>
                <option value="Incomplete Details">📋 Incomplete Details</option>
                <option value="Other">Other Reason</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                disabled={submittingReject}
                onClick={handleConfirmReject}
                style={{
                  flex: 1, backgroundcolor: "var(--danger)", color: "white", border: "none",
                  padding: "12px", borderRadius: "10px", fontWeight: "bold",
                  cursor: "pointer", fontSize: "14px"
                }}
              >
                {submittingReject ? "Rejecting..." : "Confirm Reject ❌"}
              </button>
              <button
                disabled={submittingReject}
                onClick={() => setActiveRejectBooking(null)}
                style={{
                  flex: 1, backgroundColor: "#e2e8f0", color: "var(--text-secondary)", border: "none",
                  padding: "12px", borderRadius: "10px", fontWeight: "bold",
                  cursor: "pointer", fontSize: "14px"
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
                  💬 Chatting with {activeChatBooking.customer_name || "Customer"}
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

export default WorkerDashboard;
