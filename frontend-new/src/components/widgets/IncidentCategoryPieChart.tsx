import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import type { Incident } from "@/services/api";

interface IncidentCategoryPieChartProps {
  incidents?: Incident[];
  filter?: { category?: string };
  onFilterChange?: (filter: any) => void;
}

// SAFEYATRA theme-consistent colors
const COLORS_LIGHT = ["#10b981", "#0ea5e9", "#f59e0b", "#06b6d4", "#64748b"];
const COLORS_DARK = ["#34d399", "#22d3ee", "#fbbf24", "#38bdf8", "#94a3b8"];

const IncidentCategoryPieChart = ({ incidents, filter, onFilterChange }: IncidentCategoryPieChartProps) => {
  const DATA = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return [
        { name: "Theft", value: 35 },
        { name: "Assault", value: 20 },
        { name: "Scam", value: 25 },
        { name: "Lost Tourist", value: 12 },
        { name: "Other", value: 8 },
      ];
    }
    
    const categoryCounts: Record<string, number> = {};
    incidents.forEach(incident => {
      const category = incident.type || incident.category || 'Other';
      const formatted = category.charAt(0).toUpperCase() + category.slice(1);
      categoryCounts[formatted] = (categoryCounts[formatted] || 0) + 1;
    });
    
    return Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  const totalIncidents = useMemo(() => DATA.reduce((sum, item) => sum + item.value, 0), [DATA]);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;

  const handleClick = (data: any) => {
    if (onFilterChange && data && data.name) {
      onFilterChange((prev: any) => ({
        ...prev,
        category: prev.category === data.name.toLowerCase() ? undefined : data.name.toLowerCase()
      }));
    }
  };

  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm relative">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldAlert className="h-5 w-5 text-sky-600 dark:text-cyan-400" />
          Incident Categories {filter?.category ? `(${filter.category.charAt(0).toUpperCase() + filter.category.slice(1)})` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {DATA.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-muted-foreground">
             No category data available.
          </div>
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  onClick={handleClick}
                  className="cursor-pointer outline-none"
                >
                  {DATA.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]} 
                      opacity={filter?.category && filter.category !== entry.name.toLowerCase() ? 0.3 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = ((data.value / totalIncidents) * 100).toFixed(1);
                      return (
                        <div className={`p-3 rounded-lg shadow-lg ${isDark ? 'bg-slate-800 border border-slate-700 text-slate-200' : 'bg-white border border-slate-200 text-slate-800'}`}>
                          <p className="font-bold mb-1">{data.name}</p>
                          <p className="text-sm">Total: {data.value}</p>
                          <p className="text-sm text-primary">{percentage}% of total</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", cursor: "pointer" }} onClick={(e) => handleClick({ name: e.value })} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IncidentCategoryPieChart;
