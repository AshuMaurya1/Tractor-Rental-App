import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tractor from '../models/tractor.js';
import Booking from '../models/Booking.js';
import { protect, requireAdmin } from '../Middlewere/auth.js';
import { getAdminTractorQueue, reviewTractor } from '../controllers/ownerController.js';

const adminRouter = express.Router();

const generateToken = (userId, role, tokenVersion = 0) => jwt.sign({ userId, role, tokenVersion }, process.env.JWT_SECRET, { expiresIn: '7d' });

adminRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    if (user.isSuspended || user.accountStatus === 'Suspended' || user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This admin account is suspended or inactive.' });
    }

    const token = generateToken(user._id.toString(), user.role, user.tokenVersion || 0);
    return res.json({ success: true, token, user: { ...user.toJSON(), role: 'admin' } });
  } catch (error) {
    console.error('Admin login failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to authenticate admin.' });
  }
});

adminRouter.get('/dashboard', protect, requireAdmin, async (_req, res) => {
  try {
    const [users, tractors, bookings] = await Promise.all([
      User.find({}).select('-password').sort({ createdAt: -1 }),
      Tractor.find({}).sort({ createdAt: -1 }),
      Booking.find({}).sort({ createdAt: -1 }),
    ]);

    const farmers = users.filter((user) => String(user.role).toLowerCase() === 'farmer').length;
    const owners = users.filter((user) => String(user.role).toLowerCase() === 'owner').length;
    const approvedTractors = tractors.filter((tractor) => String(tractor.status || '').toLowerCase() === 'approved').length;
    const pendingTractors = tractors.filter((tractor) => String(tractor.status || '').toLowerCase() === 'pending').length;
    const rejectedTractors = tractors.filter((tractor) => String(tractor.status || '').toLowerCase() === 'rejected').length;
    const pendingBookings = bookings.filter((booking) => (booking.status || '').toLowerCase() === 'pending').length;
    const completedBookings = bookings.filter((booking) => (booking.status || '').toLowerCase() === 'completed').length;
    const platformRevenue = bookings
      .filter((booking) => booking.status === 'completed' || (booking.paymentDetails && Number(booking.paymentDetails.amountPaid) > 0))
      .reduce((sum, booking) => sum + (Number(booking.paymentDetails?.amountPaid) || (booking.status === 'completed' ? Number(booking.price || 0) : 0)), 0);

    return res.json({
      success: true,
      message: 'Admin dashboard access confirmed.',
      stats: {
        totalUsers: users.length,
        farmers,
        owners,
        totalTractors: tractors.length,
        approvedTractors,
        pendingTractors,
        rejectedTractors,
        totalBookings: bookings.length,
        pendingBookings,
        completedBookings,
        platformRevenue,
      },
    });
  } catch (error) {
    console.error('Admin dashboard query failed:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/users', protect, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, users });
  } catch (error) {
    console.error('Admin users query failed:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.patch('/users/:id/status', protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus, reason } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin' && accountStatus === 'Suspended') {
      return res.status(400).json({ success: false, message: 'Cannot suspend an admin account.' });
    }

    const isSuspending = accountStatus === 'Suspended';
    user.accountStatus = isSuspending ? 'Suspended' : 'Active';
    user.isSuspended = isSuspending;
    user.suspendedAt = isSuspending ? new Date() : null;
    user.suspendedBy = isSuspending ? req.user._id : null;
    user.suspensionReason = isSuspending ? (reason ? String(reason).trim() : 'Account suspended by administrator.') : '';
    
    // Invalidate existing JWT sessions across devices immediately
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // If an Owner is suspended while active bookings exist, flag the affected bookings for Admin review
    if (user.role === 'owner') {
      if (isSuspending) {
        await Booking.updateMany(
          { owner: user._id, status: { $in: ['pending', 'confirmed'] } },
          { 
            $set: { 
              ownerSuspended: true, 
              adminReviewRequired: true, 
              adminReviewNote: `Owner suspended on ${new Date().toLocaleDateString()}: ${user.suspensionReason}` 
            } 
          }
        );
      } else {
        // If reactivated, clear the ownerSuspended flag on existing active bookings
        await Booking.updateMany(
          { owner: user._id, ownerSuspended: true },
          { $set: { ownerSuspended: false } }
        );
      }
    }

    return res.json({ 
      success: true, 
      message: `User status updated to ${user.accountStatus}`, 
      user: user.toJSON() 
    });
  } catch (error) {
    console.error('Update user status failed:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/bookings', protect, requireAdmin, async (_req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('tractor', 'brand model image location pricePerDay status state district block village')
      .populate('user', 'name email phone image accountStatus isSuspended')
      .populate('owner', 'name email phone image accountStatus isSuspended')
      .sort({ createdAt: -1 });
    return res.json({ success: true, bookings });
  } catch (error) {
    console.error('Admin bookings query failed:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.patch('/bookings/:id/review', protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReviewRequired, adminReviewNote } = req.body;
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (adminReviewRequired !== undefined) booking.adminReviewRequired = Boolean(adminReviewRequired);
    if (adminReviewNote !== undefined) booking.adminReviewNote = String(adminReviewNote);
    await booking.save();
    return res.json({ success: true, message: 'Booking review status updated', booking });
  } catch (error) {
    console.error('Admin booking review update failed:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/tractors', protect, requireAdmin, getAdminTractorQueue);
adminRouter.patch('/tractors/:tractorId/verify', protect, requireAdmin, reviewTractor);

adminRouter.get('/analytics', protect, requireAdmin, async (_req, res) => {
  try {
    const [users, tractors, bookings] = await Promise.all([
      User.find({}).select('-password').sort({ createdAt: -1 }),
      Tractor.find({}).sort({ createdAt: -1 }),
      Booking.find({}).sort({ createdAt: -1 }),
    ]);

    const farmers = users.filter((user) => String(user.role).toLowerCase() === 'farmer').length;
    const owners = users.filter((user) => String(user.role).toLowerCase() === 'owner').length;
    const verifiedOwners = users.filter((user) => user.role === 'owner' && user.kycStatus === 'verified').length;
    const pendingKyc = users.filter((user) => user.role === 'owner' && user.kycStatus === 'pending').length;

    const revenue = bookings.reduce((sum, booking) => {
      const paid = Number(booking.paymentDetails?.amountPaid || 0);
      const price = Number(booking.price || 0);
      return sum + (paid || (booking.status === 'completed' ? price : 0));
    }, 0);

    const byStatus = {
      pending: bookings.filter((item) => item.status === 'pending').length,
      confirmed: bookings.filter((item) => item.status === 'confirmed').length,
      completed: bookings.filter((item) => item.status === 'completed').length,
      cancelled: bookings.filter((item) => item.status === 'cancelled').length,
      rejected: bookings.filter((item) => item.status === 'rejected').length,
    };

    return res.json({
      success: true,
      analytics: {
        totalUsers: users.length,
        farmers,
        owners,
        verifiedOwners,
        pendingKyc,
        totalEquipment: tractors.length,
        approvedEquipment: tractors.filter((tractor) => tractor.status === 'approved').length,
        pendingEquipment: tractors.filter((tractor) => tractor.status === 'pending').length,
        rejectedEquipment: tractors.filter((tractor) => tractor.status === 'rejected').length,
        totalBookings: bookings.length,
        activeBookings: bookings.filter((booking) => ['pending', 'confirmed'].includes(booking.status)).length,
        completedBookings: byStatus.completed,
        cancelledBookings: byStatus.cancelled,
        revenue,
        refundAmount: bookings.reduce((sum, booking) => sum + Number(booking.refundInfo?.refundAmount || 0), 0),
        byStatus,
      },
    });
  } catch (error) {
    console.error('Admin analytics failed:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default adminRouter;
