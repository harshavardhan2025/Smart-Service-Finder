import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";

dotenv.config();

// Connect Database
connectDB();

import authRoutes from "./routes/authRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import callRoutes from "./routes/callRoutes.js";
import { checkBookingTimeouts } from "./controllers/bookingController.js";

const app = express();

// Trust proxy headers for rate limiting (needed behind reverse proxies like Vercel/Webpack)
app.set("trust proxy", 1);

const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 300, // limit to 5000 requests in dev to avoid blocking local testing/subagents
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});

app.use(compression());
app.use(limiter);
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/call", callRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("💥 Unhandled Server Error:", err);
  res.status(500).json({ error: "An unhandled server error occurred." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  // Start background timer to check for booking timeouts every 30 seconds
  setInterval(checkBookingTimeouts, 30000);
});

export default app;
