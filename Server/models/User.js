import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    password: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'owner', 'admin'], default: 'farmer' },
    profileImage: { type: String, default: '' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    accountStatus: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String, default: '' },
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    suspendedAt: { type: Date, default: null },
    kycStatus: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
    tokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model("User", userSchema);

export default User;


