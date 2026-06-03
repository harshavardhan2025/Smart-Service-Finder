import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [amount, setAmount] = useState(queryParams.get("amount") || "500");
  const [method, setMethod] = useState("UPI");
  const [processing, setProcessing] = useState(false);

  const currentUsr = sessionStorage.getItem("userName") || "Verified Client";

  const PAYMENT_OPTIONS = [
    { id: "UPI", label: "Google Pay / PhonePe", icon: "📱", desc: "Pay directly via UPI ID" },
    { id: "Card", label: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, RuPay" },
    { id: "NetBanking", label: "Net Banking", icon: "🏦", desc: "Log into secure bank portals" },
    { id: "Cash", label: "Cash Pay-in", icon: "💵", desc: "Offline collection points" }
  ];

  const handleConfirmTopup = async () => {
    const numericAmt = parseInt(amount);
    if (isNaN(numericAmt) || numericAmt <= 0) {
       alert("⚠️ Invalid input. Please enter a valid load amount.");
       return;
    }

    setProcessing(true);
    
    try {
       // Simulate brief secure bank gateway confirmation lag for realism
       await new Promise(resolve => setTimeout(resolve, 1800));

       // 🚀 Authoritative Cloud Anchor Injection: Secure permanent digital custody of incoming assets!
       const resp = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             customer: currentUsr,
             worker: "Cloud Deposit Gateway",
             service: "Direct Wallet Top-up",
             amount: numericAmt,
             status: "Added",
             method: "Wallet Topup",
             icon: method === "UPI" ? "📱" : method === "Card" ? "💳" : "💰"
          })
       });

       if (!resp.ok) throw new Error("Gateway Rejection");

       alert(`🎉 Payment of ₹${numericAmt} Successful!\n\nYour digital vault has been topped up via ${method}. Relocating to dashboard.`);
       navigate("/user-dashboard");
    } catch(e) {
       alert("🛑 Transaction Halt: Critical network disruption at payment node.");
       setProcessing(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      padding: "20px",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{
         backgroundColor: "var(--bg-card)",
         width: "100%",
         maxWidth: "480px",
         borderRadius: "24px",
         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
         overflow: "hidden"
      }}>
         {/* Heading Ribbon */}
         <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", color: "white", padding: "30px 24px", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: 800 }}>💳 Secure Payment Gateway</h2>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.8 }}>128-bit End-to-End SSL Enforced</p>
         </div>

         <div style={{ padding: "30px 24px" }}>
            {/* Amount Field */}
            <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>
               Load Amount
            </label>
            <div style={{ position: "relative", marginBottom: "24px" }}>
               <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "20px", fontWeight: 800, color: "#1e293b" }}>₹</span>
               <input 
                 type="number"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 disabled={processing}
                 style={{
                    width: "100%", padding: "16px 16px 16px 40px", borderRadius: "14px", border: "2.5px solid #e2e8f0",
                    fontSize: "22px", fontWeight: 800, boxSizing: "border-box", outline: "none", color: "#1e293b"
                 }}
               />
            </div>

            {/* Selector Grid */}
            <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "12px", display: "block" }}>
               Select Settlement Instrument
            </label>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
               {PAYMENT_OPTIONS.map(opt => {
                  const isSelected = method === opt.id;
                  return (
                     <div 
                       key={opt.id}
                       onClick={() => !processing && setMethod(opt.id)}
                       style={{
                          padding: "16px",
                          borderRadius: "16px",
                          border: `2px solid ${isSelected ? "#3b82f6" : "#e2e8f0"}`,
                          backgroundColor: isSelected ? "#eff6ff" : "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          cursor: processing ? "default" : "pointer",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          transform: isSelected ? "scale(1.02)" : "scale(1)",
                       }}
                     >
                        <div style={{ fontSize: "26px" }}>{opt.icon}</div>
                        <div style={{ flex: 1 }}>
                           <div style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>{opt.label}</div>
                           <div style={{ fontSize: "12px", color: "#64748b" }}>{opt.desc}</div>
                        </div>
                        <div style={{
                           width: "20px", height: "20px", borderRadius: "50%", border: "2px solid " + (isSelected ? "#3b82f6" : "#cbd5e1"),
                           display: "flex", justifyContent: "center", alignItems: "center"
                        }}>
                           {isSelected && <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#3b82f6" }} />}
                        </div>
                     </div>
                  );
               })}
            </div>

            <button 
               onClick={handleConfirmTopup}
               disabled={processing}
               style={{
                  width: "100%",
                  padding: "18px",
                  borderRadius: "14px",
                  border: "none",
                  background: processing ? "#94a3b8" : "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  fontSize: "17px",
                  fontWeight: 800,
                  cursor: processing ? "not-allowed" : "pointer",
                  boxShadow: "0 10px 20px rgba(16, 185, 129, 0.25)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px"
               }}
            >
               {processing ? (
                  <>⌛ Processing Bank Link...</>
               ) : (
                  <>Authorize ₹{amount || 0} Deposit 🔒</>
               )}
            </button>

            <button 
               onClick={() => navigate(-1)}
               disabled={processing}
               style={{
                  width: "100%", marginTop: "14px", background: "none", border: "none",
                  color: "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer", textDecoration: "underline"
               }}
            >
               Cancel & Retreat
            </button>
         </div>
      </div>
    </div>
  );
}

export default PaymentPage;
