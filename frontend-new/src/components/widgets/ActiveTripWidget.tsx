import { useState, useEffect } from "react";
import { Navigation, MapPin, Map, Navigation2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ActiveTripWidget = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lightweight operational state for demonstration
  // In a full implementation, this would be derived from a routing context or API
  const tripData = {
    start: "Warje",
    current: "FC Road",
    end: "Phoenix Mall",
    etaMins: 24,
    progress: 42,
    riskLevel: "Moderate",
    confidence: 82,
    status: "On Track"
  };

  if (!mounted) return null;

  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-500" />
            Active Trip Status
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {tripData.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Route Overview */}
          <div className="flex items-center gap-3 text-sm font-medium">
            <div className="flex flex-col items-center gap-1 text-slate-400">
              <MapPin className="h-4 w-4" />
              <div className="w-0.5 h-6 bg-border border-dashed border-l-2" />
              <Map className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <div className="text-muted-foreground flex items-center justify-between">
                <span>{tripData.start}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Next: {tripData.current}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{tripData.etaMins} mins</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Progress</span>
              <span>{tripData.progress}%</span>
            </div>
            <Progress value={tripData.progress} className="h-2 bg-slate-200 dark:bg-slate-700" />
            <div className="text-right text-xs text-muted-foreground mt-1">
              Destination: {tripData.end}
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-md flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80 font-bold">Route Risk</span>
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{tripData.riskLevel}</span>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-md flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80 font-bold">Confidence</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Navigation2 className="h-3 w-3" />
                {tripData.confidence}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveTripWidget;
