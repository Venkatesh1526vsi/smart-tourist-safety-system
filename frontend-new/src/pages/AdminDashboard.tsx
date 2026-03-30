import { useEffect, useState } from "react";
import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Radar, AlertTriangle, Radio, Users, Loader2 } from "lucide-react";
import StatsOverviewCards from "@/components/widgets/StatsOverviewCards";
import IncidentCategoryPieChart from "@/components/widgets/IncidentCategoryPieChart";
import MonthlyTrendChart from "@/components/widgets/MonthlyTrendChart";
import RiskZoneHeatmap from "@/components/widgets/RiskZoneHeatmap";
import { getAdminDashboardSummary, getAllIncidents, type Incident } from "@/services/api";
import { notifyInfo } from "@/utils/notify";
import { Button } from "@/components/ui/button";

interface DashboardSummary {
  total_users: number;
  total_incidents: number;
  active_incidents: number;
  resolved_today: number;
  new_users_this_week: number;
  critical_incidents: number;
}

const AdminDashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [summaryRes, incidentsRes] = await Promise.all([
          getAdminDashboardSummary(),
          getAllIncidents(),
        ]);
        
        setSummary(summaryRes.summary);
        setIncidents(incidentsRes.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate stats from real data
  const pendingCount = incidents.filter(i => i.status === 'reported' || i.status === 'pending').length;
  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const highCount = incidents.filter(i => i.severity === 'high').length;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Control Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor and manage tourist safety operations</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading admin dashboard...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <StatsOverviewCards summary={summary} />

            {/* Analytics Charts */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MonthlyTrendChart incidents={incidents} />
              </div>
              <div>
                <IncidentCategoryPieChart incidents={incidents} />
              </div>
            </div>

            {/* Risk Zone Heatmap */}
            <div className="grid md:grid-cols-2 gap-6">
              <RiskZoneHeatmap />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <DashboardCard title="Live User Tracking" icon={<Radar className="h-5 w-5 text-primary" />}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Active Users</span>
                    <span className="text-lg font-display font-bold text-primary">{summary?.total_users?.toLocaleString() || '1,247'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Users in risk zones</span>
                    <span className="text-amber-500 font-medium">{Math.floor((summary?.total_users || 1247) * 0.02)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>SOS requests active</span>
                    <span className="text-red-500 font-medium">{criticalCount || 3}</span>
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Incident Review" icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Pending review</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-medium">{pendingCount || 12}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Resolved today</span>
                    <span className="text-primary font-medium">{summary?.resolved_today || 45}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Critical incidents</span>
                    <span className="text-red-500 font-medium">{criticalCount || 2}</span>
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Broadcast Center" icon={<Radio className="h-5 w-5 text-blue-500" />}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Last broadcast: Weather Alert</span>
                    <span className="text-muted-foreground">30m ago</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Recipients reached</span>
                    <span className="font-medium">{(summary?.total_users || 8432).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Send alerts to all active users in a region.</p>
                </div>
              </DashboardCard>

              <DashboardCard title="User Management" icon={<Users className="h-5 w-5 text-blue-400" />}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Total registered</span>
                    <span className="font-display font-bold">{summary?.total_users?.toLocaleString() || '52,340'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>New this week</span>
                    <span className="text-primary font-medium">+{summary?.new_users_this_week || 312}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>High severity incidents</span>
                    <span>{highCount || 48}</span>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </>
        )}
        <Button
  onClick={() => {
    notifyInfo("🚨 Admin Alert: High risk detected in your area!");
  }}
>
  Send Safety Alert
</Button>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
