# API Documentation Index

> **Complete API Reference for Multi-Vendor Marketplace Platform**
> 
> This directory contains comprehensive documentation for all API endpoints in the system, organized by feature modules.

## 📚 Documentation Structure

| Document | Description | Endpoints |
|----------|-------------|-----------|
| [01-AUTHENTICATION-API.md](01-AUTHENTICATION-API.md) | User registration, login, password reset, token management | 8 |
| [02-USER-API.md](02-USER-API.md) | User profile management, addresses, admin user operations | 10 |
| [03-VENDOR-API.md](03-VENDOR-API.md) | Vendor profiles, working hours, verification, admin approval | 13 |
| [04-SERVICE-API.md](04-SERVICE-API.md) | Service CRUD, browsing, categories, admin moderation | 11 |
| [05-ORDER-API.md](05-ORDER-API.md) | Order creation, lifecycle management, rescheduling, cancellation | 15 |
| [06-PAYMENT-API.md](06-PAYMENT-API.md) | Payment processing, Stripe, SSLCommerz, transactions, refunds | 20+ |
| [07-REVIEW-API.md](07-REVIEW-API.md) | Reviews and ratings, vendor responses, admin moderation | 12 |
| [08-MESSAGE-API.md](08-MESSAGE-API.md) | Messaging system, conversations, unread counts | 7 |
| [09-NOTIFICATION-API.md](09-NOTIFICATION-API.md) | Notification management, preferences, admin broadcasts | 13 |
| [10-FAVORITE-API.md](10-FAVORITE-API.md) | Favorite services and vendors management | 8 |
| [11-CATEGORY-API.md](11-CATEGORY-API.md) | Category browsing and management | 5 |
| [12-COUPON-API.md](12-COUPON-API.md) | Coupon validation, management, statistics | 8 |
| [13-PAYOUT-API.md](13-PAYOUT-API.md) | Vendor payout requests and admin processing | 7 |
| [14-INVOICE-API.md](14-INVOICE-API.md) | Invoice and receipt generation, PDF downloads | 4 |
| [15-UPLOAD-API.md](15-UPLOAD-API.md) | File upload (images, documents), GridFS management | 6 |
| [16-ANALYTICS-API.md](16-ANALYTICS-API.md) | Analytics dashboards, reports, event tracking | 10 |
| [17-ADMIN-TOOLS-API.md](17-ADMIN-TOOLS-API.md) | System health, bulk operations, backups, audit logs | 11 |
| [18-CONTACT-API.md](18-CONTACT-API.md) | Contact form submission | 1 |

**Total API Endpoints:** 150+

---

## 🔐 Authentication & Authorization

### Authentication Types

| Type | Header | Description |
|------|--------|-------------|
| **Public** | None | No authentication required |
| **Authenticated** | `Authorization: Bearer <token>` | Valid JWT token required |
| **Role-Based** | `Authorization: Bearer <token>` | Specific role(s) required |

### User Roles

| Role | Code | Description |
|------|------|-------------|
| **User** | `user` | Regular customers who book services |
| **Vendor** | `vendor` | Service providers |
| **Admin** | `admin` | Platform administrators |
| **Super Admin** | `super_admin` | Full system access |

### Token Management

- **Access Token**: Short-lived JWT (15 minutes default)
- **Refresh Token**: Long-lived token for obtaining new access tokens (7 days default)
- **Token Refresh Endpoint**: `POST /api/v1/auth/refresh`

---

## 🌐 Base URL

```
Development: http://localhost:5000
Production: https://api.yourplatform.com
```

All endpoints are prefixed with `/api/v1`

---

## 📝 Common Request/Response Patterns

### Success Response Structure

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response Structure

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE"
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [/* array of items */],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 95,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 🚫 Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid request data |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `SERVER_ERROR` | 500 | Internal server error |
| `VENDOR_DEACTIVATED` | 403 | Vendor account is deactivated |
| `VENDOR_NOT_APPROVED` | 403 | Vendor account not approved yet |
| `USER_BLOCKED` | 403 | User account is blocked |

---

## 📊 Query Parameters (Common)

### Pagination

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `sort` | string | `-createdAt` | Sort field (prefix with `-` for descending) |

### Filtering

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search query |
| `status` | string | Filter by status |
| `startDate` | date | Filter from date |
| `endDate` | date | Filter to date |

---

## 🔄 Rate Limiting

Certain endpoints have rate limiting applied:

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `POST /auth/register` | 5 requests | 15 minutes |
| `POST /auth/login` | 5 requests | 15 minutes |
| `POST /auth/forgot-password` | 3 requests | 15 minutes |

---

## 📦 File Upload Specifications

### Profile Picture

- **Max Size**: 5MB
- **Allowed Types**: JPG, JPEG, PNG, WEBP
- **Field Name**: `profilePicture`

### Service Images

- **Max Size**: 5MB per image
- **Max Count**: 10 images
- **Allowed Types**: JPG, JPEG, PNG, WEBP
- **Field Name**: `images`

### Documents

- **Max Size**: 10MB
- **Allowed Types**: PDF, DOC, DOCX
- **Field Name**: `document`

---

## 🔔 Webhook Events

The system sends webhooks for the following events:

### Payment Events

- `payment.success` - Payment completed successfully
- `payment.failed` - Payment failed
- `payment.refunded` - Payment refunded

### Order Events

- `order.created` - New order created
- `order.accepted` - Order accepted by vendor
- `order.rejected` - Order rejected by vendor
- `order.completed` - Order completed
- `order.cancelled` - Order cancelled

---

## 📱 WebSocket Events

Real-time updates are available via WebSocket for:

- **Messages**: New message notifications
- **Notifications**: Real-time notification delivery
- **Order Updates**: Live order status changes

---

## 🧪 Testing

### Postman Collection

A complete Postman collection is available for testing all endpoints:

```
/docs/postman/API-Collection.json
```

### Sample Test Data

```json
{
  "testUser": {
    "email": "user@test.com",
    "password": "Test123!@#"
  },
  "testVendor": {
    "email": "vendor@test.com",
    "password": "Test123!@#"
  },
  "testAdmin": {
    "email": "admin@test.com",
    "password": "Admin123!@#"
  }
}
```

---

## 📖 Quick Start Guide

### 1. Register a User

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}
```

### 2. Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### 3. Use Access Token

```bash
GET /api/v1/users/me
Authorization: Bearer <your_access_token>
```

---

## 🛠️ Development Tools

### Required Headers

```
Content-Type: application/json
Authorization: Bearer <token>  # For protected routes
```

### CORS Configuration

- **Allowed Origins**: Configurable via environment variables
- **Allowed Methods**: GET, POST, PUT, PATCH, DELETE
- **Allowed Headers**: Content-Type, Authorization

---

## 📋 API Versioning

Current Version: **v1**

- All endpoints are prefixed with `/api/v1`
- Future versions will use `/api/v2`, etc.
- Backward compatibility maintained for at least 6 months

---

## 🔍 Advanced Features

### Search Capabilities

The platform supports advanced search with:
- **Full-text search** across services, vendors
- **Filters** by category, location, price range
- **Sorting** by relevance, price, rating

### Caching

- **Redis caching** for frequently accessed data
- **Cache TTL**: Configurable per endpoint
- **Cache invalidation**: Automatic on data updates

### Image Processing

- **Automatic optimization**: Images optimized on upload
- **Multiple formats**: Original + thumbnails generated
- **CDN delivery**: GridFS with optional CDN integration

---

## 🆘 Support & Resources

- **API Status**: [status.yourplatform.com](https://status.yourplatform.com)
- **Developer Portal**: [developers.yourplatform.com](https://developers.yourplatform.com)
- **Support Email**: support@yourplatform.com
- **GitHub Issues**: [github.com/yourorg/platform/issues](https://github.com/yourorg/platform/issues)

---

## 📚 Related Documentation

- [Project Overview](../01-PROJECT-OVERVIEW.md)
- [Getting Started Guide](../02-GETTING-STARTED.md)
- [Project Structure](../03-PROJECT-STRUCTURE.md)
- [Authentication Flow](./01-AUTHENTICATION-API.md)
- [Payment Integration](./06-PAYMENT-API.md)

---

## 🔒 Security Best Practices

1. **Never share access tokens** publicly
2. **Use HTTPS** in production
3. **Rotate tokens regularly**
4. **Validate all input** on client-side
5. **Handle errors gracefully**
6. **Log security events**
7. **Implement rate limiting** on sensitive operations
8. **Use strong passwords** (min 8 chars, uppercase, lowercase, number, special char)

---

**Last Updated**: January 2025  
**API Version**: 1.0.0  
**Document Version**: 1.0
