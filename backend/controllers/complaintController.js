import Complaint from "../models/Complaint.js";
import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Transaction from "../models/Transaction.js";

export const getComplaints = async (req, res) => {
  try {
    const filter = {};
    if (req.query.reported_by) filter.reported_by = req.query.reported_by;
    const list = await Complaint.find(filter).sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const submitComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.create(req.body);

    // Notify administrators about the new complaint
    try {
      await Notification.create({
        role: "admin",
        user_id: "", // Omitted so all admins can view
        title: `⚠️ New Complaint Filed: ${complaint.issue_type}`,
        message: `A client has reported a new issue. Description: "${complaint.description}"`,
        type: "warning",
        is_read: false
      });
    } catch (err) {
      console.error("Error creating complaint notification for admin:", err);
    }

    res.status(201).json({ success: true, complaint });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const resolveComplaint = async (req, res) => {
  try {
    const { verdict, refundAmount } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { admin_verdict: verdict, status: "Resolved" },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Active ledger enforcement logic
    if (complaint.booking_id) {
      const booking = await Booking.findById(complaint.booking_id);
      if (booking) {
        if (verdict === "Block Worker") {
          // Permanently block worker status
          const worker = await Worker.findByIdAndUpdate(booking.worker_id, { status: "Blocked" });
          if (worker && worker.email) {
            await User.findOneAndUpdate({ email: worker.email }, { status: "Blocked" });
          }
        } else if (verdict === "Block User") {
          // Permanently block user account status
          await User.findByIdAndUpdate(booking.customer_id, { status: "Blocked" });
        }
      }
    }

    let refundMsg = "";
    if (refundAmount && Number(refundAmount) > 0) {
      if (complaint.reported_by) {
        let customer = null;
        if (complaint.reported_by.match(/^[0-9a-fA-F]{24}$/)) {
          try {
            customer = await User.findById(complaint.reported_by);
          } catch (e) {}
        }
        if (!customer) {
          customer = await User.findOne({ name: complaint.reported_by });
        }
        if (customer) {
          customer.walletBalance = (customer.walletBalance || 0) + Number(refundAmount);
          await customer.save();

          await Transaction.create({
            customer: customer.name || "Customer",
            worker: "System Refund",
            service: `Complaint Refund: ${complaint.issue_type}`,
            amount: Number(refundAmount),
            status: "Refunded",
            method: "Admin Complaint Resolution"
          });
          
          refundMsg = ` Additionally, a refund of ₹${refundAmount} has been credited to your wallet.`;
        }
      }
    }

    // Create targeted notification for the customer who reported it
    try {
      if (complaint.reported_by) {
        await Notification.create({
          role: "user",
          user_id: complaint.reported_by.toString(),
          title: "⚖️ Complaint Resolution Update",
          message: `Your complaint regarding "${complaint.issue_type}" has been resolved by Admin. Verdict: "${verdict}".${refundMsg}`,
          type: "success",
          is_read: false
        });
      }
    } catch (err) {
      console.error("Error creating complaint resolution notification:", err);
    }

    res.status(200).json({ success: true, resolved: complaint });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
