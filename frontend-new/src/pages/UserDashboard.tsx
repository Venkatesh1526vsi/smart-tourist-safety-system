import { useEffect, useState } from "react";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { MapPin, AlertTriangle, FileText, Bell, Loader2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSafetySimulation } from "@/hooks/useSafetySimulation";
import EmergencySOSWidget from "@/components/widgets/EmergencySOSWidget";
import NearbyEmergencyContactsWidget from "@/components/widgets/NearbyEmergencyContactsWidget";
import TravelSafetyTipsWidget from "@/components/widgets/TravelSafetyTipsWidget";
import RouteSafetySuggestionWidget from "@/components/widgets/RouteSafetySuggestionWidget";
import PuneWeatherWidget from "@/components/widgets/PuneWeatherWidget";
import PuneSafetyNewsWidget from "@/components/widgets/PuneSafetyNewsWidget";
import { getMyIncidents, getRiskZones, type Incident, type RiskZone } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  console.log('[UserDashboard] Component render START');
  
  useSafetySimulation(true, 15000);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  console.log('[UserDashboard] user from auth:', user);
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get severity badge color
  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  useEffect(() => {
    console.log('[UserDashboard] useEffect - fetching data');
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[UserDashboard] Calling getMyIncidents and getRiskZones...');

        const incidents = await getMyIncidents();

        let zones: RiskZone[] = [];
        try {
          zones = await getRiskZones();
        } catch (err) {
          console.warn("Risk zones failed, continuing without it");
          zones = [];
        }

        console.log('[UserDashboard] Data fetched - incidents:', incidents?.length, 'zones:', zones?.length);
        setIncidents(Array.isArray(incidents) ? incidents : []);
        setRiskZones(Array.isArray(zones) ? zones : []);
      } catch (err) {
        console.error('[UserDashboard] Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        console.log('[UserDashboard] Setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty deps = run once on mount

  // Get high-risk zones for Pune - SAFE: Check if array exists
  const highRiskZones = Array.isArray(riskZones) 
    ? riskZones.filter(z => z.riskLevel === 'high').slice(0, 2)
    : [];

  return (
    <UserDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Welcome, {user?.name || 'Traveler'} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your safety overview</p>
        </div>

        {/* Emergency Widgets Row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <EmergencySOSWidget />
          <NearbyEmergencyContactsWidget />
          <TravelSafetyTipsWidget />
          <RouteSafetySuggestionWidget />
        </div>

        {/* Live Data Widgets */}
        <div className="grid md:grid-cols-2 gap-6">
          <PuneWeatherWidget />
          <PuneSafetyNewsWidget />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading your dashboard...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            <DashboardCard title="Live Location" icon={<MapPin className="h-5 w-5 text-primary" />}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>GPS Active</span>
                </div>
                <p className="text-xs">Lat: 18.5204 | Lng: 73.8567</p>
                <p className="text-xs">Pune, Maharashtra, India</p>
              </div>
            </DashboardCard>

            <DashboardCard title="Risk Zone Alerts" icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}>
              <div className="space-y-2">
                {Array.isArray(highRiskZones) && highRiskZones.length > 0 ? (
                  highRiskZones.map((zone, idx) => (
                    <div key={zone?._id || idx} className={`flex items-center justify-between p-2 rounded ${idx === 0 ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                      <span className="text-xs font-medium">{idx === 0 ? 'High' : 'Moderate'} Risk - {zone?.name || 'Unknown Area'}</span>
                      <span className={`text-xs ${idx === 0 ? 'text-red-500' : 'text-amber-500'}`}>⚠ Active</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between p-2 rounded bg-green-500/10">
                      <span className="text-xs font-medium">Low Risk - All Clear</span>
                      <span className="text-xs text-green-500">✓ Safe</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-primary/5">
                      <span className="text-xs font-medium">Moderate - Hadapsar</span>
                      <span className="text-xs text-primary">ℹ Advisory</span>
                    </div>
                  </>
                )}
              </div>
            </DashboardCard>

            <DashboardCard title="Incident History" icon={<FileText className="h-5 w-5 text-blue-500" />}>
              <div className="space-y-3">
                {incidents.length > 0 ? (
                  incidents.slice(0, 3).map((incident) => {
                    let dateStr = '-';
                    try {
                      if (incident.created_at) {
                        const date = new Date(incident.created_at);
                        if (!isNaN(date.getTime())) {
                          dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                        }
                      }
                    } catch {
                      dateStr = '-';
                    }

                    return (
                      <div key={incident._id} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{incident?.type || 'Unknown incident'}</p>
                            <p className="text-xs text-muted-foreground truncate">{incident?.description || 'No description available'}</p>
                          </div>
                          <Badge className={getSeverityBadgeColor(incident.severity)}>
                            {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          {typeof incident.latitude === 'number' && typeof incident.longitude === 'number' && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {incident.latitude.toFixed(3)}, {incident.longitude.toFixed(3)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No incidents reported yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Stay safe and report any incidents you encounter</p>
                  </div>
                )}
                <div className="pt-3 flex flex-col sm:flex-row gap-2 border-t border-border">
                  <button
                    onClick={() => navigate('/report-incident')}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-md transition-colors flex-1"
                  >
                    Report Incident
                  </button>
                  {incidents.length > 0 && (
                    <button
                      onClick={() => navigate('/dashboard/user/incidents')}
                      className="text-xs border border-primary text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors flex-1"
                    >
                      View All Reports
                    </button>
                  )}
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Notifications" icon={<Bell className="h-5 w-5 text-blue-400" />}>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Weather advisory: Heavy rain expected in Pune
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Emergency contact updated successfully
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Safety tips for your destination
                </div>
              </div>
            </DashboardCard>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default UserDashboard;
