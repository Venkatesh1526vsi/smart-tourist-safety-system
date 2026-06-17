import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LayoutDashboard, Map, AlertTriangle, Bell, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/hooks/useNotificationStore";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Overview", icon: LayoutDashboard, path: "/dashboard/user" },
  { title: "Map", icon: Map, path: "/dashboard/user/map" },
  { title: "Incidents", icon: AlertTriangle, path: "/dashboard/user/incidents" },
  { title: "Notifications", icon: Bell, path: "/dashboard/user/notifications" },
  { title: "Settings", icon: Settings, path: "/dashboard/user/settings" },
];

export function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  console.log(`[UserDashboardLayout] Rendering. Path: ${window.location.pathname}`);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotificationStore();
  const { logout, user, token } = useAuth();
  
  console.log(`[UserDashboardLayout] useAuth state - user: ${user ? 'exists' : 'null'}, token: ${token ? 'exists' : 'null'}`);
  
  const handleLogout = () => {
    console.log('[UserDashboardLayout] handleLogout called');
    logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed z-50 md:sticky top-0 left-0 h-screen w-64 flex flex-col border-r border-border bg-card transition-transform duration-300 md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Logo />
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
                {item.title === "Notifications" && unreadCount > 0 && (
                  <Badge className="ml-auto h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5 py-0">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b border-border bg-background/80 backdrop-blur-md">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold border border-primary/30 transition-transform hover:scale-105 active:scale-95"
              >
                {getInitials(user?.name || "User")}
              </button>
              
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-popover text-popover-foreground shadow-md z-50 animate-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email || "No email"}</p>
                      <p className="text-[10px] uppercase font-bold text-primary mt-1.5">{user?.role || "Tourist"}</p>
                    </div>
                    <div className="p-1">
                      <Link to="/dashboard/user/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-sm hover:bg-muted transition-colors">
                        <Settings className="h-4 w-4" /> My Profile
                      </Link>
                      <Link to="/dashboard/user/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-sm hover:bg-muted transition-colors">
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                      <div className="px-3 py-2 text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-primary/20" /> Theme</span>
                        <div onClick={(e) => e.stopPropagation()}><ThemeToggle /></div>
                      </div>
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-sm hover:bg-muted text-destructive transition-colors">
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
