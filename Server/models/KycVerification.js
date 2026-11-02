import mongoose from 'mongoose';

const kycVerificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  documentType: {
    type: String,
    enum: ['aadhaar', 'pan', 'driving_licence', 'vehicle_rc', 'ownership_proof', 'other'],
    default: 'other',
  },
  documents: [
    {
      fileName: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  verificationStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'verified', 'rejected'],
    default: 'not_submitted',
  },
  rejectionReason: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  consentGiven: { type: Boolean, default: true },
}, { timestamps: true });

const KycVerification = mongoose.models.KycVerification || mongoose.model('KycVerification', kycVerificationSchema);

export default KycVerification;
