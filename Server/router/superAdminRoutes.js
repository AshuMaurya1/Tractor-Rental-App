import express from 'express';
import { protect, authorizeRoles } from '../Middlewere/auth.js';
import {
  getSuperAdminDashboard,
  getAllUsers,
  updateUserStatus,
  getAllOwners,
  updateOwnerStatus,
  getAllTractorsForAdmin,
  updateTractorStatus,
  getAllBookingsForAdmin,
  correctBookingStatus,
  getAnalytics,
  getComplaints,
  updateComplaintStatus,
  getActivityLogs,
  getPlatformSettings,
  updatePlatformSettings,
} from '../controllers/superAdminController.js';

const superAdminRouter = express.Router();

superAdminRouter.use(protect, authorizeRoles('superadmin'));

superAdminRouter.get('/dashboard', getSuperAdminDashboard);
superAdminRouter.get('/users', getAllUsers);
superAdminRouter.patch('/users/:id/status', updateUserStatus);

superAdminRouter.get('/owners', getAllOwners);
superAdminRouter.patch('/owners/:id/status', updateOwnerStatus);

superAdminRouter.get('/tractors', getAllTractorsForAdmin);
superAdminRouter.patch('/tractors/:id/status', updateTractorStatus);

superAdminRouter.get('/bookings', getAllBookingsForAdmin);
superAdminRouter.patch('/bookings/:id/correction', correctBookingStatus);

superAdminRouter.get('/analytics', getAnalytics);

superAdminRouter.get('/complaints', getComplaints);
superAdminRouter.patch('/complaints/:id', updateComplaintStatus);

superAdminRouter.get('/activity-logs', getActivityLogs);

superAdminRouter.get('/settings', getPlatformSettings);
superAdminRouter.patch('/settings', updatePlatformSettings);

export default superAdminRouter;
