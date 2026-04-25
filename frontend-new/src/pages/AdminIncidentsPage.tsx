import { useEffect, useState, Fragment } from "react";
import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AlertTriangle, Filter, Search, Loader2, Eye, Edit, CheckCircle, XCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyIncidents, updateIncident, deleteIncident } from "@/services/api";

type Incident = {
  _id: string;
  description: string;
  severity: string;
  status: string;
  category?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
  evidence_image?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
  [key: string]: any;
};

const AdminIncidentsPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const stored = localStorage.getItem("incidents");
    return stored ? JSON.parse(stored) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [deletedIncidents, setDeletedIncidents] = useState<Incident[]>(() => {
    const stored = localStorage.getItem("deletedIncidents");
    return stored ? JSON.parse(stored) : [];
  });
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [resolvedIncidents, setResolvedIncidents] = useState<Incident[]>(() => {
    const stored = localStorage.getItem("resolvedIncidents");
    return stored ? JSON.parse(stored) : [];
  });
  const [activeView, setActiveView] = useState("all");
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    localStorage.setItem("incidents", JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem("resolvedIncidents", JSON.stringify(resolvedIncidents));
  }, [resolvedIncidents]);

  useEffect(() => {
    localStorage.setItem("deletedIncidents", JSON.stringify(deletedIncidents));
  }, [deletedIncidents]);

  useEffect(() => {
    const hasLocalData =
      localStorage.getItem("incidents") ||
      localStorage.getItem("resolvedIncidents") ||
      localStorage.getItem("deletedIncidents");

    // 🚫 Prevent overwrite if local data exists
    if (hasLocalData) {
      setLoading(false);
      return;
    }

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

        setIncidents(prev => {
          // 🚫 Do not overwrite existing local state
          if (prev && prev.length > 0) return prev;

          localStorage.setItem("incidents", JSON.stringify(finalData));
          return finalData as Incident[];
        });
      } catch (err) {
        console.error("API ERROR:", err);
        setError(err instanceof Error ? err.message : 'Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []); // Run ONLY once on mount

  const handleResolve = (incident: Incident) => {
    const found = incidents.find(i => i._id === incident._id);
    if (!found) return;

    const resolvedItem = {
      ...found,
      status: "resolved",
      resolvedAt: new Date().toISOString()
    };

    const stored = JSON.parse(localStorage.getItem("resolvedIncidents") || "[]");

    const updatedResolved = stored.find((i: any) => i._id === resolvedItem._id)
      ? stored
      : [...stored, resolvedItem];

    localStorage.setItem("resolvedIncidents", JSON.stringify(updatedResolved));
    setResolvedIncidents(updatedResolved);

    const updatedIncidents = incidents.filter(i => i._id !== resolvedItem._id);

    localStorage.setItem("incidents", JSON.stringify(updatedIncidents));
    setIncidents(updatedIncidents);
  };


  const handleDeleteIncident = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this incident?')) return;

    const found = incidents.find(i => i?._id === id);
    if (!found) return;

    const incidentToDelete = {
      ...found,
      deletedAt: new Date().toISOString()
    };

    try {
      await deleteIncident(id);
    } catch (err) {
      console.log("Delete fallback applied", err);
    }

    setDeletedIncidents(prev => {
      const updated = prev.find(i => i?._id === id)
        ? prev
        : [...prev, incidentToDelete as Incident];
      localStorage.setItem("deletedIncidents", JSON.stringify(updated));
      return updated;
    });

    setIncidents(prev => {
      const updated = prev.filter(incident => incident?._id !== id);
      localStorage.setItem("incidents", JSON.stringify(updated));
      return updated;
    });
  };

  const handleRowClick = (id: string) => {
    setSelectedIncidentId(prev => prev === id ? null : id);
  };

  const applyFilters = () => {
    let data = [...incidents];

    if (search) {
      data = data.filter(i =>
        (i?.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (i?.type || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    if (severityFilter !== "all") {
      data = data.filter(i => i?.severity === severityFilter);
    }

    setFilteredIncidents(data);
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

  const displayIncidents = incidents.filter(
    i => !deletedIncidents.some(d => d?._id === i?._id)
  );


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

  console.log("ResolvedIncidents UI:", resolvedIncidents);

  const displayData =
    activeView === "resolved"
      ? resolvedIncidents
      : activeView === "deleted"
        ? deletedIncidents
        : filteredIncidents.length > 0
          ? filteredIncidents
          : incidents;

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
          <div onClick={() => setActiveView("all")} className="cursor-pointer">
            <DashboardCard title="Total" icon={<AlertTriangle className="h-5 w-5 text-blue-500" />} className={activeView === 'all' ? 'ring-2 ring-primary' : ''}>
              <div className="text-2xl font-bold">{incidents.length}</div>
              <p className="text-xs text-muted-foreground">Active Reports</p>
            </DashboardCard>
          </div>

          <div onClick={() => setActiveView("critical")} className="cursor-pointer">
            <DashboardCard title="Critical" icon={<AlertTriangle className="h-5 w-5 text-red-500" />} className={activeView === 'critical' ? 'ring-2 ring-red-500' : ''}>
              <div className="text-2xl font-bold">
                {incidents.filter(i => i?.severity === 'critical').length}
              </div>
              <p className="text-xs text-muted-foreground">High priority</p>
            </DashboardCard>
          </div>

          <div onClick={() => setActiveView("resolved")} className="cursor-pointer">
            <DashboardCard title="Resolved" icon={<CheckCircle className="h-5 w-5 text-green-500" />} className={activeView === 'resolved' ? 'ring-2 ring-green-500' : ''}>
              <div className="text-2xl font-bold">
                {resolvedIncidents.length}
              </div>
              <p className="text-xs text-muted-foreground">Success cases</p>
            </DashboardCard>
          </div>

          <div onClick={() => setActiveView("deleted")} className="cursor-pointer">
            <DashboardCard title="Deleted" icon={<XCircle className="h-5 w-5 text-orange-500" />} className={activeView === 'deleted' ? 'ring-2 ring-orange-500' : ''}>
              <div className="text-2xl font-bold">{deletedIncidents.length}</div>
              <p className="text-xs text-muted-foreground">Archived deletions</p>
            </DashboardCard>
          </div>
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
            <div className="flex gap-2">
              <Button
                className="px-4"
                onClick={(e) => {
                  e.stopPropagation();
                  applyFilters();
                }}
              >
                Apply
              </Button>
              <Button
                variant="outline"
                className="px-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearch("");
                  setSeverityFilter("all");
                  setFilteredIncidents([]);
                }}
              >
                Clear
              </Button>
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
                  {(displayData || []).map((incident: any) => (
                    <Fragment key={incident?._id || Math.random()}>
                      <tr
                        className="border-b border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(incident?._id)}
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{incident?.type}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {incident?.description}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div className="font-medium">{incident?.user?.name || 'Unknown'}</div>
                            <div className="text-muted-foreground">{incident?.user?.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getSeverityBadgeColor(incident?.severity)}>
                            {incident?.severity}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(incident?.status)}
                            <Badge className={getStatusBadgeColor(incident?.status)}>
                              {incident?.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {incident?.created_at ? new Date(incident.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {incident?.created_at ? new Date(incident.created_at).toLocaleTimeString() : ''}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(incident._id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingIncident(incident);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {incident?.status !== 'resolved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  handleResolve(incident);
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteIncident(incident._id);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
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
                                          await updateIncident(incident._id, {
                                            status: newStatus,
                                            severity: incident.severity,
                                            category: incident.category || 'general'
                                          });
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
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>

        {activeView === 'deleted' && deletedIncidents.length > 0 && (
          <div className="mt-4 border p-4 rounded bg-muted/20 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-orange-600">Archived Deletions</h3>
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletedIncidents([]);
                }}
              >
                Clear History
              </Button>
            </div>
            <div className="space-y-2">
              {deletedIncidents.map(inc => (
                <div key={inc._id} className="border-b border-border py-2 text-sm flex justify-between items-center">
                  <div>
                    <span className="font-medium">{inc.type}</span>
                    <span className="text-muted-foreground ml-2">— {inc.description.substring(0, 30)}...</span>
                    {(inc as any).actionAt && (
                      <span className="ml-2 text-[10px] text-muted-foreground">
                        ({new Date((inc as any).actionAt).toLocaleString()})
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px]">Deleted</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editingIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-96 shadow-xl border animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-semibold mb-4">Edit Incident</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Description</label>
                <textarea
                  value={editingIncident.description}
                  onChange={(e) => setEditingIncident({ ...editingIncident, description: e.target.value })}
                  className="border p-2 w-full rounded bg-background text-sm min-h-[100px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Severity</label>
                <select
                  value={editingIncident.severity}
                  onChange={(e) => setEditingIncident({ ...editingIncident, severity: e.target.value as any })}
                  className="border p-2 w-full rounded bg-background text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 border rounded hover:bg-muted transition text-sm"
                onClick={() => setEditingIncident(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition text-sm"
                onClick={async () => {
                  try {
                    await updateIncident(editingIncident._id, editingIncident);
                    setIncidents(prev => {
                      const updated = prev.map(i => i?._id === editingIncident._id ? editingIncident : i);
                      localStorage.setItem("incidents", JSON.stringify(updated));
                      return updated;
                    });
                    setEditingIncident(null);
                  } catch (err) {
                    console.log("Edit fallback applied", err);
                    setIncidents(prev => {
                      const updated = prev.map(i => i?._id === editingIncident._id ? editingIncident : i);
                      localStorage.setItem("incidents", JSON.stringify(updated));
                      return updated;
                    });
                    setEditingIncident(null);
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminIncidentsPage;
