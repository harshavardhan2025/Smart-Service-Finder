import React, { useState, useEffect } from "react";

function CustomAlert() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Override default browser window.alert
    const originalAlert = window.alert;
    window.alert = (message) => {
      const id = Date.now() + Math.random();
      
      // Determine alert type based on message content for better color vibe
      const msg = String(message).toLowerCase();
      let type = "info";
      if (
        msg.includes("error") || 
        msg.includes("fail") || 
        msg.includes("🛑") || 
        msg.includes("❌") || 
        msg.includes("required") || 
        msg.includes("blocked") || 
        msg.includes("alert")
      ) {
        type = "error";
      } else if (
        msg.includes("success") || 
        msg.includes("✅") || 
        msg.includes("🎉") || 
        msg.includes("updated") || 
        msg.includes("saved") ||
        msg.includes("accepted")
      ) {
        type = "success";
      } else if (msg.includes("warning") || msg.includes("⚠️")) {
        type = "warning";
      }

      setAlerts((prev) => [...prev, { id, message: String(message), type }]);
      
      // Auto-remove alert after 5 seconds
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }, 5000);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 999999,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      pointerEvents: "none",
      width: "90%",
      maxWidth: "400px",
    }}>
      <style>{`
        @keyframes customAlertSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {alerts.map((alertItem) => {
        let bgColor = "#1e293b"; // Default dark (Slate)
        let borderColor = "#3b82f6"; // Blue
        let icon = "ℹ️";

        if (alertItem.type === "error") {
          borderColor = "#ef4444"; // Bright Red
          icon = "🛑";
          bgColor = "#2c1515"; // Very dark red tint
        } else if (alertItem.type === "success") {
          borderColor = "#10b981"; // Bright Green
          icon = "✅";
          bgColor = "#14251d"; // Very dark green tint
        } else if (alertItem.type === "warning") {
          borderColor = "#f59e0b"; // Bright Orange
          icon = "⚠️";
          bgColor = "#292011"; // Very dark orange tint
        }

        // Avoid duplicating emojis if the message already starts with one
        const displayMessage = alertItem.message;
        const hasEmojiStart = ["✅", "🛑", "❌", "⚠️", "🎉", "🚨", "🔑", "🟢", "🔥", "🔔", "🎙️"].some(e => displayMessage.includes(e));

        return (
          <div key={alertItem.id} style={{
            backgroundColor: bgColor,
            color: "white",
            padding: "16px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            pointerEvents: "auto",
            fontFamily: "'Outfit', sans-serif",
            borderLeft: `4px solid ${borderColor}`,
            animation: "customAlertSlideDown 0.3s ease-out"
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: 1 }}>
              {!hasEmojiStart && <span style={{ fontSize: "18px", marginTop: "-2px" }}>{icon}</span>}
              <span style={{ 
                fontSize: "14.5px", 
                fontWeight: "500", 
                whiteSpace: "pre-wrap", 
                lineHeight: "1.5",
                color: "#f8fafc",
                flex: 1
              }}>
                {displayMessage}
              </span>
            </div>
            <button
              onClick={() => removeAlert(alertItem.id)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "18px",
                marginLeft: "15px",
                padding: "0 5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "24px",
                transition: "color 0.2s"
              }}
              onMouseOver={(e) => e.target.style.color = "white"}
              onMouseOut={(e) => e.target.style.color = "#94a3b8"}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default CustomAlert;
