import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

// Eager load critical components for instant rendering on low internet
import Home from "./pages/Home";
import GlobalCallManager from "./components/GlobalCallManager";
import CustomAlert from "./components/CustomAlert";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Lazy load secondary routes so initial bundle download is fast & lightweight
const SearchResults = lazy(() => import("./pages/SearchResults"));
const WorkerProfile = lazy(() => import("./pages/WorkerProfile"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const WorkerDashboard = lazy(() => import("./pages/WorkerDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const ReviewsRewards = lazy(() => import("./pages/ReviewsRewards"));
const Profile = lazy(() => import("./pages/Profile"));
const PlansOffers = lazy(() => import("./pages/PlansOffers"));
const AiChatBot = lazy(() => import("./components/AiChatBot"));

// 🔒 PERSISTENT SESSION RESTORE: Recover auth from localStorage on cold start
function restoreSession() {
  if (sessionStorage.getItem("userId")) return; // Already active
  try {
    const raw = localStorage.getItem("authSession");
    if (!raw) return;
    const session = JSON.parse(raw);
    if (!session.expiry || Date.now() > session.expiry) {
      localStorage.removeItem("authSession");
      return;
    }
    sessionStorage.setItem("userRole",  session.userRole);
    sessionStorage.setItem("userName",  session.userName);
    sessionStorage.setItem("userEmail", session.userEmail);
    sessionStorage.setItem("userId",    session.userId);
    sessionStorage.setItem("authToken", session.authToken);

    // Dual-role: restore service-provider status
    sessionStorage.setItem("isWorker",        String(session.isWorker || false));
    sessionStorage.setItem("workerProfileId", session.workerProfileId || "");

    if (session.userRole === "worker" && (session.loggedInWorkerId || session.workerProfileId)) {
      const wId = session.workerProfileId || session.loggedInWorkerId;
      sessionStorage.setItem("loggedInWorkerId", String(wId));
      sessionStorage.setItem("workerSession_email",     session.userEmail);
      sessionStorage.setItem("workerSession_profileId", String(wId));
      sessionStorage.setItem("workerSession_name",      session.userName);
    } else {
      sessionStorage.removeItem("loggedInWorkerId");
      sessionStorage.removeItem("workerSession_email");
      sessionStorage.removeItem("workerSession_profileId");
      sessionStorage.removeItem("workerSession_name");
    }
    if (session.userCity) {
      sessionStorage.setItem("userCity", session.userCity);
      localStorage.setItem("userCity",   session.userCity);
    }
    console.info("Session restored for:", session.userName);
  } catch (e) {
    console.error("Session restore failed:", e);
    localStorage.removeItem("authSession");
  }
}

// Run immediately before any component renders
restoreSession();

// 🔐 SECURITY SHIELD: Prevent direct address bar entry by guests!
function PrivateRoute({ children }) {
  const isLoggedIn = !!sessionStorage.getItem("userId");
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

// Lightweight Loading Indicator for low internet connections
const PageLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "var(--primary)", fontWeight: 700, fontSize: "14px", gap: "10px" }}>
    <div style={{ width: "24px", height: "24px", border: "3px solid var(--primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
    <span>Loading Workzy...</span>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/worker" element={<WorkerProfile />} />
          <Route path="/booking" element={<PrivateRoute><BookingPage /></PrivateRoute>} />
          <Route path="/payment" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
          <Route path="/user-dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
          <Route path="/worker-dashboard" element={<PrivateRoute><WorkerDashboard /></PrivateRoute>} />
          <Route path="/admin-dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/support" element={<PrivateRoute><SupportPage /></PrivateRoute>} />
          <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
          <Route path="/reviews" element={<PrivateRoute><ReviewsRewards /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/plans-offers" element={<PlansOffers />} />
          <Route path="/plans" element={<PlansOffers />} />
        </Routes>
        <AiChatBot />
      </Suspense>

      <GlobalCallManager />
      <CustomAlert />
    </BrowserRouter>
  );
}

export default App;