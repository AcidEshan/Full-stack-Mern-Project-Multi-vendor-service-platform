# Vendor API Documentation

> **Vendor profile management, working hours, vacation mode, verification, and admin approval**

## 📋 Table of Contents

- [Overview](#overview)
- [Public Vendor Endpoints](#public-vendor-endpoints)
- [Vendor Self-Service](#vendor-self-service)
- [Admin Vendor Management](#admin-vendor-management)

---

## Overview

**Base Path**: `/api/v1/vendors`

---

## Public Vendor Endpoints

### 1. Get All Vendors

Browse all active vendors with filtering and pagination.

**Endpoint**: `GET /api/v1/vendors`  
**Access**: Public

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `category` | string | - | Filter by category ID |
| `search` | string | - | Search by business name |
| `minRating` | number | - | Minimum rating (1-5) |
| `latitude` | number | - | User latitude (for distance sort) |
| `longitude` | number | - | User longitude (for distance sort) |
| `maxDistance` | number | - | Maximum distance in km |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "businessName": "John's Cleaning Services",
      "email": "john@cleaning.com",
      "phone": "+1234567890",
      "businessAddress": "123 Main St, New York, NY",
      "location": {
        "type": "Point",
        "coordinates": [-74.0060, 40.7128]
      },
      "rating": 4.8,
      "totalReviews": 125,
      "profilePicture": "https://gridfs.example.com/file/abc123",
      "isActive": true,
      "isOnVacation": false,
      "distance": 2.5
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 8,
    "totalItems": 78
  }
}
```

---

### 2. Get Vendor by ID

Get detailed vendor information.

**Endpoint**: `GET /api/v1/vendors/:vendorId`  
**Access**: Public

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "businessName": "John's Cleaning Services",
    "email": "john@cleaning.com",
    "phone": "+1234567890",
    "businessAddress": "123 Main St, New York, NY",
    "bio": "Professional cleaning services for 10+ years",
    "location": {
      "type": "Point",
      "coordinates": [-74.0060, 40.7128]
    },
    "rating": 4.8,
    "totalReviews": 125,
    "profilePicture": "https://gridfs.example.com/file/abc123",
    "coverImage": "https://gridfs.example.com/file/def456",
    "isActive": true,
    "isApproved": true,
    "isOnVacation": false,
    "workingHours": [
      {
        "day": "Monday",
        "isOpen": true,
        "openTime": "09:00",
        "closeTime": "18:00"
      }
    ],
    "documents": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "type": "business_license",
        "url": "https://gridfs.example.com/file/ghi789",
        "uploadedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Get Vendor Working Hours

Get vendor's working hours schedule.

**Endpoint**: `GET /api/v1/vendors/:vendorId/working-hours`  
**Access**: Public

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "vendorId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "businessName": "John's Cleaning Services",
    "isOnVacation": false,
    "workingHours": [
      {
        "day": "Monday",
        "isOpen": true,
        "openTime": "09:00",
        "closeTime": "18:00"
      },
      {
        "day": "Tuesday",
        "isOpen": true,
        "openTime": "09:00",
        "closeTime": "18:00"
      },
      {
        "day": "Sunday",
        "isOpen": false
      }
    ]
  }
}
```

---

## Vendor Self-Service

### 4. Get My Vendor Profile

Get authenticated vendor's profile.

**Endpoint**: `GET /api/v1/vendors/me`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "businessName": "John's Cleaning Services",
    "email": "john@cleaning.com",
    "isActive": true,
    "isApproved": true,
    "approvalStatus": "approved",
    "rating": 4.8,
    "totalOrders": 342,
    "completedOrders": 318,
    "totalEarnings": 45670.50
  }
}
```

---

### 5. Update Working Hours

Update vendor working hours.

**Endpoint**: `PUT /api/v1/vendors/working-hours`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "workingHours": [
    {
      "day": "Monday",
      "isOpen": true,
      "openTime": "09:00",
      "closeTime": "18:00"
    },
    {
      "day": "Sunday",
      "isOpen": false
    }
  ]
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Working hours updated successfully",
  "data": {
    "workingHours": [/* updated working hours */]
  }
}
```

---

### 6. Set Vacation Mode

Enable/disable vacation mode.

**Endpoint**: `POST /api/v1/vendors/vacation`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "isOnVacation": true,
  "vacationNote": "On vacation until Feb 15th"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Vacation mode updated",
  "data": {
    "isOnVacation": true,
    "vacationNote": "On vacation until Feb 15th"
  }
}
```

#### Notes

- While on vacation, vendor cannot receive new orders
- Existing orders remain active
- Services remain visible but marked as unavailable

---

### 7. Update Vendor Profile

Update vendor business information.

**Endpoint**: `PUT /api/v1/vendors/:vendorId`  
**Access**: Vendor (own profile)  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "businessName": "Updated Business Name",
  "businessAddress": "456 New St, New York, NY",
  "bio": "Updated bio",
  "phone": "+9876543210"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "businessName": "Updated Business Name",
    "businessAddress": "456 New St, New York, NY"
  }
}
```

---

### 8. Update Profile Picture/Cover

Update vendor profile picture.

**Endpoint**: `PATCH /api/v1/vendors/:vendorId/profile`  
**Access**: Vendor (own profile)  
**Authentication**: Bearer Token required  
**Content-Type**: multipart/form-data

#### Request Body (Form Data)

| Field | Type | Description |
|-------|------|-------------|
| `profilePicture` | file | Profile picture image |
| `coverImage` | file | Cover image |

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "profilePicture": "https://gridfs.example.com/file/new123"
  }
}
```

---

### 9. Upload Vendor Documents

Upload verification documents.

**Endpoint**: `POST /api/v1/vendors/:vendorId/documents`  
**Access**: Vendor (own profile)  
**Authentication**: Bearer Token required  
**Content-Type**: multipart/form-data

#### Request Body (Form Data)

| Field | Type | Description |
|-------|------|-------------|
| `document` | file | PDF or image file |
| `type` | string | Document type (business_license, tax_id, insurance, etc.) |

#### Response (Success - 201)

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "type": "business_license",
    "url": "https://gridfs.example.com/file/doc123",
    "uploadedAt": "2024-01-20T14:30:00.000Z"
  }
}
```

---

### 10. Delete Vendor Document

Delete uploaded document.

**Endpoint**: `DELETE /api/v1/vendors/:vendorId/documents/:documentId`  
**Access**: Vendor (own profile)  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## Admin Vendor Management

### 11. Get Pending Vendors

Get list of vendors awaiting approval.

**Endpoint**: `GET /api/v1/vendors/pending/list`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "businessName": "New Cleaning Service",
      "email": "new@cleaning.com",
      "businessAddress": "789 Pending St",
      "approvalStatus": "pending",
      "documents": [
        {
          "type": "business_license",
          "url": "https://gridfs.example.com/file/doc123"
        }
      ],
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

---

### 12. Approve Vendor

Approve pending vendor application.

**Endpoint**: `PATCH /api/v1/vendors/:vendorId/approve`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "approvalNote": "All documents verified"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Vendor approved successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "isApproved": true,
    "approvalStatus": "approved",
    "approvedAt": "2024-01-20T15:00:00.000Z"
  }
}
```

#### Notes

- Sends approval email to vendor
- Vendor can now fully access platform features

---

### 13. Reject Vendor

Reject vendor application.

**Endpoint**: `PATCH /api/v1/vendors/:vendorId/reject`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "rejectionReason": "Incomplete documentation"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Vendor application rejected",
  "data": {
    "approvalStatus": "rejected",
    "rejectionReason": "Incomplete documentation"
  }
}
```

---

### 14. Activate/Deactivate Vendor

Toggle vendor active status.

**Endpoint**: `PATCH /api/v1/vendors/:vendorId/status`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "isActive": false,
  "reason": "Policy violation"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Vendor deactivated successfully",
  "data": {
    "isActive": false,
    "deactivatedReason": "Policy violation",
    "deactivatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

#### Notes

- Deactivated vendors:
  - Cannot login
  - Services hidden from public view
  - Cannot accept new orders
  - Cannot request payouts
  - Existing orders remain active

---

### 15. Delete Vendor

Permanently delete vendor account.

**Endpoint**: `DELETE /api/v1/vendors/:vendorId`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Vendor deleted successfully"
}
```

#### Notes

- Permanently deletes vendor and all associated data
- Cannot be undone
- Deletes: services, orders history, payouts, reviews

---

**Related Documentation**:
- [Service API](./04-SERVICE-API.md)
- [Order API](./05-ORDER-API.md)
- [Payout API](./13-PAYOUT-API.md)

**Last Updated**: January 2025
