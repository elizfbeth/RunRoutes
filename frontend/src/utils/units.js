/**
 * Unit conversion utilities
 */

/**
 * Convert kilometers to miles
 * @param {number} km - Distance in kilometers
 * @returns {number} Distance in miles
 */
export function kmToMiles(km) {
  return km * 0.621371
}

/**
 * Convert miles to kilometers
 * @param {number} miles - Distance in miles
 * @returns {number} Distance in kilometers
 */
export function milesToKm(miles) {
  return miles * 1.60934
}

/**
 * Convert meters to feet
 * @param {number} meters - Elevation in meters
 * @returns {number} Elevation in feet
 */
export function metersToFeet(meters) {
  return meters * 3.28084
}

/**
 * Convert feet to meters
 * @param {number} feet - Elevation in feet
 * @returns {number} Elevation in meters
 */
export function feetToMeters(feet) {
  return feet * 0.3048
}

/**
 * Format distance based on unit preference
 * @param {number} distance - Distance in kilometers (stored value)
 * @param {string} unit - 'km' or 'miles'
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted distance with unit
 */
export function formatDistance(distance, unit = 'km', decimals = 2) {
  if (unit === 'miles') {
    return `${kmToMiles(distance).toFixed(decimals)} mi`
  }
  return `${distance.toFixed(decimals)} km`
}

/**
 * Format elevation based on unit preference
 * @param {number} elevation - Elevation in meters (stored value)
 * @param {string} unit - 'km' or 'miles' (determines m or ft)
 * @returns {string} Formatted elevation with unit
 */
export function formatElevation(elevation, unit = 'km') {
  if (unit === 'miles') {
    return `${Math.round(metersToFeet(elevation))} ft`
  }
  return `${Math.round(elevation)} m`
}

/**
 * Get pace string based on unit
 * @param {string} unit - 'km' or 'miles'
 * @returns {string} Pace description
 */
export function getPaceUnit(unit = 'km') {
  return unit === 'miles' ? 'min/mi' : 'min/km'
}

