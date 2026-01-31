import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Reset user password script
 * Usage: ts-node scripts/resetPassword.ts <email> <newPassword>
 */
async function resetPassword(email: string, newPassword: string) {
  try {
    // Connect to MongoDB (same way as server.ts)
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: process.env.DB_NAME || 'practicum_db'
    });
    console.log('✓ Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);

    // Find user by email (case insensitive)
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
    if (!user) {
      console.error('✗ User not found with email:', email);
      process.exit(1);
    }

    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Role: ${user.role}`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log('✓ Password updated successfully!');
    console.log(`New password: ${newPassword}`);
    console.log(`Password hash: ${hashedPassword}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error resetting password:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: ts-node scripts/resetPassword.ts <email> <newPassword>');
  console.error('Example: ts-node scripts/resetPassword.ts user@example.com newPassword123');
  process.exit(1);
}

resetPassword(email, newPassword);
