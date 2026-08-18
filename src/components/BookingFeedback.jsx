import { useEffect, useState } from "react";

// ponytail: merged AnimatedSuccess + AnimatedFailure — same modal shell, different icon/content
const CONFETTI_COLORS = ["#425664", "#61082b", "#c6ad8f", "#4d724d", "#b4d0e7"];

function classifyError(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("already booked") || m.includes("time slot") || m.includes("different time"))
    return "slot";
  if (m.includes("wallet") || m.includes("balance") || m.includes("insufficient"))
    return "wallet";
  if (m.includes("session") || m.includes("login") || m.includes("authentication"))
    return "auth";
  return "generic";
}

function HelpBox({ kind }) {
  const base = { borderRadius: "14px", padding: "14px 16px", marginBottom: "24px", fontSize: "13px", textAlign: "left" };
  if (kind === "slot") return (
    <div style={{ ...base, backgroundColor: "var(--warning-light)", border: "1px solid #fde68a", color: "#78350f" }}>
      <strong>💡 What to do:</strong>
      <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px", lineHeight: "1.7" }}>
        <li>Pick a <strong>different time slot</strong> on the same day.</li>
        <li>Try a <strong>different date</strong>.</li>
        <li>Choose <strong>another professional</strong> offering the same service.</li>
      </ul>
    </div>
  );
  if (kind === "wallet") return (
    <div style={{ ...base, backgroundColor: "var(--danger-light)", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
      <strong>💡 What to do:</strong>
      <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px", lineHeight: "1.7" }}>
        <li>Top up your wallet from the checkout screen.</li>
        <li>Switch to UPI, Card, or Cash payment instead.</li>
      </ul>
    </div>
  );
  return (
    <div style={{ ...base, backgroundColor: "var(--danger-light)", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
      <strong>💡 Possible causes:</strong>
      <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px", lineHeight: "1.6" }}>
        <li>Temporary network issue — please retry.</li>
        <li>Worker may have become unavailable.</li>
        <li>Session may have expired — try logging in again.</li>
      </ul>
    </div>
  );
}

function BookingFeedback({ type = "success", bookingDetails, errorMessage, onClose, onRetry, onBack }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (type !== "success") return;
    setParticles(
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 20 - 15,
        size: Math.random() * 8 + 4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 1.5,
        tilt: Math.random() * 360,
      }))
    );
    const t = setTimeout(() => setParticles([]), 4500);
    return () => clearTimeout(t);
  }, [type]);

  const errorKind = classifyError(errorMessage);
  const errorConfig = {
    slot:    { icon: "📅", title: "Slot Already Taken",    accent: "#d97706" },
    wallet:  { icon: "💼", title: "Insufficient Balance",  accent: "#dc2626" },
    auth:    { icon: "🔐", title: "Session Expired",       accent: "#7c3aed" },
    generic: { icon: "⚠️", title: "Booking Failed",        accent: "#dc2626" },
  }[errorKind];

  const overlayStyle = {
    position: "fixed", inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(12px)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 99999, fontFamily: "'Outfit', sans-serif",
    padding: "20px", boxSizing: "border-box",
  };

  const cardStyle = {
    width: "100%", maxWidth: type === "success" ? "460px" : "440px",
    backgroundColor: "var(--bg-card)", borderRadius: "24px",
    padding: "40px 32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
    textAlign: "center",
    border: `1.5px solid ${type === "success" ? "var(--border-color)" : "var(--border-color)"}`,
    animation: "feedback-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
    position: "relative", zIndex: 100001,
  };

  return (
    <div style={overlayStyle}>
      <style>{`
        @keyframes feedback-pop { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes checkmark { 0% { stroke-dashoffset: 48; } 100% { stroke-dashoffset: 0; } }
        @keyframes scale-up { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes confetti-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(80vh) rotate(360deg); opacity: 0; } }
        @keyframes pulse-hazard { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 0.8; } }
      `}</style>

      {/* Confetti (success only) */}
      {particles.length > 0 && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 100000 }}>
          {particles.map(p => (
            <div key={p.id} style={{ position: "absolute", top: `${p.y}%`, left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color, borderRadius: p.id % 2 === 0 ? "50%" : "2px", animation: `confetti-fall ${p.duration}s ${p.delay}s linear infinite`, transform: `rotate(${p.tilt}deg)` }} />
          ))}
        </div>
      )}

      <div style={cardStyle}>
        {type === "success" ? (
          <>
            <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "rgba(77,114,77,0.1)", display: "inline-flex", justifyContent: "center", alignItems: "center", marginBottom: 24, animation: "scale-up 0.5s ease-out forwards" }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 48, strokeDashoffset: 48, animation: "checkmark 0.6s 0.2s cubic-bezier(0.65,0,0.45,1) forwards" }} />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 800, color: "var(--text-main)" }}>Booking Confirmed! 🚀</h2>
            <p style={{ margin: "0 0 28px 0", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Your service booking has been processed successfully. An expert partner is dispatched.
            </p>
            <div style={{ backgroundColor: "var(--bg-card-hover)", borderRadius: 16, padding: 20, marginBottom: 28, border: "1px solid var(--border-color)", textAlign: "left", fontSize: 13 }}>
              {[
                ["Assigned Service:", bookingDetails?.service || "Professional Expert"],
                ["Scheduled Date & Time:", `${bookingDetails?.date} at ${bookingDetails?.time}`],
                ["Total Cost Paid:", `₹${bookingDetails?.price || 399}`],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: i < 2 ? "1px solid var(--border-color)" : "none", marginBottom: i < 2 ? 10 : 0 }}>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
                  <span style={{ color: i === 2 ? "var(--primary)" : "var(--text-main)", fontWeight: i === 2 ? 800 : 700 }}>{value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10 }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Instant Cash Rewards:</span>
                <span style={{ backgroundColor: "rgba(198,173,143,0.15)", color: "var(--primary)", padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: "1px solid var(--accent)" }}>⭐ Wallet Cashback Active</span>
              </div>
            </div>
            <button onClick={onClose} style={{ width: "100%", background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)", color: "white", border: "none", padding: "14px 20px", borderRadius: 12, fontWeight: "bold", fontSize: 15, cursor: "pointer", boxShadow: "0 8px 16px rgba(66,86,100,0.25)", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              View Dashboard
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "var(--danger-light)", display: "inline-flex", justifyContent: "center", alignItems: "center", marginBottom: 20, animation: "pulse-hazard 2s infinite ease-in-out" }}>
              <span style={{ fontSize: 36 }}>{errorConfig.icon}</span>
            </div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: 22, fontWeight: 800, color: errorConfig.accent }}>{errorConfig.title}</h2>
            <p style={{ margin: "0 0 20px 0", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {(errorMessage || "").replace(/^Cloud Sync Dispatch Error:\s*/i, "") || "We encountered an unexpected problem. Please try again."}
            </p>
            <HelpBox kind={errorKind} />
            <div style={{ display: "flex", gap: 12 }}>
              {onRetry && errorKind !== "slot" && (
                <button onClick={onRetry} style={{ flex: 1, background: `linear-gradient(135deg, ${errorConfig.accent} 0%, #1e293b 100%)`, color: "white", border: "none", padding: "14px 20px", borderRadius: 12, fontWeight: "bold", fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
                  Try Again
                </button>
              )}
              <button onClick={onBack} style={{ flex: 1, backgroundColor: "var(--bg-card-hover)", color: "var(--text-secondary)", border: "none", padding: "14px 20px", borderRadius: 12, fontWeight: "bold", fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
                {errorKind === "slot" ? "Choose Another Slot" : "Go Back"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BookingFeedback;
