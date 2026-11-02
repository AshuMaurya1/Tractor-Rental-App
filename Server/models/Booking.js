import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const bookingSchema = new mongoose.Schema({
    tractor: { type: ObjectId, ref: "Tractor", required: true },
    user: { type: ObjectId, ref: "User", required: true },
    owner: { type: ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    bookingType: { type: String, enum: ['daily', 'weekly', 'monthly', 'seasonal', 'acreage', 'hourly'], default: 'daily' },
    billingModel: { type: String, enum: ['daily', 'acreage', 'hourly'], default: 'daily' },
    acreageCount: { type: Number, default: 0 },
    engineHours: { type: Number, default: 0 },
    insuranceIncluded: { type: Boolean, default: false },
    insuranceAmount: { type: Number, default: 0 },
    escrowStatus: { type: String, enum: ['held', 'released', 'refunded'], default: 'held' },
    isChcCertified: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'], default: 'pending' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'partial', 'failed', 'refunded', 'refund_initiated', 'in_escrow', 'escrow_released'], default: 'pending' },
    price: { type: Number, required: true },
    includeDriver: { type: Boolean, default: false },
    implements: [{ type: String }],
    deliveryOption: { type: String, enum: ['self_pickup', 'owner_delivery', 'pickup_return_service'], default: 'self_pickup' },
    cancellationReason: { type: String, default: '' },
    refundInfo: {
        refundAmount: { type: Number, default: 0 },
        refundRate: { type: Number, default: 0 },
        status: { type: String, default: 'no_refund' },
        daysRemaining: { type: Number, default: 0 },
    },
    paymentDetails: { type: Object, default: {} },
    invoiceNumber: { type: String, default: '' },
    ownerSuspended: { type: Boolean, default: false },
    adminReviewRequired: { type: Boolean, default: false },
    adminReviewNote: { type: String, default: '' },
}, { timestamps: true });

bookingSchema.index({ tractor: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
