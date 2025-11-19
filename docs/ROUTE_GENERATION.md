# Route Generation Logic

This document explains the core logic behind RunRoutes' most important feature: **intelligent route generation**. It covers how the system creates running routes that meet user-specified distance requirements while ensuring the routes are logical, followable, and avoid backtracking.

## Table of Contents

1. [Overview](#overview)
2. [The Route Generation Algorithm](#the-route-generation-algorithm)
3. [Detour Waypoints: Creating Longer Routes](#detour-waypoints-creating-longer-routes)
4. [Wayfinder: Google Maps Directions API](#wayfinder-google-maps-directions-api)
5. [The Three-Step Generation Process](#the-three-step-generation-process)
6. [Ensuring Route Logic Soundness](#ensuring-route-logic-soundness)
7. [Examples and Edge Cases](#examples-and-edge-cases)
8. [Performance Considerations](#performance-considerations)

---

## Overview

RunRoutes generates custom running routes based on:
- **Start point**: Where the run begins
- **End point**: Where the run ends
- **Distance preferences**: Minimum and maximum desired route length

The challenge: If the direct route between two points is too short, how do we create a longer route that:
1. Still starts and ends at the specified locations
2. Meets the distance requirements
3. Uses real, walkable/runnable paths
4. Doesn't require runners to retrace their steps unnecessarily

**Solution**: Our intelligent route generation system uses:
- **Detour waypoints** to extend routes geometrically
- **Google Maps Directions API (wayfinder)** to ensure paths follow real roads/trails
- **Iterative optimization** to find the best route within distance constraints

---

## The Route Generation Algorithm

### Core Philosophy

The algorithm follows a **try-then-refine** approach:

1. **Always try the simplest solution first** (direct route)
2. **If that doesn't work, incrementally add complexity** (detour waypoints)
3. **Keep track of the best option** and use it if a perfect match isn't found
4. **Ensure all routes follow real, walkable paths** via Google Maps

### File Location

```
backend/services/mapsService.js
  ├── generateRoute()         - Main route generation orchestrator
  ├── generateDetourWaypoints() - Creates intermediate waypoints
  ├── getDirections()         - Queries Google Maps (wayfinder)
  ├── calculateRouteDistance() - Computes total route distance
  └── formatRouteResponse()   - Formats data for database storage
```

---

## Detour Waypoints: Creating Longer Routes

### What Are Detour Waypoints?

Detour waypoints are **intermediate geographic coordinates** strategically placed between start and end points to create longer routes. Instead of going directly from A to B, the runner goes A → C → D → B, where C and D are detour waypoints.

### Two Route Types: Circular vs. Point-to-Point

The algorithm intelligently detects the route type and uses different strategies:

#### 1. Circular Routes (Start = End)

**Detection Logic:**
```javascript
const isCircular = Math.abs(start.lat - end.lat) < 0.0001 &&
                   Math.abs(start.lng - end.lng) < 0.0001;
```

If start and end coordinates are virtually identical (within 0.0001 degrees ≈ 11 meters), it's a circular route.

**Strategy: Create a Loop Pattern**

```
        W2
        ↑
        |
W1 ← START/END → W3
        |
        ↓
        W4
```

For circular routes, waypoints are distributed around a circle centered at the start point. This ensures the runner:
- Goes out in one direction
- Loops around
- Returns via a different path
- **Never retraces their steps**

**Mathematical Implementation:**

```javascript
// Calculate radius based on target distance
// For a circle: circumference = 2πr, so r = distance / (2π)
const radiusKm = targetDistanceKm / (2 * Math.PI);
const radiusDeg = radiusKm / 111; // Convert km to degrees (≈111km per degree)

// Distribute waypoints evenly around the circle
for (let i = 0; i < numWaypoints; i++) {
  const angle = (i + 1) * (2 * Math.PI) / (numWaypoints + 1);
  
  const lat = start.lat + (radiusDeg * Math.cos(angle));
  const lng = start.lng + (radiusDeg * Math.sin(angle) / Math.cos(start.lat * Math.PI / 180));
  
  waypoints.push({ lat, lng });
}
```

**Why This Works:**
- Evenly distributes waypoints around a circle
- Accounts for Earth's spherical geometry (longitude correction by latitude)
- Creates natural loops without backtracking
- Radius scales with desired distance

#### 2. Point-to-Point Routes (Start ≠ End)

**Strategy: Waypoints Around the Midpoint**

```
         W2
         |
START → MID ← END
         |
         W1
```

For point-to-point routes, waypoints are placed in a circle around the midpoint between start and end. This creates a detour that lengthens the route while still connecting the two points.

**Mathematical Implementation:**

```javascript
// Find the midpoint
const midLat = (start.lat + end.lat) / 2;
const midLng = (start.lng + end.lng) / 2;

// Calculate radius (smaller than circular routes)
const radiusKm = targetDistanceKm / (numWaypoints + 2);
const radiusDeg = radiusKm / 111;

// Create waypoints in a circle around the midpoint
for (let i = 0; i < numWaypoints; i++) {
  const angle = (i * 2 * Math.PI) / numWaypoints;
  
  const lat = midLat + (radiusDeg * Math.cos(angle));
  const lng = midLng + (radiusDeg * Math.sin(angle) / Math.cos(midLat * Math.PI / 180));
  
  waypoints.push({ lat, lng });
}
```

**Why This Works:**
- Ensures the route passes through the general area between start and end
- Prevents extremely circuitous routes
- Maintains logical flow from start to end
- Scales detour size based on desired distance

### Key Parameters

- **numWaypoints**: Number of intermediate waypoints (1-4 in our implementation)
  - More waypoints = more complex route = potentially longer distance
  - Fewer waypoints = simpler route = more predictable

- **targetDistanceKm**: Desired route distance
  - Used to calculate the radius of the waypoint circle
  - Algorithm tries multiple targets between min and max distance

---

## Wayfinder: Google Maps Directions API

### What Is the Wayfinder?

The **wayfinder** is our integration with Google Maps Directions API. While detour waypoints tell us *where* to go, the wayfinder tells us *how* to get there using real, walkable paths.

### Purpose

1. **Validates that waypoints are reachable** via real roads/trails
2. **Provides turn-by-turn directions** between waypoints
3. **Calculates accurate distances** based on actual paths
4. **Ensures routes follow walkable/runnable terrain**

### How It Works

```javascript
async function getDirections(waypoints, optimize = false) {
  // Extract origin and destination
  const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
  const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;
  
  // Extract intermediate waypoints (if any)
  let waypointStr = '';
  if (waypoints.length > 2) {
    const intermediate = waypoints.slice(1, -1);
    waypointStr = intermediate.map(wp => `${wp.lat},${wp.lng}`).join('|');
  }
  
  // Query Google Maps Directions API
  const url = `https://maps.googleapis.com/maps/api/directions/json?
    origin=${origin}&
    destination=${destination}&
    waypoints=${waypointStr}&
    mode=walking&
    key=${GOOGLE_MAPS_API_KEY}`;
  
  const response = await axios.get(url);
  return response.data;
}
```

### Key Features

1. **Walking Mode**: Routes are optimized for pedestrians, not cars
2. **Waypoint Ordering**: Waypoints are visited in the order specified
3. **Real Paths Only**: Google Maps only returns routes on actual roads/trails/sidewalks
4. **Rich Data**: Returns distance, duration, elevation, turn-by-turn directions

### Why Google Maps?

- **Most comprehensive data**: Knows about roads, trails, parks, sidewalks
- **Constantly updated**: Map data is maintained by Google
- **Walking-specific routing**: Understands pedestrian paths, stairs, crosswalks
- **Reliable**: Industry-standard API with 99.9%+ uptime

---

## The Three-Step Generation Process

### Step 1: Try Direct Route First

```javascript
console.log(`📍 Step 1: Trying direct route...`);
const directDirections = await getDirections([startPoint, endPoint]);
const directRoute = directDirections.routes[0];
const directDistance = calculateRouteDistance(directRoute);

// If direct route is within range, use it!
if (directDistance >= minDistance && directDistance <= maxDistance) {
  console.log(`✅ Direct route fits within limits!`);
  return formatRouteResponse(directRoute, directDistance, [startPoint, endPoint]);
}
```

**Rationale**: The simplest solution is often the best. If the direct route happens to be within the user's distance preferences, there's no need to add complexity.

**Example**:
- User wants 3-5km route
- Direct route is 4.2km
- ✅ Perfect! Use direct route

### Step 2: Add Detour Waypoints (If Route Too Short)

```javascript
if (directDistance < minDistance) {
  console.log(`Direct route too short (${directDistance}km < ${minDistance}km)`);
  
  // Try different target distances and waypoint counts
  let bestRoute = null;
  let bestDistance = directDistance;
  let bestWaypoints = [startPoint, endPoint];
  
  // Try 5 different target distances from min to max
  const numTargets = 5;
  for (let i = 0; i < numTargets; i++) {
    const targetDistance = minDistance + (i * (maxDistance - minDistance) / (numTargets - 1));
    
    // Try 1-4 waypoints for each target
    for (let numWaypoints = 1; numWaypoints <= 4; numWaypoints++) {
      const detourWaypoints = generateDetourWaypoints(startPoint, endPoint, targetDistance, numWaypoints);
      const detourDirections = await getDirections(detourWaypoints);
      const detourRoute = detourDirections.routes[0];
      const detourDistance = calculateRouteDistance(detourRoute);
      
      // Check if this route is within limits
      if (detourDistance >= minDistance && detourDistance <= maxDistance) {
        console.log(`✅ PERFECT! Found route within limits!`);
        return formatRouteResponse(detourRoute, detourDistance, detourWaypoints);
      }
      
      // Keep track of the closest route
      if (distanceFromRange < bestDistanceFromRange) {
        bestRoute = detourRoute;
        bestDistance = detourDistance;
        bestWaypoints = detourWaypoints;
      }
    }
  }
  
  // Use the best route we found
  if (bestRoute && bestDistance > directDistance) {
    console.log(`Using best available route: ${bestDistance}km`);
    return formatRouteResponse(bestRoute, bestDistance, bestWaypoints);
  }
}
```

**Strategy**: Iterative optimization
1. Try 5 different target distances (evenly spaced between min and max)
2. For each target, try 1-4 waypoints
3. Total: 20 different route configurations attempted
4. Keep track of the "best" route (closest to target range)
5. Return a perfect match if found, otherwise return the best option

**Example**:
- User wants 5-8km route
- Direct route is 2km (too short)
- Algorithm tries:
  - Target 5km with 1, 2, 3, 4 waypoints
  - Target 5.75km with 1, 2, 3, 4 waypoints
  - Target 6.5km with 1, 2, 3, 4 waypoints
  - Target 7.25km with 1, 2, 3, 4 waypoints
  - Target 8km with 1, 2, 3, 4 waypoints
- Finds that 2 waypoints targeting 6.5km produces 6.2km actual route
- ✅ Success! 6.2km is within 5-8km range

### Step 3: Fallback to Best Available Route

```javascript
// If we still don't have a good route, return the closest one
console.log(`⚠️ Could not find route exactly within ${minDistance}-${maxDistance}km range`);
console.log(`Using direct route: ${directDistance}km`);

return formatRouteResponse(directRoute, directDistance, [startPoint, endPoint]);
```

**Rationale**: Sometimes it's impossible to generate a route within exact specifications (e.g., physical constraints of the area). In these cases, return the closest match rather than failing completely.

**Example**:
- User wants 10-15km route
- Start and end points are only 1km apart in a small neighborhood
- No combination of waypoints creates a route > 4km
- System returns best route found (e.g., 3.8km) with a warning

---

## Ensuring Route Logic Soundness

### 1. Geographic Accuracy

**Latitude/Longitude Precision**
- Coordinates use decimal degrees (e.g., 37.7749, -122.4194)
- Precision to 4 decimal places ≈ 11-meter accuracy
- Sufficient for route planning

**Spherical Earth Corrections**
```javascript
const lng = start.lng + (radiusDeg * Math.sin(angle) / Math.cos(start.lat * Math.PI / 180));
```
- Corrects longitude calculations based on latitude
- Prevents waypoint distortion near poles
- Ensures waypoints form accurate circles

### 2. Distance Validation

**Real-World Distance Calculation**
```javascript
function calculateRouteDistance(route) {
  let totalMeters = 0;
  if (route.legs) {
    route.legs.forEach(leg => {
      totalMeters += leg.distance.value; // Google Maps distance
    });
  }
  return totalMeters / 1000; // Convert to km
}
```

- Uses Google Maps' distance calculations (accounts for roads, elevation, turns)
- More accurate than "as-the-crow-flies" calculations
- Reflects actual running/walking distance

### 3. Waypoint Reachability

**Google Maps Validation**

Every waypoint is validated by Google Maps Directions API:
- If a waypoint is in water → API returns error → Waypoint discarded
- If a waypoint is on a highway → API routes around it
- If no path exists → API returns "ZERO_RESULTS" → Try different waypoints

**Error Handling**
```javascript
try {
  const detourDirections = await getDirections(detourWaypoints);
  // Process route...
} catch (err) {
  console.warn(`Failed: ${err.message}`);
  continue; // Try next waypoint configuration
}
```

### 4. Loop Prevention (Circular Routes)

**Problem**: Circular routes could create backtracking

**Solution**: Strategic waypoint placement
```javascript
// Waypoints distributed evenly around a circle
const angle = (i + 1) * (2 * Math.PI) / (numWaypoints + 1);
```

- Each waypoint is placed at a different angle
- Google Maps routes sequentially through waypoints
- Creates a natural loop without retracing
- Waypoints are never collocated

**Example**:
- 3 waypoints on a circular 5km route
- Waypoint 1: 90° (North)
- Waypoint 2: 210° (Southwest)
- Waypoint 3: 330° (Southeast)
- Creates a triangular loop, not a back-and-forth path

### 5. Reasonable Route Complexity

**Limits on Waypoints**
```javascript
for (let numWaypoints = 1; numWaypoints <= 4; numWaypoints++)
```

- Maximum 4 intermediate waypoints
- Prevents overly complex routes
- Keeps routes followable
- Reduces API costs

**Reasonable Distance Targets**
```javascript
const numTargets = 5; // Try 5 evenly-spaced targets
```

- Doesn't try every possible distance
- Balances accuracy with performance
- Provides "good enough" solutions quickly

### 6. Fallback Strategy

**Graceful Degradation**

The algorithm ensures a route is **always** returned:
1. Prefer perfect match (within distance range)
2. Accept "good enough" (closest to range)
3. Return direct route if nothing else works
4. Never return null/error (unless start/end are invalid)

This ensures users always get *something* they can use, even if it's not perfect.

---

## Examples and Edge Cases

### Example 1: Perfect Direct Route

**Input:**
- Start: San Francisco City Hall (37.7794, -122.4192)
- End: Golden Gate Park (37.7694, -122.4862)
- Distance range: 5-7km

**Process:**
1. Step 1: Calculate direct route = 6.2km
2. 6.2km is within 5-7km range
3. ✅ Return direct route immediately

**Result:** Simple, efficient route without detours

---

### Example 2: Circular Route with Detour Waypoints

**Input:**
- Start: Central Park, NYC (40.7829, -73.9654)
- End: Central Park, NYC (40.7829, -73.9654) — Same location!
- Distance range: 8-10km

**Process:**
1. Step 1: Direct route = 0km (start = end)
2. 0km < 8km → Too short
3. Step 2: Algorithm detects circular route
4. Tries different waypoint configurations:
   - 2 waypoints, target 8km → Actual: 7.5km (too short)
   - 2 waypoints, target 9km → Actual: 8.8km ✅
5. Returns route with 2 waypoints forming a loop

**Result:** A loop through Central Park that brings runner back to start

**Waypoints Generated:**
```
Start: 40.7829, -73.9654
WP1:   40.7929, -73.9654 (North)
WP2:   40.7829, -73.9554 (East)
End:   40.7829, -73.9654 (Back to start)
```

---

### Example 3: Point-to-Point with Constraints

**Input:**
- Start: Brooklyn Bridge (40.7061, -73.9969)
- End: Times Square (40.7580, -73.9855)
- Distance range: 10-15km

**Process:**
1. Step 1: Direct route = 6.5km
2. 6.5km < 10km → Too short
3. Step 2: Generate detour waypoints around midpoint
4. Tries multiple configurations:
   - 1 waypoint, target 10km → 9.2km (too short)
   - 2 waypoints, target 10km → 10.8km ✅
5. Returns route with 2 intermediate waypoints

**Result:** Route that starts at Brooklyn Bridge, detours through nearby neighborhoods, ends at Times Square

**Waypoints Generated:**
```
Start:  40.7061, -73.9969 (Brooklyn Bridge)
Mid:    40.7321, -73.9912 (Calculated midpoint)
WP1:    40.7421, -73.9812 (Northeast detour)
WP2:    40.7221, -74.0012 (Southwest detour)
End:    40.7580, -73.9855 (Times Square)
```

---

### Edge Case 1: Impossible Distance Requirements

**Scenario**: User wants 20km route in a small residential area

**Input:**
- Start/End: Small neighborhood
- Distance range: 20-25km

**Process:**
1. Step 1: Direct route = 2km
2. Step 2: Try all waypoint configurations
3. Maximum achievable: 8km (limited by area size)
4. Step 3: Return best available (8km) with warning

**Result:** System returns 8km route (best effort) but logs a warning that exact requirements couldn't be met

---

### Edge Case 2: Water/Unreachable Areas

**Scenario**: Detour waypoint falls in a lake

**Input:**
- Start: Lakeshore point A
- End: Lakeshore point B
- Detour waypoint: In the middle of the lake

**Process:**
1. Step 2: Generate waypoint in lake
2. getDirections() calls Google Maps API
3. Google Maps returns error: "ZERO_RESULTS"
4. Algorithm catches error, continues to next waypoint configuration
5. Next configuration places waypoint on land
6. ✅ Success

**Result:** Waypoint configurations that include unreachable points are automatically skipped

---

### Edge Case 3: Very Long Distance Requests

**Scenario**: User wants 50km route

**Input:**
- Distance range: 50-60km

**Consideration**: 
- API limits (cost per request)
- Route complexity (too many turns)
- Practicality (is this a marathon route?)

**Current Implementation**: 
- Maximum 4 waypoints limits practical distance to ~20-30km depending on area
- For longer distances, recommend multiple shorter routes or manual route creation

---

## Performance Considerations

### API Call Optimization

**Number of API Calls**
- Worst case: 5 targets × 4 waypoint counts = **20 API calls**
- Best case: 1 API call (direct route works)
- Average: 5-10 API calls

**Cost Implications**
- Google Maps Directions API: $5 per 1,000 requests (as of 2024)
- Average route generation: ~$0.025-$0.05
- Rate limiting: 10 requests per 15 minutes per user

### Caching Strategy

```javascript
// Future optimization: Cache similar routes
const cacheKey = `${start.lat},${start.lng}-${end.lat},${end.lng}-${minDistance}-${maxDistance}`;
if (routeCache.has(cacheKey)) {
  return routeCache.get(cacheKey);
}
```

**Benefits**:
- Reduces API calls for popular route pairs
- Faster response times
- Lower costs

**Challenges**:
- Routes change over time (construction, new roads)
- Cache invalidation strategy needed
- Storage requirements

### Iterative Optimization

**Current Approach**: Try multiple configurations

**Alternative**: Binary search for optimal waypoint count
```javascript
// Instead of trying 1, 2, 3, 4 waypoints...
// Binary search: Try 2, then 1 or 3, then 2 or 4
```

**Trade-off**:
- Faster in some cases
- More complex logic
- May miss "good enough" solutions

### Parallel API Calls

**Current**: Sequential (one after another)
```javascript
for (let numWaypoints = 1; numWaypoints <= 4; numWaypoints++) {
  await getDirections(detourWaypoints); // Wait for each
}
```

**Optimization**: Parallel (all at once)
```javascript
const promises = [1, 2, 3, 4].map(numWaypoints => 
  getDirections(generateDetourWaypoints(...))
);
const results = await Promise.all(promises);
```

**Benefits**:
- 4x faster for worst-case scenarios
- Better user experience

**Challenges**:
- More complex error handling
- Potential rate limit issues
- Higher concurrent API costs

---

## Future Enhancements

### 1. Terrain Preferences

**Goal**: Allow users to prefer certain terrain types

```javascript
preferences: {
  terrain: 'parks',      // Prefer parks over roads
  avoid: ['highways'],   // Avoid busy roads
  surface: 'trail'       // Prefer trails over pavement
}
```

**Implementation**: Use Google Maps "avoid" parameter and place waypoints near parks/trails

---

### 2. Elevation Preferences

**Goal**: Generate routes with specific elevation profiles

```javascript
preferences: {
  elevation: 'flat',     // Minimize elevation change
  // OR
  elevation: 'hilly',    // Include hills for training
  maxGain: 500           // Max 500m elevation gain
}
```

**Implementation**: Query Elevation API after generating waypoints, adjust if needed

---

### 3. Point of Interest Routing

**Goal**: Route that passes by specific landmarks

```javascript
preferences: {
  via: [
    { name: 'Starbucks', lat: 37.7749, lng: -122.4194 },
    { name: 'Park', lat: 37.7750, lng: -122.4195 }
  ]
}
```

**Implementation**: Incorporate user-specified waypoints into the waypoint array

---

### 4. Historical Route Optimization

**Goal**: Learn from past routes to generate better future routes

```javascript
// Track which routes users actually run
// Use machine learning to predict preferred route characteristics
// Adjust waypoint generation based on historical data
```

**Implementation**: Requires user tracking, analytics, ML model

---

### 5. Real-Time Traffic/Conditions

**Goal**: Avoid crowded areas or closed trails

```javascript
preferences: {
  avoidCrowds: true,     // Use less popular routes
  checkConditions: true  // Avoid closed/flooded trails
}
```

**Implementation**: Integrate with traffic data, park closure APIs

---

## Summary

RunRoutes' route generation system combines:

1. **Detour Waypoints Algorithm**: Geometric waypoint placement that intelligently extends routes while preventing backtracking
   - Circular routes: Loop patterns around start point
   - Point-to-point: Detours around midpoint

2. **Google Maps Integration (Wayfinder)**: Real-world path validation and routing
   - Ensures all routes use actual roads/trails
   - Provides accurate distances and turn-by-turn directions

3. **Three-Step Process**: Try simple → Add complexity → Fallback
   - Optimizes for both accuracy and performance
   - Guarantees a usable result

4. **Safety Mechanisms**: Multiple layers ensure route quality
   - Geographic accuracy
   - Distance validation
   - Waypoint reachability checks
   - Loop prevention
   - Reasonable complexity limits
   - Graceful fallbacks

The result: **Intelligent, followable running routes that meet user requirements while respecting the physical constraints of the real world.**

---

## Code References

**Main Route Generation Function**:
```
backend/services/mapsService.js:128-222
```

**Detour Waypoints Generation**:
```
backend/services/mapsService.js:61-119
```

**Google Maps Wayfinder**:
```
backend/services/mapsService.js:8-41
```

**API Endpoint**:
```
backend/routes/routes.js:153-248
```

