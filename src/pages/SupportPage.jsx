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
    if (!issue.trim() || !email.trim() || !phone.trim()) {
      alert("Please fill out all fields before submitting your support ticket!");
      return;
    }

    try {
      // 🚀 PHYSICAL CLOUD WRITE: Commit support ticket directly to MongoDB grievance node!
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
      fetchHistory(); // Live sync newly posted ticket immediately!
      setTimeout(() => {
        setSuccess(false);
        setIssue("");
        setEmail("");
        setPhone("");
      }, 4000);
    } catch (err) { alert("🛑 Submission Fail: Database synchronization issue. Please try again later."); }
  };

  return (
    <div style={{ backgroundColor: "#0f172a", minHeight: "100vh", color: "#f8fafc", fontFamily: "'Outfit', sans-serif" }}>
      {/* Dynamic Navbar */}
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 20px" }}>
        {/* Support Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <span style={{ backgroundColor: "#1e293b", color: "var(--success)", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
            24/7 Customer Help Center
          </span>
          <h1 style={{ fontSize: "42px", fontWeight: 800, margin: "16px 0 8px 0", background: "linear-gradient(to right, #ffffff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            How Can We Assist You Today?
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
            Submit a billing inquiry, report an issue with a professional, or browse our frequently asked questions below.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px" }}>

          {/* LEFT COLUMN: FAQ SECTION */}
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>💡</span> Frequently Asked Questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  style={{
                    backgroundColor: "#1e293b",
                    padding: "20px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: activeFaq === idx ? "1px solid var(--success)" : "1px solid #334155"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{faq.q}</h3>
                    <span style={{ fontSize: "18px", color: "var(--success)", transform: activeFaq === idx ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                      ▼
                    </span>
                  </div>
                  {activeFaq === idx && (
                    <p style={{ marginTop: "12px", fontSize: "14px", color: "#94a3b8", lineHeight: "1.6", borderTop: "1px solid #334155", paddingTop: "12px" }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: SUBMIT TICKET FORM */}
          <div style={{ backgroundColor: "#1e293b", padding: "40px", borderRadius: "16px", border: "1px solid #334155", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>✉️</span> Submit a Support Ticket
            </h2>

            {success ? (
              <div style={{ textAlign: "center", padding: "40px 10px" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--success)", marginBottom: "8px" }}>Ticket Submitted!</h3>
                <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6" }}>
                  Your inquiry has been successfully logged. Our dedicated support team will contact you via email within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#94a3b8", marginBottom: "8px" }}>Select Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  >
                    <option value="billing">💳 Billing & Payments Inquiry</option>
                    <option value="worker">👷 Issue with Professional Worker</option>
                    <option value="booking">📅 Booking & Rescheduling</option>
                    <optin valut="Booking cancellation">Booking cancellation related</optin>
                    <option value="bug">📱 Technical App Bug</option>
                    <option value="other">❓ Other General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#94a3b8", marginBottom: "8px" }}>Email Address</label>
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
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#94a3b8", marginBottom: "8px" }}>Phone Number</label>
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
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#94a3b8", marginBottom: "8px" }}>Describe Your Issue</label>
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
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: "linear-gradient(to right, var(--success), #059669)",
                    color: "#ffffff",
                    border: "none",
                    padding: "14px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  Submit Support Ticket
                </button>
              </form>
            )}
          </div>

        </div>

        {/* 📜 TICKET HISTORY SECTION: SHOW PAST GRIEVANCES */}
        {userName && (
          <div style={{ marginTop: "60px", backgroundColor: "#1e293b", padding: "35px", borderRadius: "16px", border: "1px solid #334155" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>📜</span> Your Complaint & Ticket History
            </h2>
            {history.length === 0 ? (
              <p style={{ color: "#94a3b8", fontStyle: "italic" }}>No previously submitted support tickets found under your account name.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: "13px", textTransform: "uppercase" }}>
                      <th style={{ padding: "12px 10px" }}>Date</th>
                      <th style={{ padding: "12px 10px" }}>Issue Category</th>
                      <th style={{ padding: "12px 10px" }}>Details</th>
                      <th style={{ padding: "12px 10px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item._id} style={{ borderBottom: "1px solid #0f172a", color: "#e2e8f0", fontSize: "14px" }}>
                        <td style={{ padding: "14px 10px" }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "14px 10px", fontWeight: 600 }}>{item.issue_type}</td>
                        <td style={{ padding: "14px 10px", opacity: 0.8 }}>{item.description?.substring(0, 50)}...</td>
                        <td style={{ padding: "14px 10px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                            backgroundColor: item.status === "Resolved" ? "var(--success)" : item.status === "Cancelled" ? "#ef4444" : "#eab308",
                            color: "white"
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
