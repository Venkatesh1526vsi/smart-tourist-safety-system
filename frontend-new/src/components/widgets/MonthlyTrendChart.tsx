import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { Incident } from "@/services/api";

interface MonthlyTrendChartProps {
  incidents?: Incident[];
}

const MonthlyTrendChart = ({ incidents }: MonthlyTrendChartProps) => {
  // Generate monthly data from real incidents or use default
  const generateMonthlyData = () => {
    if (!incidents || incidents.length === 0) {
      return [
        { month: "Jan", incidents: 65 },
        { month: "Feb", incidents: 59 },
        { month: "Mar", incidents: 80 },
        { month: "Apr", incidents: 72 },
        { month: "May", incidents: 56 },
        { month: "Jun", incidents: 55 },
        { month: "Jul", incidents: 90 },
        { month: "Aug", incidents: 105 },
        { month: "Sep", incidents: 88 },
        { month: "Oct", incidents: 74 },
        { month: "Nov", incidents: 60 },
        { month: "Dec", incidents: 48 },
      ];
    }
    
    // Group incidents by month
    const monthCounts: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize all months with 0
    months.forEach(m => monthCounts[m] = 0);
    
    // Count incidents per month
    incidents.forEach(incident => {
      const date = new Date(incident.created_at);
      const month = months[date.getMonth()];
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    
    return months.map(month => ({
      month,
      incidents: monthCounts[month] || 0
    }));
  };
  
  const DATA = generateMonthlyData();
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-cyan-400" />
          Monthly Incident Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DATA}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#334155" : "#e2e8f0"}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark
                    ? "rgba(30, 41, 59, 0.9)"
                    : "rgba(255,255,255,0.95)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: isDark ? "#e2e8f0" : "#1e293b",
                }}
              />
              <Line
                type="monotone"
                dataKey="incidents"
                stroke={isDark ? "#22d3ee" : "#10b981"}
                strokeWidth={2.5}
                dot={{ fill: isDark ? "#22d3ee" : "#10b981", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendChart;
