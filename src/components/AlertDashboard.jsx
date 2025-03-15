'use client'

import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, Zap, Droplets, Train, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AlertDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch alerts from the API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts');
        if (!response.ok) {
          throw new Error('Failed to fetch alerts');
        }
        const data = await response.json();
        setAlerts(data.alerts || []);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError('Failed to load alerts. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setAiResponse('');
    
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process query');
      }
      
      const data = await response.json();
      setAiResponse(data.answer);
    } catch (err) {
      console.error('Error processing query:', err);
      setAiResponse('Sorry, there was an error processing your query. Please try again.');
    } finally {
      setIsSearching(false);
    }
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
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Public Alert System</h1>
      
      {/* AI Query Section */}
      <Card className="mb-8">
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
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
      <h2 className="text-2xl font-semibold mb-4">Current Alerts</h2>
      
      {isLoading ? (
        <div className="text-center py-8">
          <p>Loading alerts...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-gray-500">No active alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="border-l-4" style={{ borderLeftColor: getSeverityColor(alert.severity).replace('bg-', 'rgb(') }}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(alert.category)}
                    <CardTitle>{alert.title}</CardTitle>
                  </div>
                  <Badge className={getSeverityColor(alert.severity) + " text-white"}>
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
                  <div>Issued: {new Date(alert.timeIssued).toLocaleString()}</div>
                  <div>Expected resolution: {new Date(alert.expectedResolution).toLocaleString()}</div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertDashboard;