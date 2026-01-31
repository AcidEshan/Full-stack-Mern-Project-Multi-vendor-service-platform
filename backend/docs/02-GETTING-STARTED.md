# 02 - Getting Started

## Prerequisites

Before you can run this project, you need to install the following software on your computer:

### 1. Node.js (v18 or higher)
**What is it?** JavaScript runtime that lets you run JavaScript on the server.

**Download:** https://nodejs.org/
- Choose the LTS (Long Term Support) version
- After installation, verify:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### 2. MongoDB (v6 or higher)
**What is it?** NoSQL database where all data is stored.

**Option A:** Local Installation
- Download: https://www.mongodb.com/try/download/community
- Install and start MongoDB service

**Option B:** MongoDB Atlas (Cloud - Recommended for beginners)
- Sign up: https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string

Verify MongoDB is running:
```bash
mongosh  # MongoDB shell should open
```

### 3. Git
**What is it?** Version control system.

**Download:** https://git-scm.com/

Verify:
```bash
git --version
```

### 4. Code Editor (Recommended: VS Code)
**Download:** https://code.visualstudio.com/

**Recommended VS Code Extensions:**
- ESLint
- Prettier
- Thunder Client (for API testing)
- MongoDB for VS Code

---

## Installation Steps

### Step 1: Clone or Download the Project

If using Git:
```bash
git clone <repository-url>
cd backend
```

Or download and extract the ZIP file, then navigate to the `backend` folder.

### Step 2: Install Dependencies

This downloads all required npm packages listed in `package.json`:

```bash
npm install
```

**What this installs:**
- Express.js - Web framework
- Mongoose - MongoDB driver
- bcrypt - Password hashing
- jsonwebtoken - JWT tokens
- And 30+ other packages

**⏱️ This may take 2-5 minutes**

### Step 3: Create Environment File

Create a file named `.env` in the root folder (where `server.ts` is):

```bash
# Copy the example env file
cp .env.example .env

# Or create manually
touch .env
```

---

## Environment Variables Explained

Open `.env` file and add these variables:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
PORT=5000
API_VERSION=v1

# ============================================
# DATABASE CONFIGURATION
# ============================================
# For Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/practicum

# For MongoDB Atlas (Cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/practicum

# ============================================
# JWT AUTHENTICATION
# ============================================
# Generate a random secret key for JWT signing
# Use a strong random string (32+ characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ============================================
# CORS (Cross-Origin Resource Sharing)
# ============================================
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# ============================================
# EMAIL CONFIGURATION (Nodemailer)
# ============================================
# Gmail Example:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@practicum.com

# For Gmail: Generate App Password at:
# https://myaccount.google.com/apppasswords

# ============================================
# PAYMENT GATEWAY (SSLCommerz)
# ============================================
# Sandbox (Testing):
SSLCOMMERZ_STORE_ID=your-store-id
SSLCOMMERZ_STORE_PASSWORD=your-store-password
SSLCOMMERZ_IS_LIVE=false

# Production:
# SSLCOMMERZ_IS_LIVE=true

# Success/Fail/Cancel URLs:
PAYMENT_SUCCESS_URL=http://localhost:3000/payment/success
PAYMENT_FAIL_URL=http://localhost:3000/payment/fail
PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel

# ============================================
# FILE UPLOAD CONFIGURATION
# ============================================
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=100    # max requests per window

# ============================================
# ADMIN CONFIGURATION
# ============================================
# Super admin credentials (for initial setup)
SUPER_ADMIN_EMAIL=admin@practicum.com
SUPER_ADMIN_PASSWORD=Admin@12345
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin

# ============================================
# OPTIONAL: Stripe (Alternative Payment)
# ============================================
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 📌 Important Notes on Environment Variables:

#### JWT_SECRET
- **Purpose:** Signs JWT tokens to prevent tampering
- **Generate a strong secret:**
```bash
# In terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### MongoDB URI
**Local:**
```
mongodb://localhost:27017/practicum
```

**MongoDB Atlas (Cloud):**
1. Go to MongoDB Atlas dashboard
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/practicum
```

#### Email Configuration (Gmail)
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Generate App Password
4. Use that password in `EMAIL_PASSWORD`

**⚠️ Don't use your regular Gmail password!**

#### SSLCommerz (Payment Gateway)
1. Sign up at https://developer.sslcommerz.com/registration/
2. Get Sandbox credentials from dashboard
3. Use `SSLCOMMERZ_IS_LIVE=false` for testing

---

## Database Setup

### Option 1: Automatic Setup

The database will be created automatically when you start the server. Mongoose will:
1. Connect to MongoDB
2. Create the database if it doesn't exist
3. Create collections as needed

### Option 2: Create Super Admin

After the server is running, create a super admin account:

```bash
npm run setup-super-admin
```

This script:
- Creates an admin user
- Creates a vendor profile for testing
- Sets up initial categories

**Default credentials:**
- Email: From `SUPER_ADMIN_EMAIL` in `.env`
- Password: From `SUPER_ADMIN_PASSWORD` in `.env`

---

## Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

**What happens:**
- Server starts on http://localhost:5000
- TypeScript files run directly (no compilation)
- Server restarts automatically when you save files
- Console shows detailed logs

**You should see:**
```
[nodemon] starting `ts-node server.ts`
🔌 Connected to MongoDB
🚀 Server is running on port 5000
📚 API Documentation: http://localhost:5000/api-docs
```

### Production Mode (compiled)

```bash
# 1. Compile TypeScript to JavaScript
npm run build

# 2. Run the compiled code
npm start
```

**What happens:**
- TypeScript compiles to JavaScript in `dist/` folder
- Server runs the compiled code
- Faster execution
- Use this for deployment

---

## Testing the Installation

### 1. Health Check

Open your browser or use curl:

```bash
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-24T10:30:00.000Z"
}
```

### 2. API Documentation

Open in browser:
```
http://localhost:5000/api-docs
```

You should see Swagger UI with all API endpoints listed.

### 3. Test Authentication

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "Test@1234",
    "phone": "+1234567890",
    "role": "user"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

## Common Issues & Solutions

### Issue 1: MongoDB Connection Failed

**Error:**
```
❌ MongoDB connection error: MongoServerError: connect ECONNREFUSED
```

**Solutions:**
1. Check if MongoDB is running:
```bash
# For local MongoDB:
sudo systemctl status mongod  # Linux
brew services list            # macOS
```

2. Verify `MONGODB_URI` in `.env`
3. For Atlas, check:
   - Network access (add your IP)
   - Database user credentials
   - Cluster is running

### Issue 2: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
```

Or change `PORT` in `.env` to `5001` or another available port.

### Issue 3: TypeScript Errors

**Error:**
```
TSError: Unable to compile TypeScript
```

**Solution:**
```bash
# Reinstall TypeScript
npm install -D typescript @types/node @types/express

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: Email Not Sending

**Possible causes:**
1. Wrong `EMAIL_PASSWORD` (use App Password for Gmail)
2. Email provider blocking
3. 2FA not enabled (Gmail requires it)

**Test:**
```bash
# Check if credentials work
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transport.verify().then(() => console.log('✅ Email config is correct'));
"
```

### Issue 5: Module Not Found

**Error:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
npm install  # Install all dependencies
```

---

## Project Scripts Reference

```bash
# Development
npm run dev           # Start with hot reload

# Production
npm run build         # Compile TypeScript
npm start             # Run compiled code

# Database
npm run setup-super-admin  # Create admin account

# Code Quality
npm run lint          # Check code style
npm test              # Run tests (if configured)
```

---

## Development Tools

### 1. Thunder Client (VS Code Extension)

**Install:** VS Code Extensions → Search "Thunder Client"

**Usage:**
1. Click Thunder Client icon in sidebar
2. Create new request
3. Set URL: `http://localhost:5000/api/v1/auth/login`
4. Set method: POST
5. Add body:
```json
{
  "email": "admin@practicum.com",
  "password": "Admin@12345"
}
```
6. Click Send

### 2. Postman (Alternative)

**Download:** https://www.postman.com/downloads/

**Import collection:**
1. Open Postman
2. Import → Link
3. Use: `http://localhost:5000/api-docs.json`

### 3. MongoDB Compass

**Download:** https://www.mongodb.com/products/compass

**Connect:**
1. Open Compass
2. Connection string: `mongodb://localhost:27017`
3. Click Connect
4. Browse `practicum` database

---

## Environment Files for Different Stages

### Development (`.env.development`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/practicum-dev
JWT_SECRET=dev-secret-key
```

### Testing (`.env.test`)
```env
NODE_ENV=test
PORT=5001
MONGODB_URI=mongodb://localhost:27017/practicum-test
JWT_SECRET=test-secret-key
```

### Production (`.env.production`)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/practicum
JWT_SECRET=<strong-production-secret>
```

**Usage:**
```bash
# Development
npm run dev

# Testing
NODE_ENV=test npm run dev

# Production
NODE_ENV=production npm start
```

---

## Next Steps

Now that your project is up and running:

1. ✅ Server is running on http://localhost:5000
2. ✅ Database is connected
3. ✅ API docs are accessible at `/api-docs`

Continue to:
- **[03-PROJECT-STRUCTURE.md](03-PROJECT-STRUCTURE.md)** - Understand the file organization
- **[08-ROUTES.md](08-ROUTES.md)** - See all available API endpoints
- **[05-AUTHENTICATION.md](05-AUTHENTICATION.md)** - Learn how to authenticate requests

---

## Quick Start Checklist

- [ ] Node.js installed (v18+)
- [ ] MongoDB installed and running
- [ ] Project dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Server starts without errors (`npm run dev`)
- [ ] Health check returns success (`/api/health`)
- [ ] API docs are accessible (`/api-docs`)
- [ ] Super admin account created
- [ ] Test API request works (login or register)

**If all boxes are checked, you're ready to develop! 🎉**
