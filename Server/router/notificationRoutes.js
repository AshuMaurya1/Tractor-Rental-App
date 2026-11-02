import express from 'express';
import { protect } from '../Middlewere/auth.js';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';

const notificationRouter = express.Router();

notificationRouter.get('/', protect, getUserNotifications);
notificationRouter.patch('/:id/read', protect, markNotificationRead);
notificationRouter.patch('/read-all', protect, markAllNotificationsRead);

export default notificationRouter;
