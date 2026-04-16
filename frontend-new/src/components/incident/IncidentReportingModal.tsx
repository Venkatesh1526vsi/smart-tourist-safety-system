import { useState, useEffect } from "react";
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);

    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);
    e.target.value = "";
  };
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const canProceed = () => {
    if (step === 0) return !!category;
    if (step === 1) return !!location && !!description && !!severity;
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Guard: prevent multiple submissions
    if (isSubmitting) return;

    console.log("SUBMIT TRIGGERED");

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Clean and validate payload
      const cleanType = category?.trim();
      const cleanDescription = description?.trim();

      if (!cleanType || !cleanDescription) {
        alert("Type and Description are required");
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem("token");

      // Extract coordinates from location string if available
      let latitude: number | undefined;
      let longitude: number | undefined;
      const coordMatch = location.match(/Lat:\s*(-?\d+\.\d+).*Lng:\s*(-?\d+\.\d+)/);
      if (coordMatch) {
        latitude = parseFloat(coordMatch[1]);
        longitude = parseFloat(coordMatch[2]);
      }

      // Build FormData for image upload support
      const formData = new FormData();
      formData.append("type", cleanType);
      formData.append("description", cleanDescription);

      if (latitude) formData.append("latitude", latitude.toString());
      if (longitude) formData.append("longitude", longitude.toString());

      // Append images ONLY if they exist
      if (selectedImages && selectedImages.length > 0) {
        selectedImages.forEach((file) => {
          if (file instanceof File) {
            formData.append("image", file);
          }
        });
      }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/incidents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || "Failed to submit incident");

      if (res?.success) {
        setSubmitSuccess(true);

        // trigger refresh
        window.dispatchEvent(new Event("incident-reported"));

        resetForm();
        onOpenChange(false);

        setTimeout(() => setSubmitSuccess(false), 500);
      }

    } catch (error) {
      console.error("Incident submission error:", error);
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
    setSelectedImages([]);
    setPreviewUrls([]);
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
        } catch {
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
        <form onSubmit={handleSubmit}>
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
                  className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? "bg-emerald" : "bg-muted"
                    }`}
                />
                <span
                  className={`text-[10px] font-medium ${i <= step ? "text-emerald" : "text-muted-foreground"
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
                          className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selected
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div>
                        <label className="block font-medium mb-2">Upload Image</label>

                        <p className="text-sm text-gray-500">Upload from device</p>
                        <input
                          type="file"
                          name="image"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                        />

                        <p className="text-sm text-gray-500 mt-2">Or capture from camera</p>
                        <input
                          type="file"
                          name="image"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageChange}
                        />
                      </div>
                      {previewUrls.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {previewUrls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt="preview"
                              className="w-24 h-24 object-cover rounded-md border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {selectedImages.length > 0 && <span>{selectedImages.length} image(s) attached</span>}
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
                type="submit"
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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentReportingModal;
