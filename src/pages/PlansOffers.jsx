import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const BASE_URL = "";

function PlansOffers() {
  const navigate = useNavigate();
  const CACHE_VERSION = "v3";
  const [copiedCode, setCopiedCode] = useState(null);
  // 🚀 Initialize from cache for instant display
  const [plans, setPlans] = useState(() => {
    try {
      if (localStorage.getItem("cache_version") !== CACHE_VERSION) return [];
      return JSON.parse(localStorage.getItem("cached_plans") || "[]");
    } catch { return []; }
  });
  const [offers, setOffers] = useState(() => {
    try {
      if (localStorage.getItem("cache_version") !== CACHE_VERSION) return [];
      return JSON.parse(localStorage.getItem("cached_offers") || "[]");
    } catch { return []; }
  });
  const [workers, setWorkers] = useState([]);
  const [userPlans, setUserPlans] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const isLoggedIn = !!sessionStorage.getItem("userId");

  useEffect(() => {
    const loadCloudData = async () => {
      try {
         // Plans, offers & workers are public — no login needed
         const [pResp, oResp, wResp] = await Promise.all([
            fetch(`${BASE_URL}/api/plans`),
            fetch(`${BASE_URL}/api/offers`),
            fetch(`${BASE_URL}/api/workers`),
         ]);

         if (pResp.ok) {
           const plansData = await pResp.json();
           setPlans(plansData);
           localStorage.setItem("cached_plans", JSON.stringify(plansData));
           localStorage.setItem("cache_version", CACHE_VERSION);
         }
         if (oResp.ok) {
           const offersData = await oResp.json();
           setOffers(offersData);
           localStorage.setItem("cached_offers", JSON.stringify(offersData));
           localStorage.setItem("cache_version", CACHE_VERSION);
         }
         if (wResp.ok) setWorkers(await wResp.json());

         // Only fetch subscriptions for logged-in users
         if (isLoggedIn) {
           const currentUserName = sessionStorage.getItem("userName") || "Verified Subscriber";
           const tResp = await fetch(`${BASE_URL}/api/transactions?customer=${encodeURIComponent(currentUserName)}`);
           if (tResp.ok) {
             const txns = await tResp.json();
             const subbed = txns
               .filter(t => t.service && t.service.startsWith("Plan Subscription:"))
               .map(t => t.service.replace("Plan Subscription:", "").trim());
             setUserPlans(subbed);
           }
         }
      } catch(err) { console.error("Data Load Failure: ", err); }
      finally { setLoading(false); }
    };

    loadCloudData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
         await fetch(`${BASE_URL}/api/transactions`, {
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
      setUserPlans(prev => [...prev, payingPlan.title]);
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

  // Skeleton card for loading state
  const SkeletonPlanCard = () => (
    <div style={{
      backgroundColor: "rgba(30, 41, 59, 0.4)", borderRadius: 16, padding: 32,
      border: "1px solid rgba(255,255,255,0.06)", animation: "pulse 1.4s ease-in-out infinite"
    }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ height: 20, width: "60%", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, marginBottom: 16 }} />
      <div style={{ height: 40, width: "40%", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, marginBottom: 24 }} />
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height: 14, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 6, marginBottom: 10, width: `${70 + i * 5}%` }} />
      ))}
      <div style={{ height: 46, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 10, marginTop: 24 }} />
    </div>
  );

  const SkeletonOfferCard = () => (
    <div style={{
      backgroundColor: "rgba(30, 41, 59, 0.3)", borderRadius: 14, padding: 24,
      border: "1px dashed rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between",
      alignItems: "center", animation: "pulse 1.4s ease-in-out infinite"
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ height: 24, width: "30%", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 16, width: "70%", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 12, width: "40%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 6 }} />
      </div>
      <div style={{ height: 40, width: 90, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 8, marginLeft: 16 }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        
        {/* Page Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ color: "var(--text-main)", fontWeight: 800, fontSize: "36px", margin: "0 0 10px 0", letterSpacing: "-0.5px" }}>
            🏷️ Plans & Seasonal Offers
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
            Save big on your home utilities with customized annual service packages and active promotional discount coupons.
          </p>
        </div>

        {/* Pricing Segment */}
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginBottom: 32, textAlign: "center" }}>
          Choose Your Service Plan
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30, marginBottom: 56 }}>
          {loading && plans.length === 0
            ? [1, 2, 3].map(i => <SkeletonPlanCard key={i} />)
            : plans.map((plan, i) => (
            <div 
              key={i}
              className="premium-card"
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: 16,
                padding: 32,
                border: plan.popular ? "2px solid #eab308" : "1px solid var(--border)",
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
                <h3 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 700, color: plan.popular ? "#eab308" : "var(--text-main)" }}>{plan.title}</h3>
                <div style={{ display: "flex", alignItems: "baseline", marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "var(--text-main)" }}>{plan.price}</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>/{plan.period}</span>
                </div>
                <ul style={{ paddingLeft: 20, margin: "0 0 32px 0", color: "var(--text-main)", fontSize: 14, lineHeight: "1.8" }}>
                  {plan.features.map((f, idx) => <li key={idx} style={{ marginBottom: 8 }}>{f}</li>)}
                </ul>
                {plan.workerId && (
                  <div style={{ marginBottom: 20, padding: "10px 14px", backgroundColor: "var(--border)", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>👷</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Primary Assigned Expert</p>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#34d399" }}>
                        {workers.find(w => String(w._id || w.id) === String(plan.workerId))?.name || "Expert Professional"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {userPlans.includes(plan.title) ? (
                <button 
                  disabled
                  style={{
                    width: "100%", padding: "14px", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                    backgroundColor: "var(--border)", color: "var(--text-muted)", cursor: "not-allowed"
                  }}
                >
                  Subscribed ✅
                </button>
              ) : isLoggedIn && sessionStorage.getItem("userRole") === "user" ? (
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
                    backgroundColor: plan.color || "var(--primary)", color: "white", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.filter = "none"; }}
                >
                  {plan.btnText}
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (isLoggedIn) {
                      const role = sessionStorage.getItem("userRole");
                      alert("⚠️ Access Denied! Only registered customers (User role) can subscribe to premium plans.");
                      if (role === "admin") navigate("/admin-dashboard");
                      else if (role === "worker") navigate("/worker-dashboard");
                    } else {
                      navigate("/login");
                    }
                  }}
                  className="btn-secondary"
                  style={{
                    width: "100%", padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  {isLoggedIn ? "🔒 Customer Only Area" : "🔒 Login to Subscribe"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Offers Segment */}
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginBottom: 32, textAlign: "center" }}>
          Active Promo Coupons
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {loading && offers.length === 0
            ? [1, 2, 3, 4].map(i => <SkeletonOfferCard key={i} />)
            : offers.map((offer, i) => (
            <div 
              key={i}
              className="premium-card"
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: 14,
                padding: 24,
                border: "1px dashed var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ flex: 1, paddingRight: "10px" }}>
                <span style={{ backgroundColor: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.2)", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  {offer.discount}
                </span>
                <h4 style={{ margin: "12px 0 4px 0", color: "var(--text-main)", fontSize: 16, fontWeight: 600 }}>{offer.desc}</h4>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{offer.expiry}</p>
              </div>
              {isLoggedIn ? (
                <button 
                  onClick={() => handleCopy(offer.code)}
                  className="btn-secondary"
                  style={{
                    padding: "10px 16px", 
                    backgroundColor: copiedCode === offer.code ? "rgba(52, 211, 153, 0.2)" : "var(--bg-card)",
                    color: copiedCode === offer.code ? "#34d399" : "var(--text-main)", cursor: "pointer", fontWeight: 700, fontSize: 13, minWidth: 90,
                    transition: "all 0.2s"
                  }}
                >
                  {copiedCode === offer.code ? "Copied! ✅" : offer.code}
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="btn-secondary"
                  style={{
                    padding: "10px 16px", cursor: "pointer",
                    fontWeight: 700, fontSize: 12, minWidth: 110
                  }}
                >
                  🔒 Login to Copy
                </button>
              )}
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
              className="premium-card"
              style={{
                backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", 
                borderRadius: "16px", padding: "30px", width: "100%", maxWidth: "460px", 
                boxShadow: "var(--shadow-3d)", color: "var(--text-main)", position: "relative"
              }}
            >
              <button 
                onClick={() => setPayingPlan(null)}
                style={{
                  position: "absolute", top: "16px", right: "16px", backgroundColor: "transparent", 
                  border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer", transition: "color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-main)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
              >
                ✕
              </button>

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <span style={{ fontSize: "36px" }}>💳</span>
                <h3 style={{ margin: "10px 0 6px 0", fontSize: "20px", fontWeight: 800 }}>Confirm Subscription</h3>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>{payingPlan.title}</p>
              </div>

              <form onSubmit={handlePayment} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Promo Code Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>Apply Promo Code</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      placeholder="e.g. DOCFREE, FESTIVE25" 
                      value={appliedCoupon} 
                      onChange={(e) => setAppliedCoupon(e.target.value)}
                      style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}
                    />
                    <button 
                      type="button" 
                      onClick={applyPromoCode}
                      style={{ padding: "10px 16px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <span style={{ fontSize: "12px", color: "#f87171", fontWeight: "bold" }}>{couponError}</span>}
                  {couponSuccess && <span style={{ fontSize: "12px", color: "#34d399", fontWeight: "bold" }}>{couponSuccess}</span>}
                </div>

                {/* Payment Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>Payment Method</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}
                  >
                    <option value="UPI">UPI App / ID</option>
                    <option value="Wallet">Wallet (Balance: ₹{walletBal.toLocaleString()})</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
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
                    style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}
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
                      style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        value={cardExpiry} 
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength="5"
                        required
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}
                      />
                      <input 
                        type="password" 
                        placeholder="CVV" 
                        value={cardCvv} 
                        onChange={(e) => setCardCvv(e.target.value)}
                        maxLength="3"
                        required
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "Net Banking" && (
                  <select 
                    value={netBank} 
                    onChange={(e) => setNetBank(e.target.value)}
                    style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}
                  >
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                  </select>
                )}

                {/* Pricing Summary */}
                <div style={{ backgroundColor: "var(--border)", borderRadius: "8px", padding: "14px", fontSize: "14px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                    <span>Base Price</span>
                    <span>{payingPlan.price}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399", marginTop: "6px", fontWeight: "bold" }}>
                      <span>Discount Coupon</span>
                      <span>- ₹{discountAmount}</span>
                    </div>
                  )}
                  <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "10px 0" }}></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", color: "var(--text-main)" }}>
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
