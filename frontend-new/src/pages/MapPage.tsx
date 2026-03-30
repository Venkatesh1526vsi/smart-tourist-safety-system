import { useEffect, useState, useRef, useCallback } from "react";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import {
  MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet-gesture-handling";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import {
  Loader2, AlertCircle, Locate, MapPin, Route, Plus, X,
  Trash2, ChevronDown, ChevronUp, Navigation, Shuffle, Check,
} from "lucide-react";
import { getAllIncidents, type Incident as ApiIncident } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// ─── Types ───────────────────────────────────────────────────────────────────
type Coordinates = { lat: number; lng: number };
type RouteType = "fastest" | "safest" | "balanced";
type MapIncident = {
  id: string; lat: number; lng: number; title: string;
  description: string; severity: "low" | "medium" | "high" | "critical";
};
type StopInput = { id: string; label: string; coords: Coordinates | null };
type SafetyBreakdown = {
  score: number; riskZonesCrossed: number; highRiskAreas: number;
  incidentsNearby: number; nightSafetyIndex: "Low" | "Medium" | "High";
};
type RouteInfo = {
  totalDurationSec: number; totalDistanceM: number; totalDistanceKm: number;
  segments: { from: string; to: string; durationSec: number }[];
};
type PlaceSuggestion = { id: string; lat: number; lng: number; name: string; category: string; description: string };
type NominatimResult = { place_id: number; display_name: string; lat: string; lon: string };

// ─── Leaflet icons ───────────────────────────────────────────────────────────
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const userIcon = L.divIcon({ html: '<div style="width:16px;height:16px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(16,185,129,.8)"></div>', className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
const incidentIcon = L.divIcon({ html: '<div style="width:14px;height:14px;background:#ef4444;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(239,68,68,.8)"></div>', className: "", iconSize: [14, 14], iconAnchor: [7, 7] });
const suggestionIcon = L.divIcon({ html: '<div style="width:16px;height:16px;background:#06b6d4;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(6,182,212,.8)"></div>', className: "", iconSize: [16, 16], iconAnchor: [8, 8] });

function numberedIcon(n: number) {
  return L.divIcon({
    html: `<div style="width:22px;height:22px;background:#8b5cf6;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(139,92,246,.8);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">${n}</div>`,
    className: "", iconSize: [22, 22], iconAnchor: [11, 11],
  });
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PUNE_ZONES = [
  { name: "Kothrud", lat: 18.5074, lng: 73.8077 },
  { name: "Shivajinagar", lat: 18.5314, lng: 73.8446 },
  { name: "Hadapsar", lat: 18.5089, lng: 73.9259 },
  { name: "Koregaon Park", lat: 18.5362, lng: 73.8933 },
  { name: "Swargate", lat: 18.5016, lng: 73.8626 },
  { name: "Deccan", lat: 18.5204, lng: 73.8567 },
  { name: "Camp", lat: 18.5158, lng: 73.8772 },
  { name: "Baner", lat: 18.559, lng: 73.7868 },
];
const HIGH_RISK_ZONES = [
  { lat: 18.5016, lng: 73.8626 },
  { lat: 18.5089, lng: 73.9259 },
];

const LS_KEY = "tourist_map_plan";

const ALL_CATEGORIES = ["Historic", "Temples", "Shopping", "Malls", "Nightlife", "Pubs", "Family", "Nature", "Adventure", "Food & Dining", "Museums", "Beaches", "Cafés", "Cultural", "Photography"];

const EXPLORE_PLACES: PlaceSuggestion[] = [
  { id: "p1", lat: 18.5196, lng: 73.8553, name: "Shaniwar Wada", category: "Historic", description: "18th-century Peshwa fort" },
  { id: "p2", lat: 18.5509, lng: 73.8957, name: "Aga Khan Palace", category: "Historic", description: "Historic landmark with lush gardens" },
  { id: "p3", lat: 18.553, lng: 73.7995, name: "Chatushringi Temple", category: "Temples", description: "Popular hilltop temple" },
  { id: "p4", lat: 18.5036, lng: 73.8553, name: "Parvati Temple", category: "Temples", description: "Ancient hilltop temple" },
  { id: "p5", lat: 18.5202, lng: 73.8567, name: "FC Road", category: "Shopping", description: "Popular shopping street" },
  { id: "p6", lat: 18.5474, lng: 73.9092, name: "Phoenix Mall Viman Nagar", category: "Malls", description: "Premium shopping mall" },
  { id: "p7", lat: 18.5604, lng: 73.7896, name: "Westend Mall", category: "Malls", description: "Modern shopping mall" },
  { id: "p8", lat: 18.5362, lng: 73.8933, name: "Koregaon Park Nightlife", category: "Nightlife", description: "Popular Pune nightlife hub" },
  { id: "p9", lat: 18.5372, lng: 73.8943, name: "Hard Rock Café", category: "Pubs", description: "Live music and cocktails" },
  { id: "p10", lat: 18.5365, lng: 73.8950, name: "The Corrigans", category: "Pubs", description: "Irish-style pub" },
  { id: "p11", lat: 18.5008, lng: 73.8552, name: "Rajiv Gandhi Zoo", category: "Family", description: "Zoo and snake park" },
  { id: "p12", lat: 18.559, lng: 73.768, name: "Mulshi Lake", category: "Nature", description: "Scenic lake and dam" },
  { id: "p13", lat: 18.4088, lng: 73.6788, name: "Sinhagad Fort", category: "Adventure", description: "Historic fort trek" },
  { id: "p14", lat: 18.5314, lng: 73.8385, name: "Vaishali Restaurant", category: "Food & Dining", description: "Iconic Pune breakfast spot" },
  { id: "p15", lat: 18.5204, lng: 73.8567, name: "Café Goodluck", category: "Cafés", description: "Famous Irani café" },
  { id: "p16", lat: 18.5314, lng: 73.8446, name: "Pune Museum", category: "Museums", description: "Maharashtra historical museum" },
  { id: "p17", lat: 18.5008, lng: 73.8552, name: "Tribal Cultural Museum", category: "Cultural", description: "Tribal art and culture" },
  { id: "p18", lat: 18.5362, lng: 73.8933, name: "Osho Meditation Resort", category: "Cultural", description: "Spiritual centre" },
  { id: "p19", lat: 18.559, lng: 73.8077, name: "Kalyaninagar Lake", category: "Photography", description: "Beautiful sunset spot" },
  { id: "p20", lat: 18.5204, lng: 73.8250, name: "Mula-Mutha Riverfront", category: "Photography", description: "Scenic river photography" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000, dLat = ((lat2 - lat1) * Math.PI) / 180, dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function routeNear(route: [number, number][], lat: number, lng: number, r: number): boolean {
  const step = Math.max(1, Math.floor(route.length / 60));
  for (let i = 0; i < route.length; i += step) if (haversine(route[i][0], route[i][1], lat, lng) <= r) return true;
  return false;
}
function fmtDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function fmtETA(sec: number): string {
  const d = new Date(Date.now() + sec * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Dynamic traffic simulation removed in favor of handleGetRoute logic ───

function fallbackIncidents(): MapIncident[] {
  return PUNE_ZONES.slice(0, 5).map((z, i) => ({
    id: `zone-${i}`, lat: z.lat + (Math.random() - .5) * .02, lng: z.lng + (Math.random() - .5) * .02,
    title: `${z.name} Report`, description: `Safety monitoring in ${z.name}`,
    severity: (["high", "medium", "low", "low", "low"][i]) as MapIncident["severity"],
  }));
}

// ─── Detour helper for Safest/Balanced routes ─────────────────────────────────
// Nudges waypoints perpendicularly away from high-risk zone centroids
function buildDetourWaypoints(points: Coordinates[], scale: number): Coordinates[] {
  if (points.length < 2 || scale === 0) return points;
  const result = [...points];
  for (const hz of HIGH_RISK_ZONES) {
    // insert a mid-waypoint that veers away from hz
    const mid: Coordinates = {
      lat: (points[0].lat + points[points.length - 1].lat) / 2 + (points[0].lat - hz.lat) * scale * 0.15,
      lng: (points[0].lng + points[points.length - 1].lng) / 2 + (points[0].lng - hz.lng) * scale * 0.15,
    };
    result.splice(1, 0, mid);
  }
  return result;
}

// ─── Nearest-neighbour reorder ────────────────────────────────────────────────
function optimizeOrder(stops: StopInput[]): StopInput[] {
  if (stops.length <= 1) return stops;
  const remaining = [...stops];
  const ordered: StopInput[] = [];
  let current = remaining.shift()!;
  ordered.push(current);
  while (remaining.length > 0) {
    const c = current.coords;
    let best = 0, bestD = Infinity;
    remaining.forEach((s, i) => {
      if (!s.coords || !c) return;
      const d = haversine(c.lat, c.lng, s.coords.lat, s.coords.lng);
      if (d < bestD) { bestD = d; best = i; }
    });
    current = remaining.splice(best, 1)[0];
    ordered.push(current);
  }
  return ordered;
}

// ─── LocationInput ────────────────────────────────────────────────────────────
interface LIProps { value: string; onChange: (l: string, c: Coordinates | null) => void; placeholder: string; icon?: React.ReactNode; onRemove?: () => void }
function LocationInput({ value, onChange, placeholder, icon, onRemove }: LIProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    function h(e: MouseEvent) { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  function change(v: string) {
    setQuery(v); onChange(v, null);
    if (debRef.current) clearTimeout(debRef.current);
    if (v.trim().length < 3) { setResults([]); setOpen(false); return; }
    debRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v)}&format=json&limit=5`, { headers: { "User-Agent": "smart-tourist-safety-system" } });
        const d: NominatimResult[] = await r.json();
        setResults(d); setOpen(d.length > 0);
      } catch {/*silent*/ }
    }, 300);
  }
  function select(r: NominatimResult) {
    setQuery(r.display_name); setResults([]); setOpen(false);
    onChange(r.display_name, { lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
  }
  return (
    <div ref={wrapRef} className="relative flex items-center gap-2">
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="relative flex-1">
        <Input value={query} onChange={e => change(e.target.value)} placeholder={placeholder}
          onFocus={() => results.length > 0 && setOpen(true)} className="w-full" />
        {open && (
          <div className="absolute top-full left-0 right-0 z-[2001] mt-1 bg-background border border-border rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
            {results.map(r => (
              <button key={r.place_id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-start gap-2 border-b border-border/40 last:border-0"
                onMouseDown={e => { e.preventDefault(); select(r); }}>
                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {onRemove && <button onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>}
    </div>
  );
}

// ─── MapPage ─────────────────────────────────────────────────────────────────
const SS_MODE_KEY = "tourist_trip_mode"; // localStorage key for mode persistence

const MapPage = () => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [showIncidents, setShowIncidents] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Initialise tripMode from localStorage so refresh preserves selection
  const [tripMode, setTripMode] = useState<"planned" | "explore" | null>(() => {
    try { return (localStorage.getItem(SS_MODE_KEY) as "planned" | "explore") || null; } catch { return null; }
  });
  const [overlayVisible, setOverlayVisible] = useState(tripMode === null);
  const [showTripModal, setShowTripModal] = useState(tripMode === null);

  // planned trip
  const [origin, setOrigin] = useState<StopInput>({ id: "origin", label: "", coords: null });
  const [destination, setDestination] = useState<StopInput>({ id: "dest", label: "", coords: null });
  const [extraStops, setExtraStops] = useState<StopInput[]>([]);
  const [routeType, setRouteType] = useState<RouteType>("fastest");
  const [routePolyline, setRoutePolyline] = useState<[number, number][] | null>(null);
  const routePolyRef = useRef<[number, number][] | null>(null);
  const [safetyBreakdown, setSafetyBreakdown] = useState<SafetyBreakdown | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [onRoutePlaces, setOnRoutePlaces] = useState<PlaceSuggestion[]>([]);

  // optimize
  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false);
  const [optimizedOrder, setOptimizedOrder] = useState<StopInput[]>([]);

  // explore itinerary
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [exploreSuggestions, setExploreSuggestions] = useState<PlaceSuggestion[]>([]);
  const [itinerary, setItinerary] = useState<PlaceSuggestion[]>([]);
  const [exploreLoc, setExploreLoc] = useState<StopInput>({ id: "exploc", label: "", coords: null });

  // ── Restore localStorage (trip inputs and mode) ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY); if (!raw) return;
      const d = JSON.parse(raw);
      // tripMode already initialised from localStorage; skip overriding it here
      if (d.originLabel) setOrigin(o => ({ ...o, label: d.originLabel }));
      if (d.destLabel) setDestination(dd => ({ ...dd, label: d.destLabel }));
      if (Array.isArray(d.stops)) setExtraStops((d.stops as string[]).map((l, i) => ({ id: `ls-${i}`, label: l, coords: null })));
      if (d.routeType) setRouteType(d.routeType);
      if (Array.isArray(d.cats)) setSelectedCategories(d.cats);
    } catch {/*ignore*/ }
  }, []);

  // ── Persist localStorage ────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        tripMode, originLabel: origin.label, destLabel: destination.label,
        stops: extraStops.map(s => s.label), routeType, cats: selectedCategories,
      }));
    } catch {/*ignore*/ }
  }, [tripMode, origin.label, destination.label, extraStops, routeType, selectedCategories]);

  // ── Incidents ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllIncidents();
        const api: ApiIncident[] = res.data || [];
        setIncidents(api.length > 0 ? api.map(inc => ({
          id: inc._id, lat: inc.latitude || 18.5204 + (Math.random() - .5) * .1,
          lng: inc.longitude || 73.8567 + (Math.random() - .5) * .1,
          title: inc.type || "Incident", description: inc.description || "",
          severity: (inc.severity as MapIncident["severity"]) || "medium",
        })) : fallbackIncidents());
      } catch { setIncidents(fallbackIncidents()); }
    })();
  }, []);

  // ── Geolocation ─────────────────────────────────────────────────────────
  useEffect(() => {
    let ok = true;
    if (!navigator.geolocation) { setError("Geolocation not supported"); setIsLoading(false); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      if (!ok) return;
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserLocation({ lat, lng }); setIsLoading(false);
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "User-Agent": "smart-tourist-safety-system" } });
        const d = await r.json();
        if (ok && d.display_name) {
          setOrigin(o => o.label === "" ? { ...o, label: d.display_name, coords: { lat, lng } } : o);
          setExploreLoc(o => o.label === "" ? { ...o, label: d.display_name, coords: { lat, lng } } : o);
        }
      } catch {/*silent*/ }
    }, () => {
      if (!ok) return;
      setError("Location unavailable. Using Pune city centre.");
      setUserLocation({ lat: 18.5204, lng: 73.8567 }); setIsLoading(false);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    return () => { ok = false; };
  }, []);

  // ── MapController ────────────────────────────────────────────────────────
  function MapController() { const map = useMap(); mapRef.current = map; return null; }

  // ── Locate me ────────────────────────────────────────────────────────────
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserLocation({ lat, lng });
      mapRef.current?.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
    }, () => setError("Could not get location."));
  }, []);

  // ── Safety calc ──────────────────────────────────────────────────────────
  const calcSafety = useCallback((route: [number, number][], type: RouteType): SafetyBreakdown => {
    const rzc = HIGH_RISK_ZONES.filter(z => routeNear(route, z.lat, z.lng, 800)).length;
    const inearby = incidents.filter(i => routeNear(route, i.lat, i.lng, 1000)).length;
    const hra = incidents.filter(i => (i.severity === "high" || i.severity === "critical") && routeNear(route, i.lat, i.lng, 1000)).length;
    const h = new Date().getHours(), night = h >= 22 || h < 6;
    const nzone = PUNE_ZONES.slice(0, 4).some(z => routeNear(route, z.lat, z.lng, 1000));
    const ni: SafetyBreakdown["nightSafetyIndex"] = night && nzone ? "Low" : night ? "Medium" : "High";
    let s = 100 - rzc * 8 - hra * 12 - Math.min(inearby, 5) * 3;
    if (night) s -= 10; if (type === "safest") s += 6; if (type === "balanced") s += 3;
    return { score: Math.max(10, Math.min(100, s)), riskZonesCrossed: rzc, highRiskAreas: hra, incidentsNearby: inearby, nightSafetyIndex: ni };
  }, [incidents]);

  // ── OSRM fetch with route type differentiation ───────────────────────────
  const fetchOSRM = useCallback(async (basePoints: Coordinates[], type: RouteType): Promise<{ coords: [number, number][]; legs: Array<{ duration: number; distance: number }> } | null> => {
    const detourScale = type === "fastest" ? 0 : type === "safest" ? 1 : 0.4;
    const pts = buildDetourWaypoints(basePoints, detourScale);
    const coordStr = pts.map(p => `${p.lng},${p.lat}`).join(";");
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false`);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const coords: [number, number][] = data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
    const legs = data.routes[0].legs as Array<{ duration: number; distance: number }>;
    return { coords, legs };
  }, []);

  const handleGetRoute = useCallback(async (pts?: Coordinates[]) => {
    const allBase: Coordinates[] = pts || [
      ...(origin.coords ? [origin.coords] : []),
      ...extraStops.filter(s => s.coords).map(s => s.coords!),
      ...(destination.coords ? [destination.coords] : []),
    ];
    if (allBase.length < 2) { setRouteError("Please select origin and destination from autocomplete."); return; }
    setRouteError(null); setIsFetching(true); setRoutePolyline(null); setSafetyBreakdown(null); setRouteInfo(null); setOnRoutePlaces([]);
    try {
      const result = await fetchOSRM(allBase, routeType);
      if (!result) { setRouteError("Route not found. Try different locations."); return; }
      const { coords, legs } = result;
      setRoutePolyline(coords);
      routePolyRef.current = coords;
      const safetyBreakdownData = calcSafety(coords, routeType);
      setSafetyBreakdown(safetyBreakdownData);

      const names = [origin.label || "Origin", ...extraStops.filter(s => s.coords).map(s => s.label || "Stop"), destination.label || "Destination"];

      const numSegments = legs.length;
      const safetyDelayTotalSec = safetyBreakdownData.riskZonesCrossed * 5 * 60;
      const safetyDelayPerLeg = numSegments > 0 ? Math.round(safetyDelayTotalSec / numSegments) : 0;

      const segments = legs.map((leg, i) => {
        // Dynamic speed modeling: Highway > 15km = 60km/h, Urban = 35km/h
        const speedKmh = leg.distance > 15000 ? 60 : 35;
        const speedMps = (speedKmh * 1000) / 3600;
        let legSec = leg.distance / speedMps;

        // Tourist exploration delay: +10 mins per intermediate stop
        if (i < legs.length - 1) {
          legSec += 10 * 60;
        }

        // Safety delay factor
        legSec += safetyDelayPerLeg;

        return {
          from: names[i] || `Point ${i + 1}`,
          to: names[i + 1] || `Point ${i + 2}`,
          durationSec: Math.round(legSec),
        };
      });
      const total = segments.reduce((a, s) => a + s.durationSec, 0);
      const dist = legs.reduce((a, l) => a + l.distance, 0);
      const distKm = dist / 1000; // Convert meters to kilometers
      setRouteInfo({ totalDurationSec: total, totalDistanceM: dist, totalDistanceKm: distKm, segments });
      if (mapRef.current && coords.length > 0) mapRef.current.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
      // on-route suggestions within 10km
      setOnRoutePlaces(EXPLORE_PLACES.filter(p => routeNear(coords, p.lat, p.lng, 10000)));
    } catch { setRouteError("Network error. Please retry."); }
    finally { setIsFetching(false); }
  }, [origin, extraStops, destination, routeType, fetchOSRM, calcSafety]);

  // Re-calc when route type changes (re-fetch for visual difference)
  const prevTypeRef = useRef<RouteType>(routeType);
  useEffect(() => {
    if (prevTypeRef.current !== routeType && routePolyRef.current) {
      prevTypeRef.current = routeType;
      handleGetRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeType]);

  // ── Stop management ──────────────────────────────────────────────────────
  const addStop = useCallback(() => setExtraStops(p => [...p, { id: `stop-${Date.now()}`, label: "", coords: null }]), []);
  const removeStop = useCallback((id: string) => setExtraStops(p => p.filter(s => s.id !== id)), []);
  const moveStop = useCallback((id: string, dir: -1 | 1) => {
    setExtraStops(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  // Move itinerary item up/down
  const moveItinerary = useCallback((id: string, dir: -1 | 1) => {
    setItinerary(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  // ── Optimize trip ────────────────────────────────────────────────────────
  const handleOptimize = useCallback(() => {
    const all = [origin, ...extraStops, destination].filter(s => s.coords);
    if (all.length < 2) { setRouteError("Need at least origin and destination to optimize."); return; }
    const inner = all.slice(1, all.length - 1);
    setOptimizedOrder(optimizeOrder(inner));
    setShowOptimizeDialog(true);
  }, [origin, extraStops, destination]);

  const applyOptimize = useCallback(() => {
    setExtraStops(optimizedOrder);
    setShowOptimizeDialog(false);
    setTimeout(() => handleGetRoute(), 100);
  }, [optimizedOrder, handleGetRoute]);

  // ── Explore / itinerary ──────────────────────────────────────────────────
  const findPlaces = useCallback(() => {
    setExploreSuggestions(selectedCategories.length === 0 ? EXPLORE_PLACES : EXPLORE_PLACES.filter(p => selectedCategories.includes(p.category)));
  }, [selectedCategories]);

  const addToItinerary = useCallback((p: PlaceSuggestion) => {
    setItinerary(prev => prev.find(x => x.id === p.id) ? prev : [...prev, p]);
  }, []);

  const removeFromItinerary = useCallback((id: string) => setItinerary(p => p.filter(x => x.id !== id)), []);

  const planExplorTrip = useCallback(async () => {
    const pts: Coordinates[] = [];
    if (exploreLoc.coords) pts.push(exploreLoc.coords);
    itinerary.forEach(p => pts.push({ lat: p.lat, lng: p.lng }));
    if (pts.length < 2) { setRouteError("Add at least one place to your itinerary."); return; }
    // switch to planned mode display
    if (exploreLoc.coords) setOrigin({ id: "origin", label: exploreLoc.label, coords: exploreLoc.coords });
    setExtraStops(itinerary.slice(0, itinerary.length - 1).map((p, i) => ({ id: `it-${i}`, label: p.name, coords: { lat: p.lat, lng: p.lng } })));
    const last = itinerary[itinerary.length - 1];
    setDestination({ id: "dest", label: last.name, coords: { lat: last.lat, lng: last.lng } });
    setTripMode("planned");
    await handleGetRoute(pts);
  }, [exploreLoc, itinerary, handleGetRoute]);

  // ── Clear plan ───────────────────────────────────────────────────────────
  const clearPlan = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    try { localStorage.removeItem(SS_MODE_KEY); } catch {/*ignore*/ }
    setOrigin({ id: "origin", label: "", coords: null }); setDestination({ id: "dest", label: "", coords: null });
    setExtraStops([]); setRouteType("fastest"); setRoutePolyline(null); routePolyRef.current = null;
    setSafetyBreakdown(null); setRouteInfo(null); setRouteError(null); setOnRoutePlaces([]);
    setSelectedCategories([]); setExploreSuggestions([]); setItinerary([]);
    setShowCatDropdown(false); setTripMode(null); setOverlayVisible(true); setShowTripModal(true);
  }, []);

  const handleModeSelect = useCallback((m: "planned" | "explore") => {
    // Animate overlay out, then set mode
    setOverlayVisible(false);
    setTimeout(() => {
      setTripMode(m);
      setShowTripModal(false);
      try { localStorage.setItem(SS_MODE_KEY, m); } catch {/*ignore*/ }
    }, 380);
  }, []);

  const allPoints = [origin, ...extraStops, destination];
  const scoreColor = (safetyBreakdown?.score ?? 100) >= 80 ? "#10b981" : (safetyBreakdown?.score ?? 100) >= 60 ? "#f59e0b" : "#ef4444";
  const mapCenter = userLocation || { lat: 18.5204, lng: 73.8567 };

  const dot = (color: string) => <div className="w-3 h-3 rounded-full shrink-0 border-2 border-white shadow" style={{ background: color }} />;

  return (
    <UserDashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Safety Map</h1>
          <p className="text-muted-foreground text-sm mt-1">View your location, plan safe routes, and explore Pune</p>
        </div>

        {isLoading && <div className="flex items-center gap-2 p-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span>Fetching your location…</span></div>}
        {error && <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20"><AlertCircle className="h-5 w-5 shrink-0" /><span className="text-sm">{error}</span></div>}

        {/* Route type toggle – visible for both modes once mode is chosen */}
        {tripMode !== null && (
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
            {(["fastest", "balanced", "safest"] as RouteType[]).map(t => (
              <button key={t} onClick={() => setRouteType(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${routeType === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}>
                {t === "fastest" ? "⚡ Fastest" : t === "balanced" ? "⚖ Balanced" : "🛡 Safest"}
              </button>
            ))}
          </div>
        )}

        {/* Map – pointer events disabled while overlay is visible so map doesn't receive clicks */}
        <div
          className="glass-card overflow-hidden rounded-xl border relative"
          style={{ height: "calc(100vh - 260px)", minHeight: "400px", filter: showTripModal ? "blur(3px)" : "none", pointerEvents: showTripModal ? "none" : "auto", transition: "filter 0.4s ease" }}
        >
          <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13}
            scrollWheelZoom={false} touchZoom={true} zoomControl={true}
            // @ts-ignore - gestureHandling from leaflet-gesture-handling
            gestureHandling={true}
            style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController />
            {userLocation && (
              <>
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup><div className="text-sm"><strong>You are here 📍</strong><br />{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</div></Popup>
                </Marker>
                <Circle center={[userLocation.lat, userLocation.lng]} radius={300}
                  pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: .12, weight: 2 }} />
              </>
            )}
            {PUNE_ZONES.map(z => (
              <Circle key={z.name} center={[z.lat, z.lng]} radius={800}
                pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: .04, weight: 1, dashArray: "5,10" }} />
            ))}
            {showIncidents && incidents.map(inc => (
              <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={incidentIcon}>
                <Popup>
                  <div className="text-sm max-w-xs">
                    <strong className="text-destructive">{inc.title}</strong><br />
                    <span className="text-muted-foreground">{inc.description}</span><br />
                    <span className={`text-xs font-medium ${inc.severity === "high" || inc.severity === "critical" ? "text-red-500" : inc.severity === "medium" ? "text-amber-500" : "text-emerald-500"}`}>
                      {inc.severity.toUpperCase()}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
            {/* Numbered stop markers */}
            {allPoints.filter(s => s.coords).map((s, i) => (
              <Marker key={s.id} position={[s.coords!.lat, s.coords!.lng]} icon={numberedIcon(i + 1)}>
                <Popup><div className="text-sm font-medium">{i + 1}. {s.label || `Stop ${i + 1}`}</div></Popup>
              </Marker>
            ))}
            {/* Explore suggestion markers */}
            {exploreSuggestions.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={suggestionIcon}>
                <Popup>
                  <div className="text-sm max-w-xs">
                    <strong className="text-cyan-500">{s.name}</strong><br />
                    <span className="text-xs text-muted-foreground">{s.description}</span><br />
                    <button className="text-xs text-purple-500 hover:underline mt-1" onClick={() => addToItinerary(s)}>+ Add to Trip</button>
                  </div>
                </Popup>
              </Marker>
            ))}
            {routePolyline && (
              <Polyline positions={routePolyline}
                pathOptions={{ color: routeType === "safest" ? "#10b981" : routeType === "balanced" ? "#f59e0b" : "#3b82f6", weight: 5, opacity: .85, lineCap: "round", lineJoin: "round" }} />
            )}
          </MapContainer>
          <Button variant="secondary" size="sm" className="absolute top-3 right-3 z-[1000] shadow-lg" onClick={locateUser}>
            <Locate className="h-4 w-4 mr-1.5" />Locate Me
          </Button>
        </div>

        {/* Incident toggle */}
        <div className="flex items-center gap-2 p-3 bg-card rounded-lg border">
          <Switch id="show-incidents" checked={showIncidents} onCheckedChange={setShowIncidents} />
          <Label htmlFor="show-incidents" className="text-sm font-medium">Show Incidents</Label>
        </div>

        {/* ── Planned Trip Panel ── */}
        {tripMode === "planned" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Route className="h-4 w-4" />Plan Your Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <LocationInput value={origin.label} placeholder="Your Location" icon={dot("#10b981")}
                onChange={(l, c) => setOrigin(o => ({ ...o, label: l, coords: c ?? o.coords }))} />
              {extraStops.map((s, idx) => (
                <div key={s.id} className="flex items-start gap-2">
                  {/* Up/Down reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0 pt-1">
                    <button
                      onClick={() => moveStop(s.id, -1)}
                      disabled={idx === 0}
                      className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 hover:bg-muted"
                      title="Move up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveStop(s.id, 1)}
                      disabled={idx === extraStops.length - 1}
                      className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 hover:bg-muted"
                      title="Move down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <LocationInput key={s.id} value={s.label} placeholder={`Stop ${idx + 1}`} icon={dot("#8b5cf6")}
                      onChange={(l, c) => setExtraStops(p => p.map(x => x.id === s.id ? { ...x, label: l, coords: c ?? x.coords } : x))}
                      onRemove={() => removeStop(s.id)} />
                  </div>
                </div>
              ))}
              <LocationInput value={destination.label} placeholder="Destination" icon={dot("#ef4444")}
                onChange={(l, c) => setDestination(d => ({ ...d, label: l, coords: c ?? d.coords }))} />

              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={addStop} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Plus className="h-3.5 w-3.5" />Add Stop
                </button>
                <button onClick={handleOptimize} className="flex items-center gap-1.5 text-sm text-purple-500 hover:underline ml-auto">
                  <Shuffle className="h-3.5 w-3.5" />Optimize Trip
                </button>
              </div>
              {routeError && <p className="text-sm text-destructive">{routeError}</p>}
              <Button onClick={() => handleGetRoute()} disabled={isFetching} className="w-full">
                {isFetching ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Calculating…</> : <><Navigation className="h-4 w-4 mr-2" />Get Route</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Safety Breakdown Panel ── */}
        {safetyBreakdown && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow" style={{ background: scoreColor }}>
                  {safetyBreakdown.score}%
                </div>
                Safety Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">Safety Score</span>
                  <span className="font-bold" style={{ color: scoreColor }}>{safetyBreakdown.score}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${safetyBreakdown.score}%`, background: scoreColor }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {([["Risk Zones Crossed", safetyBreakdown.riskZonesCrossed, ""], ["High Risk Areas", safetyBreakdown.highRiskAreas, ""],
                ["Incidents Nearby", safetyBreakdown.incidentsNearby, ""], ["Night Safety", safetyBreakdown.nightSafetyIndex, safetyBreakdown.nightSafetyIndex === "Low" ? "text-red-500" : safetyBreakdown.nightSafetyIndex === "Medium" ? "text-amber-500" : "text-emerald-500"]
                ] as [string, string | number, string][]).map(([label, val, cls]) => (
                  <div key={label} className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-muted-foreground text-xs mb-0.5">{label}</div>
                    <div className={`font-semibold text-xl ${cls}`}>{val}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Route Time Panel ── */}
        {routeInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="h-4 w-4" />Route Summary
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${routeType === 'safest' ? 'bg-emerald-500/20 text-emerald-600' :
                    routeType === 'balanced' ? 'bg-amber-500/20 text-amber-600' :
                      'bg-blue-500/20 text-blue-600'
                  }`}>
                  {routeType === 'fastest' ? '⚡ Fastest' : routeType === 'balanced' ? '⚖ Balanced' : '🛡 Safest'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 text-sm">
                <div className="flex-1 p-3 bg-muted/50 rounded-lg">
                  <div className="text-muted-foreground text-xs mb-0.5">Total Duration</div>
                  <div className="font-bold text-lg">{fmtDuration(routeInfo.totalDurationSec)}</div>
                </div>
                <div className="flex-1 p-3 bg-muted/50 rounded-lg">
                  <div className="text-muted-foreground text-xs mb-0.5">Distance</div>
                  <div className="font-bold text-lg">{(routeInfo.totalDistanceM / 1000).toFixed(1)} km</div>
                </div>
                <div className="flex-1 p-3 bg-muted/50 rounded-lg">
                  <div className="text-muted-foreground text-xs mb-0.5">ETA</div>
                  <div className="font-bold text-lg">{fmtETA(routeInfo.totalDurationSec)}</div>
                </div>
              </div>
              {routeInfo.segments.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Leg-by-leg breakdown</p>
                    {extraStops.length > 0 && (
                      <span className="text-xs text-amber-500 font-medium">+10 min/stop (tourist delay)</span>
                    )}
                  </div>
                  {routeInfo.segments.map((seg, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                        <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="truncate">{seg.from.split(",")[0]}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="truncate">{seg.to.split(",")[0]}</span>
                      </div>
                      <span className="font-semibold shrink-0 ml-2">{fmtDuration(seg.durationSec)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── On-Route Suggestions ── */}
        {tripMode === "planned" && onRoutePlaces.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-500" />Places Along Your Route
                <span className="text-xs font-normal text-muted-foreground ml-1">(within 10 km)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {onRoutePlaces.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.category}</div>
                  </div>
                  <Button size="sm" variant="outline" className="ml-2 shrink-0 text-xs h-7"
                    onClick={() => {
                      const ns: StopInput = { id: `opt-${Date.now()}`, label: p.name, coords: { lat: p.lat, lng: p.lng } };
                      setExtraStops(prev => [...prev, ns]);
                      setTimeout(() => handleGetRoute(), 100);
                    }}>
                    + Add
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Explore Panel ── */}
        {tripMode === "explore" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" />Explore Pune</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Current location */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your current location</p>
                <LocationInput value={exploreLoc.label} placeholder="Your Location"
                  icon={dot("#10b981")} onChange={(l, c) => setExploreLoc(o => ({ ...o, label: l, coords: c ?? o.coords }))} />
              </div>

              {/* Category selector */}
              <div>
                <button onClick={() => setShowCatDropdown(v => !v)}
                  className="flex items-center justify-between w-full text-sm border border-border rounded-lg px-3 py-2.5 hover:bg-muted transition-colors">
                  <span>{selectedCategories.length === 0 ? "Select Categories (optional)" : `${selectedCategories.length} selected: ${selectedCategories.slice(0, 2).join(", ")}${selectedCategories.length > 2 ? "…" : ""}`}</span>
                  {showCatDropdown ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
                <p className="text-xs text-muted-foreground mt-1 ml-1">Optional – selecting categories helps us provide better results.</p>
                {showCatDropdown && (
                  <div className="mt-2 border border-border rounded-lg p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-card">
                    {ALL_CATEGORIES.map(cat => (
                      <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={selectedCategories.includes(cat)}
                          onChange={() => setSelectedCategories(p => p.includes(cat) ? p.filter(c => c !== cat) : [...p, cat])}
                          className="h-4 w-4 rounded accent-primary" />
                        {cat}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={findPlaces} className="w-full">Find Places</Button>

              {/* Itinerary */}
              {itinerary.length > 0 && (
                <div className="space-y-2 pt-1 border border-border rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-foreground">Your Itinerary</p>
                    <span className="text-xs text-muted-foreground">{itinerary.length} place{itinerary.length > 1 ? 's' : ''} • drag arrows to reorder</span>
                  </div>
                  {itinerary.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2 p-2.5 bg-background rounded-lg border border-border/60 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center shrink-0 font-bold">{i + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.description} · <span className="text-cyan-600 font-medium">{p.category}</span></div>
                      </div>
                      {/* Reorder arrows */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={() => moveItinerary(p.id, -1)} disabled={i === 0}
                          className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-25 hover:bg-muted"
                          title="Move up"><ChevronUp className="h-3 w-3" /></button>
                        <button onClick={() => moveItinerary(p.id, 1)} disabled={i === itinerary.length - 1}
                          className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-25 hover:bg-muted"
                          title="Move down"><ChevronDown className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => removeFromItinerary(p.id)} className="text-muted-foreground hover:text-destructive shrink-0" title="Remove">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button onClick={planExplorTrip} className="w-full mt-1" disabled={isFetching}>
                    {isFetching ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Planning…</> : <><Navigation className="h-4 w-4 mr-2" />Plan My Trip</>}
                  </Button>
                </div>
              )}

              {/* Suggestion results */}
              {exploreSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{exploreSuggestions.length} places — click to zoom, or add to trip</p>
                  {exploreSuggestions.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => mapRef.current?.flyTo([p.lat, p.lng], 16, { animate: true, duration: 1 })}>
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                        <div className="text-xs text-cyan-600 font-medium mt-0.5">{p.category}</div>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 text-xs h-7"
                        onClick={() => addToItinerary(p)}>+ Add</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {[["#10b981", "Your Location"], ["#ef4444", "Incident"], ["#8b5cf6", "Stop"], ["#06b6d4", "Suggested"]].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full border border-white shadow" style={{ background: c }} />{l}</div>
          ))}
          {routePolyline && <div className="flex items-center gap-1.5"><div className="w-6 h-1.5 rounded" style={{ background: routeType === "safest" ? "#10b981" : routeType === "balanced" ? "#f59e0b" : "#3b82f6" }} />{routeType} route</div>}
        </div>

        {/* ── Clear Plan ── */}
        <div className="pb-6">
          <Button variant="outline" onClick={clearPlan} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-2" />Clear Plan
          </Button>
        </div>

        {/* ── Trip Mode Selection Overlay ── */}
        {showTripModal && (
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(8px)",
              opacity: overlayVisible ? 1 : 0,
              transition: "opacity 0.38s ease",
              pointerEvents: overlayVisible ? "auto" : "none",
            }}
          >
            <div
              style={{
                transform: overlayVisible ? "scale(1) translateY(0)" : "scale(0.94) translateY(24px)",
                opacity: overlayVisible ? 1 : 0,
                transition: "transform 0.38s cubic-bezier(.22,.68,0,1.2), opacity 0.38s ease",
              }}
              className="w-full max-w-2xl"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Select Trip Mode</h2>
                <p className="text-white/70 text-sm">Please choose how you want to start your journey</p>
              </div>

              {/* Two side-by-side cards */}
              <div className="grid grid-cols-2 gap-5">
                {/* Planned Trip */}
                <button
                  onClick={() => handleModeSelect("planned")}
                  className="group relative rounded-2xl p-6 text-left cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1.5px solid rgba(255,255,255,0.15)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px rgba(99,102,241,0.55)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.8)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                >
                  <div className="text-4xl mb-3">🚗</div>
                  <h3 className="text-white font-bold text-lg mb-1">Planned Trip</h3>
                  <p className="text-white/65 text-sm leading-relaxed">Pre-define stops and optimize your complete journey.</p>
                  <div className="mt-4 flex items-center gap-1.5 text-indigo-300 text-xs font-medium">
                    <Route className="h-3.5 w-3.5" /> Route planner + stop optimizer
                  </div>
                </button>

                {/* Unplanned Trip */}
                <button
                  onClick={() => handleModeSelect("explore")}
                  className="group relative rounded-2xl p-6 text-left cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1.5px solid rgba(255,255,255,0.15)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px rgba(6,182,212,0.55)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(6,182,212,0.8)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                >
                  <div className="text-4xl mb-3">⚡</div>
                  <h3 className="text-white font-bold text-lg mb-1">Unplanned Trip</h3>
                  <p className="text-white/65 text-sm leading-relaxed">Start instantly and add stops dynamically.</p>
                  <div className="mt-4 flex items-center gap-1.5 text-cyan-300 text-xs font-medium">
                    <MapPin className="h-3.5 w-3.5" /> Explore + real-time itinerary
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Optimize dialog ── */}
        {showOptimizeDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
            <Card className="w-full max-w-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Shuffle className="h-4 w-4" />Optimized Order</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Suggested stop order to minimize travel time and risk:</p>
                <div className="space-y-1.5">
                  {optimizedOrder.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                      <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 2}</div>
                      <span className="truncate">{s.label || `Stop ${i + 1}`}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={applyOptimize} className="flex-1"><Check className="h-4 w-4 mr-1.5" />Apply Order</Button>
                  <Button variant="outline" onClick={() => setShowOptimizeDialog(false)} className="flex-1">Keep Original</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default MapPage;
