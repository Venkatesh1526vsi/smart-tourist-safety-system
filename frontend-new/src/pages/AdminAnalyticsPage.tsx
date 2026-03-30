import { useEffect, useState } from "react";
import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { BarChart3, TrendingUp, Users, AlertTriangle, Calendar, Download, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllIncidents } from "@/services/api";

interface AnalyticsData {
  totalIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  averageResolutionTime: number;
  incidentsByType: { [key: string]: number };
  incidentsBySeverity: { [key: string]: number };
  monthlyTrend: { month: string; count: number }[];
  userActivity: { day: string; activeUsers: number }[];
}

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getAllIncidents();
        const incidentsData = response.data || [];
        setIncidents(incidentsData);
        
        // Calculate analytics from real data
        const totalIncidents = incidentsData.length;
        const resolvedIncidents = incidentsData.filter(i => i.status === 'resolved').length;
        const criticalIncidents = incidentsData.filter(i => i.severity === 'critical').length;
        
        // Calculate average resolution time (mock calculation)
        const resolvedIncidentsWithTime = incidentsData.filter(i => i.status === 'resolved');
        const averageResolutionTime = resolvedIncidentsWithTime.length > 0 ? 24 : 0; // hours
        
        // Group incidents by type
        const incidentsByType = incidentsData.reduce((acc, incident) => {
          acc[incident.type] = (acc[incident.type] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        
        // Group incidents by severity
        const incidentsBySeverity = incidentsData.reduce((acc, incident) => {
          acc[incident.severity] = (acc[incident.severity] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        
        // Generate monthly trend (mock data based on real incidents)
        const monthlyTrend = [
          { month: 'Jan', count: Math.floor(totalIncidents * 0.15) },
          { month: 'Feb', count: Math.floor(totalIncidents * 0.18) },
          { month: 'Mar', count: Math.floor(totalIncidents * 0.22) },
          { month: 'Apr', count: Math.floor(totalIncidents * 0.20) },
          { month: 'May', count: Math.floor(totalIncidents * 0.25) },
        ];
        
        // Generate user activity (mock data)
        const userActivity = [
          { day: 'Mon', activeUsers: 1247 },
          { day: 'Tue', activeUsers: 1356 },
          { day: 'Wed', activeUsers: 1423 },
          { day: 'Thu', activeUsers: 1389 },
          { day: 'Fri', activeUsers: 1567 },
          { day: 'Sat', activeUsers: 1123 },
          { day: 'Sun', activeUsers: 987 },
        ];
        
        setAnalytics({
          totalIncidents,
          resolvedIncidents,
          criticalIncidents,
          averageResolutionTime,
          incidentsByType,
          incidentsBySeverity,
          monthlyTrend,
          userActivity
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [timeRange]);

  const resolutionRate = analytics ? Math.round((analytics.resolvedIncidents / analytics.totalIncidents) * 100) : 0;

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading analytics...</span>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (error) {
    return (
      <AdminDashboardLayout>
        <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">System performance and usage insights</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <DashboardCard title="Total Incidents" icon={<AlertTriangle className="h-5 w-5 text-blue-500" />}>
            <div className="text-2xl font-bold">{analytics?.totalIncidents || 0}</div>
            <p className="text-xs text-muted-foreground">All reported incidents</p>
          </DashboardCard>
          
          <DashboardCard title="Resolution Rate" icon={<TrendingUp className="h-5 w-5 text-green-500" />}>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </DashboardCard>
          
          <DashboardCard title="Critical Cases" icon={<AlertTriangle className="h-5 w-5 text-red-500" />}>
            <div className="text-2xl font-bold">{analytics?.criticalIncidents || 0}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </DashboardCard>
          
          <DashboardCard title="Avg Resolution Time" icon={<Calendar className="h-5 w-5 text-orange-500" />}>
            <div className="text-2xl font-bold">{analytics?.averageResolutionTime || 0}h</div>
            <p className="text-xs text-muted-foreground">Average time to resolve</p>
          </DashboardCard>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Types Chart */}
          <DashboardCard title="Incidents by Type" icon={<BarChart3 className="h-5 w-5 text-primary" />}>
            <div className="space-y-4">
              {analytics && Object.entries(analytics.incidentsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(count / analytics.totalIncidents) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Severity Distribution */}
          <DashboardCard title="Severity Distribution" icon={<AlertTriangle className="h-5 w-5 text-primary" />}>
            <div className="space-y-4">
              {analytics && ['critical', 'high', 'medium', 'low'].map(severity => {
                const count = analytics.incidentsBySeverity[severity] || 0;
                const percentage = analytics.totalIncidents > 0 ? (count / analytics.totalIncidents) * 100 : 0;
                const color = severity === 'critical' ? 'bg-red-500' : 
                             severity === 'high' ? 'bg-orange-500' : 
                             severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500';
                
                return (
                  <div key={severity} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{severity}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardCard>
        </div>

        {/* Monthly Trend */}
        <DashboardCard title="Monthly Incident Trend" icon={<TrendingUp className="h-5 w-5 text-primary" />}>
          <div className="space-y-4">
            {analytics && (
              <div className="flex items-end justify-between h-32">
                {analytics.monthlyTrend.map((month, index) => {
                  const maxCount = Math.max(...analytics.monthlyTrend.map(m => m.count));
                  const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={month.month} className="flex flex-col items-center flex-1">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-xs text-muted-foreground mb-1">{month.count}</span>
                        <div 
                          className="w-8 bg-primary rounded-t" 
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-2">{month.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DashboardCard>

        {/* User Activity */}
        <DashboardCard title="User Activity (Last 7 Days)" icon={<Users className="h-5 w-5 text-primary" />}>
          <div className="space-y-4">
            {analytics && (
              <div className="flex items-end justify-between h-32">
                {analytics.userActivity.map((day, index) => {
                  const maxUsers = Math.max(...analytics.userActivity.map(d => d.activeUsers));
                  const height = maxUsers > 0 ? (day.activeUsers / maxUsers) * 100 : 0;
                  
                  return (
                    <div key={day.day} className="flex flex-col items-center flex-1">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-xs text-muted-foreground mb-1">{day.activeUsers}</span>
                        <div 
                          className="w-8 bg-green-500 rounded-t" 
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-2">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DashboardCard>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminAnalyticsPage;
