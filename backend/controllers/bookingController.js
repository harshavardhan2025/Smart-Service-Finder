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

    if (booking.status === "Rejected") {
      const customer = await User.findById(booking.customer_id);
      if (customer) {
        customer.walletBalance = (customer.walletBalance || 0) + booking.price;
        await customer.save();

        await Transaction.create({
          customer: booking.customer_name,
          worker: "System Refund",
          service: `Refund (Rejected): ${booking.service}`,
          amount: booking.price,
          status: "Refunded",
          method: "Wallet Topup"
        });
      }
      
      await ActivityLog.create({
        user_id: booking.worker_id,
        email: req.headers["x-user-email"] || "worker@workzy.com",
        role: "worker",
        action: "BOOKING_REJECTED",
        device: req.headers["user-agent"] || "Worker Dashboard",
        ip: req.ip || "127.0.0.1",
        city: "System"
      });
    }

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
      } else if (booking.status === "Rejected") {
        statusTitle = "❌ Booking Rejected & Refunded";
        statusMsg = `Your booking request for ${booking.service} was rejected by the provider. A full refund of ₹${booking.price} has been credited back to your wallet.`;
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

export const declineEscrow = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    booking.status = "Escrow Declined";
    await booking.save();

    const customer = await User.findById(booking.customer_id);
    if (customer) {
      customer.walletBalance = (customer.walletBalance || 0) + booking.price;
      await customer.save();

      await Transaction.create({
         customer: booking.customer_name,
         worker: "System Refund",
         service: `Escrow Refund: ${booking.service}`,
         amount: booking.price,
         status: "Refunded",
         method: "Admin Escrow Decline"
      });
    }

    await Notification.create({
      role: "user",
      user_id: booking.customer_id,
      title: "❌ Escrow Declined & Refunded",
      message: `The escrow payment of ₹${booking.price} for your ${booking.service} service was declined by Admin and refunded to your wallet.`,
      type: "warning",
      is_read: false
    });

    try {
      const worker = await Worker.findById(booking.worker_id);
      if (worker) {
        const workerUser = await User.findOne({ email: worker.email });
        if (workerUser) {
          await Notification.create({
            role: "worker",
            user_id: workerUser._id.toString(),
            title: "🚫 Escrow Payment Declined",
            message: `Your pending escrow payment for the ${booking.service} service was declined by Administration. Funds were returned to the customer.`,
            type: "warning",
            is_read: false
          });
        }
      }
    } catch (err) {
      console.error("Error creating escrow decline notification for worker:", err);
    }

    res.status(200).json({ success: true, message: "Escrow declined and customer fully refunded." });
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

    if (booking.status === "Cancellation Pending") {
      return res.status(400).json({ error: "Booking cancellation request is already pending review" });
    }

    // Set cancellation pending status and save user reason
    booking.status = "Cancellation Pending";
    booking.cancelReason = req.body.reason || "Client Request";
    await booking.save();

    // Dynamically query customer for notifications
    const customer = await User.findById(booking.customer_id);

    // Safe notifications and logging (non-blocking)
    try {
      if (customer) {
        // Log the cancellation request event in Activity Logs
        await ActivityLog.create({
          user_id: booking.customer_id,
          email: customer.email || "client@workzy.com",
          role: "user",
          action: "BOOKING_CANCEL_REQUESTED",
          device: req.headers["user-agent"] || "Generic Web Client",
          ip: req.ip || "127.0.0.1",
          city: customer.city || "Kakinada"
        });
      }

      // Notify customer that cancellation is pending review
      await Notification.create({
        role: "user",
        user_id: booking.customer_id,
        title: "⏳ Cancellation Pending Review",
        message: `Your cancellation request for ${booking.service} is now pending administrator review. Once approved, the full amount will be refunded.`,
        type: "warning",
        is_read: false
      });

      // Notify admin about the new request
      await Notification.create({
        role: "admin",
        user_id: "admin",
        title: "⚖️ Cancellation Refund Pending",
        message: `Customer ${booking.customer_name} has requested cancellation for ${booking.service} due to: "${booking.cancelReason}".`,
        type: "info",
        is_read: false
      });

      // Notify worker (non-blocking notification)
      const worker = await Worker.findById(booking.worker_id);
      if (worker) {
        const workerUser = await User.findOne({ email: worker.email });
        if (workerUser) {
          await Notification.create({
            role: "worker",
            user_id: workerUser._id.toString(),
            title: "⏳ Cancellation Requested by Customer",
            message: `The customer has requested to cancel the booking for ${booking.service}. This is pending admin approval.`,
            type: "warning",
            is_read: false
          });
        }
      }
    } catch (err) {
      console.error("Non-blocking error during cancellation request notifications:", err);
    }

    res.status(200).json({ success: true, booking, message: "Cancellation request successfully submitted for review." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Admin Force-Cancel: For bookings stuck in "Started" status for over 24 hours
export const adminForceCancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status === "Cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    // Verify the booking is in "Started" status and has been for > 24 hours
    const now = new Date();
    const updatedAt = new Date(booking.updatedAt || booking.createdAt);
    const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);

    if (booking.status !== "Started") {
      return res.status(400).json({ 
        error: `Admin force-cancel is only available for bookings in "Started" status. Current status: "${booking.status}".` 
      });
    }

    if (hoursSinceUpdate < 24) {
      return res.status(400).json({ 
        error: `This booking has only been in "Started" status for ${Math.round(hoursSinceUpdate)} hours. Admin force-cancel requires at least 24 hours of inactivity.` 
      });
    }

    // Force cancel the booking
    booking.status = "Cancelled";
    await booking.save();

    // Refund customer wallet
    const customer = await User.findById(booking.customer_id);
    if (customer) {
      customer.walletBalance = (customer.walletBalance || 0) + booking.price;
      await customer.save();

      // Write a formal refund transaction record
      await Transaction.create({
        customer: booking.customer_name,
        worker: "Admin Force-Cancel Refund",
        service: `Admin Refund: ${booking.service}`,
        amount: booking.price,
        status: "Refunded",
        method: "Admin Force-Cancel"
      });
    }

    // Log the admin force-cancellation event
    await ActivityLog.create({
      user_id: "admin",
      email: "admin@workzy.com",
      role: "admin",
      action: "ADMIN_FORCE_CANCEL_OVERDUE_BOOKING",
      device: req.headers["user-agent"] || "Admin Dashboard",
      ip: req.ip || "127.0.0.1",
      city: "System"
    });

    // Notify customer about admin-initiated cancellation
    await Notification.create({
      role: "user",
      user_id: booking.customer_id,
      title: "⚠️ Booking Cancelled by Admin",
      message: `Your booking for ${booking.service} was cancelled by admin due to worker inactivity (no completion update for over 24 hours). A full refund of ₹${booking.price} has been credited to your wallet.`,
      type: "warning",
      is_read: false
    });

    // Notify worker about their forced cancellation
    try {
      const worker = await Worker.findById(booking.worker_id);
      if (worker) {
        const workerUser = await User.findOne({ email: worker.email });
        if (workerUser) {
          await Notification.create({
            role: "worker",
            user_id: workerUser._id.toString(),
            title: "🚫 Booking Force-Cancelled by Admin",
            message: `Your booking for ${booking.service} (Customer: ${booking.customer_name}) was force-cancelled by admin because the job was not completed within 24 hours of starting. Please ensure timely completion of future jobs.`,
            type: "warning",
            is_read: false
          });
        }
      }
    } catch (err) {
      console.error("Error notifying worker about admin force-cancel:", err);
    }

    // Notify admin
    await Notification.create({
      role: "admin",
      user_id: "admin",
      title: "🛑 Overdue Booking Force-Cancelled",
      message: `Booking #${booking._id.toString().substr(-6).toUpperCase()} for ${booking.service} was force-cancelled. Worker was inactive for ${Math.round(hoursSinceUpdate)} hours. Customer refund of ₹${booking.price} issued.`,
      type: "info",
      is_read: false
    });

    res.status(200).json({ 
      success: true, 
      booking, 
      message: `Overdue booking force-cancelled by admin. Worker was inactive for ${Math.round(hoursSinceUpdate)} hours. Customer wallet refunded ₹${booking.price}.` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get overdue bookings: Started > 24 hours ago without completion
export const getOverdueBookings = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const overdueBookings = await Booking.find({
      status: "Started",
      updatedAt: { $lt: oneDayAgo }
    }).sort({ updatedAt: 1 });

    res.status(200).json(overdueBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin approves booking cancellation and refunds customer
export const approveRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status !== "Cancellation Pending") {
      return res.status(400).json({ error: "Booking is not pending cancellation refund" });
    }

    const customer = await User.findById(booking.customer_id);
    if (!customer) {
      return res.status(404).json({ error: "Customer profile not found. Cannot issue refund." });
    }

    // Perform refund
    customer.walletBalance = (customer.walletBalance || 0) + booking.price;
    await customer.save();

    // Create Transaction record
    await Transaction.create({
      customer: booking.customer_name,
      worker: "Admin Refund Approval",
      service: `Refund approved: ${booking.service}`,
      amount: booking.price,
      status: "Refunded",
      method: "Wallet Topup"
    });

    // Update status to Cancelled
    booking.status = "Cancelled";
    await booking.save();

    // Notify customer
    try {
      await Notification.create({
        role: "user",
        user_id: booking.customer_id,
        title: "🟢 Cancellation Refund Approved",
        message: `Your cancellation request for ${booking.service} has been APPROVED by the administrator. ₹${booking.price} has been credited back to your wallet.`,
        type: "success",
        is_read: false
      });
    } catch (err) {
      console.error("Non-blocking notification error:", err);
    }

    res.status(200).json({ success: true, booking, message: "Cancellation refund approved and wallet credited successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin declines booking cancellation and refund
export const declineRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status !== "Cancellation Pending") {
      return res.status(400).json({ error: "Booking is not pending cancellation refund" });
    }

    // Locate the Admin user to credit the declined refund amount as platform/admin revenue
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      adminUser.walletBalance = (adminUser.walletBalance || 0) + booking.price;
      await adminUser.save();
    }

    // Write a formal transaction record of the declined cancellation (admin earnings)
    await Transaction.create({
      customer: booking.customer_name,
      worker: "Platform Revenue (Refund Declined)",
      service: `Decline hold: ${booking.service}`,
      amount: booking.price,
      status: "Admin Revenue",
      method: "Admin Hold"
    });

    // Update status to Refund Declined
    booking.status = "Refund Declined";
    await booking.save();

    // Notify customer
    try {
      await Notification.create({
        role: "user",
        user_id: booking.customer_id,
        title: "🔴 Cancellation Refund Declined",
        message: `Your cancellation refund request for ${booking.service} was REVIEWED and DECLINED by the administrator. The booking has been marked as Refund Declined.`,
        type: "danger",
        is_read: false
      });
    } catch (err) {
      console.error("Non-blocking notification error:", err);
    }

    res.status(200).json({ success: true, booking, message: "Cancellation refund request declined. Funds credited to Admin Balance successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

