import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";

export const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter);
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: "Access denied. You can only update your own profile." });
    }
    // Prevent direct password updates (would bypass hashing middleware)
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json({ success: true, message: "User account deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const sendMoneyToCustomer = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount specified." });
    }

    const customer = await User.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    customer.walletBalance = (customer.walletBalance || 0) + Number(amount);
    await customer.save();

    // Create Transaction record
    await Transaction.create({
      customer: customer.name,
      worker: "Admin Deposit",
      service: reason || "Admin Top-up / Compensation",
      amount: Number(amount),
      status: "Refunded",
      method: "Admin Adjustment"
    });

    // Create Notification for the customer
    await Notification.create({
      role: "user",
      user_id: customer._id.toString(),
      title: "💰 Money Received from Admin",
      message: `Admin has credited ₹${amount} to your wallet. Note: ${reason || "No reason specified."}`,
      type: "success",
      is_read: false
    });

    res.status(200).json({ success: true, message: `Successfully sent ₹${amount} to customer ${customer.name}.`, walletBalance: customer.walletBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const subscribeToPlan = async (req, res) => {
  try {
    const { planTitle, period, paymentMethod, amount } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (paymentMethod === "Wallet") {
      if ((user.walletBalance || 0) < amount) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }
      user.walletBalance -= amount;
    }

    let expiry = new Date();
    if (period === "year") {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }

    if (!user.subscriptions) {
      user.subscriptions = [];
    }
    
    user.subscriptions.push({
      planTitle: planTitle,
      startDate: new Date(),
      expiryDate: expiry,
      status: "Active"
    });
    
    await user.save();
    
    // Notify user of successful subscription
    try {
      await Notification.create({
        role: "user",
        user_id: user._id.toString(),
        title: "✨ Subscription Active!",
        message: `You have successfully subscribed to the "${planTitle}" plan. Enjoy your premium benefits!`,
        type: "success",
        is_read: false
      });
    } catch(err) {
      console.error("Failed to send subscription notification:", err);
    }
    
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ⏰ AUTOMATIC SUBSCRIPTION EXPIRY BACKGROUND ROUTINE
export const checkSubscriptionExpiries = async () => {
  try {
    const now = new Date();
    
    // Find users who have at least one active subscription that has expired
    const usersWithExpiredPlans = await User.find({
      "subscriptions": {
        $elemMatch: {
          status: "Active",
          expiryDate: { $lt: now }
        }
      }
    });

    if (usersWithExpiredPlans.length === 0) return;

    for (const user of usersWithExpiredPlans) {
      let updated = false;
      for (const sub of user.subscriptions) {
        if (sub.status === "Active" && sub.expiryDate < now) {
          console.log(`⏰ [SUBSCRIPTION EXPIRED] User ${user.email} plan '${sub.planTitle}' expired.`);
          sub.status = "Expired";
          updated = true;
          
          // Notify user
          try {
            await Notification.create({
              role: "user",
              user_id: user._id.toString(),
              title: "⚠️ Subscription Expired",
              message: `Your subscription to "${sub.planTitle}" has expired. Please renew to keep enjoying premium benefits!`,
              type: "warning",
              is_read: false
            });
          } catch(err) { console.error("Error notifying user of expiry", err); }
        }
      }
      
      if (updated) {
        await user.save();
      }
    }
  } catch (error) {
    console.error("Error in checkSubscriptionExpiries:", error.message);
  }
};
