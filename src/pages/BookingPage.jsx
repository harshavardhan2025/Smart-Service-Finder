import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useNavigate } from "react-router-dom";
import api from "../utils/apiClient";
import AnimatedSuccess from "../components/AnimatedSuccess";
import AnimatedFailure from "../components/AnimatedFailure";
import { getWalletBalance, deductFromWallet } from "../utils/wallet";

function BookingPage() {
  const [date, setDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState("Instant (10-20 mins)");
  const [isEmergency, setIsEmergency] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paying, setPaying] = useState(true);
  const [walletBal, setWalletBal] = useState(getWalletBalance());
  const [dispatchAddress, setDispatchAddress] = useState("");
  const customPrice = null;
  const navigate = useNavigate();

  // 🏷️ Dynamic Promo & Offer Code State
  const [availableOffers, setAvailableOffers] = useState([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [couponStatus, setCouponStatus] = useState(null);

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

  // 🏷️ Fetch available promotional offers from cloud API
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch("/api/offers");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setAvailableOffers(data);
        }
      } catch (e) { console.error("Offers fetch error", e); }
    };
    fetchOffers();
  }, []);

  const basePrice = selectedWorker.price || (selectedWorker.service.includes("Carpentry") ? 399 : selectedWorker.service.includes("Plumbing") ? 299 : selectedWorker.service.includes("Doctors") ? 599 : 349);
  const rawSubTotal = customPrice !== null ? customPrice : (basePrice + distanceFee + (isEmergency ? 150 : 0));

  let discountVal = 0;
  if (appliedOffer) {
    const rawDisc = appliedOffer.discount || "";
    if (rawDisc.includes("%")) {
      const pct = parseFloat(rawDisc) || 0;
      discountVal = Math.round((rawSubTotal * pct) / 100);
    } else {
      const val = parseFloat(rawDisc.replace(/[^0-9.]/g, '')) || 0;
      discountVal = Math.round(val);
    }
    if (discountVal >= rawSubTotal) {
      discountVal = Math.max(0, rawSubTotal - 1);
    }
  }

  const calculatedPrice = Math.max(1, rawSubTotal - discountVal);

  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponStatus({ type: "error", message: "Please enter or select a promo code!" });
      return;
    }

    setCouponStatus(null);

    let offerObj = availableOffers.find(o => o.code && o.code.toUpperCase().trim() === code);

    // Fallback default offers if database offers list is empty
    if (!offerObj) {
      const fallbacks = [
        { code: "WELCOME100", discount: "₹100 OFF", desc: "Flat ₹100 Instant Discount on any booking", minPrice: 200 },
        { code: "WORKZY20", discount: "20% OFF", desc: "Get 20% OFF on home & expert services", minPrice: 300 },
        { code: "SUMMER50", discount: "₹50 OFF", desc: "Special ₹50 discount on summer repairs", minPrice: 150 }
      ];
      offerObj = fallbacks.find(o => o.code === code);
    }

    if (!offerObj) {
      setCouponStatus({ type: "error", message: `Invalid promo code "${code}". Please check and try again.` });
      return;
    }

    if (offerObj.minPrice && rawSubTotal < offerObj.minPrice) {
      setCouponStatus({ 
        type: "error", 
        message: `Code "${offerObj.code}" requires a minimum booking subtotal of ₹${offerObj.minPrice}. (Current: ₹${rawSubTotal})` 
      });
      return;
    }

    if (offerObj.city && offerObj.city.trim() !== "" && offerObj.city.toLowerCase() !== "all") {
      const uCity = (localStorage.getItem("userCity") || selectedWorker.city || "").toLowerCase().trim();
      const oCities = offerObj.city.toLowerCase().split(",").map(c => c.trim());
      if (uCity && !oCities.some(c => uCity.includes(c) || c.includes(uCity))) {
        setCouponStatus({
          type: "error",
          message: `Code "${offerObj.code}" is valid only for users in ${offerObj.city}.`
        });
        return;
      }
    }

    if (offerObj.validServices && offerObj.validServices.trim() !== "" && offerObj.validServices.toLowerCase() !== "all") {
      const sName = (selectedWorker.service || "").toLowerCase();
      const validS = offerObj.validServices.toLowerCase().split(",").map(s => s.trim());
      if (!validS.some(s => sName.includes(s) || s.includes(sName))) {
        setCouponStatus({
          type: "error",
          message: `Code "${offerObj.code}" is valid only for services: ${offerObj.validServices}.`
        });
        return;
      }
    }

    setAppliedOffer(offerObj);
    setCouponInput(offerObj.code);
    setCouponStatus({
      type: "success",
      message: `🎉 Offer "${offerObj.code}" Applied! (${offerObj.discount} - ${offerObj.desc || "Discount activated"})`
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setCouponInput("");
    setCouponStatus(null);
  };

  // 🛡️ CRITICAL SCHEDULING LOCK: Cap booking capabilities strictly to 9 Days Max!
  const maxBookingDate = new Date();
  maxBookingDate.setDate(maxBookingDate.getDate() + 9);

  const timeSlots = [
    { label: "9 AM", hour: 9 },
    { label: "11 AM", hour: 11 },
    { label: "1 PM", hour: 13 },
    { label: "3 PM", hour: 15 },
    { label: "5 PM", hour: 17 }
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
      const walletRes = await deductFromWallet(calculatedPrice, `${selectedWorker.service} Service Booking`, "Wallet");
      if (!walletRes.success) {
        setFailureMessage(walletRes.error);
        setShowFailureOverlay(true);
        return;
      }
      setWalletBal(walletRes.balance);
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
         originalPrice: rawSubTotal,
         couponCode: appliedOffer ? appliedOffer.code : "",
         discountAmount: discountVal,
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
       setFailureMessage(err.message || "Booking failed. Please try again.");
       setShowFailureOverlay(true);
    }
  };



  return (
    <div className="booking-page-container" style={{ 
      minHeight: "100vh", 
      background: "var(--bg-main)", 
      padding: "40px 20px", 
      fontFamily: "'Inter', sans-serif" 
    }}>
      <div className="booking-page-card" style={{ 
        maxWidth: 550, 
        margin: "0 auto", 
        background: "var(--bg-card)", 
        backdropFilter: "blur(10px)",
        borderRadius: 24,
        padding: 30,
        boxShadow: "var(--shadow-3d)",
        border: "1px solid var(--border-color)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h1 style={{ color: "var(--text-main)", fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>
            📅 Schedule Service
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, fontWeight: 500 }}>
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
            background: isEmergency ? "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)" : (isBusyForInstant() ? "var(--primary-light)" : "var(--bg-card-hover)"),
            border: isEmergency ? "none" : "1px solid var(--border-color)",
            borderRadius: 16,
            padding: "24px",
            boxShadow: isEmergency ? "0 12px 24px rgba(239, 68, 68, 0.3)" : "var(--shadow-3d)",
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
                color: isEmergency ? "rgba(255,255,255,0.9)" : "var(--text-secondary)", 
                lineHeight: "1.5" 
              }}>
                {isBusyForInstant() && !isEmergency 
                   ? <strong style={{ color: "var(--danger)" }}>⚠️ Worker is Currently Busy / In Another Job!</strong>
                   : <span>Bypass standard queues! Get arrival within <strong>10-20 Minutes</strong> flawlessly. (+₹150)</span>
                }
              </p>
            </div>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", 
              border: "2px solid " + (isEmergency ? "white" : "var(--border-color)"),
              display: "flex", justifyContent: "center", alignItems: "center",
              background: isEmergency ? "white" : "transparent"
            }}>
              {isEmergency && <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "var(--danger)" }} />}
            </div>
          </div>
        </div>

        {/* 🗓️ PREMIUM CALENDAR WRAPPER */}
        <div style={{ 
          backgroundColor: "var(--bg-card)", 
          borderRadius: 20, 
          padding: 20, 
          boxShadow: "var(--shadow-3d)", 
          marginBottom: 24, 
          opacity: isEmergency ? 0.4 : 1, 
          pointerEvents: isEmergency ? "none" : "auto", 
          transition: "all 0.3s ease",
          border: "1px solid var(--border-color)"
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
          boxShadow: "var(--shadow-3d)", 
          marginBottom: 30, 
          opacity: isEmergency ? 0.4 : 1, 
          pointerEvents: isEmergency ? "none" : "auto", 
          transition: "all 0.3s ease",
          border: "1px solid var(--border-color)"
        }}>
          <h3 style={{ margin: "0 0 20px", color: "var(--text-main)", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
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
                    border: selected ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    backgroundColor: isBusy ? "var(--danger-light)" : (disabled ? "var(--primary-light)" : (selected ? "var(--primary-light)" : "var(--bg-card-hover)")),
                    color: isBusy ? "var(--danger)" : (disabled ? "var(--text-muted)" : (selected ? "var(--primary)" : "var(--text-main)")),
                    cursor: disabled ? "not-allowed" : "pointer", 
                    fontWeight: 700,
                    fontSize: 15,
                    transition: "all 0.2s ease",
                    transform: selected ? "translateY(-2px)" : "none",
                    boxShadow: selected ? "0 4px 12px rgba(57, 79, 138, 0.2)" : "none",
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
              background: "var(--primary)",
              color: "var(--primary-dark)",
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
            background: "var(--bg-card)", 
            borderRadius: 20, 
            padding: 28, 
            boxShadow: "var(--shadow-3d)",
            border: "1px solid var(--border-color)",
            animation: "slideUp 0.3s ease-out"
          }}>
            <h3 style={{ margin: "0 0 20px", color: "var(--text-main)", fontSize: 20, fontWeight: 800 }}>💳 Checkout</h3>
            
            {/* 📍 DYNAMIC ADDRESS SELECTOR FOR PRECISE ARRIVAL */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>📍 Service Dispatch Address</label>
              <textarea 
                value={dispatchAddress} 
                onChange={e => setDispatchAddress(e.target.value)}
                placeholder="Enter detailed house number, street, and landmarks..."
                rows={3}
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  borderRadius: 12, 
                  border: "1.5px solid var(--border-color)", 
                  backgroundColor: "var(--bg-card-hover)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-main)",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Select Payment Gateway</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  borderRadius: 12, 
                  border: "1.5px solid var(--border-color)", 
                  backgroundColor: "var(--bg-card-hover)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-main)",
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
                backgroundColor: "var(--danger-light)",
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

            {/* 🏷️ DYNAMIC PROMO & OFFER CODE SYSTEM */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
                🏷️ Apply Promo / Offer Code
              </label>

              {appliedOffer ? (
                <div style={{
                  backgroundColor: "var(--primary-light)",
                  border: "1.5px solid var(--primary)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)", display: "block" }}>
                      🎉 Code "{appliedOffer.code}" Active ({appliedOffer.discount})
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {appliedOffer.desc || "Discount applied to subtotal"}
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--danger)",
                      border: "1px solid var(--danger)",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Remove ✕
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="ENTER OFFER CODE (e.g. WORKZY20)..."
                      style={{
                        flex: 1,
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1.5px solid var(--border-color)",
                        backgroundColor: "var(--bg-card-hover)",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        color: "var(--text-main)",
                        textTransform: "uppercase"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon(couponInput)}
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "white",
                        border: "none",
                        borderRadius: 12,
                        padding: "0 20px",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: "0 4px 10px rgba(49, 82, 91, 0.2)"
                      }}
                    >
                      Apply
                    </button>
                  </div>

                  {/* Available Quick Coupon Badges / Chips */}
                  {availableOffers.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700, width: "100%", marginBottom: 2 }}>
                        Available Offers for you:
                      </span>
                      {availableOffers.map((off, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCouponInput(off.code);
                            handleApplyCoupon(off.code);
                          }}
                          style={{
                            backgroundColor: "var(--primary-light)",
                            color: "var(--primary)",
                            border: "1px dashed var(--primary)",
                            borderRadius: 20,
                            padding: "4px 10px",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          title={off.desc}
                        >
                          ⚡ {off.code} ({off.discount})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {couponStatus && (
                <div style={{
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: couponStatus.type === "success" ? "#16a34a" : "#dc2626"
                }}>
                  {couponStatus.message}
                </div>
              )}
            </div>

            <div style={{ 
              background: "var(--bg-card-hover)", 
              borderRadius: 14, 
              padding: 18, 
              marginBottom: 24, 
              border: "1px solid var(--border-color)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--text-secondary)", fontSize: 14 }}>
                <span>Base Service Rate</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>₹{basePrice}</span>
              </div>
              
              {distanceFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--text-secondary)", fontSize: 14 }}>
                  <span>Distance Travel Fee ({distanceVal} KM)</span>
                  <span style={{ fontWeight: 600, color: "#ea580c" }}>+ ₹{distanceFee} ({distanceTier})</span>
                </div>
              )}

              {isEmergency && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--text-secondary)", fontSize: 14 }}>
                  <span>Emergency Priority Rush Fee</span>
                  <span style={{ fontWeight: 600, color: "var(--danger)" }}>+ ₹150</span>
                </div>
              )}

              {appliedOffer && discountVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#16a34a", fontSize: 14, fontWeight: 700 }}>
                  <span>🏷️ Coupon Discount ({appliedOffer.code})</span>
                  <span>- ₹{discountVal}</span>
                </div>
              )}

              <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "10px 0" }}></div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "var(--text-secondary)", fontSize: 15 }}>
                <span>Total Cost</span>
                <div>
                  {appliedOffer && discountVal > 0 && (
                    <span style={{ textDecoration: "line-through", color: "var(--text-secondary)", fontSize: 14, marginRight: 8 }}>
                      ₹{rawSubTotal}
                    </span>
                  )}
                  <strong style={{ color: "#059669", fontSize: 20 }}>₹{calculatedPrice}</strong>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: 13 }}>
                <span>Delivery Window</span>
                <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{date.toDateString()} — {selectedSlot}</span>
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
