import mongoose from 'mongoose';
import User from '../models/User.js';
import Tractor from '../models/tractor.js';
import Booking from '../models/Booking.js';
import Complaint from '../models/Complaint.js';
import AdminActivityLog from '../models/AdminActivityLog.js';
import PlatformSettings from '../models/PlatformSettings.js';

const logAdminAction = async ({ admin, action, targetEntity, targetId, reason, metadata = {} }) => {
  try {
    await AdminActivityLog.create({
      admin,
      action,
      targetEntity,
      targetId: targetId || '',
      reason: reason || '',
      metadata,
    });
  } catch (error) {
    console.error('logAdminAction failed:', error.message);
  }
};

export const getSuperAdminDashboard = async (req, res) => {
  try {
    const [users, owners, tractors, bookings, complaints, logs] = await Promise.all([
      User.find({}).select('-password'),
      User.find({ role: 'owner' }).select('-password'),
      Tractor.find({}).populate('owner', 'name email'),
      Booking.find({}).populate('user', 'name email').populate('owner', 'name email').populate('tractor', 'brand model'),
      Complaint.find({}).populate('user', 'name email').populate('owner', 'name email').populate('tractor', 'brand model').sort({ createdAt: -1 }).limit(10),
      AdminActivityLog.find({}).populate('admin', 'name email').sort({ timestamp: -1 }).limit(10),
    ]);

    const activeBookings = bookings.filter((booking) => ['pending', 'confirmed', 'completed'].includes((booking.status || '').toLowerCase())).length;
    const pendingBookings = bookings.filter((booking) => (booking.status || '').toLowerCase() === 'pending').length;
    const completedBookings = bookings.filter((booking) => (booking.status || '').toLowerCase() === 'completed').length;
    const cancelledBookings = bookings.filter((booking) => (booking.status || '').toLowerCase() === 'cancelled').length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0);

    return res.json({
      success: true,
      dashboard: {
        totalUsers: users.length,
        totalOwners: owners.length,
        totalTractors: tractors.length,
        activeBookings,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        recentBookings: bookings.slice(0, 6),
        recentUsers: users.slice(0, 6),
        recentTractors: tractors.slice(0, 6),
        pendingComplaints: complaints.filter((item) => item.status === 'Open' || item.status === 'In Progress').slice(0, 5),
        recentActivity: logs,
      },
    });
  } catch (error) {
    console.error('getSuperAdminDashboard error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, users });
  } catch (error) {
    console.error('getAllUsers error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'superadmin' && accountStatus === 'Suspended') {
      return res.status(400).json({ success: false, message: 'Protecting the last active super admin account from suspension.' });
    }

    user.accountStatus = accountStatus === 'Suspended' ? 'Suspended' : 'Active';
    user.isSuspended = user.accountStatus === 'Suspended';
    user.suspendedAt = user.isSuspended ? new Date() : null;
    user.suspendedBy = user.isSuspended ? req.user._id : null;
    await user.save();

    await logAdminAction({
      admin: req.user._id,
      action: user.isSuspended ? 'User suspended' : 'User reactivated',
      targetEntity: 'User',
      targetId: id,
      reason: reason || 'Admin account action',
      metadata: { accountStatus: user.accountStatus },
    });

    return res.json({ success: true, message: `User ${user.accountStatus === 'Suspended' ? 'suspended' : 'reactivated'} successfully`, user });
  } catch (error) {
    console.error('updateUserStatus error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: 'owner' }).select('-password').sort({ createdAt: -1 });

    const ownerData = await Promise.all(owners.map(async (owner) => {
      const tractors = await Tractor.find({ owner: owner._id });
      const bookings = await Booking.find({ owner: owner._id });
      return {
        ...owner.toObject(),
        totalTractors: tractors.length,
        activeBookings: bookings.filter((booking) => ['pending', 'confirmed', 'completed'].includes((booking.status || '').toLowerCase())).length,
        totalEarnings: bookings.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0),
      };
    }));

    return res.json({ success: true, owners: ownerData });
  } catch (error) {
    console.error('getAllOwners error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOwnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid owner id' });
    }

    const user = await User.findById(id);
    if (!user || user.role !== 'owner') {
      return res.status(404).json({ success: false, message: 'Owner not found' });
    }

    user.accountStatus = accountStatus === 'Suspended' ? 'Suspended' : 'Active';
    user.isSuspended = user.accountStatus === 'Suspended';
    user.suspendedAt = user.isSuspended ? new Date() : null;
    user.suspendedBy = user.isSuspended ? req.user._id : null;
    await user.save();

    await logAdminAction({
      admin: req.user._id,
      action: user.isSuspended ? 'Owner suspended' : 'Owner reactivated',
      targetEntity: 'Owner',
      targetId: id,
      reason: reason || 'Owner account action',
      metadata: { accountStatus: user.accountStatus },
    });

    return res.json({ success: true, message: `Owner ${user.accountStatus === 'Suspended' ? 'suspended' : 'reactivated'} successfully`, user });
  } catch (error) {
    console.error('updateOwnerStatus error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTractorsForAdmin = async (req, res) => {
  try {
    const tractors = await Tractor.find({}).populate('owner', 'name email').sort({ createdAt: -1 });
    return res.json({ success: true, tractors });
  } catch (error) {
    console.error('getAllTractorsForAdmin error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTractorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid tractor id' });
    }

    const tractor = await Tractor.findById(id);
    if (!tractor) {
      return res.status(404).json({ success: false, message: 'Tractor not found' });
    }

    tractor.status = status || tractor.status || 'Available';
    await tractor.save();

    await logAdminAction({
      admin: req.user._id,
      action: 'Tractor moderated',
      targetEntity: 'Tractor',
      targetId: id,
      reason: reason || 'Admin moderation',
      metadata: { status: tractor.status },
    });

    return res.json({ success: true, message: 'Tractor status updated successfully', tractor });
  } catch (error) {
    console.error('updateTractorStatus error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBookingsForAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('user', 'name email').populate('owner', 'name email').populate('tractor', 'brand model').sort({ createdAt: -1 });
    return res.json({ success: true, bookings });
  } catch (error) {
    console.error('getAllBookingsForAdmin error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const correctBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = status || booking.status;
    await booking.save();

    await logAdminAction({
      admin: req.user._id,
      action: 'Booking corrected',
      targetEntity: 'Booking',
      targetId: id,
      reason: reason || 'Administrative correction',
      metadata: { previousStatus: booking.status, newStatus: status },
    });

    return res.json({ success: true, message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error('correctBookingStatus error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    const owners = await User.find({ role: 'owner' }).select('-password');
    const bookings = await Booking.find({});
    const tractors = await Tractor.find({});

    const completedBookings = bookings.filter((booking) => booking.status === 'completed');
    const grossRevenue = bookings.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0);
    const totalCompletedRevenue = completedBookings.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0);

    return res.json({
      success: true,
      analytics: {
        totalUsers: users.length,
        totalOwners: owners.length,
        totalTractors: tractors.length,
        totalBookings: bookings.length,
        totalCompletedBookings: completedBookings.length,
        grossRevenue,
        completedRevenue: totalCompletedRevenue,
        averageBookingValue: bookings.length ? grossRevenue / bookings.length : 0,
      },
    });
  } catch (error) {
    console.error('getAnalytics error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({}).populate('user', 'name email').populate('owner', 'name email').populate('tractor', 'brand model').sort({ createdAt: -1 });
    return res.json({ success: true, complaints });
  } catch (error) {
    console.error('getComplaints error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, reason } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = status || complaint.status;
    complaint.resolution = resolution || complaint.resolution;
    complaint.notes = `${complaint.notes || ''} ${reason || ''}`.trim();
    complaint.updatedAt = new Date();
    await complaint.save();

    await logAdminAction({
      admin: req.user._id,
      action: 'Complaint updated',
      targetEntity: 'Complaint',
      targetId: id,
      reason: reason || 'Complaint review',
      metadata: { status: complaint.status },
    });

    return res.json({ success: true, complaint });
  } catch (error) {
    console.error('updateComplaintStatus error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const logs = await AdminActivityLog.find({}).populate('admin', 'name email').sort({ timestamp: -1 }).limit(100);
    return res.json({ success: true, logs });
  } catch (error) {
    console.error('getActivityLogs error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlatformSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({});
    if (!settings) {
      settings = await PlatformSettings.create({});
    }
    return res.json({ success: true, settings });
  } catch (error) {
    console.error('getPlatformSettings error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlatformSettings = async (req, res) => {
  try {
    const payload = req.body || {};
    const settings = await PlatformSettings.findOneAndUpdate({}, { $set: { ...payload, updatedBy: req.user._id, updatedAt: new Date() } }, { new: true, upsert: true });

    await logAdminAction({
      admin: req.user._id,
      action: 'Platform settings updated',
      targetEntity: 'PlatformSettings',
      targetId: settings._id.toString(),
      reason: payload.reason || 'Admin update',
      metadata: payload,
    });

    return res.json({ success: true, settings });
  } catch (error) {
    console.error('updatePlatformSettings error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
