import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { AlertTriangle, Map as MapIcon } from "lucide-react";

// Helper for severity-based marker colors
const getMarkerColor = (severity: string) => {
  const s = severity?.toLowerCase();
  switch (s) {
    case "critical": return "red";
    case "high": return "orange";
    case "medium": return "yellow";
    case "low": return "green";
    default: return "blue";
  }
};

// Custom marker icon generator
const createIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const LiveTrackingPage = () => {
  // Safe data loading
  const incidents = JSON.parse(localStorage.getItem("incidents") || "[]");

  // Auto map center
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const center: [number, number] = incidents.length > 0
    ? [
        incidents[0]?.latitude || defaultCenter[0],
        incidents[0]?.longitude || defaultCenter[1]
      ]
    : defaultCenter;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Live Incident Tracking</h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time geographical overview of reported incidents</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium animate-pulse">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Live System Active
          </div>
        </div>

        {!incidents.length ? (
          <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed border-border">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold">No incidents to display</h2>
            <p className="text-muted-foreground mt-2">There are currently no geographical data points available.</p>
          </div>
        ) : (
          <DashboardCard title="Geographical Incident Map" icon={<MapIcon className="h-5 w-5 text-primary" />}>
            <div className="relative h-[600px] w-full rounded-lg overflow-hidden border border-border">
              <MapContainer 
                center={center} 
                zoom={5} 
                scrollWheelZoom={true}
                className="h-full w-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {incidents.map((i: any) => (
                  <Marker 
                    key={i._id || i.id || Math.random()} 
                    position={[
                      i.latitude || defaultCenter[0], 
                      i.longitude || defaultCenter[1]
                    ]}
                    icon={createIcon(getMarkerColor(i.severity))}
                  >
                    <Popup>
                      <div className="text-sm p-1 min-w-[150px]">
                        <p className="border-b mb-2 pb-1 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                          ID: {i._id || i.id || 'N/A'}
                        </p>
                        <p><strong>Type:</strong> <span className="capitalize">{i.type}</span></p>
                        <p><strong>Severity:</strong> <span className={`capitalize font-bold ${getMarkerColor(i.severity)}`}>{i.severity}</span></p>
                        <p><strong>Status:</strong> <span className="capitalize">{i.status}</span></p>
                        <p><strong>Date:</strong> {new Date(i.createdAt || i.created_at).toLocaleString()}</p>
                        {i.description && (
                          <div className="mt-2 pt-2 border-t text-xs italic text-muted-foreground">
                            <strong>Description:</strong> {i.description}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </DashboardCard>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default LiveTrackingPage;
