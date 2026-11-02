import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['farmer', 'owner', 'admin'], default: 'farmer' },
  type: {
    type: String,
    enum: [
      'booking',
      'payment',
      'refund',
      'verification',
      'system',
      'reminder',
      'cancellation',
      'alert',
    ],
    default: 'system',
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
