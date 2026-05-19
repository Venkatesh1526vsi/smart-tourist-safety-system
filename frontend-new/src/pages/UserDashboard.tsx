import { useEffect, useState } from "react";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { MapPin, AlertTriangle, FileText, Bell, Loader2 } from "lucide-react";
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
import { useNotificationStore } from "@/hooks/useNotificationStore";
import { useGeolocation } from "@/hooks/useGeolocation";

const UserDashboard = () => {
  console.log('[UserDashboard] Component render START');
  
  useSafetySimulation(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications } = useNotificationStore();
  const location = useGeolocation(true);
  
  console.log('[UserDashboard] user from auth:', user);
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    console.log('[UserDashboard] useEffect - fetching data');
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[UserDashboard] Calling getMyIncidents and getRiskZones...');
        
        const [incidentsData, zonesData] = await Promise.all([
          getMyIncidents(),
          getRiskZones(),
        ]);
        
        console.log('[UserDashboard] Data fetched - incidents:', incidentsData?.length, 'zones:', zonesData?.length);
        setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
        setRiskZones(Array.isArray(zonesData) ? zonesData : []);
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
          <PuneWeatherWidget locationData={location} />
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
            <DashboardCard title="Live Operational Location" icon={<MapPin className="h-5 w-5 text-primary" />}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${location.loading ? 'bg-amber-500 animate-pulse' : (location.coordinates ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500')}`} />
                    <span className="font-semibold text-sm">
                      {location.loading ? 'Acquiring GPS...' : (location.coordinates ? 'GPS Active Tracking' : 'GPS Offline')}
                    </span>
                  </div>
                  {location.accuracy && (
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">
                      ±{Math.round(location.accuracy)}m
                    </span>
                  )}
                </div>
                
                <div className="p-2.5 rounded-md bg-muted/30 border border-border/50">
                  <p className="text-sm font-medium leading-tight">
                    {location.locationName || 'Awaiting position data...'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Lat: {location.coordinates?.lat?.toFixed(5) || '--'} | Lng: {location.coordinates?.lng?.toFixed(5) || '--'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button 
                    onClick={() => navigate('/dashboard/user/map')}
                    className="text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors py-1.5 rounded border border-primary/20 flex items-center justify-center gap-1"
                  >
                    <MapPin className="h-3 w-3" /> Open Map
                  </button>
                  <button 
                    className="text-[11px] font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors py-1.5 rounded border border-border flex items-center justify-center gap-1"
                  >
                    Share Location
                  </button>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Risk Zone Alerts" icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}>
              <div className="space-y-2.5">
                {Array.isArray(highRiskZones) && highRiskZones.length > 0 ? (
                  highRiskZones.map((zone, idx) => (
                    <div key={zone?._id || idx} 
                      onClick={() => navigate('/dashboard/user/map')}
                      className={`flex flex-col p-2.5 rounded border cursor-pointer transition-all hover:brightness-110 ${idx === 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{idx === 0 ? 'Critical Risk' : 'Elevated Risk'} - {zone?.name || 'Unknown Area'}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${idx === 0 ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>⚠ Active</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                        <span>Nearby active threats</span>
                        <span className="font-mono text-foreground">{idx === 0 ? '3 reported' : '1 reported'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div 
                      onClick={() => navigate('/dashboard/user/map')}
                      className="flex flex-col p-2.5 rounded border border-green-500/20 bg-green-500/10 cursor-pointer hover:bg-green-500/15 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Low Risk - All Clear</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-green-500/20 text-green-500">✓ Safe</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">No immediate threats detected in your operational radius.</p>
                    </div>
                    <div 
                      onClick={() => navigate('/dashboard/user/map')}
                      className="flex flex-col p-2.5 rounded border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Moderate - Hadapsar</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-primary/20 text-primary">ℹ Advisory</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">Increased police patrol activity reported.</p>
                    </div>
                  </>
                )}
              </div>
            </DashboardCard>

            <DashboardCard title="Incident History" icon={<FileText className="h-5 w-5 text-blue-500" />}>
              <div className="space-y-2">
                {incidents.length > 0 ? (
                  incidents.slice(0, 3).map((incident) => {
                    // Safe date parsing
                    let dateStr = '-';
                    try {
                      if (incident.created_at) {
                        const date = new Date(incident.created_at);
                        if (!isNaN(date.getTime())) {
                          dateStr = date.toLocaleDateString();
                        }
                      }
                    } catch {
                      dateStr = '-';
                    }
                    return (
                      <div 
                        key={incident._id || Math.random()} 
                        className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 p-1.5 -mx-1.5 rounded-md transition-colors"
                        onClick={() => navigate('/dashboard/user/map', { state: { focusIncident: incident } })}
                      >
                        <span className="truncate max-w-[180px]">{incident?.description || `${incident?.type || 'Unknown'} incident`}</span>
                        <span className="text-muted-foreground">{dateStr}</span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span>No recent incidents reported</span>
                      <span className="text-muted-foreground">-</span>
                    </div>
                  </>
                )}
                <div className="pt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => navigate('/dashboard/user/incidents')}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-md transition-colors"
                  >
                    Report Incident
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/user/incidents')}
                    className="text-xs border border-primary text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors"
                  >
                    View Reports
                  </button>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Operational Intelligence" icon={<Bell className="h-5 w-5 text-blue-400" />}>
              <div className="space-y-3">
                {(() => {
                  const recentNotifications = notifications.slice(0, 3);
                  
                  if (recentNotifications.length === 0) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">All Clear</p>
                        <p className="text-xs text-muted-foreground mt-1">No active intelligence alerts.</p>
                      </div>
                    );
                  }

                  return recentNotifications.map(notif => {
                    let dotColor = "bg-blue-400";
                    if (notif.type === "warning") dotColor = "bg-amber-500";
                    if (notif.type === "emergency") dotColor = "bg-red-500";

                    return (
                      <div key={notif.id} className="flex items-start gap-2 border-b border-border/40 pb-2 last:border-0 last:pb-0">
                        <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                        <div className="min-w-0">
                           <p className="text-xs font-semibold text-foreground/90 leading-tight">{notif.title}</p>
                           <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
                <div className="pt-2 border-t border-border">
                  <button
                    onClick={() => navigate('/dashboard/user/notifications')}
                    className="text-xs text-primary hover:text-primary/80 transition-colors w-full text-center py-1"
                  >
                    View Intelligence Feed
                  </button>
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
