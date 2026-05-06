import { useMemo } from "react";
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
import { TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Incident } from "@/services/api";

interface MonthlyTrendChartProps {
  incidents?: Incident[];
  filter?: { month?: string };
  onFilterChange?: (filter: any) => void;
}

const MonthlyTrendChart = ({ incidents, filter, onFilterChange }: MonthlyTrendChartProps) => {
  
  const DATA = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentYear = now.getFullYear();

    let startMonthIndex = currentMonthIndex - 5; // Default to last 6 months
    let startYear = currentYear;
    if (startMonthIndex < 0) {
      startMonthIndex += 12;
      startYear -= 1;
    }

    if (incidents && incidents.length > 0) {
      const oldest = incidents.reduce((oldestDate, incident) => {
        const d = new Date(incident.created_at || Date.now());
        return d < oldestDate ? d : oldestDate;
      }, new Date());
      startMonthIndex = oldest.getMonth();
      startYear = oldest.getFullYear();
    }

    const displayMonths: string[] = [];
    let tempMonth = startMonthIndex;
    let tempYear = startYear;
    while (tempYear < currentYear || (tempYear === currentYear && tempMonth <= currentMonthIndex)) {
      displayMonths.push(`${monthNames[tempMonth]} '${tempYear.toString().slice(2)}`);
      tempMonth++;
      if (tempMonth > 11) {
        tempMonth = 0;
        tempYear++;
      }
    }

    const monthData: Record<string, { month: string, incidents: number, critical: number, high: number }> = {};
    displayMonths.forEach(m => monthData[m] = { month: m, incidents: 0, critical: 0, high: 0 });

    if (incidents && incidents.length > 0) {
      incidents.forEach(incident => {
        const date = new Date(incident.created_at || Date.now());
        const monthStr = `${monthNames[date.getMonth()]} '${date.getFullYear().toString().slice(2)}`;
        if (monthData[monthStr]) {
           monthData[monthStr].incidents += 1;
           if (incident.severity === 'critical') monthData[monthStr].critical += 1;
           if (incident.severity === 'high') monthData[monthStr].high += 1;
        }
      });
    }

    return Object.values(monthData);
  }, [incidents]);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const exportCSV = () => {
    if (!DATA.length) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,Total Incidents,Critical,High\n"
      + DATA.map(row => `${row.month},${row.incidents},${row.critical},${row.high}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "monthly_incidents_trend.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChartClick = (state: any) => {
    if (state && state.activeLabel && onFilterChange) {
      const clickedMonth = state.activeLabel;
      onFilterChange((prev: any) => ({
        ...prev,
        month: prev.month === clickedMonth ? undefined : clickedMonth
      }));
    }
  };

  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm relative">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-cyan-400" />
          Monthly Incident Trend {filter?.month ? `(${filter.month})` : ''}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={exportCSV} title="Export CSV" disabled={DATA.length === 0}>
           <Download className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {DATA.length === 0 ? (
           <div className="h-[260px] flex items-center justify-center text-muted-foreground">
             No incident data available for the selected filters.
           </div>
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DATA} onClick={handleChartClick} className="cursor-pointer">
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
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className={`p-3 rounded-lg shadow-lg ${isDark ? 'bg-slate-800 border border-slate-700 text-slate-200' : 'bg-white border border-slate-200 text-slate-800'}`}>
                          <p className="font-bold mb-1">{label}</p>
                          <p className="text-sm">Total: {data.incidents}</p>
                          <p className="text-sm text-red-500">Critical: {data.critical}</p>
                          <p className="text-sm text-amber-500">High: {data.high}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke={isDark ? "#22d3ee" : "#10b981"}
                  strokeWidth={2.5}
                  dot={{ fill: isDark ? "#22d3ee" : "#10b981", r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: isDark ? "#fff" : "#000" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendChart;
