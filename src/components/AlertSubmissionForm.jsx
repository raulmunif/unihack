'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AlertSubmissionForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    severity: '',
    location: '',
    expectedResolution: '',
    issuer: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null, 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data
      const requiredFields = ['title', 'description', 'category', 'severity', 'location', 'expectedResolution', 'issuer'];
      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
      }
      
      // Submit to API
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit alert');
      }
      
      // Success
      setSubmitStatus('success');
      setFormData({
        title: '',
        description: '',
        category: '',
        severity: '',
        location: '',
        expectedResolution: '',
        issuer: ''
      });
    } catch (error) {
      console.error('Error submitting alert:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to submit alert. Please try again.');
    } finally {
      setIsSubmitting(false);
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSubmitStatus(null);
        setErrorMessage('');
      }, 3000);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Submit New Alert</h1>
      
      {submitStatus === 'success' && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>Your alert has been submitted and is now live.</AlertDescription>
        </Alert>
      )}
      
      {submitStatus === 'error' && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage || 'There was an error submitting your alert. Please try again.'}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>New Alert Information</CardTitle>
          <CardDescription>Complete all fields to submit a new public alert</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Alert Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  placeholder="E.g., Train Service Disruption" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="E.g., Sydney CBD" 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Alert Details</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Provide detailed information about the alert" 
                className="min-h-32" 
                required 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(value) => handleSelectChange('category', value)}
                  value={formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transport">Transportation</SelectItem>
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  onValueChange={(value) => handleSelectChange('severity', value)}
                  value={formData.severity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expectedResolution">Expected Resolution</Label>
                <Input 
                  id="expectedResolution" 
                  name="expectedResolution" 
                  type="datetime-local" 
                  value={formData.expectedResolution} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issuer">Issuing Organization</Label>
              <Input 
                id="issuer" 
                name="issuer" 
                value={formData.issuer} 
                onChange={handleChange} 
                placeholder="E.g., Transport NSW" 
                required 
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Alert'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AlertSubmissionForm;