import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Home from "./pages/Home";
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

function App() {
  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/worker"
          element={<WorkerProfile />}
        />

        <Route
          path="/booking"
          element={<BookingPage />}
        />

        <Route
          path="/payment"
          element={<PaymentPage />}
        />

        <Route
          path="/dashboard"
          element={<UserDashboard />}
        />

        <Route
          path="/worker-dashboard"
          element={<WorkerDashboard />}
        />

        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
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
          element={<SupportPage />}
        />

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />

        <Route
          path="/reviews"
          element={<ReviewsRewards />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/plans-offers"
          element={<PlansOffers />}
        />

      </Routes>

      <AiChatBot />

    </BrowserRouter>

  );
}

export default App;