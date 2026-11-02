import bcrypt from 'bcrypt';
import User from '../models/User.js';

export const ensureAdminExists = async () => {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.log('Admin seed skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not configured.');
      return;
    }

    const existing = await User.findOne({ email });

    if (existing) {
      const needsUpgrade = existing.role !== 'admin';
      const needsSuspensionReset = existing.accountStatus === 'Suspended';

      if (needsUpgrade || needsSuspensionReset) {
        existing.role = 'admin';
        existing.accountStatus = 'Active';
        existing.isActive = true;
        existing.isSuspended = false;
        existing.suspendedBy = null;
        existing.suspendedAt = null;
        await existing.save();
        console.log('Existing matching user promoted to admin role.');
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name: 'System Administrator',
      email,
      password: hashedPassword,
      role: 'admin',
      accountStatus: 'Active',
      isActive: true,
      isSuspended: false,
      image: '',
    });

    console.log('Admin account created successfully.');
  } catch (error) {
    console.error('Admin seed failed:', error.message);
  }
};
