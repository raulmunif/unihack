// components/AlertMapWithMapbox.jsx
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, AlertTriangle, Zap, Droplets, Train } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// You'll need to get a Mapbox API key and add it to your .env.local file
// NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_api_key
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || 'pk.placeholder_key_replace_this';

const AlertMapWithMapbox = ({ alerts = [] }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapError, setMapError] = useState(null);
  
  // Default center (Sydney) - [lng, lat] format for Mapbox
  const [center, setCenter] = useState([151.2093, -33.8688]);
  const [zoom, setZoom] = useState(12);

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current) return; // Initialize map only once
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center, // Already in [lng, lat] format
      zoom: zoom
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Clean up on unmount
    return () => map.current.remove();
  }, []);
  
  // Update markers when alerts change
  useEffect(() => {
    if (!map.current || !alerts.length) return;
    
    // Clear existing markers first
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());
    
    // Add markers for each alert
    alerts.forEach(alert => {
      // Use the actual position from the alert data if available
      let position;
      
      if (alert.position && alert.position.lat && alert.position.lng) {
        // Use actual coordinates from the alert data
        position = [
          alert.position.lng, // Mapbox uses [lng, lat] format
          alert.position.lat
        ];
      } else {
        // Fallback to geocoding the location string
        // This is a temporary solution until all alerts have proper coordinates
        fetch(`/api/geocode/forward?address=${encodeURIComponent(alert.location)}`)
          .then(response => response.json())
          .then(data => {
            if (data.coordinates) {
              const geocodedPosition = [
                data.coordinates.lng,
                data.coordinates.lat
              ];
              
              // Create and add marker with the geocoded position
              addMarkerToMap(alert, geocodedPosition);
            }
          })
          .catch(error => console.error('Error geocoding location:', error));
          
        // Skip this alert for now, it will be added when geocoding completes
        return;
      }
      
      // Add marker to map with the position
      addMarkerToMap(alert, position);
    });
  }, [alerts, map.current]);
  
  // Helper function to add a marker to the map
  const addMarkerToMap = (alert, position) => {
    // Create custom marker element
    const markerEl = document.createElement('div');
    markerEl.className = `marker-${alert.severity}`;
    markerEl.style.width = '30px';
    markerEl.style.height = '30px';
    markerEl.style.borderRadius = '50%';
    markerEl.style.display = 'flex';
    markerEl.style.alignItems = 'center';
    markerEl.style.justifyContent = 'center';
    
    // Set background color based on severity
    switch(alert.severity) {
      case 'high':
        markerEl.style.backgroundColor = 'rgba(239, 68, 68, 0.9)'; // red
        break;
      case 'medium':
        markerEl.style.backgroundColor = 'rgba(249, 115, 22, 0.9)'; // orange
        break;
      case 'low':
        markerEl.style.backgroundColor = 'rgba(234, 179, 8, 0.9)'; // yellow
        break;
      default:
        markerEl.style.backgroundColor = 'rgba(59, 130, 246, 0.9)'; // blue
    }
    
    // Create the marker
    new mapboxgl.Marker(markerEl)
      .setLngLat(position)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <h3 style="font-weight: bold; margin-bottom: 5px;">${alert.title}</h3>
            <p style="margin-bottom: 5px;">${alert.location}</p>
            <p style="font-size: 0.875rem;">${alert.description.substring(0, 100)}${alert.description.length > 100 ? '...' : ''}</p>
          `)
      )
      .addTo(map.current);
  };
  
  // Function to get user's location
  const getUserLocation = () => {
    setIsLocating(true);
    setMapError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = [
            position.coords.longitude,
            position.coords.latitude
          ];
          
          setUserLocation(userPos);
          // Update center state to user's location
          setCenter(userPos);
          
          // Add marker for user location if it doesn't exist
          const userMarkerEl = document.querySelector('.user-location-marker');
          if (userMarkerEl) userMarkerEl.remove();
          
          // Create user location marker
          const el = document.createElement('div');
          el.className = 'user-location-marker';
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#3b82f6';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
          
          new mapboxgl.Marker(el)
            .setLngLat(userPos)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML('<p>Your location</p>')
            )
            .addTo(map.current);
          
          // Fly to user location
          map.current.flyTo({
            center: userPos,
            zoom: 14,
            essential: true
          });
          
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting user location:', error);
          setMapError('Unable to get your location. Please check your browser permissions.');
          setIsLocating(false);
        }
      );
    } else {
      setMapError('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Alert Map</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={getUserLocation}
          disabled={isLocating}
        >
          {isLocating ? 'Locating...' : 'Find My Location'}
          <Navigation className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {mapError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
            {mapError}
          </div>
        )}
        
        <div 
          ref={mapContainer} 
          className="h-64 md:h-96 rounded overflow-hidden"
        />
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center text-sm">
            <div className="h-3 w-3 rounded bg-red-500 mr-2"></div>
            <span>High Severity</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="h-3 w-3 rounded bg-orange-500 mr-2"></div>
            <span>Medium Severity</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="h-3 w-3 rounded bg-yellow-500 mr-2"></div>
            <span>Low Severity</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="h-3 w-3 rounded bg-blue-500 mr-2"></div>
            <span>Your Location</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertMapWithMapbox;