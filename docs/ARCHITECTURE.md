# RunRoutes Architecture

This document provides an overview of the RunRoutes application architecture, including system design, data flow, and technical decisions.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Design](#database-design)
6. [Authentication Flow](#authentication-flow)
7. [External Services](#external-services)
8. [Security Architecture](#security-architecture)
9. [Performance Optimizations](#performance-optimizations)
10. [Deployment Architecture](#deployment-architecture)

---

## System Overview

RunRoutes is a full-stack web application built with a client-server architecture, utilizing modern web technologies and cloud services.

### Technology Stack

**Frontend:**
- **Framework**: Vue.js 3 (Composition API)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: Tailwind CSS
- **Maps**: Google Maps JavaScript API

**Backend:**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase) / SQLite (local)
- **Authentication**: Firebase Authentication + Firebase Admin SDK
- **External APIs**: Google Maps API (Directions, Elevation)

**Infrastructure:**
- **Hosting**: Vercel (frontend), Railway/Render (backend)
- **Database**: Supabase (managed PostgreSQL)
- **Authentication**: Firebase
- **CI/CD**: GitHub Actions

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Vue.js     │───▶│    Pinia     │───▶│ Vue Router   │     │
│  │  Components  │    │    Stores    │    │   (SPA)      │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                     │                    │            │
│         └─────────────────────┼────────────────────┘            │
│                               │                                 │
│                    ┌──────────▼──────────┐                     │
│                    │   Axios API Client   │                     │
│                    │  (with interceptors) │                     │
│                    └──────────┬──────────┘                     │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                    ┏━━━━━━━━━━━▼━━━━━━━━━━━┓
                    ┃      HTTP/HTTPS        ┃
                    ┗━━━━━━━━━━━┬━━━━━━━━━━━┛
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                         SERVER LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Express.js Application                      │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │          Middleware Pipeline                      │   │  │
│  │  │  - Helmet (security headers)                      │   │  │
│  │  │  - CORS                                            │   │  │
│  │  │  - Rate limiting                                   │   │  │
│  │  │  - Body parsing & size limits                     │   │  │
│  │  │  - Data sanitization (XSS, SQL injection)        │   │  │
│  │  │  - Security logging                               │   │  │
│  │  │  - Firebase token verification                    │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │              Route Handlers                       │   │  │
│  │  │  /api/auth     - User registration                │   │  │
│  │  │  /api/routes   - Route CRUD & generation         │   │  │
│  │  │  /api/users    - User profile management         │   │  │
│  │  │  /api/favorites - Favorite routes                │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │          Business Logic (Services)                │   │  │
│  │  │  - Route generation (Google Maps API)            │   │  │
│  │  │  - Difficulty calculation                         │   │  │
│  │  │  - User helpers                                   │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                    │                    │             │
└─────────┼────────────────────┼────────────────────┼─────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │    Firebase      │  │  Google Maps API │
│   (Supabase)     │  │  Admin SDK       │  │  - Directions    │
│                  │  │  (Token verify)  │  │  - Elevation     │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Firebase Auth   │  │  Google Maps JS  │                    │
│  │  (Client SDK)    │  │      API         │                    │
│  │  - Email/Pass    │  │  (Frontend only) │                    │
│  │  - Google OAuth  │  │                  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Component Hierarchy

```
App.vue
├── Navbar.vue
└── <router-view>
    ├── Home.vue
    ├── Login.vue
    ├── Register.vue
    ├── Dashboard.vue
    │   ├── EmptyState.vue
    │   ├── SkeletonLoader.vue
    │   └── ErrorMessage.vue
    ├── RouteSearch.vue
    │   ├── LoadingSpinner.vue
    │   ├── ErrorMessage.vue
    │   └── Google Maps (embedded)
    ├── RouteDetails.vue
    │   ├── ShareModal.vue
    │   └── Google Maps (embedded)
    ├── Profile.vue
    └── Preferences.vue
        └── ProgressBar.vue
```

### State Management (Pinia)

**Stores:**
- **auth.js**: User authentication state, Firebase operations
  - State: `user`, `token`, `loading`
  - Actions: `login()`, `register()`, `logout()`, `loginWithGoogle()`

**Why Pinia?**
- Official Vue 3 state management
- Better TypeScript support than Vuex
- Simpler API with less boilerplate
- Built-in devtools integration

### Routing Strategy

**Vue Router Configuration:**
```javascript
// Route-based code splitting (lazy loading)
{
  path: '/dashboard',
  component: () => import('./pages/Dashboard.vue'),
  meta: { requiresAuth: true }
}
```

**Navigation Guards:**
- `beforeEach`: Check authentication before route entry
- Redirect unauthenticated users to `/login`
- Redirect authenticated users from `/login` to `/dashboard`

### API Client Design

**Axios Interceptors:**
```
Request Interceptor
    ↓
[Add Firebase ID Token to headers]
    ↓
Send Request
    ↓
Response Interceptor
    ↓
[Handle 401: Refresh token & retry]
    ↓
Return Response
```

### Composables (Reusable Logic)

- **useFormValidation**: Form validation logic
  - Email validation
  - Password strength checking
  - Real-time error display

- **usePreferences**: User preferences management
  - Load/save to localStorage
  - Unit conversions (km ↔ miles)
  - Default settings

---

## Backend Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│        Route Handlers Layer          │  (HTTP endpoints)
├─────────────────────────────────────┤
│       Business Logic Layer           │  (Services)
├─────────────────────────────────────┤
│       Data Access Layer              │  (Database queries)
├─────────────────────────────────────┤
│       Database Layer                 │  (PostgreSQL/SQLite)
└─────────────────────────────────────┘
```

### Middleware Pipeline

**Order matters!** Middleware executes in sequence:

1. **Helmet**: Set security headers
2. **CORS**: Allow frontend origin
3. **Compression**: Gzip responses
4. **Body Parsing**: Parse JSON (with size limits)
5. **Data Sanitization**: Remove HTML/script tags
6. **XSS Protection**: Prevent cross-site scripting
7. **Security Logging**: Log suspicious activity
8. **Rate Limiting**: Prevent abuse
9. **Route Handlers**: Application logic
10. **Error Handler**: Catch and format errors

### Error Handling Strategy

```javascript
// Async wrapper catches all errors
asyncHandler(async (req, res) => {
  // Route logic
  // Any error thrown here is caught automatically
})
    ↓
[Error occurs]
    ↓
Global Error Handler
    ↓
[Log error, format response]
    ↓
Send JSON error response
```

**Error Response Format:**
```json
{
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Invalid format" }
  ]
}
```

### Service Layer

**mapsService.js:**
- `generateRoute()`: Call Google Maps Directions API
- `calculateDifficulty()`: Determine route difficulty
- Elevation data fetching
- Polyline encoding/decoding

**Why separate services?**
- Reusability across routes
- Easier testing (mock services)
- Cleaner route handlers
- Single responsibility principle

---

## Database Design

### Schema

**users table:**
```sql
id                  SERIAL PRIMARY KEY
uid                 VARCHAR(255) UNIQUE (Firebase UID)
email               VARCHAR(255) UNIQUE
name                VARCHAR(255)
location            VARCHAR(255)
preferences         JSONB (flexible user settings)
profile_picture_url VARCHAR(500)
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**routes table:**
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER (FK → users)
route_name      VARCHAR(255)
distance        DECIMAL(10, 2) (in kilometers)
estimated_time  INTEGER (in minutes)
terrain_type    VARCHAR(50) (road/trail/track/mixed)
elevation_gain  DECIMAL(10, 2) (in meters)
waypoints       JSONB (array of {lat, lng, elevation})
visibility      VARCHAR(20) (public/private)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**favorites table:**
```sql
id         SERIAL PRIMARY KEY
user_id    INTEGER (FK → users)
route_id   INTEGER (FK → routes)
created_at TIMESTAMP
UNIQUE(user_id, route_id) (prevent duplicates)
```

### Indexing Strategy

**Why indexes?**
- Speed up queries by 10-100x
- Essential for JOIN operations
- Improve WHERE clause performance

**Applied indexes:**
```sql
-- Users
idx_users_uid (uid)           -- Auth lookups
idx_users_email (email)       -- Login/registration

-- Routes
idx_routes_user_id (user_id)  -- User's routes
idx_routes_visibility (visibility) -- Public route filtering
idx_routes_distance (distance) -- Distance filtering
idx_routes_user_visibility (user_id, visibility) -- Combined

-- Favorites
idx_favorites_user_id (user_id)  -- User's favorites
idx_favorites_route_id (route_id) -- Route popularity
idx_favorites_user_route (user_id, route_id) -- Composite
```

### JSONB Usage

**Why JSONB for waypoints and preferences?**
- Flexible schema (no migrations for new fields)
- Efficient storage (binary format)
- Queryable with PostgreSQL JSON operators
- Perfect for variable-length arrays

**Example:**
```json
{
  "waypoints": [
    { "lat": 37.7749, "lng": -122.4194, "elevation": 50 },
    { "lat": 37.7750, "lng": -122.4195, "elevation": 55 }
  ]
}
```

---

## Authentication Flow

### Registration Flow

```
User submits form
    ↓
Frontend: Firebase createUserWithEmailAndPassword()
    ↓
[Firebase creates user]
    ↓
Frontend: Get Firebase ID token
    ↓
Frontend: POST /api/auth/register
    with { uid, email, name }
    ↓
Backend: Verify token with Firebase Admin SDK
    ↓
Backend: Create user profile in PostgreSQL
    ↓
Return success
```

### Login Flow

```
User submits credentials
    ↓
Frontend: Firebase signInWithEmailAndPassword()
    ↓
[Firebase verifies credentials]
    ↓
Frontend: Get Firebase ID token
    ↓
Frontend: Store token in Pinia store
    ↓
All API requests include token in header
```

### Token Verification (Backend)

```
Request arrives with Authorization header
    ↓
Extract Bearer token
    ↓
Firebase Admin SDK: verifyIdToken(token)
    ↓
[Token valid?]
    ├─ Yes: Attach user to req.user, continue
    └─ No: Return 401 Unauthorized
```

### Token Refresh

```
API request returns 401
    ↓
Axios interceptor catches error
    ↓
Firebase: getIdToken(true) // Force refresh
    ↓
[Get new token]
    ↓
Retry original request with new token
```

---

## External Services

### Firebase Authentication

**Features used:**
- Email/password authentication
- Google OAuth integration
- Token generation and verification
- Password reset emails

**Integration points:**
- Frontend: Firebase Client SDK
- Backend: Firebase Admin SDK (token verification only)

**Why Firebase?**
- Production-ready auth system
- Built-in security (rate limiting, brute force protection)
- OAuth providers handled automatically
- No need to store passwords

### Google Maps API

**APIs used:**

1. **JavaScript API** (frontend):
   - Display interactive maps
   - Place markers
   - Draw polylines
   - Map styles

2. **Directions API** (backend):
   - Calculate routes between points
   - Get turn-by-turn directions
   - Waypoint optimization
   - Travel time estimation

3. **Elevation API** (backend):
   - Get elevation at specific coordinates
   - Elevation profiles along routes
   - Calculate elevation gain

**Why Google Maps?**
- Most comprehensive mapping data
- Reliable and fast
- Excellent API documentation
- Wide device/browser support

---

## Security Architecture

### Defense in Depth

Multiple layers of security:

**Layer 1: Network**
- HTTPS only (production)
- CORS restrictions

**Layer 2: Rate Limiting**
- IP-based rate limiting
- Per-endpoint limits
- Prevents brute force attacks

**Layer 3: Input Validation**
- express-validator
- Sanitize all user input
- Validate data types

**Layer 4: Data Sanitization**
- XSS prevention (remove scripts)
- SQL injection prevention (parameterized queries)
- NoSQL injection prevention

**Layer 5: Authentication**
- Firebase token verification
- Token expiration (1 hour)
- Automatic token refresh

**Layer 6: Authorization**
- Check resource ownership
- Private routes require auth
- User-specific data filtering

**Layer 7: Security Headers**
- Helmet.js for HTTP headers
- Content Security Policy
- X-Frame-Options

### Rate Limiting Configuration

```javascript
// General API: 100 req/15min
apiLimiter: 100 requests per 15 minutes

// Auth endpoints: 5 req/15min (strict)
authLimiter: 5 requests per 15 minutes

// Route generation: 10 req/15min
generateLimiter: 10 requests per 15 minutes

// Route modification: 30 req/15min
modifyLimiter: 30 requests per 15 minutes
```

### Sensitive Data Protection

**Environment variables:**
- Never committed to Git
- Stored in `.env` files
- Different values per environment

**Firebase service account:**
- `.gitignore` rules prevent commits
- Loaded from environment variables in production
- Local file only for development

---

## Performance Optimizations

### Frontend Optimizations

**1. Code Splitting**
```javascript
// Route-based lazy loading
component: () => import('./pages/Dashboard.vue')
```
- Each page loaded on demand
- Reduces initial bundle size
- Faster first paint

**2. API Response Caching**
```javascript
// Cache frequently accessed data
apiCache.set('dashboard-routes', data, 5 * 60 * 1000); // 5 min
```
- Reduces API calls
- Faster page loads
- Better UX

**3. Debouncing**
```javascript
// Debounce search/filter inputs
const debouncedSearch = debounce(search, 300);
```
- Reduces API calls while typing
- Prevents rate limit issues

**4. Image Optimization**
- Lazy loading images
- Responsive image sizes
- WebP format support

### Backend Optimizations

**1. Database Indexing**
- 13 strategic indexes
- Query performance improved 10-100x
- Especially critical for JOINs

**2. Connection Pooling**
```javascript
// PostgreSQL connection pool
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000
});
```
- Reuse database connections
- Faster query execution
- Reduced overhead

**3. Response Compression**
```javascript
// Gzip compression
app.use(compression());
```
- Reduces payload size by 70-90%
- Faster transfer over network

**4. Query Optimization**
- Select only needed columns
- Limit results when appropriate
- Use JOINs efficiently

---

## Deployment Architecture

### Production Environment

```
┌──────────────────────────────────────────────────────────┐
│                    Client Browser                         │
└──────────────┬───────────────────────────┬───────────────┘
               │                           │
               │ HTTPS                     │ HTTPS
               │                           │
        ┌──────▼──────────┐        ┌──────▼──────────┐
        │   Vercel CDN    │        │  Railway/Render  │
        │   (Frontend)    │        │    (Backend)     │
        │  - Static files │        │  - Node.js app   │
        │  - Edge network │        │  - API endpoints │
        └─────────────────┘        └──────┬───────────┘
                                          │
                        ┌─────────────────┼─────────────────┐
                        │                 │                 │
                 ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
                 │  Supabase   │  │  Firebase   │  │ Google Maps │
                 │ (PostgreSQL)│  │    Auth     │  │     API     │
                 └─────────────┘  └─────────────┘  └─────────────┘
```

### CI/CD Pipeline (GitHub Actions)

```
Developer pushes to main
    ↓
GitHub Actions triggered
    ↓
[Install dependencies]
    ↓
[Run linters]
    ↓
[Run backend tests with coverage]
    ↓
[Run frontend tests]
    ↓
[Security audit (npm audit)]
    ↓
[All checks pass?]
    ├─ Yes: Deploy to production
    └─ No: Fail build, notify developer
```

### Environment Configuration

**Development:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5001
- Database: SQLite or local PostgreSQL

**Production:**
- Frontend: https://runroutes.vercel.app
- Backend: https://api.runroutes.com
- Database: Supabase PostgreSQL

---

## Design Decisions

### Why Vue.js over React?

- Gentler learning curve
- Better performance (smaller bundle)
- Composition API similar to React hooks
- Official router and state management

### Why PostgreSQL over MongoDB?

- Structured data (routes, users, favorites)
- ACID compliance for data integrity
- Better for relational data (JOIN operations)
- Strong data typing

### Why Firebase Auth over JWT?

- Production-ready out of the box
- Built-in security features
- OAuth providers included
- No need to manage password hashing
- Automatic token refresh
- Better than rolling our own

### Why Express.js?

- Industry standard for Node.js
- Huge ecosystem of middleware
- Simple and unopinionated
- Perfect for REST APIs

### Why Tailwind CSS?

- Utility-first approach
- No CSS file switching
- Purges unused styles
- Consistent design system
- Responsive by default

---

## Future Architectural Considerations

### Scalability

**If user base grows:**
- Add Redis for session/cache storage
- Implement message queue (Bull/RabbitMQ) for async tasks
- Add read replicas for database
- CDN for static assets

### Microservices

**Potential separation:**
- Auth service
- Route generation service
- User profile service
- Notification service

### Real-time Features

**WebSocket integration:**
- Live route sharing
- Real-time location tracking
- Collaborative route planning

### Offline Support

**Progressive Web App:**
- Service worker for offline caching
- IndexedDB for local data
- Background sync

---

This architecture provides a solid foundation for a scalable, secure, and maintainable application while remaining simple enough for rapid development and deployment.

