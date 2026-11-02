import KycVerification from '../models/KycVerification.js';
import User from '../models/User.js';
import { createNotification } from '../utils/notifications.js';

export const submitOwnerKyc = async (req, res) => {
  try {
    const userId = req.user._id;
    const { documentType = 'other', consentGiven = true } = req.body;
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ success: false, message: 'At least one KYC document is required.' });
    }

    const docUrls = files.map((file) => ({
      fileName: file.originalname,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date(),
    }));

    const kyc = await KycVerification.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        documentType,
        documents: docUrls,
        verificationStatus: 'pending',
        consentGiven: Boolean(consentGiven),
        rejectionReason: '',
        reviewedAt: null,
        reviewedBy: null,
      },
      { upsert: true, new: true },
    );

    await User.findByIdAndUpdate(userId, { kycStatus: 'pending' });

    await createNotification({
      userId,
      role: req.user.role,
      type: 'verification',
      title: 'KYC Submitted',
      message: 'Your owner verification documents have been submitted and are under review.',
      metadata: { kycId: kyc._id.toString() },
    });

    return res.status(201).json({ success: true, message: 'KYC submitted for review.', kyc });
  } catch (error) {
    console.error('submitOwnerKyc error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOwnerKyc = async (req, res) => {
  try {
    const kyc = await KycVerification.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, kyc: kyc || null });
  } catch (error) {
    console.error('getOwnerKyc error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const listPendingKyc = async (req, res) => {
  try {
    const items = await KycVerification.find({ verificationStatus: 'pending' })
      .populate('user', 'name email phone role')
      .sort({ createdAt: -1 });

    return res.json({ success: true, items });
  } catch (error) {
    console.error('listPendingKyc error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const normalizedStatus = String(status || '').toLowerCase();
    if (!['verified', 'rejected'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Status must be verified or rejected.' });
    }

    const kyc = await KycVerification.findById(id);
    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found.' });
    }

    kyc.verificationStatus = normalizedStatus;
    kyc.rejectionReason = normalizedStatus === 'rejected' ? (rejectionReason || 'Verification failed review.') : '';
    kyc.reviewedBy = req.user._id;
    kyc.reviewedAt = new Date();
    await kyc.save();

    await User.findByIdAndUpdate(kyc.user, {
      kycStatus: normalizedStatus,
      updatedAt: new Date(),
    });

    await createNotification({
      userId: kyc.user,
      role: 'owner',
      type: 'verification',
      title: normalizedStatus === 'verified' ? 'KYC Approved' : 'KYC Rejected',
      message: normalizedStatus === 'verified'
        ? 'Your owner verification has been approved. You can now unlock trust features.'
        : `Your KYC was rejected. ${kyc.rejectionReason || 'Please resubmit valid documents.'}`,
      metadata: { kycId: kyc._id.toString() },
    });

    return res.json({ success: true, message: `KYC ${normalizedStatus}.`, kyc });
  } catch (error) {
    console.error('reviewKyc error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
