'use client'

import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, Zap, Droplets, Train } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AlertMapWithMapbox from '@/components/AlertMapWithMapbox';
import NearbyAlerts from '@/components/NearbyAlerts';

const AlertDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // Fetch alerts when component mounts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        } else {
          console.error('Failed to fetch alerts');
          // Fallback to mock data if API fails
          setAlerts(getMockAlerts());
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
        // Fallback to mock data if API fails
        setAlerts(getMockAlerts());
      }
    };

    fetchAlerts();
  }, []);

  // Get user location if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Try to use the AI query API
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: searchQuery,
          userLocation: userLocation
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.answer);
      } else {
        // Fallback to simple search if API fails
        setAiResponse(getSimpleSearchResponse(searchQuery));
      }
    } catch (error) {
      console.error('Error querying alerts:', error);
      // Fallback to simple search if API fails
      setAiResponse(getSimpleSearchResponse(searchQuery));
    } finally {
      setIsSearching(false);
    }
  };

  // Simple search response when API is not available
  const getSimpleSearchResponse = (query) => {
    const lowercaseQuery = query.toLowerCase();
    
    if (lowercaseQuery.includes('train') || lowercaseQuery.includes('western')) {
      return "Signal issues in Ashfield are leading to delays up to 30 minutes on all Western line services. Engineering crews are on site, and the issue is expected to be resolved by 11:00 AM.";
    } else if (lowercaseQuery.includes('power') || lowercaseQuery.includes('electricity') || lowercaseQuery.includes('north sydney')) {
      return "There is a planned power outage in North Sydney today for scheduled maintenance. Power is expected to be restored by 2:00 PM.";
    } else if (lowercaseQuery.includes('flood') || lowercaseQuery.includes('parramatta')) {
      return "A flash flooding alert is active for areas near Parramatta River due to heavy rainfall. Please avoid low-lying areas and follow NSW Emergency Services guidance.";
    } else {
      return "I couldn't find specific information about that query. Please try being more specific or check the current alerts below.";
    }
  };

  // Mock data when API is not available
  const getMockAlerts = () => {
    return [
      {
        id: 1,
        title: 'Train Delays',
        description: 'Signal issues at Ashfield station causing delays up to 30 minutes on all Western line services.',
        category: 'transport',
        severity: 'medium',
        location: 'Western Sydney',
        timeIssued: '2025-03-15T08:30:00',
        expectedResolution: '2025-03-15T11:00:00',
        issuer: 'Transport NSW',
        position: { lat: -33.8882, lng: 151.1031 }
      },
      {
        id: 2,
        title: 'Planned Power Outage',
        description: 'Scheduled maintenance will affect power supply in North Sydney suburbs.',
        category: 'electricity',
        severity: 'low',
        location: 'North Sydney',
        timeIssued: '2025-03-14T17:00:00',
        expectedResolution: '2025-03-15T14:00:00',
        issuer: 'Ausgrid',
        position: { lat: -33.8273, lng: 151.2092 }
      },
      {
        id: 3,
        title: 'Flash Flooding Alert',
        description: 'Heavy rainfall expected to cause flash flooding in low-lying areas near Parramatta River.',
        category: 'weather',
        severity: 'high',
        location: 'Parramatta',
        timeIssued: '2025-03-15T06:15:00',
        expectedResolution: '2025-03-16T00:00:00',
        issuer: 'NSW Emergency Services',
        position: { lat: -33.8148, lng: 151.0017 }
      }
    ];
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

  // Get CSS class for border color instead of using inline styles
  const getSeverityBorderColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'border-red-500';
      case 'medium':
        return 'border-orange-500';
      case 'low':
        return 'border-yellow-500';
      default:
        return 'border-blue-500';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6">Public Alert System</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: AI Query and Alerts List */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Query Section */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Ask about current situations</CardTitle>
              <CardDescription>
                Ask questions like "What's happening with trains in the Western suburbs?" or "Is there flooding in Parramatta?"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input 
                  placeholder="What's going on with trains in central?" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? 'Searching...' : <Search className="h-4 w-4 mr-2" />}
                  Ask
                </Button>
              </div>
              
              {aiResponse && (
                <Alert className="mt-4">
                  <AlertTitle>Response:</AlertTitle>
                  <AlertDescription>{aiResponse}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          {/* Current Alerts Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Current Alerts</h2>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <Card 
                    key={alert.id} 
                    className={`border-l-4 shadow-md ${getSeverityBorderColor(alert.severity)}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(alert.category)}
                          <CardTitle>{alert.title}</CardTitle>
                        </div>
                        <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>{alert.location} • Issued by {alert.issuer}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{alert.description}</p>
                    </CardContent>
                    <CardFooter className="text-sm text-gray-500">
                      <div className="flex justify-between w-full">
                        <div>
                          {typeof window !== 'undefined' 
                            ? `Issued: ${new Date(alert.timeIssued).toLocaleString()}` 
                            : 'Issued: Loading...'}
                        </div>
                        <div>
                          {typeof window !== 'undefined'
                            ? `Expected resolution: ${new Date(alert.expectedResolution).toLocaleString()}`
                            : 'Expected resolution: Loading...'}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Loading alerts...
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column: Map and Nearby Alerts */}
        <div className="space-y-6">
          {/* Map Component */}
          <AlertMapWithMapbox alerts={alerts} />
          
          {/* Nearby Alerts Component */}
          <NearbyAlerts alerts={alerts} />
        </div>
      </div>
    </div>
  );
};

export default AlertDashboard;