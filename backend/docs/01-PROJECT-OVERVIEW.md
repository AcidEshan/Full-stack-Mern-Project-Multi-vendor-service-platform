# 01 - Project Overview

## What Is This Project?

**Practicum** is a **Multi-Vendor Service Management System** - think of it as a marketplace platform (like Fiverr, Upwork, or TaskRabbit) where:

1. **Users** can browse and book services
2. **Vendors** can offer their services and manage bookings
3. **Admins** can manage the entire platform

### Real-World Example:
Imagine you need a plumber. You visit this platform, search for plumbing services, see available plumbers (vendors), check their ratings, and book one. The plumber gets notified, accepts your booking, completes the job, and you pay through the platform.

---

## Main Features

### For Regular Users (Customers)
- 🔍 Browse and search services by category, location, price
- ⭐ View vendor ratings and reviews
- 📅 Book services with specific dates and times
- 💳 Make secure payments (SSLCommerz integration)
- 💬 Message vendors directly
- 📝 Leave reviews after service completion
- ❤️ Save favorite services
- 📊 Track order history and status

### For Vendors (Service Providers)
- 📋 Create and manage service listings
- 🔔 Receive booking notifications
- ✅ Accept or reject bookings
- 📍 Manage service orders (start, complete, cancel)
- 💰 Request payouts for completed work
- 💬 Communicate with customers
- 📈 View analytics and earnings
- ⭐ Respond to customer reviews

### For Admins
- 👥 Manage all users and vendors
- ✅ Approve or reject vendor applications
- 🔒 Block/unblock users
- ⚡ Activate/deactivate vendors
- 📊 View platform analytics
- 💸 Manage payouts to vendors
- 🏷️ Create and manage service categories
- 🎫 Create discount coupons
- 📧 Handle contact form submissions

---

## Technology Stack

### Backend Framework
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript

### Database
- **MongoDB** - NoSQL database
- **Mongoose** - ODM (Object Data Modeling) library
- **GridFS** - For storing large files (images, documents)

### Authentication & Security
- **JWT (JSON Web Tokens)** - For authentication
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **express-rate-limit** - API rate limiting
- **CORS** - Cross-Origin Resource Sharing

### Payment Integration
- **SSLCommerz** - Payment gateway (Bangladesh)
- **Stripe** - Alternative payment option

### File Handling
- **Multer** - File upload middleware
- **Sharp** - Image processing and optimization
- **GridFS** - MongoDB file storage

### Email & Notifications
- **Nodemailer** - Email sending
- **Email Templates** - Pre-designed email layouts

### Documentation
- **Swagger** - Interactive API documentation
- **swagger-ui-express** - Swagger UI interface

### Other Tools
- **PDFKit** - Generate PDF invoices and reports
- **Morgan** - HTTP request logger
- **Validator** - Data validation

---

## Project Architecture

### Architecture Pattern: MVC (Model-View-Controller)

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT                            │
│            (Frontend - Not in this repo)             │
└───────────────────┬─────────────────────────────────┘
                    │
                    │ HTTP Requests
                    ▼
┌─────────────────────────────────────────────────────┐
│                   SERVER.TS                          │
│              (Express Application)                   │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │          MIDDLEWARE LAYER                   │   │
│  │  • Authentication (JWT verification)        │   │
│  │  • Authorization (Role checking)            │   │
│  │  • Rate Limiting                            │   │
│  │  • Error Handling                           │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │            ROUTES LAYER                     │   │
│  │  • Auth Routes (/api/v1/auth)              │   │
│  │  • User Routes (/api/v1/users)             │   │
│  │  • Vendor Routes (/api/v1/vendors)         │   │
│  │  • Service Routes (/api/v1/services)       │   │
│  │  • Order Routes (/api/v1/orders)           │   │
│  │  • Payment Routes (/api/v1/payments)       │   │
│  │  • And more...                              │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │         CONTROLLERS LAYER                   │   │
│  │  • Business Logic                           │   │
│  │  • Request Validation                       │   │
│  │  • Response Formatting                      │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │           MODELS LAYER                      │   │
│  │  • Database Schemas                         │   │
│  │  • Data Validation                          │   │
│  │  • Mongoose Models                          │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │           UTILS LAYER                       │   │
│  │  • Email Service                            │   │
│  │  • Token Utils                              │   │
│  │  • File Helpers                             │   │
│  │  • Validators                               │   │
│  └────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Database Operations
                   ▼
┌─────────────────────────────────────────────────────┐
│                  MONGODB                             │
│                                                      │
│  • Users Collection                                  │
│  • Vendors Collection                                │
│  • Services Collection                               │
│  • Orders Collection                                 │
│  • Reviews Collection                                │
│  • Transactions Collection                           │
│  • Messages Collection                               │
│  • Notifications Collection                          │
│  • GridFS (Files Storage)                           │
└─────────────────────────────────────────────────────┘
```

### Request Flow Example: User Books a Service

```
1. User sends POST request to /api/v1/orders
                ↓
2. server.ts receives request
                ↓
3. Middleware checks:
   - Is JWT token valid? → authenticate.ts
   - Is user authorized? → authorize.ts
                ↓
4. Route directs to orderController.createOrder()
                ↓
5. Controller:
   - Validates request data
   - Checks if service exists
   - Checks if vendor is active
   - Calculates pricing
   - Creates order in database
   - Sends notification to vendor
                ↓
6. Response sent back to user
```

---

## Key Concepts

### 1. User Roles
```typescript
enum UserRole {
  USER = 'user',           // Regular customer
  VENDOR = 'vendor',       // Service provider
  ADMIN = 'admin',         // Platform admin
  SUPER_ADMIN = 'super_admin'  // System admin
}
```

### 2. Vendor Approval Status
```typescript
enum ApprovalStatus {
  PENDING = 'pending',     // Waiting for admin approval
  APPROVED = 'approved',   // Can create services
  REJECTED = 'rejected'    // Application denied
}
```

### 3. Vendor Active Status
```typescript
interface Vendor {
  isActive: boolean;  // false = deactivated by admin
}
```

### 4. Order Status Flow
```
PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
                 ↘
                  REJECTED or CANCELLED
```

### 5. Payment Status
```
PENDING → PROCESSING → COMPLETED
                   ↘
                    FAILED or REFUNDED
```

---

## API Versioning

All endpoints use version prefix:
```
/api/v1/...
```

Example: `http://localhost:5000/api/v1/auth/login`

This allows future versions (`v2`, `v3`) without breaking existing clients.

---

## Environment-Based Configuration

The application reads settings from `.env` file:

```env
NODE_ENV=development          # or production
PORT=5000                     # Server port
MONGODB_URI=mongodb://...     # Database connection
JWT_SECRET=secret_key         # Token signing
API_VERSION=v1               # API version
```

Different environments (dev, staging, prod) use different `.env` files.

---

## Database Design Philosophy

### Collections (Tables)

1. **Users** - Authentication and basic info
2. **Vendors** - Extended vendor profiles
3. **Services** - Service listings
4. **Orders** - Booking records
5. **Reviews** - Customer feedback
6. **Transactions** - Payment records
7. **Notifications** - In-app alerts
8. **Messages** - User-Vendor communication
9. **Categories** - Service categorization
10. **Coupons** - Discount codes
11. **Favorites** - User saved services
12. **Payouts** - Vendor payment requests
13. **Analytics** - Platform statistics

### Relationships

```
User (1) ←→ (1) Vendor
User (1) ←→ (N) Orders
User (1) ←→ (N) Reviews
User (1) ←→ (N) Messages
User (1) ←→ (N) Favorites

Vendor (1) ←→ (N) Services
Vendor (1) ←→ (N) Orders
Vendor (1) ←→ (N) Reviews (received)
Vendor (1) ←→ (N) Payouts

Service (1) ←→ (N) Orders
Service (1) ←→ (N) Reviews
Service (1) ←→ (N) Favorites

Order (1) ←→ (N) Transactions
Order (1) ←→ (1) Review (optional)

Category (1) ←→ (N) Services
```

---

## Core Workflows

### 1. User Registration & Login
```
Register → Email Verification (optional) → Login → Get JWT Token
```

### 2. Vendor Onboarding
```
Register as User → Apply as Vendor → Admin Reviews → 
Admin Approves → Vendor Creates Services
```

### 3. Service Booking
```
User Browses → Selects Service → Books → Makes Payment → 
Vendor Accepts → Service Completed → User Reviews
```

### 4. Vendor Earnings
```
Complete Order → Transaction Created → Request Payout → 
Admin Approves → Payment Processed
```

---

## Why TypeScript?

This project uses TypeScript instead of plain JavaScript because:

1. **Type Safety** - Catch errors before runtime
2. **Better IDE Support** - Autocomplete, refactoring
3. **Documentation** - Types serve as inline docs
4. **Scalability** - Easier to maintain large codebases

Example:
```typescript
// TypeScript catches this error at compile time
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "John",
  age: "thirty" // ❌ Error: Type 'string' not assignable to 'number'
};
```

---

## Development vs Production

### Development Mode
```bash
npm run dev
```
- Uses `ts-node` (no compilation needed)
- Hot reloading with nodemon
- Detailed error messages
- Logging enabled

### Production Mode
```bash
npm run build  # Compiles TS to JS
npm start      # Runs compiled JS
```
- Compiled JavaScript in `dist/` folder
- Optimized performance
- Minimal logging
- Error details hidden from users

---

## Next Steps

Now that you understand what this project is and how it's structured at a high level, continue to:

- **[02-GETTING-STARTED.md](02-GETTING-STARTED.md)** - Set up the project
- **[03-PROJECT-STRUCTURE.md](03-PROJECT-STRUCTURE.md)** - Understand the file organization
- **[04-DATABASE-MODELS.md](04-DATABASE-MODELS.md)** - Learn about data structures

---

## Quick Glossary

- **API** - Application Programming Interface (how frontend talks to backend)
- **REST** - Representational State Transfer (API design pattern)
- **CRUD** - Create, Read, Update, Delete operations
- **JWT** - JSON Web Token (authentication token)
- **Middleware** - Functions that run before route handlers
- **Schema** - Database table structure definition
- **Model** - JavaScript object representing database document
- **Controller** - Function handling business logic
- **Route** - URL endpoint that accepts requests
- **Endpoint** - Specific URL + HTTP method combination

