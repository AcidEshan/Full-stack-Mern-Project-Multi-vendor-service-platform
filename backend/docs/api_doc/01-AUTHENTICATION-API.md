# Authentication API Documentation

> **User registration, login, password management, and token handling**

## 📋 Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [Register](#1-register)
  - [Login](#2-login)
  - [Logout](#3-logout)
  - [Refresh Token](#4-refresh-token)
  - [Forgot Password](#5-forgot-password)
  - [Reset Password](#6-reset-password)
  - [Verify Email](#7-verify-email)
  - [Resend Verification Email](#8-resend-verification-email)
- [Authentication Flow](#authentication-flow)
- [Token Management](#token-management)
- [Error Codes](#error-codes)

---

## Overview

The Authentication API handles user/vendor registration, login, logout, password recovery, and email verification. All authentication endpoints use JWT (JSON Web Tokens) for secure session management.

**Base Path**: `/api/v1/auth`

**Rate Limiting**: 
- Registration: 5 requests per 15 minutes
- Login: 5 requests per 15 minutes
- Forgot Password: 3 requests per 15 minutes

---

## Endpoints

### 1. Register

Create a new user or vendor account.

**Endpoint**: `POST /api/v1/auth/register`  
**Access**: Public  
**Rate Limit**: 5 requests/15 minutes

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "role": "user",
  "businessName": "John's Services",
  "businessAddress": "123 Main St, City, State 12345",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Min 8 chars (uppercase, lowercase, number, special char) |
| `phone` | string | Yes | Phone number with country code |
| `role` | string | Yes | Either `user` or `vendor` |
| `businessName` | string | Vendor only | Business name (required for vendors) |
| `businessAddress` | string | Vendor only | Business address (required for vendors) |
| `latitude` | number | Optional | Business location latitude |
| `longitude` | number | Optional | Business location longitude |

#### Response (Success - 201)

```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "user",
      "isEmailVerified": false,
      "isApproved": true,
      "isBlocked": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### Response (Error - 400)

```json
{
  "success": false,
  "message": "User with this email already exists",
  "error": "EMAIL_ALREADY_EXISTS"
}
```

#### Notes

- **Vendors**: Require approval before accessing full features (isApproved: false initially)
- **Users**: Approved automatically (isApproved: true)
- Email verification email sent automatically
- Access token valid for 15 minutes
- Refresh token valid for 7 days

---

### 2. Login

Authenticate user and receive access/refresh tokens.

**Endpoint**: `POST /api/v1/auth/login`  
**Access**: Public  
**Rate Limit**: 5 requests/15 minutes

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered email address |
| `password` | string | Yes | Account password |

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "user",
      "isEmailVerified": true,
      "isApproved": true,
      "isBlocked": false,
      "profilePicture": "https://gridfs.example.com/file/abc123"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### Response (Error - 401)

```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": "INVALID_CREDENTIALS"
}
```

#### Response (Error - 403 - Blocked User)

```json
{
  "success": false,
  "message": "Your account has been blocked. Please contact support.",
  "error": "USER_BLOCKED"
}
```

#### Response (Error - 403 - Deactivated Vendor)

```json
{
  "success": false,
  "message": "Your vendor account has been deactivated. Please contact support.",
  "error": "VENDOR_DEACTIVATED"
}
```

#### Notes

- **Blocked users** cannot login
- **Deactivated vendors** cannot login
- **Unapproved vendors** can login but have limited access
- Password is hashed and compared securely
- Failed login attempts are logged for security

---

### 3. Logout

Invalidate current refresh token.

**Endpoint**: `POST /api/v1/auth/logout`  
**Access**: Authenticated (any role)  
**Authentication**: Bearer Token required

#### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Notes

- Adds refresh token to blacklist
- Access token remains valid until expiration (15 minutes)
- User should clear tokens from client storage

---

### 4. Refresh Token

Obtain new access token using refresh token.

**Endpoint**: `POST /api/v1/auth/refresh`  
**Access**: Public (requires valid refresh token)

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Response (Error - 401)

```json
{
  "success": false,
  "message": "Invalid or expired refresh token",
  "error": "INVALID_REFRESH_TOKEN"
}
```

#### Notes

- Issues new access token and refresh token
- Old refresh token is blacklisted
- Refresh tokens have 7-day validity

---

### 5. Forgot Password

Request password reset email.

**Endpoint**: `POST /api/v1/auth/forgot-password`  
**Access**: Public  
**Rate Limit**: 3 requests/15 minutes

#### Request Body

```json
{
  "email": "john@example.com"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Password reset email sent. Please check your inbox."
}
```

#### Notes

- Sends email with reset token (valid for 1 hour)
- Always returns success even if email doesn't exist (security measure)
- Reset token format: 6-digit code or UUID

---

### 6. Reset Password

Reset password using token from email.

**Endpoint**: `POST /api/v1/auth/reset-password`  
**Access**: Public

#### Request Body

```json
{
  "email": "john@example.com",
  "resetToken": "123456",
  "newPassword": "NewSecurePass123!"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address |
| `resetToken` | string | Yes | Token from email |
| `newPassword` | string | Yes | New password (min 8 chars, strong) |

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

#### Response (Error - 400)

```json
{
  "success": false,
  "message": "Invalid or expired reset token",
  "error": "INVALID_RESET_TOKEN"
}
```

---

### 7. Verify Email

Verify email address using token from email.

**Endpoint**: `GET /api/v1/auth/verify-email/:token`  
**Access**: Public

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | string | Verification token from email |

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Response (Error - 400)

```json
{
  "success": false,
  "message": "Invalid or expired verification token",
  "error": "INVALID_VERIFICATION_TOKEN"
}
```

---

### 8. Resend Verification Email

Request new email verification link.

**Endpoint**: `POST /api/v1/auth/resend-verification`  
**Access**: Authenticated (unverified users)  
**Authentication**: Bearer Token required

#### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox."
}
```

#### Notes

- Can only be called once per 5 minutes per user
- New token generated and old one invalidated

---

## Authentication Flow

### Registration Flow

```
User → POST /register → Email Sent → Verify Email → Account Active
```

### Login Flow

```
User → POST /login → Validate Credentials → Check Status → Return Tokens
```

### Token Refresh Flow

```
Client → POST /refresh → Validate Refresh Token → Return New Tokens
```

### Password Reset Flow

```
User → POST /forgot-password → Email Sent → POST /reset-password → Password Updated
```

---

## Token Management

### Access Token

- **Lifetime**: 15 minutes
- **Storage**: Memory or secure HTTP-only cookie
- **Usage**: Include in Authorization header: `Bearer <token>`
- **Contains**: userId, role, email

### Refresh Token

- **Lifetime**: 7 days
- **Storage**: Secure HTTP-only cookie (recommended) or secure storage
- **Usage**: Used only for `/refresh` endpoint
- **Contains**: userId, tokenVersion

### Token Structure (JWT)

```json
{
  "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "email": "john@example.com",
  "role": "user",
  "iat": 1705318200,
  "exp": 1705319100
}
```

---

## Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `EMAIL_ALREADY_EXISTS` | 400 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `USER_BLOCKED` | 403 | Account is blocked |
| `VENDOR_DEACTIVATED` | 403 | Vendor account deactivated |
| `VENDOR_NOT_APPROVED` | 403 | Vendor pending approval |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalid or expired |
| `INVALID_RESET_TOKEN` | 400 | Password reset token invalid |
| `INVALID_VERIFICATION_TOKEN` | 400 | Email verification token invalid |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Request validation failed |

---

## Security Considerations

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

### Rate Limiting

Protected endpoints to prevent abuse:
- Login: 5 attempts per 15 minutes
- Registration: 5 attempts per 15 minutes
- Password reset: 3 attempts per 15 minutes

### Token Security

- Tokens signed with HS256 algorithm
- Secret key stored in environment variables
- Refresh tokens can be revoked
- Access tokens short-lived (15 minutes)

### Password Storage

- Passwords hashed using bcrypt
- Salt rounds: 10
- Never stored in plain text
- Hashing performed server-side only

---

## Code Examples

### JavaScript/TypeScript (Fetch)

```javascript
// Register
const register = async (userData) => {
  const response = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('accessToken', data.data.tokens.accessToken);
  localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
  
  return data;
};

// Authenticated Request
const getProfile = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch('http://localhost:5000/api/v1/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Refresh Token
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch('http://localhost:5000/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const data = await response.json();
  
  // Update tokens
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
  
  return data;
};
```

---

**Related Documentation**:
- [User API](./02-USER-API.md)
- [Vendor API](./03-VENDOR-API.md)
- [API Index](./00-API-INDEX.md)

**Last Updated**: January 2025
