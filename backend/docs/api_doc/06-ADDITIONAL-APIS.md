# Additional APIs Documentation

> **Messaging, Notifications, Favorites, Coupons, Payouts, Invoices, Upload, Analytics, Admin Tools, and Contact APIs**

## 📋 Table of Contents

- [Message API](#message-api)
- [Notification API](#notification-api)
- [Favorite API](#favorite-api)
- [Coupon API](#coupon-api)
- [Payout API](#payout-api)
- [Invoice API](#invoice-api)
- [Upload API](#upload-api)
- [Analytics API](#analytics-api)
- [Admin Tools API](#admin-tools-api)
- [Contact API](#contact-api)

---

## Message API

**Base Path**: `/api/v1/messages`

All message endpoints require authentication.

### Endpoints

#### 1. Send Message

**POST** `/api/v1/messages`  
**Access**: Authenticated (user, vendor)

**Request Body**:
```json
{
  "recipientId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "content": "Hello, I have a question about your service",
  "orderId": "65a1b2c3d4e5f6g7h8i9j0k7"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k15",
    "sender": "65a1b2c3d4e5f6g7h8i9j0k8",
    "recipient": "65a1b2c3d4e5f6g7h8i9j0k1",
    "content": "Hello, I have a question...",
    "isRead": false,
    "createdAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

#### 2. Get Conversations

**GET** `/api/v1/messages/conversations`  
**Access**: Authenticated

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "user": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "name": "John Vendor",
        "profilePicture": "https://..."
      },
      "lastMessage": {
        "content": "Thank you!",
        "createdAt": "2024-01-20T15:00:00.000Z"
      },
      "unreadCount": 2
    }
  ]
}
```

---

#### 3. Get Conversation with User

**GET** `/api/v1/messages/conversation/:userId`  
**Access**: Authenticated

**Query**: `?page=1&limit=20`

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Vendor"
    },
    "messages": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k15",
        "sender": "65a1b2c3d4e5f6g7h8i9j0k8",
        "recipient": "65a1b2c3d4e5f6g7h8i9j0k1",
        "content": "Hello",
        "isRead": true,
        "createdAt": "2024-01-20T10:00:00.000Z"
      }
    ]
  }
}
```

---

#### 4. Get Unread Count

**GET** `/api/v1/messages/unread-count`  
**Access**: Authenticated

**Response**:
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

#### 5. Mark Message as Read

**PATCH** `/api/v1/messages/:messageId/read`  
**Access**: Authenticated (recipient only)

**Response**:
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

---

#### 6. Delete Message

**DELETE** `/api/v1/messages/:messageId`  
**Access**: Authenticated (sender only)

**Response**:
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

#### 7. Search Messages

**GET** `/api/v1/messages/search`  
**Access**: Authenticated

**Query**: `?q=service&page=1&limit=10`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k15",
      "content": "Question about your service",
      "sender": {
        "name": "Jane Customer"
      },
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

---

## Notification API

**Base Path**: `/api/v1/notifications`

### User Endpoints

#### 1. Get My Notifications

**GET** `/api/v1/notifications/my`  
**Access**: Authenticated

**Query**: `?page=1&limit=10&type=order`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k20",
      "title": "Order Accepted",
      "message": "Your order #ORD-001 has been accepted",
      "type": "order",
      "isRead": false,
      "data": {
        "orderId": "65a1b2c3d4e5f6g7h8i9j0k7"
      },
      "createdAt": "2024-01-20T11:00:00.000Z"
    }
  ]
}
```

---

#### 2. Get Unread Count

**GET** `/api/v1/notifications/unread-count`  
**Access**: Authenticated

**Response**:
```json
{
  "success": true,
  "data": {
    "unreadCount": 7
  }
}
```

---

#### 3. Get Notification by ID

**GET** `/api/v1/notifications/:id`  
**Access**: Authenticated

---

#### 4. Mark as Read

**PATCH** `/api/v1/notifications/:id/read`  
**Access**: Authenticated

---

#### 5. Mark All as Read

**PATCH** `/api/v1/notifications/mark-all-read`  
**Access**: Authenticated

---

#### 6. Delete Notification

**DELETE** `/api/v1/notifications/:id`  
**Access**: Authenticated

---

#### 7. Delete All Read

**DELETE** `/api/v1/notifications/read/all`  
**Access**: Authenticated

---

#### 8. Get Notification Preferences

**GET** `/api/v1/notifications/preferences/me`  
**Access**: Authenticated

**Response**:
```json
{
  "success": true,
  "data": {
    "email": {
      "orderUpdates": true,
      "promotions": false,
      "messages": true
    },
    "push": {
      "orderUpdates": true,
      "promotions": true,
      "messages": true
    }
  }
}
```

---

#### 9. Update Notification Preferences

**PUT** `/api/v1/notifications/preferences/me`  
**Access**: Authenticated

**Request Body**:
```json
{
  "email": {
    "orderUpdates": true,
    "promotions": false
  },
  "push": {
    "messages": true
  }
}
```

---

### Admin Endpoints

#### 10. Send System Notification

**POST** `/api/v1/notifications/admin/system`  
**Access**: Admin, Super Admin

**Request Body**:
```json
{
  "title": "Platform Maintenance",
  "message": "System will be down for maintenance on Jan 25",
  "type": "system",
  "targetRole": "all"
}
```

---

#### 11. Send Notification to User

**POST** `/api/v1/notifications/admin/user/:userId`  
**Access**: Admin, Super Admin

---

#### 12. Get All Notifications

**GET** `/api/v1/notifications/admin/all`  
**Access**: Admin, Super Admin

---

#### 13. Delete Notifications

**DELETE** `/api/v1/notifications/admin/bulk`  
**Access**: Admin, Super Admin

---

## Favorite API

**Base Path**: `/api/v1/favorites`

All endpoints require authentication (user, vendor).

### Endpoints

#### 1. Add Service to Favorites

**POST** `/api/v1/favorites/service/:serviceId`  
**Access**: User, Vendor

**Response**:
```json
{
  "success": true,
  "message": "Service added to favorites"
}
```

---

#### 2. Add Vendor to Favorites

**POST** `/api/v1/favorites/vendor/:vendorId`  
**Access**: User, Vendor

---

#### 3. Remove Service from Favorites

**DELETE** `/api/v1/favorites/service/:serviceId`  
**Access**: User, Vendor

---

#### 4. Remove Vendor from Favorites

**DELETE** `/api/v1/favorites/vendor/:vendorId`  
**Access**: User, Vendor

---

#### 5. Get Favorite Services

**GET** `/api/v1/favorites/services`  
**Access**: User, Vendor

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "House Cleaning",
      "price": 150.00,
      "vendor": {
        "businessName": "John's Cleaning"
      },
      "images": ["https://..."],
      "rating": 4.8
    }
  ]
}
```

---

#### 6. Get Favorite Vendors

**GET** `/api/v1/favorites/vendors`  
**Access**: User, Vendor

---

#### 7. Check Service in Favorites

**GET** `/api/v1/favorites/service/:serviceId/check`  
**Access**: User, Vendor

**Response**:
```json
{
  "success": true,
  "data": {
    "isFavorite": true
  }
}
```

---

#### 8. Check Vendor in Favorites

**GET** `/api/v1/favorites/vendor/:vendorId/check`  
**Access**: User, Vendor

---

## Coupon API

**Base Path**: `/api/v1/coupons`

### User Endpoints

#### 1. Validate Coupon

**POST** `/api/v1/coupons/validate`  
**Access**: Authenticated

**Request Body**:
```json
{
  "code": "SAVE20",
  "orderAmount": 150.00
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "coupon": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k25",
      "code": "SAVE20",
      "discountType": "percentage",
      "discountValue": 20,
      "maxDiscount": 50.00
    },
    "discountAmount": 30.00,
    "finalAmount": 120.00
  }
}
```

---

#### 2. Get Available Coupons

**GET** `/api/v1/coupons/available`  
**Access**: Authenticated

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k25",
      "code": "SAVE20",
      "description": "20% off on all services",
      "discountType": "percentage",
      "discountValue": 20,
      "minOrderValue": 100.00,
      "maxDiscount": 50.00,
      "validFrom": "2024-01-01",
      "validUntil": "2024-02-28",
      "usageLimit": 1000,
      "usageCount": 456
    }
  ]
}
```

---

### Admin Endpoints

#### 3. Create Coupon

**POST** `/api/v1/coupons`  
**Access**: Admin, Super Admin

**Request Body**:
```json
{
  "code": "SUMMER25",
  "description": "25% off summer special",
  "discountType": "percentage",
  "discountValue": 25,
  "minOrderValue": 100.00,
  "maxDiscount": 100.00,
  "validFrom": "2024-06-01",
  "validUntil": "2024-08-31",
  "usageLimit": 500,
  "isActive": true
}
```

---

#### 4. Get All Coupons

**GET** `/api/v1/coupons/admin/all`  
**Access**: Admin, Super Admin

**Query**: `?page=1&limit=10&isActive=true`

---

#### 5. Get Coupon by ID

**GET** `/api/v1/coupons/:couponId`  
**Access**: Admin, Super Admin

---

#### 6. Update Coupon

**PUT** `/api/v1/coupons/:couponId`  
**Access**: Admin, Super Admin

---

#### 7. Delete Coupon

**DELETE** `/api/v1/coupons/:couponId`  
**Access**: Admin, Super Admin

---

#### 8. Toggle Coupon Status

**PATCH** `/api/v1/coupons/:couponId/toggle-status`  
**Access**: Admin, Super Admin

---

#### 9. Get Coupon Statistics

**GET** `/api/v1/coupons/admin/statistics`  
**Access**: Admin, Super Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "totalCoupons": 45,
    "activeCoupons": 32,
    "totalUsage": 3456,
    "totalDiscountGiven": 45670.50,
    "topCoupons": [
      {
        "code": "SAVE20",
        "usageCount": 1234,
        "discountGiven": 18765.00
      }
    ]
  }
}
```

---

## Payout API

**Base Path**: `/api/v1/payouts`

### Vendor Endpoints

#### 1. Request Payout

**POST** `/api/v1/payouts/request`  
**Access**: Vendor

**Request Body**:
```json
{
  "amount": 5000.00,
  "paymentMethod": "bank_transfer",
  "accountDetails": {
    "accountNumber": "1234567890",
    "accountName": "John Doe",
    "bankName": "XYZ Bank",
    "routingNumber": "123456"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payout request submitted successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k30",
    "amount": 5000.00,
    "status": "pending",
    "requestedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

**Error (Deactivated Vendor)**:
```json
{
  "success": false,
  "message": "Your vendor account is deactivated. Cannot request payouts.",
  "error": "VENDOR_DEACTIVATED"
}
```

---

#### 2. Get My Payouts

**GET** `/api/v1/payouts/my-payouts`  
**Access**: Vendor

**Query**: `?page=1&limit=10&status=pending`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k30",
      "amount": 5000.00,
      "status": "pending",
      "paymentMethod": "bank_transfer",
      "requestedAt": "2024-01-20T10:00:00.000Z"
    }
  ],
  "summary": {
    "availableBalance": 12500.00,
    "pendingPayouts": 5000.00,
    "totalEarnings": 45670.00
  }
}
```

---

#### 3. Get Payout by ID

**GET** `/api/v1/payouts/:payoutId`  
**Access**: Vendor (own payouts), Admin

---

### Admin Endpoints

#### 4. Get All Payouts

**GET** `/api/v1/payouts/admin/all`  
**Access**: Admin, Super Admin

**Query**: `?page=1&limit=10&status=pending&vendor=vendorId`

---

#### 5. Process Payout

**PATCH** `/api/v1/payouts/:payoutId/process`  
**Access**: Admin, Super Admin

**Request Body**:
```json
{
  "processingNote": "Initiated bank transfer"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payout marked as processing",
  "data": {
    "status": "processing",
    "processedAt": "2024-01-20T14:00:00.000Z"
  }
}
```

---

#### 6. Complete Payout

**PATCH** `/api/v1/payouts/:payoutId/complete`  
**Access**: Admin, Super Admin

**Request Body**:
```json
{
  "transactionId": "TXN123456",
  "completionNote": "Payment successful"
}
```

---

#### 7. Get Payout Statistics

**GET** `/api/v1/payouts/admin/statistics`  
**Access**: Admin, Super Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "totalPayouts": 1234,
    "pendingPayouts": 42,
    "totalAmount": 345670.00,
    "pendingAmount": 125000.00,
    "averagePayoutAmount": 280.00
  }
}
```

---

## Invoice API

**Base Path**: `/api/v1/invoices`

All endpoints require authentication.

### Endpoints

#### 1. Get My Invoices

**GET** `/api/v1/invoices/my-invoices`  
**Access**: Authenticated

**Query**: `?page=1&limit=10`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k35",
      "invoiceNumber": "INV-20240120-0001",
      "order": {
        "orderNumber": "ORD-20240120-0001",
        "service": "House Cleaning"
      },
      "amount": 150.00,
      "status": "paid",
      "invoiceDate": "2024-01-20T10:00:00.000Z",
      "downloadUrl": "https://gridfs.example.com/file/invoice123"
    }
  ]
}
```

---

#### 2. Generate Order Invoice

**GET** `/api/v1/invoices/order/:orderId`  
**Access**: Authenticated (order owner)

**Response**: PDF file download

**Content-Type**: `application/pdf`

---

#### 3. Generate Order Receipt

**GET** `/api/v1/invoices/order/:orderId/receipt`  
**Access**: Authenticated (order owner)

**Response**: PDF file download

---

#### 4. Email Invoice

**POST** `/api/v1/invoices/order/:orderId/email`  
**Access**: Authenticated (order owner)

**Request Body**:
```json
{
  "email": "customer@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Invoice sent to email successfully"
}
```

---

## Upload API

**Base Path**: `/api/v1/uploads`

### Endpoints

#### 1. Upload Profile Picture

**POST** `/api/v1/uploads/profile-picture`  
**Access**: Authenticated  
**Content-Type**: `multipart/form-data`

**Form Fields**:
- `profilePicture` (file): Image file (max 5MB, JPG/PNG/WEBP)

**Response**:
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "fileId": "65a1b2c3d4e5f6g7h8i9j0k40",
    "filename": "profile_pic.jpg",
    "url": "https://gridfs.example.com/file/65a1b2c3d4e5f6g7h8i9j0k40",
    "size": 245678,
    "mimeType": "image/jpeg"
  }
}
```

---

#### 2. Upload Single Image

**POST** `/api/v1/uploads/image`  
**Access**: Authenticated  
**Content-Type**: `multipart/form-data`

**Form Fields**:
- `image` (file): Image file

---

#### 3. Upload Multiple Images

**POST** `/api/v1/uploads/images`  
**Access**: Authenticated  
**Content-Type**: `multipart/form-data`

**Form Fields**:
- `images` (files): Multiple image files (max 10)

**Response**:
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": [
    {
      "fileId": "65a1b2c3d4e5f6g7h8i9j0k41",
      "url": "https://gridfs.example.com/file/65a1b2c3d4e5f6g7h8i9j0k41"
    },
    {
      "fileId": "65a1b2c3d4e5f6g7h8i9j0k42",
      "url": "https://gridfs.example.com/file/65a1b2c3d4e5f6g7h8i9j0k42"
    }
  ]
}
```

---

#### 4. Upload Document

**POST** `/api/v1/uploads/document`  
**Access**: Authenticated  
**Content-Type**: `multipart/form-data`

**Form Fields**:
- `document` (file): PDF/DOC file (max 10MB)

---

#### 5. Get File

**GET** `/api/v1/uploads/:fileId`  
**Access**: Public

**Response**: File stream (image/document)

---

#### 6. Get File Metadata

**GET** `/api/v1/uploads/:fileId/info`  
**Access**: Authenticated

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k40",
    "filename": "profile_pic.jpg",
    "contentType": "image/jpeg",
    "length": 245678,
    "uploadDate": "2024-01-20T10:00:00.000Z",
    "metadata": {
      "uploadedBy": "65a1b2c3d4e5f6g7h8i9j0k8"
    }
  }
}
```

---

#### 7. Delete File

**DELETE** `/api/v1/uploads/:fileId`  
**Access**: Authenticated (file owner)

**Response**:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Analytics API

**Base Path**: `/api/v1/analytics`

### Public Endpoint

#### 1. Track Event

**POST** `/api/v1/analytics/track`  
**Access**: Public

**Request Body**:
```json
{
  "eventType": "service_view",
  "eventData": {
    "serviceId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "source": "search"
  },
  "sessionId": "session_abc123"
}
```

---

### Admin Endpoints

#### 2. Get Dashboard Overview

**GET** `/api/v1/analytics/dashboard`  
**Access**: Admin, Super Admin

**Query**: `?startDate=2024-01-01&endDate=2024-01-31`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 5432,
    "totalVendors": 234,
    "totalOrders": 1523,
    "totalRevenue": 228450.00,
    "platformFees": 22845.00,
    "newUsersThisMonth": 456,
    "newVendorsThisMonth": 23,
    "ordersThisMonth": 342
  }
}
```

---

#### 3. Get Revenue Analytics

**GET** `/api/v1/analytics/revenue`  
**Access**: Admin, Super Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRevenue": 228450.00,
    "platformFees": 22845.00,
    "vendorEarnings": 205605.00,
    "revenueByMonth": [
      {
        "month": "2024-01",
        "revenue": 45670.00,
        "fees": 4567.00
      }
    ],
    "topServices": [
      {
        "service": "House Cleaning",
        "revenue": 34567.00
      }
    ]
  }
}
```

---

#### 4. Get User Analytics

**GET** `/api/v1/analytics/users`  
**Access**: Admin, Super Admin

---

#### 5. Get Vendor Analytics

**GET** `/api/v1/analytics/vendors`  
**Access**: Admin, Super Admin

---

#### 6. Get Vendor Details Analytics

**GET** `/api/v1/analytics/vendors/details`  
**Access**: Admin, Super Admin

**Query**: `?vendorId=65a1b2c3d4e5f6g7h8i9j0k3`

---

#### 7. Get Service Analytics

**GET** `/api/v1/analytics/services`  
**Access**: Admin, Super Admin

---

#### 8. Get Order Analytics

**GET** `/api/v1/analytics/orders`  
**Access**: Admin, Super Admin

---

#### 9. Get Search Analytics

**GET** `/api/v1/analytics/search`  
**Access**: Admin, Super Admin

---

#### 10. Generate Report

**POST** `/api/v1/analytics/generate-report`  
**Access**: Admin, Super Admin

**Request Body**:
```json
{
  "reportType": "revenue",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "format": "pdf"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "reportId": "65a1b2c3d4e5f6g7h8i9j0k50",
    "downloadUrl": "https://gridfs.example.com/file/report123"
  }
}
```

---

## Admin Tools API

**Base Path**: `/api/v1/admin-tools`

All endpoints require Admin/Super Admin access.

### Endpoints

#### 1. Get System Health

**GET** `/api/v1/admin-tools/health`  
**Access**: Admin, Super Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3456789,
    "memory": {
      "used": "512MB",
      "total": "2GB"
    },
    "database": {
      "status": "connected",
      "responseTime": "15ms"
    },
    "redis": {
      "status": "connected"
    }
  }
}
```

---

#### 2. Get System Stats

**GET** `/api/v1/admin-tools/system/stats`  
**Access**: Admin, Super Admin

---

#### 3. Bulk Delete Users

**DELETE** `/api/v1/admin-tools/users/bulk`  
**Access**: Super Admin

**Request Body**:
```json
{
  "userIds": ["65a1b2c3d4e5f6g7h8i9j0k1", "65a1b2c3d4e5f6g7h8i9j0k2"]
}
```

---

#### 4. Bulk Update Users

**PATCH** `/api/v1/admin-tools/users/bulk`  
**Access**: Super Admin

---

#### 5. Cleanup Inactive Users

**POST** `/api/v1/admin-tools/users/cleanup`  
**Access**: Super Admin

**Request Body**:
```json
{
  "inactiveDays": 180
}
```

---

#### 6. Get Platform Settings

**GET** `/api/v1/admin-tools/settings`  
**Access**: Admin, Super Admin

---

#### 7. Generate Report

**GET** `/api/v1/admin-tools/reports`  
**Access**: Admin, Super Admin

**Query**: `?type=revenue&startDate=2024-01-01&endDate=2024-01-31`

---

#### 8. Trigger Backup

**POST** `/api/v1/admin-tools/backup`  
**Access**: Super Admin

---

#### 9. Cleanup Old Data

**POST** `/api/v1/admin-tools/cleanup`  
**Access**: Super Admin

---

#### 10. Get Audit Logs

**GET** `/api/v1/admin-tools/audit-logs`  
**Access**: Admin, Super Admin

---

#### 11. Clear Cache

**POST** `/api/v1/admin-tools/cache/clear`  
**Access**: Admin, Super Admin

**Request Body**:
```json
{
  "cacheType": "all"
}
```

---

## Contact API

**Base Path**: `/api/v1/contact`

### Endpoint

#### Send Contact Message

**POST** `/api/v1/contact/send`  
**Access**: Public

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "General Inquiry",
  "message": "I have a question about your platform...",
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message sent successfully. We'll get back to you soon."
}
```

**Notes**:
- No authentication required
- Message sent to admin email
- Auto-reply confirmation sent to user

---

**Related Documentation**:
- [API Index](./00-API-INDEX.md)
- [Authentication API](./01-AUTHENTICATION-API.md)
- [Order API](./05-ORDER-REVIEW-API.md)

**Last Updated**: January 2025
