import mongoose from "mongoose";

const callSessionSchema = new mongoose.Schema({
  booking_id: { type: String, required: true },
  caller_id: { type: String, required: true },
  callee_id: { type: String, required: true },
  caller_name: { type: String, default: "Caller" },
  callee_name: { type: String, default: "Callee" },
  status: { type: String, default: "ringing", enum: ["ringing", "connected", "ended", "missed", "declined"] },
  offer_sdp: { type: String },
  answer_sdp: { type: String },
  caller_ice: [{ type: String }],
  callee_ice: [{ type: String }],
  started_at: { type: Date },
  ended_at: { type: Date }
}, { timestamps: true });

callSessionSchema.index({ booking_id: 1, status: 1 });
callSessionSchema.index({ callee_id: 1, status: 1 });
callSessionSchema.index({ caller_id: 1, status: 1 });

const CallSession = mongoose.model("CallSession", callSessionSchema);
export default CallSession;
