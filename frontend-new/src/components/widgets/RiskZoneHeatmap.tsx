import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

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

  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-amber-500" />
          Risk Zone Map
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
                      className={`flex items-center justify-center border border-white/10 dark:border-slate-600/20 transition-colors ${cellColor(val, isDark)}`}
                      title={`Risk: ${riskLabel(val)}`}
                    >
                      <span className="text-[9px] font-medium text-foreground/50">
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
  );
};

export default RiskZoneHeatmap;
