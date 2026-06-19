import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Radar, AlertTriangle, Radio, Users, BarChart3, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { title: "Live Tracking", icon: Radar, path: "/dashboard/admin" },
  { title: "Incident Management", icon: AlertTriangle, path: "/dashboard/admin/incidents" },
  { title: "Broadcast", icon: Radio, path: "/dashboard/admin/broadcast" },
  { title: "Users", icon: Users, path: "/dashboard/admin/users" },
  { title: "Analytics", icon: BarChart3, path: "/dashboard/admin/analytics" },
];

export function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name: string) => {
    if (!name) return "A";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

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

        <div className="px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Admin Panel</span>
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

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b border-border bg-background/80 backdrop-blur-md">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold border border-accent/20 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                {getInitials(user?.name || "Admin")}
              </button>
              
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setProfileOpen(false)} />
                  <div className="fixed right-4 top-[72px] w-72 rounded-xl border border-border bg-background shadow-2xl z-[9999] animate-in slide-in-from-top-2 fade-in overflow-hidden">
                    <div className="px-5 py-4 bg-muted/30 border-b border-border">
                      <p className="text-base font-semibold leading-none text-foreground">{user?.name || "Admin User"}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 truncate">{user?.email || "admin@safeyatra.com"}</p>
                      <div className="mt-2.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-accent/10 text-accent border-accent/20">
                        {user?.role || "Admin"}
                      </div>
                    </div>
                    <div className="p-2 border-t border-border bg-muted/10">
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-left rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
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
