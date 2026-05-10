import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  performed_by: { type: String, default: "System" }, // Usually admin ID
  action_type: { type: String, required: true }, // e.g., "PRICE_UPDATE", "USER_DELETION"
  target_id: { type: String }, // The document affected
  old_value: { type: mongoose.Schema.Types.Mixed },
  new_value: { type: mongoose.Schema.Types.Mixed },
  description: { type: String }
}, { timestamps: true });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
