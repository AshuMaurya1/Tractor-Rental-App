import mongoose from 'mongoose';
import path from 'path';
import jwt from 'jsonwebtoken';
import imagekit from "../config/imageKit.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Tractor from "../models/tractor.js";
import Location from "../models/Location.js";
import fs from 'fs';

export const changeRoleToOwner = async (req, res) => {
    try {
        const { _id } = req.user;
        const updatedUser = await User.findByIdAndUpdate(_id, { role: 'owner' }, { new: true }).select('-password');
        const token = jwt.sign(
            { userId: updatedUser._id.toString(), role: 'owner', tokenVersion: updatedUser.tokenVersion || 0 },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        return res.json({ success: true, message: 'You are now registered as a Tractor Fleet Partner!', token, user: updatedUser });
    } catch (error) {
        console.error("changeRoleToOwner error:", error.message);
        return res.json({ success: false, message: error.message });
    }
};

// API to list an agricultural equipment unit.
export const addTractor = async (req, res) => {
    const imageFiles = [...(req.files?.images || []), ...(req.files?.image || []), ...(req.file ? [req.file] : [])];
    const localFilesToKeep = new Set();
    try {
        if (req.user.isSuspended || req.user.accountStatus === 'Suspended') {
            return res.status(403).json({ success: false, message: 'Your account is suspended. You cannot add equipment.' });
        }
        const { _id } = req.user;
        let submittedData = {};
        try {
            if (typeof req.body.equipmentData === 'string') {
                submittedData = JSON.parse(req.body.equipmentData);
            } else if (typeof req.body.tractorData === 'string') {
                submittedData = JSON.parse(req.body.tractorData);
            } else if (req.body.equipmentData && typeof req.body.equipmentData === 'object') {
                submittedData = req.body.equipmentData;
            } else {
                submittedData = req.body || {};
            }
        } catch {
            submittedData = req.body || {};
        }

        const category = String(submittedData.category || '').trim();
        const type = String(submittedData.type || submittedData.customType || '').trim();
        const brand = String(submittedData.brand || '').trim();
        const model = String(submittedData.model || '').trim();
        const year = Number(submittedData.manufacturingYear ?? submittedData.year);
        const rentalPrice = Number(submittedData.rentalPrice ?? submittedData.pricePerDay ?? submittedData.price);

        if (!imageFiles.length) {
            return res.status(400).json({ success: false, message: 'At least one equipment photo is required.' });
        }
        if (imageFiles.length > 5) {
            return res.status(400).json({ success: false, message: 'You can upload a maximum of 5 photos.' });
        }
        if (!category) return res.status(400).json({ success: false, message: 'Equipment category is required.' });
        if (!type) return res.status(400).json({ success: false, message: 'Equipment type is required.' });
        if (!brand) return res.status(400).json({ success: false, message: 'Manufacturer or brand is required.' });
        if (!model) return res.status(400).json({ success: false, message: 'Model name is required.' });
        if (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear()) {
            return res.status(400).json({ success: false, message: `Manufacturing year must be between 1980 and ${new Date().getFullYear()}.` });
        }
        if (!Number.isFinite(rentalPrice) || rentalPrice <= 0) {
            return res.status(400).json({ success: false, message: 'Rental price must be a positive number greater than 0.' });
        }

        const stateName = String(submittedData.stateName || '').trim();
        const districtName = String(submittedData.districtName || '').trim();
        const blockName = String(submittedData.blockName || '').trim();
        const villageName = String(submittedData.villageName || '').trim();

        const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);

        let state = null;
        let district = null;
        let block = null;
        let village = null;

        if (isValidObjectId(submittedData.stateId)) {
            state = await Location.findOne({ _id: submittedData.stateId, level: 'state' });
        } else if (stateName) {
            state = await Location.findOne({ name: new RegExp(`^${stateName}$`, 'i'), level: 'state' });
        }

        if (isValidObjectId(submittedData.districtId)) {
            district = await Location.findOne({ _id: submittedData.districtId, level: 'district' });
        } else if (districtName) {
            district = await Location.findOne({ name: new RegExp(`^${districtName}$`, 'i'), level: 'district', ...(state ? { parentId: state._id } : {}) });
        }

        if (isValidObjectId(submittedData.blockId)) {
            block = await Location.findOne({ _id: submittedData.blockId, level: 'block' });
        } else if (blockName) {
            block = await Location.findOne({ name: new RegExp(`^${blockName}$`, 'i'), level: 'block', ...(district ? { parentId: district._id } : {}) });
        }

        if (isValidObjectId(submittedData.villageId)) {
            village = await Location.findOne({ _id: submittedData.villageId, level: 'village' });
        } else if (villageName) {
            village = await Location.findOne({ name: new RegExp(`^${villageName}$`, 'i'), level: 'village', ...(block ? { parentId: block._id } : {}) });
        }

        const finalStateName = state?.name || stateName;
        const finalDistrictName = district?.name || districtName;
        const finalBlockName = block?.name || blockName;
        const finalVillageName = village?.name || villageName;

        if (!finalStateName) return res.status(400).json({ success: false, message: 'State is required.' });
        if (!finalDistrictName) return res.status(400).json({ success: false, message: 'District is required.' });
        if (!finalBlockName && !finalVillageName) return res.status(400).json({ success: false, message: 'Block / Tehsil or Village is required.' });

        if (submittedData.pincode && !/^\d{6}$/.test(String(submittedData.pincode).trim())) {
            return res.status(400).json({ success: false, message: 'Pincode must contain exactly 6 digits.' });
        }

        const images = [];
        for (const imageFile of imageFiles) {
            let photoUrl = null;
            if (imagekit) {
                try {
                    const fileBuffer = fs.readFileSync(imageFile.path);
                    const response = await imagekit.upload({
                        file: fileBuffer.toString('base64'),
                        fileName: imageFile.originalname || `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`,
                        folder: '/equipment',
                    });
                    photoUrl = imagekit.url({
                        path: response.filePath,
                        transformation: [{ width: '1280' }, { quality: 'auto' }, { format: 'webp' }],
                    });
                } catch (ikErr) {
                    console.warn('ImageKit upload error, falling back to local file:', ikErr.message);
                }
            }

            if (!photoUrl) {
                const filename = path.basename(imageFile.path);
                photoUrl = `/uploads/${filename}`;
                localFilesToKeep.add(imageFile.path);
            }
            images.push(photoUrl);
        }

        const {
            stateId: _s,
            districtId: _d,
            blockId: _b,
            villageId: _v,
            ...cleanedData
        } = submittedData;

        const locationParts = [finalVillageName, finalBlockName, finalDistrictName, finalStateName].filter(Boolean);
        const locationString = locationParts.join(', ');

        const data = {
            ...cleanedData,
            owner: _id,
            ownerId: _id,
            category,
            type,
            customType: String(submittedData.customType || '').trim(),
            brand,
            model,
            year,
            manufacturingYear: year,
            rentalPrice,
            pricePerDay: rentalPrice,
            priceUnit: submittedData.priceUnit || 'Per Day',
            horsepower: submittedData.horsepower && Number(submittedData.horsepower) > 0 ? Number(submittedData.horsepower) : undefined,
            specification: String(submittedData.specification || '').trim(),
            operatorIncluded: Boolean(submittedData.operatorIncluded),
            fuelIncluded: Boolean(submittedData.fuelIncluded),
            description: String(submittedData.description || '').trim().slice(0, 500),
            seatingCapacity: Number(submittedData.seatingCapacity || 1),
            fuelType: String(submittedData.fuelType || ''),
            transmission: String(submittedData.transmission || ''),
            country: 'India',
            stateId: state?._id || undefined,
            districtId: district?._id || undefined,
            blockId: block?._id || undefined,
            villageId: village?._id || undefined,
            state: finalStateName,
            district: finalDistrictName,
            block: finalBlockName,
            village: finalVillageName,
            stateName: finalStateName,
            districtName: finalDistrictName,
            blockName: finalBlockName,
            villageName: finalVillageName,
            location: locationString,
            pincode: String(submittedData.pincode || '').trim(),
            address: String(submittedData.address || '').trim(),
            latitude: submittedData.latitude === '' || submittedData.latitude == null ? undefined : Number(submittedData.latitude),
            longitude: submittedData.longitude === '' || submittedData.longitude == null ? undefined : Number(submittedData.longitude),
            images,
            image: images[0] || '',
            status: 'pending',
            rejectionReason: '',
        };

        const tractor = await Tractor.create(data);
        return res.json({ success: true, message: 'Equipment submitted for admin verification.', tractor });
    } catch (error) {
        console.error('addTractor error:', error.message);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        imageFiles.forEach((file) => {
            if (!localFilesToKeep.has(file.path)) {
                try { fs.unlinkSync(file.path); } catch {}
            }
        });
    }
};

// API to List Owner's Tractors
export const getOwnerTractors = async (req, res) => {
    try {
        const { _id } = req.user;
        const tractors = await Tractor.find({ owner: _id }).sort({ createdAt: -1 });
        return res.json({ success: true, tractors });
    } catch (error) {
        console.error("getOwnerTractors error:", error.message);
        return res.json({ success: false, message: error.message });
    }
};

export const getAdminTractorQueue = async (req, res) => {
    try {
        const tractors = await Tractor.find({}).populate('owner', 'name email phone').sort({ createdAt: -1 });
        return res.json({ success: true, tractors });
    } catch (error) {
        console.error('getAdminTractorQueue error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const reviewTractor = async (req, res) => {
    try {
        const { tractorId } = req.params;
        const { status, rejectionReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(tractorId)) {
            return res.status(400).json({ success: false, message: 'Invalid tractor ID.' });
        }

        const normalizedStatus = String(status || '').toLowerCase();
        if (!['approved', 'rejected'].includes(normalizedStatus)) {
            return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
        }

        const tractor = await Tractor.findById(tractorId);
        if (!tractor) {
            return res.status(404).json({ success: false, message: 'Tractor not found.' });
        }


        tractor.status = normalizedStatus;
        tractor.rejectionReason = normalizedStatus === 'rejected' ? (rejectionReason || 'Submission did not meet platform requirements.') : '';
        tractor.verifiedBy = req.user._id;
        tractor.verifiedAt = new Date();
        await tractor.save();

        return res.json({
            success: true,
            message: `Tractor ${normalizedStatus} successfully.`,
            tractor,
        });
    } catch (error) {
        console.error('reviewTractor error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// API to Toggle Tractor Availability
export const toggleTractorAvailability = async (req, res) => {
    try {
        const { tractorId } = req.params;
        const { _id } = req.user;

        if (!tractorId || !mongoose.Types.ObjectId.isValid(tractorId)) {
            return res.status(400).json({ success: false, message: 'Invalid tractor ID' });
        }

        const tractorDoc = await Tractor.findOne({ owner: _id, _id: new mongoose.Types.ObjectId(tractorId) });

        if (!tractorDoc) {
            return res.status(404).json({ success: false, message: 'Tractor not found' });
        }

        tractorDoc.isAvailable = !tractorDoc.isAvailable;
        await tractorDoc.save();

        return res.json({ 
            success: true, 
            message: `Tractor marked as ${tractorDoc.isAvailable ? 'Available' : 'Busy'}`, 
            tractor: tractorDoc 
        });
    } catch (error) {
        console.error("toggleTractorAvailability error:", error.message);
        return res.json({ success: false, message: error.message });
    }
};

// API to Delete Tractor
export const deleteTractor = async (req, res) => {
    try {
        const { tractorId } = req.params;
        const { _id } = req.user;

        if (!tractorId || !mongoose.Types.ObjectId.isValid(tractorId)) {
            return res.status(400).json({ success: false, message: 'Invalid tractor ID' });
        }

        const tractorDoc = await Tractor.findOne({ owner: _id, _id: new mongoose.Types.ObjectId(tractorId) });

        if (!tractorDoc) {
            return res.status(404).json({ success: false, message: 'Tractor not found' });
        }

        await tractorDoc.deleteOne();

        return res.json({ success: true, message: 'Tractor removed from fleet successfully' });
    } catch (error) {
        console.error("deleteTractor error:", error.message);
        return res.json({ success: false, message: error.message });
    }
};

// API To get Dashboard Data
export const getDashboardData = async (req, res) => {
    try {
        const { _id, role } = req.user;

        if (role !== 'owner') {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const tractors = await Tractor.find({ owner: _id });
        const bookings = await Booking.find({ owner: _id })
            .populate('tractor')
            .populate({ path: 'user', select: 'name email phone' })
            .sort({ createdAt: -1 });

        const pendingBooking = bookings.filter(b => b.status === 'pending');
        const activeBookings = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
        const completedBooking = bookings.filter(b => b.status === 'completed');
        const rejectedBooking = bookings.filter(b => b.status === 'rejected');
        const availableTractors = tractors.filter(b => b.isAvailable).length;

        const totalEarnings = bookings
            .filter(b => b.status === 'completed' || (b.paymentDetails && Number(b.paymentDetails.amountPaid) > 0))
            .reduce((sum, b) => sum + (Number(b.paymentDetails?.amountPaid) || (b.status === 'completed' ? Number(b.price || 0) : 0)), 0);

        const dashboardData = {
            totalTractor: tractors.length,
            approvedTractors: tractors.filter(t => t.status === 'approved').length,
            pendingTractors: tractors.filter(t => t.status === 'pending').length,
            rejectedTractors: tractors.filter(t => t.status === 'rejected').length,
            availableTractors,
            totalBooking: bookings.length,
            activeBookings: activeBookings.length,
            pendingBooking: pendingBooking.length,
            confirmedBooking: bookings.filter(b => b.status === 'confirmed').length,
            completedBooking: completedBooking.length,
            rejectedBooking: rejectedBooking.length,
            totalEarnings,
            recentBooking: bookings.slice(0, 5),
        };

        return res.json({ success: true, dashboardData });

    } catch (error) {
        console.error("getDashboardData error:", error.message);
        return res.json({ success: false, message: error.message });
    }
};

// API to Update user image
export const updateUserImage = async (req, res) => {
    try {
        const { _id } = req.user;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ success: false, message: 'Image upload is required' });
        }

        const fileBuffer = fs.readFileSync(imageFile.path);
        const base64File = fileBuffer.toString('base64');
        const response = await imagekit.upload({
            file: base64File,
            fileName: imageFile.originalname,
            folder: '/users'
        });

        const optimizedImageUrl = imagekit.url({
            path: response.filePath,
            transformation: [
                { width: '400' },
                { quality: 'auto' },
                { format: 'webp' }
            ]
        });

        const image = optimizedImageUrl;
        const user = await User.findByIdAndUpdate(_id, { image }, { new: true }).select('-password');
        
        try { fs.unlinkSync(imageFile.path); } catch (e) {}
        
        return res.json({ success: true, message: 'User profile image updated successfully', image, user });
    } catch (error) {
        console.error("updateUserImage error:", error.message);
        return res.json({ success: false, message: error.message });
    }
};

// API to Update Tractor Details
export const updateTractor = async (req, res) => {
    try {
        const { tractorId } = req.params;
        const { _id } = req.user;
        const { location, description, isAvailable } = req.body;
        const pricePerDay = req.body.rentalPrice ?? req.body.pricePerDay;

        if (!tractorId || !mongoose.Types.ObjectId.isValid(tractorId)) {
            return res.status(400).json({ success: false, message: 'Invalid tractor ID' });
        }

        const tractor = await Tractor.findOne({ _id: tractorId, owner: _id });
        if (!tractor) {
            return res.status(404).json({ success: false, message: 'Tractor not found or unauthorized' });
        }

        if (pricePerDay !== undefined && !Number.isNaN(Number(pricePerDay))) {
            tractor.pricePerDay = Number(pricePerDay);
            tractor.rentalPrice = Number(pricePerDay);
        }
        if (location !== undefined && String(location).trim()) tractor.location = String(location).trim();
        if (description !== undefined && String(description).trim()) tractor.description = String(description).trim();
        if (isAvailable !== undefined) tractor.isAvailable = Boolean(isAvailable);

        await tractor.save();
        return res.json({ success: true, message: 'Tractor updated successfully', tractor });
    } catch (error) {
        console.error("updateTractor error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

