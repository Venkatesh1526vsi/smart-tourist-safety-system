import { useState } from "react";
import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { BarChart3, TrendingUp, Users, AlertTriangle, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminAnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // 1. LOAD DATA (localStorage ONLY)
  const incidents = JSON.parse(
    localStorage.getItem("incidents") ?? 
    localStorage.getItem("incidentData") ?? 
    "[]"
  );
  const users = JSON.parse(
    localStorage.getItem("users") ?? 
    localStorage.getItem("userData") ?? 
    "[]"
  );
  const broadcasts = JSON.parse(
    localStorage.getItem("broadcasts") ?? 
    localStorage.getItem("broadcastData") ?? 
    "[]"
  );

  // 2. BASE FILTERING (Time Range)
  let baseIncidents = [...incidents];
  if (timeRange !== 'all') {
    const now = new Date();
    const days = parseInt(timeRange) || 30;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    baseIncidents = incidents.filter((i: any) => new Date(i.created_at || i.createdAt || "").getTime() >= cutoff.getTime());
  }

  // 3. COMPUTE METRICS (Using baseIncidents)
  const totalIncidents = baseIncidents.length;
  const resolvedIncidentsCount = baseIncidents.filter((i: any) => i.status === 'resolved').length;
  const criticalIncidentsCount = baseIncidents.filter((i: any) => i.severity?.toLowerCase() === 'critical').length;
  const resolutionRate = totalIncidents > 0 ? Math.round((resolvedIncidentsCount / totalIncidents) * 100) : 0;

  // Avg Resolution Time calculation
  const resolvedWithTime = baseIncidents.filter((i: any) => 
    i.status === 'resolved' && (i.created_at || i.createdAt) && (i.resolvedAt || i.resolved_at)
  );
  let totalHours = 0;
  let validCount = 0;
  resolvedWithTime.forEach((i: any) => {
    const start = new Date(i.created_at || i.createdAt || "").getTime();
    const end = new Date(i.resolvedAt || i.resolved_at || "").getTime();
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      totalHours += (end - start) / (1000 * 60 * 60);
      validCount++;
    }
  });
  const avgResolutionTime = validCount > 0 ? Math.round(totalHours / validCount) : 0;

  // 4. CHART FILTERING (Respect selectedMetric)
  let chartIncidents = [...baseIncidents];
  if (selectedMetric === 'critical') {
    chartIncidents = baseIncidents.filter((i: any) => i.severity?.toLowerCase() === 'critical');
  }

  // 5. CHART DATA COMPUTATION
  // Incident Types
  const typeCounts = chartIncidents.reduce((acc: any, i: any) => {
    const type = i.type || "Unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const incidentsByType = Object.entries(typeCounts).map(([name, value]) => ({ name, value: value as number }));

  // Severity Data
  const incidentsBySeverity = chartIncidents.reduce((acc: any, i: any) => {
    const s = i.severity?.toLowerCase() || 'low';
    if (acc[s] !== undefined) acc[s]++;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0 });

  // Monthly Trend
  const monthsMap: Record<string, number> = {};
  chartIncidents.forEach((i: any) => {
    const date = i.created_at || i.createdAt;
    if (date) {
      const m = new Date(date).toLocaleString("default", { month: "short" });
      monthsMap[m] = (monthsMap[m] || 0) + 1;
    }
  });
  const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyTrend = Object.entries(monthsMap)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

  // User Activity (Simulated)
  const userActivity = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    activeUsers: users.length + Math.floor(Math.random() * 5)
  }));

  // EXPORT FUNCTION
  const exportData = () => {
    const data = { incidents, users, broadcasts };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics.json";
    a.click();
    alert("Analytics exported successfully");
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Live system performance from local storage</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2" onClick={exportData}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div onClick={() => setSelectedMetric(selectedMetric === "total" ? null : "total")} className={`cursor-pointer transition-all ${selectedMetric === 'total' ? 'ring-2 ring-primary rounded-xl' : ''}`}>
            <DashboardCard title="Total Incidents" icon={<AlertTriangle className="h-5 w-5 text-blue-500" />}>
              <div className="text-2xl font-bold">{totalIncidents}</div>
              <p className="text-xs text-muted-foreground">Reported cases</p>
            </DashboardCard>
          </div>
          
          <div onClick={() => setSelectedMetric(selectedMetric === "resolution" ? null : "resolution")} className={`cursor-pointer transition-all ${selectedMetric === 'resolution' ? 'ring-2 ring-primary rounded-xl' : ''}`}>
            <DashboardCard title="Resolution Rate" icon={<TrendingUp className="h-5 w-5 text-green-500" />}>
              <div className="text-2xl font-bold">{resolutionRate}%</div>
              <p className="text-xs text-muted-foreground">Successful resolutions</p>
            </DashboardCard>
          </div>
          
          <div onClick={() => setSelectedMetric(selectedMetric === "critical" ? null : "critical")} className={`cursor-pointer transition-all ${selectedMetric === 'critical' ? 'ring-2 ring-primary rounded-xl' : ''}`}>
            <DashboardCard title="Critical Cases" icon={<AlertTriangle className="h-5 w-5 text-red-500" />}>
              <div className="text-2xl font-bold">{criticalIncidentsCount}</div>
              <p className="text-xs text-muted-foreground">Immediate priority</p>
            </DashboardCard>
          </div>
          
          <div onClick={() => setSelectedMetric(selectedMetric === "time" ? null : "time")} className={`cursor-pointer transition-all ${selectedMetric === 'time' ? 'ring-2 ring-primary rounded-xl' : ''}`}>
            <DashboardCard title="Avg Resolution Time" icon={<Calendar className="h-5 w-5 text-orange-500" />}>
              <div className="text-2xl font-bold">{avgResolutionTime}h</div>
              <p className="text-xs text-muted-foreground">Avg time to fix</p>
            </DashboardCard>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="cursor-pointer">
            <DashboardCard title="Incidents by Type" icon={<BarChart3 className="h-5 w-5 text-primary" />}>
              <div className="space-y-4">
                {incidentsByType.length > 0 ? (
                  incidentsByType.map(({ name, value }) => (
                    <div key={name} className="flex items-center justify-between" title={`${name}: ${value}`}>
                      <span className="text-sm font-medium capitalize">{name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${(value / (totalIncidents || 1)) * 100}%` }} />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">{value}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                )}
              </div>
            </DashboardCard>
          </div>

          <div className="cursor-pointer">
            <DashboardCard title="Severity Distribution" icon={<AlertTriangle className="h-5 w-5 text-primary" />}>
              <div className="space-y-4">
                {['critical', 'high', 'medium', 'low'].map(s => {
                  const count = incidentsBySeverity[s] || 0;
                  const pct = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
                  const color = s === 'critical' ? 'bg-red-500' : s === 'high' ? 'bg-orange-500' : s === 'medium' ? 'bg-yellow-500' : 'bg-blue-500';
                  return (
                    <div key={s} className="flex items-center justify-between" title={`${s}: ${count}`}>
                      <span className="text-sm font-medium capitalize">{s}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          </div>
        </div>

        <div className="cursor-pointer">
          <DashboardCard title="Monthly Incident Trend" icon={<TrendingUp className="h-5 w-5 text-primary" />}>
            <div className="space-y-4 h-40 flex items-end">
              {monthlyTrend.length > 0 ? (
                <div className="flex items-end justify-between w-full">
                  {monthlyTrend.map((m) => {
                    const max = Math.max(...monthlyTrend.map(x => x.count), 1);
                    return (
                      <div key={m.month} className="flex flex-col items-center flex-1" title={`${m.month}: ${m.count}`}>
                        <div className="w-8 bg-primary rounded-t transition-all" style={{ height: `${(m.count / max) * 100}%` }} />
                        <span className="text-[10px] text-muted-foreground mt-2">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="w-full text-center text-sm text-muted-foreground">No trend data</p>
              )}
            </div>
          </DashboardCard>
        </div>

        <div className="cursor-pointer">
          <DashboardCard title="User Activity (Last 7 Days)" icon={<Users className="h-5 w-5 text-primary" />}>
            <div className="space-y-4 h-40 flex items-end">
              <div className="flex items-end justify-between w-full">
                {userActivity.map((day) => {
                  const max = Math.max(...userActivity.map(d => d.activeUsers), 1);
                  return (
                    <div key={day.day} className="flex flex-col items-center flex-1" title={`${day.day}: ${day.activeUsers}`}>
                      <div className="w-8 bg-green-500 rounded-t transition-all" style={{ height: `${(day.activeUsers / max) * 100}%` }} />
                      <span className="text-[10px] text-muted-foreground mt-2">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminAnalyticsPage;
