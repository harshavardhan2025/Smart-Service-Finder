import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaUserCircle,
  FaCheckCircle,
  FaUserEdit,
  FaWallet,
  FaPlus,
  FaCrown,
  FaIdCard,
  FaUser,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaUserTag,
  FaLock,
  FaSave,
  FaReceipt,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaLink,
  FaClipboardList,
  FaGift,
  FaHeadset,
  FaCreditCard,
  FaTimes
} from "react-icons/fa";
import { getWalletBalance, addToWallet } from "../utils/wallet";

const STATUS_STYLE = {
  Paid:     { color: "var(--success)", bg: "#dcfce7" },
  Pending:  { color: "var(--warning)", bg: "#fef3c7" },
  Refunded: { color: "#425664", bg: "#b4d0e7" },
  Completed: { color: "var(--success)", bg: "#dcfce7" }
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
  const [profile, setProfile] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(defaultProfile);
  const [toast, setToast] = useState("");
  const [expandedTxn, setExpandedTxn] = useState(null);
  const [showAllTxn, setShowAllTxn] = useState(false);

  const [walletBal, setWalletBal] = useState(getWalletBalance());
  const [txnHistory, setTxnHistory] = useState([]);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(500);
  const [topUpProcessing, setTopUpProcessing] = useState(false);

  const currentUsr = sessionStorage.getItem("userName") || "Verified User";

  const fetchUserProfile = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) return;
      const resp = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resp.ok) {
        const user = await resp.json();
        const p = {
          name: user.name || sessionStorage.getItem("userName") || "Verified User",
          email: user.email || sessionStorage.getItem("userEmail") || "user@example.com",
          phone: user.phone || "Not Provided",
          role: user.role || "Customer",
          location: user.city || "Mumbai",
          memberSince: "Joined 2026"
        };
        setProfile(p);
        setDraft(p);
      }
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  };

  const fetchUserData = async () => {
    try {
       const currentBal = getWalletBalance();
       setWalletBal(currentBal);

       const resp = await fetch(`/api/transactions?user=${encodeURIComponent(currentUsr)}`);
       if (resp.ok) {
          const data = await resp.json();
          const userSpecific = data.filter(t => t.customer === currentUsr);
          setTxnHistory(userSpecific);
       }
    } catch(err) { console.error("Profile ledger load fail"); }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchUserData();
    const handleWalletUpdate = () => {
      setWalletBal(getWalletBalance());
      fetchUserData();
    };
    window.addEventListener("walletUpdated", handleWalletUpdate);
    return () => window.removeEventListener("walletUpdated", handleWalletUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmAddMoney = async () => {
    if (topUpAmount <= 0) {
      showToast("⚠️ Please enter a valid top-up amount!");
      return;
    }
    setTopUpProcessing(true);
    setTimeout(async () => {
      const newBal = await addToWallet(topUpAmount, "User Wallet Top-up", "UPI Topup");
      setWalletBal(newBal);
      setTopUpProcessing(false);
      setShowAddMoneyModal(false);
      showToast(`🎉 ₹${topUpAmount} added to your Wallet balance! New Balance: ₹${newBal.toLocaleString()}`);
      fetchUserData();
    }, 1000);
  };

  const PREVIEW_COUNT = 2;
  const visibleTxns = showAllTxn ? txnHistory : txnHistory.slice(0, PREVIEW_COUNT);
  const hiddenCount = txnHistory.length - PREVIEW_COUNT;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSave = async () => {
    if (!draft.name?.trim()) {
      showToast("⚠️ Full Name cannot be empty!");
      return;
    }
    if (!draft.location?.trim()) {
      showToast("⚠️ Location cannot be empty!");
      return;
    }
    try {
      const token = sessionStorage.getItem("authToken");
      const userId = sessionStorage.getItem("userId");
      if (token && userId) {
        const resp = await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: draft.name.trim(),
            city: draft.location.trim()
          })
        });
        if (resp.ok) {
          const updated = {
            ...profile,
            name: draft.name.trim(),
            location: draft.location.trim()
          };
          setProfile(updated);
          setDraft(updated);
          setEditing(false);
          showToast("✅ Name and Location updated successfully!");
          
          // Sync sessions
          sessionStorage.setItem("userName", draft.name.trim());
          sessionStorage.setItem("userCity", draft.location.trim());
          localStorage.setItem("userLocation", draft.location.trim());
          localStorage.setItem("userCity", draft.location.trim());
          const authSession = JSON.parse(localStorage.getItem("authSession") || "{}");
          authSession.userName = draft.name.trim();
          authSession.userCity = draft.location.trim();
          localStorage.setItem("authSession", JSON.stringify(authSession));
          
          // Dispatch event to refresh Navbar instantly
          window.dispatchEvent(new Event("storage"));
        } else {
          const errData = await resp.json();
          showToast(`🛑 Update failed: ${errData.error || "Please try again."}`);
        }
      } else {
        const updated = { ...profile, name: draft.name.trim(), location: draft.location.trim() };
        setProfile(updated);
        setDraft(updated);
        setEditing(false);
        showToast("✅ Profile updated locally!");
      }
    } catch (err) {
      showToast("🛑 Network error updating profile.");
    }
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
        backgroundColor: "var(--bg-card-hover)",
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
            backgroundcolor: "var(--text-main)",
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
        className="dashboard-header-block"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          color: "white",
          padding: "30px 20px 50px 20px"
        }}
      >
        <Link
          to="/"
          style={{
            color: "var(--text-secondary)",
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><FaUserCircle /> My Profile</span>
        </h1>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px" }}>
          Manage your personal information and account settings
        </p>
      </div>

      {/* Avatar Card — overlaps header */}
      <div className="profile-content" style={{ maxWidth: "680px", margin: "-36px auto 0 auto", padding: "0 20px" }}>
        <div
          className="profile-card premium-card"
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
            <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>
              {profile.name}
            </h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  backgroundColor: "#b4d0e7",
                  color: "var(--primary)",
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
                  backgroundColor: "var(--success-light)",
                  color: "var(--success)",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaCheckCircle /> Verified</span>
              </span>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
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
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaUserEdit /> Edit Profile</span>
            </button>
          )}
        </div>

        {/* ── INTERACTIVE PREMIUM WALLET & LOYALTY CARD ── */}
        <div
          className="profile-card premium-card"
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
            marginBottom: "20px"
          }}
        >
          <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaWallet style={{ color: "var(--primary)" }} /> Wallet & Rewards Dashboard
          </h3>
          <div className="wallet-cards-row" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {/* Wallet Balance Card */}
            <div className="wallet-loyalty-card" style={{ flex: 1, minWidth: "200px", padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)", color: "white" }}>
              <div style={{ fontSize: "12px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase" }}>Available Wallet Balance</div>
              <div style={{ fontSize: "32px", fontWeight: 800, margin: "8px 0" }}>₹{walletBal.toLocaleString()}</div>
              <button 
                onClick={() => setShowAddMoneyModal(true)}
                style={{ padding: "8px 16px", backgroundColor: "var(--bg-card)", color: "var(--primary)", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaPlus /> Add Money</span>
              </button>
            </div>

            {/* Loyalty Tier Progress Card */}
            <div className="wallet-loyalty-card" style={{ flex: 1, minWidth: "200px", padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #ffb300, #ff8f00)", color: "white" }}>
              <div style={{ fontSize: "12px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase" }}>Loyalty Tier Status</div>
              <div style={{ fontSize: "24px", fontWeight: 800, margin: "8px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaCrown style={{ color: "#ffd700" }} /> Gold Member</span>
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
          className="profile-card premium-card"
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
            marginBottom: "20px"
          }}
        >
          <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
            <FaIdCard style={{ color: "var(--primary)" }} /> Personal Information
          </h3>

          {editing ? (
            /* Edit Form (Only Name & Location are editable) */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Full Name (Editable) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaUser /> Full Name</span> <span style={{ color: "var(--primary)", fontSize: "11px" }}>(Editable)</span>
                </label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid var(--primary)",
                    fontSize: "15px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    outline: "none",
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-main)",
                    fontWeight: 600,
                    transition: "border 0.2s"
                  }}
                />
              </div>

              {/* Location (Editable) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaMapMarkerAlt /> Location / City</span> <span style={{ color: "var(--primary)", fontSize: "11px" }}>(Editable)</span>
                </label>
                <input
                  type="text"
                  value={draft.location}
                  onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter your city or area"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid var(--primary)",
                    fontSize: "15px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    outline: "none",
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-main)",
                    fontWeight: 600,
                    transition: "border 0.2s"
                  }}
                />
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted, #94a3b8)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaEnvelope /> Email Address <FaLock style={{ fontSize: "11px" }} /></span> <span style={{ fontSize: "11px", fontWeight: 500 }}>(Fixed)</span>
                </label>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: "var(--bg-card-hover)",
                    border: "1.5px solid var(--border-color)",
                    fontSize: "15px",
                    color: "var(--text-secondary)"
                  }}
                >
                  {profile.email}
                </div>
              </div>

              {/* Phone Number (Read-only) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted, #94a3b8)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaPhone /> Phone Number <FaLock style={{ fontSize: "11px" }} /></span> <span style={{ fontSize: "11px", fontWeight: 500 }}>(Fixed)</span>
                </label>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: "var(--bg-card-hover)",
                    border: "1.5px solid var(--border-color)",
                    fontSize: "15px",
                    color: "var(--text-secondary)"
                  }}
                >
                  {profile.phone}
                </div>
              </div>

              {/* Role (Read-only) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted, #94a3b8)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaUserTag /> Account Role <FaLock style={{ fontSize: "11px" }} /></span> <span style={{ fontSize: "11px", fontWeight: 500 }}>(Fixed)</span>
                </label>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: "var(--bg-card-hover)",
                    border: "1.5px solid var(--border-color)",
                    fontSize: "15px",
                    color: "var(--text-secondary)"
                  }}
                >
                  {profile.role}
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
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><FaSave /> Save Changes</span>
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-secondary)",
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
                { label: "Full Name", value: profile.name, icon: FaUser },
                { label: "Email Address", value: profile.email, icon: FaEnvelope },
                { label: "Phone Number", value: profile.phone, icon: FaPhone },
                { label: "Location", value: profile.location, icon: FaMapMarkerAlt },
                { label: "Role", value: profile.role, icon: FaUserTag }
              ].map(({ label, value, icon: RowIcon }, i, arr) => (
                <div
                  key={label}
                  className="profile-info-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--border-color)" : "none"
                  }}
                >
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <RowIcon style={{ color: "var(--primary)" }} /> {label}
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div
          className="profile-card premium-card"
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "var(--shadow-3d)",
            marginBottom: "20px"
          }}
        >
          {/* Section Header */}
          <div className="payment-history-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
              <FaReceipt style={{ color: "var(--primary)" }} /> Payment History
            </h3>
            {/* Total Spent */}
            <div style={{ backgroundColor: "var(--success-light)", borderRadius: "10px", padding: "6px 14px", fontSize: "13px", color: "var(--success)", fontWeight: 700 }}>
              Total Spent: ₹{txnHistory.filter(t => t.status === "Paid" && t.method !== "Cashback").reduce((s, t) => s + t.amount, 0)}
            </div>
          </div>

          {/* Summary Pills */}
          <div className="txn-status-pills" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
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
              const s = STATUS_STYLE[txn.status] || { color: "var(--text-secondary)", bg: "var(--primary-light)" };
              const txnIdentifier = txn._id || txn.id;
              const isOpen = expandedTxn === txnIdentifier;
              return (
                <div
                  key={txnIdentifier}
                  style={{
                    border: `1.5px solid ${isOpen ? "var(--primary)" : "var(--border-color)"}`,
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
                      backgroundColor: isOpen ? "var(--primary-light)" : "var(--bg-card-hover)",
                      transition: "background 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "22px" }}>{txn.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>{txn.service}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}><FaCalendarAlt style={{ verticalAlign: "middle" }} /> {txn.date} &nbsp;·&nbsp; {txnIdentifier}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-main)" }}>₹{txn.amount}</span>
                      <span style={{ backgroundColor: s.bg, color: s.color, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>
                        {txn.status}
                      </span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{isOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
                    </div>
                  </div>

                  {/* Expanded Receipt */}
                  {isOpen && (
                    <div
                      className="txn-expanded-receipt"
                      style={{
                        backgroundColor: "var(--bg-card-hover)",
                        borderTop: "1px solid var(--border-color)",
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
                          <p style={{ margin: "0 0 2px 0", color: "var(--text-secondary)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>{label}</p>
                          <p style={{ margin: 0, color: "var(--text-main)", fontWeight: 600 }}>{value}</p>
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
                backgroundColor: showAllTxn ? "var(--primary-light)" : "rgba(198, 173, 143, 0.15)",
                color: showAllTxn ? "var(--text-secondary)" : "var(--primary)",
                border: `1.5px dashed ${showAllTxn ? "var(--border-color)" : "var(--accent)"}`,
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
          className="profile-card premium-card quick-links-card"
        >
          <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
            <FaLink style={{ color: "var(--primary)" }} /> Quick Links
          </h3>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { to: "/my-bookings", label: "My Bookings", icon: FaClipboardList, color: "#2196F3", bg: "#eff6ff" },
              { to: "/reviews", label: "Rewards", icon: FaGift, color: "#7c3aed", bg: "#f5f3ff" },
              { to: "/support", label: "Support", icon: FaHeadset, color: "var(--success)", bg: "#f0fdf4" }
            ].map(({ to, label, icon: LinkIcon, color, bg }) => (
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><LinkIcon /> {label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 💳 ADD MONEY TO WALLET MODAL */}
      {showAddMoneyModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          fontFamily: "'Inter', sans-serif",
          backdropFilter: "blur(8px)"
        }}>
          <div
            style={{
              maxWidth: "420px",
              width: "90%",
              maxHeight: "85vh",
              overflowY: "auto",
              backgroundColor: "var(--bg-card)",
              borderRadius: "20px",
              padding: "26px",
              boxSizing: "border-box",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaCreditCard style={{ color: "var(--primary)" }} /> Add Money to Wallet
              </h3>
              <button
                onClick={() => setShowAddMoneyModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "var(--text-secondary)", cursor: "pointer" }}
              ><FaTimes /></button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
              Current Balance: <strong style={{ color: "var(--text-main)" }}>₹{walletBal.toLocaleString()}</strong>
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                SELECT QUICK AMOUNT
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[500, 1000, 2000, 5000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    style={{
                      flex: 1,
                      padding: "8px 4px",
                      borderRadius: "8px",
                      border: topUpAmount === amt ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                      backgroundColor: topUpAmount === amt ? "var(--primary-light)" : "var(--bg-card-hover)",
                      color: topUpAmount === amt ? "var(--primary)" : "var(--text-secondary)",
                      fontWeight: 800,
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                ENTER AMOUNT (₹)
              </label>
              <input
                type="number"
                min="100"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(parseFloat(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "var(--text-main)",
                  boxSizing: "border-box",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={topUpProcessing}
                onClick={handleConfirmAddMoney}
                style={{
                  flex: 1.5,
                  backgroundColor: "var(--primary)",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: 800,
                  fontSize: "14px",
                  cursor: topUpProcessing ? "not-allowed" : "pointer"
                }}
              >
                {topUpProcessing ? "Adding Funds..." : "Confirm & Top Up"}
              </button>
              <button
                disabled={topUpProcessing}
                onClick={() => setShowAddMoneyModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: "var(--bg-card-hover)",
                  color: "var(--text-secondary)",
                  border: "1px solid #cbd5e1",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;

