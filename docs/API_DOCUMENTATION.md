# API Documentation

## Base URL
```
Development: http://localhost:5001/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Rate Limits

- **General API endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Route generation**: 10 requests per 15 minutes per authenticated user
- **Route modification** (POST/PUT/DELETE): 30 requests per 15 minutes per authenticated user

### Rate Limit Headers

All responses include rate limit information:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Endpoints

### Health Check

#### GET /health
Check API status.

**Authentication**: None required

**Response**:
```json
{
  "status": "ok",
  "message": "Run Routes API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## Authentication Endpoints

### Register User Profile

#### POST /auth/register
Create user profile in database after Firebase authentication.

**Authentication**: None (Firebase handles auth)

**Request Body**:
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Validation**:
- `uid`: Required, string
- `email`: Required, valid email format
- `name`: Required, 2-100 characters

**Response** (201 Created):
```json
{
  "message": "User profile created successfully",
  "user": {
    "id": 1,
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors**:
- `400`: Missing required fields or invalid data
- `400`: User already exists

---

## Route Endpoints

### Get All Routes

#### GET /routes
Retrieve routes with optional filters.

**Authentication**: None (public routes visible to all)

**Query Parameters**:
- `user_id` (optional): Filter by user ID or "me" for authenticated user
- `min_distance` (optional): Minimum distance in km
- `max_distance` (optional): Maximum distance in km
- `visibility` (optional): "public" or "private"

**Example Request**:
```
GET /routes?min_distance=5&max_distance=10&visibility=public
```

**Response** (200 OK):
```json
{
  "routes": [
    {
      "id": 1,
      "user_id": 1,
      "user_name": "John Doe",
      "route_name": "Morning Run",
      "distance": 5.5,
      "estimated_time": 33,
      "elevation_gain": 120,
      "terrain_type": "mixed",
      "waypoints": [
        { "lat": 37.7749, "lng": -122.4194 },
        { "lat": 37.7750, "lng": -122.4195 }
      ],
      "visibility": "public",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Route by ID

#### GET /routes/:id
Retrieve a specific route by ID.

**Authentication**: None

**Response** (200 OK):
```json
{
  "route": {
    "id": 1,
    "user_id": 1,
    "user_name": "John Doe",
    "route_name": "Morning Run",
    "distance": 5.5,
    "estimated_time": 33,
    "elevation_gain": 120,
    "terrain_type": "mixed",
    "waypoints": [
      { "lat": 37.7749, "lng": -122.4194, "elevation": 50 },
      { "lat": 37.7750, "lng": -122.4195, "elevation": 55 }
    ],
    "visibility": "public",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- `404`: Route not found

---

### Create Route

#### POST /routes
Create a new route manually.

**Authentication**: Required

**Rate Limit**: 30 requests per 15 minutes

**Request Body**:
```json
{
  "route_name": "Evening Jog",
  "distance": 7.2,
  "estimated_time": 45,
  "elevation_gain": 80,
  "waypoints": [
    { "lat": 37.7749, "lng": -122.4194 },
    { "lat": 37.7750, "lng": -122.4195 }
  ],
  "visibility": "public"
}
```

**Validation**:
- `route_name`: Required, 3-255 characters
- `distance`: Required, number > 0
- `waypoints`: Required, array with at least 2 points
- `visibility`: Optional, "public" or "private" (default: "private")

**Response** (201 Created):
```json
{
  "message": "Route created successfully",
  "route": {
    "id": 2,
    "user_id": 1,
    "route_name": "Evening Jog",
    "distance": 7.2,
    "estimated_time": 45,
    "elevation_gain": 80,
    "waypoints": [...],
    "visibility": "public",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- `400`: Validation errors
- `401`: Unauthorized (missing or invalid token)
- `404`: User not found

---

### Generate Route

#### POST /routes/generate
Generate a route using Google Maps API.

**Authentication**: Optional (allows development mode)

**Rate Limit**: 10 requests per 15 minutes

**Request Body**:
```json
{
  "start_point": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "end_point": {
    "lat": 37.7850,
    "lng": -122.4094
  },
  "route_name": "Generated Route",
  "preferences": {
    "avoid_highways": true,
    "terrain": "mixed"
  }
}
```

**Validation**:
- `start_point`: Required, object with valid lat/lng
- `end_point`: Required, object with valid lat/lng
- `route_name`: Optional, defaults to "Generated Route [date]"

**Response** (201 Created):
```json
{
  "message": "Route generated successfully",
  "route": {
    "id": 3,
    "user_id": 1,
    "route_name": "Generated Route",
    "distance": 5.8,
    "estimated_time": 35,
    "elevation_gain": 95,
    "difficulty": "moderate",
    "waypoints": [...],
    "polyline": "encoded-polyline-string",
    "bounds": {
      "northeast": { "lat": 37.7850, "lng": -122.4094 },
      "southwest": { "lat": 37.7749, "lng": -122.4194 }
    },
    "visibility": "public",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- `400`: Invalid coordinates or missing required fields
- `500`: Google Maps API error
- `503`: Database connection error

---

### Update Route

#### PUT /routes/:id
Update an existing route (owner only).

**Authentication**: Required

**Rate Limit**: 30 requests per 15 minutes

**Request Body** (all fields optional):
```json
{
  "route_name": "Updated Name",
  "distance": 6.0,
  "estimated_time": 40,
  "elevation_gain": 100,
  "waypoints": [...],
  "visibility": "private"
}
```

**Response** (200 OK):
```json
{
  "message": "Route updated successfully",
  "route": {
    "id": 1,
    "route_name": "Updated Name",
    ...
  }
}
```

**Errors**:
- `400`: No fields to update or validation errors
- `401`: Unauthorized
- `403`: Not authorized to update this route
- `404`: Route not found

---

### Delete Route

#### DELETE /routes/:id
Delete a route (owner only).

**Authentication**: Required

**Rate Limit**: 30 requests per 15 minutes

**Response** (200 OK):
```json
{
  "message": "Route deleted successfully"
}
```

**Errors**:
- `401`: Unauthorized
- `403`: Not authorized to delete this route
- `404`: Route not found

---

## User Endpoints

### Get User Profile

#### GET /users/profile
Get authenticated user's profile.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "user": {
    "id": 1,
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "location": "San Francisco, CA",
    "preferences": {
      "pace": 6,
      "terrain": "mixed"
    },
    "profile_picture_url": "https://...",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Update User Profile

#### PUT /users/profile
Update authenticated user's profile.

**Authentication**: Required

**Request Body** (all fields optional):
```json
{
  "name": "Jane Doe",
  "location": "Los Angeles, CA",
  "preferences": {
    "pace": 7,
    "terrain": "road"
  },
  "profile_picture_url": "https://..."
}
```

**Response** (200 OK):
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    ...
  }
}
```

---

## Favorites Endpoints

### Get User Favorites

#### GET /favorites
Get authenticated user's favorite routes.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "favorites": [
    {
      "id": 1,
      "user_id": 1,
      "route_id": 5,
      "route_name": "Favorite Route",
      "distance": 5.5,
      "elevation_gain": 120,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Add Favorite

#### POST /favorites
Add a route to favorites.

**Authentication**: Required

**Request Body**:
```json
{
  "route_id": 5
}
```

**Response** (201 Created):
```json
{
  "message": "Route added to favorites",
  "favorite": {
    "id": 1,
    "user_id": 1,
    "route_id": 5,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- `400`: Route already in favorites
- `404`: Route not found

---

### Remove Favorite

#### DELETE /favorites/:id
Remove a route from favorites.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Route removed from favorites"
}
```

**Errors**:
- `404`: Favorite not found

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error or bad input
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Authenticated but not authorized for this resource
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Database or external API unavailable

---

## Code Examples

### JavaScript/Fetch

```javascript
// Get routes
const response = await fetch('http://localhost:5001/api/routes?min_distance=5', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Create route (authenticated)
const token = await firebase.auth().currentUser.getIdToken();
const response = await fetch('http://localhost:5001/api/routes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    route_name: 'My Route',
    distance: 5.5,
    waypoints: [...]
  })
});
```

### cURL

```bash
# Get routes
curl http://localhost:5001/api/routes

# Create route
curl -X POST http://localhost:5001/api/routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "route_name": "My Route",
    "distance": 5.5,
    "waypoints": [
      {"lat": 37.7749, "lng": -122.4194},
      {"lat": 37.7750, "lng": -122.4195}
    ]
  }'
```

### Python/Requests

```python
import requests

# Get routes
response = requests.get('http://localhost:5001/api/routes', params={
    'min_distance': 5,
    'max_distance': 10
})
routes = response.json()

# Create route
headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
}
data = {
    'route_name': 'My Route',
    'distance': 5.5,
    'waypoints': [...]
}
response = requests.post('http://localhost:5001/api/routes', 
                        json=data, headers=headers)
```

---

## Pagination

Currently not implemented. All routes are returned in a single response.

**Future Enhancement**: Add pagination with `page` and `limit` query parameters.

---

## Webhooks

Not currently supported.

**Future Enhancement**: Webhook support for route creation/updates.

---

## Versioning

Current version: `v1` (implicit)

**Future Enhancement**: API versioning will be added as `/api/v2/...`

