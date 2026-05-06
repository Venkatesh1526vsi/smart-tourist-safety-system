import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notifySuccess, notifyInfo } from "@/utils/notify";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Users, Radio, AlertTriangle } from "lucide-react";
import { type Incident } from "@/services/api";

// 1. Live Tracking Modal
export const LiveTrackingModal = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Live User Tracking</DialogTitle>
          <DialogDescription>Monitor active users and tourists in risk zones.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 border rounded-lg bg-emerald-500/10 border-emerald-500/20">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Safe Users</p>
              <p className="text-2xl font-bold">1,204</p>
            </div>
            <div className="p-4 border rounded-lg bg-amber-500/10 border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">In Risk Zones</p>
              <p className="text-2xl font-bold">40</p>
            </div>
            <div className="p-4 border rounded-lg bg-red-500/10 border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Active SOS</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Input placeholder="Search users..." className="max-w-sm" />
            <Button variant="outline" onClick={() => notifySuccess("User list exported to CSV")}>Export CSV</Button>
          </div>
          <div className="border rounded-md overflow-hidden">
             <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr><th className="p-2 text-left">User</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Location</th></tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="p-2">John Doe</td><td className="p-2"><Badge variant="destructive">SOS Active</Badge></td><td className="p-2">Koregaon Park</td></tr>
                  <tr className="border-t"><td className="p-2">Jane Smith</td><td className="p-2"><Badge variant="outline" className="text-amber-500 border-amber-500">Risk Zone</Badge></td><td className="p-2">FC Road</td></tr>
                  <tr className="border-t"><td className="p-2">Alice Johnson</td><td className="p-2"><Badge variant="outline" className="text-emerald-500 border-emerald-500">Safe</Badge></td><td className="p-2">Viman Nagar</td></tr>
                </tbody>
             </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 2. Incident Review Modal
export const IncidentReviewModal = ({ open, onOpenChange, incidents, onUpdate }: { open: boolean, onOpenChange: (open: boolean) => void, incidents: Incident[], onUpdate: () => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Incident Review</DialogTitle>
          <DialogDescription>Manage and resolve active incidents.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {incidents.filter(i => i.status !== 'resolved').length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">No active incidents to review.</div>
          ) : incidents.filter(i => i.status !== 'resolved').map(incident => (
            <div key={incident._id} className="p-4 border rounded-lg flex justify-between items-center gap-4">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                   <Badge variant={incident.severity === 'critical' ? 'destructive' : 'default'}>{incident.severity}</Badge>
                   <span className="font-medium capitalize">{incident.type}</span>
                 </div>
                 <p className="text-sm text-muted-foreground">{incident.description || "No description provided."}</p>
                 <p className="text-xs text-muted-foreground mt-1">{new Date(incident.created_at || Date.now()).toLocaleString()}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                 <Button size="sm" onClick={() => { notifySuccess(`Incident ${incident._id} marked as resolved`); onUpdate(); }}>Mark Resolved</Button>
                 <Button size="sm" variant="outline" onClick={() => notifyInfo("Incident escalated to emergency services.")}>Escalate</Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 3. Broadcast Center Modal
export const BroadcastModal = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [isSending, setIsSending] = useState(false);
  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      onOpenChange(false);
      notifySuccess("Broadcast message sent successfully to all users in the region.");
    }, 1000);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Radio className="h-5 w-5" /> Broadcast Center</DialogTitle>
          <DialogDescription>Send mass alerts to tourists in specific regions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Broadcast Title</Label>
            <Input placeholder="e.g., Heavy Rainfall Warning" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea placeholder="Please seek shelter and avoid low-lying areas..." rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value="warning">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Region</Label>
              <Select value="all">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="north">North Zone</SelectItem>
                  <SelectItem value="south">South Zone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={handleSend} disabled={isSending}>
            {isSending ? "Sending..." : "Send Broadcast"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 4. User Management Modal
export const UserManagementModal = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> User Management</DialogTitle>
          <DialogDescription>Manage registered tourists and admin accounts.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Input placeholder="Search users by name or email..." className="max-w-sm" />
            <Select value="all">
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="tourist">Tourist</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-md overflow-hidden max-h-[50vh] overflow-y-auto">
             <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Role</th><th className="p-2 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="p-2 font-medium">John Doe</td><td className="p-2">john@example.com</td><td className="p-2"><Badge variant="outline">Tourist</Badge></td><td className="p-2 text-right"><Button size="sm" variant="outline" onClick={() => notifyInfo("User suspended")}>Suspend</Button></td></tr>
                  <tr className="border-t"><td className="p-2 font-medium">Admin User</td><td className="p-2">admin@safeyatra.com</td><td className="p-2"><Badge variant="default">Admin</Badge></td><td className="p-2 text-right"><Button size="sm" variant="outline" disabled>Suspend</Button></td></tr>
                </tbody>
             </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 5. Safety Alert Modal
export const SafetyAlertModal = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [isSending, setIsSending] = useState(false);
  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      onOpenChange(false);
      notifySuccess("Emergency safety alert dispatched successfully!");
    }, 1500);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500"><ShieldAlert className="h-6 w-6" /> Send Emergency Safety Alert</DialogTitle>
          <DialogDescription>Warning: This will trigger push notifications and SMS alerts to all users in the affected zone.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Alert Title</Label>
            <Input placeholder="CRITICAL: Evacuate immediately" className="border-red-200 focus-visible:ring-red-500" />
          </div>
          <div className="space-y-2">
            <Label>Detailed Instructions</Label>
            <Textarea placeholder="Please follow local authorities' instructions..." className="border-red-200 focus-visible:ring-red-500" rows={4} />
          </div>
          <Button variant="destructive" className="w-full text-lg h-12 font-bold" onClick={handleSend} disabled={isSending}>
            {isSending ? "DISPATCHING ALERT..." : "DISPATCH EMERGENCY ALERT NOW"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
