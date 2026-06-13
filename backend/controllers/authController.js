import User from "../models/User.js";
import Worker from "../models/Worker.js";
import jwt from "jsonwebtoken";
import ActivityLog from "../models/ActivityLog.js";
import { getPriceMultiplier } from "../utils/geoUtils.js";
import mongoose from "mongoose";

// Helper to wait for DB connection to be fully ready
const ensureDbConnection = async () => {
  if (mongoose.connection.readyState === 1) return;
  console.log("⏳ [DB Connect] Database connection not ready. State:", mongoose.connection.readyState);
  // Wait for up to 5 seconds
  for (let i = 0; i < 10; i++) {
    if (mongoose.connection.readyState === 1) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

// Retry helper for async operations
const executeWithRetry = async (fn, retries = 3, initialDelay = 500) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ [Retry Helper] Operation failed (Attempt ${attempt}/${retries}): ${error.message}`);
      if (attempt < retries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ [Retry Helper] Waiting ${delay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

// Base prices per service category (Tier-2 city baseline)
const SERVICE_BASE_PRICES = {
  "Plumbing": 350,
  "Electrical": 400,
  "Carpentry": 600,
  "Haircut (Men)": 250,
  "Two-Wheeler (Bikes)": 500,
  "Car Wash": 300,
  "House Cleaning": 1500,
  "Photography": 2500,
  "Doctors & Medical": 539,
  "Interior Painting": 2000,
  "Packers & Movers": 10000,
  "AC Repair": 700,
  "Mechanic": 500,
  "Events": 5000,
  "Beauty, Salon & Spa": 800,
};

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error("🚨 CRITICAL SYSTEM ERROR: JWT_SECRET environment variable IS NOT CONFIGURED!");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET || "TEMPORARY_EMERGENCY_KEY_PLEASE_CONFIGURE_ENV", {
    expiresIn: "30d",
  });
};

export const registerUser = async (req, res) => {
  try {
    const { email, password, name, role, profession, city, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      city,
      phone
    });

    if (role === "worker") {
      const basePrice = SERVICE_BASE_PRICES[profession] || 350;
      const multiplier = getPriceMultiplier(city || "");
      const locationPrice = Math.round(basePrice * multiplier);

      await Worker.create({
        name,
        email,
        service: profession,
        city,
        rating: 2.7,      // Bayesian new-worker baseline
        ratingSum: 0,
        reviews: 0,
        price: locationPrice,
        status: "Active"
      });
    }

    // Log the registration event
    await ActivityLog.create({
      user_id: user._id,
      email: user.email,
      role: user.role,
      action: "SIGNUP",
      device: req.headers["user-agent"] || "Generic Web Client",
      ip: req.ip || "127.0.0.1",
      city: city || "Unknown"
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // 🛑 SECURITY INTERCEPT: Instantly terminate authentication for Blocked Workers!
      if (user.role === "worker") {
        const associatedWorker = await Worker.findOne({ email: user.email });
        if (associatedWorker && associatedWorker.status === "Blocked") {
           return res.status(403).json({ error: "CRITICAL: Your worker account has been PERMANENTLY BLOCKED by admin control." });
        }
      }

      // Log the login event
      await ActivityLog.create({
        user_id: user._id,
        email: user.email,
        role: user.role,
        action: "LOGIN",
        device: req.headers["user-agent"] || "Generic Web Client",
        ip: req.ip || "127.0.0.1",
        city: user.city || "Unknown"
      });

      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          city: user.city,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const googleAuth = async (req, res) => {
  console.log("📡 [googleAuth] Request received. Body:", req.body);
  try {
    const { accessToken, role, profession, city, phone, name: customName } = req.body;

    if (!accessToken) {
      console.warn("⚠️ [googleAuth] Access token is missing");
      return res.status(400).json({ error: "Access token is required" });
    }

    // 1. Verify access token with Google UserInfo endpoint with automated retry
    let googleRes;
    const googleUserinfoUrl = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`;
    console.log("📡 [googleAuth] Verifying access token with Google: fetching", googleUserinfoUrl);
    try {
      googleRes = await executeWithRetry(() => fetch(googleUserinfoUrl), 3, 500);
    } catch (netErr) {
      console.error("💥 [googleAuth] Network error reaching Google UserInfo:", netErr.message);
      return res.status(503).json({ error: "Could not reach Google servers. Please check your connection and try again." });
    }

    console.log("📡 [googleAuth] Google UserInfo response status:", googleRes.status);
    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.error("❌ [googleAuth] Google token verification failed. Response body:", errText);
      return res.status(401).json({ error: "Google authentication failed. Your session may have expired. Please try again." });
    }

    const googleUser = await googleRes.json();
    console.log("📡 [googleAuth] Google UserInfo returned user:", googleUser);
    const { email, name } = googleUser;

    if (!email) {
      console.warn("⚠️ [googleAuth] Google account returned no verified email address");
      return res.status(400).json({ error: "Google account does not have a verified email address." });
    }

    // Ensure database connection is ready
    await ensureDbConnection();

    // 2. Check if user already exists in database with retry
    let user = await executeWithRetry(() => User.findOne({ email }));
    console.log("📡 [googleAuth] Found existing user in DB:", user ? `${user.email} (${user.role})` : "None");
    const placeholderPassword = `GoogleOAuthSecurePassword123!`;
    const isSignupFlow = !!role; // if role is passed, it's a signup attempt

    // ── SIGNUP FLOW: role was provided ──────────────────────
    if (isSignupFlow) {
      if (user) {
        // Email already registered — reject with clear message
        return res.status(409).json({
          error: `An account with this email (${email}) already exists. Please go to the login page and sign in instead.`
        });
      }

      const finalName = customName || name;

      // Create new user with retry
      user = await executeWithRetry(() => User.create({
        name: finalName,
        email,
        password: placeholderPassword,
        role: role || "user",
        city: city || "Mumbai",
        phone: phone || ""
      }));

      if (user.role === "worker") {
        const basePrice = SERVICE_BASE_PRICES[profession || "Carpentry"] || 350;
        const multiplier = getPriceMultiplier(city || "");
        const locationPrice = Math.round(basePrice * multiplier);

        await executeWithRetry(() => Worker.create({
          name: finalName,
          email,
          service: profession || "Carpentry",
          city: city || "Mumbai",
          rating: 2.7,
          ratingSum: 0,
          reviews: 0,
          price: locationPrice,
          status: "Active"
        }));
      }

      // Log signup event with retry
      await executeWithRetry(() => ActivityLog.create({
        user_id: user._id,
        email: user.email,
        role: user.role,
        action: "SIGNUP",
        device: req.headers["user-agent"] || "Generic Web Client",
        ip: req.ip || "127.0.0.1",
        city: city || "Mumbai"
      }));

    // ── LOGIN FLOW: no role passed ───────────────────────────
    } else {
      if (!user) {
        // No account found — auto-create a user account for seamless Google Sign-In with retry
        user = await executeWithRetry(() => User.create({
          name: name || email.split("@")[0],
          email,
          password: `GoogleOAuth_${Date.now()}`,
          role: "user",
          city: "Mumbai",
          phone: ""
        }));

        await executeWithRetry(() => ActivityLog.create({
          user_id: user._id,
          email: user.email,
          role: user.role,
          action: "SIGNUP",
          device: req.headers["user-agent"] || "Google OAuth",
          ip: req.ip || "127.0.0.1",
          city: "Mumbai"
        }));
      } else {
        // Existing user — block check for workers
        if (user.role === "worker") {
          const associatedWorker = await executeWithRetry(() => Worker.findOne({ email: user.email }));
          if (associatedWorker && associatedWorker.status === "Blocked") {
            return res.status(403).json({ error: "Your worker account has been blocked by admin. Please contact support." });
          }
        }

        // Log login event with retry
        await executeWithRetry(() => ActivityLog.create({
          user_id: user._id,
          email: user.email,
          role: user.role,
          action: "LOGIN",
          device: req.headers["user-agent"] || "Generic Web Client",
          ip: req.ip || "127.0.0.1",
          city: user.city || "Unknown"
        }));
      }
    }

    res.status(200).json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
      },
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("[googleAuth] Error:", error.message);
    res.status(500).json({ error: `Server error during Google authentication: ${error.message}` });
  }
};

export const googleMockAuth = async (req, res) => {
  try {
    const { email, name, role, profession, city, phone } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required for mock Google auth." });
    }

    // Ensure database connection is ready
    await ensureDbConnection();

    // Find existing user or auto-create a regular user with retry
    let user = await executeWithRetry(() => User.findOne({ email }));
    const isSignupFlow = !!role;

    if (isSignupFlow) {
      if (user) {
        return res.status(409).json({
          error: `An account with this email (${email}) already exists. Please go to the login page and sign in instead.`
        });
      }

      // Create new user
      user = await executeWithRetry(() => User.create({
        name,
        email,
        password: `GoogleMockAuth_${Date.now()}`,
        role: role || "user",
        city: city || "Mumbai",
        phone: phone || ""
      }));

      if (user.role === "worker") {
        const basePrice = SERVICE_BASE_PRICES[profession || "Carpentry"] || 350;
        const multiplier = getPriceMultiplier(city || "");
        const locationPrice = Math.round(basePrice * multiplier);

        await executeWithRetry(() => Worker.create({
          name,
          email,
          service: profession || "Carpentry",
          city: city || "Mumbai",
          rating: 2.7,
          ratingSum: 0,
          reviews: 0,
          price: locationPrice,
          status: "Active"
        }));
      }

      await executeWithRetry(() => ActivityLog.create({
        user_id: user._id,
        email: user.email,
        role: user.role,
        action: "SIGNUP",
        device: req.headers["user-agent"] || "Google Mock Auth",
        ip: req.ip || "127.0.0.1",
        city: city || "Mumbai"
      }));

    } else {
      // Login flow
      if (!user) {
        // Auto-create user for seamless sign-in
        user = await executeWithRetry(() => User.create({
          name,
          email,
          password: `GoogleMockAuth_${Date.now()}`,
          role: "user",
          city: "Mumbai",
          phone: ""
        }));

        await executeWithRetry(() => ActivityLog.create({
          user_id: user._id,
          email: user.email,
          role: user.role,
          action: "SIGNUP",
          device: req.headers["user-agent"] || "Google Mock Auth",
          ip: req.ip || "127.0.0.1",
          city: "Mumbai"
        }));
      } else {
        if (user.role === "worker") {
          const associatedWorker = await executeWithRetry(() => Worker.findOne({ email: user.email }));
          if (associatedWorker && associatedWorker.status === "Blocked") {
            return res.status(403).json({ error: "Your worker account has been blocked by admin." });
          }
        }
        await executeWithRetry(() => ActivityLog.create({
          user_id: user._id,
          email: user.email,
          role: user.role,
          action: "LOGIN",
          device: req.headers["user-agent"] || "Google Mock Auth",
          ip: req.ip || "127.0.0.1",
          city: user.city || "Unknown"
        }));
      }
    }

    return res.status(200).json({
      success: true,
      message: "Google Mock Authentication successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("[googleMockAuth] Error:", error.message);
    res.status(500).json({ error: `Mock Google auth failed: ${error.message}` });
  }
};
