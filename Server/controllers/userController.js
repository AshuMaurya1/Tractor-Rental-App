import User from '../models/User.js'
import Tractor from '../models/tractor.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const normalizeRole = (role) => {
    const value = String(role || '').toLowerCase();
    if (['user', 'customer'].includes(value)) return 'farmer';
    return value || 'farmer';
}

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const generateToken = (userId, role, tokenVersion = 0) =>
    jwt.sign({ userId, role: normalizeRole(role), tokenVersion }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, confirmPassword, role } = req.body;
        const safeRole = normalizeRole(role);

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        if (!['farmer', 'owner'].includes(safeRole)) {
            return res.status(400).json({ success: false, message: 'Public registration is only allowed for farmer or owner accounts.' });
        }

        if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
            return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit phone number.' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase(),
            phone: phone.trim(),
            password: hashedPassword,
            role: safeRole,
            isActive: true,
            accountStatus: 'Active',
            tokenVersion: 0,
        });

        const token = generateToken(user._id.toString(), user.role, user.tokenVersion || 0);
        return res.status(201).json({ success: true, token, user: { ...user.toJSON(), role: normalizeRole(user.role) } });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Global User Suspension check at Login
        if (user.isSuspended || user.accountStatus === 'Suspended' || user.isActive === false) {
            const reasonMsg = user.suspensionReason ? `: ${user.suspensionReason}` : '. Please contact platform support.';
            return res.status(403).json({
                success: false,
                isSuspended: true,
                accountStatus: 'Suspended',
                suspensionReason: user.suspensionReason || '',
                message: `Your account has been suspended by the administrator${reasonMsg}`,
            });
        }

        const token = generateToken(user._id.toString(), user.role, user.tokenVersion || 0);
        return res.json({ success: true, token, user: { ...user.toJSON(), role: normalizeRole(user.role) } });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'Unable to log in. Please try again.' });
    }
}

export const getUserData = async (req, res)=>{
    try{
        const {user} = req;
        res.json({success: true, user: { ...user.toJSON(), role: normalizeRole(user.role) }})
    } catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

export const getAllTractors = async (req, res) => {
    try {
        // Exclude tractors whose owner is suspended or inactive
        const activeOwners = await User.find({
            isSuspended: { $ne: true },
            accountStatus: { $ne: 'Suspended' },
            isActive: { $ne: false }
        }).select('_id');
        const activeOwnerIds = activeOwners.map((u) => u._id);

        const filter = {
            isAvailable: true,
            status: 'approved',
            owner: { $in: activeOwnerIds }
        };

        const { state, district, block, location } = req.query;
        if (state && state.trim()) {
            const stateRegex = new RegExp(state.trim(), 'i');
            filter.$or = [{ state: stateRegex }, { stateName: stateRegex }];
        }
        if (district && district.trim()) {
            const distRegex = new RegExp(district.trim(), 'i');
            filter.$and = filter.$and || [];
            filter.$and.push({ $or: [{ district: distRegex }, { districtName: distRegex }] });
        }
        if (block && block.trim()) {
            const blkRegex = new RegExp(block.trim(), 'i');
            filter.$and = filter.$and || [];
            filter.$and.push({ $or: [{ block: blkRegex }, { blockName: blkRegex }] });
        }
        if (location && location.trim()) {
            const locRegex = new RegExp(location.trim(), 'i');
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { location: locRegex },
                    { stateName: locRegex },
                    { districtName: locRegex },
                    { blockName: locRegex },
                    { villageName: locRegex }
                ]
            });
        }

        const tractors = await Tractor.find(filter)
            .populate('owner', 'name email phone image accountStatus isSuspended')
            .sort({ createdAt: -1 });
        return res.json({ success: true, tractors });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
}

export const getTractors = async(req, res) => {
    return getAllTractors(req, res);
}

export const getTractorById = async (req, res) => {
    try {
        const { id } = req.params;
        const tractor = await Tractor.findById(id).populate('owner', 'name email phone image accountStatus isSuspended');
        if (!tractor) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        if (tractor.owner?.isSuspended || tractor.owner?.accountStatus === 'Suspended') {
            return res.status(403).json({ success: false, isSuspendedOwner: true, message: 'This equipment belongs to an inactive owner and is unavailable for booking.' });
        }
        return res.json({ success: true, tractor });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const updateUserProfile = async (req, res) => {
    try {
        const { _id } = req.user;
        const { name, phone } = req.body;
        const updateData = {};
        if (name && name.trim()) updateData.name = name.trim();
        if (phone && phone.trim()) updateData.phone = phone.trim();

        const updatedUser = await User.findByIdAndUpdate(_id, updateData, { new: true }).select('-password');
        return res.json({
            success: true,
            message: 'Profile updated successfully',
            user: { ...updatedUser.toJSON(), role: normalizeRole(updatedUser.role) },
        });
    } catch (error) {
        console.error('updateUserProfile error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
