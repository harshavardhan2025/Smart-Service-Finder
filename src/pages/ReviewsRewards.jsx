import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { addToWallet } from "../utils/wallet";

const POINTS_PER_REVIEW = 50;
const MAX_COMMENT_LENGTH = 1000;
const REDEEMED_STORAGE_KEY = "reviews_rewards_redeemed_v2";

const REWARDS = [
  {
    id: "booking_discount_50",
    title: "₹50 Off Next Booking",
    points: 100,
    icon: "🎟️",
    color: "var(--primary)",
    bg: "#f0fdf4",
    desc: "Redeem on any service booking",
    type: "booking_discount",
    amount: 50,
  },
  {
    id: "priority_slot",
    title: "Free Priority Slot",
    points: 150,
    icon: "⚡",
    color: "#2563eb",
    bg: "#eff6ff",
    desc: "Skip the queue on your next booking",
    type: "priority_slot",
  },
  {
    id: "payment_cashback_100",
    title: "₹100 Payment Cashback",
    points: 200,
    icon: "💸",
    color: "var(--warning)",
    bg: "#fffbeb",
    desc: "Get cashback on your next payment",
    type: "payment_cashback",
    amount: 100,
  },
  {
    id: "vip_worker_access",
    title: "VIP Worker Access",
    points: 300,
    icon: "👑",
    color: "#7c3aed",
    bg: "#f5f3ff",
    desc: "Access top-rated premium workers",
    type: "vip_access",
  },
];

/* ============================================================
   HELPERS
============================================================ */

const getId = (item) => {
  if (!item) return null;
  return item._id ?? item.id ?? null;
};

const normalizeId = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const normalizeRating = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 5;
  }
  return Math.min(5, Math.max(1, Math.round(number)));
};

const normalizeStatus = (status) => {
  return String(status || "").trim().toLowerCase();
};

const isCompletedBooking = (booking) => {
  const status = normalizeStatus(booking?.status);
  return status === "completed" || status === "paid out";
};

const safeJson = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/* ============================================================
   STAR SLIDER
============================================================ */

function StarSlider({ value, onChange, disabled = false }) {
  const rating = normalizeRating(value);
  const percentage = ((rating - 1) / 4) * 100;

  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 750, color: "var(--text-secondary)", marginBottom: "7px" }}>
        Adjust Star Rating:
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={rating}
          disabled={disabled}
          onChange={(event) => onChange(normalizeRating(event.target.value))}
          aria-label="Review rating"
          style={{
            flex: 1,
            minWidth: "170px",
            height: "8px",
            borderRadius: "4px",
            background: `linear-gradient(90deg, #f59e0b ${percentage}%, #e2e8f0 ${percentage}%)`,
            outline: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            accentColor: "#f59e0b",
            opacity: disabled ? 0.6 : 1,
          }}
        />
        <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              style={{
                padding: 0,
                margin: 0,
                background: "transparent",
                border: "none",
                boxShadow: "none",
                color: star <= rating ? "#f59e0b" : "#cbd5e1",
                fontSize: "22px",
                lineHeight: 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              ★
            </button>
          ))}
          <span style={{ marginLeft: "7px", fontWeight: 800, fontSize: "14px", color: "var(--warning)", whiteSpace: "nowrap" }}>
            ({rating} Star{rating > 1 ? "s" : ""})
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

function ReviewsRewards() {
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [redeemedRewards, setRedeemedRewards] = useState(() => {
    try {
      const stored = localStorage.getItem(REDEEMED_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submittingReviews, setSubmittingReviews] = useState({});
  const [redeemingRewards, setRedeemingRewards] = useState({});
  const toastTimerRef = useRef(null);

  /* ==========================================================
     TOAST
  ========================================================== */

  const showToast = (message) => {
    setToast(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToast("");
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  /* ==========================================================
     PERSIST REDEEMED REWARDS
  ========================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(REDEEMED_STORAGE_KEY, JSON.stringify(redeemedRewards));
    } catch (error) {
      console.error("Failed to persist redeemed rewards:", error);
    }
  }, [redeemedRewards]);

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      const customerId = sessionStorage.getItem("userId");
      const customerName = sessionStorage.getItem("userName") || "Verified Client";
      if (!customerId) {
        setLoadError("Your session has expired. Please login again.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError("");
      try {
        const [reviewsResponse, bookingsResponse] = await Promise.all([
          fetch(`/api/reviews?customer_name=${encodeURIComponent(customerName)}`, {
            headers: { Accept: "application/json" },
          }),
          fetch(`/api/bookings?customer_id=${encodeURIComponent(customerId)}`, {
            headers: { Accept: "application/json" },
          }),
        ]);

        if (!reviewsResponse.ok) {
          throw new Error(`Reviews API failed (${reviewsResponse.status})`);
        }
        if (!bookingsResponse.ok) {
          throw new Error(`Bookings API failed (${bookingsResponse.status})`);
        }

        const reviewsData = await safeJson(reviewsResponse);
        const bookingsData = await safeJson(bookingsResponse);

        if (cancelled) return;

        const validReviews = Array.isArray(reviewsData) ? reviewsData.filter(Boolean) : [];
        const validBookings = Array.isArray(bookingsData) ? bookingsData.filter(Boolean) : [];
        const completedBookings = validBookings.filter(isCompletedBooking);

        setReviews(validReviews);
        setBookings(completedBookings);
      } catch (error) {
        console.error("Reviews & Rewards loading failed:", error);
        if (!cancelled) {
          setLoadError("Unable to load your reviews and rewards. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     CLEAN DUPLICATE REVIEW RECORDS FOR DISPLAY
  ========================================================== */

  const uniqueReviews = useMemo(() => {
    const map = new Map();
    for (const review of reviews) {
      const bookingId = normalizeId(review?.booking_id);
      const key = bookingId || normalizeId(getId(review));
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, review);
      }
    }
    return Array.from(map.values());
  }, [reviews]);

  /* ==========================================================
     POINTS
  ========================================================== */

  const totalPoints = uniqueReviews.length * POINTS_PER_REVIEW;
  const spentPoints = redeemedRewards.reduce(
    (total, reward) => total + Number(reward?.points || 0),
    0
  );
  const availablePoints = Math.max(0, totalPoints - spentPoints);
  const maxPoints = 300;
  const progressPct = Math.min(100, Math.max(0, (availablePoints / maxPoints) * 100));

  /* ==========================================================
     PENDING REVIEWS
  ========================================================== */

  const pendingReviews = useMemo(() => {
    const reviewedBookingIds = new Set(
      uniqueReviews.map((review) => normalizeId(review?.booking_id)).filter(Boolean)
    );
    return bookings.filter((booking) => {
      const bookingId = normalizeId(getId(booking));
      if (!bookingId) return false;
      return !reviewedBookingIds.has(bookingId);
    });
  }, [bookings, uniqueReviews]);

  /* ==========================================================
     SUBMIT REVIEW
  ========================================================== */

  const submitReview = async (booking) => {
    const bookingId = normalizeId(getId(booking));
    if (!bookingId) {
      showToast("❌ Invalid booking. Review cannot be submitted.");
      return;
    }
    if (submittingReviews[bookingId]) return;

    const alreadyReviewed = uniqueReviews.some(
      (review) => normalizeId(review?.booking_id) === bookingId
    );
    if (alreadyReviewed) {
      showToast("✅ This booking has already been reviewed.");
      return;
    }
    if (!isCompletedBooking(booking)) {
      showToast("❌ You can review only completed services.");
      return;
    }

    const draft = drafts[bookingId] || {};
    const rating = normalizeRating(draft.rating);
    const comment = String(draft.comment || "").trim().slice(0, MAX_COMMENT_LENGTH);
    const customerId = sessionStorage.getItem("userId");
    const customerName = sessionStorage.getItem("userName") || "Verified Client";

    setSubmittingReviews((prev) => ({ ...prev, [bookingId]: true }));

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          booking_id: bookingId,
          service: booking.service || "Professional Service",
          worker_id: booking.worker_id || booking.workerId || null,
          customer_id: customerId,
          customer_name: customerName,
          rating,
          comment,
          date: booking.date || new Date().toLocaleDateString("en-CA"),
        }),
      });

      const data = await safeJson(response);
      if (!response.ok) {
        const serverMessage = data?.error || data?.message;
        throw new Error(serverMessage || `Review submission failed (${response.status})`);
      }

      const savedReview = data;
      if (!savedReview) {
        throw new Error("Server returned an empty review.");
      }

      const savedBookingId = normalizeId(savedReview?.booking_id);
      if (savedBookingId && savedBookingId !== bookingId) {
        throw new Error("Server returned an invalid review record.");
      }

      setReviews((prev) => {
        const exists = prev.some((review) => normalizeId(review?.booking_id) === bookingId);
        if (exists) return prev;
        return [savedReview, ...prev];
      });

      setDrafts((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });

      try {
        await addToWallet(
          POINTS_PER_REVIEW,
          `Review Reward - ${booking.service || "Professional Service"}`,
          "Cashback"
        );
      } catch (walletError) {
        console.error("Wallet reward failed after review:", walletError);
        showToast(
          `⚠️ Review submitted successfully, but ₹${POINTS_PER_REVIEW} wallet cashback could not be added.`
        );
        return;
      }

      showToast(
        `✅ Review submitted! +${POINTS_PER_REVIEW} points and ₹${POINTS_PER_REVIEW} wallet cashback added.`
      );
    } catch (error) {
      console.error("Review submission failed:", error);
      showToast(`❌ ${error?.message || "Review submission failed."}`);
    } finally {
      setSubmittingReviews((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  /* ==========================================================
     REDEEM REWARD
  ========================================================== */

  const redeemReward = async (reward) => {
    if (!reward) return;
    const rewardId = String(reward.id);
    if (redeemingRewards[rewardId]) return;

    const alreadyRedeemed = redeemedRewards.some((item) => String(item?.id) === rewardId);
    if (alreadyRedeemed) {
      showToast("✅ This reward has already been redeemed.");
      return;
    }
    if (availablePoints < Number(reward.points)) {
      showToast(`❌ You need ${Number(reward.points) - availablePoints} more points.`);
      return;
    }

    setRedeemingRewards((prev) => ({ ...prev, [rewardId]: true }));

    try {
      if (reward.type === "payment_cashback") {
        await addToWallet(
          Number(reward.amount),
          `Redeemed Reward: ${reward.title}`,
          "Reward Cashback"
        );
        showToast(`✅ ${reward.title} redeemed! ₹${reward.amount} added to your wallet.`);
      } else if (reward.type === "booking_discount") {
        showToast(`🎟️ ${reward.title} redeemed successfully.`);
      } else if (reward.type === "priority_slot") {
        showToast(`⚡ ${reward.title} redeemed successfully.`);
      } else if (reward.type === "vip_access") {
        showToast(`👑 ${reward.title} redeemed successfully.`);
      }

      setRedeemedRewards((prev) => [
        ...prev,
        {
          id: rewardId,
          title: reward.title,
          points: Number(reward.points),
          type: reward.type,
          amount: reward.amount || null,
          redeemedAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Reward redemption failed:", error);
      showToast(`❌ ${error?.message || "Reward redemption failed. Your points were not deducted."}`);
    } finally {
      setRedeemingRewards((prev) => ({ ...prev, [rewardId]: false }));
    }
  };

  /* ==========================================================
     FILTERED REVIEWS
  ========================================================== */

  const filteredReviews = useMemo(() => {
    return uniqueReviews.filter((review) => {
      const rating = normalizeRating(review?.rating);
      if (filterType === "positive") return rating >= 4;
      if (filterType === "critical") return rating <= 3;
      return true;
    });
  }, [uniqueReviews, filterType]);

  const doneReviews = uniqueReviews;

  /* ==========================================================
     SENTIMENT
  ========================================================== */

  const getSentiment = (review) => {
    const rating = normalizeRating(review?.rating);
    const comment = String(review?.comment || "").toLowerCase();

    if (rating === 5) {
      return {
        label: "Exemplary Partner",
        bg: "#ecfdf5",
        color: "#047857",
        border: "#a7f3d0",
      };
    }
    if (rating <= 3) {
      return {
        label: "Needs Attention",
        bg: "#fff5f5",
        color: "#e53e3e",
        border: "#fed7d7",
      };
    }
    if (comment.includes("quick") || comment.includes("fast")) {
      return {
        label: "Super Fast Service",
        bg: "#f5f3ff",
        color: "#6d28d9",
        border: "#ddd6fe",
      };
    }
    return {
      label: "Punctual",
      bg: "#eff6ff",
      color: "#1d4ed8",
      border: "#bfdbfe",
    };
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--bg-card-hover)",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
            padding: "40px 24px 30px",
            color: "white",
          }}
        >
          <div style={{ maxWidth: "750px", margin: "0 auto" }}>
            <div style={{ width: "180px", height: "14px", borderRadius: "10px", background: "rgba(255,255,255,.15)", marginBottom: "18px" }} />
            <div style={{ width: "300px", height: "32px", borderRadius: "10px", background: "rgba(255,255,255,.15)", marginBottom: "12px" }} />
            <div style={{ width: "430px", maxWidth: "90%", height: "13px", borderRadius: "10px", background: "rgba(255,255,255,.12)" }} />
          </div>
        </div>
        <div style={{ maxWidth: "750px", margin: "0 auto", padding: "28px 20px" }}>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              style={{
                height: item === 1 ? "150px" : "110px",
                background: "var(--bg-card)",
                borderRadius: "15px",
                marginBottom: "16px",
                border: "1px solid var(--border-color)",
                animation: "reviewsPulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes reviewsPulse {
            0%, 100% { opacity: .55; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  /* ==========================================================
     MAIN UI
  ========================================================== */

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-card-hover)",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            maxWidth: "min(430px, calc(100vw - 40px))",
            backgroundColor: "var(--text-main)",
            color: "white",
            padding: "13px 18px",
            borderRadius: "11px",
            zIndex: 9999,
            fontSize: "13.5px",
            fontWeight: 650,
            lineHeight: 1.4,
            boxShadow: "0 10px 30px rgba(0,0,0,.22)",
            animation: "fadeIn .25s ease",
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <header
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
          color: "white",
          padding: "40px 24px 30px 24px",
        }}
      >
        <div style={{ maxWidth: "750px", margin: "0 auto" }}>
          <Link
            to="/"
            style={{
              color: "#c4b5fd",
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "16px",
              fontWeight: 600,
            }}
          >
            ← Back to Home
          </Link>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "28px", fontWeight: 800 }}>
            🎁 Reviews & Rewards
          </h1>
          <p style={{ margin: 0, color: "#c4b5fd", fontSize: "14px", lineHeight: 1.5 }}>
            Review your completed services — earn points — redeem on bookings & payments!
          </p>
        </div>
      </header>

      <main className="dashboard-content" style={{ maxWidth: "750px", margin: "0 auto", padding: "28px 20px 50px" }}>
        
        {/* Load Error */}
        {loadError && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#c2410c",
              padding: "12px 15px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            ⚠️ {loadError}
          </div>
        )}

        {/* Points Dashboard */}
        <section
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
            borderRadius: "17px",
            padding: "24px",
            color: "white",
            marginBottom: "28px",
            boxShadow: "0 9px 26px rgba(124,58,237,.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#c4b5fd" }}>Available Points</p>
              <h2 style={{ margin: 0, fontSize: "42px", fontWeight: 900 }}>⭐ {availablePoints}</h2>
              <p style={{ margin: "7px 0 0 0", fontSize: "12px", color: "#c4b5fd" }}>
                Total earned: {totalPoints} pts &nbsp;|&nbsp; Redeemed: {spentPoints} pts
              </p>
            </div>
            <div style={{ minWidth: "160px", textAlign: "right" }}>
              <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#c4b5fd" }}>Next reward at {maxPoints} pts</p>
              <div
                style={{
                  width: "160px",
                  maxWidth: "100%",
                  height: "10px",
                  background: "rgba(255,255,255,.18)",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #a78bfa, #f0abfc)",
                    borderRadius: "10px",
                    transition: "width .5s ease",
                  }}
                />
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#c4b5fd" }}>
                {availablePoints}/{maxPoints} pts
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: "18px",
              background: "rgba(255,255,255,.1)",
              borderRadius: "11px",
              padding: "11px 14px",
              fontSize: "13px",
              color: "#ede9fe",
              lineHeight: 1.45,
            }}
          >
            💡 <strong>How to earn:</strong> Submit a review after each completed service and earn <strong>+{POINTS_PER_REVIEW} pts</strong>.
          </div>
        </section>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <section style={{ marginBottom: "30px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-main)", margin: "0 0 14px 0" }}>
              ✍️ Pending Reviews ({pendingReviews.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {pendingReviews.map((booking) => {
                const bookingId = normalizeId(getId(booking));
                const draft = drafts[bookingId] || {};
                const isSubmitting = Boolean(submittingReviews[bookingId]);

                return (
                  <div
                    key={bookingId}
                    style={{
                      background: "var(--bg-card)",
                      borderRadius: "15px",
                      padding: "20px",
                      border: "2px dashed #c4b5fd",
                      boxShadow: "0 3px 12px rgba(0,0,0,.05)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 800, color: "var(--text-main)" }}>
                          {booking.service || "Professional Service"}
                        </h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>👷 Service Expert · 📅 {booking.date || "Completed"}</p>
                      </div>
                      <span
                        style={{
                          background: "var(--warning-light, #fef3c7)",
                          color: "var(--warning, #d97706)",
                          padding: "5px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 800,
                        }}
                      >
                        +{POINTS_PER_REVIEW} pts waiting
                      </span>
                    </div>

                    <StarSlider
                      value={draft.rating || 5}
                      disabled={isSubmitting}
                      onChange={(rating) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [bookingId]: { ...prev[bookingId], rating },
                        }))
                      }
                    />

                    <textarea
                      value={draft.comment || ""}
                      disabled={isSubmitting}
                      maxLength={MAX_COMMENT_LENGTH}
                      rows={3}
                      placeholder="Share your experience (optional)..."
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [bookingId]: { ...prev[bookingId], comment: event.target.value },
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "9px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                        fontSize: "14px",
                        resize: "vertical",
                        boxSizing: "border-box",
                        marginBottom: "7px",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />

                    <div style={{ textAlign: "right", fontSize: "10px", color: "var(--text-muted)", marginBottom: "10px" }}>
                      {(draft.comment || "").length}/{MAX_COMMENT_LENGTH}
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => submitReview(booking)}
                      style={{
                        padding: "10px 20px",
                        background: isSubmitting
                          ? "#94a3b8"
                          : "linear-gradient(135deg, #7c3aed, #4c1d95)",
                        color: "white",
                        border: "none",
                        borderBottom: isSubmitting ? "none" : "3px solid #3b0764",
                        borderRadius: "9px",
                        fontWeight: 800,
                        fontSize: "13px",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                      }}
                    >
                      {isSubmitting ? "Submitting..." : `Submit Review & Earn ${POINTS_PER_REVIEW} pts ⭐`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Redeem Rewards */}
        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-main)", margin: "0 0 6px 0" }}>
            🎁 Redeem Rewards
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 14px 0" }}>
            Use your points on bookings, payments & priority slots
          </p>
          <div
            className="rewards-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            {REWARDS.map((reward) => {
              const redeemed = redeemedRewards.some((r) => String(r.id) === String(reward.id));
              const canRedeem = availablePoints >= reward.points;
              const isRedeeming = Boolean(redeemingRewards[reward.id]);

              return (
                <div
                  key={reward.id}
                  className="reward-card"
                  style={{
                    backgroundColor: redeemed ? "#f0fdf4" : reward.bg,
                    border: `2px solid ${redeemed ? "#16a34a" : canRedeem ? reward.color : "#e2e8f0"}`,
                    borderRadius: "14px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    opacity: !canRedeem && !redeemed ? 0.8 : 1,
                    transition: "transform 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "28px" }}>{reward.icon}</span>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "var(--text-main)" }}>
                      {reward.title}
                    </h3>
                  </div>
                  <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--text-secondary)", flex: 1, lineHeight: 1.45 }}>
                    {reward.desc}
                  </p>
                  <button
                    type="button"
                    onClick={() => redeemReward(reward)}
                    disabled={redeemed || !canRedeem || isRedeeming}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontWeight: 800,
                      fontSize: "13px",
                      cursor: (redeemed || !canRedeem || isRedeeming) ? "not-allowed" : "pointer",
                      border: "none",
                      backgroundColor: redeemed ? "#16a34a" : canRedeem ? reward.color : "#e2e8f0",
                      color: redeemed ? "white" : canRedeem ? "white" : "var(--text-muted)",
                      transition: "all 0.2s",
                    }}
                  >
                    {redeemed ? "✅ Redeemed" : isRedeeming ? "Redeeming..." : canRedeem ? `Redeem for ${reward.points} pts` : `Need ${reward.points - availablePoints} more pts`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Past Reviews */}
        {doneReviews.length > 0 && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 14px 0", flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                📝 Your Reviews
              </h2>
              {/* Category Filters */}
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { id: "all", label: "All" },
                  { id: "positive", label: "Positive (4-5 ⭐)" },
                  { id: "critical", label: "Critical (1-3 ⭐)" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setFilterType(pill.id)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "15px",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                      backgroundColor: filterType === pill.id ? "var(--primary)" : "var(--primary-light)",
                      color: filterType === pill.id ? "var(--primary-dark)" : "var(--text-secondary)",
                      transition: "all 0.2s",
                      boxShadow: "none",
                    }}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredReviews.map((r) => {
                const sentiment = getSentiment(r);
                return (
                  <div
                    key={r._id || r.id}
                    className="past-review-card"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      border: "1px solid var(--border-color)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 800, color: "var(--text-main)" }}>
                          {r.service || "Professional Service"}
                        </h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>👷 Verified Partner · 📅 {r.date || "Completed"}</p>
                      </div>
                      <span
                        style={{
                          backgroundColor: "var(--success-light)",
                          color: "var(--success)",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 800,
                        }}
                      >
                        +{POINTS_PER_REVIEW} pts earned ✅
                      </span>
                    </div>

                    <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <span style={{ color: "var(--warning)", fontSize: "18px" }}>
                        {"★".repeat(normalizeRating(r.rating)) + "☆".repeat(5 - normalizeRating(r.rating))}
                      </span>
                      <span style={{ backgroundColor: sentiment.bg, color: sentiment.color, border: `1px solid ${sentiment.border}`, padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 800 }}>
                        {sentiment.label}
                      </span>
                    </div>

                    {r.comment && (
                      <p style={{ margin: "10px 0 0 0", fontSize: "14px", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5, backgroundColor: "var(--bg-card-hover)", padding: "10px", borderRadius: "8px" }}>
                        "{r.comment}"
                      </p>
                    )}

                    {/* Threaded worker response */}
                    {r.reply && (
                      <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: "#f5f3ff", borderLeft: "3px solid #8b5cf6", borderRadius: "8px", fontSize: "13px", marginLeft: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 800, color: "#6d28d9" }}>💬 Professional Response:</span>
                          <span style={{ fontSize: "11px", color: "#8b5cf6" }}>📅 {r.replyDate}</span>
                        </div>
                        <p style={{ margin: 0, color: "#4c1d95", fontStyle: "normal" }}>{r.reply}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ReviewsRewards;

