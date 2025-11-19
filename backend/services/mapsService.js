const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Get directions between waypoints using Google Maps Directions API
 */
async function getDirections(waypoints, optimize = false) {
  try {
    if (!waypoints || waypoints.length < 2) {
      throw new Error('Need at least 2 waypoints (start and end)');
    }

    const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
    const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;

    // Intermediate waypoints (if any)
    let waypointStr = '';
    if (waypoints.length > 2) {
      const intermediate = waypoints.slice(1, -1);
      waypointStr = intermediate.map(wp => `${wp.lat},${wp.lng}`).join('|');
    }

    const optimizeParam = optimize ? '&optimize:true' : '';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointStr ? `&waypoints=${optimizeParam}${waypointStr}` : ''}&mode=walking&key=${GOOGLE_MAPS_API_KEY}`;

    console.log(`Requesting directions: origin=${origin}, dest=${destination}, waypoints=${waypointStr || 'none'}`);

    const response = await axios.get(url);

    if (response.data.status !== 'OK') {
      console.error('Google Maps API error:', response.data);
      throw new Error(`Google Maps API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching directions:', error.message);
    throw error;
  }
}

/**
 * Calculate distance of a route in kilometers
 */
function calculateRouteDistance(route) {
  let totalMeters = 0;
  if (route.legs) {
    route.legs.forEach(leg => {
      totalMeters += leg.distance.value;
    });
  }
  return totalMeters / 1000; // Convert to km
}

/**
 * Generate intermediate waypoints to create a longer route
 * For circular routes (start = end): Creates a loop with waypoints going out and different waypoints coming back
 * For point-to-point routes: Creates waypoints in a circle around the midpoint
 */
function generateDetourWaypoints(start, end, targetDistanceKm, numWaypoints = 2) {
  const waypoints = [start];

  // Check if this is a circular route (start and end are the same/very close)
  const isCircular = Math.abs(start.lat - end.lat) < 0.0001 &&
                     Math.abs(start.lng - end.lng) < 0.0001;

  if (isCircular) {
    // For circular routes: Create a LOOP pattern
    // Generate waypoints in a circular path that creates a loop
    // This ensures you don't retrace your steps

    // Calculate radius based on target distance
    // For a circle, circumference = 2 * π * r, so r = distance / (2 * π)
    const radiusKm = targetDistanceKm / (2 * Math.PI);
    const radiusDeg = radiusKm / 111; // Convert km to degrees

    // Create waypoints around a circle centered at the start point
    // This creates a loop that goes out and comes back via a different route
    for (let i = 0; i < numWaypoints; i++) {
      const angle = (i + 1) * (2 * Math.PI) / (numWaypoints + 1);

      const lat = start.lat + (radiusDeg * Math.cos(angle));
      const lng = start.lng + (radiusDeg * Math.sin(angle) / Math.cos(start.lat * Math.PI / 180));

      waypoints.push({ lat, lng });
    }

    // End point is the same as start point (circular)
    waypoints.push(start);

    console.log(`   Creating LOOP route with ${numWaypoints} waypoints around start point`);

  } else {
    // For point-to-point routes: Create waypoints around the midpoint
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;

    // Calculate radius for waypoints (in degrees)
    const radiusKm = targetDistanceKm / (numWaypoints + 2);
    const radiusDeg = radiusKm / 111;

    // Create waypoints in a circle around the midpoint
    for (let i = 0; i < numWaypoints; i++) {
      const angle = (i * 2 * Math.PI) / numWaypoints;

      const lat = midLat + (radiusDeg * Math.cos(angle));
      const lng = midLng + (radiusDeg * Math.sin(angle) / Math.cos(midLat * Math.PI / 180));

      waypoints.push({ lat, lng });
    }

    waypoints.push(end);

    console.log(`   Creating point-to-point route with ${numWaypoints} detour waypoints`);
  }

  return waypoints;
}

/**
 * Generate a route based on start/end points and distance preferences
 * SIMPLE LOGIC:
 * 1. Route distance must be between minDistance and maxDistance
 * 2. Route must start at startPoint and end at endPoint
 * 3. Route will be displayed on map
 */
async function generateRoute(startPoint, endPoint, preferences = {}) {
  try {
    const minDistance = preferences.min_distance || 0;
    const maxDistance = preferences.max_distance || (minDistance * 2); // Default max to 2x min

    console.log(`\n🎯 Generating route:`);
    console.log(`   Start: ${startPoint.lat}, ${startPoint.lng}`);
    console.log(`   End: ${endPoint.lat}, ${endPoint.lng}`);
    console.log(`   Distance range: ${minDistance}km - ${maxDistance}km`);

    // STEP 1: Try direct route first
    console.log(`\n📍 Step 1: Trying direct route...`);
    const directDirections = await getDirections([startPoint, endPoint]);
    const directRoute = directDirections.routes[0];
    const directDistance = calculateRouteDistance(directRoute);

    console.log(`   Direct route distance: ${directDistance.toFixed(2)}km`);

    // If direct route is within range, use it!
    if (directDistance >= minDistance && directDistance <= maxDistance) {
      console.log(`   ✅ Direct route fits within limits!`);
      return formatRouteResponse(directRoute, directDistance, [startPoint, endPoint]);
    }

    // STEP 2: Direct route is too short, add detour waypoints
    if (directDistance < minDistance) {
      console.log(`   Direct route too short (${directDistance.toFixed(2)}km < ${minDistance}km)`);
      console.log(`   Searching for route between ${minDistance}km and ${maxDistance}km...`);

      // Strategy: Try different target distances and waypoint counts
      // Start with small detours and gradually increase
      let bestRoute = null;
      let bestDistance = directDistance;
      let bestWaypoints = [startPoint, endPoint];

      // Try different target distances from min to max
      const numTargets = 5;
      for (let i = 0; i < numTargets; i++) {
        const targetDistance = minDistance + (i * (maxDistance - minDistance) / (numTargets - 1));

        // Try different numbers of waypoints for each target
        for (let numWaypoints = 1; numWaypoints <= 4; numWaypoints++) {
          try {
            const detourWaypoints = generateDetourWaypoints(startPoint, endPoint, targetDistance, numWaypoints);
            const detourDirections = await getDirections(detourWaypoints);
            const detourRoute = detourDirections.routes[0];
            const detourDistance = calculateRouteDistance(detourRoute);

            console.log(`   Trying target=${targetDistance.toFixed(1)}km, waypoints=${numWaypoints}: Got ${detourDistance.toFixed(2)}km`);

            // Check if this route is within limits
            if (detourDistance >= minDistance && detourDistance <= maxDistance) {
              console.log(`   ✅ PERFECT! Found route within limits!`);
              return formatRouteResponse(detourRoute, detourDistance, detourWaypoints);
            }

            // Keep track of the closest route to the target range
            const distanceFromRange = detourDistance < minDistance
              ? minDistance - detourDistance
              : detourDistance - maxDistance;
            const bestDistanceFromRange = bestDistance < minDistance
              ? minDistance - bestDistance
              : bestDistance - maxDistance;

            if (distanceFromRange < bestDistanceFromRange) {
              bestRoute = detourRoute;
              bestDistance = detourDistance;
              bestWaypoints = detourWaypoints;
            }

          } catch (err) {
            console.warn(`   Failed: ${err.message}`);
            continue;
          }
        }
      }

      // If we found a better route (even if not perfect), use it
      if (bestRoute && bestDistance > directDistance) {
        console.log(`   Using best available route: ${bestDistance.toFixed(2)}km`);
        return formatRouteResponse(bestRoute, bestDistance, bestWaypoints);
      }
    }

    // STEP 3: If we still don't have a good route, return the closest one
    console.log(`\n⚠️  Could not find route exactly within ${minDistance}-${maxDistance}km range`);
    console.log(`   Using direct route: ${directDistance.toFixed(2)}km`);

    return formatRouteResponse(directRoute, directDistance, [startPoint, endPoint]);

  } catch (error) {
    console.error('❌ Error generating route:', error.message);
    throw error;
  }
}

/**
 * Format route response for database storage
 */
function formatRouteResponse(route, distanceKm, waypoints) {
  let totalDurationSeconds = 0;
  const allPoints = [];

  route.legs.forEach(leg => {
    totalDurationSeconds += leg.duration.value;
    leg.steps.forEach(step => {
      allPoints.push({
        lat: step.start_location.lat,
        lng: step.start_location.lng
      });
    });
  });

  // Add final point
  if (route.legs.length > 0) {
    const lastLeg = route.legs[route.legs.length - 1];
    const lastStep = lastLeg.steps[lastLeg.steps.length - 1];
    allPoints.push({
      lat: lastStep.end_location.lat,
      lng: lastStep.end_location.lng
    });
  }

  const durationMinutes = Math.round(totalDurationSeconds / 60);

  console.log(`\n📊 Final Route:`);
  console.log(`   Distance: ${distanceKm.toFixed(2)}km`);
  console.log(`   Duration: ${durationMinutes} minutes`);
  console.log(`   Waypoints: ${waypoints.length}`);
  console.log(`   Path points: ${allPoints.length}\n`);

  return {
    distance: distanceKm,
    duration: durationMinutes,
    waypoints: waypoints,
    points: allPoints,
    directions: route,
    overview_polyline: route.overview_polyline
  };
}

/**
 * Get elevation data for waypoints
 */
async function getElevation(waypoints) {
  try {
    const locations = waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${locations}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching elevation:', error);
    throw error;
  }
}

/**
 * Calculate route difficulty based on distance and elevation
 */
function calculateDifficulty(distance, elevationGain) {
  const distanceScore = distance / 10;
  const elevationScore = elevationGain / 100;
  const totalScore = distanceScore + elevationScore;

  if (totalScore < 1) return 'beginner';
  if (totalScore < 2) return 'intermediate';
  if (totalScore < 3) return 'advanced';
  return 'expert';
}

module.exports = {
  getDirections,
  getElevation,
  generateRoute,
  calculateDifficulty
};
