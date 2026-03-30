import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X, Loader2, Image as ImageIcon, Video, CheckCircle } from "lucide-react";
import { updateIncident } from "@/services/api";
import type { Incident } from "./IncidentTable";

interface IncidentDetailDrawerProps {
  incident: Incident | null;
  open: boolean;
  onClose: () => void;
}

const severityColor: Record<string, string> = {
  low: "bg-emerald text-emerald-foreground",
  medium: "bg-amber text-amber-foreground",
  high: "bg-amber text-amber-foreground",
  critical: "bg-critical text-critical-foreground",
};

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const IncidentDetailDrawer = ({ incident, open, onClose }: IncidentDetailDrawerProps) => {
  const [status, setStatus] = useState(incident?.status || "pending");
  const [priority, setPriority] = useState(incident?.severity || "medium");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset when incident changes
  const incidentId = incident?.id;
  const [lastId, setLastId] = useState<string | null>(null);

  if (incidentId && incidentId !== lastId) {
    setLastId(incidentId);
    setStatus(incident?.status || "pending");
    setPriority(incident?.severity || "medium");
    setRemarks("");
    setSaveError(null);
    setSaveSuccess(false);
  }

  const handleSave = async () => {
    if (!incident?._id) {
      setSaveError('Invalid incident ID');
      return;
    }
    
    setSaving(true);
    setSaveError(null);
    
    try {
      await updateIncident(incident._id, {
        status,
        severity: priority,
        resolution_notes: remarks || undefined,
      });
      
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        setSaveSuccess(false);
      }, 1500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to update incident. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && incident && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-card shadow-lg overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-mono">{incident._id || incident.id}</p>
                  <h2 className="text-lg font-semibold">{incident.category}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Error/Success Messages */}
              {saveError && (
                <Alert variant="destructive">
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}
              
              {saveSuccess && (
                <Alert className="bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-700 dark:text-emerald-400">
                    Incident updated successfully!
                  </AlertDescription>
                </Alert>
              )}

              {/* Meta Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={severityColor[incident.severity]}>
                  {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                </Badge>
                <Badge variant="secondary">{incident.location}</Badge>
                <Badge variant="outline">{incident.date}</Badge>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {incident.description || "No description provided."}
                </p>
              </div>

              {/* Media Preview */}
              {(incident.images?.length || incident.video) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Evidence</p>
                  {incident.images && incident.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {incident.images.map((_img, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-md border bg-muted flex items-center justify-center"
                        >
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                  {incident.video && (
                    <div className="rounded-md border bg-muted p-4 flex items-center gap-2">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Video attached</span>
                    </div>
                  )}
                </div>
              )}

              {/* Change Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(value: string) => setStatus(value as "pending" | "in_progress" | "resolved")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={(value: string) => setPriority(value as "low" | "medium" | "high" | "critical")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Remarks */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Admin Remarks</label>
                <Textarea
                  placeholder="Add remarks or notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Save */}
              <Button
                className="w-full bg-emerald text-emerald-foreground hover:bg-emerald/90 dark:bg-cyan dark:text-cyan-foreground dark:hover:bg-cyan/90"
                onClick={handleSave}
                disabled={saving || saveSuccess}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {saveSuccess && <CheckCircle className="h-4 w-4 mr-2" />}
                {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default IncidentDetailDrawer;
