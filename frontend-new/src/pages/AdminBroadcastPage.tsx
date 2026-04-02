import { useState } from "react";
import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Radio, Send, Bell, Users, MapPin, Calendar, Filter, Search } from "lucide-react";
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

function createMockBroadcasts(): Broadcast[] {
  return [
    {
      _id: '1',
      title: 'Heavy Rain Alert',
      message: 'Heavy rainfall expected in Pune region. Please avoid unnecessary travel and stay safe.',
      type: 'warning',
      targetAudience: 'region',
      status: 'sent',
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      recipients: 5234,
      regions: ['Pune', 'Kothrud', 'Shivajinagar'],
      createdBy: 'Admin',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '2',
      title: 'System Maintenance',
      message: 'Emergency services will be temporarily unavailable for maintenance from 2AM to 4AM.',
      type: 'maintenance',
      targetAudience: 'all',
      status: 'scheduled',
      scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      recipients: 0,
      createdBy: 'Admin',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '3',
      title: 'Safety Update',
      message: 'New safety features have been added to the app including improved emergency alerts.',
      type: 'info',
      targetAudience: 'all',
      status: 'sent',
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      recipients: 12456,
      createdBy: 'Admin',
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    }
  ];
}

const AdminBroadcastPage = () => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(createMockBroadcasts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Form state for new broadcast
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    type: 'info' as Broadcast['type'],
    targetAudience: 'all' as Broadcast['targetAudience'],
    regions: [] as string[]
  });

  const handleSendBroadcast = () => {
    if (!newBroadcast.title || !newBroadcast.message) return;
    
    const broadcast: Broadcast = {
      _id: Date.now().toString(),
      ...newBroadcast,
      status: 'sent',
      sentAt: new Date().toISOString(),
      recipients: 15000, // Mock recipient count
      createdBy: 'Admin',
      createdAt: new Date().toISOString()
    };
    
    setBroadcasts(prev => [broadcast, ...prev]);
    setNewBroadcast({
      title: '',
      message: '',
      type: 'info',
      targetAudience: 'all',
      regions: []
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

  const filteredBroadcasts = broadcasts.filter(broadcast => {
    const matchesSearch = broadcast.title.toLowerCase().includes(search.toLowerCase()) ||
                         broadcast.message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || broadcast.status === statusFilter;
    const matchesType = typeFilter === 'all' || broadcast.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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
          <DashboardCard title="Total Sent" icon={<Send className="h-5 w-5 text-blue-500" />}>
            <div className="text-2xl font-bold">
              {broadcasts.filter(b => b.status === 'sent').length}
            </div>
            <p className="text-xs text-muted-foreground">Broadcasts sent</p>
          </DashboardCard>
          
          <DashboardCard title="Scheduled" icon={<Calendar className="h-5 w-5 text-orange-500" />}>
            <div className="text-2xl font-bold">
              {broadcasts.filter(b => b.status === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">Pending broadcasts</p>
          </DashboardCard>
          
          <DashboardCard title="Total Recipients" icon={<Users className="h-5 w-5 text-green-500" />}>
            <div className="text-2xl font-bold">
              {broadcasts.reduce((sum, b) => sum + b.recipients, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Users reached</p>
          </DashboardCard>
          
          <DashboardCard title="Emergency Alerts" icon={<Bell className="h-5 w-5 text-red-500" />}>
            <div className="text-2xl font-bold">
              {broadcasts.filter(b => b.type === 'emergency').length}
            </div>
            <p className="text-xs text-muted-foreground">Critical broadcasts</p>
          </DashboardCard>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Target Audience</label>
                <Select
                  value={newBroadcast.targetAudience}
                  onValueChange={(value) =>
                    setNewBroadcast(prev => ({ ...prev, targetAudience: value as Broadcast['targetAudience'] }))
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
              <div className="flex items-end">
                <Button 
                  onClick={handleSendBroadcast}
                  disabled={!newBroadcast.title || !newBroadcast.message}
                  className="w-full flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Broadcast
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
            {filteredBroadcasts.map((broadcast) => (
              <div key={broadcast._id} className="border border-border rounded-lg p-4 space-y-3">
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
                    <p className="text-sm text-muted-foreground mb-2">{broadcast.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {broadcast.recipients.toLocaleString()} recipients
                      </span>
                      {broadcast.regions && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {broadcast.regions.join(', ')}
                        </span>
                      )}
                      <span>
                        {broadcast.sentAt ? `Sent ${new Date(broadcast.sentAt).toLocaleString()}` : 
                         broadcast.scheduledFor ? `Scheduled for ${new Date(broadcast.scheduledFor).toLocaleString()}` :
                         `Created ${new Date(broadcast.createdAt).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminBroadcastPage;
