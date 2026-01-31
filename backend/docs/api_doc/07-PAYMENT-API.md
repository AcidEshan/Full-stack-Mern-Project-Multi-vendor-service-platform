# Payment API Documentation

> **Payment processing with Stripe & SSLCommerz, transactions, refunds, and manual verification**

## 📋 Table of Contents

- [Overview](#overview)
- [Payment Flow](#payment-flow)
- [Stripe Integration](#stripe-integration)
- [SSLCommerz Integration](#sslcommerz-integration)
- [Transaction Management](#transaction-management)
- [Manual Payment Verification](#manual-payment-verification)
- [Refunds](#refunds)

---

## Overview

The platform supports multiple payment gateways:
- **Stripe**: International credit/debit card payments
- **SSLCommerz**: Bangladesh-based payment gateway (cards, mobile banking, internet banking)
- **Manual Verification**: Bank transfer with proof upload

**Base Path**: `/api/v1/payments`

---

## Payment Flow

```
1. User creates order → Order status: "pending", Payment status: "pending"
2. User initiates payment → Create payment intent/session
3. User completes payment → Webhook received
4. Payment verified → Order status: "accepted", Payment status: "paid"
5. Vendor completes service → Funds available for payout
```

---

## Stripe Integration

### 1. Create Payment Intent

Create Stripe payment intent for an order.

**Endpoint**: `POST /api/v1/payments/create-intent`  
**Access**: User  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "orderId": "65a1b2c3d4e5f6g7h8i9j0k7",
  "paymentMethod": "stripe"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "clientSecret": "pi_3ABC123_secret_xyz789",
    "paymentIntentId": "pi_3ABC123",
    "amount": 15000,
    "currency": "usd",
    "order": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "orderNumber": "ORD-20240120-0001",
      "totalAmount": 150.00
    }
  }
}
```

#### Notes

- Amount in cents (150.00 USD = 15000 cents)
- `clientSecret` used on frontend with Stripe.js
- Payment intent automatically cancelled if not completed within 24 hours

---

### 2. Confirm Payment

Confirm payment completion.

**Endpoint**: `POST /api/v1/payments/confirm`  
**Access**: User  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "orderId": "65a1b2c3d4e5f6g7h8i9j0k7",
  "paymentIntentId": "pi_3ABC123",
  "paymentMethod": "stripe"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "transaction": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k60",
      "transactionId": "TXN-20240120-0001",
      "order": "65a1b2c3d4e5f6g7h8i9j0k7",
      "amount": 150.00,
      "currency": "USD",
      "paymentMethod": "stripe",
      "status": "completed",
      "stripePaymentIntentId": "pi_3ABC123",
      "createdAt": "2024-01-20T10:00:00.000Z"
    },
    "order": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "paymentStatus": "paid",
      "status": "accepted"
    }
  }
}
```

---

### 3. Stripe Webhook

Receive Stripe webhook events.

**Endpoint**: `POST /api/v1/payments/webhook/stripe`  
**Access**: Public (Stripe servers)  
**Headers**: `stripe-signature` (required)

#### Events Handled

- `payment_intent.succeeded`: Payment successful
- `payment_intent.payment_failed`: Payment failed
- `charge.refunded`: Refund processed

#### Webhook Response

```json
{
  "received": true
}
```

#### Notes

- Webhook endpoint must be configured in Stripe Dashboard
- Signature verification required for security
- Idempotent processing (duplicate events ignored)

---

## SSLCommerz Integration

### 4. Initialize SSLCommerz Payment

Create SSLCommerz payment session.

**Endpoint**: `POST /api/v1/payments/sslcommerz/init`  
**Access**: User  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "orderId": "65a1b2c3d4e5f6g7h8i9j0k7"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "SSLCommerz session initiated",
  "data": {
    "gatewayUrl": "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    "sessionId": "ABC123XYZ456",
    "transactionId": "TXN-20240120-0001"
  }
}
```

#### Notes

- Redirect user to `gatewayUrl` with session data
- User completes payment on SSLCommerz hosted page
- Callback URLs: success, fail, cancel

---

### 5. SSLCommerz Success Callback

Handle successful payment callback.

**Endpoint**: `POST /api/v1/payments/sslcommerz/success`  
**Access**: Public (SSLCommerz servers)

#### Request Body (from SSLCommerz)

```json
{
  "val_id": "2401201234567890ABC",
  "tran_id": "TXN-20240120-0001",
  "amount": "150.00",
  "card_type": "VISA-Brac",
  "status": "VALID"
}
```

#### Response

```json
{
  "success": true,
  "message": "Payment successful"
}
```

---

### 6. SSLCommerz Fail Callback

Handle failed payment callback.

**Endpoint**: `POST /api/v1/payments/sslcommerz/fail`  
**Access**: Public (SSLCommerz servers)

---

### 7. SSLCommerz Cancel Callback

Handle cancelled payment callback.

**Endpoint**: `POST /api/v1/payments/sslcommerz/cancel`  
**Access**: Public (SSLCommerz servers)

---

### 8. SSLCommerz IPN (Instant Payment Notification)

Receive instant payment notifications.

**Endpoint**: `POST /api/v1/payments/sslcommerz/ipn`  
**Access**: Public (SSLCommerz servers)

#### Notes

- IPN provides real-time payment status updates
- More reliable than user redirects
- Used for order/payment status updates

---

### 9. Validate SSLCommerz Transaction

Validate transaction with SSLCommerz API.

**Endpoint**: `POST /api/v1/payments/sslcommerz/validate`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "valId": "2401201234567890ABC"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "status": "VALID",
    "tran_date": "2024-01-20 10:00:00",
    "amount": "150.00",
    "card_type": "VISA-Brac"
  }
}
```

---

### 10. Query SSLCommerz Transaction

Query transaction details from SSLCommerz.

**Endpoint**: `POST /api/v1/payments/sslcommerz/query`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "transactionId": "TXN-20240120-0001"
}
```

---

### 11. Initialize SSLCommerz Refund

Initiate refund through SSLCommerz.

**Endpoint**: `POST /api/v1/payments/sslcommerz/refund-init`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "transactionId": "TXN-20240120-0001",
  "refundAmount": 150.00,
  "refundReason": "Service not delivered"
}
```

#### Response

```json
{
  "success": true,
  "message": "Refund initiated successfully",
  "data": {
    "refundId": "REF-20240120-0001",
    "status": "processing",
    "amount": 150.00
  }
}
```

---

### 12. Query SSLCommerz Refund

Query refund status from SSLCommerz.

**Endpoint**: `POST /api/v1/payments/sslcommerz/refund-query`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "refundId": "REF-20240120-0001"
}
```

---

## Transaction Management

### 13. Get User Transactions

Get all transactions for authenticated user.

**Endpoint**: `GET /api/v1/payments/user/transactions`  
**Access**: User  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `status` | string | - | Filter by status |
| `startDate` | date | - | Filter from date |
| `endDate` | date | - | Filter to date |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k60",
      "transactionId": "TXN-20240120-0001",
      "order": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
        "orderNumber": "ORD-20240120-0001",
        "service": {
          "title": "House Cleaning"
        }
      },
      "amount": 150.00,
      "currency": "USD",
      "paymentMethod": "stripe",
      "status": "completed",
      "createdAt": "2024-01-20T10:00:00.000Z"
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

### 14. Get Transaction by ID

Get specific transaction details.

**Endpoint**: `GET /api/v1/payments/user/transactions/:transactionId`  
**Access**: User (own transactions), Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k60",
    "transactionId": "TXN-20240120-0001",
    "order": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "orderNumber": "ORD-20240120-0001",
      "service": {
        "title": "House Cleaning",
        "price": 150.00
      },
      "vendor": {
        "businessName": "John's Cleaning"
      }
    },
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
      "name": "Jane Customer",
      "email": "jane@example.com"
    },
    "amount": 150.00,
    "currency": "USD",
    "platformFee": 15.00,
    "vendorAmount": 135.00,
    "paymentMethod": "stripe",
    "status": "completed",
    "stripePaymentIntentId": "pi_3ABC123",
    "metadata": {
      "card_type": "visa",
      "card_last4": "4242"
    },
    "createdAt": "2024-01-20T10:00:00.000Z",
    "completedAt": "2024-01-20T10:05:00.000Z"
  }
}
```

---

### 15. Get Vendor Transactions

Get all transactions for vendor's services.

**Endpoint**: `GET /api/v1/payments/vendor/transactions`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `status` | string | Filter by status |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k60",
      "transactionId": "TXN-20240120-0001",
      "order": {
        "orderNumber": "ORD-20240120-0001",
        "service": "House Cleaning"
      },
      "user": {
        "name": "Jane Customer"
      },
      "amount": 150.00,
      "vendorAmount": 135.00,
      "platformFee": 15.00,
      "status": "completed",
      "payoutStatus": "pending",
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  ],
  "summary": {
    "totalEarnings": 45670.00,
    "availableBalance": 12500.00,
    "pendingBalance": 5000.00,
    "paidOut": 28170.00
  }
}
```

---

### 16. Get All Transactions (Admin)

Get all platform transactions.

**Endpoint**: `GET /api/v1/payments/admin/transactions`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `status` | string | Filter by status |
| `paymentMethod` | string | Filter by payment method |
| `vendor` | string | Filter by vendor ID |
| `user` | string | Filter by user ID |
| `startDate` | date | Filter from date |
| `endDate` | date | Filter to date |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k60",
      "transactionId": "TXN-20240120-0001",
      "order": {
        "orderNumber": "ORD-20240120-0001"
      },
      "user": {
        "name": "Jane Customer",
        "email": "jane@example.com"
      },
      "vendor": {
        "businessName": "John's Cleaning"
      },
      "amount": 150.00,
      "platformFee": 15.00,
      "vendorAmount": 135.00,
      "paymentMethod": "stripe",
      "status": "completed"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 153,
    "totalItems": 1523
  }
}
```

---

## Refunds

### 17. Initiate Refund

Admin initiates refund for a transaction.

**Endpoint**: `POST /api/v1/payments/refund`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "transactionId": "65a1b2c3d4e5f6g7h8i9j0k60",
  "refundAmount": 150.00,
  "refundReason": "Service not delivered as promised",
  "refundType": "full"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transactionId` | string | Yes | Transaction ID to refund |
| `refundAmount` | number | Yes | Amount to refund |
| `refundReason` | string | Yes | Reason for refund |
| `refundType` | string | Yes | `full` or `partial` |

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refund": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k70",
      "refundId": "REF-20240120-0001",
      "transaction": "65a1b2c3d4e5f6g7h8i9j0k60",
      "amount": 150.00,
      "reason": "Service not delivered as promised",
      "status": "completed",
      "refundedAt": "2024-01-20T15:00:00.000Z"
    },
    "transaction": {
      "status": "refunded",
      "refundAmount": 150.00
    },
    "order": {
      "paymentStatus": "refunded",
      "status": "cancelled"
    }
  }
}
```

#### Notes

- Automatic refund processing for Stripe
- SSLCommerz refunds may take 7-14 business days
- Full refunds cancel the order
- Partial refunds keep order active

---

### 18. Get Revenue Statistics

Get platform revenue statistics.

**Endpoint**: `GET /api/v1/payments/revenue-stats`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|---------|
| `startDate` | date | Start date |
| `endDate` | date | End date |
| `groupBy` | string | `day`, `week`, `month` |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "totalRevenue": 228450.00,
    "platformFees": 22845.00,
    "vendorEarnings": 205605.00,
    "totalTransactions": 1523,
    "successfulTransactions": 1478,
    "failedTransactions": 45,
    "refundedAmount": 4567.00,
    "revenueByMethod": {
      "stripe": 156780.00,
      "sslcommerz": 71670.00
    },
    "revenueByPeriod": [
      {
        "date": "2024-01-01",
        "revenue": 7890.00,
        "fees": 789.00,
        "transactions": 53
      },
      {
        "date": "2024-01-02",
        "revenue": 8120.00,
        "fees": 812.00,
        "transactions": 55
      }
    ],
    "topVendors": [
      {
        "vendor": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
          "businessName": "John's Cleaning"
        },
        "revenue": 34567.00,
        "transactions": 234
      }
    ]
  }
}
```

---

## Manual Payment Verification

### 19. Get Pending Verifications

Get payments awaiting manual verification.

**Endpoint**: `GET /api/v1/payments/pending-verifications`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k80",
      "transactionId": "TXN-20240120-0005",
      "order": {
        "orderNumber": "ORD-20240120-0005",
        "service": "House Cleaning"
      },
      "user": {
        "name": "John Customer",
        "email": "john@example.com"
      },
      "amount": 150.00,
      "paymentMethod": "manual",
      "status": "pending_verification",
      "paymentProof": "https://gridfs.example.com/file/proof123",
      "createdAt": "2024-01-20T12:00:00.000Z"
    }
  ]
}
```

---

### 20. Verify Manual Payment

Verify manually submitted payment.

**Endpoint**: `POST /api/v1/payments/verify/:transactionId`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "isVerified": true,
  "verificationNote": "Bank transfer verified, reference: TXN123456"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "transaction": {
      "status": "completed",
      "verifiedAt": "2024-01-20T14:00:00.000Z",
      "verifiedBy": "65a1b2c3d4e5f6g7h8i9j0k90"
    },
    "order": {
      "paymentStatus": "paid",
      "status": "accepted"
    }
  }
}
```

#### Notes

- If `isVerified: false`, order is cancelled
- User and vendor notified via email
- Payment proof retained for records

---

### 21. Upload Payment Proof

User uploads payment proof for manual verification.

**Endpoint**: `POST /api/v1/payments/upload-proof`  
**Access**: User  
**Authentication**: Bearer Token required  
**Content-Type**: multipart/form-data

#### Request Body (Form Data)

| Field | Type | Description |
|-------|------|-------------|
| `transactionId` | string | Transaction ID |
| `paymentProof` | file | Image/PDF of payment receipt |
| `paymentReference` | string | Bank reference number |

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Payment proof uploaded successfully",
  "data": {
    "transaction": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k80",
      "status": "pending_verification",
      "paymentProof": "https://gridfs.example.com/file/proof123",
      "paymentReference": "BANK123456"
    }
  }
}
```

---

### 22. Get Verification Statistics

Get manual verification statistics.

**Endpoint**: `GET /api/v1/payments/verification-stats`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "pendingVerifications": 12,
    "verifiedToday": 45,
    "rejectedToday": 3,
    "averageVerificationTime": "2.5 hours",
    "oldestPending": {
      "transactionId": "TXN-20240118-0023",
      "submittedAt": "2024-01-18T10:00:00.000Z",
      "waitingFor": "50 hours"
    }
  }
}
```

---

## Payment Status Codes

| Status | Description |
|--------|-------------|
| `pending` | Payment initiated but not completed |
| `processing` | Payment being processed by gateway |
| `completed` | Payment successful |
| `failed` | Payment failed |
| `refunded` | Payment refunded |
| `partially_refunded` | Partial refund issued |
| `pending_verification` | Awaiting manual verification |
| `cancelled` | Payment cancelled |

---

## Payment Method Codes

| Code | Description |
|------|-------------|
| `stripe` | Stripe payment gateway |
| `sslcommerz` | SSLCommerz payment gateway |
| `manual` | Manual bank transfer with verification |

---

## Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `ORDER_NOT_FOUND` | 404 | Order does not exist |
| `ORDER_ALREADY_PAID` | 400 | Order already paid |
| `PAYMENT_INTENT_FAILED` | 400 | Failed to create payment intent |
| `INVALID_PAYMENT_METHOD` | 400 | Invalid payment method |
| `REFUND_NOT_ALLOWED` | 400 | Refund not allowed for this transaction |
| `INSUFFICIENT_BALANCE` | 400 | Vendor has insufficient balance |
| `VERIFICATION_FAILED` | 400 | Payment verification failed |
| `GATEWAY_ERROR` | 500 | Payment gateway error |

---

## Webhook Security

### Stripe Webhook Verification

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Verify webhook signature
const signature = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### SSLCommerz Validation

```javascript
// Validate transaction with SSLCommerz API
const validationResponse = await axios.post(
  'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php',
  {
    val_id: valId,
    store_id: process.env.SSLCOMMERZ_STORE_ID,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD
  }
);
```

---

## Testing

### Test Cards (Stripe)

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |

### SSLCommerz Sandbox

Use sandbox credentials provided by SSLCommerz for testing.

---

**Related Documentation**:
- [Order API](./05-ORDER-REVIEW-API.md)
- [Transaction Management](./06-ADDITIONAL-APIS.md#payout-api)
- [Refund Policy](../01-PROJECT-OVERVIEW.md)

**Last Updated**: January 2025
