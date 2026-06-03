import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const STATUS_STYLE = {
  Paid:     { color: "#16a34a", bg: "#dcfce7" },
  Pending:  { color: "#d97706", bg: "#fef3c7" },
  Refunded: { color: "#2563eb", bg: "#dbeafe" },
  Completed: { color: "#16a34a", bg: "#dcfce7" }
};

const defaultProfile = {
  name: sessionStorage.getItem("userName") || "Verified User",
  email: "user@example.com",
  phone: "Not Provided",
  role: "Customer",
  location: "Available Offline",
  memberSince: "Joined 2026"
};

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(defaultProfile);
  const [toast, setToast] = useState("");
  const [expandedTxn, setExpandedTxn] = useState(null);
  const [showAllTxn, setShowAllTxn] = useState(false);

  const [walletBal, setWalletBal] = useState(0);
  const [txnHistory, setTxnHistory] = useState([]);

  const currentUsr = sessionStorage.getItem("userName") || "Harsha User";

  const fetchUserData = async () => {
    try {
       // Fetch physical transactions assigned to this user!
       const resp = await fetch(`/api/transactions?user=${encodeURIComponent(currentUsr)}`);
       if (resp.ok) {
          const data = await resp.json();
          // Filter client-side just to be doubly safe if API returns total dump
          const userSpecific = data.filter(t => t.customer === currentUsr);
          setTxnHistory(userSpecific);

          // 🏦 Dynamic Balance Derivation: Compute total velocity seamlessly instantly from reliable cloud source
          const calculated = userSpecific.reduce((acc, t) => {
             const isAdd = t.status === "Refunded" || t.status === "Added" || t.method === "Cashback" || t.method === "Reward" || t.method === "Wallet Topup";
             return isAdd ? acc + t.amount : acc - t.amount;
          }, 1000); // Base assumed baseline seed
          setWalletBal(calculated);
       }
    } catch(err) { console.error("Profile ledger load fail"); }
  };

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const PREVIEW_COUNT = 2;
  const visibleTxns = showAllTxn ? txnHistory : txnHistory.slice(0, PREVIEW_COUNT);
  const hiddenCount = txnHistory.length - PREVIEW_COUNT;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSave = () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      showToast("⚠️ Name and Email are required!");
      return;
    }
    setProfile(draft);
    setEditing(false);
    showToast("✅ Profile updated successfully!");
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          color: "white",
          padding: "40px 24px 60px 24px"
        }}
      >
        <Link
          to="/"
          style={{
            color: "#94a3b8",
            textDecoration: "none",
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "20px"
          }}
        >
          ← Back to Home
        </Link>
        <h1 style={{ margin: "0 0 4px 0", fontSize: "26px", fontWeight: 800 }}>
          👤 My Profile
        </h1>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
          Manage your personal information and account settings
        </p>
      </div>

      {/* Avatar Card — overlaps header */}
      <div style={{ maxWidth: "680px", margin: "-36px auto 0 auto", padding: "0 20px" }}>
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap"
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              fontWeight: 800,
              color: "white",
              flexShrink: 0,
              boxShadow: "0 4px 14px rgba(76,175,80,0.4)"
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: 800, color: "#1e293b" }}>
              {profile.name}
            </h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  backgroundColor: "#dbeafe",
                  color: "#2563eb",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700
                }}
              >
                {profile.role}
              </span>
              <span
                style={{
                  backgroundColor: "#dcfce7",
                  color: "#16a34a",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700
                }}
              >
                ✅ Verified
              </span>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#64748b" }}>
              Member since {profile.memberSince}
            </p>
          </div>

          {!editing && (
            <button
              onClick={() => { setDraft(profile); setEditing(true); }}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #2196F3, #1565C0)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* ── INTERACTIVE PREMIUM WALLET & LOYALTY CARD ── */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
            marginBottom: "20px"
          }}
        >
          <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
            🪙 Wallet & Rewards Dashboard
          </h3>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {/* Wallet Balance Card */}
            <div style={{ flex: 1, minWidth: "200px", padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #42a5f5, #1e88e5)", color: "white" }}>
              <div style={{ fontSize: "12px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase" }}>Available Wallet Balance</div>
              <div style={{ fontSize: "32px", fontWeight: 800, margin: "8px 0" }}>₹{walletBal.toLocaleString()}</div>
              <button 
                onClick={() => navigate("/payment")}
                style={{ padding: "8px 16px", backgroundColor: "var(--bg-card)", color: "#1e88e5", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                ➕ Add Money
              </button>
            </div>

            {/* Loyalty Tier Progress Card */}
            <div style={{ flex: 1, minWidth: "200px", padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #ffb300, #ff8f00)", color: "white" }}>
              <div style={{ fontSize: "12px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase" }}>Loyalty Tier Status</div>
              <div style={{ fontSize: "24px", fontWeight: 800, margin: "8px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                🌟 Gold Member
              </div>
              {/* Progress bar to Platinum */}
              <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "6px" }}>750 / 1,000 Points (250 more to Platinum)</div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "75%", height: "100%", backgroundColor: "var(--bg-card)", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
            marginBottom: "20px"
          }}
        >
          <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
            📋 Personal Information
          </h3>

          {editing ? (
            /* Edit Form */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { label: "Full Name", key: "name", type: "text", icon: "👤" },
                { label: "Email Address", key: "email", type: "email", icon: "📧" },
                { label: "Phone Number", key: "phone", type: "tel", icon: "📱" },
                { label: "Location", key: "location", type: "text", icon: "📍" }
              ].map(({ label, key, type, icon }) => (
                <div key={key}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#64748b",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}
                  >
                    {icon} {label}
                  </label>
                  <input
                    type={type}
                    value={draft[key]}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "15px",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      outline: "none",
                      transition: "border 0.2s"
                    }}
                    onFocus={(e) => (e.target.style.border = "1.5px solid #2196F3")}
                    onBlur={(e) => (e.target.style.border = "1.5px solid #e2e8f0")}
                  />
                </div>
              ))}

              {/* Role (read-only) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  🎭 Role
                </label>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "15px",
                    color: "#94a3b8"
                  }}
                >
                  {profile.role} (cannot be changed)
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "15px",
                    cursor: "pointer"
                  }}
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "var(--bg-card)",
                    color: "#64748b",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "15px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { label: "Full Name", value: profile.name, icon: "👤" },
                { label: "Email Address", value: profile.email, icon: "📧" },
                { label: "Phone Number", value: profile.phone, icon: "📱" },
                { label: "Location", value: profile.location, icon: "📍" },
                { label: "Role", value: profile.role, icon: "🎭" }
              ].map(({ label, value, icon }, i, arr) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none"
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    {icon} {label}
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b" }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
            marginBottom: "20px"
          }}
        >
          {/* Section Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
              💳 Payment History
            </h3>
            {/* Total Spent */}
            <div style={{ backgroundColor: "#f0fdf4", borderRadius: "10px", padding: "6px 14px", fontSize: "13px", color: "#16a34a", fontWeight: 700 }}>
              Total Spent: ₹{txnHistory.filter(t => t.status === "Paid" && t.method !== "Cashback").reduce((s, t) => s + t.amount, 0)}
            </div>
          </div>

          {/* Summary Pills */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
            {Object.entries(STATUS_STYLE).map(([status, style]) => (
              <span
                key={status}
                style={{
                  backgroundColor: style.bg,
                  color: style.color,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700
                }}
              >
                {status}: {txnHistory.filter(t => t.status === status).length}
              </span>
            ))}
          </div>

          {/* Transaction Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {visibleTxns.map((txn) => {
              const s = STATUS_STYLE[txn.status] || { color: "#64748b", bg: "#f1f5f9" };
              const txnIdentifier = txn._id || txn.id;
              const isOpen = expandedTxn === txnIdentifier;
              return (
                <div
                  key={txnIdentifier}
                  style={{
                    border: `1.5px solid ${isOpen ? "#2196F3" : "#f1f5f9"}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "border 0.2s"
                  }}
                >
                  {/* Row */}
                  <div
                    onClick={() => setExpandedTxn(isOpen ? null : txnIdentifier)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      cursor: "pointer",
                      backgroundColor: isOpen ? "#f0f9ff" : "white",
                      transition: "background 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "22px" }}>{txn.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>{txn.service}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>📅 {txn.date} &nbsp;·&nbsp; {txnIdentifier}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: 800, fontSize: "15px", color: "#1e293b" }}>₹{txn.amount}</span>
                      <span style={{ backgroundColor: s.bg, color: s.color, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>
                        {txn.status}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Expanded Receipt */}
                  {isOpen && (
                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        borderTop: "1px solid #e2e8f0",
                        padding: "14px 16px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        fontSize: "13px"
                      }}
                    >
                      {[
                        { label: "Transaction ID", value: txnIdentifier },
                        { label: "Worker", value: txn.worker },
                        { label: "Payment Method", value: txn.method },
                        { label: "Amount", value: `₹${txn.amount}` },
                        { label: "Date", value: txn.date },
                        { label: "Status", value: txn.status }
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p style={{ margin: "0 0 2px 0", color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>{label}</p>
                          <p style={{ margin: 0, color: "#1e293b", fontWeight: 600 }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show More / Collapse Toggle */}
          {hiddenCount > 0 && (
            <button
              onClick={() => {
                setShowAllTxn(!showAllTxn);
                if (showAllTxn) setExpandedTxn(null); // collapse any open receipt when hiding
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                marginTop: "12px",
                padding: "11px",
                backgroundColor: showAllTxn ? "#f1f5f9" : "#eff6ff",
                color: showAllTxn ? "#64748b" : "#2563eb",
                border: `1.5px dashed ${showAllTxn ? "#cbd5e1" : "#93c5fd"}`,
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {showAllTxn
                ? `▲ Show less`
                : `▼ Show ${hiddenCount} more transaction${hiddenCount > 1 ? "s" : ""}`}
            </button>
          )}
        </div>

        {/* Quick Links */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "20px",
            padding: "20px 28px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
            marginBottom: "28px"
          }}
        >
          <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
            🔗 Quick Links
          </h3>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { to: "/my-bookings", label: "📋 My Bookings", color: "#2196F3", bg: "#eff6ff" },
              { to: "/reviews", label: "🎁 Rewards", color: "#7c3aed", bg: "#f5f3ff" },
              { to: "/support", label: "💬 Support", color: "#16a34a", bg: "#f0fdf4" }
            ].map(({ to, label, color, bg }) => (
              <Link
                key={to}
                to={to}
                style={{
                  backgroundColor: bg,
                  color,
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
