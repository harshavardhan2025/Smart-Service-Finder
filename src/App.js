import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";


import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import WorkerProfile from "./pages/WorkerProfile";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import UserDashboard from "./pages/UserDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SupportPage from "./pages/SupportPage";
import MyBookings from "./pages/MyBookings";
import ReviewsRewards from "./pages/ReviewsRewards";
import Profile from "./pages/Profile";
import PlansOffers from "./pages/PlansOffers";
import AiChatBot from "./components/AiChatBot";
import GoogleAuthMock from "./pages/GoogleAuthMock";
import GlobalCallManager from "./components/GlobalCallManager";

// 🔐 SECURITY SHIELD: Prevent direct address bar entry by guests!
function PrivateRoute({ children }) {
  const isLoggedIn = !!sessionStorage.getItem("userId");
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function App() {
  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/search"
          element={<SearchResults />}
        />

        <Route
          path="/worker"
          element={<WorkerProfile />}
        />

        <Route
          path="/booking"
          element={<PrivateRoute><BookingPage /></PrivateRoute>}
        />

        <Route
          path="/payment"
          element={<PrivateRoute><PaymentPage /></PrivateRoute>}
        />

        <Route
          path="/user-dashboard"
          element={<UserDashboard />}
        />

        <Route
          path="/worker-dashboard"
          element={<PrivateRoute><WorkerDashboard /></PrivateRoute>}
        />

        <Route
          path="/admin-dashboard"
          element={<PrivateRoute><AdminDashboard /></PrivateRoute>}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />


        <Route
          path="/support"
          element={<PrivateRoute><SupportPage /></PrivateRoute>}
        />

        <Route
          path="/my-bookings"
          element={<PrivateRoute><MyBookings /></PrivateRoute>}
        />

        <Route
          path="/reviews"
          element={<PrivateRoute><ReviewsRewards /></PrivateRoute>}
        />

        <Route
          path="/profile"
          element={<PrivateRoute><Profile /></PrivateRoute>}
        />

        <Route
          path="/plans-offers"
          element={<PlansOffers />}
        />

        <Route
          path="/google-auth"
          element={<GoogleAuthMock />}
        />

      </Routes>

      <AiChatBot />
      <GlobalCallManager />

    </BrowserRouter>

  );
}

export default App;