import { useState } from "react";
import MapControlPanel from "@/components/map/MapControlPanel";
import RiskZonePopupCard from "@/components/map/RiskZonePopupCard";
import IncidentReportingModal from "@/components/incident/IncidentReportingModal";
import EvidenceUploadSection from "@/components/incident/EvidenceUploadSection";
import IncidentTable from "@/components/incident/IncidentTable";
import IncidentDetailDrawer from "@/components/incident/IncidentDetailDrawer";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { EvidenceData } from "@/components/incident/EvidenceUploadSection";
import type { Incident } from "@/components/incident/IncidentTable";

const sampleZone = {
  name: "Central Market Area",
  severity: "medium" as const,
  description:
    "This area has reported moderate pickpocketing incidents during peak hours. Stay alert and keep belongings secure.",
  safetyInstructions: [
    "Keep valuables in front pockets",
    "Avoid displaying expensive items",
    "Stay in well-lit, crowded areas",
    "Report suspicious activity immediately",
  ],
};

const criticalZone = {
  name: "Old Town Border",
  severity: "critical" as const,
  description:
    "Multiple safety incidents reported. Authorities have flagged this area as high-risk after dark.",
  safetyInstructions: [
    "Avoid visiting after sunset",
    "Travel in groups only",
    "Keep emergency contacts ready",
    "Follow local authority advisories",
  ],
};

const sampleIncidents: Incident[] = [
  { id: "INC-001", user: "Rahul Sharma", category: "Theft", location: "Connaught Place, Delhi", severity: "high", status: "pending", date: "2026-02-20", description: "Wallet stolen near metro exit gate 4. The suspect fled towards the parking area.", images: ["img1.jpg"], video: null },
  { id: "INC-002", user: "Priya Verma", category: "Medical Emergency", location: "Hauz Khas Village", severity: "critical", status: "in_progress", date: "2026-02-19", description: "Tourist collapsed due to heatstroke. Ambulance was called and arrived in 12 minutes." },
  { id: "INC-003", user: "Amit Patel", category: "Lost Documents", location: "Jaipur Railway Station", severity: "low", status: "resolved", date: "2026-02-18", description: "Passport lost at platform 3. Later found at the station master's office." },
  { id: "INC-004", user: "Sara Khan", category: "Suspicious Activity", location: "Gateway of India, Mumbai", severity: "medium", status: "pending", date: "2026-02-21", description: "Unattended bag spotted near the entrance. Security was alerted." },
  { id: "INC-005", user: "John Doe", category: "Others", location: "Leh-Manali Highway", severity: "medium", status: "in_progress", date: "2026-02-22", description: "Road blocked due to landslide. Travellers stranded for 3+ hours.", video: "video1.mp4" },
];

const ComponentPreview = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceData>({
    description: "",
    images: [],
    video: null,
    voiceRecording: false,
  });
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <header>
          <h1 className="text-2xl font-bold">SAFEYATRA Component Preview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Map controls, risk zone cards, incident reporting & evidence upload
          </p>
        </header>

        {/* Incident Management Panel */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Incident Management</h2>
          <IncidentTable incidents={sampleIncidents} onSelectIncident={handleSelectIncident} />
        </section>
        <IncidentDetailDrawer
          incident={selectedIncident}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        {/* Map Components Row */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Map Components</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <MapControlPanel />
            <RiskZonePopupCard zone={sampleZone} />
            <RiskZonePopupCard zone={criticalZone} />
          </div>
        </section>

        {/* Incident Reporting */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Incident Reporting</h2>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-emerald text-emerald-foreground hover:bg-emerald/90 dark:bg-cyan dark:text-cyan-foreground dark:hover:bg-cyan/90"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report an Incident
          </Button>
          <IncidentReportingModal open={modalOpen} onOpenChange={setModalOpen} />
        </section>

        {/* Evidence Upload Standalone */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Evidence Upload (Standalone)</h2>
          <div className="max-w-lg rounded-lg border bg-card p-6 shadow-sm dark:bg-secondary/50 dark:backdrop-blur-sm">
            <EvidenceUploadSection
              evidence={evidence}
              onEvidenceChange={setEvidence}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ComponentPreview;
