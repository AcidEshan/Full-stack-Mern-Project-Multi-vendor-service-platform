import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'vendor', 'user'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  refreshTokens: [Object],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error: any) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createSuperAdmin(): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('     SUPER ADMIN SETUP SCRIPT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: process.env.DB_NAME || 'practicum_db',
    });
    
    console.log('✓ Connected to MongoDB');
    console.log(`✓ Database: ${process.env.DB_NAME || 'practicum_db'}\n`);
    
    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists!');
      console.log(`Email: ${existingSuperAdmin.email}`);
      console.log(`Created: ${existingSuperAdmin.createdAt}\n`);
      
      const overwrite = await question('Do you want to create a new Super Admin anyway? (yes/no): ');
      
      if (overwrite.toLowerCase() !== 'yes') {
        console.log('\nOperation cancelled.');
        process.exit(0);
      }
      console.log('');
    }
    
    // Get Super Admin details
    console.log('Enter Super Admin Details:\n');
    
    const email = await question(`Email (default: ${process.env.SUPER_ADMIN_EMAIL || 'superadmin@practicum.com'}): `) || process.env.SUPER_ADMIN_EMAIL || 'superadmin@practicum.com';
    const password = await question(`Password (default: ${process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123'}): `) || process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
    const firstName = await question('First Name (default: Super): ') || 'Super';
    const lastName = await question('Last Name (default: Admin): ') || 'Admin';
    const phone = await question(`Phone (default: ${process.env.SUPER_ADMIN_PHONE || '0000000000'}): `) || process.env.SUPER_ADMIN_PHONE || '0000000000';
    
    console.log('\nCreating Super Admin...');
    
    // Create Super Admin
    // Note: Password will be hashed by the User model's pre-save hook
    const superAdmin = new User({
      email: email.toLowerCase(),
      password: password, // Raw password - will be hashed by model
      role: 'super_admin',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      isActive: true,
      isBlocked: false,
      isEmailVerified: true,
      isApproved: true,
      failedLoginAttempts: 0,
      refreshTokens: []
    });
    
    await superAdmin.save();
    
    console.log('\n✓ Super Admin created successfully!');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('     SUPER ADMIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${superAdmin.email}`);
    console.log(`Password: ${password}`);
    console.log(`Name:     ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log(`Phone:    ${superAdmin.phone}`);
    console.log(`ID:       ${superAdmin._id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT: Please change this password after first login!\n');
    console.log('You can now login at: http://localhost:' + (process.env.PORT || 5000) + '/api/v1/auth/login\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n✗ Error creating Super Admin:', error.message);
    
    if (error.code === 11000) {
      console.error('✗ Email or phone number already exists in database');
    }
    
    process.exit(1);
  }
}

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\nOperation cancelled by user');
  process.exit(0);
});

// Run the script
createSuperAdmin();
