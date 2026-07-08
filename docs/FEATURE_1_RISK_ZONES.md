# Feature 1: Risk Zone Management

## Overview
Complete CRUD (Create, Read, Update, Delete) operations for defining and managing safety zones on the map.

## Status
✅ **COMPLETED** - All endpoints implemented and tested

## Model Updates

### RiskZone Schema
Enhanced with the following fields:
- **name** (String, required) - Zone name
- **description** (String) - Detailed description
- **riskLevel** (Enum) - 'low', 'medium', 'high', 'critical'
- **polygon** (Array of coordinates) - Boundary points [[lat, lng], ...]
- **center** (Object) - Central point {latitude, longitude}
- **radius** (Number) - Zone radius in km
- **incidents** (Array) - Related incident references
- **createdBy** (ObjectId) - Reference to creating user
- **createdAt** (Date) - Creation timestamp
- **updatedAt** (Date) - Last update timestamp

## API Endpoints

### 1. GET /api/risk-zones
**Get all risk zones** (Public)

```bash
curl http://localhost:5000/api/risk-zones
curl http://localhost:5000/api/risk-zones?riskLevel=high
```

**Query Parameters:**
- `riskLevel` (optional) - Filter by: low, medium, high, critical

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Downtown High Crime Area",
      "description": "Known theft hotspot",
      "riskLevel": "high",
      "polygon": [[40.7128, -74.0060], [40.7135, -74.0055], [40.7140, -74.0065]],
      "center": {
        "latitude": 40.7134,
        "longitude": -74.0060
      },
      "radius": 1.5,
      "createdBy": { "_id": "...", "name": "Admin User" }
    }
  ]
}
```

### 2. GET /api/risk-zones/:id
**Get single risk zone** (Public)

```bash
curl http://localhost:5000/api/risk-zones/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Downtown High Crime Area",
    "description": "Known theft hotspot",
    "riskLevel": "high",
    "polygon": [...],
    "center": {...},
    "incidents": [...]
  }
}
```

### 3. POST /api/risk-zones
**Create new risk zone** (Admin only)

```bash
curl -X POST http://localhost:5000/api/risk-zones \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown High Crime Area",
    "description": "Known theft hotspot near train station",
    "riskLevel": "high",
    "polygon": [
      [40.7128, -74.0060],
      [40.7135, -74.0055],
      [40.7140, -74.0065],
      [40.7133, -74.0070]
    ],
    "center": {
      "latitude": 40.7134,
      "longitude": -74.0060
    },
    "radius": 1.5
  }'
```

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "riskLevel": "string - low|medium|high|critical (required)",
  "polygon": "array of [lat, lng] pairs - min 3 points (required)",
  "center": {
    "latitude": "number (required)",
    "longitude": "number (required)"
  },
  "radius": "number - in km (optional, default: 1)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Risk zone created successfully",
  "data": { /* created zone object */ }
}
```

### 4. PUT /api/risk-zones/:id
**Update risk zone** (Admin only)

```bash
curl -X PUT http://localhost:5000/api/risk-zones/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "riskLevel": "critical",
    "description": "Updated description"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Risk zone updated successfully",
  "data": { /* updated zone object */ }
}
```

### 5. DELETE /api/risk-zones/:id
**Delete risk zone** (Admin only)

```bash
curl -X DELETE http://localhost:5000/api/risk-zones/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Risk zone deleted successfully",
  "data": { /* deleted zone object */ }
}
```

### 6. POST /api/risk-zones/check-location
**Check if location is within any risk zone** (Authenticated)

```bash
curl -X POST http://localhost:5000/api/risk-zones/check-location \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7134,
    "longitude": -74.0060
  }'
```

**Response:**
```json
{
  "success": true,
  "location": {
    "latitude": 40.7134,
    "longitude": -74.0060
  },
  "nearbyZones": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Downtown High Crime Area",
      "riskLevel": "high"
    }
  ],
  "isSafe": false
}
```

### 7. GET /api/risk-zones/stats/summary
**Get risk zone statistics** (Admin only)

```bash
curl http://localhost:5000/api/risk-zones/stats/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "total": 12,
  "byRiskLevel": [
    { "_id": "low", "count": 3 },
    { "_id": "medium", "count": 4 },
    { "_id": "high", "count": 3 },
    { "_id": "critical", "count": 2 }
  ]
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Missing required fields: name, riskLevel, polygon, center"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized - Admin access required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Risk zone not found"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Error creating risk zone",
  "error": "Error details..."
}
```

## Authorization
- **GET endpoints**: Public (no auth required)
- **POST, PUT, DELETE endpoints**: Admin only (requires admin JWT token)
- **POST check-location**: Authenticated users only

## Testing

### Create Test Zone
```bash
# Admin token required
curl -X POST http://localhost:5000/api/risk-zones \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Zone",
    "riskLevel": "medium",
    "polygon": [[40.71, -74.00], [40.72, -74.01], [40.73, -74.00]],
    "center": {"latitude": 40.72, "longitude": -74.005},
    "radius": 2
  }'
```

### Check Location
```bash
curl -X POST http://localhost:5000/api/risk-zones/check-location \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.72, "longitude": -74.005}'
```

## Features Implemented
✅ Full CRUD operations (Create, Read, Update, Delete)
✅ Risk level categorization (low, medium, high, critical)
✅ Geospatial polygon boundaries
✅ Location safety checking
✅ Admin-only modifications
✅ Statistics and aggregation
✅ Validation and error handling
✅ Timestamp tracking (createdAt, updatedAt)
✅ User attribution (createdBy)
✅ Database indexing for geospatial queries

## Next Steps
- Integrate with frontend map visualization
- Add batch import/export for zones
- Create admin dashboard for zone management
- Add zone editing UI
- Implement real-time alerts when users enter critical zones

## Database Schema
```javascript
RiskZone {
  name: String,
  description: String,
  riskLevel: String (enum),
  polygon: [[Number]],
  center: { latitude, longitude },
  radius: Number,
  incidents: [ObjectId],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```
