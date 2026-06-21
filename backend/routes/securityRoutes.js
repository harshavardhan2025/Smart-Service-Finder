import express from "express";
import SosAlert from "../models/SosAlert.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import User from "../models/User.js";

const router = express.Router();

// 🚨 SOS EMERGENCY DECLARATION TRIGGER
router.post("/sos", async (req, res) => {
  try {
    const { user_id, name, role, booking_id, lat, lng, location_name } = req.body;

    if (!user_id || !name || !role) {
      return res.status(400).json({ error: "user_id, name, and role are required parameters" });
    }

    // Initialize all details
    let worker_name = "N/A";
    let worker_phone = "N/A";
    let worker_email = "N/A";
    let worker_profession = "N/A";
    let worker_location = "N/A";

    let customer_name = "N/A";
    let customer_phone = "N/A";
    let customer_email = "N/A";

    let booking_address = "N/A";
    let linked_booking_id = booking_id || "N/A";
    let booking_service = "N/A";

    let booking = null;

    if (role === "user") {
      // Initiator is the customer
      const customerUser = await User.findById(user_id);
      if (customerUser) {
        customer_name = customerUser.name;
        customer_phone = customerUser.phone || "N/A";
        customer_email = customerUser.email || "N/A";
      } else {
        customer_name = name;
      }

      // Find booking
      if (booking_id) {
        booking = await Booking.findById(booking_id);
      }
      if (!booking) {
        booking = await Booking.findOne({
          customer_id: user_id,
          status: { $in: ["Accepted", "On the Way", "Started"] }
        }).sort({ updatedAt: -1 });
      }
      if (!booking) {
        booking = await Booking.findOne({ customer_id: user_id }).sort({ createdAt: -1 });
      }

      if (booking) {
        linked_booking_id = booking._id.toString();
        booking_address = booking.address || "N/A";
        booking_service = booking.service || "N/A";
        
        // Find worker
        const worker = await Worker.findById(booking.worker_id);
        if (worker) {
          worker_name = worker.name;
          worker_email = worker.email || "N/A";
          worker_profession = worker.service || "N/A";
          worker_location = worker.location || worker.city || "N/A";

          // Find worker's User account for phone number
          const workerUser = await User.findOne({ email: worker.email });
          if (workerUser) {
            worker_phone = workerUser.phone || "N/A";
          }
        }
      }
    } else if (role === "worker") {
      // Initiator is the worker
      let worker = null;
      const user = await User.findById(user_id);
      if (user) {
        worker = await Worker.findOne({ email: user.email });
        worker_phone = user.phone || "N/A";
        worker_email = user.email || "N/A";
      }
      if (!worker) {
        worker = await Worker.findOne({ name: name });
      }

      if (worker) {
        worker_name = worker.name;
        worker_email = worker.email || worker_email;
        worker_profession = worker.service || "N/A";
        worker_location = worker.location || worker.city || "N/A";
        
        if (worker_phone === "N/A") {
          const workerUser = await User.findOne({ email: worker.email });
          if (workerUser) {
            worker_phone = workerUser.phone || "N/A";
          }
        }

        // Find active booking for this worker
        if (booking_id) {
          booking = await Booking.findById(booking_id);
        }
        if (!booking) {
          booking = await Booking.findOne({
            worker_id: worker._id.toString(),
            status: { $in: ["Accepted", "On the Way", "Started"] }
          }).sort({ updatedAt: -1 });
        }
        if (!booking) {
          booking = await Booking.findOne({ worker_id: worker._id.toString() }).sort({ createdAt: -1 });
        }

        if (booking) {
          linked_booking_id = booking._id.toString();
          booking_address = booking.address || "N/A";
          booking_service = booking.service || "N/A";
          customer_name = booking.customer_name || "N/A";

          // Find customer user account details
          const customerUser = await User.findById(booking.customer_id);
          if (customerUser) {
            customer_phone = customerUser.phone || "N/A";
            customer_email = customerUser.email || "N/A";
          }
        }
      } else {
        worker_name = name;
      }
    }

    // Create the active emergency log
    const alert = await SosAlert.create({
      user_id,
      name,
      role,
      booking_id: linked_booking_id !== "N/A" ? linked_booking_id : undefined,
      lat,
      lng,
      location_name: location_name || "Coordinates-based SOS Location",
      worker_name,
      worker_phone,
      worker_email,
      worker_profession,
      worker_location,
      customer_name,
      customer_phone,
      customer_email,
      booking_address,
      status: "Triggered"
    });

    // Create a global notification inside the system for the Admin Dashboard
    const notification = await Notification.create({
      role: "admin", // Routed strictly to administrators!
      user_id: "",
      title: `🚨 SOS EMERGENCY SIGNAL FROM ${role.toUpperCase()}: ${name}`,
      message: `⚠️ EMERGENCY SOS ACTIVATED!
----------------------------------------
Distress Initiator: ${name} (${role.toUpperCase()})
Real-time Location: ${location_name || "Coordinates Provided"}
Booking Address: ${booking_address}
Assigned Worker: ${worker_name} (${worker_profession})
Worker Contact: Phone: ${worker_phone} | Email: ${worker_email}
Customer: ${customer_name}
Customer Contact: Phone: ${customer_phone} | Email: ${customer_email}
Linked Booking: ${linked_booking_id} (${booking_service})
Reported At: ${new Date().toLocaleString()}`,
      type: "emergency",
      is_read: false,
      lat,
      lng
    });

    res.status(201).json({ success: true, alert, notification });
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
      { returnDocument: 'after' }
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
