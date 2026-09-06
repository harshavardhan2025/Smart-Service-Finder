import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

import { FaTag, FaLock, FaStar, FaUser, FaCheckCircle, FaCreditCard } from "react-icons/fa";

import { deductFromWallet } from "../utils/wallet";



const BASE_URL = "";







function PlansOffers() {

  const navigate = useNavigate();

  const CACHE_VERSION = "v4";

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

  const [userPlans, setUserPlans] = useState(() => {

    try {

      const stored = localStorage.getItem("userSubscriptions");

      if (stored) return JSON.parse(stored);

    } catch {}

    return [];

  });

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

  const [walletBal, setWalletBal] = useState(() => {

    try {

      const stored = localStorage.getItem("userWalletBalance");

      if (stored !== null && !isNaN(parseFloat(stored))) return parseFloat(stored);

    } catch {}

    return 5000;

  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [selectedTermsItem, setSelectedTermsItem] = useState(null);



  const isLoggedIn = !!sessionStorage.getItem("userId");

  const userCity = localStorage.getItem("userCity") || sessionStorage.getItem("userCity") || "";



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

         

         if (isLoggedIn) {

           try {

             const userResp = await fetch(`${BASE_URL}/api/users/me`, {

               headers: {

                 "Authorization": `Bearer ${sessionStorage.getItem("authToken") || sessionStorage.getItem("token")}`

               }

             });

             

             if (userResp.ok) {

               const userData = await userResp.json();

               if (userData.walletBalance !== undefined) {

                 setWalletBal(userData.walletBalance);

                 localStorage.setItem("userWalletBalance", userData.walletBalance);

               }

               if (userData.subscriptions && Array.isArray(userData.subscriptions)) {

                 const activeSubs = userData.subscriptions

                    .filter(sub => sub.status === "Active" && new Date(sub.expiryDate) > new Date())

                    .map(sub => sub.planTitle);

                 setUserPlans(activeSubs);

                 localStorage.setItem("userSubscriptions", JSON.stringify(activeSubs));

               }

             }

           } catch(err) {

             console.error("Failed to fetch user profile:", err);

           }

         }

      } catch(err) { console.error("Data Load Failure: ", err); }

      finally { setLoading(false); }

    };



    loadCloudData();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [isLoggedIn]);



  const getButtonTheme = (planColor, disabled) => {
    if (disabled) {
      return {
        bg: "var(--border, #94a3b8)",
        color: "var(--text-muted, #64748b)",
        boxShadow: "none"
      };
    }
    if (!planColor) {
      return {
        bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
        color: "#ffffff",
        boxShadow: "0 8px 20px -6px rgba(37,99,235,0.4)"
      };
    }
    const c = String(planColor).trim().toLowerCase();
    if (c === "#ffffff" || c === "#fff" || c === "white" || c === "#f8fafc" || c === "#f1f5f9" || c === "transparent" || c === "rgb(255,255,255)") {
      return {
        bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
        color: "#ffffff",
        boxShadow: "0 8px 20px -6px rgba(37,99,235,0.4)"
      };
    }
    if (c.includes("eab308") || c.includes("yellow") || c.includes("fef08a") || c.includes("fde047") || c === "#f59e0b") {
      return {
        bg: planColor,
        color: "#0f172a",
        boxShadow: "0 8px 20px -6px rgba(234, 179, 8, 0.4)"
      };
    }
    return {
      bg: planColor,
      color: "#ffffff",
      boxShadow: `0 8px 20px -6px ${planColor}40`
    };
  };

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



    // 1. Target Location Check

    if (offer.city && offer.city.trim() !== "" && offer.city.toLowerCase() !== "all") {

      const validCities = offer.city.toLowerCase().split(",").map(c => c.trim());

      const uCity = userCity ? userCity.toLowerCase().trim() : "";

      const isMatch = validCities.some(c => uCity.includes(c) || c.includes(uCity));

      if (!uCity || !isMatch) {

        setCouponError(`This coupon is only valid for users in: ${offer.city}.`);

        return;

      }

    }



    // Parse base price

    const priceInt = parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0;



    // 2. Minimum Purchase / Plan Price Check

    if (offer.minPrice && priceInt < offer.minPrice) {

      setCouponError(`This coupon requires a minimum purchase rate of ₹${offer.minPrice}.`);

      return;

    }



    // 3. Service Category Compatibility Check

    if (offer.validServices && offer.validServices.trim() !== "") {

      const validServicesList = offer.validServices.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

      if (validServicesList.length > 0) {

        const planTitleLower = payingPlan.title.toLowerCase();

        const planFeaturesLower = payingPlan.features.map(f => f.toLowerCase()).join(" ");

        const isMatch = validServicesList.some(service => planTitleLower.includes(service) || planFeaturesLower.includes(service));

        if (!isMatch) {

          setCouponError(`This coupon is only valid for services: ${offer.validServices}.`);

          return;

        }

      }

    }



    // 4. Valid Plan Period Check

    if (offer.validPeriods && offer.validPeriods.trim() !== "") {

      const validPeriodsList = offer.validPeriods.split(",").map(p => p.trim().toLowerCase()).filter(Boolean);

      if (validPeriodsList.length > 0 && payingPlan.period) {

        if (!validPeriodsList.includes(payingPlan.period.toLowerCase())) {

          setCouponError(`This coupon is only valid for ${offer.validPeriods} plans.`);

          return;

        }

      }

    }



    // Parse discount amount

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

    if (payingPlan.terms && !agreedToTerms) {

      alert("Please check the box to agree to the Terms & Conditions before subscribing.");

      return;

    }

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

      const walletRes = await deductFromWallet(finalPaidAmount, `Plan Subscription: ${payingPlan.title}`, "Wallet");

      if (!walletRes.success) {

        alert(`⚠️ ${walletRes.error}`);

        return;

      }

      setWalletBal(walletRes.balance);

    }



    setPaymentProcessing(true);

    setTimeout(async () => {

      try {

         if (paymentMethod === "Wallet") {

            const newBal = Math.max(0, walletBal - finalPaidAmount);

            setWalletBal(newBal);

            localStorage.setItem("userWalletBalance", newBal);

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



         // Record Subscription Validity in Database

         if (sessionStorage.getItem("userId")) {

             await fetch(`${BASE_URL}/api/users/subscribe`, {

                 method: "POST",

                 headers: {

                     "Content-Type": "application/json",

                     Authorization: `Bearer ${sessionStorage.getItem("authToken") || sessionStorage.getItem("token")}`

                 },

                 body: JSON.stringify({

                     planTitle: payingPlan.title,

                     period: payingPlan.period || "year",

                     paymentMethod: paymentMethod,

                     amount: finalPaidAmount

                 })

             });

         }

      } catch(err) { console.error("Plan sub write error"); }



      setPaymentProcessing(false);



      const updatedPlans = Array.from(new Set([...userPlans, payingPlan.title]));

      setUserPlans(updatedPlans);

      localStorage.setItem("userSubscriptions", JSON.stringify(updatedPlans));



      alert(`🎉 Payment of ₹${finalPaidAmount} Successful!\n\nYou have subscribed to "${payingPlan.title}" successfully. All premium benefits are now active on your account!`);

      setPayingPlan(null);

      // Reset forms

      setUpiId("");

      setCardNumber("");

      setCardExpiry("");

      setCardCvv("");

      setAppliedCoupon("");

      setCouponSuccess("");

      setDiscountAmount(0);

      setAgreedToTerms(false);

    }, 1500);

  };







  // Skeleton card for loading state

  const SkeletonPlanCard = () => (

    <div style={{

      backgroundColor: "var(--bg-card)", borderRadius: 16, padding: 32,

      border: "1px solid var(--border-color)", animation: "pulse 1.4s ease-in-out infinite"

    }}>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      <div style={{ height: 20, width: "60%", backgroundColor: "var(--border-color)", borderRadius: 8, marginBottom: 16 }} />

      <div style={{ height: 40, width: "40%", backgroundColor: "var(--border-color)", borderRadius: 8, marginBottom: 24 }} />

      {[1,2,3,4].map(i => (

        <div key={i} style={{ height: 14, backgroundColor: "var(--border-color)", borderRadius: 6, marginBottom: 10, width: `${70 + i * 5}%` }} />

      ))}

      <div style={{ height: 46, backgroundColor: "var(--border-color)", borderRadius: 10, marginTop: 24 }} />

    </div>

  );



  const SkeletonOfferCard = () => (

    <div style={{

      backgroundColor: "var(--bg-card)", borderRadius: 14, padding: 24,

      border: "1px dashed var(--border-color)", display: "flex", justifyContent: "space-between",

      alignItems: "center", animation: "pulse 1.4s ease-in-out infinite"

    }}>

      <div style={{ flex: 1 }}>

        <div style={{ height: 24, width: "30%", backgroundColor: "var(--border-color)", borderRadius: 8, marginBottom: 12 }} />

        <div style={{ height: 16, width: "70%", backgroundColor: "var(--border-color)", borderRadius: 6, marginBottom: 8 }} />

        <div style={{ height: 12, width: "40%", backgroundColor: "var(--border-color)", borderRadius: 6 }} />

      </div>

      <div style={{ height: 40, width: 90, backgroundColor: "var(--border-color)", borderRadius: 8, marginLeft: 16 }} />
    </div>
  );

  const renderPlansContent = () => {
    if (loading && plans.length === 0) {
      return [1, 2, 3].map(i => <SkeletonPlanCard key={i} />);
    }
    if (plans.length === 0) {
      return (
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: "15px" }}>
          No active subscription plans available at the moment.
        </div>
      );
    }
    return plans.map((plan, i) => {
      const bgTone = plan.popular 
        ? "linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.03) 100%)" 
        : i % 2 === 0 
          ? "linear-gradient(135deg, rgba(49, 82, 91, 0.07) 0%, rgba(49, 82, 91, 0.02) 100%)" 
          : "linear-gradient(135deg, rgba(14, 165, 233, 0.07) 0%, rgba(14, 165, 233, 0.02) 100%)";

      const borderCol = plan.popular 
        ? "2.5px solid #eab308" 
        : i % 2 === 0 
          ? "1.5px solid rgba(49, 82, 91, 0.25)" 
          : "1.5px solid rgba(14, 165, 233, 0.25)";

      const planShadow = plan.popular
        ? "0 20px 40px -10px rgba(234, 179, 8, 0.2), var(--shadow-3d)"
        : "var(--shadow-3d)";

      const featuresArr = Array.isArray(plan.features) 
        ? plan.features 
        : (typeof plan.features === "string" ? plan.features.split(",").map(f => f.trim()).filter(Boolean) : []);

      return (
        <div 
          key={plan._id || plan.id || i}
          className="premium-card"
          style={{
            background: bgTone,
            borderRadius: 16,
            padding: 32,
            border: borderCol,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: plan.popular ? "scale(1.03)" : "none",
            boxShadow: planShadow,
            zIndex: plan.popular ? 2 : 1
          }}
        >
          {plan.popular && (
            <span style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", backgroundColor: "var(--warning)", color: "var(--text-main)", padding: "6px 16px", borderRadius: 20, fontSize: 11, fontWeight: 800, boxShadow: "0 4px 12px rgba(234, 179, 8, 0.4)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              MOST POPULAR <FaStar size={10} />
            </span>
          )}

          <div>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 700, color: plan.popular ? "#eab308" : "var(--text-main)" }}>{plan.title}</h3>

            <div style={{ display: "flex", flexDirection: "column", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "var(--text-main)" }}>₹{(plan.price || "").toString().replace("₹", "")}</span>
                <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>/{plan.period || "month"}</span>
              </div>

              {(plan.title?.toLowerCase().includes("annual") || plan.title?.toLowerCase().includes("yearly")) && (
                <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600, marginTop: "2px" }}>
                  Billed Annually (Commitment Plan)
                </span>
              )}
            </div>

            <ul style={{ paddingLeft: 20, margin: "0 0 32px 0", color: "var(--text-main)", fontSize: 14, lineHeight: "1.8" }}>
              {featuresArr.map((f, idx) => <li key={idx} style={{ marginBottom: 8 }}>{f}</li>)}

              {plan.startDate && plan.endDate && (
                <li style={{ marginBottom: 8, listStyleType: "none", marginLeft: "-20px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                  📅 Validity: {plan.startDate} to {plan.endDate}
                </li>
              )}

              {plan.terms && (
                <li style={{ marginBottom: 8, listStyleType: "none", marginLeft: "-20px", fontSize: "12px", borderTop: "1px dashed var(--border-color)", paddingTop: "8px", marginTop: "12px" }}>
                  <span 
                    onClick={() => setSelectedTermsItem({ ...plan, type: 'plan' })}
                    style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "underline" }}
                  >
                    📌 Terms & Conditions
                  </span>
                </li>
              )}
            </ul>

            {plan.workerId && (
              <div style={{ marginBottom: 20, padding: "10px 14px", backgroundColor: "var(--border)", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
                <FaUser size={18} style={{ color: "var(--primary)" }} />
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
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#10b981", fontWeight: 700, fontSize: 14 }}>
                <FaCheckCircle size={18} /> Active Subscription
              </div>
            </div>
          ) : isLoggedIn && sessionStorage.getItem("userRole") === "user" ? (
            <button 
              onClick={() => {
                setPayingPlan(plan);
                setAppliedCoupon("");
                setCouponSuccess("");
                setCouponError("");
                setDiscountAmount(0);
                setAgreedToTerms(false);
              }}
              style={{
                width: "100%", padding: "14px", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer",
                background: getButtonTheme(plan.color, false).bg,
                backgroundColor: getButtonTheme(plan.color, false).bg,
                color: getButtonTheme(plan.color, false).color,
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: getButtonTheme(plan.color, false).boxShadow,
                position: "relative"
              }}
            >
              {plan.btnText || "Subscribe Now"}
            </button>
          ) : (
            <button 
              onClick={() => {
                if (isLoggedIn) {
                  alert("🔑 Customer Account Required!\n\nLogging you out now. Please log in with a customer account to subscribe to premium plans.");
                  sessionStorage.clear();
                }
                navigate("/login");
              }}
              className="btn-secondary"
              style={{
                width: "100%", padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", border: "1px solid var(--border)"
              }}
            >
              <FaLock size={12} /> Unlock Plan & Subscribe
            </button>
          )}
        </div>
      );
    });
  };

  const renderOffersContent = () => {
    if (loading && offers.length === 0) {
      return [1, 2, 3, 4].map(i => <SkeletonOfferCard key={i} />);
    }
    if (offers.length === 0) {
      return (
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: "15px" }}>
          No active promo coupons available at the moment.
        </div>
      );
    }
    return offers.map((offer, i) => {
      const couponBg = "var(--bg-card)";
      const couponBorder = "1.5px dashed rgba(52, 211, 153, 0.6)";

      return (
        <div 
          key={offer._id || offer.id || i}
          className="premium-card coupon-card"
          style={{
            background: couponBg,
            borderRadius: 14,
            padding: 24,
            border: couponBorder,
            borderLeft: "8px solid #34d399",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.04)"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#34d399" }}>{offer.discount}</span>
              {offer.code && (
                <span style={{ backgroundColor: "rgba(52, 211, 153, 0.15)", color: "#34d399", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, fontFamily: "monospace" }}>
                  {offer.code}
                </span>
              )}
            </div>
            <h4 style={{ margin: "12px 0 4px 0", color: "var(--text-main)", fontSize: 16, fontWeight: 600 }}>{offer.desc}</h4>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{offer.expiry || offer.endDate}</p>
            {offer.startDate && offer.endDate && (
              <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                📅 Validity: {offer.startDate} to {offer.endDate}
              </p>
            )}
            {offer.terms && (
              <p style={{ margin: "10px 0 0 0", fontSize: 12, borderTop: "1px dashed rgba(52, 211, 153, 0.2)", paddingTop: "6px" }}>
                <span 
                  onClick={() => setSelectedTermsItem({ ...offer, type: 'offer' })}
                  style={{ color: "#34d399", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "underline" }}
                >
                  📌 Terms & Conditions
                </span>
              </p>
            )}
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
                fontWeight: 700, fontSize: 12, minWidth: 110,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px"
              }}
            >
              <FaLock size={10} /> Login to Copy
            </button>
          )}
        </div>
      );
    });
  };

  return (

    <div style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      <Navbar />

      <div className="dashboard-content" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>

        

        {/* Page Header */}

        <div style={{ textAlign: "center", marginBottom: 48 }}>

          <h1 style={{ color: "#1e3a8a", fontWeight: 800, fontSize: "36px", margin: "0 0 10px 0", letterSpacing: "-0.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>

            <FaTag style={{ color: "#dfb453" }} /> Plans & Seasonal Offers

          </h1>

          <p style={{ color: "rgba(49, 82, 91, 0.85)", fontSize: "16px", maxWidth: "600px", margin: "0 auto", fontWeight: 500 }}>

            Save big on your home utilities with customized annual service packages and active promotional discount coupons.

          </p>

        </div>




        {/* Pricing Segment */}

        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#2563eb", marginBottom: 32, textAlign: "center" }}>

          Choose Your Service Plan

        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30, marginBottom: 56, alignItems: "stretch" }}>

          {renderPlansContent()}

        </div>



        {/* 🛡️ Trust Signals Section */}

        <div style={{

          display: "grid",

          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",

          gap: 24,

          margin: "40px auto 64px auto",

          maxWidth: 700,

          padding: "28px",

          background: "var(--bg-card)",

          borderRadius: "20px",

          border: "1.5px solid var(--border-color)",

          backdropFilter: "blur(12px)",

          textAlign: "center"

        }}>

          <div>

            <div style={{ color: "var(--warning)", fontSize: "20px", marginBottom: "8px" }}>⭐ ⭐ ⭐ ⭐ ⭐</div>

            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>4.9/5 Average Rating</h4>

            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>From over 10,000+ satisfied homeowners</p>

          </div>

          <div style={{ borderLeft: "1px solid var(--border-color)" }}>

            <div style={{ fontSize: "24px", marginBottom: "6px" }}>🛡️</div>

            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>100% Satisfaction Guarantee</h4>

            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>Not satisfied? We will re-service for free</p>

          </div>

        </div>



        {/* Promotional Offers Section */}

        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#2563eb", marginBottom: 32, textAlign: "center" }}>

          Active Offers

        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {renderOffersContent()}
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

                backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", 

                borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "440px", 

                maxHeight: "85vh", overflowY: "auto", boxSizing: "border-box",

                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)", color: "var(--text-main)", position: "relative"

              }}

            >

              <button 

                onClick={() => { setPayingPlan(null); setAgreedToTerms(false); }}

                style={{

                  position: "absolute", top: "20px", right: "20px", backgroundColor: "rgba(0,0,0,0.05)", 

                  border: "none", color: "var(--text-muted)", width: "32px", height: "32px", borderRadius: "50%",

                  display: "flex", justifyContent: "center", alignItems: "center", fontSize: "16px", cursor: "pointer", transition: "all 0.2s"

                }}

                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.1)"; e.currentTarget.style.color = "var(--text-main)" }}

                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)"; e.currentTarget.style.color = "var(--text-muted)" }}

              >

                ✕

              </button>



              <div style={{ textAlign: "center", marginBottom: "28px" }}>

                <div style={{ display: "inline-flex", padding: "14px", backgroundColor: "rgba(37, 99, 235, 0.08)", borderRadius: "50%", marginBottom: "12px", border: "1px solid rgba(37, 99, 235, 0.15)" }}>

                  <FaCreditCard size={28} style={{ color: "var(--primary)" }} />

                </div>

                <h3 style={{ margin: "0 0 6px 0", fontSize: "24px", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.5px" }}>Secure Checkout</h3>

                <p style={{ margin: 0, fontSize: "16px", color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>

                  <span style={{ fontSize: "18px" }}>📦</span> {payingPlan.title}

                </p>

              </div>



              <form onSubmit={handlePayment} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* 1. Promo Code Section */}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", backgroundColor: "var(--bg-main)", borderRadius: "14px", border: "1px solid var(--border)" }}>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                    <span style={{ backgroundColor: "var(--primary)", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>1</span>

                    <label style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Apply Promo Code</label>

                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>

                    <input 

                      type="text" 

                      placeholder="e.g. DOCFREE, FESTIVE25" 

                      value={appliedCoupon} 

                      onChange={(e) => setAppliedCoupon(e.target.value.toUpperCase())}

                      style={{ flex: 1, padding: "12px 16px", borderRadius: "10px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-main)", color: "var(--text-main)", fontSize: "14px", fontWeight: 600, transition: "border-color 0.2s", outline: "none" }}

                      onFocus={(e) => e.target.style.borderColor = "var(--primary)"}

                      onBlur={(e) => e.target.style.borderColor = "var(--border)"}

                    />

                    <button 

                      type="button" 

                      onClick={applyPromoCode}

                      style={{ padding: "0 20px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", transition: "transform 0.1s, box-shadow 0.2s", boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)" }}

                      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}

                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}

                    >

                      Apply

                    </button>

                  </div>

                  {couponError && <span style={{ fontSize: "12px", color: "var(--danger)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>❌ {couponError}</span>}

                  {couponSuccess && <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>✅ {couponSuccess}</span>}

                </div>



                {/* 2. Payment Method Section */}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", backgroundColor: "var(--bg-main)", borderRadius: "14px", border: "1px solid var(--border)" }}>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                    <span style={{ backgroundColor: "var(--primary)", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>2</span>

                    <label style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Payment Method</label>

                  </div>

                  <select 

                    value={paymentMethod} 

                    onChange={(e) => setPaymentMethod(e.target.value)}

                    style={{ padding: "12px 16px", borderRadius: "10px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-main)", color: "var(--text-main)", fontSize: "14px", fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none" }}

                    onFocus={(e) => e.target.style.borderColor = "var(--primary)"}

                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}

                  >

                    <option value="UPI">📱 UPI App / ID</option>

                    <option value="Wallet">💳 Wallet (Balance: ₹{walletBal.toLocaleString()})</option>

                    <option value="Card">🏦 Credit / Debit Card</option>

                    <option value="Net Banking">🌐 Net Banking</option>

                  </select>



                {/* Conditional Fields */}

                {paymentMethod === "UPI" && (

                  <input 

                    type="text" 

                    placeholder="Enter UPI ID (e.g. username@okaxis)" 

                    value={upiId} 

                    onChange={(e) => setUpiId(e.target.value)}

                    required

                    style={{ padding: "12px 16px", borderRadius: "10px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-main)", color: "var(--text-main)", fontSize: "14px", outline: "none" }}

                    onFocus={(e) => e.target.style.borderColor = "var(--primary)"}

                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}

                  />

                )}



                {paymentMethod === "Card" && (

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", backgroundColor: "var(--bg-main)", borderRadius: "12px", border: "1px solid var(--border)" }}>

                    <input 

                      type="text" 

                      placeholder="Card Number (e.g. 4111 2222 3333 4444)" 

                      value={cardNumber} 

                      onChange={(e) => setCardNumber(e.target.value)}

                      maxLength="19"

                      required

                      style={{ padding: "12px", borderRadius: "8px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)", outline: "none" }}

                      onFocus={(e) => e.target.style.borderColor = "var(--primary)"}

                      onBlur={(e) => e.target.style.borderColor = "var(--border)"}

                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

                      <input 

                        type="text" 

                        placeholder="MM/YY" 

                        value={cardExpiry} 

                        onChange={(e) => setCardExpiry(e.target.value)}

                        maxLength="5"

                        required

                        style={{ padding: "12px", borderRadius: "8px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)", outline: "none" }}

                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}

                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}

                      />

                      <input 

                        type="password" 

                        placeholder="CVV" 

                        value={cardCvv} 

                        onChange={(e) => setCardCvv(e.target.value)}

                        maxLength="3"

                        required

                        style={{ padding: "12px", borderRadius: "8px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)", outline: "none" }}

                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}

                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}

                      />

                    </div>

                  </div>

                )}



                {paymentMethod === "Net Banking" && (

                  <select 

                    value={netBank} 

                    onChange={(e) => setNetBank(e.target.value)}

                    style={{ padding: "12px 16px", borderRadius: "10px", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-main)", color: "var(--text-main)", outline: "none" }}

                    onFocus={(e) => e.target.style.borderColor = "var(--primary)"}

                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}

                  >

                    <option value="SBI">State Bank of India (SBI)</option>

                    <option value="HDFC">HDFC Bank</option>

                    <option value="ICICI">ICICI Bank</option>

                    <option value="AXIS">Axis Bank</option>

                  </select>

                )}



                {paymentMethod === "Wallet" && (

                  <div style={{ padding: "12px 14px", backgroundColor: "rgba(49, 82, 91, 0.08)", borderRadius: "10px", border: "1px solid rgba(49, 82, 91, 0.2)", fontSize: "13px" }}>

                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "4px" }}>

                      <span>Current Wallet Balance</span>

                      <strong style={{ color: "var(--text-main)" }}>₹{walletBal.toLocaleString()}</strong>

                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "4px" }}>

                      <span>Subscription Deduction</span>

                      <strong style={{ color: "var(--danger)" }}>- ₹{Math.max(0, (parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0) - discountAmount).toLocaleString()}</strong>

                    </div>

                    <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "6px 0" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>

                      <span>Remaining Wallet Balance</span>

                      <strong style={{ color: walletBal >= Math.max(0, (parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0) - discountAmount) ? "#10b981" : "#ef4444" }}>

                        ₹{Math.max(0, walletBal - Math.max(0, (parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0) - discountAmount)).toLocaleString()}

                      </strong>

                    </div>

                    {walletBal < Math.max(0, (parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0) - discountAmount) && (

                      <div style={{ color: "var(--danger)", fontSize: "12px", fontWeight: 700, marginTop: "6px" }}>

                        ⚠️ Insufficient Wallet Balance! Please select UPI/Card or add funds.

                      </div>

                    )}

                  </div>

                )}



                </div>



                {/* 3. Pricing Summary & Terms Section */}

                <div style={{ backgroundColor: "rgba(16, 185, 129, 0.05)", borderRadius: "14px", padding: "16px", fontSize: "14px", border: "1.5px solid rgba(16, 185, 129, 0.2)" }}>

                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontWeight: "600" }}>

                    <span>Base Price</span>

                    <span style={{ color: "var(--text-main)" }}>{payingPlan.price}</span>

                  </div>

                  {discountAmount > 0 && (

                    <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981", marginTop: "8px", fontWeight: "700" }}>

                      <span>Discount Coupon</span>

                      <span>- ₹{discountAmount}</span>

                    </div>

                  )}

                  <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "14px 0" }}></div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "800", color: "var(--text-main)" }}>

                    <span>Total Amount</span>

                    <span>₹{Math.max(0, (parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0) - discountAmount)}</span>

                  </div>



                  <div style={{ height: "1.5px", backgroundColor: "rgba(16, 185, 129, 0.2)", margin: "14px 0" }}></div>

                  

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                    {/* Terms and Conditions Acceptance Checkbox */}

                    {payingPlan.terms && (

                  <button 

                    type="button"

                    onClick={() => setSelectedTermsItem(payingPlan)}

                    style={{ 

                      display: "flex", alignItems: "center", justifyContent: "space-between",

                      backgroundColor: "rgba(245, 158, 11, 0.05)", padding: "12px 16px", borderRadius: "10px", 

                      border: "1px dashed rgba(245, 158, 11, 0.4)", cursor: "pointer", width: "100%",

                      transition: "all 0.2s"

                    }}

                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.1)"}

                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.05)"}

                  >

                    <strong style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--warning)", fontSize: "13px" }}>

                      📌 View Terms & Conditions

                    </strong>

                    <span style={{ color: "var(--warning)", fontSize: "12px" }}>Click to read ›</span>

                  </button>

                )}

                

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>

                  <input 

                    type="checkbox" 

                    id="agreeTerms" 

                    checked={agreedToTerms} 

                    onChange={(e) => setAgreedToTerms(e.target.checked)}

                    style={{ width: "18px", height: "18px", cursor: "pointer", flexShrink: 0, margin: 0, accentColor: "var(--primary)" }}

                  />

                  <label htmlFor="agreeTerms" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)", cursor: "pointer", userSelect: "none", lineHeight: "1.2" }}>

                    I read and agree to the plan terms.

                  </label>

                </div>



                {(() => {
                  const isPayDisabled = paymentProcessing || (payingPlan.terms && !agreedToTerms);
                  const btnTheme = getButtonTheme(payingPlan.color, isPayDisabled);
                  return (
                    <button 
                      type="submit" 
                      disabled={isPayDisabled}
                      style={{
                        width: "100%", padding: "16px", border: "none", borderRadius: "12px", marginTop: "4px",
                        fontSize: "16px", fontWeight: 800, cursor: isPayDisabled ? "not-allowed" : "pointer",
                        background: btnTheme.bg,
                        backgroundColor: btnTheme.bg,
                        color: btnTheme.color, 
                        transition: "all 0.2s", 
                        boxShadow: btnTheme.boxShadow, 
                        opacity: paymentProcessing ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => { if (!isPayDisabled) e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={(e) => { if (!isPayDisabled) e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                      {paymentProcessing ? "Verifying Payment Details... ⚡" : `Confirm & Pay ₹${Math.max(0, (parseInt(payingPlan.price.replace(/[^\d]/g, ""), 10) || 0) - discountAmount)} Now`}
                    </button>
                  );
                })()}

                  </div>

                </div>

              </form>

            </div>

          </div>

        )}



        {/* 📌 TERMS & CONDITIONS DETAILS MODAL */}

        {selectedTermsItem && (

          <div 

            style={{

              position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 

              backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", 

              zIndex: 1200, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"

            }}

          >

            <div 

              className="premium-card"

              style={{

                backgroundColor: "var(--bg-card)", border: "1.5px solid var(--border)", 

                borderRadius: "16px", padding: "30px", width: "100%", maxWidth: "460px", 

                maxHeight: "85vh", overflowY: "auto", boxSizing: "border-box",

                boxShadow: "var(--shadow-3d)", color: "var(--text-main)", position: "relative"

              }}

            >

              <button 

                onClick={() => setSelectedTermsItem(null)}

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

                <span style={{ fontSize: "36px", display: "block", marginBottom: "10px" }}>📌</span>

                <h3 style={{ margin: "10px 0 6px 0", fontSize: "20px", fontWeight: 800 }}>

                  {selectedTermsItem.type === 'plan' ? "Plan Details & Terms" : "Offer Details & Terms"}

                </h3>

                <h4 style={{ margin: 0, fontSize: "16px", color: selectedTermsItem.type === 'plan' ? "#2563eb" : "#10b981", fontWeight: 700 }}>

                  {selectedTermsItem.title || selectedTermsItem.code}

                </h4>

              </div>



              <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>

                {/* Price / Discount Info */}

                <div style={{ backgroundColor: "var(--border)", borderRadius: "8px", padding: "12px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>

                  <span style={{ fontWeight: 600 }}>Rate / Benefit:</span>

                  <strong style={{ color: "var(--text-main)" }}>{selectedTermsItem.price || selectedTermsItem.discount}</strong>

                </div>



                {/* Offer Constraints Details */}

                {selectedTermsItem.type === 'offer' && (

                  <>

                    {selectedTermsItem.minPrice > 0 && (

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                        <span>💰</span>

                        <div>

                          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>MINIMUM PURCHASE REQUIRED</p>

                          <p style={{ margin: 0, color: "var(--text-main)", fontWeight: 500 }}>₹{selectedTermsItem.minPrice}</p>

                        </div>

                      </div>

                    )}

                    {selectedTermsItem.validServices && selectedTermsItem.validServices.trim() !== "" && (

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                        <span>🛠️</span>

                        <div>

                          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>VALID SERVICES</p>

                          <p style={{ margin: 0, color: "var(--text-main)", fontWeight: 500 }}>{selectedTermsItem.validServices}</p>

                        </div>

                      </div>

                    )}

                    {selectedTermsItem.city && selectedTermsItem.city.trim() !== "" && selectedTermsItem.city.toLowerCase() !== "all" && (

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                        <span>📍</span>

                        <div>

                          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>TARGET LOCATION</p>

                          <p style={{ margin: 0, color: "var(--text-main)", fontWeight: 500 }}>{selectedTermsItem.city}</p>

                        </div>

                      </div>

                    )}

                  </>

                )}



                {/* Validity Dates */}

                {selectedTermsItem.startDate && selectedTermsItem.endDate && (

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                    <span>📅</span>

                    <div>

                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>VALIDITY PERIOD</p>

                      <p style={{ margin: 0, color: "var(--text-main)", fontWeight: 500 }}>{selectedTermsItem.startDate} to {selectedTermsItem.endDate}</p>

                    </div>

                  </div>

                )}



                {/* Detailed Terms */}

                <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px", marginTop: "4px" }}>

                  <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>DETAILED TERMS & CONDITIONS</p>

                  <div style={{ 

                    maxHeight: "150px", overflowY: "auto", fontSize: "13px", 

                    lineHeight: "1.6", color: "var(--text-main)", fontStyle: "italic", 

                    backgroundColor: "rgba(0,0,0,0.02)", padding: "12px", borderRadius: "8px", 

                    border: "1px solid var(--border)"

                  }}>

                    {selectedTermsItem.terms || "No special terms and conditions apply to this subscription plan or offer code."}

                  </div>

                </div>



                <button 

                  onClick={() => setSelectedTermsItem(null)}

                  style={{

                    width: "100%", padding: "12px", border: "none", borderRadius: "10px", 

                    fontSize: "14px", fontWeight: 700, cursor: "pointer",

                    backgroundColor: selectedTermsItem.type === 'plan' ? "#2563eb" : "#10b981", color: "white", 

                    transition: "all 0.2s", marginTop: "8px"

                  }}

                >

                  Close Info

                </button>

              </div>

            </div>

          </div>

        )}



      </div>

    </div>

  );

}



export default PlansOffers;


