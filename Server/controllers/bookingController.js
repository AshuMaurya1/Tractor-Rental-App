import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Tractor from '../models/tractor.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import { calculateBookingPrice, calculateCancellationRefund, isDateRangeOverlapping } from '../utils/bookingRules.js';
import { createNotification } from '../utils/notifications.js';

const VALID_BOOKING_STATUS = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

const checkAvailability = async (tractorId, startDate, endDate, excludeBookingId = null) => {
    const query = {
        tractor: tractorId,
        status: { $in: ['pending', 'confirmed'] },
        startDate: { $lt: new Date(endDate) },
        endDate: { $gt: new Date(startDate) }
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const bookings = await Booking.find(query);
    return bookings.length === 0;
};

// API to check Availability of Tractor for given dates and Location
export const checkTractorAvailability = async (req, res) => {
    try {
        const { location, startDate, endDate } = req.body;

        const activeOwners = await User.find({
            role: 'owner',
            $and: [
                { isSuspended: { $ne: true } },
                { accountStatus: { $ne: 'Suspended' } }
            ]
        }).select('_id');
        const activeOwnerIds = activeOwners.map((owner) => owner._id);

        const query = { isAvailable: true, status: 'approved', owner: { $in: activeOwnerIds } };
        if (location && location.trim() !== '') {
            query.location = { $regex: new RegExp(location.trim(), 'i') };
        }

        const tractors = await Tractor.find(query);

        if (!startDate || !endDate) {
            return res.json({ success: true, availableTractors: tractors });
        }

        const availableTractorsPromises = tractors.map(async (tractor) => {
            const isAvailable = await checkAvailability(tractor._id, startDate, endDate);
            return { ...tractor._doc, isAvailable };
        });

        let availableTractors = await Promise.all(availableTractorsPromises);
        availableTractors = availableTractors.filter(t => t.isAvailable === true);
        return res.json({ success: true, availableTractors });

    } catch (error) {
        console.error("checkTractorAvailability error:", error.message);
        return res.json({ success: false, message: error.message });
    }
};

// API to Create Booking
export const createBooking = async (req, res) => {
    try {
        const { _id } = req.user;
        const {
            tractorId,
            startDate,
            endDate,
            price,
            includeDriver = false,
            implements: selectedImplements = [],
            paymentDetails = {},
            bookingType = 'daily',
            billingModel = 'daily',
            acreageCount = 0,
            engineHours = 0,
            insuranceIncluded = false,
            comboDiscountPercent = 0,
            deliveryOption = 'self_pickup',
        } = req.body;

        if (!tractorId || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Please provide tractor, start date, and end date' });
        }

        if (!mongoose.Types.ObjectId.isValid(String(tractorId))) {
            return res.status(400).json({
                success: false,
                message: 'The selected tractor is not available in the live fleet. Please choose a tractor from the current catalog.'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({ success: false, message: 'Please provide valid rental dates.' });
        }

        if (end <= start) {
            return res.status(400).json({ success: false, message: 'Return date must be after the pickup date.' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({ success: false, message: 'Past dates cannot be booked.' });
        }

        if (req.user.isSuspended || req.user.accountStatus === 'Suspended') {
            return res.status(403).json({ success: false, message: 'Your account is suspended. You cannot create bookings.' });
        }

        const tractorData = await Tractor.findById(tractorId);
        if (!tractorData) {
            return res.status(404).json({ success: false, message: 'Tractor not found' });
        }

        const tractorOwner = await User.findById(tractorData.owner);
        if (!tractorOwner || tractorOwner.isSuspended || tractorOwner.accountStatus === 'Suspended') {
            return res.status(403).json({
                success: false,
                message: 'This tractor is not available for booking as the owner account is currently suspended or inactive.'
            });
        }

        if (tractorData.status !== 'approved') {
            return res.status(403).json({ success: false, message: 'This tractor is not approved for booking yet.' });
        }

        if (!tractorData.isAvailable) {
            return res.status(400).json({ success: false, message: 'This tractor is currently unavailable for rental.' });
        }

        const isAvailable = await checkAvailability(tractorData._id, startDate, endDate);
        if (!isAvailable) {
            return res.status(409).json({ success: false, message: 'Tractor is already reserved for the selected dates.' });
        }

        const diffDays = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)));

        let finalPrice = Number(price);
        if (!finalPrice || Number.isNaN(finalPrice)) {
            finalPrice = calculateBookingPrice(
                tractorData,
                diffDays,
                Boolean(includeDriver),
                selectedImplements,
                {
                    billingModel,
                    acreage: acreageCount,
                    hours: engineHours,
                    insurance: insuranceIncluded,
                    comboDiscountPercent
                }
            );
        }

        const booking = await Booking.create({
            tractor: tractorData._id,
            owner: tractorData.owner,
            user: _id,
            startDate: start,
            endDate: end,
            bookingType,
            billingModel,
            acreageCount: Number(acreageCount) || 0,
            engineHours: Number(engineHours) || 0,
            insuranceIncluded: Boolean(insuranceIncluded),
            insuranceAmount: insuranceIncluded ? (billingModel === 'daily' ? 99 * diffDays : 99) : 0,
            escrowStatus: 'held',
            isChcCertified: Boolean(tractorData.isChcCertified),
            deliveryOption,
            price: finalPrice,
            includeDriver: Boolean(includeDriver),
            implements: selectedImplements,
            paymentDetails,
            paymentStatus: 'pending',
            status: 'pending'
        });

        await createNotification({
            userId: tractorData.owner,
            role: 'owner',
            type: 'booking',
            title: 'New Booking Request',
            message: `A farmer has requested to rent ${tractorData.brand || 'this tractor'} from ${start.toDateString()} to ${end.toDateString()}.`,
            metadata: { bookingId: booking._id.toString() },
        });

        return res.status(201).json({ success: true, message: 'Booking request created successfully and is pending owner approval.', booking });
    } catch (error) {
        console.error("createBooking error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// API to List User Bookings
export const getUserBookings = async (req, res) => {
    try {
        const { _id } = req.user;
        const bookings = await Booking.find({ user: _id })
            .populate('tractor')
            .populate({ path: 'owner', select: 'name email image' })
            .sort({ createdAt: -1 });
        return res.json({ success: true, bookings });
    } catch (error) {
        console.error("getUserBookings error:", error.message);
        return res.json({ success: false, message: error.message });
    }
};

// API To Get Owner Bookings
export const getOwnerBookings = async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.json({ success: false, message: 'Access denied. Owner account required.' });
        }
        const bookings = await Booking.find({ owner: req.user._id })
            .populate('tractor')
            .populate({ path: 'user', select: '-password' })
            .sort({ createdAt: -1 });
        return res.json({ success: true, bookings });
    } catch (error) {
        console.error("getOwnerBookings error:", error.message);
        return res.json({ success: false, message: error.message });
    }
};

// Update Booking Status
export const updateBookingStatus = async (req, res) => {
    try {
        const { _id } = req.user;
        const { bookingId, status } = req.body;

        if (!bookingId || !status) {
            return res.status(400).json({ success: false, message: 'Booking ID and new status are required' });
        }

        const normalizedStatus = String(status).toLowerCase();
        if (!VALID_BOOKING_STATUS.includes(normalizedStatus)) {
            return res.status(400).json({ success: false, message: 'Unsupported booking status' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const isOwner = booking.owner.toString() === _id.toString();
        const isRenter = booking.user.toString() === _id.toString();

        if (!isOwner && !isRenter) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (isRenter && normalizedStatus !== 'cancelled') {
            return res.status(403).json({ success: false, message: 'Renters can only cancel bookings.' });
        }

        if (isRenter && !['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: 'This booking can no longer be cancelled.' });
        }

        if (isOwner && booking.status !== 'pending' && !(['completed', 'cancelled'].includes(normalizedStatus) && booking.status === 'confirmed')) {
            return res.status(400).json({ success: false, message: 'This booking cannot be changed in its current state.' });
        }

        if (isOwner && booking.status === 'pending' && !['confirmed', 'rejected', 'cancelled'].includes(normalizedStatus)) {
            return res.status(400).json({ success: false, message: 'Pending requests can only be confirmed, rejected, or cancelled.' });
        }

        if (isOwner && normalizedStatus === 'cancelled' && !['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: 'This booking cannot be cancelled in its current state.' });
        }

        if (isOwner && normalizedStatus === 'confirmed') {
            const conflictingBooking = await Booking.findOne({
                _id: { $ne: booking._id },
                tractor: booking.tractor,
                status: 'confirmed',
                startDate: { $lt: booking.endDate },
                endDate: { $gt: booking.startDate },
            });
            if (conflictingBooking) {
                return res.status(409).json({ success: false, message: 'This tractor has another confirmed booking during those dates.' });
            }
        }

        if (normalizedStatus === 'cancelled') {
            booking.cancellationReason = String(req.body.reason || 'Cancelled by user request').trim();
            const refund = calculateCancellationRefund({
                totalAmount: booking.price,
                cancelledAt: new Date(),
                startDate: booking.startDate,
            });
            booking.refundInfo = {
                refundAmount: refund.refundAmount,
                refundRate: refund.refundRate,
                status: refund.status,
                daysRemaining: refund.daysRemaining,
            };
            booking.paymentStatus = refund.refundAmount > 0 ? 'refund_initiated' : 'not_required';
        }

        if (normalizedStatus === 'confirmed') {
            booking.paymentStatus = booking.paymentStatus === 'paid' ? 'paid' : 'pending';
        }

        booking.status = normalizedStatus;
        await booking.save();

        if (normalizedStatus === 'cancelled') {
            await createNotification({
                userId: booking.user,
                role: 'farmer',
                type: 'cancellation',
                title: 'Booking Cancelled',
                message: `Your booking has been cancelled. Refund processed: ₹${booking.refundInfo?.refundAmount || 0}.`,
                metadata: { bookingId: booking._id.toString() },
            });
        }

        return res.json({ success: true, message: `Booking marked as ${normalizedStatus}`, booking });
    } catch (error) {
        console.error("updateBookingStatus error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Release Escrow funds upon farmer field completion confirmation
export const releaseEscrow = async (req, res) => {
    try {
        const { _id } = req.user;
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, message: 'Booking ID is required' });
        }

        const booking = await Booking.findById(bookingId).populate('owner');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.user.toString() !== _id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only the renting farmer can verify work completion and release escrow.' });
        }

        booking.escrowStatus = 'released';
        booking.status = 'completed';
        booking.paymentStatus = 'escrow_released';
        await booking.save();

        await createNotification({
            userId: booking.owner?._id || booking.owner,
            role: 'owner',
            type: 'booking',
            title: 'Escrow Funds Released',
            message: `Farmer confirmed field completion for #${booking._id.toString().slice(-6)}. Escrow payout of ₹${booking.price} is now released to your account.`,
            metadata: { bookingId: booking._id.toString() }
        });

        return res.json({ success: true, message: 'Escrow funds successfully released to fleet partner!', booking });
    } catch (error) {
        console.error("releaseEscrow error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Emergency SOS Breakdown & Mechanic Dispatch
export const requestSosBreakdown = async (req, res) => {
    try {
        const { _id } = req.user;
        const { bookingId, tractorId, issueType, description, fieldLocation, contactPhone } = req.body;

        const complaint = await Complaint.create({
            user: _id,
            tractor: tractorId || null,
            subject: `🚨 FIELD SOS: ${issueType || 'Machinery Breakdown'}`,
            description: `${description || 'Urgent assistance requested'}\nField Location: ${fieldLocation || 'Current field'}\nContact: ${contactPhone || req.user.phone || 'Phone not provided'}`,
            type: 'breakdown_sos',
            priority: 'High',
            status: 'In Progress',
            notes: 'Emergency mobile rural mechanic dispatched from nearest district hub.'
        });

        return res.status(201).json({
            success: true,
            message: 'SOS Emergency assistance requested! Nearest mobile hub mechanic has been notified.',
            sosTicket: {
                id: complaint._id,
                status: 'In Progress',
                issueType: issueType || 'Breakdown',
                etaMinutes: 28,
                mechanicName: 'Ramesh Sharma (Senior CHC Technician)',
                mechanicPhone: '98765-43210',
                dispatchHub: fieldLocation || 'Regional Fleet Center'
            }
        });
    } catch (error) {
        console.error("requestSosBreakdown error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
