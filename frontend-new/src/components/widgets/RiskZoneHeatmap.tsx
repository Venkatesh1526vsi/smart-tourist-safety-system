import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// 6x4 grid of dummy risk values (0-1)
const GRID: number[][] = [
  [0.1, 0.2, 0.5, 0.8, 0.6, 0.3],
  [0.2, 0.3, 0.7, 0.9, 0.7, 0.4],
  [0.1, 0.4, 0.6, 0.5, 0.3, 0.2],
  [0.05, 0.1, 0.2, 0.3, 0.2, 0.1],
];

const cellColor = (v: number, dark: boolean) => {
  if (v >= 0.8) return dark ? "bg-red-500/50" : "bg-red-500/40";
  if (v >= 0.6) return dark ? "bg-amber-500/45" : "bg-amber-500/35";
  if (v >= 0.3) return dark ? "bg-amber-400/25" : "bg-amber-400/20";
  return dark ? "bg-emerald-500/20" : "bg-emerald-500/15";
};

const riskLabel = (v: number) => {
  if (v >= 0.8) return "High";
  if (v >= 0.6) return "Medium";
  if (v >= 0.3) return "Low";
  return "Safe";
};

const RiskZoneHeatmap = () => {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const [selectedZone, setSelectedZone] = useState<{ ri: number, ci: number, val: number } | null>(null);

  const getZoneDetails = (val: number) => {
     const score = Math.round(val * 100);
     const tourists = Math.floor(Math.random() * 50) + 10;
     const activeIncidents = val >= 0.8 ? Math.floor(Math.random() * 5) + 1 : 0;
     return { score, tourists, activeIncidents };
  };

  return (
    <>
      <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-amber-500" />
            Risk Zone Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Simulated map container */}
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30 dark:bg-slate-700/20 dark:border-slate-700/50">
            {/* Fake map background */}
            <div className="h-[200px] bg-gradient-to-br from-sky-100/50 to-emerald-100/30 dark:from-slate-700/30 dark:to-slate-800/50">
              {/* Grid overlay */}
              <div className="grid h-full grid-rows-4">
                {GRID.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-6">
                    {row.map((val, ci) => (
                      <div
                        key={ci}
                        onClick={() => setSelectedZone({ ri, ci, val })}
                        className={`flex items-center justify-center border border-white/10 dark:border-slate-600/20 transition-colors cursor-pointer hover:border-primary/50 hover:z-10 relative ${cellColor(val, isDark)} ${val >= 0.8 ? 'animate-pulse' : ''}`}
                        title={`Risk: ${riskLabel(val)} (Click for details)`}
                      >
                        <span className="text-[9px] font-medium text-foreground/70">
                          {Math.round(val * 100)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/30" /> Safe
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-400/40" /> Low
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/50" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-500/50" /> High
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedZone} onOpenChange={(open) => !open && setSelectedZone(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <MapPin className="h-5 w-5" /> 
               Zone Details (Grid {selectedZone?.ri},{selectedZone?.ci})
            </DialogTitle>
            <DialogDescription>
              Real-time monitoring metrics for this sector.
            </DialogDescription>
          </DialogHeader>
          {selectedZone && (
            <div className="grid gap-4 py-4">
               <div className="flex items-center justify-between border-b pb-2">
                 <span className="font-medium text-sm text-muted-foreground">Risk Score</span>
                 <Badge variant={selectedZone.val >= 0.8 ? 'destructive' : selectedZone.val >= 0.6 ? 'default' : 'secondary'}>
                    {getZoneDetails(selectedZone.val).score} / 100
                 </Badge>
               </div>
               <div className="flex items-center justify-between border-b pb-2">
                 <span className="font-medium text-sm text-muted-foreground">Tourists in Area</span>
                 <span className="font-bold">{getZoneDetails(selectedZone.val).tourists}</span>
               </div>
               <div className="flex items-center justify-between border-b pb-2">
                 <span className="font-medium text-sm text-muted-foreground">Active Incidents</span>
                 <span className={`font-bold ${getZoneDetails(selectedZone.val).activeIncidents > 0 ? 'text-red-500' : ''}`}>
                    {getZoneDetails(selectedZone.val).activeIncidents}
                 </span>
               </div>
               {selectedZone.val >= 0.6 && (
                 <div className="mt-2 p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm">
                   <strong>Alert:</strong> Higher than normal risk detected. Advise extreme caution.
                 </div>
               )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RiskZoneHeatmap;
