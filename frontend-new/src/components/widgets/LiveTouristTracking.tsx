import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Radar, AlertTriangle, ShieldCheck, Phone, Navigation, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
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
}

const getMarkerColor = (level: string) => {
  switch (level) {
    case "critical": return "red";
    case "high": return "orange";
    case "moderate": return "yellow";
    case "safe": return "green";
    default: return "blue";
  }
};

const createIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

// Simulated Risk Zones
const RISK_ZONES = [
  { id: 'Z1', name: 'Northern Mountain Pass', lat: 21.0, lng: 79.0, radius: 25000, riskMultiplier: 1.8 },
  { id: 'Z2', name: 'Coastal Flood Area', lat: 20.0, lng: 78.5, radius: 30000, riskMultiplier: 2.2 },
];

const INITIAL_TOURISTS: LiveTourist[] = [
  {
    id: "T-001", name: "Alice Johnson", role: "Tourist",
    latitude: 20.8, longitude: 79.2, safetyScore: 95, riskLevel: 'safe',
    lastActive: Date.now(), emergencyContact: "Bob Johnson (+1 555-0100)", sosActive: false,
    travelStatus: "In Transit", recentAlerts: []
  },
  {
    id: "T-002", name: "Michael Smith", role: "Tourist",
    latitude: 20.1, longitude: 78.8, safetyScore: 88, riskLevel: 'safe',
    lastActive: Date.now(), emergencyContact: "Sarah Smith (+1 555-0200)", sosActive: false,
    travelStatus: "Stationary", recentAlerts: []
  },
  {
    id: "T-003", name: "David Lee", role: "Guide",
    latitude: 21.1, longitude: 79.3, safetyScore: 70, riskLevel: 'moderate',
    lastActive: Date.now(), emergencyContact: "Agency Coord (+1 555-0300)", sosActive: false,
    travelStatus: "Moving to Basecamp", recentAlerts: ["Weather warning issued 2h ago"]
  },
];

export const LiveTouristTracking = ({ filter }: { filter?: { severity?: string, status?: string } }) => {
  const [tourists, setTourists] = useState<LiveTourist[]>(INITIAL_TOURISTS);
  const [selectedTourist, setSelectedTourist] = useState<LiveTourist | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Haversine formula
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in metres
  };

  const evaluateRisk = useCallback((t: LiveTourist): LiveTourist => {
    let newScore = 100;
    let newLevel: 'safe' | 'moderate' | 'high' | 'critical' = 'safe';
    let enteredDangerZone = false;
    let zoneName = '';

    for (const zone of RISK_ZONES) {
      const dist = calculateDistance(t.latitude, t.longitude, zone.lat, zone.lng);
      if (dist <= zone.radius * 1.5) { // approaching
        newScore -= 20 * zone.riskMultiplier;
        newLevel = 'moderate';
      }
      if (dist <= zone.radius) { // inside
        newScore -= 40 * zone.riskMultiplier;
        newLevel = 'high';
        if (t.riskLevel !== 'high' && t.riskLevel !== 'critical') {
           enteredDangerZone = true;
           zoneName = zone.name;
        }
      }
    }

    if (t.sosActive) {
      newScore = 10;
      newLevel = 'critical';
    } else if (newScore < 30) {
      newLevel = 'critical';
    } else if (newScore < 60) {
      newLevel = 'high';
    }

    // Auto Alerts
    if (enteredDangerZone) {
      notifyError(`CRITICAL: ${t.name} entered high risk zone: ${zoneName}`);
      t.recentAlerts.unshift(`Auto-Alert: Entered ${zoneName} at ${new Date().toLocaleTimeString()}`);
    } else if (t.riskLevel !== 'moderate' && newLevel === 'moderate') {
      notifyWarning(`WARNING: ${t.name} is approaching a risk zone.`);
    }

    return { ...t, safetyScore: Math.max(0, Math.round(newScore)), riskLevel: newLevel, lastActive: Date.now() };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTourists(prev => prev.map(t => {
        // Simulate movement towards Z1 (danger) for T-003, random jitter for others
        let newLat = t.latitude;
        let newLng = t.longitude;
        
        if (t.id === 'T-003') {
           // Move closer to 21.0, 79.0
           newLat -= 0.01;
           newLng -= 0.01;
        } else {
           newLat += (Math.random() - 0.5) * 0.01;
           newLng += (Math.random() - 0.5) * 0.01;
        }

        const updatedT = { ...t, latitude: newLat, longitude: newLng };
        return evaluateRisk(updatedT);
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [evaluateRisk]);

  // Sync with dashboard filter
  const filteredTourists = useMemo(() => {
    return tourists.filter((t: LiveTourist) => {
      if (filter?.severity === 'critical' && t.riskLevel !== 'critical' && t.riskLevel !== 'high') return false;
      if (filter?.severity === 'warning' && t.riskLevel === 'safe') return false;
      return true;
    });
  }, [tourists, filter]);

  // Update selected tourist if it changes in the main array
  useEffect(() => {
    if (selectedTourist) {
      const updated = tourists.find(t => t.id === selectedTourist.id);
      if (updated) setSelectedTourist(updated);
    }
  }, [tourists, selectedTourist?.id]);

  const center: [number, number] = [20.5937, 78.9629];

  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm overflow-hidden flex flex-col md:flex-row h-[600px]">
      <div className="w-full md:w-2/3 h-1/2 md:h-full relative border-r border-border">
        <MapContainer center={center} zoom={6} scrollWheelZoom={true} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Render Risk Zones */}
          {RISK_ZONES.map(zone => (
            <Circle 
               key={zone.id} 
               center={[zone.lat, zone.lng]} 
               radius={zone.radius} 
               pathOptions={{ color: 'red', fillColor: '#ef4444', fillOpacity: 0.2 }}
            />
          ))}

          {filteredTourists.map((t) => (
            <Marker 
              key={t.id} 
              position={[t.latitude, t.longitude]}
              icon={createIcon(getMarkerColor(t.riskLevel))}
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
        
        {/* Floating map legend/status */}
        <div className="absolute top-4 right-4 z-[1000] bg-background/90 backdrop-blur-sm border rounded-lg p-2 shadow-lg text-xs space-y-1">
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"/> Safe</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400"/> Moderate</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"/> High Risk</div>
           <div className="flex items-center gap-2 animate-pulse"><div className="w-3 h-3 rounded-full bg-red-600"/> Critical/SOS</div>
        </div>
      </div>

      <div className="w-full md:w-1/3 h-1/2 md:h-full bg-muted/10 p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
          <Radar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Live Telemetry</h3>
        </div>

        {selectedTourist ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start">
               <div>
                  <h4 className="font-bold text-lg">{selectedTourist.name}</h4>
                  <p className="text-xs text-muted-foreground">ID: {selectedTourist.id} • {selectedTourist.role}</p>
               </div>
               <Badge variant={selectedTourist.riskLevel === 'safe' ? 'default' : selectedTourist.riskLevel === 'moderate' ? 'secondary' : 'destructive'} className="capitalize">
                 {selectedTourist.riskLevel}
               </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-background p-3 rounded-lg border">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-1">
                    <ShieldCheck className="h-3 w-3" /> Safety Score
                  </span>
                  <span className={`text-xl font-bold ${selectedTourist.safetyScore < 50 ? 'text-red-500' : 'text-emerald-500'}`}>
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
                <div className="space-y-1">
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
    </Card>
  );
};

export default LiveTouristTracking;
