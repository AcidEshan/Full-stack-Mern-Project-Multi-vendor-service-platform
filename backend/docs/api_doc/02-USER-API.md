# User API Documentation

> **User profile management, addresses, and admin user operations**

## 📋 Table of Contents

- [Overview](#overview)
- [User Self-Service Endpoints](#user-self-service-endpoints)
- [Address Management](#address-management)
- [Admin User Management](#admin-user-management)
- [Error Codes](#error-codes)

---

## Overview

The User API manages user profiles, addresses, and administrative user operations.

**Base Path**: `/api/v1/users`

---

## User Self-Service Endpoints

### 1. Get My Profile

Retrieve authenticated user's profile.

**Endpoint**: `GET /api/v1/users/me`  
**Access**: Authenticated (user, vendor)  
**Authentication**: Bearer Token required

#### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "user",
    "profilePicture": "https://gridfs.example.com/file/abc123",
    "isEmailVerified": true,
    "isApproved": true,
    "isBlocked": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:22:00.000Z"
  }
}
```

---

### 2. Update My Profile

Update authenticated user's profile information.

**Endpoint**: `PUT /api/v1/users/me`  
**Access**: Authenticated (user, vendor)  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "name": "John Updated Doe",
  "phone": "+1234567899",
  "bio": "Software developer and tech enthusiast"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Updated Doe",
    "email": "john@example.com",
    "phone": "+1234567899",
    "bio": "Software developer and tech enthusiast",
    "updatedAt": "2024-01-20T15:00:00.000Z"
  }
}
```

#### Notes

- Cannot update email directly (requires verification)
- Cannot update role
- Cannot update isBlocked or isApproved flags

---

### 3. Delete Profile Picture

Remove authenticated user's profile picture.

**Endpoint**: `DELETE /api/v1/users/me/profile-picture`  
**Access**: Authenticated (user, vendor)  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Profile picture deleted successfully"
}
```

---

## Address Management

### 4. Get My Addresses

Retrieve all addresses for authenticated user.

**Endpoint**: `GET /api/v1/users/addresses`  
**Access**: Authenticated (user only)  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "label": "Home",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "isDefault": true,
      "createdAt": "2024-01-15T11:00:00.000Z"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "label": "Office",
      "street": "456 Business Ave",
      "city": "New York",
      "state": "NY",
      "postalCode": "10002",
      "country": "USA",
      "isDefault": false,
      "createdAt": "2024-01-16T09:30:00.000Z"
    }
  ]
}
```

---

### 5. Add Address

Add new address for authenticated user.

**Endpoint**: `POST /api/v1/users/addresses`  
**Access**: Authenticated (user only)  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "label": "Home",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "isDefault": true
}
```

#### Response (Success - 201)

```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "label": "Home",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "isDefault": true,
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Notes

- If `isDefault: true`, all other addresses set to non-default
- Latitude/longitude optional but recommended for location services

---

### 6. Update Address

Update existing address.

**Endpoint**: `PUT /api/v1/users/addresses/:addressId`  
**Access**: Authenticated (user only)  
**Authentication**: Bearer Token required

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `addressId` | string | Address ID to update |

#### Request Body

```json
{
  "label": "Updated Home",
  "street": "789 New St",
  "isDefault": true
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "label": "Updated Home",
    "street": "789 New St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "isDefault": true,
    "updatedAt": "2024-01-20T15:30:00.000Z"
  }
}
```

---

### 7. Delete Address

Delete an address.

**Endpoint**: `DELETE /api/v1/users/addresses/:addressId`  
**Access**: Authenticated (user only)  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

## Admin User Management

### 8. Get All Users (Admin)

Retrieve all users with pagination and filtering.

**Endpoint**: `GET /api/v1/users`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `role` | string | - | Filter by role (user/vendor/admin) |
| `isBlocked` | boolean | - | Filter by blocked status |
| `search` | string | - | Search by name or email |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "user",
      "isEmailVerified": true,
      "isBlocked": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 48,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 9. Get User by ID (Admin)

Get specific user details.

**Endpoint**: `GET /api/v1/users/:userId`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "user",
    "profilePicture": "https://gridfs.example.com/file/abc123",
    "isEmailVerified": true,
    "isApproved": true,
    "isBlocked": false,
    "addresses": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "label": "Home",
        "street": "123 Main St",
        "city": "New York",
        "isDefault": true
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 10. Update User (Admin)

Update user information.

**Endpoint**: `PUT /api/v1/users/:userId`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "name": "Updated Name",
  "phone": "+9876543210",
  "isApproved": true
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Updated Name",
    "phone": "+9876543210",
    "isApproved": true
  }
}
```

---

### 11. Delete User (Admin)

Delete user account permanently.

**Endpoint**: `DELETE /api/v1/users/:userId`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### Notes

- Permanently deletes user and associated data
- Cannot be undone
- Deletes: orders, reviews, messages, favorites

---

### 12. Block/Unblock User (Admin)

Toggle user blocked status.

**Endpoint**: `PATCH /api/v1/users/:userId/block`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "isBlocked": true,
  "reason": "Violated terms of service"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "isBlocked": true,
    "blockedReason": "Violated terms of service",
    "blockedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

#### Notes

- Blocked users cannot login
- Blocked users' active sessions invalidated
- Reason field optional but recommended

---

## Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `USER_NOT_FOUND` | 404 | User does not exist |
| `ADDRESS_NOT_FOUND` | 404 | Address does not exist |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `ADDRESS_LIMIT_EXCEEDED` | 400 | Maximum 5 addresses per user |

---

**Related Documentation**:
- [Authentication API](./01-AUTHENTICATION-API.md)
- [Vendor API](./03-VENDOR-API.md)
- [API Index](./00-API-INDEX.md)

**Last Updated**: January 2025
