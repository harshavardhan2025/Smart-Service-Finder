import { useState, useEffect } from "react";
import { FaBrain, FaRegClock, FaBalanceScale, FaBolt, FaQuestionCircle } from "react-icons/fa";

function AiPriceEstimator({ initialService = "Electrical", onEstimateApply = null }) {
  const [service, setService] = useState(initialService);
  const [complexity, setComplexity] = useState("Low");
  const [urgency, setUrgency] = useState("Normal");
  const [hours, setHours] = useState(1);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const servicesList = [
    "Electrical", "Plumbing", "Carpentry", "Painting", "House Cleaning", 
    "AC Repair", "Doctors & Medical", "Appliance Repair", "Mechanic"
  ];

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const url = `/api/ai/estimate-price?service=${encodeURIComponent(service)}&complexity=${complexity}&urgency=${urgency}&hours=${hours}&details=${encodeURIComponent(details)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEstimate(data.breakdown);
        }
      }
    } catch (e) {
      console.error("AI pricing projection failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialService) {
      setService(initialService);
    }
  }, [initialService]);

  // Calculate SVG gauge stroke offsets
  const getGaugeStrokeDash = () => {
    if (!estimate) return "0 100";
    const maxVal = 2000;
    const percentage = Math.min((estimate.totalEstimate / maxVal) * 100, 100);
    // Gauge is half circle, so circumference is pi * r
    // Stroke-dasharray mapping for semi-circle: 157 is full half-circle
    const fillLength = (percentage / 100) * 157;
    return `${fillLength} 157`;
  };

  const getGaugeColor = () => {
    if (!estimate) return "#cbd5e1";
    const val = estimate.totalEstimate;
    if (val < 500) return "#10b981"; // Eco / Budget
    if (val < 1200) return "#f59e0b"; // Standard
    return "#ef4444"; // Premium
  };

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(16px)",
      border: "1.5px solid rgba(107, 79, 79, 0.15)",
      borderRadius: "24px",
      padding: "24px",
      boxShadow: "var(--card-shadow)",
      color: "#0f172a",
      fontFamily: "'Outfit', sans-serif",
      position: "relative",
      marginTop: "20px"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "var(--primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <FaBrain style={{ color: "var(--primary)", animation: loading ? "pulse-brain 1s infinite alternate" : "none" }} /> 
          AI Smart Price Estimator
        </h3>
        <FaQuestionCircle 
          style={{ cursor: "pointer", color: "var(--text-secondary)", fontSize: "18px" }} 
          onClick={() => setShowHelp(!showHelp)}
        />
      </div>

      {showHelp && (
        <div style={{
          backgroundColor: "var(--primary-light)",
          padding: "12px 16px",
          borderRadius: "12px",
          fontSize: "12px",
          color: "var(--primary-dark)",
          lineHeight: "1.5",
          marginBottom: "16px",
          borderLeft: "4px solid var(--primary)"
        }}>
          💡 <strong>How it works:</strong> Our AI regression model analyzes category baselines, calculates complexity premiums, factors in rush availability surcharges, and parses your task description text to evaluate labor intensity!
        </div>
      )}

      {/* Form Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Service Category</label>
          <select 
            value={service} 
            onChange={(e) => setService(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
          >
            {servicesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Duration Hours</label>
          <input 
            type="number" 
            min="1" 
            max="12"
            value={hours}
            onChange={(e) => setHours(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Work Complexity</label>
          <div style={{ display: "flex", gap: "6px" }}>
            {["Low", "Medium", "High"].map(c => (
              <button
                key={c}
                onClick={() => setComplexity(c)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: "12px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: complexity === c ? "var(--primary)" : "#e2e8f0",
                  color: complexity === c ? "white" : "#475569",
                  borderBottom: complexity === c ? "3px solid var(--primary-dark)" : "none",
                  transform: "none",
                  boxShadow: "none"
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Urgency Level</label>
          <div style={{ display: "flex", gap: "6px" }}>
            {["Normal", "Rush"].map(u => (
              <button
                key={u}
                onClick={() => setUrgency(u)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: "12px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: urgency === u ? "#ef4444" : "#e2e8f0",
                  color: urgency === u ? "white" : "#475569",
                  borderBottom: urgency === u ? "3px solid #b91c1c" : "none",
                  transform: "none",
                  boxShadow: "none"
                }}
              >
                {u === "Rush" ? "⚡ Rush (+₹150)" : "Normal"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Scope & Custom Requirements</label>
        <textarea
          rows={2}
          placeholder="Describe scope details (e.g. 'installing heavy brass pipe fixtures' or 'premium wall wash finish')..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
        />
      </div>

      <button
        onClick={handleEstimate}
        disabled={loading}
        className="btn-primary"
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          fontWeight: 800,
          fontSize: "15px",
          background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
          color: "white",
          border: "none",
          borderBottom: "4px solid var(--secondary)",
          cursor: "pointer"
        }}
      >
        {loading ? "🔮 Querying Neural Network..." : "🤖 Predict Cost Instantly"}
      </button>

      {/* Estimations Visualization Render Drawer */}
      {estimate && (
        <div style={{
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "1.5px dashed rgba(107, 79, 79, 0.2)",
          animation: "fadeIn 0.3s ease-out forwards",
          display: "grid",
          gridTemplateColumns: "130px 1fr",
          gap: "20px",
          alignItems: "center"
        }}>
          {/* SVG Gauge */}
          <div style={{ position: "relative", width: "130px", height: "80px", display: "flex", justifyContent: "center", overflow: "hidden" }}>
            <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: "rotate(-180deg)" }}>
              {/* Back Circle Track */}
              <circle 
                cx="50" cy="50" r="25" 
                fill="none" 
                stroke="#e2e8f0" 
                strokeWidth="10" 
                strokeDasharray="157 157" 
                strokeLinecap="round"
              />
              {/* Active Color Fill */}
              <circle 
                cx="50" cy="50" r="25" 
                fill="none" 
                stroke={getGaugeColor()} 
                strokeWidth="10" 
                strokeDasharray={getGaugeStrokeDash()} 
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.8s ease-in-out" }}
              />
            </svg>
            <div style={{
              position: "absolute",
              bottom: "5px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column"
            }}>
              <span style={{ fontSize: "19px", fontWeight: 900, color: "var(--text-main)" }}>₹{estimate.totalEstimate}</span>
              <span style={{ fontSize: "9px", fontWeight: 700, color: getGaugeColor(), textTransform: "uppercase" }}>
                {estimate.totalEstimate < 500 ? "Budget" : estimate.totalEstimate < 1200 ? "Standard" : "Premium"}
              </span>
            </div>
          </div>

          {/* Breakdown List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}><FaRegClock /> Base Labor Rate ({hours} hr)</span>
              <strong style={{ color: "#1e293b" }}>₹{estimate.basePrice}</strong>
            </div>

            {estimate.complexityPremium > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}><FaBalanceScale /> {complexity} Complexity</span>
                <strong style={{ color: "var(--primary)" }}>+₹{estimate.complexityPremium}</strong>
              </div>
            )}

            {estimate.scopeAdjustment > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>📋 Scope Adjustments</span>
                <strong style={{ color: "#f59e0b" }}>+₹{estimate.scopeAdjustment}</strong>
              </div>
            )}

            {estimate.rushSurcharge > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}><FaBolt style={{ color: "#ef4444" }} /> Emergency Surcharge</span>
                <strong style={{ color: "#ef4444" }}>+₹{estimate.rushSurcharge}</strong>
              </div>
            )}

            {onEstimateApply && (
              <button
                onClick={() => onEstimateApply(estimate.totalEstimate)}
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  fontSize: "11px",
                  fontWeight: 800,
                  backgroundColor: "rgba(66, 86, 100, 0.1)",
                  color: "var(--primary)",
                  border: "1.5px dashed var(--primary)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "center"
                }}
              >
                Apply as Booking Rate ✅
              </button>
            )}
          </div>
        </div>
      )}

      {/* Styled Brain Pulse keyframe */}
      <style>{`
        @keyframes pulse-brain {
          from { transform: scale(1); filter: drop-shadow(0 0 2px rgba(66,86,100,0.3)); }
          to { transform: scale(1.15); filter: drop-shadow(0 0 8px rgba(66,86,100,0.6)); }
        }
      `}</style>
    </div>
  );
}

export default AiPriceEstimator;
