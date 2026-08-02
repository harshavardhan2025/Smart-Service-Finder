import { useState, useEffect } from "react";
import { FaShieldAlt, FaKey, FaSignOutAlt, FaExclamationTriangle, FaMapMarkerAlt, FaLaptop } from "react-icons/fa";

function SecurityLogs({ userId = "admin", limit = 0 }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = userId === "admin" ? "/api/security/logs" : `/api/security/logs/${userId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(limit > 0 ? data.slice(0, limit) : data);
      }
    } catch(e) {
      console.error("Failed to query security logs audit ledger", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000); // Reload every 15s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const getActionIcon = (action) => {
    switch(action) {
      case "LOGIN":
        return <FaKey style={{ color: "var(--success)" }} />;
      case "SIGNUP":
        return <FaShieldAlt style={{ color: "var(--primary)" }} />;
      case "SOS_TRIGGERED":
        return <FaExclamationTriangle style={{ color: "var(--danger)" }} />;
      case "BOOKING_CANCELLED":
        return <FaSignOutAlt style={{ color: "var(--secondary)" }} />;
      default:
        return <FaShieldAlt style={{ color: "var(--text-secondary)" }} />;
    }
  };

  const parseUserAgent = (uaString) => {
    if (!uaString) return "Generic Client";
    const lower = uaString.toLowerCase();
    
    let browser = "Web Browser";
    if (lower.includes("firefox")) browser = "Mozilla Firefox";
    else if (lower.includes("chrome")) browser = "Google Chrome";
    else if (lower.includes("safari")) browser = "Apple Safari";
    else if (lower.includes("edge")) browser = "Microsoft Edge";
    
    let os = "OS";
    if (lower.includes("windows")) os = "Windows";
    else if (lower.includes("macintosh") || lower.includes("mac os")) os = "macOS";
    else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";
    else if (lower.includes("android")) os = "Android";
    else if (lower.includes("linux")) os = "Linux";
    
    return `${browser} on ${os}`;
  };

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(226, 232, 240, 0.8)",
      borderRadius: "20px",
      padding: "24px",
      boxShadow: "var(--card-shadow)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1.5px solid var(--border-color)", paddingBottom: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <FaShieldAlt style={{ color: "var(--primary)" }} /> Security & Access Logs Timeline
        </h3>
        <button 
          onClick={fetchLogs} 
          style={{
            padding: "6px 12px",
            fontSize: "11px",
            backgroundColor: "transparent",
            color: "var(--primary)",
            border: "1px solid var(--primary)",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "none",
            transform: "none",
            borderBottomWidth: "1px"
          }}
        >
          Refresh Audit
        </button>
      </div>

      {loading && logs.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
          <em>🧠 Pulse audit indexing...</em>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
          No recorded security access events found.
        </div>
      ) : (
        <div className="custom-scrollbar" style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid var(--border-color)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "10px 8px" }}>Event</th>
                <th style={{ padding: "10px 8px" }}>Operation</th>
                <th style={{ padding: "10px 8px" }}>Platform Client</th>
                <th style={{ padding: "10px 8px" }}>Network Location</th>
                <th style={{ padding: "10px 8px" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "50%",
                      backgroundColor: "var(--bg-card-hover)", border: "1.5px solid var(--border-color)",
                      display: "flex", justifyContent: "center", alignItems: "center", fontSize: "14px"
                    }}>
                      {getActionIcon(log.action)}
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <strong style={{ 
                      color: log.action === "SOS_TRIGGERED" ? "#ef4444" : 
                             log.action === "BOOKING_CANCELLED" ? "#ea580c" : "var(--text-main)",
                      fontSize: "13px"
                    }}>
                      {log.action}
                    </strong>
                    {userId === "admin" && (
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {log.email}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaLaptop style={{ color: "var(--text-secondary)" }} />
                      <span>{parseUserAgent(log.device)}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <FaMapMarkerAlt style={{ color: "var(--text-secondary)" }} />
                      <span style={{ fontWeight: 600 }}>{log.city || "Kakinada"}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>({log.ip})</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 500 }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SecurityLogs;
