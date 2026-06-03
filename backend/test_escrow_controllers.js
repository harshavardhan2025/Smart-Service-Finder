import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "./models/Booking.js";
import User from "./models/User.js";
import Worker from "./models/Worker.js";
import { releaseEscrow, declineEscrow } from "./controllers/bookingController.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
    console.log("Connected to database.");

    // Create mock customer and worker
    const customer = await User.create({
      name: "Test Customer",
      email: `test_customer_${Date.now()}@test.com`,
      password: "password123",
      role: "user",
      walletBalance: 1000
    });
    const worker = await Worker.create({
      name: "Test Worker",
      email: `test_worker_${Date.now()}@test.com`,
      service: "Plumbing",
      city: "Kakinada",
      walletBalance: 0,
      status: "Active"
    });

    const booking = await Booking.create({
      customer_id: customer._id.toString(),
      customer_name: customer.name,
      worker_id: worker._id.toString(),
      date: "2026-06-10",
      time: "10:00 AM",
      service: "Plumbing",
      price: 500,
      status: "Completed"
    });
    console.log(`Created mock booking with ID: ${booking._id}`);

    // Test releaseEscrow
    console.log("Testing releaseEscrow...");
    const req = { params: { id: booking._id.toString() } };
    const res = {
      statusCode: 200,
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) {
        console.log(`Response Status: ${this.statusCode}`);
        console.log("Response Body:", data);
        return this;
      }
    };

    await releaseEscrow(req, res);

    // Verify worker wallet balance
    const updatedWorker = await Worker.findById(worker._id);
    console.log(`Updated Worker Wallet: ${updatedWorker.walletBalance} (Expected: 500)`);

    // Clean up
    await Booking.findByIdAndDelete(booking._id);
    await User.findByIdAndDelete(customer._id);
    await Worker.findByIdAndDelete(worker._id);
    console.log("Cleaned up database.");
    
    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}
run();
