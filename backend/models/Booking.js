import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  customer_id: { type: String, required: true },
  customer_name: { type: String, default: "Active Client" },
  worker_id: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  service: { type: String, required: true },
  price: { type: Number, required: true },
  address: { type: String, default: "Kakinada Main Road, 533001" },
  status: { type: String, default: "Upcoming" },
  cancelReason: { type: String }
}, { timestamps: true });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
