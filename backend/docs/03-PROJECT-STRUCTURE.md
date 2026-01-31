# 03 - Project Structure

## Complete Folder Structure

```
backend/
├── config/                    # Configuration files
│   └── swagger.ts            # API documentation setup
│
├── controllers/               # Business logic (Request handlers)
│   ├── adminToolsController.ts
│   ├── analyticsController.ts
│   ├── authController.ts
│   ├── categoryController.ts
│   ├── contactController.ts
│   ├── couponController.ts
│   ├── favoriteController.ts
│   ├── invoiceController.ts
│   ├── messageController.ts
│   ├── notificationController.ts
│   ├── orderController.ts
│   ├── paymentController.ts
│   ├── payoutController.ts
│   ├── reviewController.ts
│   ├── serviceController.ts
│   ├── uploadController.ts
│   ├── userController.ts
│   └── vendorController.ts
│
├── middleware/                # Request interceptors
│   ├── authenticate.ts       # JWT verification
│   ├── authorize.ts          # Role-based access control
│   ├── errorHandler.ts       # Global error handler
│   └── rateLimiter.ts        # API rate limiting
│
├── models/                    # Database schemas
│   ├── Analytics.ts
│   ├── Category.ts
│   ├── Coupon.ts
│   ├── Favorite.ts
│   ├── Message.ts
│   ├── Notification.ts
│   ├── Order.ts
│   ├── Payout.ts
│   ├── Review.ts
│   ├── Service.ts
│   ├── Transaction.ts
│   ├── User.ts
│   └── Vendor.ts
│
├── routes/                    # API endpoints mapping
│   ├── adminToolsRoutes.ts
│   ├── analyticsRoutes.ts
│   ├── authRoutes.ts
│   ├── categoryRoutes.ts
│   ├── contactRoutes.ts
│   ├── couponRoutes.ts
│   ├── favoriteRoutes.ts
│   ├── invoiceRoutes.ts
│   ├── messageRoutes.ts
│   ├── notificationRoutes.ts
│   ├── orderRoutes.ts
│   ├── paymentRoutes.ts
│   ├── payoutRoutes.ts
│   ├── reviewRoutes.ts
│   ├── serviceRoutes.ts
│   ├── uploadRoutes.ts
│   ├── userRoutes.ts
│   └── vendorRoutes.ts
│
├── scripts/                   # Utility scripts
│   ├── checkUser.ts          # Check user in database
│   ├── createSuperAdmin.ts   # Setup admin account
│   ├── listUsers.ts          # List all users
│   └── resetPassword.ts      # Reset user password
│
├── utils/                     # Helper functions
│   ├── emailService.ts       # Send emails
│   ├── emailTemplates.ts     # Email HTML templates
│   ├── gridfsHelper.ts       # GridFS file storage
│   ├── imageOptimizer.ts     # Image processing
│   ├── invoiceGenerator.ts   # PDF invoice creation
│   ├── multerConfig.ts       # File upload config
│   ├── reportGenerator.ts    # PDF report creation
│   ├── systemHealth.ts       # System monitoring
│   ├── tokenUtils.ts         # JWT token functions
│   └── validators.ts         # Input validation
│
├── docs/                      # Documentation (this folder!)
│   ├── 00-README.md
│   ├── 01-PROJECT-OVERVIEW.md
│   └── ...
│
├── dist/                      # Compiled JavaScript (production)
│   └── (auto-generated)
│
├── node_modules/              # Dependencies (auto-generated)
│
├── .env                       # Environment variables
├── .gitignore                # Git ignore rules
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript configuration
└── server.ts                 # Application entry point
```

---

## Understanding Each Folder

### 📁 `config/`
**Purpose:** Configuration files for third-party services

#### `swagger.ts`
- Sets up Swagger API documentation
- Defines API metadata (title, version, description)
- Configures security schemes (JWT)
- Lists server URLs

**Example:**
```typescript
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Practicum API',
      version: '1.0.0',
      description: 'Multi-Vendor Service Management API'
    },
    servers: [{ url: 'http://localhost:5000' }]
  },
  apis: ['./routes/*.ts', './controllers/*.ts']
};
```

---

### 📁 `controllers/`
**Purpose:** Contains business logic for each feature

**What are controllers?**
- Handle incoming HTTP requests
- Validate input data
- Interact with database models
- Format and send responses
- Handle errors

**File naming:** `<feature>Controller.ts`

#### Example: `authController.ts`
Contains functions for:
- User registration
- Login
- Logout
- Token refresh
- Password reset
- Email verification

**Function structure:**
```typescript
export const login = async (req, res, next) => {
  try {
    // 1. Extract data from request
    const { email, password } = req.body;
    
    // 2. Validate input
    if (!email || !password) {
      return res.status(400).json({error: 'Missing fields'});
    }
    
    // 3. Business logic
    const user = await User.findOne({ email });
    const isValid = await user.comparePassword(password);
    
    // 4. Send response
    res.json({ success: true, token: '...' });
  } catch (error) {
    // 5. Error handling
    next(error);
  }
};
```

#### All Controllers Explained:

1. **authController.ts** - Authentication (register, login, password reset)
2. **userController.ts** - User profile management
3. **vendorController.ts** - Vendor profile and operations
4. **serviceController.ts** - Service CRUD operations
5. **categoryController.ts** - Service categories
6. **orderController.ts** - Booking/order management
7. **paymentController.ts** - Payment processing
8. **reviewController.ts** - Reviews and ratings
9. **messageController.ts** - User-Vendor messaging
10. **notificationController.ts** - In-app notifications
11. **favoriteController.ts** - Saved favorites
12. **couponController.ts** - Discount coupons
13. **payoutController.ts** - Vendor payment requests
14. **invoiceController.ts** - Invoice generation
15. **analyticsController.ts** - Analytics and reports
16. **adminToolsController.ts** - Admin operations
17. **contactController.ts** - Contact form
18. **uploadController.ts** - File uploads

---

### 📁 `middleware/`
**Purpose:** Functions that process requests before reaching controllers

**What is middleware?**
- Runs between receiving a request and sending a response
- Can modify request/response objects
- Can terminate the request cycle
- Used for cross-cutting concerns

```
Request → Middleware 1 → Middleware 2 → Controller → Response
```

#### `authenticate.ts`
**Purpose:** Verify JWT tokens and attach user to request

```typescript
// Before: req.user = undefined
authenticate(req, res, next);
// After: req.user = { _id, email, role, ... }
```

**Process:**
1. Extract token from `Authorization` header
2. Verify token signature
3. Check if token is expired
4. Find user in database
5. Check if user is blocked/inactive
6. Attach user to `req.user`

#### `authorize.ts`
**Purpose:** Check if user has permission for an action

```typescript
authorize(['admin', 'super_admin'])  // Only these roles allowed
```

**Example:**
```typescript
// Route
router.delete(
  '/users/:id',
  authenticate,                      // First: verify who you are
  authorize(['super_admin']),        // Then: check if you're allowed
  userController.deleteUser          // Finally: execute action
);
```

#### `errorHandler.ts`
**Purpose:** Catch all errors and format responses

**Handles:**
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

**Example:**
```typescript
// Instead of crashing, sends:
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "stack": "..." // Only in development
  }
}
```

#### `rateLimiter.ts`
**Purpose:** Prevent API abuse

```typescript
// Max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100
});
```

---

### 📁 `models/`
**Purpose:** Define database structure (schemas)

**What are models?**
- Define how data is stored in MongoDB
- Specify field types and validation rules
- Define relationships between collections
- Add methods for data manipulation

**File naming:** `<Model>.ts` (capitalized)

#### Model Structure:
```typescript
// 1. Define TypeScript interface
interface IUser extends Document {
  email: string;
  password: string;
  role: 'user' | 'vendor' | 'admin';
}

// 2. Define Mongoose schema
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false  // Don't include in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  }
}, { timestamps: true });  // Adds createdAt, updatedAt

// 3. Add methods
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// 4. Create and export model
export default mongoose.model<IUser>('User', userSchema);
```

#### All Models Explained:

1. **User.ts** - User accounts (authentication)
2. **Vendor.ts** - Vendor profiles (extended user data)
3. **Service.ts** - Service listings
4. **Category.ts** - Service categories
5. **Order.ts** - Bookings/orders
6. **Transaction.ts** - Payment records
7. **Review.ts** - Service reviews
8. **Message.ts** - Chat messages
9. **Notification.ts** - In-app notifications
10. **Favorite.ts** - Saved services/vendors
11. **Coupon.ts** - Discount codes
12. **Payout.ts** - Vendor payout requests
13. **Analytics.ts** - Platform statistics

---

### 📁 `routes/`
**Purpose:** Map URLs to controller functions

**What are routes?**
- Define API endpoints (URLs)
- Specify HTTP methods (GET, POST, PUT, DELETE)
- Apply middleware (authentication, authorization)
- Connect to controller functions

**File naming:** `<feature>Routes.ts`

#### Route Structure:
```typescript
import express from 'express';
import * as controller from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';

const router = express.Router();

//           URL           Middleware    Handler
router.post('/register',               controller.register);
router.post('/login',                  controller.login);
router.post('/logout',   authenticate, controller.logout);
router.get('/profile',   authenticate, controller.getProfile);

export default router;
```

#### HTTP Methods:
- **GET** - Retrieve data (read)
- **POST** - Create new data
- **PUT** - Update entire record
- **PATCH** - Update partial record
- **DELETE** - Remove data

#### Route Protection:
```typescript
// Public - anyone can access
router.get('/services', controller.getAllServices);

// Protected - must be logged in
router.get('/profile', authenticate, controller.getProfile);

// Role-based - must be admin
router.delete('/users/:id', 
  authenticate, 
  authorize(['admin']), 
  controller.deleteUser
);
```

---

### 📁 `scripts/`
**Purpose:** Command-line utilities for database operations

#### `createSuperAdmin.ts`
```bash
npm run setup-super-admin
```
Creates initial admin user for the platform.

#### `checkUser.ts`
```bash
ts-node scripts/checkUser.ts email@example.com
```
Checks if a user exists and shows their details.

#### `listUsers.ts`
```bash
ts-node scripts/listUsers.ts
```
Lists all users in the database.

#### `resetPassword.ts`
```bash
ts-node scripts/resetPassword.ts email@example.com newPassword123
```
Resets a user's password.

**When to use:**
- Setting up the database for the first time
- Debugging user issues
- Administrative tasks
- Database migrations

---

### 📁 `utils/`
**Purpose:** Reusable helper functions

#### `emailService.ts`
Sends emails using Nodemailer.

```typescript
export const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({ to, subject, html });
};
```

#### `emailTemplates.ts`
Pre-designed email templates.

```typescript
export const emailTemplates = {
  welcomeEmail: (userName) => ({
    subject: 'Welcome to Practicum!',
    html: `<h1>Hi ${userName}!</h1>...`
  }),
  orderConfirmation: (orderDetails) => ({...}),
  passwordReset: (resetLink) => ({...})
};
```

#### `tokenUtils.ts`
JWT token generation and verification.

```typescript
export const generateAccessToken = (userId, email, role) => {
  return jwt.sign({ sub: userId, email, role }, JWT_SECRET, {
    expiresIn: '15m'
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
```

#### `validators.ts`
Input validation functions.

```typescript
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isStrongPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
};
```

#### `gridfsHelper.ts`
Handles large file storage in MongoDB.

```typescript
export const uploadToGridFS = (file) => {...};
export const downloadFromGridFS = (fileId) => {...};
export const deleteFromGridFS = (fileId) => {...};
```

#### `imageOptimizer.ts`
Optimizes uploaded images using Sharp.

```typescript
export const optimizeImage = async (buffer) => {
  return await sharp(buffer)
    .resize(800, 800, { fit: 'inside' })
    .webp({ quality: 80 })
    .toBuffer();
};
```

#### `invoiceGenerator.ts`
Generates PDF invoices using PDFKit.

```typescript
export const generateInvoice = (orderData) => {
  const doc = new PDFDocument();
  doc.text(`Invoice #${orderData.id}`);
  // ... add more content
  return doc;
};
```

---

### 📄 Root Files

#### `server.ts`
**The heart of the application!**

```typescript
// 1. Import dependencies
import express from 'express';
import mongoose from 'mongoose';

// 2. Create Express app
const app = express();

// 3. Apply middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// 4. Connect to database
mongoose.connect(MONGODB_URI);

// 5. Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
// ...

// 6. Error handling
app.use(errorHandler);

// 7. Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### `package.json`
Project metadata and dependencies.

```json
{
  "name": "practicum-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec ts-node server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    // ...
  }
}
```

#### `tsconfig.json`
TypeScript compiler configuration.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true
  }
}
```

#### `.env`
Environment variables (secrets, configuration).

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/practicum
JWT_SECRET=secret-key
```

**⚠️ Never commit `.env` to Git!**

#### `.gitignore`
Files to exclude from version control.

```
node_modules/
dist/
.env
*.log
```

---

## File Naming Conventions

### Controllers
- `<feature>Controller.ts`
- Examples: `userController.ts`, `authController.ts`
- camelCase for file names
- Exported functions also in camelCase

### Models
- `<Model>.ts` (singular, capitalized)
- Examples: `User.ts`, `Service.ts`
- PascalCase for file names
- Exported model is PascalCase

### Routes
- `<feature>Routes.ts`
- Examples: `userRoutes.ts`, `authRoutes.ts`
- camelCase for file names

### Utilities
- `<utility>.ts`
- Examples: `emailService.ts`, `validators.ts`
- camelCase, descriptive names

---

## Import Patterns

### Relative imports (within project)
```typescript
import User from '../models/User';
import { authenticate } from '../middleware/authenticate';
import * as authController from '../controllers/authController';
```

### Package imports (from node_modules)
```typescript
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
```

---

## Code Flow Example: User Login

```
1. Client sends POST /api/v1/auth/login
          ↓
2. server.ts receives request
          ↓
3. authRoutes.ts matches route → POST /login
          ↓
4. No middleware (public route)
          ↓
5. authController.login() executed
          ↓
6. Controller:
   - Validates input
   - Queries User model
   - Compares password (uses bcrypt from User model)
   - Generates JWT (uses tokenUtils.ts)
   - Sends response
          ↓
7. Response sent back to client
```

---

## Next Steps

Now that you understand the project structure, dive deeper into:

- **[04-DATABASE-MODELS.md](04-DATABASE-MODELS.md)** - Learn about data models
- **[05-AUTHENTICATION.md](05-AUTHENTICATION.md)** - Understand auth flow
- **[07-CONTROLLERS.md](07-CONTROLLERS.md)** - See how business logic works

---

## Quick Reference

| Folder | Purpose | Example File |
|--------|---------|--------------|
| `config/` | Configuration | `swagger.ts` |
| `controllers/` | Business logic | `authController.ts` |
| `middleware/` | Request interceptors | `authenticate.ts` |
| `models/` | Database schemas | `User.ts` |
| `routes/` | API endpoints | `authRoutes.ts` |
| `scripts/` | CLI utilities | `createSuperAdmin.ts` |
| `utils/` | Helper functions | `emailService.ts` |
| `docs/` | Documentation | You are here! |
