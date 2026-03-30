import { useState } from "react";

import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";



import { FileText, MapPin, Calendar, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

type IncidentStatus = "pending" | "approved" | "rejected";

interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  status: IncidentStatus;
  details: string;
}

const statusConfig: Record<IncidentStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-accent/15 text-accent border-accent/30",
  },
  approved: {
    label: "Approved",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

const mockIncidents: Incident[] = [
  {
    id: "1",
    title: "Theft reported near Jama Masjid",
    description: "A tourist reported pickpocketing near the main gate entrance during evening hours.",
    location: "Jama Masjid, Old Delhi",
    date: "2026-02-25",
    status: "approved",
    details:
      "The victim reported losing a wallet containing cash and identification documents. Local authorities were notified and CCTV footage is being reviewed. Tourists are advised to keep valuables secured and remain vigilant in crowded areas.",
  },
  {
    id: "2",
    title: "Scam alert at Red Fort area",
    description: "Multiple reports of fake tour guides charging exorbitant fees to unsuspecting visitors.",
    location: "Red Fort, Delhi",
    date: "2026-02-24",
    status: "pending",
    details:
      "At least 5 tourists have filed complaints about unauthorized guides demanding ₹2000–₹5000 for brief tours. Official guides carry government-issued ID badges. Visitors should only engage verified personnel at the ticket counter.",
  },
  {
    id: "3",
    title: "Road closure on NH-44",
    description: "Major highway section blocked due to construction work causing significant delays.",
    location: "NH-44, Haryana",
    date: "2026-02-23",
    status: "approved",
    details:
      "A 12 km stretch between Panipat and Karnal is under repair. Expected completion by March 5. Alternate routes via state highways SH-1 and SH-6 are recommended. Travel time may increase by 45–60 minutes.",
  },
  {
    id: "4",
    title: "Aggressive street vendor confrontation",
    description: "A traveler was harassed by street vendors near Chandni Chowk market.",
    location: "Chandni Chowk, Delhi",
    date: "2026-02-22",
    status: "rejected",
    details:
      "The report was reviewed but could not be verified due to lack of corroborating evidence. The area remains a bustling market zone; travelers are advised to stay assertive and avoid engaging with overly persistent vendors.",
  },
  {
    id: "5",
    title: "Flooding near India Gate",
    description: "Heavy monsoon rain caused waterlogging around the India Gate roundabout area.",
    location: "India Gate, New Delhi",
    date: "2026-02-20",
    status: "approved",
    details:
      "Water levels reached up to 2 feet in some stretches. Municipal crews deployed pumps and the area was cleared within 6 hours. Travelers should check weather updates and avoid low-lying routes during heavy rainfall.",
  },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 bg-muted rounded animate-pulse"></div>
              <div className="h-5 w-20 rounded-full bg-muted animate-pulse"></div>
            </div>
            <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
            <div className="flex gap-4">
              <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-28 bg-muted rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-16 text-center text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-25" />
        <p className="font-semibold text-lg mb-1">No incidents found</p>
        <p className="text-sm">There are no incident reports to display at this time.</p>
      </CardContent>
    </Card>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[incident.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glow-hover transition-colors">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <h3 className="font-display font-semibold text-base">{incident.title}</h3>
            <Badge variant="outline" className={cn("text-xs shrink-0", cfg.className)}>
              {cfg.label}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mb-3">{incident.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {incident.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(incident.date).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs px-2 h-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                Hide Details <ChevronUp className="h-3.5 w-3.5 ml-1" />
              </>
            ) : (
              <>
                View Details <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </Button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground leading-relaxed">
                  {incident.details}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const IncidentHistoryPage = () => {
  const [isLoading] = useState(false);
  const incidents = mockIncidents;

  return (
    <UserDashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Incident History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review past safety incidents and their resolution status
          </p>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : incidents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </div>

      {/*─ INTEGRATION INSTRUCTIONS─────────────────────────────
       *
       * 1. Add route in src/App.tsx:
       *    import IncidentHistoryPage from "./pages/IncidentHistoryPage";
       *    <Route path="/dashboard/user/incidents" element={<IncidentHistoryPage />} />
       *
       * 2. The sidebar already has an "Incidents" nav item pointing to
       *    /dashboard/user/incidents in UserDashboardLayout.tsx, so no
       *    additional linking is needed.
       *
       * ──────────────────────────────────────────────────────────── */}
    </UserDashboardLayout>
  );
};

export default IncidentHistoryPage;