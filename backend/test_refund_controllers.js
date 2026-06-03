import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "./models/Booking.js";
import User from "./models/User.js";
import { approveRefund, declineRefund } from "./controllers/bookingController.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
    console.log("Connected to database.");

    // Create a mock customer
    const customer = await User.create({
      name: "Test Customer",
      email: `test_customer_${Date.now()}@test.com`,
      password: "password123",
      role: "user",
      walletBalance: 1000
    });
    console.log(`Created mock customer with ID: ${customer._id}`);

    // Create a mock booking
    const booking = await Booking.create({
      customer_id: customer._id.toString(),
      customer_name: customer.name,
      worker_id: "6a1d21112c68208bd09e19db", // Sanjay Reddy
      date: "2026-06-10",
      time: "10:00 AM",
      service: "Plumbing Services",
      price: 500,
      status: "Cancellation Pending",
      cancelReason: "Testing Refund Controller"
    });
    console.log(`Created mock booking with ID: ${booking._id}`);

    // Test approveRefund
    console.log("Testing approveRefund...");
    const req = {
      params: { id: booking._id.toString() },
      headers: {},
      ip: "127.0.0.1"
    };
    const res = {
      statusCode: 200,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log(`Response Status: ${this.statusCode}`);
        console.log("Response Body:", data);
        return this;
      }
    };

    await approveRefund(req, res);

    // Verify customer wallet balance
    const updatedCustomer = await User.findById(customer._id);
    console.log(`Updated Wallet Balance: ${updatedCustomer.walletBalance} (Expected: 1500)`);

    // Clean up
    await Booking.findByIdAndDelete(booking._id);
    await User.findByIdAndDelete(customer._id);
    console.log("Cleaned up database.");
    
    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}
run();
