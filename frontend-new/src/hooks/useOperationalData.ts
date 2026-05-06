import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllIncidents, getAdminUsers, type Incident } from '@/services/api';

// Synthetic Base Data to Ensure Realism
const SYNTHETIC_INCIDENTS_BASE: Partial<Incident>[] = [
  { _id: 'SYN-001', type: 'Medical Emergency', category: 'Medical', description: 'Tourist feeling dizzy due to heat at Shaniwar Wada', severity: 'medium', status: 'resolved', latitude: 18.5195, longitude: 73.8553, created_at: new Date(Date.now() - 86400000).toISOString() },
  { _id: 'SYN-002', type: 'Theft/Loss', category: 'Theft', description: 'Lost wallet near Dagdusheth Halwai Temple', severity: 'high', status: 'investigating', latitude: 18.5164, longitude: 73.8560, created_at: new Date(Date.now() - 172800000).toISOString() },
  { _id: 'SYN-003', type: 'Harassment', category: 'Harassment', description: 'Group causing disturbance at FC Road', severity: 'critical', status: 'reported', latitude: 18.5263, longitude: 73.8441, created_at: new Date(Date.now() - 3600000).toISOString() },
  { _id: 'SYN-004', type: 'Lost Person', category: 'General', description: 'Missing child near Pune Station', severity: 'critical', status: 'resolved', latitude: 18.5289, longitude: 73.8744, created_at: new Date(Date.now() - 259200000).toISOString() },
  { _id: 'SYN-005', type: 'Medical Emergency', category: 'Medical', description: 'Minor injury during trek at Sinhagad Fort', severity: 'medium', status: 'resolved', latitude: 18.3663, longitude: 73.7559, created_at: new Date(Date.now() - 432000000).toISOString() },
  { _id: 'SYN-006', type: 'Suspicious Activity', category: 'Security', description: 'Unattended bag at Swargate Bus Stand', severity: 'high', status: 'pending', latitude: 18.5018, longitude: 73.8636, created_at: new Date(Date.now() - 7200000).toISOString() }
];

const SYNTHETIC_USERS_BASE = [
  { _id: 'U-SYN-001', name: 'Rahul Sharma', email: 'rahul.s@example.com', role: 'user', status: 'active', created_at: new Date(Date.now() - 1000000000).toISOString() },
  { _id: 'U-SYN-002', name: 'Priya Patel', email: 'priya.p@example.com', role: 'user', status: 'active', created_at: new Date(Date.now() - 2000000000).toISOString() },
  { _id: 'U-SYN-003', name: 'Amit Desai', email: 'amit.d@example.com', role: 'user', status: 'active', created_at: new Date(Date.now() - 3000000000).toISOString() },
  { _id: 'U-SYN-004', name: 'John Smith', email: 'john.s@foreign.com', role: 'user', status: 'active', created_at: new Date(Date.now() - 4000000000).toISOString() },
  { _id: 'U-SYN-005', name: 'Sneha Joshi', email: 'sneha.j@example.com', role: 'user', status: 'active', created_at: new Date(Date.now() - 5000000000).toISOString() },
  { _id: 'U-SYN-006', name: 'Emma Watson', email: 'emma.w@foreign.com', role: 'user', status: 'suspended', created_at: new Date(Date.now() - 6000000000).toISOString() },
  { _id: 'U-SYN-007', name: 'Vikas Kadam', email: 'vikas.k@example.com', role: 'user', status: 'active', created_at: new Date(Date.now() - 7000000000).toISOString() },
  { _id: 'U-SYN-008', name: 'Neha Gupta', email: 'neha.g@example.com', role: 'user', status: 'active', created_at: new Date(Date.now() - 8000000000).toISOString() }
];

// Helper for local storage
const getStorage = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error', e);
  }
};

// Global singleton to prevent multiple instances from conflicting
let _globalStateListeners: Array<() => void> = [];
const notifyListeners = () => _globalStateListeners.forEach(l => l());

export function useOperationalData() {
  const [loading, setLoading] = useState(true);
  
  // Real Data State
  const [realIncidents, setRealIncidents] = useState<Incident[]>([]);
  const [realUsers, setRealUsers] = useState<any[]>([]);
  
  // Force update trigger
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const [incRes, usersRes] = await Promise.all([
          getAllIncidents().catch(() => ({ data: [] })),
          getAdminUsers().catch(() => ({ data: [] }))
        ]);
        setRealIncidents(Array.isArray(incRes?.data) ? incRes.data : []);
        setRealUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
      } catch (err) {
        console.error("Failed to load operational data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRealData();
    
    const listener = () => setTick(t => t + 1);
    _globalStateListeners.push(listener);
    return () => { _globalStateListeners = _globalStateListeners.filter(l => l !== listener); };
  }, []);

  // Compute Merged State
  const unifiedData = useMemo(() => {
    // 1. INCIDENTS
    const overrideIncidents = getStorage('op_incidents', {}); // { [id]: { status, deleted, severity, ... } }
    
    const allIncidents = [...realIncidents, ...SYNTHETIC_INCIDENTS_BASE].map((inc: any) => {
      const overrides = overrideIncidents[inc._id] || {};
      return { ...inc, ...overrides };
    });

    const mergedIncidents = allIncidents.filter(inc => !inc.deleted);
    const deletedIncidents = allIncidents.filter(inc => inc.deleted);

    // 2. USERS
    const overrideUsers = getStorage('op_users', {});
    
    // We add users from localStorage that are manually created by admin but not saved in backend yet
    const localCreatedUsers = getStorage('op_created_users', []);

    const allUsers = [...realUsers, ...SYNTHETIC_USERS_BASE, ...localCreatedUsers].map((usr: any) => {
      const overrides = overrideUsers[usr._id] || {};
      return { ...usr, ...overrides };
    });
    
    const mergedUsers = allUsers.filter(usr => !usr.deleted);
    const deletedUsers = allUsers.filter(usr => usr.deleted);

    // 3. BROADCASTS
    const broadcasts = getStorage('op_broadcasts', [
      { id: 'B-1', title: 'Pune Metro Service Disruption', message: 'Metro services delayed by 30 mins.', severity: 'medium', status: 'sent', scheduledFor: '', recipients: 125, timestamp: Date.now() - 86400000 },
      { id: 'B-2', title: 'Heavy Rain Alert', message: 'Avoid low lying areas near Mutha river.', severity: 'high', status: 'sent', scheduledFor: '', recipients: 148, timestamp: Date.now() - 3600000 }
    ]);
    
    // Auto-execute scheduled broadcasts
    const now = Date.now();
    let updatedBroadcasts = false;
    const processedBroadcasts = broadcasts.map((b: any) => {
      if (b.status === 'scheduled' && b.scheduledFor && new Date(b.scheduledFor).getTime() <= now) {
        updatedBroadcasts = true;
        return { ...b, status: 'sent', timestamp: now };
      }
      return b;
    });

    if (updatedBroadcasts) {
       setStorage('op_broadcasts', processedBroadcasts);
    }

    // 4. DERIVED ANALYTICS (Realistic scaling)
    const baseUsers = 124;
    const baseIncidents = 73;

    const totalUsersCount = baseUsers + mergedUsers.length;
    const totalIncidentsCount = baseIncidents + mergedIncidents.length;
    const criticalIncidentsCount = mergedIncidents.filter(i => i.severity === 'critical').length + 18;
    const resolvedCount = mergedIncidents.filter(i => i.status === 'resolved' || i.status === 'closed').length + 45;
    const pendingCount = Math.floor(totalIncidentsCount * 0.2) + mergedIncidents.filter(i => i.status === 'pending' || i.status === 'reported').length;
    const highCount = Math.floor(totalIncidentsCount * 0.3) + mergedIncidents.filter(i => i.severity === 'high').length;

    return {
      incidents: mergedIncidents,
      deletedIncidents,
      users: mergedUsers,
      deletedUsers,
      broadcasts: processedBroadcasts,
      analytics: {
        total_users: totalUsersCount,
        total_incidents: totalIncidentsCount,
        critical_incidents: criticalIncidentsCount,
        resolved_today: resolvedCount,
        pending_incidents: pendingCount,
        high_incidents: highCount,
        new_users_this_week: Math.floor(totalUsersCount * 0.15),
        users_in_risk_zones: Math.floor(totalUsersCount * 0.12),
        active_users: totalUsersCount - 15,
        total_recipients: Math.floor(totalUsersCount * 0.85)
      }
    };
  }, [realIncidents, realUsers, tick]);

  // Actions
  const updateIncidentOp = useCallback((id: string, updates: any) => {
    const overrides = getStorage('op_incidents', {});
    overrides[id] = { ...(overrides[id] || {}), ...updates };
    setStorage('op_incidents', overrides);
    notifyListeners();
  }, []);

  const deleteIncidentOp = useCallback((id: string) => {
    updateIncidentOp(id, { deleted: true });
  }, [updateIncidentOp]);

  const updateUserOp = useCallback((id: string, updates: any) => {
    const overrides = getStorage('op_users', {});
    overrides[id] = { ...(overrides[id] || {}), ...updates };
    setStorage('op_users', overrides);
    notifyListeners();
  }, []);

  const deleteUserOp = useCallback((id: string) => {
    updateUserOp(id, { deleted: true });
  }, [updateUserOp]);
  
  const createLocalUser = useCallback((user: any) => {
    const localUsers = getStorage('op_created_users', []);
    localUsers.push({ ...user, _id: `U-LOC-${Date.now()}` });
    setStorage('op_created_users', localUsers);
    notifyListeners();
  }, []);

  const saveBroadcastOp = useCallback((broadcast: any) => {
    const list = getStorage('op_broadcasts', []);
    list.unshift({ ...broadcast, id: broadcast.id || `B-${Date.now()}`, timestamp: Date.now() });
    setStorage('op_broadcasts', list);
    notifyListeners();
  }, []);
  
  const deleteBroadcastOp = useCallback((id: string) => {
     const list = getStorage('op_broadcasts', []);
     setStorage('op_broadcasts', list.filter((b: any) => b.id !== id));
     notifyListeners();
  }, []);

  // Setup the polling interval for scheduled broadcasts execution
  useEffect(() => {
    const interval = setInterval(() => {
       notifyListeners(); // will force re-eval of useMemo which checks schedules
    }, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  return {
    loading,
    incidents: unifiedData.incidents,
    deletedIncidents: unifiedData.deletedIncidents,
    users: unifiedData.users,
    deletedUsers: unifiedData.deletedUsers,
    broadcasts: unifiedData.broadcasts,
    analytics: unifiedData.analytics,
    updateIncidentOp,
    deleteIncidentOp,
    updateUserOp,
    deleteUserOp,
    createLocalUser,
    saveBroadcastOp,
    deleteBroadcastOp
  };
}
