import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import PageLoader from "@/components/PageLoader";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Eagerly load critical pages (landing, auth)
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import ReportIncident from "@/pages/ReportIncident";
import IncidentHistoryPage from "@/pages/IncidentHistoryPage";
import SettingsPage from "@/pages/SettingsPage";

// Lazy load heavy dashboard pages
const UserDashboard = lazy(() => import("@/pages/UserDashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminUsersPage = lazy(() => import("@/pages/AdminUsersPage"));
const AdminIncidentsPage = lazy(() => import("@/pages/AdminIncidentsPage"));
const AdminBroadcastPage = lazy(() => import("@/pages/AdminBroadcastPage"));
const AdminAnalyticsPage = lazy(() => import("@/pages/AdminAnalyticsPage"));
const MapPage = lazy(() => import("@/pages/MapPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));

// Protected lazy route wrapper
const ProtectedLazyRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </ProtectedRoute>
);

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Critical pages - eagerly loaded */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* TASK 6: Explicit dashboard routes */}
          <Route 
            path="/user-dashboard" 
            element={<ProtectedLazyRoute><UserDashboard /></ProtectedLazyRoute>} 
          />
          <Route 
            path="/admin-dashboard" 
            element={<ProtectedLazyRoute><AdminDashboard /></ProtectedLazyRoute>} 
          />
          
          {/* Settings page - specific route must come before catch-all */}
          <Route 
            path="/dashboard/user/settings" 
            element={<ProtectedLazyRoute><SettingsPage /></ProtectedLazyRoute>} 
          />
          
          {/* Incident history page */}
          <Route 
            path="/dashboard/user/incidents" 
            element={<ProtectedLazyRoute><IncidentHistoryPage /></ProtectedLazyRoute>} 
          />
          
          {/* Dashboard pages - protected and lazy loaded */}
          <Route 
            path="/dashboard/user" 
            element={<ProtectedLazyRoute><UserDashboard /></ProtectedLazyRoute>} 
          />
          <Route 
            path="/dashboard/user/map" 
            element={<ProtectedLazyRoute><MapPage /></ProtectedLazyRoute>} 
          />
          <Route 
            path="/dashboard/user/notifications" 
            element={<ProtectedLazyRoute><NotificationsPage /></ProtectedLazyRoute>} 
          />
          <Route 
            path="/dashboard/user/*" 
            element={<ProtectedLazyRoute><UserDashboard /></ProtectedLazyRoute>} 
          />
          
          {/* Admin pages - specific routes must come before catch-all */}
          <Route 
            path="/dashboard/admin" 
            element={<ProtectedLazyRoute><AdminDashboard /></ProtectedLazyRoute>} 
          />
          <Route 
            path="/dashboard/admin/users" 
            element={<ProtectedLazyRoute><AdminUsersPage /></ProtectedLazyRoute>} 
          />
          <Route 
            path="/dashboard/admin/incidents" 
            element={<ProtectedLazyRoute><AdminIncidentsPage /></ProtectedLazyRoute>} 
          />
          <Route 
            path="/dashboard/admin/broadcast" 
            element={<ProtectedLazyRoute><AdminBroadcastPage /></ProtectedLazyRoute>} 
          />
          <Route 
            path="/dashboard/admin/analytics" 
            element={<ProtectedLazyRoute><AdminAnalyticsPage /></ProtectedLazyRoute>} 
          />
          <Route 
            path="/dashboard/admin/*" 
            element={<ProtectedLazyRoute><AdminDashboard /></ProtectedLazyRoute>} 
          />
          
          {/* Incident reporting page */}
          <Route 
            path="/report-incident" 
            element={<ProtectedLazyRoute><ReportIncident /></ProtectedLazyRoute>} 
          />
          
          {/* 404 - eagerly loaded */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
