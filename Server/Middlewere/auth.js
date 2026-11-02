import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const normalizeRole = (role) => {
    const value = String(role || '').toLowerCase();
    if (['user', 'customer'].includes(value)) return 'farmer';
    if (value === 'superadmin') return 'admin';
    return value || 'farmer';
};

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No authorization header provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid token payload' });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found or deleted' });
        }

        const normalizedStoredRole = normalizeRole(user.role);
        const tokenRole = normalizeRole(decoded.role);

        if (tokenRole && tokenRole !== normalizedStoredRole) {
            if (tokenRole === 'admin' && normalizedStoredRole !== 'admin') {
                return res.status(403).json({ success: false, message: 'Token role does not match account role.' });
            }
        }

        user.role = normalizedStoredRole;

        // Global User Suspension Enforcement
        if (user.isSuspended || user.accountStatus === 'Suspended' || user.isActive === false) {
            const reasonMsg = user.suspensionReason ? `: ${user.suspensionReason}` : '. Please contact support.';
            return res.status(403).json({
                success: false,
                isSuspended: true,
                accountStatus: 'Suspended',
                suspensionReason: user.suspensionReason || '',
                message: `Your account has been suspended by the administrator${reasonMsg}`,
            });
        }

        // Invalidate active JWT sessions if tokenVersion was bumped
        const storedVersion = user.tokenVersion || 0;
        if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== storedVersion) {
            return res.status(403).json({
                success: false,
                isSuspended: true,
                sessionInvalidated: true,
                message: 'Your session has been invalidated due to an account security or status update. Please log in again.',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const normalizedUserRole = normalizeRole(req.user.role);
    const allowed = allowedRoles.map(normalizeRole);

    if (!allowed.includes(normalizedUserRole)) {
        return res.status(403).json({ success: false, message: 'You do not have access to this resource.' });
    }

    req.user.role = normalizedUserRole;
    next();
};

export const requireAdmin = (req, res, next) => {
    if (!req.user || normalizeRole(req.user.role) !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    next();
};

export const isAdmin = (req, res, next) => {
    if (!req.user || normalizeRole(req.user.role) !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    next();
};

export default protect;
