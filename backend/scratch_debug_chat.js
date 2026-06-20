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
  console.log("BOOKING:", booking);
  if (booking) {
    const worker = await Worker.findById(booking.worker_id);
    console.log("WORKER:", worker);
    if (worker) {
      const workerUser = await User.findOne({ email: worker.email });
      console.log("WORKER USER:", workerUser);
    }
  }

  const messages = await Message.find({ booking_id: bookingId });
  console.log(`MESSAGES count: ${messages.length}`);
  console.log(messages);
  process.exit(0);
}
run();
