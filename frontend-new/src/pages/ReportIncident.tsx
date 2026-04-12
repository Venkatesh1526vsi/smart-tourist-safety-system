import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Upload } from 'lucide-react';

const ReportIncident = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: '',
    dateTime: new Date().toISOString().slice(0, 16), // Current datetime in local format
  });
  const [severity, setSeverity] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const incidentTypes = [
    'Theft',
    'Harassment',
    'Accident',
    'Suspicious Activity',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }));
    
    if (errors.type) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.type;
        return newErrors;
      });
    }
  };

  const handleEmergencyToggle = (checked: boolean) => {
    setIsEmergency(checked);
    if (checked) {
      setSeverity('critical');
    }
    if (errors.severity) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.severity;
        return newErrors;
      });
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let resolvedLocation = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          if (city) {
            resolvedLocation = `${city} (Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)})`;
          }
        } catch (error) {
          // fallback to coordinates only
        }

        setFormData(prev => ({
          ...prev,
          location: resolvedLocation,
        }));
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        alert('Unable to fetch current location');
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Incident title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Please select an incident type';
    }
    
    if (!severity) {
      newErrors.severity = 'Please select a severity level';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Extract latitude and longitude from location string
    const latMatch = formData.location?.match(/Lat:\s*([0-9.-]+)/);
    const lngMatch = formData.location?.match(/Lng:\s*([0-9.-]+)/);
    const latitude = latMatch ? parseFloat(latMatch[1]) : null;
    const longitude = lngMatch ? parseFloat(lngMatch[1]) : null;
    
    // Prepare FormData for submission
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("severity", severity);
    formDataToSend.append("isEmergency", String(isEmergency));
    if (latitude !== null) {
      formDataToSend.append("latitude", String(latitude));
    }
    if (longitude !== null) {
      formDataToSend.append("longitude", String(longitude));
    }
    
    images.forEach((img) => {
      formDataToSend.append("images", img);
    });
    
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setSuccessMessage('Incident reported successfully!');
        setFormData({
          title: '',
          description: '',
          location: '',
          type: '',
          dateTime: new Date().toISOString().slice(0, 16),
        });
        setSeverity('');
        setIsEmergency(false);
        setImages([]);

        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        console.error('Incident submission failed', response.statusText);
      }
    } catch (error) {
      console.error('Incident submission error', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-2xl font-display">Report an Incident</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Help us keep the community safe by reporting incidents
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {successMessage && (
              <div className="mb-6 p-4 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Incident Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the incident"
                    value={formData.title}
                    onChange={handleChange}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm">{errors.title}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about the incident..."
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm">{errors.description}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="location"
                      placeholder="Where did the incident occur?"
                      value={formData.location}
                      onChange={handleChange}
                      className={errors.location ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locationLoading}
                      className="whitespace-nowrap"
                    >
                      {locationLoading ? 'Fetching location...' : '📍 Use Current Location'}
                    </Button>
                  </div>
                  {errors.location && (
                    <p className="text-red-500 text-sm">{errors.location}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Incident Type *</Label>
                    <Select value={formData.type} onValueChange={handleTypeChange}>
                      <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentTypes.map(type => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-red-500 text-sm">{errors.type}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateTime">Date & Time *</Label>
                    <Input
                      id="dateTime"
                      type="datetime-local"
                      value={formData.dateTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity *</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger className={errors.severity ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.severity && (
                      <p className="text-red-500 text-sm">{errors.severity}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="emergency"
                      checked={isEmergency}
                      onChange={(e) => handleEmergencyToggle(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="emergency" className="text-sm font-medium cursor-pointer">
                      🚨 Mark as Emergency
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image">Attach Evidence (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {images.length > 0 ? `${images.length} file(s) selected` : 'Click to upload image(s)'}
                      </span>
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Submitting...</span>
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReportIncident;