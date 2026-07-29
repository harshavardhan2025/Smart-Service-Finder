import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function GoogleAuthMock() {
  const [step, setStep] = useState("choose"); // "choose", "custom", "loading"
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRedirectMode = searchParams.get("redirect") === "true" || !window.opener;

  const mockAccounts = [
    { name: "Harsha Vardhan", email: "khars.harsha@gmail.com", avatar: "👤" },
    { name: "John Doe", email: "john.doe@gmail.com", avatar: "👨" },
    { name: "Jane Smith", email: "jane.smith@gmail.com", avatar: "👩" }
  ];

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setStep("loading");
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!emailInput || !nameInput) {
      alert("Please fill in both name and email!");
      return;
    }
    if (!emailInput.endsWith("@gmail.com")) {
      alert("Please enter a valid Google Account email ending with @gmail.com!");
      return;
    }
    setSelectedAccount({ name: nameInput, email: emailInput, avatar: "👤" });
    setStep("loading");
  };

  useEffect(() => {
    if (step === "loading") {
      setIsLoading(true);

      const authenticateDirectly = async () => {
        try {
          const pendingSignupStr = sessionStorage.getItem("pending_google_signup");
          const extraBody = pendingSignupStr ? JSON.parse(pendingSignupStr) : {};
          const isLoginOnly = sessionStorage.getItem("google_auth_flow") === "login";

          const requestBody = isLoginOnly 
            ? { email: selectedAccount.email, name: selectedAccount.name }
            : { email: selectedAccount.email, name: selectedAccount.name, ...extraBody };

          const response = await fetch("/api/auth/google-mock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
          });
          const data = await response.json();

          if (response.status === 409) {
            sessionStorage.setItem("google_auth_error", data.error || "An account with this Google email already exists.");
            navigate("/signup");
            return;
          }

          if (!response.ok) {
            sessionStorage.setItem("google_auth_error", data.error || "Google Authentication failed.");
            navigate(isLoginOnly ? "/login" : "/signup");
            return;
          }

          const user = data.user;
          sessionStorage.setItem("userRole", user.role);
          sessionStorage.setItem("userName", user.name);
          sessionStorage.setItem("userEmail", user.email);
          sessionStorage.setItem("userId", user.id || user._id);
          sessionStorage.setItem("authToken", data.token);
          localStorage.removeItem("manualLocationSet");

          // 🔒 Persist login for 1 week across browser sessions
          localStorage.setItem("authSession", JSON.stringify({
            userRole: user.role,
            userName: user.name,
            userEmail: user.email,
            userId: user.id || user._id,
            authToken: data.token,
            loggedInWorkerId: user.role === "worker" ? user.id : null,
            userCity: user.city || null,
            expiry: Date.now() + 7 * 24 * 60 * 60 * 1000
          }));

          if (user.role === "worker") {
            sessionStorage.setItem("loggedInWorkerId", user.id);
            navigate("/worker-dashboard");
          } else if (user.role === "admin") {
            navigate("/admin-dashboard");
          } else {
            if (user.city) {
              sessionStorage.setItem("userCity", user.city);
              localStorage.setItem("userCity", user.city);
            }
            navigate("/");
          }
        } catch (err) {
          sessionStorage.setItem("google_auth_error", `Technical Error: ${err.message}`);
          navigate("/login");
        }
      };

      if (isRedirectMode) {
        authenticateDirectly();
      } else {
        const timer = setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage(
              {
                type: "GOOGLE_AUTH_SUCCESS",
                email: selectedAccount.email,
                name: selectedAccount.name
              },
              window.location.origin
            );
            setTimeout(() => window.close(), 300);
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [step, selectedAccount, isRedirectMode, navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0f2f5",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "white",
        width: "100%",
        maxWidth: "400px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        padding: "36px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Pulsing Google Blue Line Loader */}
        {isLoading && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "4px",
            backgroundColor: "#e8f0fe",
            overflow: "hidden"
          }}>
            <div style={{
              width: "50%",
              height: "100%",
              backgroundColor: "#1a73e8",
              position: "absolute",
              animation: "google-loading 1.2s infinite linear"
            }} />
          </div>
        )}

        {/* Google Logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span style={{ fontSize: "28px", fontWeight: "bold", letterSpacing: "-1.5px" }}>
            <span style={{ color: "#4285F4" }}>G</span>
            <span style={{ color: "#EA4335" }}>o</span>
            <span style={{ color: "#FBBC05" }}>o</span>
            <span style={{ color: "#4285F4" }}>g</span>
            <span style={{ color: "#34A853" }}>l</span>
            <span style={{ color: "#EA4335" }}>e</span>
          </span>
        </div>

        {step === "choose" && (
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 400, color: "#202124", textAlign: "center", margin: "0 0 8px 0" }}>
              Choose an account
            </h1>
            <p style={{ fontSize: "14px", color: "#5f6368", textAlign: "center", margin: "0 0 24px 0" }}>
              to continue to <strong style={{ color: "#202124" }}>Workzy</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", border: "1px solid #dadce0", borderRadius: "8px", overflow: "hidden" }}>
              {mockAccounts.map((acc, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectAccount(acc)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "16px",
                    borderBottom: index < mockAccounts.length - 1 ? "1px solid #dadce0" : "none",
                    cursor: "pointer",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#e8f0fe",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "18px",
                    marginRight: "14px",
                    border: "1px solid #cbd5e1"
                  }}>
                    {acc.avatar}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#3c4043" }}>{acc.name}</div>
                    <div style={{ fontSize: "12px", color: "#5f6368" }}>{acc.email}</div>
                  </div>
                </div>
              ))}

              {/* Use another account option */}
              <div
                onClick={() => setStep("custom")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px",
                  borderTop: "1px solid #dadce0",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#f1f3f4",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "18px",
                  marginRight: "14px"
                }}>
                  👤
                </div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a73e8", textAlign: "left" }}>
                  Use another account
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "custom" && (
          <form onSubmit={handleCustomSubmit}>
            <h1 style={{ fontSize: "22px", fontWeight: 400, color: "#202124", textAlign: "center", margin: "0 0 8px 0" }}>
              Sign in
            </h1>
            <p style={{ fontSize: "14px", color: "#5f6368", textAlign: "center", margin: "0 0 24px 0" }}>
              Use your Google Account
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "#5f6368" }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "4px",
                    border: "1px solid #dadce0",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    width: "100%"
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "#5f6368" }}>Google Email Address</label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "4px",
                    border: "1px solid #dadce0",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    width: "100%"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setStep("choose")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1a73e8",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 0,
                  boxShadow: "none",
                  transform: "none"
                }}
              >
                Back
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: "#1a73e8",
                  color: "white",
                  padding: "10px 24px",
                  borderRadius: "4px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Next
              </button>
            </div>
          </form>
        )}

        {step === "loading" && (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 400, color: "#202124", margin: "0 0 12px 0" }}>
              Verifying...
            </h2>
            <p style={{ fontSize: "14px", color: "#5f6368", margin: "0 0 24px 0" }}>
              Signing in as {selectedAccount?.name} ({selectedAccount?.email})
            </p>
            <div style={{
              width: "40px",
              height: "40px",
              border: "3px solid #f3f3f3",
              borderTop: "3px solid #1a73e8",
              borderRadius: "50%",
              margin: "0 auto",
              animation: "spin-loader 0.8s infinite linear"
            }} />
          </div>
        )}

        {/* Footer info */}
        <div style={{ marginTop: "32px", fontSize: "12px", color: "#5f6368", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span>English (United States)</span>
          <div style={{ display: "flex", gap: "12px" }}>
            <span>Help</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>

      {/* Styled loaders */}
      <style>{`
        @keyframes google-loading {
          0% { left: -50%; }
          100% { left: 100%; }
        }
        @keyframes spin-loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default GoogleAuthMock;
