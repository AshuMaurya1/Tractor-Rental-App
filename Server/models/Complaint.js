import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const complaintSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  owner: { type: ObjectId, ref: 'User', default: null },
  tractor: { type: ObjectId, ref: 'Tractor', default: null },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['customer', 'owner', 'tractor', 'breakdown_sos'], default: 'customer' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Rejected'], default: 'Open' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  notes: { type: String, default: '' },
  resolution: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

complaintSchema.index({ status: 1, createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
