import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const POINTS_PER_REVIEW = 50;



const REWARDS = [
  {
    id: 1,
    title: "₹50 Off Next Booking",
    points: 100,
    icon: "🎟️",
    color: "var(--primary)",
    bg: "#f0fdf4",
    desc: "Redeem on any service booking"
  },
  {
    id: 2,
    title: "Free Priority Slot",
    points: 150,
    icon: "⚡",
    color: "#2563eb",
    bg: "#eff6ff",
    desc: "Skip the queue on your next booking"
  },
  {
    id: 3,
    title: "₹100 Payment Cashback",
    points: 200,
    icon: "💸",
    color: "#d97706",
    bg: "#fffbeb",
    desc: "Get cashback on your next payment"
  },
  {
    id: 4,
    title: "VIP Worker Access",
    points: 300,
    icon: "👑",
    color: "#7c3aed",
    bg: "#f5f3ff",
    desc: "Access top-rated premium workers"
  }
];

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            fontSize: "26px",
            cursor: "pointer",
            color: star <= (hovered || value) ? "#f59e0b" : "#d1d5db",
            transition: "color 0.15s"
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewsRewards() {
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [redeemedRewards, setRedeemedRewards] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
     const loadData = async () => {
        const cId = sessionStorage.getItem("userId");
        const cName = sessionStorage.getItem("userName") || "Verified Client";
        if (!cId) return;
        try {
           // 🔥 FETCH AUTHENTIC HISTORY: Load physical reviews & validated completed bookings!
           const [rResp, bResp] = await Promise.all([
              fetch(`/api/reviews?customer_name=${encodeURIComponent(cName)}`),
              fetch(`/api/bookings?customer_id=${cId}`)
           ]);
           
           const rData = await rResp.json();
           const bData = await bResp.json();

           if (Array.isArray(rData)) setReviews(rData);
           if (Array.isArray(bData)) {
              // Filter only Completed items flawlessly!
              setBookings(bData.filter(b => b.status === "Completed" || b.status === "Paid Out"));
           }
        } catch(err) { console.error("Live rewards fetch failed."); }
     };
     loadData();
  }, []);

  const totalPoints = reviews.length * POINTS_PER_REVIEW;
  const spentPoints = redeemedRewards.reduce((sum, r) => sum + r.points, 0);
  const availablePoints = totalPoints - spentPoints;

  const maxPoints = 300;
  const progressPct = Math.min((availablePoints / maxPoints) * 100, 100);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const submitReview = async (bookingObj) => {
    const bid = bookingObj._id || bookingObj.id;
    const draft = drafts[bid] || {};
    if (!draft.rating || draft.rating === 0) {
      showToast("⚠️ Please select a star rating first!");
      return;
    }

    try {
       // 🔥 LIVE CLOUD COMMITMENT: Write hard record to MongoDB!
       const resp = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             booking_id: bid,
             service: bookingObj.service,
             worker_id: bookingObj.worker_id,
             customer_name: sessionStorage.getItem("userName") || "Verified Client",
             rating: draft.rating,
             comment: draft.comment || ""
          })
       });

       if (!resp.ok) throw new Error("Post fail");
       const savedReview = await resp.json();

       // 🏆 Hydrate Live State natively flawlessly!
       setReviews((prev) => [savedReview, ...prev]);

       // Record absolute physical cash-back award in cloud instantly flawlessly!
       await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             customer: sessionStorage.getItem("userName") || "Verified Client",
             worker: bookingObj.worker_id,
             service: `Review Reward - ${bookingObj.service}`,
             amount: POINTS_PER_REVIEW,
             status: "Added",
             method: "Cashback"
          })
       });

       showToast(`✅ Review submitted! ₹${POINTS_PER_REVIEW} added to Wallet & Rewards increased!`);
    } catch(err) { showToast("🛑 Sync Error: Review write failed."); }
  };



  const redeemReward = async (reward) => {
    if (availablePoints < reward.points) {
      showToast(`❌ Not enough points! You need ${reward.points} pts (you have ${availablePoints}).`);
      return;
    }
    if (redeemedRewards.find((r) => r.id === reward.id)) {
      showToast("✅ Already redeemed this reward!");
      return;
    }
    setRedeemedRewards((prev) => [...prev, reward]);

    // If it's the cashback reward, actually add it to the wallet
    if (reward.title.includes("Cashback") || reward.title.includes("Off")) {
      const amount = reward.title.includes("100") ? 100 : 50;
      // Dispatch hard physical redemption write effortlessly seamlessly flawlessly instantly!
      await fetch("/api/transactions", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            customer: sessionStorage.getItem("userName") || "Verified Client",
            worker: "Loyalty Portal",
            service: `Redeemed: ${reward.title}`,
            amount: amount,
            status: "Added",
            method: "Reward"
         })
      });
      showToast(`✅ "${reward.title}" redeemed! ₹${amount} was added to your wallet.`);
    } else {
      showToast(`✅ "${reward.title}" redeemed! Applied to your account.`);
    }
  };

  const pendingReviews = bookings.filter(b => !reviews.some(r => r.booking_id === (b._id || b.id)));
  const doneReviews = reviews;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', 'Segoe UI', sans-serif"
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#1e293b",
            color: "white",
            padding: "14px 20px",
            borderRadius: "10px",
            zIndex: 9999,
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            animation: "fadeIn 0.3s"
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
          color: "white",
          padding: "40px 24px 30px 24px"
        }}
      >
        <Link
          to="/"
          style={{
            color: "#c4b5fd",
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
          🎁 Reviews & Rewards
        </h1>
        <p style={{ margin: 0, color: "#c4b5fd", fontSize: "14px" }}>
          Review your completed services — earn points — redeem on bookings & payments!
        </p>
      </div>

      <div style={{ maxWidth: "750px", margin: "0 auto", padding: "28px 20px" }}>

        {/* Points Dashboard */}
        <div
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
            borderRadius: "16px",
            padding: "24px",
            color: "white",
            marginBottom: "28px",
            boxShadow: "0 8px 24px rgba(124,58,237,0.25)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#c4b5fd" }}>Available Points</p>
              <h2 style={{ margin: 0, fontSize: "42px", fontWeight: 900 }}>⭐ {availablePoints}</h2>
              <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#c4b5fd" }}>
                Total earned: {totalPoints} pts &nbsp;|&nbsp; Spent: {spentPoints} pts
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#c4b5fd" }}>Next reward at 300 pts</p>
              <div
                style={{
                  width: "160px",
                  height: "10px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: "10px",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #a78bfa, #f0abfc)",
                    borderRadius: "10px",
                    transition: "width 0.5s ease"
                  }}
                />
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#c4b5fd" }}>
                {availablePoints}/{maxPoints} pts
              </p>
            </div>
          </div>

          {/* How to earn */}
          <div
            style={{
              marginTop: "16px",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#e9d5ff"
            }}
          >
            💡 <strong>How to earn:</strong> Submit a review after each completed service → earn <strong>+{POINTS_PER_REVIEW} pts</strong> per review
          </div>
        </div>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 14px 0" }}>
              ✍️ Pending Reviews ({pendingReviews.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {pendingReviews.map((r) => {
                const bid = r._id || r.id;
                return (
                  <div
                    key={bid}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "14px",
                      padding: "20px",
                      border: "2px dashed #c4b5fd",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                          {r.service}
                        </h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>👷 Service Expert · 📅 {r.date}</p>
                      </div>
                      <span
                        style={{
                          backgroundColor: "#fef3c7",
                          color: "#d97706",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 700
                        }}
                      >
                        +{POINTS_PER_REVIEW} pts waiting
                      </span>
                    </div>

                    <StarPicker
                      value={drafts[bid]?.rating || 0}
                      onChange={(val) =>
                        setDrafts((prev) => ({ ...prev, [bid]: { ...prev[bid], rating: val } }))
                      }
                    />

                    <textarea
                      placeholder="Share your experience (optional)..."
                      value={drafts[bid]?.comment || ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [bid]: { ...prev[bid], comment: e.target.value }
                        }))
                      }
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "14px",
                        resize: "vertical",
                        boxSizing: "border-box",
                        marginBottom: "12px",
                        fontFamily: "inherit"
                      }}
                    />

                    <button
                      onClick={() => submitReview(r)}
                      style={{
                        padding: "10px 22px",
                        background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor: "pointer"
                      }}
                    >
                      Submit Review & Earn {POINTS_PER_REVIEW} pts ⭐
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Redeem Rewards */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
            🎁 Redeem Rewards
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 14px 0" }}>
            Use your points on bookings, payments & priority slots
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "14px"
            }}
          >
            {REWARDS.map((reward) => {
              const redeemed = redeemedRewards.find((r) => r.id === reward.id);
              const canRedeem = availablePoints >= reward.points;
              return (
                <div
                  key={reward.id}
                  style={{
                    backgroundColor: redeemed ? "#f0fdf4" : reward.bg,
                    border: `2px solid ${redeemed ? "#16a34a" : canRedeem ? reward.color : "#e2e8f0"}`,
                    borderRadius: "14px",
                    padding: "18px",
                    opacity: !canRedeem && !redeemed ? 0.6 : 1,
                    transition: "transform 0.2s",
                    cursor: canRedeem && !redeemed ? "pointer" : "default"
                  }}
                  onMouseEnter={(e) => { if (canRedeem && !redeemed) e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ fontSize: "30px", marginBottom: "8px" }}>{reward.icon}</div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                    {reward.title}
                  </h3>
                  <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#64748b" }}>{reward.desc}</p>
                  <p style={{ margin: "0 0 12px 0", fontWeight: 700, color: reward.color, fontSize: "13px" }}>
                    {reward.points} pts required
                  </p>
                  {redeemed ? (
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "#dcfce7",
                        color: "#16a34a",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700
                      }}
                    >
                      ✅ Redeemed
                    </span>
                  ) : (
                    <button
                      onClick={() => redeemReward(reward)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        backgroundColor: canRedeem ? reward.color : "#94a3b8",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: canRedeem ? "pointer" : "not-allowed"
                      }}
                    >
                      {canRedeem ? "Redeem Now" : `Need ${reward.points - availablePoints} more pts`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Past Reviews */}
        {doneReviews.length > 0 && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 14px 0" }}>
              📝 Your Reviews
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {doneReviews.map((r) => (
                <div
                  key={r._id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                        {r.service || "Professional Service"}
                      </h3>
                      <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>👷 Verified Partner · 📅 {r.date}</p>
                    </div>
                    <span
                      style={{
                        backgroundColor: "#dcfce7",
                        color: "#16a34a",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700
                      }}
                    >
                      +{POINTS_PER_REVIEW} pts earned ✅
                    </span>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <span style={{ color: "#f59e0b", fontSize: "18px" }}>
                      {"★".repeat(r.rating || 5)}{"☆".repeat(5 - (r.rating || 5))}
                    </span>
                    {r.comment && (
                      <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#475569", fontStyle: "italic" }}>
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewsRewards;
