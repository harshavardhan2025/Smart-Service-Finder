import Transaction from "../models/Transaction.js";

export const getTransactions = async (req, res) => {
  try {
    // 🧹 AUTOMATIC SUBSCRIPTION EXPIRATION CLEANUP
    // Any transaction of type "Plan Subscription" that has exceeded its validity period (30 days/365 days)
    // is automatically and permanently purged from the database so the user can re-subscribe.
    try {
      const now = new Date();
      const allSubs = await Transaction.find({ service: { $regex: /^Plan Subscription:/ } });
      const toDeleteIds = [];

      allSubs.forEach(t => {
        if (t.createdAt) {
          const txDate = new Date(t.createdAt);
          const planTitle = t.service.replace("Plan Subscription:", "").trim();
          let daysValid = 30; // default monthly plan
          if (planTitle.toLowerCase().includes("annual") || planTitle.toLowerCase().includes("year")) {
            daysValid = 365; // annual plan
          }
          const expiryDate = new Date(txDate.getTime() + daysValid * 24 * 60 * 60 * 1000);
          if (expiryDate <= now) {
            toDeleteIds.push(t._id);
          }
        }
      });

      if (toDeleteIds.length > 0) {
        await Transaction.deleteMany({ _id: { $in: toDeleteIds } });
        console.log(`🧹 [Auto-Cleanup] Permanently deleted ${toDeleteIds.length} expired subscriptions from database.`);
      }
    } catch (cleanupError) {
      console.error("⚠️ Failed to execute auto-cleanup of expired subscriptions:", cleanupError.message);
    }

    const filter = {};
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.worker) filter.worker = req.query.worker;
    
    const txns = await Transaction.find(filter).sort({ createdAt: -1 });
    res.status(200).json(txns);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const txn = await Transaction.create(req.body);
    res.status(201).json({ success: true, transaction: txn });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
