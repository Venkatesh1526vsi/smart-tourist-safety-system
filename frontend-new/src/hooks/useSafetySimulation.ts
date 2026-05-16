import { useEffect, useRef } from "react";
import { addNotification, type NotificationType } from "./useNotificationStore";
import { useOperationalData } from "./useOperationalData";
import { notifyWarning } from "@/utils/notify";

export function useSafetySimulation(enabled = true) {
  const { incidents, broadcasts } = useOperationalData();
  const processedIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Wait a brief moment to allow initial operational data to load,
    // so we don't treat existing data as "new" alerts if we just mounted.
    if (!initialLoadDone.current) {
      if (incidents.length > 0 || broadcasts.length > 0) {
        incidents.forEach(i => processedIds.current.add(i._id));
        broadcasts.forEach((b: any) => processedIds.current.add(b.id));
        initialLoadDone.current = true;
        
        // Push a couple of contextual environmental/route advisories silently on mount to populate the feed
        // This ensures the feed isn't completely empty, providing immediate operational realism
        addNotification("info", "Environmental Intelligence", "Clear skies in your route. Night travel caution advised after 10 PM.");
        addNotification("info", "Route Advisory", "Normal traffic flow detected near your designated zone.");
      }
      return;
    }

    // Process Broadcasts (Operational Updates)
    broadcasts.forEach((b: any) => {
      if (!processedIds.current.has(b.id)) {
        processedIds.current.add(b.id);
        
        const type: NotificationType = b.severity === 'high' ? 'warning' : 'info';
        
        // Add to feed silently
        addNotification(type, `System Advisory: ${b.title}`, b.message);

        // Toast ONLY if it's very recent and severe
        const isRecent = Date.now() - b.timestamp < 3 * 60 * 1000;
        if (b.severity === 'high' && isRecent) {
           notifyWarning(`Advisory: ${b.title}`);
        }
      }
    });

    // Process Incidents (Safety Intelligence)
    // Only care about active threats
    const activeThreats = incidents.filter(i => 
      !i.deleted && 
      i.status !== 'resolved' && i.status !== 'closed'
    );

    activeThreats.forEach((inc: any) => {
      if (!processedIds.current.has(inc._id)) {
        processedIds.current.add(inc._id);

        const isCritical = inc.severity === 'critical';
        const type: NotificationType = isCritical ? 'emergency' : (inc.severity === 'high' ? 'warning' : 'info');
        
        // Only notify for high/critical to avoid feed spam
        if (inc.severity === 'high' || inc.severity === 'critical') {
            const locString = inc.location || inc.description?.split('near')?.[1] || 'in your vicinity';
            const msg = `${inc.type} warning reported ${locString.trim()}. Please stay vigilant.`;
            
            addNotification(type, `Safety Intelligence`, msg);

            // Toast ONLY if critical and recent
            const isRecent = new Date(inc.created_at).getTime() > Date.now() - 5 * 60 * 1000;
            if (isCritical && isRecent) {
              notifyWarning(`CRITICAL: ${inc.type} reported nearby!`);
            }
        }
      }
    });
    
    // Process Resolved Incidents (Operational Updates)
    const newlyResolved = incidents.filter(i => 
      (i.status === 'resolved' || i.status === 'closed') && 
      !processedIds.current.has(i._id + '_resolved')
    );

    newlyResolved.forEach(inc => {
       processedIds.current.add(inc._id + '_resolved');
       addNotification('info', 'Operational Update', `An earlier ${inc.type} issue nearby has been resolved. Area normalized.`);
    });

  }, [enabled, incidents, broadcasts]);
}
