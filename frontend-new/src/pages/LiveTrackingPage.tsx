import { useState } from "react";
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
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

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
        <div>
          <h1 className="font-display text-2xl font-bold">Live Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor incidents on map in real-time</p>
        </div>

        {!incidents.length && (
          <p className="text-sm text-orange-500 font-medium">No incidents available</p>
        )}

        <DashboardCard title="Geographical Incident Map" icon={<MapIcon className="h-5 w-5 text-primary" />}>
          <div className="relative h-[500px] w-full rounded-lg overflow-hidden border border-border">
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
                  eventHandlers={{
                    click: () => setSelectedIncident(i)
                  }}
                >
                  <Popup>
                    <div className="text-sm p-1 min-w-[150px]">
                      <p className="border-b mb-2 pb-1 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                        ID: {i._id || i.id || 'N/A'}
                      </p>
                      <p><strong>Type:</strong> <span className="capitalize">{i.type}</span></p>
                      <p><strong>Severity:</strong> <span className={`capitalize font-bold ${getMarkerColor(i.severity)}`}>{i.severity}</span></p>
                      <p><strong>Status:</strong> <span className="capitalize">{i.status}</span></p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </DashboardCard>

        {selectedIncident && (
          <div className="mt-4 p-4 border rounded-lg bg-card shadow animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Incident Details</h3>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>ID:</strong> {selectedIncident._id || selectedIncident.id}</p>
                <p><strong>Type:</strong> <span className="capitalize">{selectedIncident.type}</span></p>
                <p><strong>Severity:</strong> <span className={`capitalize font-bold ${getMarkerColor(selectedIncident.severity)}`}>{selectedIncident.severity}</span></p>
              </div>
              <div>
                <p><strong>Status:</strong> <span className="capitalize">{selectedIncident.status}</span></p>
                <p><strong>Date:</strong> {new Date(selectedIncident.createdAt || selectedIncident.created_at).toLocaleString()}</p>
                <p><strong>Coordinates:</strong> {selectedIncident.latitude}, {selectedIncident.longitude}</p>
              </div>
            </div>
            {selectedIncident.description && (
              <div className="mt-4 pt-4 border-t">
                <p><strong>Description:</strong></p>
                <p className="text-muted-foreground mt-1">{selectedIncident.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default LiveTrackingPage;
