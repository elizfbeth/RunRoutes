# Route Finder - Full-Stack Web Application

A comprehensive full-stack web application that helps users discover, generate, and customize running, cycling, and walking routes based on their preferences. The app features interactive maps, route analytics, and personalized recommendations using Google Maps API.

## 🚀 Features

### Core Features
- **User Authentication**: Secure signup/login with Firebase Authentication
- **User Profiles**: Customizable profiles with route preferences
- **Route Discovery**: Search and filter routes by distance, terrain, and type
- **Route Generation**: Generate custom routes using Google Maps Directions API
- **Interactive Maps**: Visualize routes on Google Maps with elevation data
- **Route Management**: Create, read, update, and delete routes (CRUD)
- **Favorites**: Save favorite routes for quick access
- **Route Analytics**: View distance, elevation gain, estimated time, and difficulty

### Technical Features
- RESTful API with Express.js backend
- PostgreSQL database with Supabase
- Vue.js frontend with Vite
- Tailwind CSS for styling
- Google Maps API integration
- Firebase-based authentication
- Dockerized deployment
- Unit tests for frontend and backend

## 🛠️ Tech Stack

### Frontend
- **Vue 3** with Vite
- **Vue Router** for navigation
- **Pinia** for state management
- **Tailwind CSS** for styling
- **@googlemaps/js-api-loader** for map integration
- **Recharts** for elevation profile visualization
- **Firebase** for authentication
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database (via Supabase)
- **Firebase Admin SDK** for authentication
- **express-validator** for input validation
- **Axios** for external API calls

### Testing
- **Jest** for unit testing
- **Supertest** for API testing
- **Vitest** for frontend testing

### Deployment
- **Docker** for containerization
- **Render/Railway** for backend deployment
- **Vercel/Netlify** for frontend deployment

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (or use Supabase free tier)
- Docker (optional, for containerized deployment)
- Google Maps API key

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd RunRoutes
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Database Setup

**Option A: Using Supabase (Recommended for free tier)**

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the schema from `backend/database/schema.sql`
4. Copy your database connection string from Project Settings → Database

**Option B: Local PostgreSQL**

1. Install PostgreSQL locally
2. Create a database:
```sql
CREATE DATABASE runroutes;
```
3. Run the schema:
```bash
psql -U postgres -d runroutes -f backend/database/schema.sql
```

#### Environment Variables

Create a `.env` file in the `backend` directory:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@host:port/database
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
# OR use FIREBASE_PROJECT_ID for default credentials
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### Run Backend

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### Run Frontend

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication → Email/Password sign-in method
4. Go to Project Settings → Service Accounts
5. Generate a new private key (download JSON file)
6. Copy the JSON content to `FIREBASE_SERVICE_ACCOUNT` in backend `.env` (as a JSON string)
7. Get your Firebase config from Project Settings → General → Your apps
8. Add Firebase config to frontend `.env` file

### 5. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Elevation API
4. Create credentials (API Key)
5. Restrict the API key to your domain (for production)
6. Add the API key to your `.env` files

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Database: `localhost:5432`

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Create user profile (after Firebase registration)

### Users

- `GET /api/users/profile` - Get user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)

### Routes

- `GET /api/routes` - Get all routes (with filters)
- `GET /api/routes/:id` - Get a single route
- `POST /api/routes` - Create a new route (Protected)
- `POST /api/routes/generate` - Generate a route using Google Maps (Protected)
- `PUT /api/routes/:id` - Update a route (Protected, owner only)
- `DELETE /api/routes/:id` - Delete a route (Protected, owner only)

### Favorites

- `GET /api/favorites` - Get user's favorite routes (Protected)
- `POST /api/favorites/:routeId` - Add route to favorites (Protected)
- `DELETE /api/favorites/:routeId` - Remove route from favorites (Protected)

## 🗄️ Database Schema

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `uid` (VARCHAR, UNIQUE) - Firebase UID
- `email` (VARCHAR, UNIQUE)
- `name` (VARCHAR)
- `location` (VARCHAR)
- `preferences` (JSONB)
- `profile_picture_url` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Routes Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, FK → Users)
- `route_name` (VARCHAR)
- `distance` (DECIMAL)
- `estimated_time` (INTEGER)
- `terrain_type` (VARCHAR)
- `elevation_gain` (DECIMAL)
- `waypoints` (JSONB)
- `visibility` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Favorites Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, FK → Users)
- `route_id` (INTEGER, FK → Routes)
- `created_at` (TIMESTAMP)


## 📝 Project Structure

```
RunRoutes/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── firebase.js
│   ├── database/
│   │   └── schema.sql
│   ├── middleware/
│   │   └── auth.js (Firebase token verification)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── routes.js
│   │   ├── users.js
│   │   └── favorites.js
│   ├── services/
│   │   └── mapsService.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   └── routes.test.js
│   ├── utils/
│   │   ├── validation.js
│   │   └── userHelper.js
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.vue
│   │   ├── stores/
│   │   │   └── auth.js (Pinia store)
│   │   ├── pages/
│   │   │   ├── Home.vue
│   │   │   ├── Login.vue
│   │   │   ├── Register.vue
│   │   │   ├── Dashboard.vue
│   │   │   ├── RouteSearch.vue
│   │   │   ├── RouteDetails.vue
│   │   │   └── Profile.vue
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── config/
│   │   │   └── firebase.js
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🔒 Security Considerations

- Authentication handled by Firebase (secure password hashing)
- Firebase ID tokens for API authentication
- Protected routes require authentication
- Input validation on all endpoints
- SQL injection prevention using parameterized queries
- CORS configured for frontend domain
- Firebase Admin SDK verifies tokens server-side

## 🎯 Future Enhancements

- [ ] OAuth integration (Google/GitHub)
- [ ] Weather API integration
- [ ] Route sharing via link
- [ ] Comments and ratings on routes
- [ ] Leaderboard for popular routes
- [ ] Offline map caching
- [ ] Strava API integration
- [ ] Real-time route tracking
- [ ] Mobile app (React Native)

## 📚 Documentation

### Quick Start
- [QUICKSTART.md](./QUICKSTART.md) - Fast setup guide
- [API.md](./API.md) - Basic API reference

### Documentation
- [API Documentation](./docs/API_DOCUMENTATION.md) - Full API reference with examples
- [Architecture](./docs/ARCHITECTURE.md) - System design and technical details
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions


---

**Built with Vue.js, Node.js, Firebase, and Google Maps API**

