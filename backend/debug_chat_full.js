import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "./models/Message.js";
import Booking from "./models/Booking.js";
import User from "./models/User.js";
import Worker from "./models/Worker.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
  
  const bookingId = "6a36ca6ed9dabde0a4bdcfd3";
  const booking = await Booking.findById(bookingId);
  
  console.log("=== BOOKING ===");
  console.log("ID:", booking._id.toString());
  console.log("customer_id:", booking.customer_id, "type:", typeof booking.customer_id);
  console.log("worker_id:", booking.worker_id, "type:", typeof booking.worker_id);
  console.log("status:", booking.status);
  
  // Simulate customer auth
  const customerUser = await User.findById(booking.customer_id);
  console.log("\n=== CUSTOMER USER ===");
  console.log("_id:", customerUser?._id.toString(), "email:", customerUser?.email, "role:", customerUser?.role);
  
  // Simulate worker auth
  const worker = await Worker.findById(booking.worker_id);
  console.log("\n=== WORKER (Worker collection) ===");
  console.log("_id:", worker?._id.toString(), "email:", worker?.email);
  
  const workerUser = await User.findOne({ email: worker?.email });
  console.log("\n=== WORKER (User collection) ===");
  console.log("_id:", workerUser?._id.toString(), "email:", workerUser?.email, "role:", workerUser?.role);
  
  // Check isWorker/isCustomer logic as in chatController
  console.log("\n=== AUTH CHECKS (simulating customer login) ===");
  const reqUserCustomer = customerUser;
  const isWorkerForCustomer = worker && reqUserCustomer && (
    worker.email.toLowerCase() === reqUserCustomer.email.toLowerCase() ||
    worker._id.toString() === reqUserCustomer._id.toString()
  );
  const isCustomerForCustomer = reqUserCustomer && (
    reqUserCustomer._id.toString() === booking.customer_id.toString() ||
    (booking.customerEmail && reqUserCustomer.email.toLowerCase() === booking.customerEmail.toLowerCase())
  );
  console.log("isWorker:", isWorkerForCustomer, "isCustomer:", isCustomerForCustomer);
  console.log("customer._id.toString():", reqUserCustomer._id.toString());
  console.log("booking.customer_id.toString():", booking.customer_id.toString());
  console.log("Match?", reqUserCustomer._id.toString() === booking.customer_id.toString());
  
  console.log("\n=== AUTH CHECKS (simulating worker login) ===");
  const reqUserWorker = workerUser;
  const isWorkerForWorker = worker && reqUserWorker && (
    worker.email.toLowerCase() === reqUserWorker.email.toLowerCase() ||
    worker._id.toString() === reqUserWorker._id.toString()
  );
  const isCustomerForWorker = reqUserWorker && (
    reqUserWorker._id.toString() === booking.customer_id.toString() ||
    (booking.customerEmail && reqUserWorker.email.toLowerCase() === booking.customerEmail.toLowerCase())
  );
  console.log("isWorker:", isWorkerForWorker, "isCustomer:", isCustomerForWorker);
  console.log("worker.email:", worker.email, "reqUser.email:", reqUserWorker.email, "Match?", worker.email.toLowerCase() === reqUserWorker.email.toLowerCase());
  
  // Test creating a message
  console.log("\n=== CREATING TEST MESSAGE ===");
  try {
    const msg = await Message.create({
      booking_id: bookingId,
      sender_id: customerUser._id.toString(),
      receiver_id: workerUser._id.toString(),
      text: "TEST - debug message"
    });
    console.log("Created message:", msg);
    
    // Now query it back
    const found = await Message.find({ booking_id: bookingId });
    console.log("Found messages for booking:", found.length);
    found.forEach(m => console.log("  -", m._id.toString(), "sender:", m.sender_id, "text:", m.text));
    
    // Clean up test message
    await Message.deleteOne({ _id: msg._id });
    console.log("Cleaned up test message.");
  } catch(e) {
    console.error("Error creating message:", e.message);
  }
  
  process.exit(0);
}
run();
