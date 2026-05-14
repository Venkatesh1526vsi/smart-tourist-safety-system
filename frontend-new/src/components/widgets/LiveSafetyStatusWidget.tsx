import { ShieldCheck, Users, CloudLightning, Moon, CarFront, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Incident } from "@/services/api";

interface LiveSafetyStatusWidgetProps {
  incidents: Incident[];
}

const LiveSafetyStatusWidget = ({ incidents }: LiveSafetyStatusWidgetProps) => {
  // Derive operational intelligence from real data where possible
  const nearbyIncidentsCount = incidents ? incidents.filter(i => i.status !== 'resolved').length : 0;
  
  // Lightweight derived state for demonstration
  const safetyState = {
    patrolPresence: nearbyIncidentsCount > 2 ? "High" : "Active",
    crowdDensity: "High", // Could be derived from time of day or risk zones
    weatherImpact: "Low", // In a full implementation, derive from weather API
    nightSafety: new Date().getHours() >= 18 || new Date().getHours() <= 6 ? "Moderate" : "Good",
    advisory: nearbyIncidentsCount > 0 ? "Stay Alert" : "All Clear"
  };

  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-500" />
            Live Safety Intelligence
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded border flex items-center gap-1 ${
            safetyState.advisory === "All Clear" 
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          }`}>
            <Info className="h-3 w-3" />
            {safetyState.advisory}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 pt-1">
          {/* Main Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50">
              <div className="p-2 bg-red-500/10 rounded text-red-500">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Nearby Incidents</p>
                <p className="text-lg font-bold text-foreground leading-tight">{nearbyIncidentsCount}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50">
              <div className="p-2 bg-indigo-500/10 rounded text-indigo-500">
                <CarFront className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Patrol Presence</p>
                <p className="text-lg font-bold text-foreground leading-tight">{safetyState.patrolPresence}</p>
              </div>
            </div>
          </div>

          {/* Contextual Intelligence List */}
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-slate-400" />
                Crowd Density
              </div>
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{safetyState.crowdDensity}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CloudLightning className="h-4 w-4 text-slate-400" />
                Weather Impact
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">{safetyState.weatherImpact}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Moon className="h-4 w-4 text-slate-400" />
                Time Safety
              </div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{safetyState.nightSafety}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveSafetyStatusWidget;
