'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, AlertTriangle, Zap, Droplets, Train } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AlertMap = ({ alerts = [] }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Default map center (Sydney CBD)
  const defaultCenter = { lat: -33.8688, lng: 151.2093 };

  // Function to get user's location
  const getUserLocation = () => {
    setIsLocating(true);
    setMapError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
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

  // Mock alerts with location data for demonstration
  const alertsWithLocation = alerts.map(alert => {
    // For demo purposes, generate random positions around Sydney
    // In a real app, you'd use actual coordinates from your database
    const randomOffset = () => (Math.random() - 0.5) * 0.1;
    
    return {
      ...alert,
      position: {
        lat: defaultCenter.lat + randomOffset(),
        lng: defaultCenter.lng + randomOffset()
      }
    };
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'transport':
        return <Train className="h-6 w-6" />;
      case 'electricity':
        return <Zap className="h-6 w-6" />;
      case 'weather':
        return <Droplets className="h-6 w-6" />;
      default:
        return <AlertTriangle className="h-6 w-6" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
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
        
        <div className="bg-gray-100 h-64 md:h-96 relative rounded overflow-hidden">
          {/* This is a placeholder for a real map - you would integrate Mapbox, Google Maps, etc. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">Map would render here - integrate with Mapbox or Google Maps</p>
          </div>
          
          {/* Placeholder for alerts on map */}
          <TooltipProvider>
            {alertsWithLocation.map(alert => (
              <Tooltip key={alert.id}>
                <TooltipTrigger asChild>
                  <div 
                    className={`absolute cursor-pointer ${getSeverityColor(alert.severity)}`}
                    style={{ 
                      left: `calc(50% + ${(alert.position.lng - defaultCenter.lng) * 1000}px)`, 
                      top: `calc(50% + ${(alert.position.lat - defaultCenter.lat) * -1000}px)`
                    }}
                  >
                    {getCategoryIcon(alert.category)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="p-2 max-w-xs">
                    <h3 className="font-bold text-sm">{alert.title}</h3>
                    <p className="text-xs">{alert.location}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
          
          {/* User location marker */}
          {userLocation && (
            <div 
              className="absolute bg-blue-500 h-4 w-4 rounded-full border-2 border-white shadow-md"
              style={{ 
                left: `calc(50% + ${(userLocation.lng - defaultCenter.lng) * 1000}px)`, 
                top: `calc(50% + ${(userLocation.lat - defaultCenter.lat) * -1000}px)`,
                transform: 'translate(-50%, -50%)' 
              }}
            />
          )}
        </div>
        
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

export default AlertMap;