import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  booking_id: { type: String },
  service: { type: String },
  customer_name: { type: String },
  worker_id: { type: String },
  rating: { type: Number, required: true },
  comment: { type: String },
  date: { type: String }
}, { timestamps: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
