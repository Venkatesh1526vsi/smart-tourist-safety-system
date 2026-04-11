import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EvidenceUploadSection, {
  type EvidenceData,
} from "./EvidenceUploadSection";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Stethoscope,
  FileSearch,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { reportIncident } from "@/services/api";

interface IncidentReportingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { id: "theft", label: "Theft", icon: ShieldAlert },
  { id: "medical", label: "Medical Emergency", icon: Stethoscope },
  { id: "documents", label: "Lost Documents", icon: FileSearch },
  { id: "suspicious", label: "Suspicious Activity", icon: Eye },
  { id: "others", label: "Others", icon: MoreHorizontal },
] as const;

const STEPS = ["Category", "Details", "Evidence", "Review"];

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const IncidentReportingModal = ({
  open,
  onOpenChange,
}: IncidentReportingModalProps) => {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<string>("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceData>({
    description: "",
    images: [],
    video: null,
    voiceRecording: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const canProceed = () => {
    if (step === 0) return !!category;
    if (step === 1) return !!location && !!description && !!severity;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Prepare incident data
      const incidentData = {
        type: category,
        description: description + (evidence.description ? `\n\nEvidence Notes: ${evidence.description}` : ''),
        severity: severity,
        isEmergency: isEmergency,
        category: category,
        locationId: location,
        // Note: In production, get actual GPS coordinates
        latitude: 18.5204, // Pune default
        longitude: 73.8567, // Pune default
      };
      
      await reportIncident(incidentData);
      
      setSubmitSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit incident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setCategory("");
    setLocation("");
    setSeverity("");
    setDescription("");
    setTime("");
    setLocationLoading(false);
    setIsEmergency(false);
    setEvidence({ description: "", images: [], video: null, voiceRecording: false });
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get city name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          // Extract city name (prefer city, then town, then village)
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          
          if (city) {
            setLocation(`${city} (Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)})`);
          } else {
            setLocation(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
          }
        } catch (error) {
          // Fallback to coordinates only
          setLocation(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
        }
        
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location access denied");
        } else {
          alert("Error getting location");
        }
      }
    );
  };

  const handleEmergencyChange = (checked: boolean) => {
    setIsEmergency(checked);
    if (checked) {
      setSeverity("critical");
    }
  };

  const selectedCategory = CATEGORIES.find((c) => c.id === category);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-lg dark:bg-secondary/80 dark:backdrop-blur-sm overflow-hidden">
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
          <DialogDescription>
            Complete the steps below to submit your report.
          </DialogDescription>
        </DialogHeader>
        
        {submitError && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        
        {submitSuccess && (
          <Alert className="mt-2 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700 dark:text-emerald-400">
              Incident reported successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Step Indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  i <= step ? "bg-emerald" : "bg-muted"
                }`}
              />
              <span
                className={`text-[10px] font-medium ${
                  i <= step ? "text-emerald" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const selected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? "border-emerald bg-emerald/10 dark:border-cyan dark:bg-cyan/10"
                            : "border-border hover:border-emerald/40 dark:hover:border-cyan/40"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${selected ? "text-emerald dark:text-cyan" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Where did this happen?"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={locationLoading}
                        variant="outline"
                        size="sm"
                      >
                        {locationLoading ? "Fetching location..." : "📍 Use Current Location"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="What happened?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Severity *</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="emergency"
                      checked={isEmergency}
                      onChange={(e) => handleEmergencyChange(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="emergency" className="text-sm font-medium cursor-pointer">
                      🚨 Mark as Emergency
                    </Label>
                  </div>
                </div>
              )}

              {step === 2 && (
                <EvidenceUploadSection
                  evidence={evidence}
                  onEvidenceChange={setEvidence}
                />
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Category</span>
                      <Badge className="bg-emerald text-emerald-foreground dark:bg-cyan dark:text-cyan-foreground">
                        {selectedCategory?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Severity</span>
                      <Badge className="bg-orange-500 text-white">
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Badge>
                    </div>
                    {isEmergency && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">Emergency</span>
                        <Badge className="bg-red-500 text-white">
                          🚨 Yes
                        </Badge>
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Location</span>
                      <p className="text-sm">{location}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Description</span>
                      <p className="text-sm">{description}</p>
                    </div>
                    {time && (
                      <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">Time</span>
                        <p className="text-sm">{new Date(time).toLocaleString()}</p>
                      </div>
                    )}
                    {evidence.description && (
                      <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">Evidence Notes</span>
                        <p className="text-sm">{evidence.description}</p>
                      </div>
                    )}
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {evidence.images.length > 0 && <span>{evidence.images.length} image(s)</span>}
                      {evidence.video && <span>1 video</span>}
                      {evidence.voiceRecording && <span>Voice recording</span>}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed() || isSubmitting}
              size="sm"
              className="bg-emerald text-emerald-foreground hover:bg-emerald/90 dark:bg-cyan dark:text-cyan-foreground dark:hover:bg-cyan/90"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              size="sm"
              disabled={isSubmitting || submitSuccess}
              className="bg-emerald text-emerald-foreground hover:bg-emerald/90 dark:bg-cyan dark:text-cyan-foreground dark:hover:bg-cyan/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Submitting...
                </>
              ) : submitSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" /> Submitted
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" /> Submit
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentReportingModal;
