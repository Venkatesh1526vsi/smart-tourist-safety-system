import { useEffect, useState } from "react";

import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { getMyIncidents, type Incident } from "@/services/api";

import { FileText, MapPin, Calendar, AlertTriangle } from "lucide-react";

import { motion } from "framer-motion";

const getSeverityBadgeClass = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-red-500 text-white";
    case "high":
      return "bg-orange-500 text-white";
    case "medium":
      return "bg-yellow-500 text-black";
    case "low":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getIncidentLocation = (incident: Incident) => {
  if (typeof incident.latitude === "number" && typeof incident.longitude === "number") {
    return `Lat: ${incident.latitude.toFixed(4)}, Lng: ${incident.longitude.toFixed(4)}`;
  }
  return "Location unavailable";
};

const formatIncidentDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
};

const LoadingSkeleton = () => {
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
};

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="glow-hover transition-colors">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <div>
              <p className="font-display font-semibold text-base">{incident.type || 'Incident report'}</p>
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{incident.description || 'No description provided.'}</p>
            </div>
            <Badge className={getSeverityBadgeClass(incident.severity)}>
              {incident.severity?.charAt(0).toUpperCase() + incident.severity?.slice(1)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {getIncidentLocation(incident)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatIncidentDate(incident.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const IncidentHistoryPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getMyIncidents();
        setIncidents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load incidents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  return (
    <UserDashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> My Incident Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review the incidents you have reported and their details.
          </p>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <Card>
            <CardContent className="p-5 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : incidents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <IncidentCard key={incident._id} incident={incident} />
            ))}
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default IncidentHistoryPage;