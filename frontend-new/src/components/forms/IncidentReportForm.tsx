import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, Upload, Crosshair, Navigation, MapPin, X } from "lucide-react";
import { LocationInput } from "./LocationInput";

export interface IncidentReportFormProps {
  onSuccess?: (incidentData: any) => void;
}

export function IncidentReportForm({ onSuccess }: IncidentReportFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: '',
    dateTime: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [severity, setSeverity] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const incidentTypes = ['Medical Emergency', 'Theft', 'Harassment', 'Accident', 'Suspicious Activity', 'Other'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => { const ne = { ...prev }; delete ne[id]; return ne; });
  };

  const handleLocationChange = (loc: string, newCoords: { lat: number; lng: number } | null) => {
    setFormData(prev => ({ ...prev, location: loc }));
    if (newCoords) setCoords(newCoords);
    if (errors.location) setErrors(prev => { const ne = { ...prev }; delete ne.location; return ne; });
    // Reset GPS badge if manually typed
    if (!newCoords && gpsVerified) setGpsVerified(false);
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
    if (errors.type) setErrors(prev => { const ne = { ...prev }; delete ne.type; return ne; });
  };

  const handleEmergencyToggle = (checked: boolean) => {
    setIsEmergency(checked);
    if (checked) setSeverity('critical');
    if (errors.severity) setErrors(prev => { const ne = { ...prev }; delete ne.severity; return ne; });
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser');
      return;
    }
    
    setLocationLoading(true);
    setGpsVerified(false);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        let resolvedLocation = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || '';
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          
          const components = [area, city].filter(Boolean);
          if (components.length > 0) {
            resolvedLocation = `${components.join(', ')} (Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)})`;
          }
        } catch {
          // Fallback to raw coordinates on error
        }
        
        setFormData(prev => ({ ...prev, location: resolvedLocation }));
        setGpsVerified(true);
        setLocationLoading(false);
        if (errors.location) setErrors(prev => { const ne = { ...prev }; delete ne.location; return ne; });
      },
      () => {
        setLocationLoading(false);
        alert('Unable to fetch your precise location. Please ensure location permissions are enabled.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title required';
    if (!formData.description.trim()) newErrors.description = 'Description required';
    if (!formData.location.trim()) newErrors.location = 'Location required';
    if (!formData.type) newErrors.type = 'Type required';
    if (!severity) newErrors.severity = 'Severity required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    let latitude = coords?.lat ?? null;
    let longitude = coords?.lng ?? null;
    
    // Fallback extraction if coords state is null but user typed them
    if (latitude === null || longitude === null) {
      const latMatch = formData.location?.match(/Lat:\s*([0-9.-]+)/i);
      const lngMatch = formData.location?.match(/Lng:\s*([0-9.-]+)/i);
      if (latMatch && lngMatch) {
        latitude = parseFloat(latMatch[1]);
        longitude = parseFloat(lngMatch[1]);
      }
    }
    
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("severity", severity);
    formDataToSend.append("isEmergency", String(isEmergency));
    if (latitude !== null) formDataToSend.append("latitude", String(latitude));
    if (longitude !== null) formDataToSend.append("longitude", String(longitude));
    images.forEach(img => formDataToSend.append("image", img));
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
          alert("Please login again");
          setIsSubmitting(false);
          return;
      }

      const response = await fetch("https://smart-tourist-safety-system-l724.onrender.com/api/incidents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      if (response.ok) {
        let responseData;
        try {
          responseData = await response.json();
        } catch {
          responseData = {};
        }
        
        const newIncident = responseData.data || responseData.incident || {
          _id: `INC-LOC-${Date.now()}`,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          type: formData.type,
          severity,
          latitude,
          longitude,
          status: 'pending',
          created_at: new Date().toISOString()
        };

        setSuccessMessage("Operational report submitted securely.");
        setFormData({ 
          title: "", 
          description: "", 
          location: "", 
          type: "", 
          dateTime: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
        });
        setSeverity("");
        setIsEmergency(false);
        setImages([]);
        setCoords(null);
        setGpsVerified(false);
        
        setTimeout(() => setSuccessMessage(""), 4000);
        if (onSuccess) onSuccess(newIncident);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to submit incident");
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-border/40 shadow-xl overflow-hidden glass-card">
      <CardHeader className="bg-card/50 pb-4 border-b border-border/40">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-amber-500" />
          Report Incident
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4 bg-muted/5">
        {successMessage && (
          <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Title</Label>
              <Input 
                id="title" 
                placeholder="Brief summary" 
                value={formData.title} 
                onChange={handleChange} 
                className={`h-9 bg-background/50 text-sm ${errors.title ? "border-red-500" : ""}`} 
              />
            </div>
            
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Category</Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger className={`h-9 bg-background/50 text-sm ${errors.type ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map(type => <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className={`h-9 bg-background/50 text-sm ${errors.severity ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center justify-between">
                <span>Location</span>
                {gpsVerified && <span className="text-emerald-500 flex items-center gap-0.5 text-[9px]"><CheckCircle2 className="h-3 w-3" /> GPS</span>}
              </Label>
              <div className="relative flex items-center">
                <div className="flex-1 w-full">
                  <LocationInput 
                    value={formData.location}
                    onChange={handleLocationChange}
                    placeholder="Search area..."
                    icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                    className={errors.location ? "border-red-500 rounded-md border" : ""}
                  />
                </div>
                {formData.location && (
                  <button
                    type="button"
                    onClick={() => handleLocationChange('', null)}
                    className="absolute right-2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
                    aria-label="Clear location"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-end">
              <div className="w-full space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold invisible">GPS</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={handleUseCurrentLocation} 
                  disabled={locationLoading} 
                  className="h-9 px-3 bg-background/50 w-full text-xs font-medium"
                >
                  <Navigation className="h-3.5 w-3.5 mr-1.5" />
                  {locationLoading ? 'Fetching...' : 'Use Current GPS'}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Date & Time</Label>
              <Input
                id="dateTime"
                type="datetime-local"
                value={formData.dateTime}
                onChange={handleChange}
                className="h-9 bg-background/50 text-sm w-full"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Details of the incident..." 
                rows={3} 
                value={formData.description} 
                onChange={handleChange} 
                className={`resize-none bg-background/50 text-sm ${errors.description ? "border-red-500" : ""}`} 
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Evidence (Optional)</Label>
              <label className="flex items-center justify-center w-full h-8 px-4 transition border border-dashed rounded-md appearance-none cursor-pointer hover:border-primary border-border/60 bg-background/30">
                <span className="flex items-center space-x-2">
                  <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {images.length > 0 ? `${images.length} selected` : 'Attach images'}
                  </span>
                </span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              </label>
              {images.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <div key={i} className="text-[10px] bg-secondary px-2 py-1 rounded truncate max-w-[100px] flex items-center gap-1">
                      {img.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2 mt-1 flex items-center gap-2 p-2.5 rounded border border-red-500/20 bg-red-500/5 transition-colors hover:bg-red-500/10">
              <input 
                type="checkbox" 
                id="emergency" 
                checked={isEmergency} 
                onChange={(e) => handleEmergencyToggle(e.target.checked)} 
                className="rounded border-red-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5 cursor-pointer" 
              />
              <Label htmlFor="emergency" className="text-xs font-semibold cursor-pointer text-red-500 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Mark as Escalated Emergency
              </Label>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-4 font-semibold text-sm h-10" 
            disabled={isSubmitting} 
            variant={isEmergency ? "destructive" : "default"}
          >
            {isSubmitting ? 'Transmitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
