import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllIncidents, getAdminUsers, type Incident } from '@/services/api';

// Dynamic Synthetic Generation to avoid huge static arrays
const generateSyntheticUsers = (count: number) => {
  const indianFirstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikas', 'Neha', 'Sanjay', 'Pooja', 'Raj', 'Anjali'];
  const indianLastNames = ['Sharma', 'Patil', 'Desai', 'Joshi', 'Kadam', 'Gupta', 'Mane', 'Kulkarni', 'Jadhav', 'Bhosale'];
  const foreignNames = ['John Smith', 'Emma Watson', 'Michael Brown', 'Sarah Davis', 'David Wilson'];
  
  const users = [];
  for (let i = 0; i < count; i++) {
    const isForeign = i < 8; // Keep foreign names low
    let name = '';
    if (isForeign) {
      name = foreignNames[i % foreignNames.length];
    } else {
      name = `${indianFirstNames[i % indianFirstNames.length]} ${indianLastNames[(i + 3) % indianLastNames.length]}`;
    }
    
    users.push({
      _id: `U-SYN-${1000 + i}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      role: 'user',
      status: i % 15 === 0 ? 'suspended' : 'active',
      created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString()
    });
  }
  return users;
};

const generateSyntheticIncidents = (count: number) => {
  const types = ['Medical Emergency', 'Theft/Loss', 'Harassment', 'Lost Person', 'Suspicious Activity', 'Scam', 'General'];
  const locations = [
    { lat: 18.5263, lng: 73.8441, desc: 'FC Road' },
    { lat: 18.5018, lng: 73.8636, desc: 'Swargate' },
    { lat: 18.5289, lng: 73.8744, desc: 'Pune Station' },
    { lat: 18.5195, lng: 73.8553, desc: 'Shaniwar Wada' },
    { lat: 18.5362, lng: 73.8939, desc: 'Koregaon Park' },
    { lat: 18.5590, lng: 73.7868, desc: 'Baner' },
    { lat: 18.5074, lng: 73.8077, desc: 'Kothrud' }
  ];
  
  const incidents = [];
  for (let i = 0; i < count; i++) {
    const loc = locations[i % locations.length];
    const type = types[i % types.length];
    const isCritical = i % 12 === 0;
    const isHigh = i % 7 === 0;
    const severity = isCritical ? 'critical' : isHigh ? 'high' : (i % 3 === 0 ? 'medium' : 'low');
    const status = i % 4 === 0 ? 'resolved' : (i % 3 === 0 ? 'investigating' : 'pending');
    
    incidents.push({
      _id: `SYN-INC-${1000 + i}`,
      type,
      category: type === 'Medical Emergency' ? 'Medical' : type === 'Theft/Loss' ? 'Theft' : type,
      description: `${type} reported near ${loc.desc}`,
      severity,
      status,
      latitude: loc.lat + (Math.random() - 0.5) * 0.01,
      longitude: loc.lng + (Math.random() - 0.5) * 0.01,
      created_at: new Date(Date.now() - Math.random() * 5000000000).toISOString(),
      user: { name: `Tourist ${i+1}`, email: `tourist${i+1}@example.com` }
    });
  }
  return incidents;
};

// Initialized outside component to keep references stable
const SYNTHETIC_USERS_BASE = generateSyntheticUsers(130);
const SYNTHETIC_INCIDENTS_BASE = generateSyntheticIncidents(75);

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
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const isAdmin = user?.role === 'admin';

        const promises: Promise<any>[] = [getAllIncidents().catch(() => ({ data: [] }))];
        if (isAdmin) {
          promises.push(getAdminUsers().catch(() => ({ data: [] })));
        } else {
          promises.push(Promise.resolve({ data: [] }));
        }

        const [incRes, usersRes] = await Promise.all(promises);
        
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
    // 1. INCIDENTS (Real first, then synthetic)
    const overrideIncidents = getStorage('op_incidents', {});
    const localCreatedIncidents = getStorage('op_created_incidents', []);
    
    // Deduplicate and merge: prefer real, then local, then synthetic
    const rawAllIncidents = [...realIncidents, ...localCreatedIncidents, ...SYNTHETIC_INCIDENTS_BASE];
    const uniqueIncidentsMap = new Map();
    rawAllIncidents.forEach(inc => {
      if (!uniqueIncidentsMap.has(inc._id)) {
        uniqueIncidentsMap.set(inc._id, inc);
      }
    });

    const allIncidents = Array.from(uniqueIncidentsMap.values()).map((inc: any) => {
      const overrides = overrideIncidents[inc._id] || {};
      return { ...inc, ...overrides };
    });

    const mergedIncidents = allIncidents.filter(inc => !inc.deleted);
    const deletedIncidents = allIncidents.filter(inc => inc.deleted);

    // 2. USERS (Real first, then synthetic)
    const overrideUsers = getStorage('op_users', {});
    const localCreatedUsers = getStorage('op_created_users', []);

    const allUsers = [...realUsers, ...localCreatedUsers, ...SYNTHETIC_USERS_BASE].map((usr: any) => {
      const overrides = overrideUsers[usr._id] || {};
      return { ...usr, ...overrides };
    });
    
    const mergedUsers = allUsers.filter(usr => !usr.deleted);
    const deletedUsers = allUsers.filter(usr => usr.deleted);

    // 3. BROADCASTS
    const broadcasts = getStorage('op_broadcasts', [
      { id: 'B-1', title: 'Pune Metro Service Disruption', message: 'Metro services delayed by 30 mins.', severity: 'medium', status: 'sent', scheduledFor: '', recipients: mergedUsers.length, timestamp: Date.now() - 86400000 },
      { id: 'B-2', title: 'Heavy Rain Alert', message: 'Avoid low lying areas near Mutha river.', severity: 'high', status: 'sent', scheduledFor: '', recipients: mergedUsers.length, timestamp: Date.now() - 3600000 }
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

    // 4. DERIVED ANALYTICS (Exact array matches to prevent count mismatch)
    const totalUsersCount = mergedUsers.length;
    const totalIncidentsCount = mergedIncidents.length;
    const criticalIncidentsCount = mergedIncidents.filter(i => i.severity === 'critical').length;
    const resolvedCount = mergedIncidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
    const pendingCount = mergedIncidents.filter(i => i.status === 'pending' || i.status === 'reported' || i.status === 'investigating').length;
    const highCount = mergedIncidents.filter(i => i.severity === 'high').length;

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
        active_users: Math.floor(totalUsersCount * 0.9), // simulate active
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

  const createLocalIncident = useCallback((incident: any) => {
    const localIncidents = getStorage('op_created_incidents', []);
    // Prevent duplicate injection if it already exists (e.g., from DB after reload)
    if (!localIncidents.find((i: any) => i._id === incident._id)) {
      localIncidents.unshift({ 
        ...incident, 
        _id: incident._id || `INC-LOC-${Date.now()}`,
        status: incident.status || 'pending',
        created_at: incident.created_at || new Date().toISOString()
      });
      setStorage('op_created_incidents', localIncidents);
      notifyListeners();
    }
  }, []);

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
    createLocalIncident,
    updateUserOp,
    deleteUserOp,
    createLocalUser,
    saveBroadcastOp,
    deleteBroadcastOp
  };
}
