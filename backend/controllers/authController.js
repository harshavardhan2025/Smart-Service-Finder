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
  "Photography": 700-20000,
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
    const { email, password, name, role, profession, city } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      city
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
