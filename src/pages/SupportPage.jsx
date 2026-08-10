import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";

function SupportPage() {
  const location = useLocation();
  const passedBooking = location.state?.bookingId;
  const passedService = location.state?.service;

  const [issue, setIssue] = useState(passedBooking ? `Regarding ${passedService} (ID: ${passedBooking.substr(-6).toUpperCase()}): ` : "");
  const [category, setCategory] = useState(passedBooking ? "worker" : "billing");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [success, setSuccess] = useState(false);

  // Dynamic FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);

  const [history, setHistory] = useState([]);
  const [formError, setFormError] = useState("");
  const userName = sessionStorage.getItem("userName");

  const fetchHistory = async () => {
    if (!userName) return;
    try {
      const resp = await fetch(`/api/complaints?reported_by=${encodeURIComponent(userName)}`);
      if (resp.ok) setHistory(await resp.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  const faqs = [
    {
      q: "💳 How do I get a refund for a cancelled booking?",
      a: "Refunds are processed automatically back to your original payment method. It usually takes 3-5 business days to reflect in your bank account."
    },
    {
      q: "👷 What happens if a professional doesn't show up?",
      a: "If a professional fails to arrive within 30 minutes of the scheduled time, you can cancel the order free of charge. The provider's rating will be affected and you will receive a 100% refund."
    },
    {
      q: "📅 Can I reschedule my service booking?",
      a: "Yes! You can reschedule any booking up to 2 hours before the scheduled time directly from your 'My Bookings' panel without any penalty."
    },
    {
      q: "🔒 Are my payments secure?",
      a: "Absolutely. All payments are securely processed using industry-standard SSL encryption. We do not store your raw card details on our servers."
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!issue.trim() || !email.trim() || !phone.trim()) {
      setFormError("Please fill out all fields (issue, email, and phone) before submitting.");
      return;
    }

    try {
      const resp = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: passedBooking || "NON-BOOKING-INQUIRY",
          issue_type: `SUPPORT TICKET: ${category.toUpperCase()}`,
          description: `Email: ${email} | Phone: ${phone} | Message: ${issue}`,
          reported_by: sessionStorage.getItem("userName") || email || "Web Guest"
        })
      });
      if (!resp.ok) throw new Error("Cloud post rejection.");

      setSuccess(true);
      fetchHistory();
      setTimeout(() => {
        setSuccess(false);
        setIssue("");
        setEmail("");
        setPhone("");
      }, 5000);
    } catch (err) { setFormError("🚨 Submission failed. Please try again or contact us directly."); }
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Outfit', sans-serif" }}>
      {/* Dynamic Navbar */}
      <Navbar />

      <div className="dashboard-content" style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 20px" }}>
        {/* Support Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <span style={{ backgroundColor: "var(--border)", color: "var(--primary)", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
            We're Here to Help 24/7
          </span>
          <h1 style={{ fontSize: "42px", fontWeight: 800, margin: "16px 0 8px 0", background: "linear-gradient(to right, var(--text-main), var(--text-muted))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Hi! How can we help you today?
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
            Have a question or need help? Browse our quick answers below or send us a message!
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px" }}>

          {/* LEFT COLUMN: FAQ SECTION */}
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>💡</span> Frequently Asked Questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    padding: "20px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: activeFaq === idx ? "1px solid var(--primary)" : "1px solid var(--border)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{faq.q}</h3>
                    <span style={{ fontSize: "18px", color: "var(--primary)", transform: activeFaq === idx ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                      ▼
                    </span>
                  </div>
                  {activeFaq === idx && (
                    <p style={{ marginTop: "12px", fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.6", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: SUBMIT TICKET FORM */}
          <div className="premium-card" style={{ padding: "40px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>✉️</span> Send us a Message
            </h2>

            {success ? (
              <div style={{ textAlign: "center", padding: "40px 10px" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)", marginBottom: "8px" }}>Ticket Submitted!</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
                  Your support request has been logged. We'll contact you at <strong>{email}</strong> within 24 hours.
                </p>
                <div className="inline-alert inline-alert-success" style={{ marginTop: 16, justifyContent: "center" }}>
                  ✅ Ticket ID: #{Math.random().toString(36).slice(2,8).toUpperCase()} — Keep this for reference
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {formError && (
                  <div className="inline-alert inline-alert-error">
                    ⚠️ {formError}
                  </div>
                )}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>What do you need help with?</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  >
                    <option value="billing">💳 Billing & Payments Inquiry</option>
                    <option value="worker">👷 Issue with Professional Worker</option>
                    <option value="booking">📅 Booking & Rescheduling</option>
                    <option value="bug">📱 Technical App Bug</option>
                    <option value="other">❓ Other General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter your mobile number..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>Tell us more about it</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Provide details about your query..."
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                      fontSize: "14px",
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    width: "100%"
                  }}
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

        </div>

        {/* 📜 TICKET HISTORY SECTION: SHOW PAST GRIEVANCES */}
        {userName && (
          <div className="premium-card" style={{ marginTop: "60px", padding: "35px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>📜</span> Your Past Messages
            </h2>
            {history.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No previously submitted support tickets found under your account name.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase" }}>
                      <th style={{ padding: "12px 10px" }}>Date</th>
                      <th style={{ padding: "12px 10px" }}>Issue Category</th>
                      <th style={{ padding: "12px 10px" }}>Details</th>
                      <th style={{ padding: "12px 10px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item._id} style={{ borderBottom: "1px solid var(--border)", color: "var(--text-main)", fontSize: "14px" }}>
                        <td style={{ padding: "14px 10px" }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "14px 10px", fontWeight: 600 }}>{item.issue_type}</td>
                        <td style={{ padding: "14px 10px", opacity: 0.8 }}>{item.description?.substring(0, 50)}...</td>
                        <td style={{ padding: "14px 10px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                            backgroundColor: item.status === "Resolved" ? "var(--primary-light)" : item.status === "Cancelled" ? "#ef4444" : "#eab308",
                            color: item.status === "Resolved" ? "var(--primary-dark)" : "white"
                          }}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SupportPage;
