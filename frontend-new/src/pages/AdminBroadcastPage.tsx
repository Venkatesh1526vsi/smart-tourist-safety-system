import { useEffect, useState } from "react";
import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Radio, Send, Bell, Users, MapPin, Calendar, Filter, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Broadcast {
  _id: string;
  title: string;
  message: string;
  type: 'emergency' | 'warning' | 'info' | 'maintenance';
  targetAudience: 'all' | 'region' | 'high-risk';
  status: 'draft' | 'scheduled' | 'sent' | 'expired';
  scheduledFor?: string;
  sentAt?: string;
  recipients: number;
  regions?: string[];
  createdBy: string;
  createdAt: string;
}

const AdminBroadcastPage = () => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(() => {
    try {
      const stored = localStorage.getItem("broadcasts");
      if (stored && stored !== "[]") return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse broadcasts from localStorage", e);
    }

    // ✅ Fallback demo data
    return [
      {
        _id: "1",
        title: "Heavy Rain Alert",
        message: "Heavy rainfall expected in the Pune region. Please avoid unnecessary travel and stay safe.",
        type: "warning",
        targetAudience: "region",
        status: "sent",
        sentAt: new Date(Date.now() - 7200000).toISOString(),
        recipients: 5234,
        regions: ["Pune", "Kothrud"],
        createdBy: "Admin",
        createdAt: new Date(Date.now() - 10800000).toISOString()
      },
      {
        _id: "2",
        title: "System Maintenance",
        message: "Emergency services will be temporarily unavailable for maintenance from 2AM to 4AM.",
        type: "maintenance",
        targetAudience: "all",
        status: "scheduled",
        scheduledFor: new Date(Date.now() + 3600000).toISOString(),
        recipients: 0,
        createdBy: "Admin",
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState("all");
  const [filtered, setFiltered] = useState<Broadcast[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state for new broadcast
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    type: 'info' as Broadcast['type'],
    targetAudience: 'all' as Broadcast['targetAudience'],
    regions: [] as string[],
    isScheduled: false,
    scheduledDate: ''
  });

  useEffect(() => {
    localStorage.setItem("broadcasts", JSON.stringify(broadcasts));
  }, [broadcasts]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBroadcasts(prev =>
        prev.map(b => {
          if (
            b.status === "scheduled" &&
            b.scheduledFor &&
            new Date(b.scheduledFor) <= new Date()
          ) {
            return {
              ...b,
              status: "sent",
              sentAt: new Date().toISOString(),
              recipients: b.recipients || 0
            };
          }
          return b;
        })
      );
    }, 60000);

    setLoading(false);
    return () => clearInterval(interval);
  }, []);

  const handleSendBroadcast = () => {
    if (!newBroadcast.title || !newBroadcast.message) return;

    const broadcast: Broadcast = {
      _id: Date.now().toString(),
      title: newBroadcast.title,
      message: newBroadcast.message,
      type: newBroadcast.type,
      targetAudience: newBroadcast.targetAudience,
      regions: newBroadcast.regions,
      status: newBroadcast.isScheduled ? 'scheduled' : 'sent',
      sentAt: newBroadcast.isScheduled ? undefined : new Date().toISOString(),
      scheduledFor: newBroadcast.isScheduled ? new Date(newBroadcast.scheduledDate).toISOString() : undefined,
      recipients: newBroadcast.isScheduled ? 0 : 15000,
      createdBy: 'Admin',
      createdAt: new Date().toISOString()
    };

    setBroadcasts(prev => [broadcast, ...prev]);
    setNewBroadcast({
      title: '',
      message: '',
      type: 'info',
      targetAudience: 'all',
      regions: [],
      isScheduled: false,
      scheduledDate: ''
    });
  };

  const getTypeBadgeColor = (type: Broadcast['type']) => {
    switch (type) {
      case 'emergency': return 'bg-red-500 text-white';
      case 'warning': return 'bg-orange-500 text-white';
      case 'maintenance': return 'bg-yellow-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusBadgeColor = (status: Broadcast['status']) => {
    switch (status) {
      case 'sent': return 'bg-green-500 text-white';
      case 'scheduled': return 'bg-blue-500 text-white';
      case 'draft': return 'bg-gray-500 text-white';
      case 'expired': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleApplyFilter = () => {
    let data = [...broadcasts];

    if (search) {
      data = data.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.message.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      data = data.filter(b => b.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      data = data.filter(b => b.type === typeFilter);
    }

    setFiltered(data);
  };

  const handleClearFilter = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setFiltered([]);
  };

  const displayData =
    activeView === "scheduled"
      ? broadcasts.filter(b => b.status === "scheduled")
      : activeView === "emergency"
        ? broadcasts.filter(b => b.type === "emergency")
        : activeView === "recipients"
          ? [...broadcasts].sort((a, b) => b.recipients - a.recipients)
          : broadcasts;

  const finalData = filtered.length > 0 ? filtered : displayData;

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading broadcasts...</span>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Broadcast Center</h1>
            <p className="text-muted-foreground text-sm mt-1">Send alerts and notifications to users</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div onClick={() => { setActiveView("all"); setFiltered([]); }} className="cursor-pointer">
            <DashboardCard title="Total Sent" icon={<Send className="h-5 w-5 text-blue-500" />} className={activeView === 'all' ? 'ring-2 ring-primary' : ''}>
              <div className="text-2xl font-bold">
                {broadcasts.filter(b => b.status === 'sent').length}
              </div>
              <p className="text-xs text-muted-foreground">Broadcasts sent</p>
            </DashboardCard>
          </div>

          <div onClick={() => { setActiveView("scheduled"); setFiltered([]); }} className="cursor-pointer">
            <DashboardCard title="Scheduled" icon={<Calendar className="h-5 w-5 text-orange-500" />} className={activeView === 'scheduled' ? 'ring-2 ring-orange-500' : ''}>
              <div className="text-2xl font-bold">
                {broadcasts.filter(b => b.status === 'scheduled').length}
              </div>
              <p className="text-xs text-muted-foreground">Pending broadcasts</p>
            </DashboardCard>
          </div>

          <div onClick={() => { setActiveView("recipients"); setFiltered([]); }} className="cursor-pointer">
            <DashboardCard title="Total Recipients" icon={<Users className="h-5 w-5 text-green-500" />} className={activeView === 'recipients' ? 'ring-2 ring-green-500' : ''}>
              <div className="text-2xl font-bold">
                {broadcasts.reduce((sum, b) => sum + b.recipients, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Users reached</p>
            </DashboardCard>
          </div>

          <div onClick={() => { setActiveView("emergency"); setFiltered([]); }} className="cursor-pointer">
            <DashboardCard title="Emergency Alerts" icon={<Bell className="h-5 w-5 text-red-500" />} className={activeView === 'emergency' ? 'ring-2 ring-red-500' : ''}>
              <div className="text-2xl font-bold">
                {broadcasts.filter(b => b.type === 'emergency').length}
              </div>
              <p className="text-xs text-muted-foreground">Critical broadcasts</p>
            </DashboardCard>
          </div>
        </div>

        {/* New Broadcast Form */}
        <DashboardCard title="Create New Broadcast" icon={<Radio className="h-5 w-5 text-primary" />}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  placeholder="Enter broadcast title"
                  value={newBroadcast.title}
                  onChange={(e) => setNewBroadcast(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={newBroadcast.type} onValueChange={(value) =>
                  setNewBroadcast({ ...newBroadcast, type: value as Broadcast['type'] })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                placeholder="Enter your message here..."
                value={newBroadcast.message}
                onChange={(e) => setNewBroadcast(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">Target Audience</label>
                <Select
                  value={newBroadcast.targetAudience}
                  onValueChange={(value) =>
                    setNewBroadcast((prev) => ({
                      ...prev,
                      targetAudience: value as Broadcast["targetAudience"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="region">Specific Region</SelectItem>
                    <SelectItem value="high-risk">High Risk Areas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 mt-3">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBroadcast.isScheduled}
                    onChange={(e) => setNewBroadcast(prev => ({ ...prev, isScheduled: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Schedule for later
                </label>

                {newBroadcast.isScheduled && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <Input
                      type="datetime-local"
                      value={newBroadcast.scheduledDate}
                      onChange={(e) => setNewBroadcast(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full bg-background mt-1"
                    />
                  </div>
                )}

                <Button
                  onClick={handleSendBroadcast}
                  disabled={!newBroadcast.title || !newBroadcast.message || (newBroadcast.isScheduled && !newBroadcast.scheduledDate)}
                  className="w-full flex items-center gap-2 mt-2"
                >
                  <Send className="h-4 w-4" />
                  {newBroadcast.isScheduled ? 'Schedule Broadcast' : 'Send Broadcast'}
                </Button>
              </div>
            </div>
          </div>
        </DashboardCard>
        {/* Filters */}
        <DashboardCard title="Filters" icon={<Filter className="h-5 w-5 text-primary" />}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search broadcasts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilter} className="px-4">Apply</Button>
              <Button variant="outline" onClick={handleClearFilter} className="px-4">Clear</Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DashboardCard>

        {/* Broadcasts List */}
        <DashboardCard title="Recent Broadcasts" icon={<Radio className="h-5 w-5 text-primary" />}>
          <div className="space-y-4">
            {finalData.map((broadcast) => (
              <div
                key={broadcast._id}
                className="border border-border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expandedId === broadcast._id ? null : broadcast._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{broadcast.title}</h3>
                      <Badge className={getTypeBadgeColor(broadcast.type)}>
                        {broadcast.type}
                      </Badge>
                      <Badge className={getStatusBadgeColor(broadcast.status)}>
                        {broadcast.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{broadcast.message}</p>

                    {expandedId === broadcast._id && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-muted/50 p-3 rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{broadcast.message}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Audience</p>
                            <p className="text-sm capitalize">{broadcast.targetAudience}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Created</p>
                            <p className="text-sm">{new Date(broadcast.createdAt).toLocaleString()}</p>
                          </div>
                          {broadcast.sentAt && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Sent At</p>
                              <p className="text-sm">{new Date(broadcast.sentAt).toLocaleString()}</p>
                            </div>
                          )}
                          {broadcast.scheduledFor && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Scheduled For</p>
                              <p className="text-sm">{new Date(broadcast.scheduledFor).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {broadcast.recipients.toLocaleString()} recipients
                      </span>
                      {broadcast.regions && broadcast.regions.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {broadcast.regions.join(', ')}
                        </span>
                      )}
                      <span>
                        {broadcast.sentAt ? `Last active: ${new Date(broadcast.sentAt).toLocaleDateString()}` :
                          broadcast.scheduledFor ? `Scheduled: ${new Date(broadcast.scheduledFor).toLocaleDateString()}` :
                            `Drafted: ${new Date(broadcast.createdAt).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {finalData.length === 0 && (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">No broadcasts found matching your criteria.</p>
              </div>
            )}
          </div>
        </DashboardCard>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminBroadcastPage;