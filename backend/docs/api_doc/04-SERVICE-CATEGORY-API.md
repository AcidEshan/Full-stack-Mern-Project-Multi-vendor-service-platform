# Service & Category API Documentation

> **Service management, browsing, categories, and admin moderation**

## 📋 Table of Contents

- [Service API](#service-api)
- [Category API](#category-api)

---

## Service API

**Base Path**: `/api/v1/services`

### Public Endpoints

#### 1. Get All Services

Browse all available services.

**Endpoint**: `GET /api/v1/services`  
**Access**: Public

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `category` | string | - | Filter by category ID |
| `search` | string | - | Search by title or description |
| `minPrice` | number | - | Minimum price |
| `maxPrice` | number | - | Maximum price |
| `minRating` | number | - | Minimum vendor rating |
| `sort` | string | `-createdAt` | Sort field |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Professional House Cleaning",
      "description": "Deep cleaning service for your home",
      "price": 150.00,
      "duration": 120,
      "category": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "name": "Cleaning"
      },
      "vendor": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "businessName": "John's Cleaning",
        "rating": 4.8,
        "isActive": true
      },
      "images": [
        "https://gridfs.example.com/file/img1",
        "https://gridfs.example.com/file/img2"
      ],
      "rating": 4.9,
      "totalReviews": 156,
      "isActive": true,
      "isAvailable": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 145
  }
}
```

#### Notes

- Only shows services from **active vendors**
- Only shows **active** and **available** services
- Deactivated vendor services are automatically filtered out

---

#### 2. Get Service by ID

Get detailed service information.

**Endpoint**: `GET /api/v1/services/:serviceId`  
**Access**: Public

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Professional House Cleaning",
    "description": "Comprehensive deep cleaning service...",
    "price": 150.00,
    "duration": 120,
    "category": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Cleaning",
      "icon": "https://gridfs.example.com/file/icon"
    },
    "vendor": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "businessName": "John's Cleaning",
      "businessAddress": "123 Main St",
      "rating": 4.8,
      "totalReviews": 125,
      "isActive": true
    },
    "images": ["https://gridfs.example.com/file/img1"],
    "rating": 4.9,
    "totalReviews": 156,
    "features": ["Eco-friendly products", "Insured", "Background checked"],
    "isActive": true,
    "isAvailable": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Response (Error - 404)

```json
{
  "success": false,
  "message": "Service not available",
  "error": "SERVICE_NOT_AVAILABLE"
}
```

#### Notes

- Returns 404 if vendor is deactivated
- Returns 404 if service is blocked/deleted

---

#### 3. Get Services by Category

Browse services in a specific category.

**Endpoint**: `GET /api/v1/services/categories/:categoryId/services`  
**Access**: Public

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "category": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Cleaning",
      "description": "Professional cleaning services"
    },
    "services": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "title": "House Cleaning",
        "price": 150.00
      }
    ]
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 28
  }
}
```

---

### Vendor Endpoints

#### 4. Create Service

Create new service (vendor only).

**Endpoint**: `POST /api/v1/services/vendor/services`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "title": "Professional House Cleaning",
  "description": "Deep cleaning service for your home",
  "price": 150.00,
  "duration": 120,
  "category": "65a1b2c3d4e5f6g7h8i9j0k2",
  "features": ["Eco-friendly", "Insured"],
  "images": ["image_file_id_1", "image_file_id_2"]
}
```

#### Response (Success - 201)

```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Professional House Cleaning",
    "price": 150.00,
    "isActive": true,
    "createdAt": "2024-01-20T10:00:00.000Z"
  }
}
```

#### Response (Error - 403)

```json
{
  "success": false,
  "message": "Your vendor account is deactivated. Cannot create services.",
  "error": "VENDOR_DEACTIVATED"
}
```

#### Notes

- Deactivated vendors cannot create services
- Images must be uploaded first via Upload API
- Service auto-activated after creation

---

#### 5. Get My Services

Get all services created by authenticated vendor.

**Endpoint**: `GET /api/v1/services/vendor/services`  
**Access**: Vendor  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `isActive` | boolean | - | Filter by active status |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "House Cleaning",
      "price": 150.00,
      "isActive": true,
      "isAvailable": true,
      "totalBookings": 45,
      "revenue": 6750.00
    }
  ]
}
```

---

#### 6. Update Service

Update existing service.

**Endpoint**: `PUT /api/v1/services/vendor/services/:serviceId`  
**Access**: Vendor (own services only)  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "title": "Updated Title",
  "price": 175.00,
  "description": "Updated description"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Service updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Updated Title",
    "price": 175.00
  }
}
```

---

#### 7. Delete Service

Delete a service.

**Endpoint**: `DELETE /api/v1/services/vendor/services/:serviceId`  
**Access**: Vendor (own services only)  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

---

#### 8. Toggle Service Active Status

Activate/deactivate service.

**Endpoint**: `PATCH /api/v1/services/vendor/services/:serviceId/toggle-active`  
**Access**: Vendor (own services only)  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Service status updated",
  "data": {
    "isActive": false
  }
}
```

---

#### 9. Toggle Service Availability

Mark service as available/unavailable temporarily.

**Endpoint**: `PATCH /api/v1/services/vendor/services/:serviceId/toggle-availability`  
**Access**: Vendor (own services only)  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Service availability updated",
  "data": {
    "isAvailable": false
  }
}
```

#### Notes

- Unavailable services don't accept new bookings
- Different from isActive (temporary vs permanent)

---

### Admin Endpoints

#### 10. Get All Services (Admin)

Get all services including blocked/inactive.

**Endpoint**: `GET /api/v1/services/admin/services`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `vendor` | string | Filter by vendor ID |
| `isBlocked` | boolean | Filter by blocked status |

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "House Cleaning",
      "vendor": {
        "businessName": "John's Cleaning",
        "isActive": true
      },
      "isActive": true,
      "isBlocked": false,
      "totalBookings": 45
    }
  ]
}
```

---

#### 11. Block/Unblock Service

Block service from being displayed.

**Endpoint**: `PATCH /api/v1/services/admin/services/:serviceId/block`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "isBlocked": true,
  "reason": "Policy violation"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Service blocked successfully",
  "data": {
    "isBlocked": true,
    "blockedReason": "Policy violation"
  }
}
```

---

## Category API

**Base Path**: `/api/v1/categories`

### Public Endpoints

#### 1. Get All Categories

Get all active categories.

**Endpoint**: `GET /api/v1/categories`  
**Access**: Public

#### Response (Success - 200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Cleaning",
      "description": "Professional cleaning services",
      "icon": "https://gridfs.example.com/file/icon",
      "isActive": true,
      "serviceCount": 45
    }
  ]
}
```

---

#### 2. Get Category by ID

Get specific category details.

**Endpoint**: `GET /api/v1/categories/:categoryId`  
**Access**: Public

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "name": "Cleaning",
    "description": "Professional cleaning services",
    "icon": "https://gridfs.example.com/file/icon",
    "isActive": true,
    "serviceCount": 45,
    "topServices": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "title": "House Cleaning",
        "price": 150.00
      }
    ]
  }
}
```

---

### Admin Endpoints

#### 3. Create Category

Create new category.

**Endpoint**: `POST /api/v1/categories`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "name": "Plumbing",
  "description": "Professional plumbing services",
  "icon": "icon_file_id"
}
```

#### Response (Success - 201)

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
    "name": "Plumbing",
    "isActive": true
  }
}
```

---

#### 4. Update Category

Update existing category.

**Endpoint**: `PUT /api/v1/categories/:categoryId`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Request Body

```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Category updated successfully"
}
```

---

#### 5. Delete Category

Delete category.

**Endpoint**: `DELETE /api/v1/categories/:categoryId`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

#### Notes

- Cannot delete category with existing services
- Must reassign or delete services first

---

#### 6. Toggle Category Status

Activate/deactivate category.

**Endpoint**: `PATCH /api/v1/categories/:categoryId/toggle-active`  
**Access**: Admin, Super Admin  
**Authentication**: Bearer Token required

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Category status updated",
  "data": {
    "isActive": false
  }
}
```

---

**Related Documentation**:
- [Vendor API](./03-VENDOR-API.md)
- [Order API](./05-ORDER-API.md)

**Last Updated**: January 2025
