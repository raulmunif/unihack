// lib/location-service.js

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} coord1 - First coordinates {lat, lng}
 * @param {Object} coord2 - Second coordinates {lat, lng}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  };
  
  // Convert degrees to radians
  const toRad = (value) => {
    return value * Math.PI / 180;
  };
  
  /**
   * Get alerts near a specific location
   * @param {Array} alerts - List of all alerts
   * @param {Object} location - User location {lat, lng}
   * @param {number} radius - Radius in kilometers
   * @returns {Array} Filtered alerts within the radius
   */
  export const getNearbyAlerts = (alerts, location, radius = 10) => {
    if (!location || !alerts || !alerts.length) return [];
    
    return alerts.filter(alert => {
      // Skip alerts without position data
      if (!alert.position || !alert.position.lat || !alert.position.lng) return false;
      
      const distance = calculateDistance(location, alert.position);
      return distance <= radius;
    });
  };
  
  /**
   * Fetch location data from coordinates
   * @param {Object} coords - Coordinates {lat, lng}
   * @returns {Promise} Location data including address
   */
  export const reverseGeocode = async (coords) => {
    try {
      // Using a free geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      return {
        address: data.display_name,
        suburb: data.address.suburb || data.address.town || data.address.city,
        state: data.address.state,
        country: data.address.country,
        postcode: data.address.postcode
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };
  
  /**
   * Geocode an address to coordinates
   * @param {string} address - Address to geocode
   * @returns {Promise} Coordinates {lat, lng}
   */
  export const geocodeAddress = async (address) => {
    try {
      // URL encode the address
      const encodedAddress = encodeURIComponent(address);
      
      // Using a free geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }
      
      const data = await response.json();
      
      if (!data.length) {
        return null;
      }
      
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };
  
  // Update DataStax schema to include location data
  // app/api/alerts/route.js - add geocoding to the createAlert function
  export const enhanceAlertWithLocation = async (alertData) => {
    if (!alertData.location) return alertData;
    
    try {
      const coords = await geocodeAddress(alertData.location);
      
      if (coords) {
        return {
          ...alertData,
          position: coords
        };
      }
      
      return alertData;
    } catch (error) {
      console.error('Error enhancing alert with location:', error);
      return alertData;
    }
  };