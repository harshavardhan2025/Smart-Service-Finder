import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useNavigate } from "react-router-dom";
import { addBooking, getWalletBalance, updateWalletBalance, addTransaction } from "../data/sharedStore";

function BookingPage() {
  const [date, setDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paying, setPaying] = useState(false);
  const [walletBal, setWalletBal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setWalletBal(getWalletBalance());
    const handleStorage = () => setWalletBal(getWalletBalance());
    window.addEventListener("local-storage", handleStorage);
    return () => window.removeEventListener("local-storage", handleStorage);
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

  const basePrice = selectedWorker.price || (selectedWorker.service.includes("Carpentry") ? 399 : selectedWorker.service.includes("Plumbing") ? 299 : selectedWorker.service.includes("Doctors") ? 599 : 349);
  const calculatedPrice = isEmergency ? basePrice + 150 : basePrice;

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

  const handleBooking = () => {
    if (!selectedSlot) { alert("Please select an available time slot or toggle Emergency Booking!"); return; }
    setPaying(true);
  };

  const handlePayNow = () => {
    if (paymentMethod === "Wallet") {
      if (walletBal < calculatedPrice) {
        alert(`Insufficient Wallet Balance! (Current: ₹${walletBal}, Required: ₹${calculatedPrice})`);
        return;
      }
      updateWalletBalance(-calculatedPrice);
    }

    // Add transaction history
    addTransaction({
      service: selectedWorker.service,
      worker: selectedWorker.name,
      amount: calculatedPrice,
      method: paymentMethod,
      icon: selectedWorker.service.includes("Clean") ? "🧹" : selectedWorker.service.includes("Plumb") ? "🔧" : selectedWorker.service.includes("Electr") ? "⚡" : "🛠️"
    });

    // Write new booking into shared store
    addBooking({
      customer: "Harsha Vardhan",
      workerName: selectedWorker.name,
      workerId: selectedWorker.id || 1,
      service: selectedWorker.service,
      date: date.toISOString().slice(0, 10),
      time: selectedSlot,
      address: "Customer Address, " + selectedWorker.city,
      amount: calculatedPrice,
      paymentMethod,
      isEmergency: isEmergency
    });

    alert(
      isEmergency 
        ? `🚨 EMERGENCY CONFIRMED! Payment of ₹${calculatedPrice} via ${paymentMethod} successful!\n\n${selectedWorker.name} has accepted the emergency service and is arriving at your location in 10-20 minutes! 🚗💨`
        : `✅ Payment of ₹${calculatedPrice} via ${paymentMethod} successful!\n\nYour booking is confirmed with ${selectedWorker.name} and they have been notified. 🎉`
    );
    navigate("/my-bookings");
  };

  const sBtn = {
    padding: "12px 24px", backgroundColor: "var(--primary)", color: "white",
    border: "none", borderRadius: 8, cursor: "pointer", fontSize: 16, fontWeight: 700
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ color: "#1e293b", fontWeight: 800, marginBottom: 6 }}>📅 Book a Service</h1>
        <p style={{ color: "#64748b", marginBottom: 24 }}>Choose your preferred date and time slot.</p>

        {/* Instant & Emergency Booking Card Option */}
        <div 
          onClick={() => {
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
            backgroundColor: isEmergency ? "#fff5f5" : "white",
            border: isEmergency ? "2px solid #ef4444" : "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            marginBottom: 20,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxSizing: "border-box"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1, paddingRight: "10px" }}>
              <h3 style={{ margin: 0, color: "#dc2626", fontSize: "16px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🚨</span> Instant & Emergency Booking
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                Need urgent assistance? A certified professional will arrive at your door within <strong>10 to 20 minutes</strong>! (+₹150 convenience fee)
              </p>
            </div>
            <input 
              type="checkbox" 
              checked={isEmergency} 
              onChange={() => {}} // handled by parent click
              style={{ width: "18px", height: "18px", accentColor: "#ef4444", cursor: "pointer" }}
            />
          </div>
        </div>

        <div style={{ backgroundColor: "white", borderRadius: 14, padding: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", marginBottom: 20, opacity: isEmergency ? 0.6 : 1, pointerEvents: isEmergency ? "none" : "auto", transition: "opacity 0.2s ease" }}>
          <Calendar onChange={(d) => { setDate(d); setSelectedSlot(null); setIsEmergency(false); }} value={date} minDate={new Date()} />
        </div>

        <div style={{ backgroundColor: "white", borderRadius: 14, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", marginBottom: 20, opacity: isEmergency ? 0.6 : 1, pointerEvents: isEmergency ? "none" : "auto", transition: "opacity 0.2s ease" }}>
          <h3 style={{ margin: "0 0 16px", color: "#1e293b" }}>Select Time Slot</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {timeSlots.map(slot => {
              const disabled = isSlotPast(slot.hour);
              const selected = selectedSlot === slot.label;
              return (
                <button key={slot.label} disabled={disabled} onClick={() => { setSelectedSlot(slot.label); setIsEmergency(false); }}
                  style={{ padding: "10px 18px", borderRadius: 8, border: selected ? "2px solid var(--primary)" : "1px solid #e2e8f0",
                    backgroundColor: disabled ? "#f1f5f9" : selected ? "var(--primary-light)" : "white",
                    color: disabled ? "#94a3b8" : selected ? "var(--primary-dark)" : "#1e293b",
                    cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600 }}>
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>

        {!paying ? (
          <button onClick={handleBooking} style={sBtn}>Confirm Booking →</button>
        ) : (
          <div style={{ backgroundColor: "white", borderRadius: 14, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", color: "#1e293b" }}>💳 Payment</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}>
                <option value="UPI">UPI</option>
                <option value="Wallet">Wallet (Balance: ₹{walletBal})</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cash">Cash on Delivery</option>
              </select>
            </div>
            <div style={{ backgroundColor: "#f8fafc", borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 14, color: "#475569" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Service Fee</span><strong>₹{calculatedPrice}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}><span>Date & Slot</span><span>{date.toDateString()} — {selectedSlot}</span></div>
            </div>
            <button onClick={handlePayNow} style={{ ...sBtn, width: "100%" }}>Pay ₹{calculatedPrice} Now ✅</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
