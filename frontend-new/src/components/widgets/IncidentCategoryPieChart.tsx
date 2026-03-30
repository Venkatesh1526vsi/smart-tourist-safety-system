import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import type { Incident } from "@/services/api";

interface IncidentCategoryPieChartProps {
  incidents?: Incident[];
}

// SAFEYATRA theme-consistent colors (Tailwind palette values)
const COLORS_LIGHT = [
  "#10b981", // emerald-500
  "#0ea5e9", // sky-500
  "#f59e0b", // amber-500
  "#06b6d4", // cyan-500
  "#64748b", // slate-500 (muted blue)
];

const COLORS_DARK = [
  "#34d399", // emerald-400
  "#22d3ee", // cyan-400
  "#fbbf24", // amber-400
  "#38bdf8", // sky-400
  "#94a3b8", // slate-400
];

const IncidentCategoryPieChart = ({ incidents }: IncidentCategoryPieChartProps) => {
  // Generate category data from real incidents or use default
  const generateCategoryData = () => {
    if (!incidents || incidents.length === 0) {
      return [
        { name: "Theft", value: 35 },
        { name: "Assault", value: 20 },
        { name: "Scam", value: 25 },
        { name: "Lost Tourist", value: 12 },
        { name: "Other", value: 8 },
      ];
    }
    
    // Count incidents by category
    const categoryCounts: Record<string, number> = {};
    incidents.forEach(incident => {
      const category = incident.category || incident.type || 'Other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Convert to array format
    return Object.entries(categoryCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };
  
  const DATA = generateCategoryData();
  // Detect dark mode via class on html element
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;

  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldAlert className="h-5 w-5 text-sky-600 dark:text-cyan-400" />
          Incident Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              >
                {DATA.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
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
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentCategoryPieChart;
