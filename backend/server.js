import express from "express";
import path from "path";
import cluster from "cluster";
import os from "os";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
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
import { checkSubscriptionExpiries } from "./controllers/userController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ override: true });

// Connect Database — wrapped in try/catch so a MongoDB error never
// calls process.exit() and kills the Vercel serverless function.
(async () => {
  try {
    await connectDB();
    console.log("🚀 Workzy API Server is LIVE & ACTIVE on http://localhost:5000");
    console.log("🟢 Ready to process incoming frontend requests!");
  } catch (err) {
    console.error("⚠️  DB startup connection failed (will retry per request):", err.message);
  }
})();

const app = express();

// Trust proxy headers for rate limiting (needed behind reverse proxies like Vercel/Webpack)
app.set("trust proxy", 1);

// HTTP Request Logger for active visibility
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

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

// ── SERVERLESS LAZY CRON ──
// Runs globally on Vercel and Locally by piggybacking on web traffic
let lastCronRun = 0;
app.use(async (req, res, next) => {
  next(); // Instantly pass request forward without blocking
  
  const now = Date.now();
  if (now - lastCronRun > 60000) { // Throttle: Only run once per minute maximum
    lastCronRun = now;
    try {
      await checkBookingTimeouts();
      await checkSubscriptionExpiries();
    } catch(err) {
      console.error("⚠️ Lazy Cron Error:", err.message);
    }
  }
});

// ── Health check endpoint (no auth, no DB needed) ──
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV || "development" });
});

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

// ── PRODUCTION: Serve React frontend build ──
if (process.env.NODE_ENV === "production") {
  // Serve static files from the React build folder
  app.use(express.static(path.join(__dirname, "../build")));

  // Catch-all: any route not matched by /api/* serves React's index.html
  // Using a RegExp (/(.*)/) is fully compatible with Express 5 / path-to-regexp v8
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "../build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Backend Running — Development Mode");
  });
}

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.name === "CastError") {
    console.warn("⚠️ Mongoose CastError caught globally:", err.message);
    return res.status(400).json({ error: `Invalid identifier format: ${err.value}` });
  }
  console.error("💥 Unhandled Server Error:", err);
  res.status(500).json({ error: "An internal server error occurred." });
});

const PORT = process.env.PORT || 5000;

// Only start listening when running as a standalone server (not on Vercel serverless)
if (!process.env.VERCEL) {
  if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    console.log(`🚀 Primary cluster (PID: ${process.pid}) setting up ${numCPUs} workers...`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
  } else {
    app.listen(PORT, () => {
      console.log(`✅ Worker ${process.pid} running on ${PORT}`);
    });
  }
} else {
  console.log("Running on Vercel serverless — skipping app.listen() and setInterval");
}

export default app;
