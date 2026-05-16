import { useEffect, useState } from "react";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyIncidents, type Incident } from "@/services/api";
import { FileText, MapPin, AlertTriangle, CheckCircle2, ShieldAlert, Activity } from "lucide-react";
import { useOperationalData } from "@/hooks/useOperationalData";
import { IncidentReportForm } from "@/components/forms/IncidentReportForm";
import { useNotificationStore } from "@/hooks/useNotificationStore";
import { motion, AnimatePresence } from "framer-motion";

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


// --- Main Page Component ---
export default function IncidentHistoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  
  // Intelligence from centralized operations
  const { incidents: globalIncidents, broadcasts, createLocalIncident } = useOperationalData();
  const { addNotification } = useNotificationStore();

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

  const handleIncidentSuccess = (newIncident: any) => {
    // 1. Sync globally to map and operational layer
    createLocalIncident(newIncident);
    
    // 2. Instantly update personal active reports
    setIncidents(prev => [newIncident, ...prev]);
    
    // 3. Fire lightweight user notification
    addNotification(
      'info',
      'Report Transmitted',
      'Your incident report has been securely synced with operations.'
    );
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Reporting */}
          <div className="space-y-6 lg:sticky lg:top-6">
            <IncidentReportForm onSuccess={handleIncidentSuccess} />
          </div>

          {/* Right Column: History & Intelligence */}
          <div className="space-y-8 max-h-[85vh] overflow-y-auto pr-1 pb-10">
            
            {/* Section 2: My Incident History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" /> Personal Active Reports
                </h3>
                {incidents.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{incidents.length} Total</Badge>
                )}
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-20 w-full bg-muted/40 animate-pulse rounded-xl border border-border/40" />)}
                </div>
              ) : incidents.length === 0 ? (
                <div className="p-6 rounded-xl bg-muted/10 border border-border/40 text-center flex flex-col items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-80" />
                  <p className="font-medium text-emerald-500 text-sm">All Clear / No Reports</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">You have no active or past reports to display.</p>
                </div>
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
                              <span className="font-display font-semibold text-sm leading-tight text-foreground/90">{incident.type || incident.category || 'Incident Report'}</span>
                              <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 border ${getSeverityBadgeClass(incident.severity)}`}>
                                {incident.severity}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{incident.description}</p>
                            
                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
                               <Badge variant="secondary" className="text-[10px] uppercase font-medium">
                                 {incident.status === 'pending' && incident.severity === 'critical' ? 'Patrol Assigned' : incident.status === 'pending' && incident.severity === 'high' ? 'Reviewing' : incident.status || 'Pending'}
                               </Badge>
                               <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
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