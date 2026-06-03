import User from "../models/User.js";
import Worker from "../models/Worker.js";
import jwt from "jsonwebtoken";
import ActivityLog from "../models/ActivityLog.js";
import { getPriceMultiplier } from "../utils/geoUtils.js";

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
  "Doctors & Medical": 500,
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
  try {
    const { accessToken, role, profession, city, phone, name: customName } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    // 1. Verify access token with Google UserInfo endpoint
    let googleRes;
    try {
      googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    } catch (netErr) {
      return res.status(503).json({ error: "Could not reach Google servers. Please check your connection and try again." });
    }

    if (!googleRes.ok) {
      return res.status(401).json({ error: "Google authentication failed. Your session may have expired. Please try again." });
    }

    const googleUser = await googleRes.json();
    const { email, name } = googleUser;

    if (!email) {
      return res.status(400).json({ error: "Google account does not have a verified email address." });
    }

    // 2. Check if user already exists in database
    let user = await User.findOne({ email });
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

      // Create new user
      user = await User.create({
        name: finalName,
        email,
        password: placeholderPassword,
        role: role || "user",
        city: city || "Mumbai",
        phone: phone || ""
      });

      if (user.role === "worker") {
        const basePrice = SERVICE_BASE_PRICES[profession || "Carpentry"] || 350;
        const multiplier = getPriceMultiplier(city || "");
        const locationPrice = Math.round(basePrice * multiplier);

        await Worker.create({
          name: finalName,
          email,
          service: profession || "Carpentry",
          city: city || "Mumbai",
          rating: 2.7,
          ratingSum: 0,
          reviews: 0,
          price: locationPrice,
          status: "Active"
        });
      }

      // Log signup event
      await ActivityLog.create({
        user_id: user._id,
        email: user.email,
        role: user.role,
        action: "SIGNUP",
        device: req.headers["user-agent"] || "Generic Web Client",
        ip: req.ip || "127.0.0.1",
        city: city || "Mumbai"
      });

    // ── LOGIN FLOW: no role passed ───────────────────────────
    } else {
      if (!user) {
        // No account found — user needs to register first
        return res.status(404).json({
          error: `No account found for ${email}. Please sign up first to create your account.`
        });
      }

      // Block check for workers
      if (user.role === "worker") {
        const associatedWorker = await Worker.findOne({ email: user.email });
        if (associatedWorker && associatedWorker.status === "Blocked") {
          return res.status(403).json({ error: "Your worker account has been blocked by admin. Please contact support." });
        }
      }

      // Log login event
      await ActivityLog.create({
        user_id: user._id,
        email: user.email,
        role: user.role,
        action: "LOGIN",
        device: req.headers["user-agent"] || "Generic Web Client",
        ip: req.ip || "127.0.0.1",
        city: user.city || "Unknown"
      });
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

