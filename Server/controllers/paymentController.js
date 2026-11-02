import crypto from 'crypto';
import Booking from '../models/Booking.js';
import { createNotification } from '../utils/notifications.js';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const buildRazorpayHeaders = () => ({
  Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
  'Content-Type': 'application/json',
});

export const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const finalAmount = Number(amount || booking.price || 0);
    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    if (!keyId || !keySecret) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.',
      });
    }

    const payload = {
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      receipt: `booking_${booking._id.toString()}`,
      notes: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
      },
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: buildRazorpayHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(400).json({ success: false, message: data.error?.description || 'Payment order creation failed.' });
    }

    booking.paymentDetails = {
      ...(booking.paymentDetails || {}),
      gateway: 'razorpay',
      orderId: data.id,
      amountPaid: 0,
      paymentStatus: 'pending',
      currency: data.currency || 'INR',
    };
    await booking.save();

    return res.json({
      success: true,
      order: {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        key: keyId,
      },
      booking,
    });
  } catch (error) {
    console.error('createPaymentOrder error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPaymentSignature = async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification payload is incomplete.' });
    }

    if (!keySecret) {
      return res.status(503).json({ success: false, message: 'Razorpay is not configured on the server.' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(razorpay_signature),
    );

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.paymentDetails = {
      ...(booking.paymentDetails || {}),
      gateway: 'razorpay',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      paymentStatus: isValid ? 'paid' : 'failed',
      amountPaid: isValid ? Number(booking.price || 0) : 0,
    };

    if (isValid) {
      booking.status = booking.status === 'pending' ? 'confirmed' : booking.status;
      await booking.save();

      await createNotification({
        userId: booking.user,
        role: 'farmer',
        type: 'payment',
        title: 'Payment Successful',
        message: 'Your tractor rental payment has been successfully received.',
        metadata: { bookingId: booking._id.toString() },
      });

      return res.json({ success: true, message: 'Payment verified successfully.', booking });
    }

    await booking.save();
    return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
  } catch (error) {
    console.error('verifyPaymentSignature error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
