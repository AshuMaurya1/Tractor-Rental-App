import express from "express";
import {
  checkTractorAvailability,
  createBooking,
  getOwnerBookings,
  getUserBookings,
  updateBookingStatus,
  releaseEscrow,
  requestSosBreakdown
} from "../controllers/bookingController.js";
import protect, { authorizeRoles } from "../Middlewere/auth.js";

const bookingRouter = express.Router();

bookingRouter.post('/check-availability', checkTractorAvailability);
bookingRouter.post('/create', protect, authorizeRoles('farmer'), createBooking);
bookingRouter.get('/user', protect, authorizeRoles('farmer'), getUserBookings);
bookingRouter.get('/owner', protect, authorizeRoles('owner'), getOwnerBookings);
bookingRouter.post('/change-status', protect, authorizeRoles('farmer', 'owner'), updateBookingStatus);
bookingRouter.post('/release-escrow', protect, authorizeRoles('farmer', 'admin'), releaseEscrow);
bookingRouter.post('/sos-breakdown', protect, authorizeRoles('farmer'), requestSosBreakdown);

export default bookingRouter;
