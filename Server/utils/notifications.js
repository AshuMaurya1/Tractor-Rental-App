import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  role = 'farmer',
  type = 'system',
  title,
  message,
  metadata = {},
}) => {
  if (!userId || !title || !message) {
    return null;
  }

  const notification = await Notification.create({
    user: userId,
    role,
    type,
    title,
    message,
    metadata,
  });

  return notification;
};
