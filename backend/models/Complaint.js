import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  booking_id: { type: String },
  issue_type: { type: String, required: true },
  description: { type: String },
  reported_by: { type: String },
  status: { type: String, default: "Under Review" },
  admin_verdict: { type: String, default: "Pending" }
}, { timestamps: true });

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
