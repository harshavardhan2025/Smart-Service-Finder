import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  customer_id: { type: String, required: true },
  customer_name: { type: String, default: "Active Client" },
  worker_id: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  service: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  couponCode: { type: String, default: "" },
  discountAmount: { type: Number, default: 0 },
  address: { type: String, default: "Pending Dispatch Location" },
  status: { type: String, default: "Upcoming" },
  cancelReason: { type: String },
  rejectReason: { type: String },
  rescheduleCount: { type: Number, default: 0 }
}, { timestamps: true });

bookingSchema.index({ customer_id: 1 });
bookingSchema.index({ worker_id: 1 });
bookingSchema.index({ status: 1, createdAt: 1 }); // For efficient timeout background job queries
bookingSchema.index({ worker_id: 1, date: 1, time: 1, status: 1 }); // For double-booking conflict checks

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
