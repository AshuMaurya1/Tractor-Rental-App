import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const adminActivityLogSchema = new mongoose.Schema({
  admin: { type: ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetEntity: { type: String, required: true },
  targetId: { type: String, default: '' },
  reason: { type: String, default: '' },
  metadata: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

adminActivityLogSchema.index({ admin: 1, timestamp: -1 });
adminActivityLogSchema.index({ targetEntity: 1, targetId: 1 });

const AdminActivityLog = mongoose.model('AdminActivityLog', adminActivityLogSchema);

export default AdminActivityLog;
