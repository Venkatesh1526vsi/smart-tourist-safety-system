import { Route, Clock, ShieldCheck, Activity, Users, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RouteOption = {
  id: string;
  name: string;
  risk: "low" | "medium" | "high";
  time: string;
  score: number;
  recommended?: boolean;
  crowd: "low" | "moderate" | "high";
  etaConfidence: number;
};

const ROUTES: RouteOption[] = [
  { id: "1", name: "Main Highway via Ring Road", risk: "low", time: "25 min", score: 92, recommended: true, crowd: "low", etaConfidence: 95 },
  { id: "2", name: "City Center Route", risk: "medium", time: "18 min", score: 64, crowd: "moderate", etaConfidence: 78 },
  { id: "3", name: "Shortcut via Old Town", risk: "high", time: "14 min", score: 31, crowd: "high", etaConfidence: 45 },
];

const riskConfig = {
  low: {
    label: "Low Risk",
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  medium: {
    label: "Medium Risk",
    bar: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  high: {
    label: "High Risk",
    bar: "bg-red-500",
    badge: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  },
};

const RouteSafetySuggestionWidget = () => {
  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm transition-all hover:shadow-md h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="h-5 w-5 text-emerald-600 dark:text-cyan-400" />
            Live Route Intelligence
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border" title="Last calculated 2 mins ago">
            <RefreshCw className="h-2.5 w-2.5" />
            Auto-Sync
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ROUTES.map((route) => {
            const cfg = riskConfig[route.risk];
            return (
              <div
                key={route.id}
                className={`rounded-lg border p-3 transition-all ${
                  route.recommended
                    ? "border-emerald-500/40 shadow-[0_0_12px_-4px] shadow-emerald-500/20 bg-emerald-50/50 dark:border-cyan-500/40 dark:shadow-cyan-500/15 dark:bg-cyan-500/5"
                    : "border-border dark:border-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{route.name}</p>
                  {route.recommended && (
                    <Badge variant="outline" className="shrink-0 text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-cyan-400 dark:border-cyan-500/30 dark:bg-cyan-500/10">
                      Recommended
                    </Badge>
                  )}
                </div>

                {/* Safety bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted dark:bg-slate-700/50">
                  <div
                    className={`h-full rounded-full transition-all ${cfg.bar}`}
                    style={{ width: `${route.score}%` }}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-2">
                    <span className="flex items-center gap-1 font-mono text-foreground font-medium bg-muted/50 px-1.5 py-0.5 rounded" title="Live ETA">
                      <Clock className="h-3.5 w-3.5 text-blue-500" /> {route.time}
                    </span>
                    <span className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded" title="Safety Confidence Score">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> {route.score}%
                    </span>
                    <span className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded" title="Crowd Density">
                      <Users className="h-3.5 w-3.5 text-amber-500" /> 
                      <span className="capitalize">{route.crowd}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded" title="ETA Confidence">
                      <Activity className="h-3.5 w-3.5 text-purple-500" />
                      {route.etaConfidence}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteSafetySuggestionWidget;
