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
    let { email, password, name, role, profession, city, phone } = req.body;
    if (email) email = email.toLowerCase().trim();

    // ✅ Validate role – only 'user', 'worker', or 'admin' allowed
    const allowedRoles = ['user', 'worker', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified. Allowed roles: user, worker, admin.' });
    }
    // Prevent admin creation via public signup unless explicitly allowed (e.g., via env flag)
    if (role === 'admin' && process.env.ALLOW_ADMIN_SIGNUP !== 'true') {
      return res.status(403).json({ error: 'Admin account creation is not permitted via public signup.' });
    }

    const userExists = await User.findOne({ email });

    // ── Strict Role Isolation: Block duplicate registrations across roles ──
    if (userExists) {
      if (userExists.role === "worker" || userExists.isWorker) {
        return res.status(400).json({
          error: "This email is registered as a Service Provider only. You cannot create a Customer account with this email. Please switch to the Service Provider tab to sign in."
        });
      } else {
        return res.status(400).json({
          error: "An account with this email already exists. Please sign in directly."
        });
      }
    }

    // ── Create brand new user ──
    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
      city: city || "Mumbai",
      phone: phone || "",
      isWorker: role === "worker",
    });

    let associatedWorker = null;

    if (role === "worker") {
      const basePrice = SERVICE_BASE_PRICES[profession || "Plumbing"] || 350;
      const multiplier = getPriceMultiplier(city || "");
      const locationPrice = Math.round(basePrice * multiplier);

      associatedWorker = await Worker.create({
        name,
        email,
        service: profession || "Plumbing",
        city: city || "Mumbai",
        rating: 2.7,      // Bayesian new-worker baseline
        ratingSum: 0,
        reviews: 0,
        price: locationPrice,
        status: "Active"
      });
      user.isWorker = true;
      user.workerProfileId = associatedWorker._id;
      await user.save();
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
      loginContext: role === "worker" ? "provider" : "user",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        actualRole: user.role,
        city: user.city,
        isWorker: user.isWorker || false,
        workerProfileId: user.workerProfileId || null,
      },
      worker: associatedWorker ? {
        id: associatedWorker._id,
        name: associatedWorker.name,
        service: associatedWorker.service,
        city: associatedWorker.city,
        price: associatedWorker.price,
        status: associatedWorker.status,
      } : null,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    let { email, password, loginAs } = req.body;
    if (email) email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const associatedWorker = await Worker.findOne({ email: user.email });

    let loginContext = "user";

    // ── ADMIN ACCESS: Always permitted from any login tab ──
    if (user.role === "admin") {
      loginContext = "admin";
    } else if (loginAs === "provider") {
      // ── SERVICE PROVIDER TAB LOGIN ──
      const hasWorkerAccount = !!associatedWorker || user.role === "worker" || user.isWorker === true;
      if (!hasWorkerAccount) {
        return res.status(404).json({
          error: "No service provider profile found for this email. This account is registered as a Customer. Please switch to the User tab to sign in."
        });
      }
      if (associatedWorker && associatedWorker.status === "Blocked") {
        return res.status(403).json({
          error: "CRITICAL: Your worker account has been PERMANENTLY BLOCKED by admin control."
        });
      }
      loginContext = "provider";
    } else if (loginAs === "user") {
      // ── USER / CUSTOMER TAB LOGIN (Strict Separation) ──
      if (user.role === "worker" || user.isWorker === true || !!associatedWorker) {
        return res.status(403).json({
          error: "This account is registered as a Service Provider only. Please switch to the Service Provider tab to sign in."
        });
      }
      loginContext = "user";
    } else {
      // Fallback
      if (user.role === "worker" || user.isWorker === true) {
        loginContext = "provider";
      } else {
        loginContext = "user";
      }
    }

    // Log the login event
    await ActivityLog.create({
      user_id: user._id,
      email: user.email,
      role: user.role,
      action: loginContext === "provider" ? "LOGIN_PROVIDER" : "LOGIN",
      device: req.headers["user-agent"] || "Generic Web Client",
      ip: req.ip || "127.0.0.1",
      city: user.city || "Unknown"
    });

    res.json({
      success: true,
      message: "Login successful",
      loginContext,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: loginContext === "provider" ? "worker" : user.role,
        actualRole: user.role,
        city: user.city,
        isWorker: user.isWorker || !!associatedWorker || false,
        workerProfileId: user.workerProfileId || (associatedWorker ? associatedWorker._id : null),
      },
      worker: associatedWorker ? {
        id: associatedWorker._id,
        name: associatedWorker.name,
        service: associatedWorker.service,
        city: associatedWorker.city,
        price: associatedWorker.price,
        status: associatedWorker.status,
      } : null,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── JOIN AS WORKER: existing user registers as a service provider ──────────
export const joinAsWorker = async (req, res) => {
  try {
    let { email, password, profession, city } = req.body;
    if (email) email = email.toLowerCase().trim();

    if (!email || !password || !profession || !city) {
      return res.status(400).json({ error: "Email, password, profession and city are required." });
    }

    // 1. Verify the user exists and credentials match
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email. Please sign up first." });
    }
    const passwordValid = await user.comparePassword(password);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid password. Please check your credentials." });
    }

    // 2. Check if a worker profile already exists for this email
    let worker = await Worker.findOne({ email });
    if (!worker) {
      // 3. Create the Worker record
      const basePrice = SERVICE_BASE_PRICES[profession] || 350;
      const multiplier = getPriceMultiplier(city || "");
      const locationPrice = Math.round(basePrice * multiplier);

      worker = await Worker.create({
        name: user.name,
        email,
        service: profession,
        city,
        rating: 2.7,
        ratingSum: 0,
        reviews: 0,
        price: locationPrice,
        status: "Active"
      });
    } else {
      worker.service = profession;
      worker.city = city;
      await worker.save();
    }

    // 4. Update user: mark as worker, store reference
    user.isWorker = true;
    user.workerProfileId = worker._id;
    await user.save();

    // 5. Log the event
    await ActivityLog.create({
      user_id: user._id,
      email: user.email,
      role: user.role,
      action: "JOIN_AS_WORKER",
      device: req.headers["user-agent"] || "Generic Web Client",
      ip: req.ip || "127.0.0.1",
      city: city || "Unknown"
    });

    res.status(200).json({
      success: true,
      message: "Service provider profile created successfully!",
      loginContext: "provider",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "worker",
        actualRole: user.role,
        city: user.city,
        isWorker: true,
        workerProfileId: worker._id,
      },
      worker: {
        id: worker._id,
        name: worker.name,
        service: worker.service,
        city: worker.city,
        price: worker.price,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("[joinAsWorker] Error:", error.message);
    res.status(500).json({ error: `Failed to create service provider profile: ${error.message}` });
  }
};

export const googleAuth = async (req, res) => {
  console.log("📡 [googleAuth] Request received. Body:", req.body);
  try {
    let { accessToken, role, profession, city, phone, name: customName, loginAs } = req.body;
    
    // ✅ Validate role – only 'user' or 'worker' allowed for Google signup
    if (role && !['user', 'worker'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role for Google signup. Allowed roles: user, worker.' });
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
    let { email, name } = googleUser;
    if (email) email = email.toLowerCase().trim();

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
    const isSignupFlow = !!role;

    let loginContext = "user";
    let associatedWorker = null;

    // ── SIGNUP FLOW: role was provided ──────────────────────
    if (isSignupFlow) {
      if (user) {
        return res.status(409).json({
          error: `An account with this email (${email}) already exists. Please go to the login page and sign in instead.`
        });
      }

      const finalName = customName || name;
      user = await executeWithRetry(() => User.create({
        name: finalName,
        email,
        password: placeholderPassword,
        role: role || "user",
        city: city || "Mumbai",
        phone: phone || "",
        isWorker: role === "worker",
      }));

      if (role === "worker") {
        const basePrice = SERVICE_BASE_PRICES[profession || "Carpentry"] || 350;
        const multiplier = getPriceMultiplier(city || "Mumbai");
        const locationPrice = Math.round(basePrice * multiplier);

        associatedWorker = await executeWithRetry(() => Worker.create({
          name: user.name,
          email,
          service: profession || "Carpentry",
          city: city || "Mumbai",
          rating: 2.7,
          ratingSum: 0,
          reviews: 0,
          price: locationPrice,
          status: "Active"
        }));
        user.isWorker = true;
        user.workerProfileId = associatedWorker._id;
        await user.save();
        loginContext = "provider";
      } else {
        loginContext = "user";
      }

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
        return res.status(404).json({ error: "No account found with this Google email. Please sign up first." });
      }

      associatedWorker = await executeWithRetry(() => Worker.findOne({ email: user.email }));

      if (user.role === "admin") {
        loginContext = "admin";
      } else if (loginAs === "provider") {
        const hasWorkerAccount = !!associatedWorker || user.role === "worker" || user.isWorker === true;
        if (!hasWorkerAccount) {
          return res.status(404).json({
            error: "No service provider profile found for this Google email. This account is registered as a Customer. Please switch to the User tab to sign in."
          });
        }
        if (associatedWorker && associatedWorker.status === "Blocked") {
          return res.status(403).json({ error: "Your worker account has been blocked by admin. Please contact support." });
        }
        loginContext = "provider";
      } else if (loginAs === "user") {
        if (user.role === "worker" || user.isWorker === true || !!associatedWorker) {
          return res.status(403).json({
            error: "This account is registered as a Service Provider only. Please switch to the Service Provider tab to sign in."
          });
        }
        loginContext = "user";
      } else {
        if (user.role === "worker" || user.isWorker === true) {
          loginContext = "provider";
        } else {
          loginContext = "user";
        }
      }

      await executeWithRetry(() => ActivityLog.create({
        user_id: user._id,
        email: user.email,
        role: user.role,
        action: loginContext === "provider" ? "LOGIN_PROVIDER" : "LOGIN",
        device: req.headers["user-agent"] || "Generic Web Client",
        ip: req.ip || "127.0.0.1",
        city: user.city || "Unknown"
      }));
    }

    res.status(200).json({
      success: true,
      message: "Authentication successful",
      loginContext,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: loginContext === "provider" ? "worker" : user.role,
        actualRole: user.role,
        city: user.city,
        isWorker: user.isWorker || !!associatedWorker || false,
        workerProfileId: user.workerProfileId || (associatedWorker ? associatedWorker._id : null),
      },
      worker: associatedWorker ? {
        id: associatedWorker._id,
        name: associatedWorker.name,
        service: associatedWorker.service,
        city: associatedWorker.city,
        price: associatedWorker.price,
        status: associatedWorker.status,
      } : null,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("[googleAuth] Error:", error.message);
    res.status(500).json({ error: `Server error during Google authentication: ${error.message}` });
  }
};

export const googleMockAuth = async (req, res) => {
  try {
    let { email, name, role, profession, city, phone, loginAs } = req.body;
    if (email) email = email.toLowerCase().trim();
    
    // ✅ Validate role – only 'user' or 'worker' allowed for mock Google signup
    if (role && !['user', 'worker'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role for mock Google signup. Allowed roles: user, worker.' });
    }
    
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required for mock Google auth." });
    }

    // Ensure database connection is ready
    await ensureDbConnection();

    // Find existing user or auto-create a regular user with retry
    let user = await executeWithRetry(() => User.findOne({ email }));
    const isSignupFlow = !!role;
    let loginContext = "user";
    let associatedWorker = null;

    if (isSignupFlow) {
      if (user) {
        return res.status(409).json({
          error: `An account with this email (${email}) already exists. Please go to the login page and sign in instead.`
        });
      }

      user = await executeWithRetry(() => User.create({
        name,
        email,
        password: `GoogleMockAuth_${Date.now()}`,
        role: role || "user",
        city: city || "Mumbai",
        phone: phone || "",
        isWorker: role === "worker",
      }));

      if (role === "worker") {
        const basePrice = SERVICE_BASE_PRICES[profession || "Carpentry"] || 350;
        const multiplier = getPriceMultiplier(city || "Mumbai");
        const locationPrice = Math.round(basePrice * multiplier);

        associatedWorker = await executeWithRetry(() => Worker.create({
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
        user.isWorker = true;
        user.workerProfileId = associatedWorker._id;
        await user.save();
        loginContext = "provider";
      } else {
        loginContext = "user";
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
        return res.status(404).json({ error: "No account found with this Google email. Please sign up first." });
      }

      associatedWorker = await executeWithRetry(() => Worker.findOne({ email: user.email }));

      if (user.role === "admin") {
        loginContext = "admin";
      } else if (loginAs === "provider") {
        const hasWorkerAccount = !!associatedWorker || user.role === "worker" || user.isWorker === true;
        if (!hasWorkerAccount) {
          return res.status(404).json({
            error: "No service provider profile found for this Google email. This account is registered as a Customer. Please switch to the User tab to sign in."
          });
        }
        if (associatedWorker && associatedWorker.status === "Blocked") {
          return res.status(403).json({ error: "Your worker account has been blocked by admin." });
        }
        loginContext = "provider";
      } else if (loginAs === "user") {
        if (user.role === "worker" || user.isWorker === true || !!associatedWorker) {
          return res.status(403).json({
            error: "This account is registered as a Service Provider only. Please switch to the Service Provider tab to sign in."
          });
        }
        loginContext = "user";
      } else {
        if (user.role === "worker" || user.isWorker === true) {
          loginContext = "provider";
        } else {
          loginContext = "user";
        }
      }

      await executeWithRetry(() => ActivityLog.create({
        user_id: user._id,
        email: user.email,
        role: user.role,
        action: loginContext === "provider" ? "LOGIN_PROVIDER" : "LOGIN",
        device: req.headers["user-agent"] || "Google Mock Auth",
        ip: req.ip || "127.0.0.1",
        city: user.city || "Unknown"
      }));
    }

    return res.status(200).json({
      success: true,
      message: "Google Mock Authentication successful",
      loginContext,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: loginContext === "provider" ? "worker" : user.role,
        actualRole: user.role,
        city: user.city,
        isWorker: user.isWorker || !!associatedWorker || false,
        workerProfileId: user.workerProfileId || (associatedWorker ? associatedWorker._id : null),
      },
      worker: associatedWorker ? {
        id: associatedWorker._id,
        name: associatedWorker.name,
        service: associatedWorker.service,
        city: associatedWorker.city,
        price: associatedWorker.price,
        status: associatedWorker.status,
      } : null,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("[googleMockAuth] Error:", error.message);
    res.status(500).json({ error: `Mock Google auth failed: ${error.message}` });
  }
};
