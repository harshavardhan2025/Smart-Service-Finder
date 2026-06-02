import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Worker from "./models/Worker.js";
import Booking from "./models/Booking.js";
import Transaction from "./models/Transaction.js";
import Notification from "./models/Notification.js";
import { checkBookingTimeouts } from "./controllers/bookingController.js";

dotenv.config();

const runTest = async () => {
  try {
    console.log("🔋 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ Database connected successfully.");

    // 1. Clean up any previous test artifacts
    await User.deleteMany({ email: "timeout_customer@test.com" });
    await Worker.deleteMany({ email: "timeout_worker@test.com" });

    // 2. Create Mock Customer and Worker
    const customer = await User.create({
      name: "Timeout Customer",
      email: "timeout_customer@test.com",
      password: "password123",
      role: "user",
      city: "Kakinada",
      walletBalance: 1000
    });

    const worker = await Worker.create({
      name: "Timeout Worker",
      email: "timeout_worker@test.com",
      service: "Plumbing",
      city: "Kakinada",
      location: "Bhanugudi",
      rating: 4.5,
      price: 400
    });

    console.log("👷 Seeded mock user & worker successfully.");

    // 3. Construct dates for Instant and Normal Bookings
    const now = new Date();
    
    // An Instant booking created 21 minutes ago, scheduled for 10 minutes in the future of creation (i.e. 11 mins ago from now)
    const instantCreatedTime = new Date(now.getTime() - 21 * 60 * 1000);
    const instantScheduledTime = new Date(instantCreatedTime.getTime() + 10 * 60 * 1000);
    
    // Parse times back to Date-Strings / Time-Strings for parseBookingDateTime compatibility
    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const formatTime = (d) => {
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const modifier = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${modifier}`;
    };

    // Create Instant Booking
    const instantBooking = await Booking.create({
      customer_id: customer._id.toString(),
      customer_name: customer.name,
      worker_id: worker._id.toString(),
      date: formatDate(instantScheduledTime),
      time: formatTime(instantScheduledTime),
      service: "Plumbing",
      price: 500,
      address: "Instant Test Lane, Kakinada",
      status: "Pending"
    });
    
    // Override createdAt to simulate a creation 21 minutes ago
    await Booking.collection.updateOne({ _id: instantBooking._id }, { $set: { createdAt: instantCreatedTime } });

    // Create Normal Booking created 46 minutes ago, scheduled for tomorrow
    const normalCreatedTime = new Date(now.getTime() - 46 * 60 * 1000);
    const normalScheduledTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const normalBooking = await Booking.create({
      customer_id: customer._id.toString(),
      customer_name: customer.name,
      worker_id: worker._id.toString(),
      date: formatDate(normalScheduledTime),
      time: formatTime(normalScheduledTime),
      service: "Plumbing",
      price: 300,
      address: "Normal Test Lane, Kakinada",
      status: "Pending"
    });

    await Booking.collection.updateOne({ _id: normalBooking._id }, { $set: { createdAt: normalCreatedTime } });

    console.log("📅 Mock pending bookings seeded successfully:");
    console.log(`   - Instant Booking (ID: ${instantBooking._id}, Price: 500, Created: 21 mins ago)`);
    console.log(`   - Normal Booking (ID: ${normalBooking._id}, Price: 300, Created: 46 mins ago)`);

    // 4. Invoke background timeout check
    console.log("\n📡 Triggering checkBookingTimeouts() background job...");
    await checkBookingTimeouts();

    // 5. Fetch updated records to verify
    const updatedInstant = await Booking.findById(instantBooking._id);
    const updatedNormal = await Booking.findById(normalBooking._id);
    const updatedCustomer = await User.findById(customer._id);
    const transactions = await Transaction.find({ customer: customer.name });
    const notifications = await Notification.find({ user_id: customer._id.toString() });

    console.log("\n--- TIMEOUT VERIFICATION SUMMARY ---");
    console.log(`Current Time (now): ${now.toISOString()}`);
    console.log(`1. Instant Booking - CreatedAt in DB: ${updatedInstant.createdAt ? updatedInstant.createdAt.toISOString() : 'NULL'}, Scheduled Date: ${updatedInstant.date}, Time: ${updatedInstant.time}`);
    console.log(`2. Normal Booking - CreatedAt in DB: ${updatedNormal.createdAt ? updatedNormal.createdAt.toISOString() : 'NULL'}, Scheduled Date: ${updatedNormal.date}, Time: ${updatedNormal.time}`);
    console.log(`3. Instant Booking Status: "${updatedInstant.status}" (Expected: "Cancelled")`);
    console.log(`4. Normal Booking Status: "${updatedNormal.status}" (Expected: "Cancelled")`);
    console.log(`5. Instant Cancel Reason: "${updatedInstant.cancelReason}"`);
    console.log(`6. Normal Cancel Reason: "${updatedNormal.cancelReason}"`);
    console.log(`7. Customer Wallet Balance: ₹${updatedCustomer.walletBalance} (Expected: ₹1800 [+500 +300 refund])`);
    console.log(`8. Logged Transactions Count: ${transactions.length} (Expected: 2)`);
    console.log(`9. Dispatched Notifications Count: ${notifications.length} (Expected: 2)`);

    const isSuccess = 
      updatedInstant.status === "Cancelled" &&
      updatedNormal.status === "Cancelled" &&
      updatedCustomer.walletBalance === 1800 &&
      transactions.length === 2 &&
      notifications.length === 2;

    if (isSuccess) {
      console.log("\n🎉 TEST SUCCESS: Overdue bookings successfully cancelled and refunded! 🏁");
      process.exit(0);
    } else {
      console.error("\n❌ TEST FAILURE: Booking states or wallet balances do not match expected outcomes.");
      process.exit(1);
    }

  } catch (error) {
    console.error("❌ Exception during integration test:", error.message);
    process.exit(1);
  }
};

runTest();
