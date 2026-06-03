import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useNavigate } from "react-router-dom";
import api from "../utils/apiClient";
import AnimatedSuccess from "../components/AnimatedSuccess";
import AnimatedFailure from "../components/AnimatedFailure";

function BookingPage() {
  const [date, setDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paying, setPaying] = useState(false);
  const [walletBal, setWalletBal] = useState(0);
  const [dispatchAddress, setDispatchAddress] = useState("");
  const customPrice = null;
  const navigate = useNavigate();

  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showFailureOverlay, setShowFailureOverlay] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);

  const [busyBookings, setBusyBookings] = useState([]);

  useEffect(() => {
    // 🔐 SECURITY GATE: Hard Lockdown! Deny access to unauthorized sessions instantly!
    const currentUsr = sessionStorage.getItem("userName") || "Verified Client";
    const userId = sessionStorage.getItem("userId");
    const userRole = sessionStorage.getItem("userRole");
    if (!userId || userRole !== "user") {
       alert("⚠️ Access Denied! Only registered customers (User role) can book service slots.");
       if (userRole === "admin") {
         navigate("/admin-dashboard");
       } else if (userRole === "worker") {
         navigate("/worker-dashboard");
       } else {
         navigate("/login");
       }
       return;
    }

    // 🏦 Dynamic Baseline Initialization: Query live cloud ledger to ascertain true balance flawlessy!
    const initWallet = async () => {
       try {
          const r = await fetch(`/api/transactions?user=${encodeURIComponent(currentUsr)}`);
          if (r.ok) {
             const data = await r.json();
             const userSpecific = data.filter(t => t.customer === currentUsr);
             const calculated = userSpecific.reduce((acc, t) => {
                const isAdd = t.status === "Refunded" || t.status === "Added" || t.method === "Cashback" || t.method === "Reward" || t.method === "Wallet Topup";
                return isAdd ? acc + t.amount : acc - t.amount;
             }, 1000);
             setWalletBal(calculated);
          }
       } catch(e) { setWalletBal(0); }
    };
    initWallet();

    // 🗺️ Address Hydration: Prioritize precise GPS/ReverseGeocoded location!
    const storedLoc = localStorage.getItem("userLocation");
    const storedCity = localStorage.getItem("userCity");
    if (storedLoc) {
       setDispatchAddress(storedLoc);
    } else if (storedCity) {
       setDispatchAddress(`Downtown Area, ${storedCity}`);
    } else {
       setDispatchAddress("Standard Client Address, Rajahmundry");
    }
  }, [navigate]);

  // 🛡️ Authoritative Live Collision Check: Fetch worker's dynamic calendar
  useEffect(() => {
     const loadSchedule = async () => {
        try {
           const id = selectedWorker._id || selectedWorker.mongoId;
           if (!id) return;
           const r = await fetch(`/api/bookings?worker_id=${id}`);
           const data = await r.json();
           if (Array.isArray(data)) setBusyBookings(data);
        } catch(e) { console.error("Collision engine load fail."); }
     };
     loadSchedule();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the currently selected worker dynamically from localStorage
  const selectedWorker = JSON.parse(localStorage.getItem("selected_worker")) || {
    name: "Dr. Priya Sen",
    service: "Doctors & Medical",
    rating: 4.8,
    distance: "1.5 KM",
    city: "Bangalore",
    price: 599
  };

  // Parse distance from selected worker safely
  let distanceVal = 0;
  if (selectedWorker.distanceKm !== undefined) {
    distanceVal = parseFloat(selectedWorker.distanceKm);
  } else if (selectedWorker.distance) {
    distanceVal = parseFloat(selectedWorker.distance);
  }

  let distanceFee = 0;
  let distanceTier = "Standard (<= 5 KM)";
  
  if (distanceVal > 33) {
    distanceFee = 350;
    distanceTier = "Extended Outstation (> 33 KM)";
  } else if (distanceVal > 25) {
    distanceFee = 220;
    distanceTier = "Long Distance (25 - 33 KM)";
  } else if (distanceVal > 13) {
    distanceFee = 120;
    distanceTier = "Mid-Range (13 - 25 KM)";
  } else if (distanceVal > 5) {
    distanceFee = 50;
    distanceTier = "Standard Travel (5 - 13 KM)";
  }

  const basePrice = selectedWorker.price || (selectedWorker.service.includes("Carpentry") ? 399 : selectedWorker.service.includes("Plumbing") ? 299 : selectedWorker.service.includes("Doctors") ? 599 : 349);
  const calculatedPrice = customPrice !== null ? customPrice : (basePrice + distanceFee + (isEmergency ? 150 : 0));

  // 🛡️ CRITICAL SCHEDULING LOCK: Cap booking capabilities strictly to 6 Days Max!
  const maxBookingDate = new Date();
  maxBookingDate.setDate(maxBookingDate.getDate() + 6);

  const timeSlots = [
    { label: "9 AM", hour: 9 },
    { label: "11 AM", hour: 11 },
    { label: "1 PM", hour: 13 },
    { label: "3 PM", hour: 15 }
  ];

  const isToday = (d) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const isSlotPast = (h) => isToday(date) && h <= new Date().getHours();

  // 🕰️ Timezone Fortress: Guarantees robust, zero-drift string conversion immune to UTC rollback bugs!
  const formatSafeYMD = (d) => {
     const y = d.getFullYear();
     const m = String(d.getMonth() + 1).padStart(2, '0');
     const day = String(d.getDate()).padStart(2, '0');
     return `${y}-${m}-${day}`;
  };

  // 🛑 COLLISION GUARD A: Check if the specific slot is physically occupied
  const isSlotAlreadyBooked = (hLabel) => {
     const dStr = formatSafeYMD(date);
     return busyBookings.some(b => b.date === dStr && b.time === hLabel && !["Cancelled", "Rejected", "Completed", "Paid Out"].includes(b.status));
  };

  // 🚨 COLLISION GUARD B: Determine if Instant Booking should be hard-locked due to immediate conflicts
  const isBusyForInstant = () => {
     const todayStr = formatSafeYMD(new Date());
     const currentHour = new Date().getHours();
     
     const activeToday = busyBookings.filter(b => b.date === todayStr && !["Cancelled", "Rejected", "Completed", "Paid Out"].includes(b.status));
     if (activeToday.some(b => b.time && b.time.includes("Instant"))) return true; // Active instant job!

     return activeToday.some(b => {
        const sMatch = timeSlots.find(ts => ts.label === b.time);
        if (!sMatch) return false;
        // Prevent instant booking if an actual pre-booked slot is happening in the next 2 hours!
        return sMatch.hour >= currentHour && sMatch.hour <= currentHour + 2;
     });
  };

  const handleQuickWalletTopup = async () => {
    const input = prompt(
      `⚡ Workzy Secure Wallet Instant Top-Up\n\nYour Current Balance: ₹${walletBal}\nRequired Total: ₹${calculatedPrice}\n\nEnter amount in INR to add to your wallet:`
    );
    if (input === null) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
      alert("❌ Invalid Amount! Please enter a positive number.");
      return;
    }
    
    try {
      const resp = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: sessionStorage.getItem("userName") || "Verified Client",
          worker: "Wallet System",
          service: "Wallet Topup",
          amount: amount,
          status: "Added",
          method: "Wallet Topup"
        })
      });
      
      if (resp.ok) {
        setWalletBal(prev => prev + amount);
        alert(`✅ ₹${amount} successfully added to your secure wallet balance!`);
      } else {
        alert("❌ Wallet top-up failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Network Error: Unable to top up wallet.");
    }
  };

  const handleBooking = () => {
    if (!selectedSlot) { alert("Please select an available time slot or toggle Emergency Booking!"); return; }
    setPaying(true);
  };

  const handlePayNow = async () => {
    if (paymentMethod === "Wallet") {
      if (walletBal < calculatedPrice) {
        setFailureMessage(`Insufficient Wallet Balance! (Current: ₹${walletBal}, Required: ₹${calculatedPrice}). Please top up your wallet or choose another payment method.`);
        setShowFailureOverlay(true);
        return;
      }
      setWalletBal(prev => prev - calculatedPrice);
    }

    const customerId = sessionStorage.getItem("userId");
    const customerName = sessionStorage.getItem("userName") || "Verified Client";
    
    if (!customerId) {
       setFailureMessage("Authentication session has expired. Please login again.");
       setShowFailureOverlay(true);
       return;
    }

    const workerDbId = selectedWorker._id || selectedWorker.mongoId;
    if (!workerDbId) {
       setFailureMessage("Critical worker identity data missing. Please go back, refresh, and re-select your service expert.");
       setShowFailureOverlay(true);
       return;
    }

    try {
      // 🌐 AUTHORITATIVE MASTER COMMITMENT TO CLOUD BACKEND!
      // 🌐 AUTHORITATIVE MASTER COMMITMENT TO CLOUD BACKEND via HIGH-QUALITY GATEWAY!
      const { error: bookErr } = await api.post("/bookings", {
         customer_id: customerId,
         customer_name: customerName,
         worker_id: workerDbId,
         date: formatSafeYMD(date),
         time: selectedSlot,
         service: selectedWorker.service,
         price: calculatedPrice,
         address: dispatchAddress || "Standard Client Address, Rajahmundry",
         status: "Pending"
      });
      
      if (bookErr) throw new Error(bookErr);

      // Fire authoritative Physical cloud transaction record instantly flawlessly!
      await fetch("/api/transactions", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            customer: sessionStorage.getItem("userName") || "Verified Client",
            worker: selectedWorker.name,
            service: selectedWorker.service,
            amount: calculatedPrice,
            status: "Paid",
            method: paymentMethod
         })
      });

      setBookingDetails({
         service: selectedWorker.service,
         date: formatSafeYMD(date),
         time: selectedSlot,
         price: calculatedPrice
      });
      setShowSuccessOverlay(true);
    } catch(err) {
       setFailureMessage(`Cloud Sync Dispatch Error: ${err.message || 'Connection lost'}`);
       setShowFailureOverlay(true);
    }
  };



  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", 
      padding: "40px 20px", 
      fontFamily: "'Inter', sans-serif" 
    }}>
      <div style={{ 
        maxWidth: 550, 
        margin: "0 auto", 
        background: "rgba(255, 255, 255, 0.9)", 
        backdropFilter: "blur(10px)",
        borderRadius: 24,
        padding: 30,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h1 style={{ color: "#1e293b", fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>
            📅 Schedule Service
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, fontWeight: 500 }}>
            Pick the perfect moment for your professional expert.
          </p>
        </div>

        {/* 🚨 ELITE EMERGENCY TOGGLE CARD */}
        <div 
          onClick={() => {
            if (isBusyForInstant() && !isEmergency) {
               alert(`⚠️ Worker Busy Now!\n\n${selectedWorker.name} is currently handling a priority task or scheduled booking. Instant arrival is blocked until they clear their backlog!`);
               return;
            }
            const nextEmergencyState = !isEmergency;
            setIsEmergency(nextEmergencyState);
            if (nextEmergencyState) {
              setDate(new Date());
              setSelectedSlot("Instant (10-20 mins)");
            } else {
              setSelectedSlot(null);
            }
          }}
          style={{
            background: isEmergency ? "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)" : (isBusyForInstant() ? "#f1f5f9" : "white"),
            border: isEmergency ? "none" : "1px solid #e2e8f0",
            borderRadius: 16,
            padding: "24px",
            boxShadow: isEmergency ? "0 12px 24px rgba(239, 68, 68, 0.3)" : "0 4px 6px rgba(0,0,0,0.03)",
            marginBottom: 24,
            cursor: isBusyForInstant() && !isEmergency ? "not-allowed" : "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isEmergency ? "scale(1.02)" : "scale(1)",
            opacity: isBusyForInstant() && !isEmergency ? 0.7 : 1
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1, paddingRight: "15px" }}>
              <h3 style={{ 
                margin: 0, 
                color: isEmergency ? "white" : "#dc2626", 
                fontSize: "18px", 
                fontWeight: 800, 
                display: "flex", 
                alignItems: "center", 
                gap: "10px" 
              }}>
                <span>🚀</span> Rush & Emergency Arrival
              </h3>
              <p style={{ 
                margin: "6px 0 0 0", 
                fontSize: "13px", 
                color: isEmergency ? "rgba(255,255,255,0.9)" : "#64748b", 
                lineHeight: "1.5" 
              }}>
                {isBusyForInstant() && !isEmergency 
                   ? <strong style={{ color: "#b91c1c" }}>⚠️ Worker is Currently Busy / In Another Job!</strong>
                   : <span>Bypass standard queues! Get arrival within <strong>10-20 Minutes</strong> flawlessly. (+₹150)</span>
                }
              </p>
            </div>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", 
              border: "2px solid " + (isEmergency ? "white" : "#e2e8f0"),
              display: "flex", justifyContent: "center", alignItems: "center",
              background: isEmergency ? "white" : "transparent"
            }}>
              {isEmergency && <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ef4444" }} />}
            </div>
          </div>
        </div>

        {/* 🗓️ PREMIUM CALENDAR WRAPPER */}
        <div style={{ 
          backgroundColor: "var(--bg-card)", 
          borderRadius: 20, 
          padding: 20, 
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)", 
          marginBottom: 24, 
          opacity: isEmergency ? 0.4 : 1, 
          pointerEvents: isEmergency ? "none" : "auto", 
          transition: "all 0.3s ease",
          border: "1px solid rgba(0,0,0,0.05)"
        }}>
          <Calendar 
            className="modern-booking-calendar"
            onChange={(d) => { setDate(d); setSelectedSlot(null); setIsEmergency(false); }} 
            value={date} 
            minDate={new Date()} 
            maxDate={maxBookingDate}
          />
        </div>

        {/* ⏰ PREMIUM TIME SLOTS */}
        <div style={{ 
          backgroundColor: "var(--bg-card)", 
          borderRadius: 20, 
          padding: 24, 
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)", 
          marginBottom: 30, 
          opacity: isEmergency ? 0.4 : 1, 
          pointerEvents: isEmergency ? "none" : "auto", 
          transition: "all 0.3s ease",
          border: "1px solid rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            🕒 Available Windows
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12 }}>
            {timeSlots.map(slot => {
              const isBusy = isSlotAlreadyBooked(slot.label);
              const disabled = isSlotPast(slot.hour) || isBusy;
              const selected = selectedSlot === slot.label;
              return (
                <button 
                  key={slot.label} 
                  disabled={disabled} 
                  onClick={() => { setSelectedSlot(slot.label); setIsEmergency(false); }}
                  style={{ 
                    padding: "14px 0", 
                    textAlign: "center",
                    borderRadius: 12, 
                    border: selected ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                    backgroundColor: isBusy ? "#fee2e2" : (disabled ? "#f8fafc" : (selected ? "#eff6ff" : "white")),
                    color: isBusy ? "#b91c1c" : (disabled ? "#cbd5e1" : (selected ? "#1d4ed8" : "#334155")),
                    cursor: disabled ? "not-allowed" : "pointer", 
                    fontWeight: 700,
                    fontSize: 15,
                    transition: "all 0.2s ease",
                    transform: selected ? "translateY(-2px)" : "none",
                    boxShadow: selected ? "0 4px 12px rgba(59, 130, 246, 0.2)" : "none",
                    position: "relative"
                  }}>
                  {isBusy ? "Occupied" : slot.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: "24px" }} />

        {/* 🚀 ACTION AREA */}
        {!paying ? (
          <button 
            onClick={handleBooking} 
            style={{
              width: "100%",
              padding: "18px 24px",
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              color: "white",
              border: "none",
              borderRadius: 16,
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 800,
              boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              transition: "transform 0.2s ease"
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Proceed to Payment <span style={{ fontSize: 22 }}>→</span>
          </button>
        ) : (
          <div style={{ 
            background: "white", 
            borderRadius: 20, 
            padding: 28, 
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            border: "1px solid rgba(0,0,0,0.05)",
            animation: "slideUp 0.3s ease-out"
          }}>
            <h3 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: 20, fontWeight: 800 }}>💳 Checkout</h3>
            
            {/* 📍 DYNAMIC ADDRESS SELECTOR FOR PRECISE ARRIVAL */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>📍 Service Dispatch Address</label>
              <textarea 
                value={dispatchAddress} 
                onChange={e => setDispatchAddress(e.target.value)}
                placeholder="Enter detailed house number, street, and landmarks..."
                rows={3}
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  borderRadius: 12, 
                  border: "2px solid #e2e8f0", 
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#1e293b",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>Select Payment Gateway</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  borderRadius: 12, 
                  border: "2px solid #e2e8f0", 
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1e293b",
                  cursor: "pointer"
                }}>
                <option value="UPI">📱 Google Pay / UPI</option>
                <option value="Wallet">💼 Secure Wallet (₹{walletBal})</option>
                <option value="Card">💳 Credit / Debit Card</option>
                <option value="Cash">💵 Cash on Delivery</option>
              </select>
            </div>

            {paymentMethod === "Wallet" && walletBal < calculatedPrice && (
              <div style={{
                backgroundColor: "#fef2f2",
                border: "1.5px dashed #f87171",
                borderRadius: 14,
                padding: "16px",
                marginBottom: 20,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "center",
                textAlign: "center"
              }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#991b1b" }}>
                  ⚠️ Insufficient Wallet Balance! (Shortage: ₹{calculatedPrice - walletBal})
                </span>
                <button
                  onClick={handleQuickWalletTopup}
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  ⚡ Add Money / Top Up Wallet
                </button>
              </div>
            )}

            <div style={{ 
              background: "#f8fafc", 
              borderRadius: 14, 
              padding: 18, 
              marginBottom: 24, 
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#64748b", fontSize: 14 }}>
                <span>Base Service Rate</span>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>₹{basePrice}</span>
              </div>
              
              {distanceFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#64748b", fontSize: 14 }}>
                  <span>Distance Travel Fee ({distanceVal} KM)</span>
                  <span style={{ fontWeight: 600, color: "#ea580c" }}>+ ₹{distanceFee} ({distanceTier})</span>
                </div>
              )}

              {isEmergency && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#64748b", fontSize: 14 }}>
                  <span>Emergency Priority Rush Fee</span>
                  <span style={{ fontWeight: 600, color: "#dc2626" }}>+ ₹150</span>
                </div>
              )}

              <div style={{ height: "1px", backgroundColor: "#cbd5e1", margin: "10px 0" }}></div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "#64748b", fontSize: 15 }}>
                <span>Total Cost</span>
                <strong style={{ color: "#059669", fontSize: 20 }}>₹{calculatedPrice}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 13 }}>
                <span>Delivery Window</span>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>{date.toDateString()} — {selectedSlot}</span>
              </div>
            </div>
            
            <button 
              onClick={handlePayNow} 
              style={{ 
                width: "100%",
                padding: "18px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                border: "none",
                borderRadius: 16,
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 16px rgba(16, 185, 129, 0.3)"
              }}
            >
              Complete Payment & Book ✅
            </button>
          </div>
        )}
      </div>

      {showSuccessOverlay && (
        <AnimatedSuccess
          bookingDetails={bookingDetails}
          onClose={() => navigate("/user-dashboard")}
        />
      )}

      {showFailureOverlay && (
        <AnimatedFailure
          errorMessage={failureMessage}
          onRetry={() => {
            setShowFailureOverlay(false);
            handlePayNow();
          }}
          onBack={() => {
            setShowFailureOverlay(false);
            setPaying(false);
          }}
        />
      )}
    </div>
  );
}

export default BookingPage;
