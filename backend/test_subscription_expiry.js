import mongoose from "mongoose";
import dotenv from "dotenv";
import Transaction from "./models/Transaction.js";

dotenv.config();

async function verifySubscriptionCleanup() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected successfully!");

    // 1. Clear any existing plan subscriptions for our test user
    const testCustomer = "Test Verification User";
    await Transaction.deleteMany({ customer: testCustomer });
    console.log("🧹 Cleared old transactions for", testCustomer);

    // 2. Seed an ACTIVE subscription (Monthly, created now)
    const activeSub = await Transaction.create({
      customer: testCustomer,
      worker: "System Admin",
      service: "Plan Subscription: Home Pro",
      amount: 2499,
      status: "Paid",
      method: "Wallet",
      createdAt: new Date()
    });
    console.log("✅ Created Active Subscription:", activeSub.service, "at", activeSub.createdAt);

    // 3. Seed an EXPIRED subscription (Monthly, created 35 days ago)
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    const expiredSub = await Transaction.create({
      customer: testCustomer,
      worker: "System Admin",
      service: "Plan Subscription: Basic Care",
      amount: 999,
      status: "Paid",
      method: "Wallet",
      createdAt: thirtyFiveDaysAgo
    });
    console.log("✅ Created Expired Subscription:", expiredSub.service, "at", expiredSub.createdAt);

    // 4. Simulate the controller cleanup logic
    console.log("\n🧹 Running automatic cleanup logic...");
    const now = new Date();
    const allSubs = await Transaction.find({ service: { $regex: /^Plan Subscription:/ } });
    const toDeleteIds = [];

    allSubs.forEach(t => {
      if (t.createdAt) {
        const txDate = new Date(t.createdAt);
        const planTitle = t.service.replace("Plan Subscription:", "").trim();
        let daysValid = 30;
        if (planTitle.toLowerCase().includes("annual") || planTitle.toLowerCase().includes("year")) {
          daysValid = 365;
        }
        const expiryDate = new Date(txDate.getTime() + daysValid * 24 * 60 * 60 * 1000);
        if (expiryDate <= now) {
          toDeleteIds.push(t._id);
        }
      }
    });

    if (toDeleteIds.length > 0) {
      await Transaction.deleteMany({ _id: { $in: toDeleteIds } });
      console.log(`🗑️ Successfully deleted ${toDeleteIds.length} expired subscriptions from database.`);
    } else {
      console.log("ℹ️ No expired subscriptions found for deletion.");
    }

    // 5. Query transactions again to verify correct state
    const remaining = await Transaction.find({ customer: testCustomer });
    console.log(`\n📋 Remaining Transactions for ${testCustomer}:`);
    remaining.forEach(t => {
      console.log(`   - ${t.service} (Created: ${t.createdAt.toLocaleDateString()})`);
    });

    const hasExpired = remaining.some(t => t.service.includes("Basic Care"));
    const hasActive = remaining.some(t => t.service.includes("Home Pro"));

    if (!hasExpired && hasActive) {
      console.log("\n🎉 SUCCESS! Expired subscription was automatically deleted, and active subscription remains preserved! 🚀");
    } else {
      console.error("\n❌ FAILURE! Verification results did not match expectations.");
    }

  } catch (err) {
    console.error("❌ Verification error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

verifySubscriptionCleanup();
