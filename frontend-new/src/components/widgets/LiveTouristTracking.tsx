import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Radar, AlertTriangle, ShieldCheck, Phone, Navigation, Clock, LocateFixed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { notifyError, notifyWarning } from "@/utils/notify";

interface LiveTourist {
  id: string;
  name: string;
  role: string;
  latitude: number;
  longitude: number;
  safetyScore: number;
  riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
  lastActive: number;
  emergencyContact: string;
  sosActive: boolean;
  travelStatus: string;
  recentAlerts: string[];
  currentZoneId: string;
  criticalEntryTime: number;
  escalationLevel: number;
  activities: { time: number; msg: string; type: 'safe'|'moderate'|'high'|'critical'|'info' }[];
}



const getMarkerBgColor = (level: string) => {
  switch (level) {
    case "critical": return "bg-red-500 shadow-red-500/50";
    case "high": return "bg-orange-500 shadow-orange-500/50";
    case "moderate": return "bg-yellow-400 shadow-yellow-400/50";
    case "safe": return "bg-emerald-500 shadow-emerald-500/50";
    default: return "bg-blue-500 shadow-blue-500/50";
  }
};

const createIcon = (level: string) => {
  const bg = getMarkerBgColor(level);
  const isDanger = level === 'critical' || level === 'high';
  
  return L.divIcon({
    className: 'custom-leaflet-marker z-[1000]',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        ${isDanger ? `<div class="absolute inset-0 rounded-full ${bg} animate-ping opacity-75"></div>` : ''}
        <div class="relative w-4 h-4 rounded-full border-2 border-white shadow-lg ${bg}"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

interface RiskZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  riskMultiplier: number;
  fillColor: string;
  fillOpacity: number;
}

// Realistic Pune Risk Zones (One location = One Zone, No duplicates, No borders)
const RISK_ZONES: RiskZone[] = [
  // Safe (Green)
  { id: 'Z1', name: 'Baner (Safe Zone)', lat: 18.5590, lng: 73.7868, radius: 1500, riskMultiplier: 0.5, fillColor: '#22c55e', fillOpacity: 0.1 },
  { id: 'Z2', name: 'Aundh (Safe Zone)', lat: 18.5626, lng: 73.8087, radius: 1500, riskMultiplier: 0.5, fillColor: '#22c55e', fillOpacity: 0.1 },
  
  // Moderate (Yellow)
  { id: 'Z3', name: 'FC Road (Moderate)', lat: 18.5263, lng: 73.8441, radius: 1000, riskMultiplier: 1.2, fillColor: '#eab308', fillOpacity: 0.15 },
  { id: 'Z4', name: 'Kothrud (Moderate)', lat: 18.5074, lng: 73.8077, radius: 1500, riskMultiplier: 1.2, fillColor: '#eab308', fillOpacity: 0.15 },

  // High (Orange)
  { id: 'Z5', name: 'Shivajinagar (High Risk)', lat: 18.5314, lng: 73.8446, radius: 1200, riskMultiplier: 1.5, fillColor: '#f97316', fillOpacity: 0.2 },
  { id: 'Z6', name: 'Swargate (High Risk)', lat: 18.5018, lng: 73.8636, radius: 1200, riskMultiplier: 1.5, fillColor: '#f97316', fillOpacity: 0.2 },

  // Critical (Soft Red)
  { id: 'Z7', name: 'Pune Station (Critical)', lat: 18.5289, lng: 73.8744, radius: 1000, riskMultiplier: 2.0, fillColor: '#ef4444', fillOpacity: 0.25 },
  { id: 'Z8', name: 'Koregaon Park (Night Zone)', lat: 18.5362, lng: 73.8939, radius: 1200, riskMultiplier: 2.0, fillColor: '#ef4444', fillOpacity: 0.25 },
];

const PUNE_CENTER: [number, number] = [18.5204, 73.8567];

// Locate Users Button Component
const LocateUsersButton = ({ tourists }: { tourists: LiveTourist[] }) => {
  const map = useMap();

  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tourists.length === 0) {
      map.flyTo(PUNE_CENTER, 12, { animate: true, duration: 1 });
      return;
    }
    const bounds = L.latLngBounds(tourists.map(t => [t.latitude, t.longitude]));
    map.flyToBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', marginTop: '10px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <Button 
          onClick={handleLocate}
          variant="secondary" 
          size="sm" 
          className="bg-white hover:bg-gray-100 text-slate-800 shadow-md font-medium flex items-center gap-2 border border-slate-200"
        >
          <LocateFixed className="h-4 w-4 text-primary" />
          Locate Users
        </Button>
      </div>
    </div>
  );
};

export const LiveTouristTracking = ({ filter }: { filter?: { severity?: string, status?: string } }) => {
  const [tourists, setTourists] = useState<LiveTourist[]>([]);
  const [selectedTourist, setSelectedTourist] = useState<LiveTourist | null>(null);

  // Sync real users from localStorage
  useEffect(() => {
    const loadRealUsers = () => {
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const realTourists = storedUsers.filter((u: any) => u.role === "user");

      setTourists(prev => {
        const updated = [...prev];
        
        // Ensure fallback tourists exist if no real users are found and no previous tourists exist
        if (realTourists.length === 0 && updated.length === 0) {
           const fallbacks = Array.from({ length: 25 }).map((_, i) => {
             const isCritical = Math.random() > 0.85;
             const isHigh = !isCritical && Math.random() > 0.7;
             return {
               id: `F-${i + 1}`,
               name: `Tourist-${i + 1}`,
               role: 'Tourist',
               latOffset: (Math.random() - 0.5) * 0.15,
               lngOffset: (Math.random() - 0.5) * 0.15,
               risk: isCritical ? 'critical' : isHigh ? 'high' : 'safe'
             };
           });
           fallbacks.forEach(f => {
             updated.push({
               id: f.id,
               name: f.name,
               role: f.role,
               latitude: PUNE_CENTER[0] + f.latOffset,
               longitude: PUNE_CENTER[1] + f.lngOffset,
               safetyScore: f.risk === 'moderate' ? 75 : 100,
               riskLevel: f.risk as any,
               lastActive: Date.now(),
               emergencyContact: "112 (Emergency)",
               sosActive: false,
               travelStatus: "Active in Pune",
               recentAlerts: [],
               currentZoneId: '',
               criticalEntryTime: 0,
               escalationLevel: 0,
               activities: []
             });
           });
           return updated;
        }

        // Merge real tourists
        realTourists.forEach((rt: any) => {
          const exists = updated.find(t => t.id === rt.id || t.id === rt._id);
          if (!exists) {
            const jitterLat = (Math.random() - 0.5) * 0.05;
            const jitterLng = (Math.random() - 0.5) * 0.05;
            updated.push({
              id: rt.id || rt._id || `U-${Date.now()}-${Math.random()}`,
              name: rt.name || "Unknown Tourist",
              role: "Tourist",
              latitude: PUNE_CENTER[0] + jitterLat,
              longitude: PUNE_CENTER[1] + jitterLng,
              safetyScore: 100,
              riskLevel: 'safe',
              lastActive: Date.now(),
              emergencyContact: rt.email || "No contact",
              sosActive: false,
              travelStatus: "Active in Pune",
              recentAlerts: [],
              currentZoneId: '',
              criticalEntryTime: 0,
              escalationLevel: 0,
              activities: []
            });
          }
        });
        return updated;
      });
    };

    loadRealUsers();
    // Poll for new user registrations every 10s
    const syncInterval = setInterval(loadRealUsers, 10000);
    return () => clearInterval(syncInterval);
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
  };

  const evaluateRisk = useCallback((t: LiveTourist): LiveTourist => {
    let newScore = 100;
    let newLevel: 'safe' | 'moderate' | 'high' | 'critical' = 'safe';
    
    let activeZone: RiskZone | null = null;

    // Find highest multiplier zone the tourist is currently inside
    for (const zone of RISK_ZONES) {
      const dist = calculateDistance(t.latitude, t.longitude, zone.lat, zone.lng);
      if (dist <= zone.radius) { 
        if (!activeZone || zone.riskMultiplier > activeZone.riskMultiplier) {
          activeZone = zone;
        }
      }
    }

    if (activeZone) {
      if (activeZone.riskMultiplier >= 2.0) newLevel = 'critical';
      else if (activeZone.riskMultiplier >= 1.5) newLevel = 'high';
      else if (activeZone.riskMultiplier >= 1.2) newLevel = 'moderate';
      else newLevel = 'safe';
      newScore -= (10 * activeZone.riskMultiplier);
    }

    if (t.sosActive) {
      newScore = 10;
      newLevel = 'critical';
    }

    const updatedT = { ...t, safetyScore: Math.max(0, Math.round(newScore)), riskLevel: newLevel, lastActive: Date.now() };
    const newZoneId = activeZone ? activeZone.id : '';
    
    // Zone Transition Logic
    if (t.currentZoneId !== newZoneId) {
       updatedT.currentZoneId = newZoneId;
       updatedT.criticalEntryTime = newLevel === 'critical' ? Date.now() : 0;
       updatedT.escalationLevel = 0;
       
       if (activeZone) {
         // Entered a new zone
         const isSafe = newLevel === 'safe';
         const isModerate = newLevel === 'moderate';
         
         const actType = newLevel as 'safe'|'moderate'|'high'|'critical';
         const actMsg = isSafe ? `Entered ${activeZone.name}` :
                        isModerate ? `Moved into ${activeZone.name} (moderate activity)` :
                        `Approaching ${activeZone.name}`;
         
         updatedT.activities = [{ time: Date.now(), msg: actMsg, type: actType }, ...t.activities].slice(0, 5);
         
         // Only High risk gets an immediate temporary warning popup. Safe/Moderate are SILENT FEED ONLY. Critical handles escalation.
         if (newLevel === 'high') {
            notifyWarning(`High Risk Area: ${t.name} entered ${activeZone.name}`);
            updatedT.recentAlerts = [`Entered High Risk: ${activeZone.name} at ${new Date().toLocaleTimeString()}`, ...t.recentAlerts].slice(0, 3);
         }
       } else if (t.currentZoneId) {
         // Exited previous zone
         updatedT.activities = [{ time: Date.now(), msg: `Exited tracked zone`, type: 'info' as const }, ...t.activities].slice(0, 5);
       }
    } else if (newLevel === 'critical' && activeZone) {
       // Escalation Logic for Critical Zones (prevent popup spam)
       const elapsed = Date.now() - updatedT.criticalEntryTime;
       
       if (elapsed >= 30000 && updatedT.escalationLevel === 0) {
          // 30 seconds inside critical zone: Elevated Warning
          updatedT.escalationLevel = 1;
          notifyWarning(`Elevated Warning: ${t.name} dwelling in ${activeZone.name} > 30s`);
          updatedT.recentAlerts = [`Dwelling warning in ${activeZone.name}`, ...t.recentAlerts].slice(0, 3);
       } else if (elapsed >= 60000 && updatedT.escalationLevel === 1) {
          // 60 seconds inside critical zone: Critical Escalation
          updatedT.escalationLevel = 2;
          notifyError(`CRITICAL ESCALATION: ${t.name} dwelling in ${activeZone.name} > 60s`);
          updatedT.recentAlerts = [`Critical escalation: 60s+ in ${activeZone.name}`, ...t.recentAlerts].slice(0, 3);
       }
    }

    return updatedT;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTourists(prev => prev.map(t => {
        // Random realistic walk in Pune
        const newLat = t.latitude + (Math.random() - 0.5) * 0.001;
        const newLng = t.longitude + (Math.random() - 0.5) * 0.001;
        const updatedT = { ...t, latitude: newLat, longitude: newLng };
        return evaluateRisk(updatedT);
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, [evaluateRisk]);

  const filteredTourists = useMemo(() => {
    return tourists.filter((t: LiveTourist) => {
      if (filter?.severity === 'critical' && t.riskLevel !== 'critical' && t.riskLevel !== 'high') return false;
      if (filter?.severity === 'warning' && t.riskLevel === 'safe') return false;
      return true;
    });
  }, [tourists, filter]);

  const criticalTourists = useMemo(() => {
    return tourists.filter(t => t.riskLevel === 'critical' && t.escalationLevel > 0);
  }, [tourists]);

  const globalActivityFeed = useMemo(() => {
    const feed = tourists.flatMap(t => t.activities.map(a => ({ ...a, touristName: t.name, touristId: t.id })));
    return feed.sort((a, b) => b.time - a.time).slice(0, 20); // Keep top 20 latest events
  }, [tourists]);

  useEffect(() => {
    if (selectedTourist) {
      const updated = tourists.find(t => t.id === selectedTourist.id);
      if (updated) setSelectedTourist(updated);
    }
  }, [tourists, selectedTourist?.id]);

  return (
    <div className="space-y-4">
      {/* Persistent Critical Alert Cards (Replaces Popups) */}
      {criticalTourists.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {criticalTourists.map(ct => (
             <div key={ct.id} className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center justify-between shadow-lg shadow-red-500/5 animate-in slide-in-from-top-2">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-red-500/20 rounded-full animate-pulse">
                   <AlertTriangle className="h-5 w-5 text-red-500" />
                 </div>
                 <div>
                   <p className="font-bold text-red-600 dark:text-red-400 text-sm">{ct.name} — CRITICAL ESCALATION</p>
                   <p className="text-xs text-red-500/80">Dwelling in high-risk zone for &gt; {(Date.now() - ct.criticalEntryTime) > 60000 ? '60s' : '30s'}</p>
                 </div>
               </div>
               <Button variant="ghost" size="sm" onClick={() => setSelectedTourist(ct)} className="text-red-600 hover:bg-red-500/20">
                 View Live
               </Button>
             </div>
          ))}
        </div>
      )}

      <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm overflow-hidden flex flex-col md:flex-row h-[500px]">
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative border-r border-border shrink-0">
        <MapContainer center={PUNE_CENTER} zoom={12} scrollWheelZoom={true} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocateUsersButton tourists={filteredTourists} />
          
          {RISK_ZONES.map(zone => (
            <Circle 
               key={zone.id} 
               center={[zone.lat, zone.lng]} 
               radius={zone.radius} 
               pathOptions={{ color: 'transparent', fillColor: zone.fillColor, fillOpacity: zone.fillOpacity }}
            />
          ))}

          {filteredTourists.map((t) => (
            <Marker 
              key={t.id} 
              position={[t.latitude, t.longitude]}
              icon={createIcon(t.riskLevel)}
              eventHandlers={{ click: () => setSelectedTourist(t) }}
            >
              <Popup>
                <div className="text-sm p-1 font-medium">
                  {t.name}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm border rounded-lg p-2 shadow-lg text-xs space-y-1">
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"/> Safe</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400"/> Moderate</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"/> High Risk</div>
           <div className="flex items-center gap-2 animate-pulse"><div className="w-3 h-3 rounded-full bg-red-600"/> Critical/SOS</div>
        </div>
      </div>

      <div className="w-full md:w-1/4 h-1/2 md:h-full bg-muted/10 p-4 overflow-y-auto shrink-0 border-r border-border">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
          <Radar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Live Telemetry</h3>
        </div>

        {selectedTourist ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start">
               <div>
                  <h4 className="font-bold text-lg">{selectedTourist.name}</h4>
                  <p className="text-xs text-muted-foreground">ID: {selectedTourist.id} • Pune Zone Tracking</p>
               </div>
               <Badge variant={selectedTourist.riskLevel === 'safe' ? 'default' : selectedTourist.riskLevel === 'moderate' ? 'secondary' : 'destructive'} className={`capitalize ${selectedTourist.riskLevel === 'critical' || selectedTourist.riskLevel === 'high' ? 'animate-pulse' : ''}`}>
                 {selectedTourist.riskLevel}
               </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-background p-3 rounded-lg border relative overflow-hidden">
                  <div className={`absolute inset-0 opacity-10 ${selectedTourist.riskLevel === 'critical' ? 'bg-red-500' : 'bg-transparent'}`}></div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-1 relative z-10">
                    <ShieldCheck className="h-3 w-3" /> Safety Score
                  </span>
                  <span className={`text-xl font-bold relative z-10 ${selectedTourist.safetyScore < 50 ? 'text-red-500' : selectedTourist.safetyScore < 75 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {selectedTourist.safetyScore}/100
                  </span>
               </div>
               <div className="bg-background p-3 rounded-lg border">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-1">
                    <Navigation className="h-3 w-3" /> Travel Status
                  </span>
                  <span className="text-sm font-medium">{selectedTourist.travelStatus}</span>
               </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
               <div className="flex items-start gap-3">
                 <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                 <div>
                   <p className="text-xs font-semibold">Emergency Contact</p>
                   <p className="text-sm">{selectedTourist.emergencyContact}</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <Radar className="h-4 w-4 text-muted-foreground mt-0.5" />
                 <div>
                   <p className="text-xs font-semibold">Current Coordinates</p>
                   <p className="text-sm">{selectedTourist.latitude.toFixed(4)}, {selectedTourist.longitude.toFixed(4)}</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                 <div>
                   <p className="text-xs font-semibold">Last Active</p>
                   <p className="text-sm">{new Date(selectedTourist.lastActive).toLocaleTimeString()}</p>
                 </div>
               </div>
            </div>

            {selectedTourist.recentAlerts.length > 0 && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs font-bold text-red-500 flex items-center gap-1 mb-2">
                  <AlertTriangle className="h-4 w-4" /> Recent Alerts
                </p>
                <div className="space-y-1 max-h-[100px] overflow-y-auto">
                  {selectedTourist.recentAlerts.map((alert, idx) => (
                    <p key={idx} className="text-xs text-red-600 dark:text-red-400 border-l-2 border-red-500 pl-2">
                      {alert}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {selectedTourist.sosActive && (
               <div className="mt-4 bg-red-600 text-white p-3 rounded-lg text-center font-bold animate-pulse">
                  SOS SIGNAL ACTIVE
               </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50 p-6">
             <Radar className="h-12 w-12 text-muted-foreground" />
             <p className="text-sm">Select a tourist marker on the map to view live telemetry and safety status.</p>
          </div>
        )}
      </div>
      
      {/* Smart Live Activity Feed (Replaces Popups for Safe/Moderate) */}
      <div className="hidden md:flex w-full md:w-1/4 flex-col bg-slate-900/5 border-l border-border p-3 overflow-hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="h-3 w-3" /> Live Operations Feed
        </h3>
        <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          {globalActivityFeed.length > 0 ? globalActivityFeed.map((item, idx) => (
             <div key={`${item.touristId}-${item.time}-${idx}`} className="text-xs p-2 rounded-md bg-background/50 border border-border/50 animate-in fade-in zoom-in duration-300">
               <div className="flex items-center justify-between mb-1 opacity-70">
                 <span className="font-semibold">{item.touristName}</span>
                 <span className="text-[9px]">{new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
               </div>
               <div className="flex items-start gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${item.type === 'safe' ? 'bg-emerald-500' : item.type === 'moderate' ? 'bg-amber-400' : item.type === 'high' ? 'bg-orange-500' : item.type === 'critical' ? 'bg-red-500' : 'bg-blue-400'}`} />
                  <span className={`${item.type === 'critical' ? 'text-red-500 font-medium' : item.type === 'high' ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
                    {item.msg}
                  </span>
               </div>
             </div>
          )) : (
            <div className="text-xs text-muted-foreground text-center mt-10">No recent activity</div>
          )}
        </div>
      </div>
    </Card>
    </div>
  );
};

export default LiveTouristTracking;
