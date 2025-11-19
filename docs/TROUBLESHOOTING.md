# Troubleshooting Guide

Common issues and their solutions for RunRoutes development and deployment.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Server Issues](#server-issues)
3. [Database Issues](#database-issues)
4. [Authentication Issues](#authentication-issues)
5. [Google Maps Issues](#google-maps-issues)
6. [Frontend Issues](#frontend-issues)
7. [API Issues](#api-issues)
8. [Deployment Issues](#deployment-issues)

---

## Installation Issues

### Error: Node version too old

**Symptom:**
```
Error: The engine "node" is incompatible with this module
```

**Solution:**
```bash
# Check your Node version
node --version

# Install Node 18 or higher
# Using nvm:
nvm install 18
nvm use 18

# Or download from nodejs.org
```

---

### Error: npm install fails

**Symptom:**
```
npm ERR! code EACCES
npm ERR! syscall access
```

**Solution:**
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) ~/.config

# Or use nvm (recommended)
```

---

### Error: better-sqlite3 module compilation

**Symptom:**
```
Error: The module was compiled against a different Node.js version
```

**Solution:**
```bash
# Rebuild the native module
cd backend
npm rebuild better-sqlite3

# Or reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Server Issues

### Error: Port already in use (EADDRINUSE)

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solution:**

**Option 1 - Kill the process:**
```bash
# macOS/Linux
lsof -ti:5001 | xargs kill -9

# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

**Option 2 - Use different port:**
```bash
# In backend/.env
PORT=5002

# Update frontend/vite.config.js proxy target accordingly
```

---

### Error: Cannot find module 'xyz'

**Symptom:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
# Ensure you're in the correct directory
cd backend  # or frontend

# Reinstall dependencies
npm install

# If still failing, clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Server starts but can't access localhost

**Symptom:**
- Server logs show "Server running on port 5001"
- Browser shows "ERR_CONNECTION_REFUSED"

**Solution:**
```bash
# Check if server is actually running
curl http://localhost:5001/api/health

# Check firewall settings
# Ensure localhost is not blocked

# Try 127.0.0.1 instead of localhost
curl http://127.0.0.1:5001/api/health
```

---

## Database Issues

### Error: Database connection failed

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution for PostgreSQL:**
```bash
# Check if PostgreSQL is running
# macOS:
brew services list

# Start PostgreSQL
brew services start postgresql

# Check connection string in .env
DATABASE_URL=postgresql://user:password@localhost:5432/runroutes
```

**Solution for Supabase:**
```bash
# Verify connection string from Supabase dashboard
# Settings > Database > Connection string

# Test connection
psql "YOUR_CONNECTION_STRING_HERE"
```

**Fallback to SQLite:**
```bash
# In backend/.env
USE_SQLITE=true
DATABASE_URL=  # Comment out or leave empty

# Restart server - SQLite will auto-initialize
```

---

### Error: Trigger already exists

**Symptom:**
```
ERROR: 42710: trigger "update_users_updated_at" already exists
```

**Solution:**
```bash
# Use indexes-only script instead
psql $DATABASE_URL -f backend/database/indexes_only.sql

# Or via Supabase Dashboard:
# SQL Editor > Paste contents of indexes_only.sql > Run
```

---

### Database queries are slow

**Symptom:**
- API responses take >2 seconds
- Database CPU usage high

**Solution:**
```bash
# Apply database indexes
psql $DATABASE_URL -f backend/database/indexes_only.sql

# Check query performance
EXPLAIN ANALYZE SELECT * FROM routes WHERE user_id = 1;

# Optimize slow queries by adding indexes
```

---

## Authentication Issues

### Error: Firebase API key not valid

**Symptom:**
```
Firebase: Error (auth/api-key-not-valid)
```

**Solution:**
```bash
# Check frontend/.env
# Ensure VITE_FIREBASE_API_KEY is set correctly

# Get correct API key from Firebase Console:
# Project Settings > General > Web API Key

# Example format:
VITE_FIREBASE_API_KEY=AIzaSyC...

# Restart frontend dev server
```

---

### Error: Firebase app not initialized

**Symptom:**
```
Error: Firebase app named '[DEFAULT]' already exists
```

**Solution:**
```javascript
// In firebase.js - use getApps() to check
import { getApps, initializeApp } from 'firebase/app';

if (!getApps().length) {
  initializeApp(firebaseConfig);
}
```

---

### Error: Token verification failed (backend)

**Symptom:**
```
Error: Firebase Admin SDK not initialized
```

**Solution:**
```bash
# Check backend/.env has Firebase credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Or place service account JSON in backend/
# Add to .gitignore!
```

---

### User can't login after password change

**Symptom:**
- User changes password in Firebase Console
- Can't login with new password

**Solution:**
```bash
# Firebase password changes require email verification
# User should check email and click verification link

# Or reset password via app:
# Login page > Forgot Password
```

---

## Google Maps Issues

### Error: Map container is null

**Symptom:**
```
Error: Map: Expected mapDiv of type HTMLElement but was passed null
```

**Solution:**
```vue
<!-- Ensure map div is always in DOM -->
<div ref="mapContainer" style="width: 100%; height: 600px;"></div>

<!-- In setup() -->
import { nextTick } from 'vue';

await loader.load();
await nextTick(); // Wait for DOM update

// Retry logic
let retries = 0;
while (!mapContainer.value && retries < 10) {
  await nextTick();
  retries++;
}
```

---

### Error: Google Maps API key invalid

**Symptom:**
```
Google Maps JavaScript API error: InvalidKeyMapError
```

**Solution:**
```bash
# Check API key in both .env files
# Frontend: VITE_GOOGLE_MAPS_API_KEY
# Backend: GOOGLE_MAPS_API_KEY

# Verify API key in Google Cloud Console:
# APIs & Services > Credentials

# Check API key restrictions:
# - Remove HTTP referrer restrictions for localhost
# - Or add: http://localhost:3000/*

# Enable required APIs:
# - Maps JavaScript API (frontend)
# - Directions API (backend)
# - Elevation API (backend)
```

---

### Map loads but route generation fails

**Symptom:**
- Map displays correctly
- "Generate Route" button doesn't work

**Solution:**
```bash
# Check browser console for errors

# Common causes:
# 1. Backend not running
curl http://localhost:5001/api/health

# 2. API proxy misconfigured
# Check frontend/vite.config.js:
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true
    }
  }
}

# 3. Google Maps API quota exceeded
# Check Google Cloud Console > APIs & Services > Quotas
```

---

## Frontend Issues

### Error: Styles not loading / UI broken

**Symptom:**
- No styling on components
- Everything appears unstyled

**Solution:**
```bash
# Ensure Tailwind is processing Vue files
# Check tailwind.config.js:
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx,vue}",  # .vue is important!
],

# Restart dev server
npm run dev

# Clear browser cache
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (macOS)
```

---

### Error: Component not found

**Symptom:**
```
Failed to resolve component: EmptyState
```

**Solution:**
```vue
<!-- Ensure correct import path -->
<script setup>
import EmptyState from '@/components/EmptyState.vue'
// or
import EmptyState from '../components/EmptyState.vue'
</script>

<!-- Check file exists -->
ls src/components/EmptyState.vue
```

---

### Hot reload not working

**Symptom:**
- Make changes to Vue files
- Browser doesn't update

**Solution:**
```bash
# Restart dev server
# Ctrl+C then npm run dev

# Check if port 3000 is busy
lsof -ti:3000 | xargs kill -9

# Try different port
# In vite.config.js:
server: {
  port: 3001
}
```

---

### Router not working / 404 on refresh

**Symptom:**
- Direct URL navigation shows 404
- Works with client-side navigation

**Solution:**
```javascript
// This is expected in development with Vite
// No fix needed - works in production

// For production deployment:
// Configure server for SPA (single page app)

// Vercel: Add vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## API Issues

### Error: 401 Unauthorized on all requests

**Symptom:**
```
{
  "message": "Unauthorized"
}
```

**Solution:**
```javascript
// Check if user is logged in
console.log(authStore.user);

// Check if token is being sent
// Browser DevTools > Network > Request Headers
// Should see: Authorization: Bearer <token>

// Try logging out and back in
await authStore.logout();
// Then login again
```

---

### Error: 429 Too Many Requests

**Symptom:**
```
{
  "message": "Too many requests, please try again later."
}
```

**Solution:**
```bash
# You've hit the rate limit

# Wait 15 minutes and try again

# Or increase limits temporarily in development
# backend/middleware/rateLimiter.js:
max: 1000, // Increase from 100

# Note: Don't deploy with high limits!
```

---

### CORS error

**Symptom:**
```
Access to fetch at 'http://localhost:5001/api/routes' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```javascript
// Check backend/server.js CORS config:
app.use(cors({
  origin: ['http://localhost:3000'],  // Add your frontend URL
  credentials: true
}));

// Restart backend server
```

---

## Deployment Issues

### Frontend build fails

**Symptom:**
```
npm run build
ERROR: Build failed
```

**Solution:**
```bash
# Check for TypeScript/ESLint errors
npm run lint

# Fix import errors
# Remove unused imports
# Fix component naming

# Check environment variables
# Ensure all VITE_* variables are set in production

# Try clean build
rm -rf node_modules dist
npm install
npm run build
```

---

### Backend deployment: Module not found

**Symptom:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
# Ensure package.json has all dependencies
# Not devDependencies for production modules

# Check start script
# package.json:
"scripts": {
  "start": "node server.js"  # Not npm run dev
}

# Verify NODE_ENV=production
```

---

### Environment variables not working in production

**Symptom:**
- Works locally
- Fails in production with "undefined"

**Solution:**
```bash
# Frontend (Vercel):
# Dashboard > Settings > Environment Variables
# Add all VITE_* variables

# Backend (Railway/Render):
# Dashboard > Environment
# Add all variables from .env

# Don't use .env files in production
# Use platform environment variable settings
```

---

### Database connection fails in production

**Symptom:**
```
Error: Connection terminated unexpectedly
```

**Solution:**
```bash
# Check Supabase connection string
# Use "pooling" connection string, not direct

# Correct format:
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true

# Verify SSL settings if required:
DATABASE_URL=postgresql://...?ssl=true

# Check IP allowlist in Supabase
# Settings > Database > Connection pooling
# Allow connections from your backend host
```

---

## Getting More Help

### Enable Debug Logging

**Backend:**
```javascript
// Add to server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

**Frontend:**
```javascript
// In api.js
api.interceptors.request.use(req => {
  console.log('Request:', req.method, req.url);
  return req;
});
```

### Check Logs

**Development:**
```bash
# Backend console
# Frontend browser console (F12)
```

**Production:**
```bash
# Vercel: Dashboard > Deployments > View Function Logs
# Railway: Dashboard > Deployments > View Logs
# Render: Dashboard > Logs
```

### Report Issues

If you can't find a solution:

1. Check existing GitHub issues
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Error messages
   - Browser/OS/Node version
   - Screenshots if applicable

### Additional Resources

- [Vue.js Docs](https://vuejs.org/guide/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Google Maps API Docs](https://developers.google.com/maps/documentation)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

Still stuck? Feel free to reach out to the community or maintainers for help!

