import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema({
  serviceFeePercent: { type: Number, default: 10 },
  platformCurrency: { type: String, default: 'INR' },
  maintenanceMode: { type: Boolean, default: false },
  featuredLimit: { type: Number, default: 8 },
  supportEmail: { type: String, default: 'support@tractorrental.in' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

export default PlatformSettings;
