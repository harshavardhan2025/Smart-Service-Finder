import React, { useEffect, useState } from "react";

function AnimatedSuccess({ bookingDetails, onClose }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const list = [];
    const colors = ["#425664", "#61082b", "#c6ad8f", "#4d724d", "#b4d0e7"];
    for (let i = 0; i < 60; i++) {
      list.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 20 - 15,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 1.5,
        tilt: Math.random() * 360,
      });
    }
    setParticles(list);
    
    const timer = setTimeout(() => setShowConfetti(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  const styles = `
    @keyframes checkmark {
      0% { stroke-dashoffset: 48; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes scale-up {
      0% { transform: scale(0); opacity: 0; }
      80% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes fall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(80vh) rotate(360deg); opacity: 0; }
    }
    @keyframes pop-success {
      0% { transform: scale(0.9); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(12px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
        fontFamily: "'Outfit', sans-serif",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {showConfetti && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", pointerEvents: "none", zIndex: 100000 }}>
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                top: `${p.y}%`,
                left: `${p.x}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                animation: `fall ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
                transform: `rotate(${p.tilt}deg)`,
                opacity: 1
              }}
            />
          ))}
        </div>
      )}

      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "white",
          borderRadius: "24px",
          padding: "40px 32px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          border: "1.5px solid #e2e8f0",
          animation: "pop-success 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          position: "relative",
          zIndex: 100001
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "rgba(77, 114, 77, 0.1)",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "24px",
            animation: "scale-up 0.5s ease-out forwards"
          }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline
              points="20 6 9 17 4 12"
              style={{
                strokeDasharray: 48,
                strokeDashoffset: 48,
                animation: "checkmark 0.6s 0.2s cubic-bezier(0.65, 0, 0.45, 1) forwards"
              }}
            />
          </svg>
        </div>

        <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: 800, color: "#1e293b" }}>
          Booking Confirmed! 🚀
        </h2>
        <p style={{ margin: "0 0 28px 0", fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>
          Your service booking has been processed successfully. An expert partner is dispatched.
        </p>

        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "28px",
            border: "1px solid #e2e8f0",
            textAlign: "left",
            fontSize: "13px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "10px" }}>
            <span style={{ color: "#64748b", fontWeight: 500 }}>Assigned Service:</span>
            <span style={{ color: "#1e293b", fontWeight: 700 }}>{bookingDetails?.service || "Professional Expert"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "10px" }}>
            <span style={{ color: "#64748b", fontWeight: 500 }}>Scheduled Date & Time:</span>
            <span style={{ color: "#1e293b", fontWeight: 700 }}>{bookingDetails?.date} at {bookingDetails?.time}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "10px" }}>
            <span style={{ color: "#64748b", fontWeight: 500 }}>Total Cost Paid:</span>
            <span style={{ color: "var(--primary)", fontWeight: 800 }}>₹{bookingDetails?.price || 399}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontWeight: 500 }}>Instant Cash Rewards:</span>
            <span style={{ backgroundColor: "rgba(198, 173, 143, 0.15)", color: "var(--primary)", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, border: "1px solid var(--accent)" }}>
              ⭐ Wallet Cashback Active
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
            color: "white",
            border: "none",
            padding: "14px 20px",
            borderRadius: "12px",
            fontWeight: "bold",
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 8px 16px rgba(66, 86, 100, 0.25)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          View Dashboard
        </button>
      </div>
    </div>
  );
}

export default AnimatedSuccess;
