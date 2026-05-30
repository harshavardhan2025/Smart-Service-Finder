import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

const validateCancellationTime = (booking) => {
  const now = new Date();
  const createdTime = new Date(booking.createdAt || now);
  
  // Parse scheduled date and time
  const parseBookingDateTime = (dateStr, timeStr) => {
    try {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":");
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
      
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      
      return new Date(`${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
    } catch (err) {
      return null;
    }
  };

  const scheduledDateTime = parseBookingDateTime(booking.date, booking.time);
  if (!scheduledDateTime || isNaN(scheduledDateTime.getTime())) {
    // If we can't parse the scheduled time, default to allowing it
    return { allowed: true };
  }

  const timeGapMinutes = (scheduledDateTime - createdTime) / 60000;
  
  if (timeGapMinutes <= 60) {
    // ⚡ Instant Booking: Allowed ONLY within 5 minutes of creation
    const elapsedMinutes = (now - createdTime) / 60000;
    if (elapsedMinutes > 5) {
      return {
        allowed: false,
        error: "CRITICAL: Instant orders can only be cancelled or rejected within 5 minutes of booking creation."
      };
    }
  } else {
    // 📅 Normal Booking: Allowed ONLY before 1 hour of scheduled time
    const minutesBeforeScheduled = (scheduledDateTime - now) / 60000;
    if (minutesBeforeScheduled < 60) {
      return {
        allowed: false,
        error: "CRITICAL: Scheduled orders can only be cancelled or rejected at least 1 hour prior to the scheduled service time."
      };
    }
  }

  return { allowed: true };
};

export const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    
    // Log the booking creation event
    await ActivityLog.create({
      user_id: booking.customer_id,
      email: req.headers["x-user-email"] || booking.customer_name + "@workzy.com",
      role: "user",
      action: "BOOKING_CREATED",
      device: req.headers["user-agent"] || "Generic Web Client",
      ip: req.ip || "127.0.0.1",
      city: "Kakinada"
    });

    // 1. Create notification for Customer (user)
    await Notification.create({
      role: "user",
      user_id: booking.customer_id,
      title: "📅 Booking Request Submitted",
      message: `Your booking request for ${booking.service} has been submitted successfully and is pending acceptance.`,
      type: "success",
      is_read: false
    });

    // 2. Create notification for Worker (worker)
    try {
      const worker = await Worker.findById(booking.worker_id);
      if (worker) {
        const workerUser = await User.findOne({ email: worker.email });
        if (workerUser) {
          await Notification.create({
            role: "worker",
            user_id: workerUser._id.toString(),
            title: "📅 New Job Request",
            message: `You have a new booking request for ${booking.service} from ${booking.customer_name} on ${booking.date} at ${booking.time}.`,
            type: "info",
            is_read: false
          });
        }
      }
    } catch (err) {
      console.error("Error creating booking notification for worker:", err);
    }

    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.customer_id) filter.customer_id = req.query.customer_id;
    if (req.query.worker_id) filter.worker_id = req.query.worker_id;

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // If the status is changing to Cancelled or Rejected, apply time checks!
    if (req.body.status === "Cancelled" || req.body.status === "Rejected") {
      const timeCheck = validateCancellationTime(booking);
      if (!timeCheck.allowed) {
        return res.status(400).json({ error: timeCheck.error });
      }
    }

    booking.status = req.body.status;
    await booking.save();

    if (booking) {
      // Notify customer (user) of status update
      let statusTitle = "📅 Booking Update";
      let statusMsg = `Your booking for ${booking.service} has been updated to "${booking.status}".`;
      let notifyType = "info";

      if (booking.status === "Accepted") {
        statusTitle = "✅ Booking Accepted!";
        statusMsg = `Your booking request for ${booking.service} has been accepted by the service provider!`;
        notifyType = "success";
      } else if (booking.status === "On the Way") {
        statusTitle = "🚚 Provider On the Way";
        statusMsg = `Your service provider for ${booking.service} is on the way to your location.`;
        notifyType = "info";
      } else if (booking.status === "Started") {
        statusTitle = "⚡ Service Started";
        statusMsg = `The job for your ${booking.service} booking has officially started.`;
        notifyType = "info";
      } else if (booking.status === "Completed") {
        statusTitle = "🎉 Service Completed";
        statusMsg = `Your ${booking.service} booking has been completed. Please review the details.`;
        notifyType = "success";
      } else if (booking.status === "Cancelled") {
        statusTitle = "❌ Booking Cancelled";
        statusMsg = `Your booking request for ${booking.service} has been cancelled.`;
        notifyType = "warning";
      }

      await Notification.create({
        role: "user",
        user_id: booking.customer_id,
        title: statusTitle,
        message: statusMsg,
        type: notifyType,
        is_read: false
      });

      // Also notify worker of their own action success
      try {
        const worker = await Worker.findById(booking.worker_id);
        if (worker) {
          const workerUser = await User.findOne({ email: worker.email });
          if (workerUser) {
            await Notification.create({
              role: "worker",
              user_id: workerUser._id.toString(),
              title: `✅ Status Updated: ${booking.status}`,
              message: `You successfully updated booking status for ${booking.service} to "${booking.status}".`,
              type: "info",
              is_read: false
            });
          }
        }
      } catch (err) {
        console.error("Error creating status update notification for worker:", err);
      }
    }

    res.status(200).json({ success: true, updated: booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const releaseEscrow = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: "Paid Out" }, { new: true });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Execute the direct balance hydration on the assigned worker document atomicly
    await Worker.findByIdAndUpdate(booking.worker_id, { $inc: { walletBalance: booking.price } });

    // Formally audit and record this cash event in transaction database
    await Transaction.create({
       customer: booking.customer_id,
       worker: booking.worker_id,
       service: booking.service,
       amount: booking.price,
       status: "Paid Out",
       method: "Admin Escrow Release"
    });

    // Notify customer
    await Notification.create({
      role: "user",
      user_id: booking.customer_id,
      title: "💸 Escrow Released",
      message: `Payment of ₹${booking.price} for your ${booking.service} service has been released to the provider.`,
      type: "success",
      is_read: false
    });

    // Notify worker
    try {
      const worker = await Worker.findById(booking.worker_id);
      if (worker) {
        const workerUser = await User.findOne({ email: worker.email });
        if (workerUser) {
          await Notification.create({
            role: "worker",
            user_id: workerUser._id.toString(),
            title: "💰 Escrow Payment Received",
            message: `₹${booking.price} has been credited to your wallet balance for completing the ${booking.service} service!`,
            type: "success",
            is_read: false
          });
        }
      }
    } catch (err) {
      console.error("Error creating escrow release notification for worker:", err);
    }

    res.status(200).json({ success: true, message: "Fund distribution successfully propagated globally." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status === "Cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    // Apply the duration cancellation checks!
    const timeCheck = validateCancellationTime(booking);
    if (!timeCheck.allowed) {
      return res.status(400).json({ error: timeCheck.error });
    }

    booking.status = "Cancelled";
    await booking.save();

    // Dynamically query customer to issue refund back to wallet
    const customer = await User.findById(booking.customer_id);
    if (customer) {
      customer.walletBalance += booking.price;
      await customer.save();

      // Write a formal transaction record of the refund
      await Transaction.create({
        customer: booking.customer_name,
        worker: "System Refund",
        service: `Refund: ${booking.service}`,
        amount: booking.price,
        status: "Refunded",
        method: "Wallet Topup"
      });
    }

    // Log the cancellation event in Activity Logs
    await ActivityLog.create({
      user_id: booking.customer_id,
      email: customer ? customer.email : "client@workzy.com",
      role: "user",
      action: "BOOKING_CANCELLED",
      device: req.headers["user-agent"] || "Generic Web Client",
      ip: req.ip || "127.0.0.1",
      city: customer ? customer.city : "Kakinada"
    });

    // Notify customer
    await Notification.create({
      role: "user",
      user_id: booking.customer_id,
      title: "❌ Booking Cancelled & Refunded",
      message: `Your booking for ${booking.service} has been cancelled. A full refund of ₹${booking.price} has been credited back to your wallet.`,
      type: "warning",
      is_read: false
    });

    // Notify worker
    try {
      const worker = await Worker.findById(booking.worker_id);
      if (worker) {
        const workerUser = await User.findOne({ email: worker.email });
        if (workerUser) {
          await Notification.create({
            role: "worker",
            user_id: workerUser._id.toString(),
            title: "❌ Booking Cancelled by Customer",
            message: `The booking for ${booking.service} by ${booking.customer_name} has been cancelled.`,
            type: "warning",
            is_read: false
          });
        }
      }
    } catch (err) {
      console.error("Error creating cancellation notification for worker:", err);
    }

    res.status(200).json({ success: true, booking, message: "Booking cancelled successfully and wallet refunded." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
