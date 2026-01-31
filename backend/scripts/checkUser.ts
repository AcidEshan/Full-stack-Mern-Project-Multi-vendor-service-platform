import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkUser() {
  try {
    console.log('MONGODB_URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
    console.log('DB_NAME:', process.env.DB_NAME);
    
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: process.env.DB_NAME || 'practicum_db'
    });
    
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({}).lean();
    console.log('Total users in database:', users.length);
    
    const superAdmin = await User.findOne({ email: 'superadmin@practicum.com' }).lean();
    console.log('Super admin exists:', !!superAdmin);
    
    if (superAdmin) {
      console.log('Super Admin Details:', {
        email: (superAdmin as any).email,
        role: (superAdmin as any).role,
        firstName: (superAdmin as any).firstName,
        isActive: (superAdmin as any).isActive,
        isEmailVerified: (superAdmin as any).isEmailVerified
      });
    } else {
      console.log('\nNo super admin found. Listing all users:');
      users.forEach((u: any) => {
        console.log(`- ${u.email} (${u.role})`);
      });
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
