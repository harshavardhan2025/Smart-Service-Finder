import express from "express";
import SosAlert from "../models/SosAlert.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// 🚨 SOS EMERGENCY DECLARATION TRIGGER
router.post("/sos", async (req, res) => {
  try {
    const { user_id, name, role, booking_id, lat, lng, location_name } = req.body;

    if (!user_id || !name || !role) {
      return res.status(400).json({ error: "user_id, name, and role are required parameters" });
    }

    // Create the active emergency log
    const alert = await SosAlert.create({
      user_id,
      name,
      role,
      booking_id,
      lat,
      lng,
      location_name: location_name || "Coordinates-based SOS Location",
      status: "Triggered"
    });

    // Create a global notification inside the system for the Admin Dashboard
    await Notification.create({
      role: "admin", // Routed strictly to administrators!
      user_id: "",
      title: `🚨 SOS EMERGENCY SIGNAL FROM ${role.toUpperCase()}: ${name}`,
      message: `Active panic warning triggered. Location: ${location_name || "Coordinates Provided"}. Linked Booking: ${booking_id || "N/A"}.`,
      type: "emergency",
      is_read: false
    });

    res.status(201).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🆘 ADMIN: FETCH ALL ACTIVE & HISTORIC SOS SIGNALS
router.get("/sos", async (req, res) => {
  try {
    const list = await SosAlert.find().sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ⚖️ ADMIN/POLICE: DISMISS OR DISPATCH ASSISTANCE & RESOLVE ALERT
router.patch("/sos/:id/resolve", async (req, res) => {
  try {
    const alert = await SosAlert.findByIdAndUpdate(
      req.params.id,
      { status: "Resolved", resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ error: "Emergency incident profile not found" });
    }
    res.status(200).json({ success: true, resolved: alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛡️ SECURITY AUDITS: FETCH USER SECURITY ACTIVITY LOGS
router.get("/logs/:userId", async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user_id: req.params.userId }).sort({ timestamp: -1 }).limit(30);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛡️ GLOBAL ADMIN SECURITY AUDIT HISTORY
router.get("/logs", async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📥 AUDIT INGESTION: MANUALLY POST SECURITY AUDITS
router.post("/logs", async (req, res) => {
  try {
    const { user_id, email, role, action, device, ip, city } = req.body;
    const log = await ActivityLog.create({
      user_id,
      email,
      role,
      action,
      device: device || req.headers["user-agent"] || "Generic Web Client",
      ip: ip || req.ip || "127.0.0.1",
      city: city || "Unknown City"
    });
    res.status(201).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
