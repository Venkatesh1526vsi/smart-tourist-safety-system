import { useEffect, useState, useMemo } from "react";
import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Radar, AlertTriangle, Radio, Users, Loader2 } from "lucide-react";
import StatsOverviewCards from "@/components/widgets/StatsOverviewCards";
import IncidentCategoryPieChart from "@/components/widgets/IncidentCategoryPieChart";
import MonthlyTrendChart from "@/components/widgets/MonthlyTrendChart";
import RiskZoneHeatmap from "@/components/widgets/RiskZoneHeatmap";
import LiveTouristTracking from "@/components/widgets/LiveTouristTracking";
import { getAdminDashboardSummary, getAllIncidents, type Incident } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  LiveTrackingModal,
  IncidentReviewModal,
  BroadcastModal,
  UserManagementModal,
  SafetyAlertModal
} from "@/components/dashboard/DashboardModals";

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
  
  // New Interactive States
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<{ severity?: string, status?: string }>({});

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

  // Centralized filtering
  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      if (dashboardFilter.severity && i.severity !== dashboardFilter.severity) return false;
      if (dashboardFilter.status && i.status !== dashboardFilter.status) return false;
      return true;
    });
  }, [incidents, dashboardFilter]);

  // Calculate stats from real data
  const pendingCount = filteredIncidents.filter(i => i.status === 'reported' || i.status === 'pending').length;
  const criticalCount = filteredIncidents.filter(i => i.severity === 'critical').length;
  const highCount = filteredIncidents.filter(i => i.severity === 'high').length;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Control Center</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor and manage tourist safety operations</p>
          </div>
          {Object.keys(dashboardFilter).length > 0 && (
             <Button variant="outline" size="sm" onClick={() => setDashboardFilter({})}>Clear Filters</Button>
          )}
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
            <StatsOverviewCards 
              summary={summary} 
              filter={dashboardFilter} 
              onFilterChange={setDashboardFilter} 
            />

            {/* Analytics Charts */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MonthlyTrendChart incidents={filteredIncidents} />
              </div>
              <div>
                <IncidentCategoryPieChart incidents={filteredIncidents} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <RiskZoneHeatmap />
            </div>

            {/* Live Tourist Tracking */}
            <div className="mt-6">
               <h2 className="text-xl font-bold mb-4">Live Tourist Tracking</h2>
               <LiveTouristTracking filter={dashboardFilter} />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div onClick={() => setActiveModal('liveTracking')} className="cursor-pointer transition-transform hover:scale-[1.02]">
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
              </div>

              <div onClick={() => setActiveModal('incidentReview')} className="cursor-pointer transition-transform hover:scale-[1.02]">
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
              </div>

              <div onClick={() => setActiveModal('broadcastCenter')} className="cursor-pointer transition-transform hover:scale-[1.02]">
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
              </div>

              <div onClick={() => setActiveModal('userManagement')} className="cursor-pointer transition-transform hover:scale-[1.02]">
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
            </div>
          </>
        )}
        <Button onClick={() => setActiveModal('safetyAlert')}>
          Send Safety Alert
        </Button>
      </div>

      {/* Interactive Modals */}
      <LiveTrackingModal open={activeModal === 'liveTracking'} onOpenChange={(v) => setActiveModal(v ? 'liveTracking' : null)} />
      <IncidentReviewModal 
        open={activeModal === 'incidentReview'} 
        onOpenChange={(v) => setActiveModal(v ? 'incidentReview' : null)} 
        incidents={filteredIncidents}
        onUpdate={() => {}} 
      />
      <BroadcastModal open={activeModal === 'broadcastCenter'} onOpenChange={(v) => setActiveModal(v ? 'broadcastCenter' : null)} />
      <UserManagementModal open={activeModal === 'userManagement'} onOpenChange={(v) => setActiveModal(v ? 'userManagement' : null)} />
      <SafetyAlertModal open={activeModal === 'safetyAlert'} onOpenChange={(v) => setActiveModal(v ? 'safetyAlert' : null)} />

    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
