/**
 * Library exports for PlanetCanvas 3D
 */

// Supabase
export { supabase, getCurrentUser, signInWithGoogle, signInAsGuest, getGuestId, getUserId } from './supabase'

// Globe utilities
export {
  latLongToUV,
  uvToLatLong,
  cartesianToLatLong,
  latLongToCartesian,
  calculateRegionBounds,
  haversineDistance,
  zoomLevelToRadius,
  distanceToZoomLevel,
  getLocationName,
  clamp,
  lerp,
} from './globe-utils'
