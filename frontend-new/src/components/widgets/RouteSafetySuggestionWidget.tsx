import { Route, Clock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RouteOption = {
  id: string;
  name: string;
  risk: "low" | "medium" | "high";
  time: string;
  score: number;
  recommended?: boolean;
};

const ROUTES: RouteOption[] = [
  { id: "1", name: "Main Highway via Ring Road", risk: "low", time: "25 min", score: 92, recommended: true },
  { id: "2", name: "City Center Route", risk: "medium", time: "18 min", score: 64 },
  { id: "3", name: "Shortcut via Old Town", risk: "high", time: "14 min", score: 31 },
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
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Route className="h-5 w-5 text-emerald-600 dark:text-cyan-400" />
          Route Safety
        </CardTitle>
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

                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {route.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> {route.score}/100
                    </span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.badge}`}>
                    {cfg.label}
                  </Badge>
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
