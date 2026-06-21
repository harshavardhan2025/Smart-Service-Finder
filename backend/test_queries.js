import mongoose from "mongoose";
import dotenv from "dotenv";
import Worker from "./models/Worker.js";
import Booking from "./models/Booking.js";
import CallSession from "./models/CallSession.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
console.log("Connecting to:", MONGO_URI);

async function test() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    console.log("Workers count:", await Worker.countDocuments());
    console.log("Bookings count:", await Booking.countDocuments());
    console.log("CallSessions count:", await CallSession.countDocuments());

    console.log("Testing CallSession.find status ringing:");
    const ringingCalls = await CallSession.find({ status: "ringing" });
    console.log("Ringing calls found:", ringingCalls.length);

    for (const c of ringingCalls) {
      console.log("Checking booking_id:", c.booking_id);
      try {
        const booking = await Booking.findById(c.booking_id);
        console.log("Booking found:", !!booking);
        if (booking) {
          const worker = await Worker.findById(booking.worker_id);
          console.log("Worker found for booking:", !!worker);
        }
      } catch (err) {
        console.error("Error for call session:", c._id, err);
      }
    }

    // Let's run a check on workers with adminView=true query
    console.log("Testing getWorkers query with adminView=true...");
    const adminWorkers = await Worker.find({});
    console.log("Workers found:", adminWorkers.length);

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

test();
