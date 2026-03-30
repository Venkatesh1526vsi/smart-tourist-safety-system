import { AlertTriangle, Clock, ShieldAlert, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryData {
  total_users?: number;
  total_incidents?: number;
  active_incidents?: number;
  resolved_today?: number;
  new_users_this_week?: number;
  critical_incidents?: number;
}

interface StatsOverviewCardsProps {
  summary?: SummaryData | null;
}

const StatsOverviewCards = ({ summary }: StatsOverviewCardsProps) => {
  const STATS = [
    {
      label: "Total Incidents",
      value: summary?.total_incidents?.toLocaleString() || "1,284",
      subtext: "+12% from last month",
      icon: ShieldAlert,
      iconClass: "text-sky-600 dark:text-cyan-400",
      iconBg: "bg-sky-500/10 dark:bg-cyan-500/10",
    },
    {
      label: "Active Incidents",
      value: summary?.active_incidents?.toString() || "37",
      subtext: "Requires attention",
      icon: AlertTriangle,
      iconClass: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10 dark:bg-amber-500/10",
    },
    {
      label: "Total Users",
      value: summary?.total_users?.toLocaleString() || "1,247",
      subtext: summary?.new_users_this_week ? `+${summary.new_users_this_week} this week` : "Registered users",
      icon: Users,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/10",
    },
    {
      label: "Critical Cases",
      value: summary?.critical_incidents?.toString() || "4",
      subtext: "High priority",
      icon: Clock,
      iconClass: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-500/10 dark:bg-red-500/10",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm"
          >
            <CardContent className="flex items-start gap-3 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${stat.iconClass}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.subtext}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsOverviewCards;
