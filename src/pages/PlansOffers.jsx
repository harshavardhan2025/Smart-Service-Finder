import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

function PlansOffers() {
  const [copiedCode, setCopiedCode] = useState(null);
  const [plans, setPlans] = useState([]);
  const [offers, setOffers] = useState([]);
  const [workers, setWorkers] = useState([]);

  // Payment gateway states
  const [payingPlan, setPayingPlan] = useState(null); 
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [netBank, setNetBank] = useState("SBI");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [walletBal, setWalletBal] = useState(5000); // Default or load from actual user profile API if available

  useEffect(() => {
    const loadCloudData = async () => {
      try {
         const [pResp, oResp, wResp] = await Promise.all([
            fetch("http://localhost:5000/api/plans"),
            fetch("http://localhost:5000/api/offers"),
            fetch("http://localhost:5000/api/workers")
         ]);
         
         if (pResp.ok) setPlans(await pResp.json());
         if (oResp.ok) setOffers(await oResp.json());
         if (wResp.ok) setWorkers(await wResp.json());
         
      } catch(err) { console.error("Physical Data Load Failure: ", err); }
    };
    
    loadCloudData();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const applyPromoCode = () => {
    setCouponError("");
    setCouponSuccess("");
    setDiscountAmount(0);

    if (!appliedCoupon) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    const offer = offers.find(o => o.code.toUpperCase() === appliedCoupon.toUpperCase());
    if (!offer) {
      setCouponError("Invalid promo code!");
      return;
    }

    // Parse discount amount
    const priceInt = parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0;
    let discount = 0;
    if (offer.discount.includes("₹")) {
      discount = parseInt(offer.discount.replace(/[^\d]/g, ""), 10) || 0;
    } else if (offer.discount.includes("%")) {
      const percentage = parseInt(offer.discount.replace(/[^\d]/g, ""), 10) || 0;
      discount = Math.round((priceInt * percentage) / 100);
    } else {
      discount = 150; // default fallback flat ₹150
    }

    setDiscountAmount(discount);
    setCouponSuccess(`Success! ${offer.discount} applied.`);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (paymentMethod === "UPI" && !upiId) {
      alert("Please enter a valid UPI ID!");
      return;
    }
    if (paymentMethod === "Card" && (!cardNumber || !cardExpiry || !cardCvv)) {
      alert("Please fill in card details!");
      return;
    }

    const finalPaidAmount = Math.max(0, (parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0) - discountAmount);

    if (paymentMethod === "Wallet") {
      if (walletBal < finalPaidAmount) {
        alert(`Insufficient Wallet Balance! (Current: ₹${walletBal}, Required: ₹${finalPaidAmount})`);
        return;
      }
    }

    setPaymentProcessing(true);
    setTimeout(async () => {
      try {
         if (paymentMethod === "Wallet") {
            setWalletBal(prev => prev - finalPaidAmount);
         }

         // Execute Hard Physical Cloud Record instantly seamlessly flawlessly!
         await fetch("http://localhost:5000/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               customer: sessionStorage.getItem("userName") || "Verified Subscriber",
               worker: "System Admin",
               service: `Plan Subscription: ${payingPlan.title}`,
               amount: finalPaidAmount,
               method: paymentMethod,
               status: "Paid"
            })
         });
      } catch(err) { console.error("Plan sub write error"); }

      setPaymentProcessing(false);

      alert(`🎉 Payment of ₹${finalPaidAmount} Successful!\n\nYou have subscribed to "${payingPlan.title}" successfully. All premium benefits are now active on your account.`);
      setPayingPlan(null);
      // Reset forms
      setUpiId("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setAppliedCoupon("");
      setCouponSuccess("");
      setDiscountAmount(0);
    }, 1500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        
        {/* Page Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ color: "#ffffff", fontWeight: 800, fontSize: "36px", margin: "0 0 10px 0", letterSpacing: "-0.5px" }}>
            🏷️ Plans & Seasonal Offers
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
            Save big on your home utilities with customized annual service packages and active promotional discount coupons.
          </p>
        </div>

        {/* Pricing Segment */}
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", marginBottom: 32, textAlign: "center" }}>
          Choose Your Service Plan
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30, marginBottom: 56 }}>
          {plans.map((plan, i) => (
            <div 
              key={i}
              style={{
                backgroundColor: "rgba(30, 41, 59, 0.4)",
                backdropFilter: "blur(12px)",
                borderRadius: 16,
                padding: 32,
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                border: plan.popular ? "2px solid #eab308" : "1px solid rgba(255, 255, 255, 0.08)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.2s ease-in-out"
              }}
            >
              {plan.popular && (
                <span style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", backgroundColor: "#eab308", color: "#1e293b", padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 800, boxShadow: "0 4px 12px rgba(234, 179, 8, 0.3)" }}>
                  MOST POPULAR ⭐
                </span>
              )}
              <div>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 700, color: plan.popular ? "#eab308" : "#ffffff" }}>{plan.title}</h3>
                <div style={{ display: "flex", alignItems: "baseline", marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#ffffff" }}>{plan.price}</span>
                  <span style={{ color: "#94a3b8", marginLeft: 4 }}>/{plan.period}</span>
                </div>
                <ul style={{ paddingLeft: 20, margin: "0 0 32px 0", color: "#cbd5e1", fontSize: 14, lineHeight: "1.8" }}>
                  {plan.features.map((f, idx) => <li key={idx} style={{ marginBottom: 8 }}>{f}</li>)}
                </ul>
                {plan.workerId && (
                  <div style={{ marginBottom: 20, padding: "10px 14px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>👷</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Primary Assigned Expert</p>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#34d399" }}>
                        {workers.find(w => String(w._id || w.id) === String(plan.workerId))?.name || "Expert Professional"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => {
                  setPayingPlan(plan);
                  setAppliedCoupon("");
                  setCouponSuccess("");
                  setCouponError("");
                  setDiscountAmount(0);
                }}
                style={{
                  width: "100%", padding: "14px", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                  backgroundColor: plan.color, color: "white", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.filter = "none"; }}
              >
                {plan.btnText}
              </button>
            </div>
          ))}
        </div>

        {/* Offers Segment */}
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", marginBottom: 32, textAlign: "center" }}>
          Active Promo Coupons
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {offers.map((offer, i) => (
            <div 
              key={i}
              style={{
                backgroundColor: "rgba(30, 41, 59, 0.3)",
                backdropFilter: "blur(8px)",
                borderRadius: 14,
                padding: 24,
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                border: "1px dashed rgba(255, 255, 255, 0.15)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ flex: 1, paddingRight: "10px" }}>
                <span style={{ backgroundColor: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.2)", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  {offer.discount}
                </span>
                <h4 style={{ margin: "12px 0 4px 0", color: "#ffffff", fontSize: 16, fontWeight: 600 }}>{offer.desc}</h4>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{offer.expiry}</p>
              </div>
              <button 
                onClick={() => handleCopy(offer.code)}
                style={{
                  padding: "10px 16px", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8, 
                  backgroundColor: copiedCode === offer.code ? "rgba(52, 211, 153, 0.2)" : "rgba(255, 255, 255, 0.05)",
                  color: copiedCode === offer.code ? "#34d399" : "#cbd5e1", cursor: "pointer", fontWeight: 700, fontSize: 13, minWidth: 90,
                  transition: "all 0.2s"
                }}
              >
                {copiedCode === offer.code ? "Copied! ✅" : offer.code}
              </button>
            </div>
          ))}
        </div>

        {/* 💳 PREMIUM PAYMENT GATEWAY MODAL */}
        {payingPlan && (
          <div 
            style={{
              position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
              backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", 
              zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
            }}
          >
            <div 
              style={{
                backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.12)", 
                borderRadius: "16px", padding: "30px", width: "100%", maxWidth: "460px", 
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", color: "white", position: "relative"
              }}
            >
              <button 
                onClick={() => setPayingPlan(null)}
                style={{
                  position: "absolute", top: "16px", right: "16px", backgroundColor: "transparent", 
                  border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer", transition: "color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
              >
                ✕
              </button>

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <span style={{ fontSize: "36px" }}>💳</span>
                <h3 style={{ margin: "10px 0 6px 0", fontSize: "20px", fontWeight: 800 }}>Confirm Subscription</h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>{payingPlan.title}</p>
              </div>

              <form onSubmit={handlePayment} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Promo Code Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#cbd5e1" }}>Apply Promo Code</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      placeholder="e.g. DOCFREE, FESTIVE25" 
                      value={appliedCoupon} 
                      onChange={(e) => setAppliedCoupon(e.target.value)}
                      style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "rgba(15,23,42,0.4)", color: "white" }}
                    />
                    <button 
                      type="button" 
                      onClick={applyPromoCode}
                      style={{ padding: "10px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <span style={{ fontSize: "12px", color: "#f87171", fontWeight: "bold" }}>{couponError}</span>}
                  {couponSuccess && <span style={{ fontSize: "12px", color: "#34d399", fontWeight: "bold" }}>{couponSuccess}</span>}
                </div>

                {/* Payment Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#cbd5e1" }}>Payment Method</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "rgba(15,23,42,0.4)", color: "white" }}
                  >
                    <option value="UPI" style={{ backgroundColor: "#1e293b" }}>UPI App / ID</option>
                    <option value="Wallet" style={{ backgroundColor: "#1e293b" }}>Wallet (Balance: ₹{walletBal.toLocaleString()})</option>
                    <option value="Card" style={{ backgroundColor: "#1e293b" }}>Credit / Debit Card</option>
                    <option value="Net Banking" style={{ backgroundColor: "#1e293b" }}>Net Banking</option>
                  </select>
                </div>

                {/* Conditional Fields */}
                {paymentMethod === "UPI" && (
                  <input 
                    type="text" 
                    placeholder="Enter UPI ID (e.g. username@okaxis)" 
                    value={upiId} 
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                    style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "rgba(15,23,42,0.4)", color: "white" }}
                  />
                )}

                {paymentMethod === "Card" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <input 
                      type="text" 
                      placeholder="Card Number (e.g. 4111 2222 3333 4444)" 
                      value={cardNumber} 
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength="19"
                      required
                      style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "rgba(15,23,42,0.4)", color: "white" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        value={cardExpiry} 
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength="5"
                        required
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "rgba(15,23,42,0.4)", color: "white" }}
                      />
                      <input 
                        type="password" 
                        placeholder="CVV" 
                        value={cardCvv} 
                        onChange={(e) => setCardCvv(e.target.value)}
                        maxLength="3"
                        required
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "rgba(15,23,42,0.4)", color: "white" }}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "Net Banking" && (
                  <select 
                    value={netBank} 
                    onChange={(e) => setNetBank(e.target.value)}
                    style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "rgba(15,23,42,0.4)", color: "white" }}
                  >
                    <option value="SBI" style={{ backgroundColor: "#1e293b" }}>State Bank of India (SBI)</option>
                    <option value="HDFC" style={{ backgroundColor: "#1e293b" }}>HDFC Bank</option>
                    <option value="ICICI" style={{ backgroundColor: "#1e293b" }}>ICICI Bank</option>
                    <option value="AXIS" style={{ backgroundColor: "#1e293b" }}>Axis Bank</option>
                  </select>
                )}

                {/* Pricing Summary */}
                <div style={{ backgroundColor: "rgba(15,23,42,0.4)", borderRadius: "8px", padding: "14px", fontSize: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                    <span>Base Price</span>
                    <span>{payingPlan.price}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399", marginTop: "6px", fontWeight: "bold" }}>
                      <span>Discount Coupon</span>
                      <span>- ₹{discountAmount}</span>
                    </div>
                  )}
                  <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "10px 0" }}></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", color: "white" }}>
                    <span>Total Amount</span>
                    <span>₹{Math.max(0, (parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0) - discountAmount)}</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={paymentProcessing}
                  style={{
                    width: "100%", padding: "14px", border: "none", borderRadius: "10px", 
                    fontSize: "14px", fontWeight: 700, cursor: paymentProcessing ? "not-allowed" : "pointer",
                    backgroundColor: payingPlan.color, color: "white", transition: "all 0.2s", 
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)", opacity: paymentProcessing ? 0.7 : 1
                  }}
                >
                  {paymentProcessing ? "Verifying Payment Details... ⚡" : `Confirm & Pay ₹${Math.max(0, (parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0) - discountAmount)} Now`}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PlansOffers;
