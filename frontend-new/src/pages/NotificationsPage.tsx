import { useState } from "react";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { useNotificationStore } from "@/hooks/useNotificationStore";
import type { NotificationType } from "@/hooks/useNotificationStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const typeConfig: Record<NotificationType, { icon: typeof Info; label: string; badgeClass: string }> = {
  info: { icon: Info, label: "Info", badgeClass: "bg-secondary/15 text-secondary border-secondary/30" },
  warning: { icon: AlertTriangle, label: "Warning", badgeClass: "bg-accent/15 text-accent border-accent/30" },
  emergency: { icon: AlertOctagon, label: "Emergency", badgeClass: "bg-destructive/15 text-destructive border-destructive/30" },
};

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const [filter, setFilter] = useState<"all" | NotificationType>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filtered = notifications.filter((n) => {
    if (filter !== "all" && n.type !== filter) return false;
    if (showUnreadOnly && n.read) return false;
    return true;
  });

  return (
    <UserDashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" /> Notifications
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Stay updated with alerts and advisories</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant={showUnreadOnly ? "default" : "outline"} onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
              {showUnreadOnly ? "Show All" : "Unread Only"}
            </Button>

            <Select value={filter} onValueChange={(v: string) => setFilter(v as "all" | NotificationType)}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" /> Read All
            </Button>

            <Button size="sm" variant="outline" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No notifications to show</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((n) => {
                const cfg = typeConfig[n.type];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer transition-colors glow-hover",
                        !n.read && "border-l-4 border-l-primary"
                      )}
                      onClick={() => markAsRead(n.id)}
                    >
                      <CardContent className="flex items-start gap-3 py-3 px-4">
                        <div className={cn("mt-0.5 flex items-center justify-center w-8 h-8 rounded-full shrink-0", cfg.badgeClass)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm">{n.title}</span>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", cfg.badgeClass)}>
                              {cfg.label}
                            </Badge>
                            {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-muted-foreground text-xs">{n.message}</p>
                          <p className="text-muted-foreground/60 text-[10px] mt-1">
                            {n.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default NotificationsPage;
