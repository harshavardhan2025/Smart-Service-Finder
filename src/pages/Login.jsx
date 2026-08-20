import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash, FaUser, FaHardHat, FaChevronDown, FaChevronUp } from "react-icons/fa";
import authBg from "../assets/auth-bg.jpg";
import authMobileBg from "../assets/auth-mobile-bg.png";
import { fetchAllWorkersCached } from "../utils/workerService";
import safeJson from "../utils/safeJson";
import { triggerGoogleAuth } from "../utils/googleAuth";


// ── Professions list (for Join as Service Provider) ─────────────────────────
const PROFESSIONS = [
  { group: "Main Services", options: ["Carpentry", "Plumbing", "Electrical", "Beauty, Salon & Spa", "Doctors & Medical"] },
  { group: "Cleaning", options: ["House Cleaning", "Floor cleaning", "Utensils Cleaning"] },
  { group: "Painting", options: ["Interior Painting", "Exterior Painting", "Wall Putty Coating", "Wood Polishing"] },
  { group: "Mechanical", options: ["Two-Wheeler (Bikes)", "Four-Wheeler (Cars)"] },
  { group: "Automobile Cleaning", options: ["Car Wash", "Bike Wash"] },
  { group: "Appliance Repair", options: ["AC Repair", "Washing Machine", "Refrigerator", "Geyser"] },
  { group: "Specializations", options: ["Photography", "Events", "Packers & Movers", "Mechanic"] },
];

const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Visakhapatnam", "Bhopal", "Patna", "Vadodara", "Ludhiana", "Agra", "Nashik", "Rajkot", "Meerut", "Varanasi", "Kakinada", "Vijayawada", "Guntur", "Tirupati", "Rajahmundry", "Kadapa", "Nellore", "Kurnool", "Anantapur", "Warangal", "Karimnagar", "Nizamabad", "Khammam", "Secunderabad", "Coimbatore", "Madurai", "Trichy", "Salem", "Erode", "Tiruppur", "Mysuru", "Mangalore", "Belgaum", "Hubli", "Dharwad", "Gulbarga", "Davanagere", "Bellary", "Raipur", "Bhilai", "Durg", "Bilaspur", "Korba", "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Balasore", "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Shillong", "Imphal", "Aizawl", "Kohima", "Dimapur", "Agartala", "Gangtok", "Port Blair", "Chandigarh", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Panchkula", "Faridabad", "Gurgaon", "Noida", "Greater Noida", "Ghaziabad", "Aligarh", "Moradabad", "Bareilly", "Saharanpur", "Muzaffarnagar", "Roorkee", "Dehradun", "Haridwar", "Haldwani", "Rudrapur", "Srinagar", "Jammu", "Leh", "Kargil", "Shimla", "Solan", "Dharamshala", "Kangra", "Hamirpur", "Una", "Manali", "Kullu", "Palampur", "Udaipur", "Jodhpur", "Ajmer", "Kota", "Bikaner", "Alwar", "Bharatpur", "Sikar", "Bhilwara", "Pali", "Tonk", "Chittorgarh", "Sawai Madhopur", "Dausa", "Barmer", "Jaisalmer", "Gwalior", "Jabalpur", "Satna", "Rewa", "Sagar", "Katni", "Chhindwara", "Hoshangabad", "Khandwa", "Ratlam", "Dewas", "Morena", "Shivpuri", "Betul", "Mandla", "Seoni", "Chhatarpur", "Tikamgarh", "Panna", "Sidhi", "Singrauli", "Shahdol", "Anuppur", "Umaria", "Dindori", "Balaghat", "Sehore", "Raisen", "Vidisha", "Rajgarh", "Shajapur", "Agar Malwa", "Ujjain", "Neemuch", "Mandsaur", "Barwani", "Khargone", "Burhanpur", "Dhar", "Jhabua", "Alirajpur", "Aurangabad", "Jalgaon", "Kolhapur", "Sangli", "Satara", "Solapur", "Latur", "Osmanabad", "Beed", "Parbhani", "Nanded", "Hingoli", "Akola", "Amravati", "Yavatmal", "Chandrapur", "Gadchiroli", "Wardha", "Washim", "Buldhana", "Ratnagiri", "Sindhudurg", "Palghar", "Thane", "Navi Mumbai", "Vasai", "Virar", "Kalyan", "Dombivli", "Ulhasnagar", "Panvel", "Mira Bhayandar", "Nagapattinam", "Thanjavur", "Kumbakonam", "Karaikal", "Pudukkottai", "Sivaganga", "Ramanathapuram", "Virudhunagar", "Thoothukudi", "Nagercoil", "Tirunelveli", "Dindigul", "Karur", "Namakkal", "Krishnagiri", "Dharmapuri", "Hosur", "Vellore", "Tiruvannamalai", "Villupuram", "Cuddalore", "Ariyalur", "Perambalur", "Mayiladuthurai", "Tiruvarur", "Kanchipuram", "Chengalpattu", "Tiruvallur",

  "Nagarkurnool", "Mahbubnagar", "Nalgonda", "Suryapet", "Jagtial", "Mancherial", "Adilabad", "Nirmal", "Kamareddy", "Sangareddy", "Medak", "Siddipet", "Vikarabad", "Rangareddy", "Yadadri", "Bhongir", "Mulugu", "Jayashankar", "Bhupalpally", "Mahabubabad", "Jangaon", "Hanamkonda",

  "Ongole", "Chittoor", "Vizianagaram", "Srikakulam", "Bhimavaram", "Eluru", "Machilipatnam", "Tenali", "Narasaraopet", "Gudivada", "Proddatur", "Hindupur", "Adoni", "Nandyal", "Markapur", "Chirala", "Bapatla", "Amalapuram", "Tadepalligudem", "Tanuku", "Pithapuram", "Samalkot", "Anakapalle", "Vizag Steel Township", "Gajuwaka", "Malkapuram", "Simhachalam", "Marripalem", "Kancharapalem", "Gopalapatnam", "Madhurawada", "Pedagantyada", "Parawada", "Sabbavaram", "Pendurthi", "Chodavaram", "Yelamanchili", "Payakaraopeta", "Narsipatnam", "Kotapadu", "Annavaram", "Tuni", "Etapaka", "Polavaram", "Rampachodavaram", "Maredumilli", "Paderu", "Araku Valley", "S Kota", "Bobbili", "Parvathipuram", "Salur", "Palakonda", "Seethampeta", "Amadalavalasa", "Narasannapeta", "Ichchapuram", "Sompeta", "Palasa", "Tekkali", "Kaviti", "Mandasa", "Vajrapukotturu", "Pathapatnam", "Hiramandalam", "Kothuru", "Bhamini", "Veeraghattam", "Burja", "Ponduru", "Santhabommali", "Kotabommali", "Jalumuru", "Saravakota", "Laveru", "Ranastalam", "Etcherla",

  "Berhampur", "Puri", "Khurda", "Angul", "Dhenkanal", "Jajpur", "Kendrapara", "Jagatsinghpur", "Nayagarh", "Boudh", "Kandhamal", "Kalahandi", "Balangir", "Nuapada", "Nabarangpur", "Koraput", "Malkangiri", "Rayagada", "Sundargarh", "Jharsuguda", "Bargarh", "Sonepur", "Keonjhar", "Mayurbhanj", "Baripada", "Bhadrak", "Jaleswar", "Basudevpur", "Chandbali", "Dhamra", "Paradip", "Talcher", "Athmallik", "Kamakhyanagar", "Bhawanipatna", "Titlagarh", "Kesinga", "Kantabanji", "Patnagarh", "Bolangir", "Saintala", "Loisingha", "Turekela", "Khaprakhol", "Muribahal", "Belpara", "Deogaon", "Agalpur", "Tusura", "Tarbha", "Subarnapur", "Binika", "Birmaharajpur", "Ulunda", "Rampur", "Rairakhol", "Kuchinda", "Rajgangpur", "Bonai", "Koira", "Tensa", "Biramitrapur", "Hemgir", "Lephripara", "Bhasma", "Tangarpali", "Balishankara", "Bhawanipur", "Bhubaneswar outskirts",
];


// ── Login Result Popup Modal ───────────────────────────────────────────────
function LoginResultPopup({ popup, onClose, onSwitchTab, onOpenJoinForm, navigate }) {
  if (!popup) return null;

  const config = {
    not_found: {
      icon: "🔍",
      title: popup.title || "Account Not Found",
      titleColor: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
      primaryBtnText: "📝 Create a New Account",
      primaryAction: () => { onClose(); navigate("/signup"); },
      secondaryBtnText: "Try Again",
      secondaryAction: onClose,
    },
    not_provider: {
      icon: "🛠️",
      title: popup.title || "No Provider Account Found",
      titleColor: "#1e3a8a",
      bg: "#eff6ff",
      border: "#bfdbfe",
      primaryBtnText: "🛠️ Register as Service Provider",
      primaryAction: () => { onClose(); onOpenJoinForm(); },
      secondaryBtnText: "👤 Sign In as Customer",
      secondaryAction: () => { onClose(); onSwitchTab("user"); },
    },
    worker_only: {
      icon: "🛠️",
      title: popup.title || "Service Provider Account",
      titleColor: "#065f46",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      primaryBtnText: "🛠️ Switch to Service Provider Tab",
      primaryAction: () => { onClose(); onSwitchTab("provider"); },
      secondaryBtnText: "Close",
      secondaryAction: onClose,
    },
    blocked: {
      icon: "🚫",
      title: popup.title || "Account Blocked",
      titleColor: "#991b1b",
      bg: "#fef2f2",
      border: "#fecaca",
      primaryBtnText: "📞 Contact Support",
      primaryAction: () => { onClose(); navigate("/support"); },
      secondaryBtnText: "Close",
      secondaryAction: onClose,
    },
    error: {
      icon: "❌",
      title: popup.title || "Sign In Failed",
      titleColor: "#991b1b",
      bg: "#fef2f2",
      border: "#fecaca",
      primaryBtnText: "Try Again",
      primaryAction: onClose,
    }
  }[popup.type] || {
    icon: "⚠️",
    title: popup.title || "Notice",
    titleColor: "#92400e",
    bg: "#fffbeb",
    border: "#fde68a",
    primaryBtnText: "OK",
    primaryAction: onClose,
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(8px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "var(--bg-card, #ffffff)",
        border: `2px solid ${config.border}`,
        borderRadius: "20px",
        padding: "36px 30px",
        maxWidth: "420px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        animation: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both"
      }}>
        <div style={{ fontSize: "50px", marginBottom: "12px", lineHeight: 1 }}>
          {config.icon}
        </div>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "20px", fontWeight: 800, color: config.titleColor }}>
          {config.title}
        </h2>
        <p style={{ margin: "0 0 24px 0", fontSize: "13.5px", color: "var(--text-secondary, #64748b)", lineHeight: 1.65 }}>
          {popup.message}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {config.primaryBtnText && (
            <button
              onClick={config.primaryAction}
              style={{
                background: "linear-gradient(135deg, #dfb453 0%, #f1a829 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(223, 180, 83, 0.35)",
                transition: "all 0.2s"
              }}
            >
              {config.primaryBtnText}
            </button>
          )}

          {config.secondaryBtnText && (
            <button
              onClick={config.secondaryAction}
              style={{
                background: "transparent",
                color: "var(--text-muted, #64748b)",
                border: "1.5px solid var(--border, #cbd5e1)",
                borderRadius: "10px",
                padding: "11px 20px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {config.secondaryBtnText}
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.72); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function Login() {
  const [activeTab, setActiveTab] = useState("user"); // "user" | "provider"

  // Separate form state for User tab
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Separate form state for Provider tab
  const [providerEmail, setProviderEmail] = useState("");
  const [providerPassword, setProviderPassword] = useState("");
  const [showProviderPassword, setShowProviderPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(window.location.hash.includes("access_token"));
  const [loginStatus, setLoginStatus] = useState(null);
  const [popupModal, setPopupModal] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Join-as-provider sub-form state
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [showJoinPassword, setShowJoinPassword] = useState(false);
  const [joinProfession, setJoinProfession] = useState("");
  const [joinCity, setJoinCity] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState(null);

  const navigate = useNavigate();

  // ── Helper to convert server error string to structured popup ─────────────
  const parseErrorToPopup = (errMsg) => {
    const msg = errMsg || "";
    if (
      msg.toLowerCase().includes("no account found") || 
      msg.toLowerCase().includes("sign up first") || 
      msg.toLowerCase().includes("does not exist")
    ) {
      return {
        type: "not_found",
        title: "Account Not Found",
        message: msg || "No registered account found with this email. Please sign up to create a new account."
      };
    }
    if (
      msg.toLowerCase().includes("service provider only") || 
      msg.toLowerCase().includes("switch to the service provider tab")
    ) {
      return {
        type: "worker_only",
        title: "Service Provider Account",
        message: msg || "This account is registered strictly as a Service Provider. Please switch to the Service Provider tab to sign in."
      };
    }
    if (
      msg.toLowerCase().includes("no service provider profile") || 
      msg.toLowerCase().includes("registered as a customer") ||
      msg.toLowerCase().includes("switch to the user tab")
    ) {
      return {
        type: "not_provider",
        title: "Customer Account",
        message: msg || "This account is registered as a Customer. Please switch to the User tab to sign in."
      };
    }
    if (msg.toLowerCase().includes("blocked")) {
      return {
        type: "blocked",
        title: "Account Access Blocked",
        message: msg || "Your account has been permanently blocked by administrative control."
      };
    }
    return null;
  };

  // ── Google OAuth handler ─────────────────────────────────────────────────
  const handleGoogleLoginWithToken = async (accessToken, targetLoginAs = "user") => {
    setIsLoading(true);
    setLoginStatus({ type: "success", message: "Verifying Google Authentication... 🔑" });
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, loginAs: targetLoginAs }),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        setIsLoading(false);
        const popup = parseErrorToPopup(data.error);
        if (popup) {
          setPopupModal(popup);
        }
        setLoginStatus({ type: "error", message: data.error || "Google Sign-In failed!" });
        return;
      }
      handleLoginSuccess(data, data.loginContext || targetLoginAs);
    } catch (err) {
      setIsLoading(false);
      setLoginStatus({ type: "error", message: "Network error! Backend is unreachable." });
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        window.history.replaceState(null, null, window.location.pathname);
        const flow = sessionStorage.getItem("google_auth_flow");
        if (flow === "signup") {
          navigate(`/signup#access_token=${accessToken}`);
        } else if (flow === "provider_login") {
          setActiveTab("provider");
          sessionStorage.removeItem("google_auth_flow");
          handleGoogleLoginWithToken(accessToken, "provider");
        } else {
          setActiveTab("user");
          sessionStorage.removeItem("google_auth_flow");
          handleGoogleLoginWithToken(accessToken, "user");
        }
      }
    }
    const redirectError = sessionStorage.getItem("google_auth_error");
    if (redirectError) {
      const popup = parseErrorToPopup(redirectError);
      if (popup) {
        setPopupModal(popup);
      }
      setLoginStatus({ type: "error", message: redirectError });
      sessionStorage.removeItem("google_auth_error");
    }
    fetchAllWorkersCached();
    const savedCity = localStorage.getItem("userCity");
    if (savedCity) {
      fetch(`/api/workers/geocode?q=${encodeURIComponent(savedCity)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.lat && data?.lon) {
            localStorage.setItem("userLocation", data.label || savedCity);
            localStorage.setItem("userCoordsLat", String(parseFloat(data.lat)));
            localStorage.setItem("userCoordsLng", String(parseFloat(data.lon)));
          }
        })
        .catch(() => { });
    }
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Shared session writer ────────────────────────────────────────────────
  const handleLoginSuccess = (data, forcedContext = null) => {
    const user = data.user;
    if (!user) {
      setLoginStatus({ type: "error", message: "Authentication response is missing user data." });
      setIsLoading(false);
      return;
    }

    const context = forcedContext || data.loginContext || (user.role === "admin" ? "admin" : (user.role === "worker" ? "provider" : "user"));
    const activeRole = context === "admin" ? "admin" : (context === "provider" ? "worker" : "user");

    // Clear previous sessions to avoid data bleeding
    sessionStorage.removeItem("loggedInWorkerId");
    sessionStorage.removeItem("workerSession_email");
    sessionStorage.removeItem("workerSession_profileId");
    sessionStorage.removeItem("workerSession_name");

    // ── Session write ────────────────────────────────────
    sessionStorage.setItem("userRole", activeRole);
    sessionStorage.setItem("actualRole", user.actualRole || user.role);
    sessionStorage.setItem("userName", user.name);
    sessionStorage.setItem("userEmail", user.email);
    sessionStorage.setItem("userId", user.id || user._id);
    sessionStorage.setItem("authToken", data.token);
    sessionStorage.setItem("isWorker", String(user.isWorker || false));
    sessionStorage.setItem("workerProfileId", user.workerProfileId || "");
    sessionStorage.setItem("loginContext", context);

    // ── Worker session (only when acting in provider role) ─────────
    if (activeRole === "worker" || user.isWorker) {
      const wId = user.workerProfileId || (data.worker ? data.worker.id : (user.id || user._id));
      sessionStorage.setItem("loggedInWorkerId", String(wId));
      sessionStorage.setItem("workerSession_email", user.email);
      sessionStorage.setItem("workerSession_profileId", String(wId));
      sessionStorage.setItem("workerSession_name", user.name);
    }

    localStorage.removeItem("manualLocationSet");

    // ── Persist session for 1 week ────────────────────────────────────────
    localStorage.setItem("authSession", JSON.stringify({
      userRole: activeRole,
      actualRole: user.actualRole || user.role,
      loginContext: context,
      userName: user.name,
      userEmail: user.email,
      userId: user.id || user._id,
      authToken: data.token,
      isWorker: user.isWorker || false,
      workerProfileId: user.workerProfileId || null,
      loggedInWorkerId: (activeRole === "worker" || user.isWorker) ? (user.workerProfileId || user.id || user._id) : null,
      userCity: user.city || null,
      expiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }));

    window.dispatchEvent(new Event("storage"));

    // ── Redirect logic ────────────────────────────────────────────────────
    if (activeRole === "admin" || user.role === "admin") {
      setLoginStatus({ type: "success", message: "Welcome Administrator! Redirecting... 👑" });
      setTimeout(() => navigate("/admin-dashboard"), 800);
    } else if (activeRole === "worker" || context === "provider") {
      setLoginStatus({ type: "success", message: `Welcome ${user.name}! Redirecting to worker dashboard... 🛠️` });
      setTimeout(() => navigate("/worker-dashboard"), 800);
    } else {
      // Regular user / Customer
      setLoginStatus({ type: "success", message: `Welcome ${user.name}! Redirecting... 🎉` });
      if (user.city) {
        sessionStorage.setItem("userCity", user.city);
        localStorage.setItem("userCity", user.city);
      }
      const targetCity = user.city || "Mumbai";
      setTimeout(() => navigate("/"), 800);
      fetch(`/api/workers/geocode?q=${encodeURIComponent(targetCity)}`)
        .then(res => res.ok ? res.json() : null)
        .then(geoData => {
          if (geoData?.lat && geoData?.lon) {
            localStorage.setItem("userLocation", geoData.label || targetCity);
            localStorage.setItem("userCoordsLat", String(parseFloat(geoData.lat)));
            localStorage.setItem("userCoordsLng", String(parseFloat(geoData.lon)));
          }
        })
        .catch(() => { });
    }
  };

  // ── User Login ───────────────────────────────────────────────────────────
  const handleUserLogin = async (e) => {
    e.preventDefault();
    if (!userEmail || !userPassword) {
      setLoginStatus({ type: "error", message: "Please fill in email and password!" });
      return;
    }
    setIsLoading(true);
    setLoginStatus(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: userPassword, loginAs: "user" }),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        setIsLoading(false);
        const popup = parseErrorToPopup(data.error);
        if (popup) {
          setPopupModal(popup);
        }
        setLoginStatus({ type: "error", message: data.error || "Invalid email or password!" });
        return;
      }
      handleLoginSuccess(data, data.loginContext || "user");
    } catch (err) {
      setIsLoading(false);
      setLoginStatus({ type: "error", message: "Network error! Backend is unreachable." });
    }
  };

  // ── Provider Login ───────────────────────────────────────────────────────
  const handleProviderLogin = async (e) => {
    e.preventDefault();
    if (!providerEmail || !providerPassword) {
      setLoginStatus({ type: "error", message: "Please fill in provider email and password!" });
      return;
    }
    setIsLoading(true);
    setLoginStatus(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: providerEmail, password: providerPassword, loginAs: "provider" }),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        setIsLoading(false);
        const popup = parseErrorToPopup(data.error);
        if (popup) {
          setPopupModal(popup);
        }
        setLoginStatus({ type: "error", message: data.error || "Invalid email or password!" });
        return;
      }
      handleLoginSuccess(data, data.loginContext || "provider");
    } catch (err) {
      setIsLoading(false);
      setLoginStatus({ type: "error", message: "Network error! Backend is unreachable." });
    }
  };

  // ── Join as Service Provider ─────────────────────────────────────────────
  const handleJoinAsWorker = async (e) => {
    e.preventDefault();
    setJoinStatus(null);

    // All fields are mandatory
    if (!joinName.trim() || !joinPhone.trim() || !joinEmail || !joinPassword || !joinProfession || !joinCity) {
      setJoinStatus({ type: "error", message: "Please fill in all fields (Name, Phone, Email, Password, Profession, Location)." });
      return;
    }
    // Phone validation
    if (!/^\d{10}$/.test(joinPhone.trim())) {
      setJoinStatus({ type: "error", message: "Please enter a valid 10-digit phone number." });
      return;
    }
    // Password strength
    const hasLetter = /[a-zA-Z]/.test(joinPassword);
    const hasNumber = /[0-9]/.test(joinPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(joinPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      setJoinStatus({ type: "error", message: "Password must have at least one letter, one number, and one special character." });
      return;
    }

    setIsJoining(true);
    try {
      // Try to register as a brand-new worker account
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: joinName.trim(),
          email: joinEmail,
          password: joinPassword,
          phone: joinPhone.trim(),
          role: "worker",
          profession: joinProfession,
          city: joinCity,
        }),
      });
      const data = await safeJson(response);

      // If account already exists, try upgrading via join-as-worker
      if (response.status === 400 && data.error?.toLowerCase().includes("already exists")) {
        const joinResp = await fetch("/api/auth/join-as-worker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: joinEmail,
            password: joinPassword,
            profession: joinProfession,
            city: joinCity,
          }),
        });
        const joinData = await safeJson(joinResp);
        if (!joinResp.ok) {
          setIsJoining(false);
          setJoinStatus({ type: "error", message: joinData.error || "Registration failed. Please try again." });
          return;
        }
        setJoinStatus({ type: "success", message: `🎉 Service provider profile created! Logging you in...` });
        setTimeout(() => {
          setIsJoining(false);
          handleLoginSuccess(joinData, "provider");
        }, 900);
        return;
      }

      if (!response.ok) {
        setIsJoining(false);
        setJoinStatus({ type: "error", message: data.error || "Registration failed. Please try again." });
        return;
      }

      // New account created — auto-login
      setJoinStatus({ type: "success", message: `🎉 Worker account created for ${joinName.trim()}! Logging you in...` });
      setTimeout(() => {
        setIsJoining(false);
        // For new registration, we need to login since register doesn't return a session
        handleProviderAutoLogin(joinEmail, joinPassword);
      }, 900);
    } catch (err) {
      setIsJoining(false);
      setJoinStatus({ type: "error", message: "Network error! Backend is unreachable." });
    }
  };

  // Auto-login helper after new worker registration
  const handleProviderAutoLogin = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, loginAs: "provider" }),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        setJoinStatus({ type: "success", message: "Account created! Please sign in with your credentials above." });
        setProviderEmail(email);
        setShowJoinForm(false);
        return;
      }
      handleLoginSuccess(data, data.loginContext || "provider");
    } catch (err) {
      setJoinStatus({ type: "success", message: "Account created! Please sign in with your credentials above." });
      setProviderEmail(email);
      setShowJoinForm(false);
    }
  };

  // ── Google Sign-In ────────────────────────────────────────────────────────
  // flow: "user_login" (user tab) | "provider_login" (provider tab)
  const handleGoogleSignIn = (flow = "user_login") => {
    const targetLoginAs = flow === "provider_login" ? "provider" : "user";
    setIsLoading(true);
    setLoginStatus({ type: "success", message: "Connecting to Google... 🔑" });

    triggerGoogleAuth({
      flow,
      navigate,
      onSuccess: async (accessToken) => {
        await handleGoogleLoginWithToken(accessToken, targetLoginAs);
      },
      onError: (errMsg) => {
        setIsLoading(false);
        if (typeof errMsg === "string" && errMsg.toLowerCase().includes("closed")) {
          setLoginStatus(null);
          return;
        }
        setLoginStatus({ type: "error", message: errMsg });
      },
    });
  };

  // ── Shared status banner ─────────────────────────────────────────────────
  const StatusBanner = ({ status }) => status ? (
    <div style={{
      padding: isMobile ? "10px 14px" : "12px 16px",
      borderRadius: "10px",
      marginBottom: isMobile ? "12px" : "16px",
      fontSize: isMobile ? "12px" : "13px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      animation: "fadeIn 0.3s ease-out forwards",
      backgroundColor: status.type === "success" ? "#dcfce7" : "#fee2e2",
      color: status.type === "success" ? "#15803d" : "#dc2626",
      border: `1px solid ${status.type === "success" ? "#bbf7d0" : "#fecaca"}`,
    }}>
      <span style={{ fontSize: "16px" }}>{status.type === "success" ? "✅" : "❌"}</span>
      {status.message}
    </div>
  ) : null;

  // ── Spinner ───────────────────────────────────────────────────────────────
  const Spinner = () => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <span style={{
        width: "14px", height: "14px",
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "white",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.6s linear infinite",
      }} />
      Processing...
    </span>
  );

  // ── Styles ────────────────────────────────────────────────────────────────
  const tabBtn = (active) => ({
    flex: 1,
    padding: isMobile ? "9px 6px" : "11px 8px",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: isMobile ? "12px" : "13px",
    cursor: "pointer",
    transition: "all 0.25s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    background: active
      ? "linear-gradient(135deg, #dfb453 0%, #f1a829 100%)"
      : "transparent",
    color: active ? "white" : "var(--text-muted)",
    boxShadow: active ? "0 4px 12px rgba(223,180,83,0.35)" : "none",
  });

  const inputStyle = (errorActive) => ({
    width: "100%",
    boxSizing: "border-box",
    padding: isMobile ? "10px" : "12px",
    borderColor: errorActive ? "#fecaca" : undefined,
    transition: "border-color 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div
        className="auth-wrapper"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: isMobile ? "20px 14px 32px" : "40px 24px 48px",
          backgroundImage: `url(${isMobile ? authMobileBg : authBg})`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#b4d5fa",
          overflowY: "auto",
        }}
      >
        <div
          className="premium-card"
          style={{
            width: isMobile ? "92%" : "100%",
            maxWidth: isMobile ? "360px" : "420px",
            backgroundColor: "var(--bg-card)",
            padding: isMobile ? "22px 18px" : "36px 40px",
            marginTop: isMobile ? "8px" : "0",
          }}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? "16px" : "22px" }}>
            <h1 style={{ margin: isMobile ? "0 0 4px" : "0 0 6px", fontSize: isMobile ? "22px" : "26px", fontWeight: 800, color: "var(--text-main)" }}>
              Welcome Back
            </h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: isMobile ? "12px" : "13px" }}>
              Sign in to manage your bookings and services
            </p>
          </div>

          {/* ── Tab Switcher ────────────────────────────────────────────── */}
          <div style={{
            display: "flex",
            gap: "6px",
            background: "var(--bg-secondary, #f1f5f9)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: isMobile ? "16px" : "20px",
          }}>
            <button
              id="tab-login-user"
              onClick={() => { setActiveTab("user"); setLoginStatus(null); setJoinStatus(null); setShowJoinForm(false); }}
              style={tabBtn(activeTab === "user")}
            >
              <FaUser size={13} />
              Login as User
            </button>
            <button
              id="tab-login-provider"
              onClick={() => { setActiveTab("provider"); setLoginStatus(null); setJoinStatus(null); }}
              style={tabBtn(activeTab === "provider")}
            >
              <FaHardHat size={13} />
              Service Provider
            </button>
          </div>

          {/* ── Status ──────────────────────────────────────────────────── */}
          <StatusBanner status={loginStatus} />

          {/* ════════════════════════════════════════════════════════════
              TAB A — LOGIN AS USER
          ════════════════════════════════════════════════════════════ */}
          {activeTab === "user" && (
            <>
              <form onSubmit={handleUserLogin} style={{ display: "flex", flexDirection: "column", gap: isMobile ? "13px" : "18px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, color: "var(--text-main)" }}>Email Address</label>
                  <input
                    id="user-email"
                    type="email"
                    placeholder="name@example.com"
                    value={userEmail}
                    onChange={(e) => { setUserEmail(e.target.value); setLoginStatus(null); }}
                    style={inputStyle(loginStatus?.type === "error")}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, color: "var(--text-main)" }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="user-password"
                      type={showUserPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={userPassword}
                      onChange={(e) => { setUserPassword(e.target.value); setLoginStatus(null); }}
                      style={{ ...inputStyle(loginStatus?.type === "error"), paddingRight: "40px" }}
                    />
                    <span
                      role="button"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-muted)", padding: "4px", userSelect: "none" }}
                    >
                      {showUserPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </span>
                  </div>
                </div>

                <button
                  id="user-login-btn"
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                  style={{
                    padding: isMobile ? "10px" : "12px",
                    fontSize: isMobile ? "14px" : "15px",
                    marginTop: "4px",
                    width: "100%",
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    background: "linear-gradient(135deg, #dfb453 0%, #f1a829 100%)",
                    borderBottom: "4px solid #a67c1e",
                    color: "white",
                    boxShadow: "0 10px 30px rgba(223,180,83,0.25)",
                  }}
                >
                  {isLoading ? <Spinner /> : "Sign In as User"}
                </button>
              </form>

              {/* Divider + Google */}
              <div style={{ display: "flex", alignItems: "center", margin: isMobile ? "14px 0" : "18px 0" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
                <span style={{ padding: "0 10px", color: "var(--text-muted)", fontSize: "12px" }}>or continue with</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
              </div>
              <button
                id="user-google-btn"
                type="button"
                onClick={() => handleGoogleSignIn("user_login")}
                className="btn-secondary"
                style={{ padding: isMobile ? "10px" : "12px", fontSize: isMobile ? "14px" : "15px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "none" }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: "10px" }}>
                  <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.7-1.57 2.68-3.88 2.68-6.57z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.23l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z" />
                  <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5H.95C.35 6.2.01 7.57.01 9s.34 2.8 1.04 4l2.92-2.3z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.41 0 9 0 5.5 0 2.43 2.11.95 5.1l2.97 2.3c.7-2.12 2.69-3.82 5.03-3.82z" />
                </svg>
                Sign In with Google
              </button>

              <p style={{ textAlign: "center", marginTop: isMobile ? "14px" : "20px", fontSize: isMobile ? "13px" : "14px", color: "var(--text-muted)" }}>
                Don't have an account?{" "}
                <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
              </p>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════
              TAB B — SERVICE PROVIDER
          ════════════════════════════════════════════════════════════ */}
          {activeTab === "provider" && (
            <>
              {/* Provider login: separate provider email/password */}
              <form onSubmit={handleProviderLogin} style={{ display: "flex", flexDirection: "column", gap: isMobile ? "13px" : "18px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, color: "var(--text-main)" }}>Provider Email</label>
                  <input
                    id="provider-email"
                    type="email"
                    placeholder="your@email.com"
                    value={providerEmail}
                    onChange={(e) => { setProviderEmail(e.target.value); setLoginStatus(null); }}
                    style={inputStyle(loginStatus?.type === "error")}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, color: "var(--text-main)" }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="provider-password"
                      type={showProviderPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={providerPassword}
                      onChange={(e) => { setProviderPassword(e.target.value); setLoginStatus(null); }}
                      style={{ ...inputStyle(loginStatus?.type === "error"), paddingRight: "40px" }}
                    />
                    <span role="button" onClick={() => setShowProviderPassword(!showProviderPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-muted)", padding: "4px", userSelect: "none" }}>
                      {showProviderPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </span>
                  </div>
                </div>
                <button
                  id="provider-login-btn"
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: isMobile ? "10px" : "12px",
                    fontSize: isMobile ? "14px" : "15px",
                    width: "100%",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                    background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
                    color: "white",
                    boxShadow: "0 8px 24px rgba(30,58,95,0.28)",
                    transition: "all 0.2s",
                  }}
                >
                  {isLoading ? <Spinner /> : "🛠️ Sign In as Provider"}
                </button>
              </form>

              {/* Google Sign-In for Provider */}
              <div style={{ display: "flex", alignItems: "center", margin: isMobile ? "14px 0 10px" : "18px 0 12px" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
                <span style={{ padding: "0 10px", color: "var(--text-muted)", fontSize: "12px" }}>or sign in with</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
              </div>
              <button
                id="provider-google-btn"
                type="button"
                onClick={() => handleGoogleSignIn("provider_login")}
                className="btn-secondary"
                style={{
                  padding: isMobile ? "10px" : "12px",
                  fontSize: isMobile ? "14px" : "15px",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "none",
                  marginBottom: isMobile ? "14px" : "18px",
                  border: "1.5px solid #1e3a5f30",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: "10px" }}>
                  <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.7-1.57 2.68-3.88 2.68-6.57z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.23l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z" />
                  <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5H.95C.35 6.2.01 7.57.01 9s.34 2.8 1.04 4l2.92-2.3z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.41 0 9 0 5.5 0 2.43 2.11.95 5.1l2.97 2.3c.7-2.12 2.69-3.82 5.03-3.82z" />
                </svg>
                Continue with Google as Provider
              </button>

              {/* ── Join as Service Provider (Inline Registration) ──── */}
              <div style={{ marginTop: isMobile ? "10px" : "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowJoinForm(!showJoinForm)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: isMobile ? "10px" : "12px",
                    border: "1.5px dashed var(--border, #cbd5e1)",
                    borderRadius: "10px",
                    backgroundColor: showJoinForm ? "rgba(30, 58, 95, 0.06)" : "transparent",
                    color: "var(--text-main, #1e293b)",
                    fontSize: isMobile ? "13px" : "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  🛠️ {showJoinForm ? "Hide Registration Form" : "New? Register as Service Provider"}
                  {showJoinForm ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                </button>

                {showJoinForm && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: isMobile ? "16px 14px" : "20px",
                      borderRadius: "14px",
                      border: "1.5px solid var(--border, #e2e8f0)",
                      backgroundColor: "var(--bg-card-hover, #f8fafc)",
                      animation: "fadeIn 0.3s ease-out forwards",
                    }}
                  >
                    <h3 style={{ margin: "0 0 4px 0", fontSize: isMobile ? "15px" : "16px", fontWeight: 800, color: "var(--text-main)" }}>
                      🛠️ Worker Registration
                    </h3>
                    <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "var(--text-secondary, #64748b)" }}>
                      Fill in your details to register as a service provider
                    </p>

                    <StatusBanner status={joinStatus} />

                    <form onSubmit={handleJoinAsWorker} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Full Name *</label>
                        <input
                          id="join-name"
                          type="text"
                          placeholder="e.g. Harsha Vardhan"
                          value={joinName}
                          onChange={(e) => setJoinName(e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border, #cbd5e1)", background: "var(--bg-card, #fff)", color: "var(--text-main)", fontSize: "14px" }}
                          required
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Phone Number * <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 400 }}>(10 digits)</span></label>
                        <input
                          id="join-phone"
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={joinPhone}
                          onChange={(e) => setJoinPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          maxLength={10}
                          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border, #cbd5e1)", background: "var(--bg-card, #fff)", color: "var(--text-main)", fontSize: "14px" }}
                          required
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Email Address *</label>
                        <input
                          id="join-email"
                          type="email"
                          placeholder="name@example.com"
                          value={joinEmail}
                          onChange={(e) => setJoinEmail(e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border, #cbd5e1)", background: "var(--bg-card, #fff)", color: "var(--text-main)", fontSize: "14px" }}
                          required
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Password *</label>
                        <div style={{ position: "relative" }}>
                          <input
                            id="join-password"
                            type={showJoinPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={joinPassword}
                            onChange={(e) => setJoinPassword(e.target.value)}
                            style={{ width: "100%", boxSizing: "border-box", padding: "10px 40px 10px 12px", borderRadius: "8px", border: "1px solid var(--border, #cbd5e1)", background: "var(--bg-card, #fff)", color: "var(--text-main)", fontSize: "14px" }}
                            required
                          />
                          <span
                            role="button"
                            onClick={() => setShowJoinPassword(!showJoinPassword)}
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-muted)", padding: "4px", userSelect: "none" }}
                          >
                            {showJoinPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Service / Profession *</label>
                        <select
                          id="join-profession"
                          value={joinProfession}
                          onChange={(e) => setJoinProfession(e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border, #cbd5e1)", background: "var(--bg-card, #fff)", color: "var(--text-main)", fontSize: "14px" }}
                          required
                        >
                          <option value="">Select your profession...</option>
                          {PROFESSIONS.map((g) => (
                            <optgroup key={g.group} label={g.group}>
                              {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Serving Location *</label>
                        <input
                          id="join-city"
                          type="text"
                          placeholder="e.g. Kakinada or Rajahmundry"
                          value={joinCity}
                          onChange={(e) => setJoinCity(e.target.value)}
                          list="join-cities-list"
                          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border, #cbd5e1)", background: "var(--bg-card, #fff)", color: "var(--text-main)", fontSize: "14px" }}
                          required
                        />
                        <datalist id="join-cities-list">
                          {CITIES.slice(0, 50).map((c) => <option key={c} value={c} />)}
                        </datalist>
                      </div>

                      <button
                        id="join-provider-btn"
                        type="submit"
                        disabled={isJoining}
                        style={{
                          padding: isMobile ? "10px" : "12px",
                          fontSize: isMobile ? "14px" : "15px",
                          width: "100%",
                          border: "none",
                          borderRadius: "10px",
                          fontWeight: 700,
                          cursor: isJoining ? "not-allowed" : "pointer",
                          opacity: isJoining ? 0.7 : 1,
                          background: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
                          color: "white",
                          boxShadow: "0 6px 18px rgba(5, 150, 105, 0.3)",
                          transition: "all 0.2s",
                          marginTop: "4px",
                        }}
                      >
                        {isJoining ? <Spinner /> : "🚀 Register & Sign In as Provider"}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <p style={{ textAlign: "center", marginTop: isMobile ? "14px" : "20px", fontSize: isMobile ? "12px" : "13px", color: "var(--text-muted)" }}>
                New to Workzy?{" "}
                <Link to="/signup" state={{ role: "worker" }} style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign up as a provider</Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Login Result Popup Modal */}
      <LoginResultPopup
        popup={popupModal}
        onClose={() => setPopupModal(null)}
        onSwitchTab={(tab) => {
          setActiveTab(tab);
          setLoginStatus(null);
        }}
        onOpenJoinForm={() => {
          setActiveTab("provider");
          setShowJoinForm(true);
          setLoginStatus(null);
        }}
        navigate={navigate}
      />

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "22px", color: "var(--text-secondary)", fontSize: "13px", backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-color)", fontWeight: 500 }}>
        © 2026 Workzy Inc. All rights reserved. Made with ❤️ by PS-152 Team.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default Login;

