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
          backgroundColor: "white",
          borderRadius: "24px",
          padding: "40px 32px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          border: "1.5px solid #fee2e2",
          animation: "pop-failure 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#fef2f2",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "24px",
            animation: "pulse-hazard 2s infinite ease-in-out"
          }}
        >
          <span style={{ fontSize: "36px" }}>⚠️</span>
        </div>

        <h2 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: 800, color: "#991b1b" }}>
          Transaction Failed!
        </h2>
        <p style={{ margin: "0 0 28px 0", fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>
          {errorMessage || "We encountered an unexpected problem processing your payment request. Please review your balance and try again."}
        </p>

        <div
          style={{
            backgroundColor: "#fff5f5",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "28px",
            border: "1px solid #fecaca",
            fontSize: "13px",
            color: "#b91c1c",
            textAlign: "left"
          }}
        >
          <strong>💡 Potential Causes & Recoveries:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px", lineHeight: "1.6", color: "#7f1d1d" }}>
            <li>Insufficient secure wallet balance.</li>
            <li>Counterparty worker status changed to Inactive.</li>
            <li>Network request timed out during ledger commit.</li>
          </ul>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                color: "white",
                border: "none",
                padding: "14px 20px",
                borderRadius: "12px",
                fontWeight: "bold",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 8px 16px rgba(220, 38, 38, 0.25)",
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
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnimatedFailure;
