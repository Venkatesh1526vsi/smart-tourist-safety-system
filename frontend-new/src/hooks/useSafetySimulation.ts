import { useEffect, useRef } from "react";
import { addNotification, type NotificationType } from "./useNotificationStore";

const alerts: { type: NotificationType; title: string; message: string }[] = [
  { type: "warning", title: "Risk Zone Alert", message: "You are approaching Chandni Chowk — high pickpocket risk area." },
  { type: "info", title: "Nearby Incident", message: "Minor road accident reported 500m ahead on NH-44." },
  { type: "emergency", title: "Emergency Broadcast", message: "Heavy rainfall warning issued for Delhi NCR. Avoid low-lying areas." },
  { type: "warning", title: "Scam Advisory", message: "Tourist scam reports near Connaught Place. Stay vigilant." },
  { type: "info", title: "Safety Tip", message: "Keep digital copies of your travel documents accessible offline." },
  { type: "emergency", title: "SOS Nearby", message: "An SOS was triggered by a traveler 200m from your location." },
  { type: "info", title: "Admin Broadcast", message: "Metro services disrupted between Rajiv Chowk and Kashmere Gate." },
  { type: "warning", title: "Night Advisory", message: "Avoid isolated areas in Old Delhi after 10 PM." },
];

export function useSafetySimulation(enabled = true, intervalMs = 12000) {
  const indexRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      const alert = alerts[indexRef.current % alerts.length];
      indexRef.current++;
      addNotification(alert.type, alert.title, alert.message);
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, intervalMs]);
}
