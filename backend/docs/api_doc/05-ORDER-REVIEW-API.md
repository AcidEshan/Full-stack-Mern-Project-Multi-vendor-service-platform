# Order & Review API Documentation

> **Order booking, lifecycle management, and review system**

## 📋 Table of Contents

- [Order API](#order-api)
- [Review API](#review-api)

---

## Order API

**Base Path**: `/api/v1/orders`

### User Endpoints

#### 1. Create Order (Book Service)

Book a service and create an order.

**Endpoint**: `POST /api/v1/orders`  
**Access**: User  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "service": "65a1b2c3d4e5f6g7h8i9j0k1",
  "scheduledDate": "2024-02-15",
  "scheduledTime": "14:00",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001"
  },
  "notes": "Please ring the doorbell"
}
```

#### Response (Success - 201)

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
    "orderNumber": "ORD-20240120-0001",
    "service": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "House Cleaning",
      "price": 150.00
    },
    "vendor": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "businessName": "John's Cleaning"
    },
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
      "name": "Jane Customer"
    },
    "scheduledDate": "2024-02-15T00:00:00.000Z",
    "scheduledTime": "14:00",
    "status": "pending",
    "totalAmount": 150.00,
    "paymentStatus": "pending",
    "createdAt": "2024-01-20T10:00:00.000Z"
  }
}
```

#### Response (Error - 403)

```json
{
  "success": false,
  "message": "Cannot book service from deactivated vendor",
  "error": "VENDOR_DEACTIVATED"
}
```

#### Order Status Flow

```
pending → accepted → in_progress → completed
         ↓
       rejected
```

---

#### 2. Get My Orders

Retrieve all orders for authenticated user.

**Endpoint**: `GET /api/v1/orders/my-orders`  
**Access**: User  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `status` | string | - | Filter by status |
| `startDate` | date | - | Filter from date |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "orderNumber": "ORD-20240120-0001",
      "service": {
        "title": "House Cleaning",
        "images": ["https://gridfs.example.com/file/img1"]
      },
      "vendor": {
        "businessName": "John's Cleaning",
        "phone": "+1234567890"
      },
      "scheduledDate": "2024-02-15",
      "scheduledTime": "14:00",
      "status": "accepted",
      "totalAmount": 150.00,
      "paymentStatus": "paid"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 28
  }
}
```

---

#### 3. Get Order by ID

Get detailed order information.

**Endpoint**: `GET /api/v1/orders/:orderId`  
**Access**: User (own orders), Vendor (their orders), Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
    "orderNumber": "ORD-20240120-0001",
    "service": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "House Cleaning",
      "price": 150.00,
      "duration": 120
    },
    "vendor": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "businessName": "John's Cleaning",
      "phone": "+1234567890",
      "email": "john@cleaning.com"
    },
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
      "name": "Jane Customer",
      "phone": "+9876543210"
    },
    "scheduledDate": "2024-02-15",
    "scheduledTime": "14:00",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001"
    },
    "status": "completed",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-20T10:00:00.000Z"
      },
      {
        "status": "accepted",
        "timestamp": "2024-01-20T11:00:00.000Z"
      },
      {
        "status": "completed",
        "timestamp": "2024-02-15T16:00:00.000Z"
      }
    ],
    "totalAmount": 150.00,
    "platformFee": 15.00,
    "vendorAmount": 135.00,
    "paymentStatus": "paid",
    "paymentMethod": "stripe",
    "transaction": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k9",
      "transactionId": "txn_abc123"
    },
    "notes": "Please ring the doorbell",
    "createdAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

#### 4. Cancel Order (User)

Cancel an order before it's accepted.

**Endpoint**: `PATCH /api/v1/orders/:orderId/cancel`  
**Access**: User (own orders only)  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "cancellationReason": "Changed my mind"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "status": "cancelled",
    "cancellationReason": "Changed my mind",
    "refundAmount": 150.00,
    "refundStatus": "processing"
  }
}
```

#### Notes

- Can only cancel if status is "pending" or "accepted"
- Full refund if cancelled before vendor starts work
- Partial refund if vendor already started

---

#### 5. Reschedule Order

Request order rescheduling.

**Endpoint**: `PATCH /api/v1/orders/:orderId/reschedule`  
**Access**: User (own orders only)  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "newScheduledDate": "2024-02-16",
  "newScheduledTime": "15:00",
  "reason": "Conflict in schedule"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Reschedule request sent to vendor",
  "data": {
    "rescheduleRequested": true,
    "newScheduledDate": "2024-02-16",
    "newScheduledTime": "15:00"
  }
}
```

#### Notes

- Vendor must approve reschedule request
- Can only reschedule before service starts
- Limited to 2 reschedules per order

---

#### 6. Apply Coupon to Order

Apply discount coupon to order.

**Endpoint**: `POST /api/v1/orders/:orderId/apply-coupon`  
**Access**: User (own orders only)  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "couponCode": "SAVE20"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "originalAmount": 150.00,
    "discountAmount": 30.00,
    "totalAmount": 120.00,
    "coupon": {
      "code": "SAVE20",
      "discountType": "percentage",
      "discountValue": 20
    }
  }
}
```

---

### Vendor Endpoints

#### 7. Get Vendor Orders

Get all orders for vendor's services.

**Endpoint**: `GET /api/v1/orders/vendor/orders`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `status` | string | Filter by status |
| `startDate` | date | Filter from date |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "orderNumber": "ORD-20240120-0001",
      "service": {
        "title": "House Cleaning"
      },
      "user": {
        "name": "Jane Customer",
        "phone": "+9876543210"
      },
      "scheduledDate": "2024-02-15",
      "scheduledTime": "14:00",
      "status": "pending",
      "totalAmount": 150.00
    }
  ]
}
```

---

#### 8. Accept Order

Accept a pending order.

**Endpoint**: `PATCH /api/v1/orders/vendor/:orderId/accept`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "estimatedCompletionTime": "16:00",
  "vendorNotes": "Will arrive on time"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "status": "accepted",
    "acceptedAt": "2024-01-20T11:00:00.000Z"
  }
}
```

#### Response (Error - 403)

```json
{
  "success": false,
  "message": "Your vendor account is deactivated. Cannot accept orders.",
  "error": "VENDOR_DEACTIVATED"
}
```

---

#### 9. Reject Order

Reject a pending order.

**Endpoint**: `PATCH /api/v1/orders/vendor/:orderId/reject`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "rejectionReason": "Fully booked on that day"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Order rejected",
  "data": {
    "status": "rejected",
    "rejectionReason": "Fully booked on that day"
  }
}
```

---

#### 10. Start Order

Mark order as in progress.

**Endpoint**: `PATCH /api/v1/orders/vendor/:orderId/start`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Order started",
  "data": {
    "status": "in_progress",
    "startedAt": "2024-02-15T14:00:00.000Z"
  }
}
```

---

#### 11. Complete Order

Mark order as completed.

**Endpoint**: `PATCH /api/v1/orders/vendor/:orderId/complete`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "completionNotes": "Service completed successfully",
  "actualDuration": 120
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Order completed successfully",
  "data": {
    "status": "completed",
    "completedAt": "2024-02-15T16:00:00.000Z",
    "vendorEarnings": 135.00
  }
}
```

#### Notes

- Triggers payout eligibility for vendor
- User can now leave a review
- Payment automatically settled

---

#### 12. Cancel Order (Vendor)

Vendor cancels accepted order.

**Endpoint**: `PATCH /api/v1/orders/vendor/:orderId/cancel`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "cancellationReason": "Emergency situation"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Order cancelled",
  "data": {
    "status": "cancelled",
    "refundAmount": 150.00
  }
}
```

#### Notes

- Vendor may face penalty for frequent cancellations
- User gets full refund
- Affects vendor's reliability score

---

### Admin Endpoints

#### 13. Get All Orders (Admin)

Get all orders with advanced filtering.

**Endpoint**: `GET /api/v1/orders/admin/orders`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `status` | string | Filter by status |
| `vendor` | string | Filter by vendor ID |
| `user` | string | Filter by user ID |
| `paymentStatus` | string | Filter by payment status |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "orderNumber": "ORD-20240120-0001",
      "user": {
        "name": "Jane Customer",
        "email": "jane@example.com"
      },
      "vendor": {
        "businessName": "John's Cleaning"
      },
      "service": {
        "title": "House Cleaning"
      },
      "status": "completed",
      "totalAmount": 150.00,
      "platformFee": 15.00
    }
  ]
}
```

---

#### 14. Cancel Order (Admin)

Admin force cancel any order.

**Endpoint**: `PATCH /api/v1/orders/admin/:orderId/cancel`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "reason": "Policy violation",
  "refundAmount": 150.00
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Order cancelled by admin"
}
```

---

#### 15. Get Order Statistics

Get platform-wide order statistics.

**Endpoint**: `GET /api/v1/orders/admin/statistics`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | date | Start date |
| `endDate` | date | End date |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "totalOrders": 1523,
    "pendingOrders": 42,
    "completedOrders": 1234,
    "cancelledOrders": 145,
    "totalRevenue": 228450.00,
    "platformFees": 22845.00,
    "averageOrderValue": 150.00,
    "ordersByStatus": {
      "pending": 42,
      "accepted": 102,
      "in_progress": 45,
      "completed": 1234,
      "cancelled": 100
    }
  }
}
```

---

## Review API

**Base Path**: `/api/v1/reviews`

### Public Endpoints

#### 1. Get Service Reviews

Get all reviews for a service.

**Endpoint**: `GET /api/v1/reviews/service/:serviceId`  
**Access**: Public

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `minRating` | number | - | Filter by minimum rating |
| `sort` | string | `-createdAt` | Sort order |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "service": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "House Cleaning",
      "averageRating": 4.8,
      "totalReviews": 156
    },
    "reviews": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
        "user": {
          "name": "Jane Customer",
          "profilePicture": "https://gridfs.example.com/file/user1"
        },
        "rating": 5,
        "comment": "Excellent service! Very professional.",
        "createdAt": "2024-02-16T10:00:00.000Z",
        "vendorResponse": {
          "comment": "Thank you for your kind words!",
          "respondedAt": "2024-02-16T12:00:00.000Z"
        }
      }
    ]
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 16,
    "totalItems": 156
  }
}
```

---

#### 2. Get Vendor Reviews

Get all reviews for a vendor.

**Endpoint**: `GET /api/v1/reviews/vendor/:vendorId`  
**Access**: Public

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "vendor": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "businessName": "John's Cleaning",
      "averageRating": 4.8,
      "totalReviews": 125
    },
    "reviews": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
        "service": {
          "title": "House Cleaning"
        },
        "user": {
          "name": "Jane Customer"
        },
        "rating": 5,
        "comment": "Great service!"
      }
    ]
  }
}
```

---

### User Endpoints

#### 3. Create Review

Create review for completed order.

**Endpoint**: `POST /api/v1/reviews`  
**Access**: User  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "order": "65a1b2c3d4e5f6g7h8i9j0k7",
  "service": "65a1b2c3d4e5f6g7h8i9j0k1",
  "vendor": "65a1b2c3d4e5f6g7h8i9j0k3",
  "rating": 5,
  "comment": "Excellent service! Very professional and thorough."
}
```

#### Response (Success - 201)

```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
    "rating": 5,
    "comment": "Excellent service!",
    "createdAt": "2024-02-16T10:00:00.000Z"
  }
}
```

#### Notes

- Can only review completed orders
- One review per order
- Cannot review own services (vendor)

---

#### 4. Get My Reviews

Get all reviews submitted by authenticated user.

**Endpoint**: `GET /api/v1/reviews/my-reviews`  
**Access**: User  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
      "service": {
        "title": "House Cleaning"
      },
      "vendor": {
        "businessName": "John's Cleaning"
      },
      "rating": 5,
      "comment": "Excellent service!",
      "createdAt": "2024-02-16T10:00:00.000Z"
    }
  ]
}
```

---

#### 5. Update Review

Update existing review.

**Endpoint**: `PUT /api/v1/reviews/:reviewId`  
**Access**: User (own reviews only)  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "rating": 4,
  "comment": "Updated: Still good but had minor issues"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Review updated successfully"
}
```

#### Notes

- Can update within 30 days of creation
- Cannot change once vendor responds

---

#### 6. Delete Review

Delete a review.

**Endpoint**: `DELETE /api/v1/reviews/:reviewId`  
**Access**: User (own reviews only)  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### Vendor Endpoints

#### 7. Respond to Review

Vendor responds to a review.

**Endpoint**: `POST /api/v1/reviews/:reviewId/respond`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "response": "Thank you for your feedback! We're glad you enjoyed our service."
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Response added successfully",
  "data": {
    "vendorResponse": {
      "comment": "Thank you for your feedback!",
      "respondedAt": "2024-02-16T12:00:00.000Z"
    }
  }
}
```

---

#### 8. Update Response

Update vendor response.

**Endpoint**: `PUT /api/v1/reviews/:reviewId/response`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "response": "Updated response text"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Response updated successfully"
}
```

---

### Admin Endpoints

#### 9. Toggle Review Visibility

Hide/show review.

**Endpoint**: `PATCH /api/v1/reviews/:reviewId/toggle-visibility`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "isVisible": false,
  "reason": "Inappropriate content"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Review visibility updated"
}
```

---

#### 10. Delete Review (Admin)

Admin delete any review.

**Endpoint**: `DELETE /api/v1/reviews/admin/:reviewId`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

#### 11. Get All Reviews (Admin)

Get all reviews with filtering.

**Endpoint**: `GET /api/v1/reviews/admin/all`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
      "user": {
        "name": "Jane Customer"
      },
      "vendor": {
        "businessName": "John's Cleaning"
      },
      "rating": 5,
      "comment": "Excellent service!",
      "isVisible": true
    }
  ]
}
```

---

#### 12. Get Review Statistics

Get platform-wide review statistics.

**Endpoint**: `GET /api/v1/reviews/admin/statistics`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "totalReviews": 2456,
    "averageRating": 4.6,
    "ratingDistribution": {
      "5": 1523,
      "4": 678,
      "3": 156,
      "2": 67,
      "1": 32
    },
    "reviewsWithResponses": 1834,
    "hiddenReviews": 23
  }
}
```

---

**Related Documentation**:
- [Service API](./04-SERVICE-CATEGORY-API.md)
- [Payment API](./06-PAYMENT-API.md)
- [Vendor API](./03-VENDOR-API.md)

**Last Updated**: January 2025
