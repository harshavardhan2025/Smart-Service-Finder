import React from "react";

function AnimatedFailure({ errorMessage, onRetry, onBack }) {
  const styles = `
    @keyframes pulse-hazard {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.08); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes pop-failure {
      0% { transform: scale(0.9); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;

  // Detect the type of error for smarter UI messaging
  const msg = errorMessage || "";
  const isSlotConflict = msg.toLowerCase().includes("already booked") ||
                         msg.toLowerCase().includes("time slot") ||
                         msg.toLowerCase().includes("different time");
  const isWalletError  = msg.toLowerCase().includes("wallet") ||
                         msg.toLowerCase().includes("balance") ||
                         msg.toLowerCase().includes("insufficient");
  const isAuthError    = msg.toLowerCase().includes("session") ||
                         msg.toLowerCase().includes("login") ||
                         msg.toLowerCase().includes("authentication");

  const config = isSlotConflict
    ? { icon: "📅", title: "Slot Already Taken",  accent: "#d97706", bg: "#fffbeb", border: "#fde68a", textColor: "#92400e" }
    : isWalletError
    ? { icon: "💼", title: "Insufficient Balance", accent: "#dc2626", bg: "#fef2f2", border: "#fecaca", textColor: "#991b1b" }
    : isAuthError
    ? { icon: "🔐", title: "Session Expired",      accent: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", textColor: "#5b21b6" }
    : { icon: "⚠️", title: "Booking Failed",       accent: "#dc2626", bg: "#fef2f2", border: "#fecaca", textColor: "#991b1b" };

  // For slot conflicts, show actionable guidance, not generic technical causes
  const renderHelpBox = () => {
    if (isSlotConflict) {
      return (
        <div style={{
          backgroundColor: "#fffbeb",
          borderRadius: "14px",
          padding: "14px 16px",
          marginBottom: "24px",
          border: "1px solid #fde68a",
          fontSize: "13px",
          color: "#78350f",
          textAlign: "left"
        }}>
          <strong>💡 What to do:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px", lineHeight: "1.7" }}>
            <li>Pick a <strong>different time slot</strong> on the same day.</li>
            <li>Try a <strong>different date</strong> on the calendar.</li>
            <li>Choose <strong>another professional</strong> offering the same service.</li>
          </ul>
        </div>
      );
    }
    if (isWalletError) {
      return (
        <div style={{
          backgroundColor: config.bg,
          borderRadius: "14px",
          padding: "14px 16px",
          marginBottom: "24px",
          border: `1px solid ${config.border}`,
          fontSize: "13px",
          color: config.textColor,
          textAlign: "left"
        }}>
          <strong>💡 What to do:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px", lineHeight: "1.7" }}>
            <li>Top up your wallet from the checkout screen.</li>
            <li>Switch to UPI, Card, or Cash payment instead.</li>
          </ul>
        </div>
      );
    }
    // Generic causes for unexpected errors only
    return (
      <div style={{
        backgroundColor: config.bg,
        borderRadius: "14px",
        padding: "14px 16px",
        marginBottom: "24px",
        border: `1px solid ${config.border}`,
        fontSize: "13px",
        color: config.textColor,
        textAlign: "left"
      }}>
        <strong>💡 Possible causes:</strong>
        <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px", lineHeight: "1.6" }}>
          <li>Temporary network issue — please retry.</li>
          <li>Worker may have become unavailable.</li>
          <li>Session may have expired — try logging in again.</li>
        </ul>
      </div>
    );
  };

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

      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "24px",
          padding: "40px 32px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          border: `1.5px solid ${config.border}`,
          animation: "pop-failure 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: config.bg,
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "20px",
            animation: "pulse-hazard 2s infinite ease-in-out"
          }}
        >
          <span style={{ fontSize: "36px" }}>{config.icon}</span>
        </div>

        <h2 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: 800, color: config.accent }}>
          {config.title}
        </h2>
        <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
          {/* Strip the ugly 'Cloud Sync Dispatch Error:' prefix if present */}
          {msg.replace(/^Cloud Sync Dispatch Error:\s*/i, "") ||
           "We encountered an unexpected problem. Please try again."}
        </p>

        {renderHelpBox()}

        <div style={{ display: "flex", gap: "12px" }}>
          {onRetry && !isSlotConflict && (
            <button
              onClick={onRetry}
              style={{
                flex: 1,
                background: `linear-gradient(135deg, ${config.accent} 0%, ${config.textColor} 100%)`,
                color: "white",
                border: "none",
                padding: "14px 20px",
                borderRadius: "12px",
                fontWeight: "bold",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: `0 8px 16px ${config.accent}40`,
                transition: "all 0.2s"
              }}
            >
              Try Again
            </button>
          )}
          <button
            onClick={onBack}
            style={{
              flex: 1,
              backgroundColor: "#f1f5f9",
              color: "#475569",
              border: "none",
              padding: "14px 20px",
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {isSlotConflict ? "Choose Another Slot" : "Go Back"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnimatedFailure;
