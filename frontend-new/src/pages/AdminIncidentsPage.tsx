import { useEffect, useState } from "react";
import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AlertTriangle, Filter, Search, MoreHorizontal, Loader2, Eye, Edit, CheckCircle, XCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyIncidents, updateIncident } from "@/services/api";

interface Incident {
  _id: string;
  userId: string;
  type: string;
  category?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  latitude: number;
  longitude: number;
  evidence_image?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

const AdminIncidentsPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: any = await getMyIncidents();

        const finalData = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.data)
              ? response.data.data
              : [];

        setIncidents(finalData as Incident[]);
        let filteredIncidents: Incident[] = [...(finalData as Incident[])];

        // Apply filters
        if (search) {
          filteredIncidents = filteredIncidents.filter(incident =>
            incident.description.toLowerCase().includes(search.toLowerCase()) ||
            incident.type.toLowerCase().includes(search.toLowerCase())
          );
        }

        if (severityFilter !== 'all') {
          filteredIncidents = filteredIncidents.filter(incident => incident.severity === severityFilter);
        }

        if (statusFilter !== 'all') {
          filteredIncidents = filteredIncidents.filter(incident => incident.status === statusFilter);
        }

        setIncidents(filteredIncidents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const handleStatusUpdate = async (incidentId: string, newStatus: string) => {
    try {
      await updateIncident(incidentId, { status: newStatus });
      setIncidents(prev => prev.map(incident =>
        incident._id === incidentId ? { ...incident, status: newStatus } : incident
      ));
    } catch (err) {
      console.error('Failed to update incident status:', err);
    }
  };

  const handleRowClick = (id: string) => {
    setSelectedIncidentId(prev => prev === id ? null : id);
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-500 text-white';
      case 'investigating': return 'bg-blue-500 text-white';
      case 'reported': return 'bg-yellow-500 text-white';
      case 'pending': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'investigating': return <Clock className="h-4 w-4" />;
      case 'reported': return <AlertTriangle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Incident Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Review and manage reported incidents</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <DashboardCard title="Total Incidents" icon={<AlertTriangle className="h-5 w-5 text-blue-500" />}>
            <div className="text-2xl font-bold">{incidents.length}</div>
            <p className="text-xs text-muted-foreground">All reported incidents</p>
          </DashboardCard>

          <DashboardCard title="Critical" icon={<AlertTriangle className="h-5 w-5 text-red-500" />}>
            <div className="text-2xl font-bold">
              {incidents.filter(i => i.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">Critical priority</p>
          </DashboardCard>

          <DashboardCard title="Under Investigation" icon={<Clock className="h-5 w-5 text-blue-500" />}>
            <div className="text-2xl font-bold">
              {incidents.filter(i => i.status === 'investigating').length}
            </div>
            <p className="text-xs text-muted-foreground">Being investigated</p>
          </DashboardCard>

          <DashboardCard title="Resolved" icon={<CheckCircle className="h-5 w-5 text-green-500" />}>
            <div className="text-2xl font-bold">
              {incidents.filter(i => i.status === 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </DashboardCard>
        </div>

        {/* Filters */}
        <DashboardCard title="Filters" icon={<Filter className="h-5 w-5 text-primary" />}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search incidents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DashboardCard>

        {/* Incidents Table */}
        <DashboardCard title="Incidents" icon={<AlertTriangle className="h-5 w-5 text-primary" />}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading incidents...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium">Incident</th>
                    <th className="text-left p-3 font-medium">Reporter</th>
                    <th className="text-left p-3 font-medium">Severity</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(incidents) ? incidents : []).map((incident) => (
                    <>
                      <tr
                        key={incident._id}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(incident._id)}
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{incident.type}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {incident.description}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div className="font-medium">{incident.user?.name || 'Unknown'}</div>
                            <div className="text-muted-foreground">{incident.user?.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getSeverityBadgeColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(incident.status)}
                            <Badge className={getStatusBadgeColor(incident.status)}>
                              {incident.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {new Date(incident.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(incident.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {incident.status !== 'resolved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(incident._id, 'resolved');
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {selectedIncidentId === incident._id && (
                        <tr className="bg-muted/20">
                          <td colSpan={6} className="p-0">
                            <div className="p-4 space-y-3 border-x border-b animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-sm"><strong className="text-muted-foreground mr-2">Type:</strong> {incident.type}</p>
                                  <p className="text-sm"><strong className="text-muted-foreground mr-2">Description:</strong> {incident.description}</p>
                                  <p className="text-sm">
                                    <strong className="text-muted-foreground mr-2">Location:</strong>
                                    {incident.latitude != null && incident.longitude != null
                                      ? `Lat: ${incident.latitude}, Lng: ${incident.longitude}`
                                      : "Unavailable"}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <strong className="text-muted-foreground mr-2">Update Status:</strong>
                                    <select
                                      className="border rounded px-2 py-1 bg-background text-sm"
                                      value={incident.status || "pending"}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={async (e) => {
                                        const newStatus = e.target.value;
                                        try {
                                          await updateIncident(incident._id, { status: newStatus });
                                          setIncidents(prev =>
                                            prev.map(i =>
                                              i._id === incident._id
                                                ? { ...i, status: newStatus }
                                                : i
                                            )
                                          );
                                          console.log("Updated:", newStatus);

                                        } catch (err) {
                                          console.error("Status update failed", err);
                                        }
                                      }}
                                    >
                                      <option value="reported">Reported</option>
                                      <option value="investigating">Investigating</option>
                                      <option value="resolved">Resolved</option>
                                      <option value="pending">Pending</option>
                                    </select>
                                  </div>
                                  <p className="text-sm"><strong className="text-muted-foreground mr-2">Current Status:</strong> {incident.status}</p>
                                  <p className="text-sm"><strong className="text-muted-foreground mr-2">Date:</strong> {new Date(incident.created_at).toLocaleString()}</p>

                                  {((Array.isArray((incident as any).images) && (incident as any).images.length > 0) || incident.evidence_image) && (
                                    <div className="mt-3">
                                      <strong className="text-sm text-muted-foreground block mb-2">Evidence:</strong>
                                      <div className="flex flex-wrap gap-2">
                                        {Array.isArray((incident as any).images) && (incident as any).images.map((img: string, i: number) => (
                                          <img key={i} src={img} className="w-20 h-20 object-cover rounded border" />
                                        ))}
                                        {incident.evidence_image && !Array.isArray((incident as any).images) && (
                                          <img src={incident.evidence_image} className="w-20 h-20 object-cover rounded border" />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminIncidentsPage;
