'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, AlertTriangle, Zap, Droplets, Train } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const NearbyAlerts = ({ alerts = [] }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [address, setAddress] = useState('');
  const [nearbyAlerts, setNearbyAlerts] = useState([]);
  const [radius, setRadius] = useState(5); // Default 5km radius
  
  // Function to get user's location
  const getUserLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setUserLocation(userPos);
          
          // Reverse geocode to get address
          try {
            const response = await fetch(`/api/geocode/reverse?lat=${userPos.lat}&lng=${userPos.lng}`);
            if (response.ok) {
              const data = await response.json();
              if (data.address) {
                setAddress(data.address);
              }
            }
          } catch (error) {
            console.error('Error getting address:', error);
          }
          
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting user location:', error);
          setLocationError('Unable to get your location. Please check your browser permissions.');
          setIsLocating(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };
  
  // Function to search by address
  const searchByAddress = async () => {
    if (!address.trim()) return;
    
    setIsLocating(true);
    setLocationError(null);
    
    try {
      const response = await fetch(`/api/geocode/forward?address=${encodeURIComponent(address)}`);
      
      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }
      
      const data = await response.json();
      
      if (data.coordinates) {
        setUserLocation(data.coordinates);
      } else {
        setLocationError('Could not find coordinates for this address. Please try a different address.');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setLocationError('Error finding location. Please try a different address.');
    } finally {
      setIsLocating(false);
    }
  };
  
  // Filter alerts by distance whenever user location or radius changes
  useEffect(() => {
    if (!userLocation || !alerts.length) {
      setNearbyAlerts([]);
      return;
    }
    
    // Calculate distance for each alert and filter by radius
    const filtered = alerts
      .filter(alert => alert.position) // Only include alerts with position data
      .map(alert => {
        // Calculate distance between user and alert
        const distance = calculateDistance(
          userLocation,
          alert.position
        );
        
        return { ...alert, distance };
      })
      .filter(alert => alert.distance <= radius)
      .sort((a, b) => a.distance - b.distance); // Sort by closest first
    
    setNearbyAlerts(filtered);
  }, [userLocation, alerts, radius]);
  
  // Helper function to calculate distance between two points (Haversine formula)
  const calculateDistance = (coord1, coord2) => {
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
  
  // Format distance for display
  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };
  
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'transport':
        return <Train className="h-5 w-5" />;
      case 'electricity':
        return <Zap className="h-5 w-5" />;
      case 'weather':
        return <Droplets className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Alerts Near You</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Location input */}
          <div className="flex flex-col space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your address or location"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1"
              />
              <Button onClick={searchByAddress} disabled={isLocating || !address.trim()}>
                Search
              </Button>
              <Button 
                variant="outline" 
                onClick={getUserLocation}
                disabled={isLocating}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
            
            {locationError && (
              <div className="text-sm text-red-500">{locationError}</div>
            )}
          </div>
          
          {/* Radius slider */}
          {userLocation && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Search radius: {radius}km</Label>
              </div>
              <Slider
                value={[radius]}
                min={1}
                max={20}
                step={1}
                onValueChange={(values) => setRadius(values[0])}
              />
            </div>
          )}
          
          {/* Results */}
          <div className="space-y-2">
            {userLocation ? (
              nearbyAlerts.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Found {nearbyAlerts.length} alert{nearbyAlerts.length !== 1 ? 's' : ''} within {radius}km
                  </h3>
                  <div className="space-y-3">
                    {nearbyAlerts.map(alert => (
                      <div 
                        key={alert.id} 
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex gap-2">
                            {getCategoryIcon(alert.category)}
                            <div>
                              <h4 className="font-medium">{alert.title}</h4>
                              <p className="text-sm text-gray-600">{alert.location}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDistance(alert.distance)} away
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm">{alert.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No alerts found within {radius}km of your location.</p>
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Enter your location or use the location button to find alerts near you.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NearbyAlerts;