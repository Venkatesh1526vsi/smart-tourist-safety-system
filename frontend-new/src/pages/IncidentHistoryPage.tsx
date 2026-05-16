import { useEffect, useState } from "react";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyIncidents, type Incident } from "@/services/api";
import { FileText, MapPin, Calendar, AlertTriangle, CheckCircle2, Upload, Crosshair, ShieldAlert, Navigation, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useOperationalData } from "@/hooks/useOperationalData";

const getSeverityBadgeClass = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-red-500/10 text-red-500 border-red-500/20";
    case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "low": return "bg-green-500/10 text-green-500 border-green-500/20";
    default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
};

const getIncidentLocation = (incident: any) => {
  if (typeof incident.latitude === "number" && typeof incident.longitude === "number") {
    return `Lat: ${incident.latitude.toFixed(4)}, Lng: ${incident.longitude.toFixed(4)}`;
  }
  return incident.location || "Location unavailable";
};

const formatIncidentDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// --- Report Form Component ---
function CompactReportForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '', description: '', location: '', type: '', dateTime: new Date().toISOString().slice(0, 16),
  });
  const [severity, setSeverity] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
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
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let resolvedLocation = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          if (city) resolvedLocation = `${city} (Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)})`;
        } catch {}
        setFormData(prev => ({ ...prev, location: resolvedLocation }));
        setLocationLoading(false);
      },
      () => { setLocationLoading(false); alert('Unable to fetch current location'); }
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
    
    const latMatch = formData.location?.match(/Lat:\s*([0-9.-]+)/);
    const lngMatch = formData.location?.match(/Lng:\s*([0-9.-]+)/);
    const latitude = latMatch ? parseFloat(latMatch[1]) : null;
    const longitude = lngMatch ? parseFloat(lngMatch[1]) : null;
    
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
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formDataToSend,
      });

      if (response.ok) {
        setSuccessMessage("Operational report submitted.");
        setFormData({ title: "", description: "", location: "", type: "", dateTime: new Date().toISOString().slice(0, 16) });
        setSeverity(""); setIsEmergency(false); setImages([]);
        setTimeout(() => setSuccessMessage(""), 4000);
        onSuccess();
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
            <CheckCircle2 className="h-4 w-4" /> {successMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Title</Label>
              <Input id="title" placeholder="Brief summary" value={formData.title} onChange={handleChange} className={`h-9 bg-background/50 text-sm ${errors.title ? "border-red-500" : ""}`} />
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
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Location</Label>
              <div className="flex gap-2">
                <Input id="location" placeholder="Coordinates or area" value={formData.location} onChange={handleChange} className={`h-9 bg-background/50 text-sm ${errors.location ? "border-red-500" : ""}`} />
                <Button type="button" size="sm" variant="outline" onClick={handleUseCurrentLocation} disabled={locationLoading} className="h-9 px-3 bg-background/50">
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Description</Label>
              <Textarea id="description" placeholder="Details of the incident..." rows={3} value={formData.description} onChange={handleChange} className={`resize-none bg-background/50 text-sm ${errors.description ? "border-red-500" : ""}`} />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Evidence (Optional)</Label>
              <label className="flex items-center justify-center w-full h-9 px-4 transition border border-dashed rounded-md appearance-none cursor-pointer hover:border-primary border-border/60 bg-background/30">
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

            <div className="col-span-2 mt-1 flex items-center gap-2 p-2 rounded border border-red-500/20 bg-red-500/5">
              <input type="checkbox" id="emergency" checked={isEmergency} onChange={(e) => handleEmergencyToggle(e.target.checked)} className="rounded border-red-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5 cursor-pointer" />
              <Label htmlFor="emergency" className="text-xs font-semibold cursor-pointer text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Mark as Escalated Emergency
              </Label>
            </div>
          </div>
          
          <Button type="submit" className="w-full mt-4 font-semibold text-sm h-10" disabled={isSubmitting} variant={isEmergency ? "destructive" : "default"}>
            {isSubmitting ? 'Transmitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// --- Main Page Component ---
export default function IncidentHistoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  
  // Intelligence from centralized operations
  const { incidents: globalIncidents, broadcasts } = useOperationalData();

  const fetchMyIncidents = async () => {
    try {
      setIsLoading(true);
      const response: any = await getMyIncidents();
      const finalData = response?.data?.data || [];
      setIncidents(Array.isArray(finalData) ? finalData : []);
    } catch (err) {
      console.error("Failed to load personal incidents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyIncidents();
  }, []);

  // Filter global intelligence for the user
  // Only high/critical global incidents, avoiding exposing exact user info
  const safetyAdvisories = globalIncidents
    .filter(i => (i.severity === 'critical' || i.severity === 'high') && !i.deleted && i.status !== 'resolved')
    .slice(0, 4);

  const activeBroadcasts = broadcasts.slice(0, 2);

  return (
    <UserDashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="h-6 w-6 text-primary" />
              <h1 className="font-display text-2xl font-bold tracking-tight">Tactical Incident Operations</h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-xl">
              Centralized operational reporting and real-time safety advisories.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 h-7 px-3 flex items-center font-medium">
              <Activity className="w-3.5 h-3.5 mr-1.5" /> Operations Active
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Reporting */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6 sticky top-6">
            <CompactReportForm onSuccess={fetchMyIncidents} />
          </div>

          {/* Right Column: History & Intelligence */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
            
            {/* Section 2: My Incident History */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-muted-foreground" /> Personal Active Reports
              </h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-20 w-full bg-muted/40 animate-pulse rounded-xl border border-border/40" />)}
                </div>
              ) : incidents.length === 0 ? (
                <Card className="bg-muted/5 border-dashed border-border/60">
                  <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="font-medium text-emerald-500 mb-1">All Clear / No Reports</p>
                    <p className="text-sm text-muted-foreground max-w-sm">You have no active or past reports. Stay vigilant and monitor the operational intelligence feed below.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatePresence>
                    {incidents.map((incident) => (
                      <motion.div key={incident._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group h-full">
                        <Card 
                          className="cursor-pointer hover:border-primary/50 transition-all overflow-hidden h-full flex flex-col"
                          onClick={() => setSelectedIncidentId(prev => prev === incident._id ? null : incident._id)}
                        >
                          <CardContent className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <span className="font-display font-semibold text-sm leading-tight text-foreground/90">{incident.title || incident.type || 'Incident Report'}</span>
                              <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 border ${getSeverityBadgeClass(incident.severity)}`}>
                                {incident.severity}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{incident.description}</p>
                            
                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
                               <Badge variant="secondary" className="text-[10px] uppercase font-medium">
                                 {incident.status || 'Pending'}
                               </Badge>
                               <div className="text-[10px] text-muted-foreground font-medium">
                                 {formatIncidentDate(incident.created_at)}
                               </div>
                            </div>

                            {selectedIncidentId === incident._id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4 border-t border-border/40 space-y-3 text-sm">
                                <div>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Location</p>
                                  <p className="flex items-center gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5 text-primary" /> {getIncidentLocation(incident)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Full Description</p>
                                  <p className="bg-muted/30 p-2.5 rounded-md text-foreground/80 leading-relaxed text-xs">
                                    {incident.description}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Section 3: Nearby Safety Advisories */}
            <div className="space-y-4 pt-2">
              <h3 className="font-display font-semibold flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Operational Intelligence & Advisories
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeBroadcasts.map((b: any) => (
                  <Card key={b.id} className="bg-amber-500/5 border-amber-500/20 shadow-none">
                    <CardContent className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between mb-1">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[9px] uppercase font-bold tracking-widest">
                          System Broadcast
                        </Badge>
                      </div>
                      <p className="font-semibold text-sm text-amber-600/90 dark:text-amber-500/90 leading-tight">{b.title}</p>
                      <p className="text-xs text-muted-foreground leading-snug line-clamp-3">{b.message}</p>
                    </CardContent>
                  </Card>
                ))}

                {safetyAdvisories.map((adv: any) => (
                  <Card key={adv._id} className="bg-muted/5 border-border/50 shadow-none">
                    <CardContent className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between mb-1">
                        <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-widest border ${getSeverityBadgeClass(adv.severity)}`}>
                          {adv.severity} Alert
                        </Badge>
                      </div>
                      <p className="font-semibold text-sm text-foreground/90 leading-tight">{adv.type} Warning</p>
                      <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 mt-1">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5" /> 
                        <span className="line-clamp-2">Reported near {adv.location || adv.description?.split('near')?.[1] || 'your designated zone'}</span>
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {safetyAdvisories.length === 0 && activeBroadcasts.length === 0 && (
                  <div className="col-span-full p-4 rounded-xl bg-muted/20 border border-border/20 text-center text-sm text-muted-foreground font-medium flex flex-col items-center justify-center h-24">
                    <ShieldAlert className="h-5 w-5 mb-2 opacity-50" />
                    No active warnings in your zone.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </UserDashboardLayout>
  );
}