import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(" ")[1];

      // Decrypt & verify
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "EMERGENCY_FALLBACK_KEY_NOT_SET_IN_ENV");

      // Attach User context from DB
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ error: "Not authorized, user not found" });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error("🔴 Auth Failed:", error.message);
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token present" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admins only." });
  }
};

export const workerOnly = (req, res, next) => {
  if (req.user && req.user.role === "worker") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Workers only." });
  }
};

export const adminOrWorker = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "worker")) {
    next();
  } else {
    res.status(403).json({ error: "Access denied." });
  }
};

