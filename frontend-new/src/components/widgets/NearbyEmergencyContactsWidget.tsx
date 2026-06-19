import { Phone, MessageSquare, Shield, Building2, Flame, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type Contact = {
  id: string;
  name: string;
  type: "police" | "hospital" | "fire" | "embassy";
  distance: number;
  phone: string;
  eta: string;
  status: "available" | "busy" | "standby";
};

const CONTACTS: Contact[] = [
  { id: "1", name: "City Police Station", type: "police", distance: 0.8, phone: "100", eta: "3 min", status: "available" },
  { id: "2", name: "Central Hospital", type: "hospital", distance: 1.2, phone: "108", eta: "5 min", status: "available" },
  { id: "3", name: "Fire & Rescue", type: "fire", distance: 2.4, phone: "101", eta: "8 min", status: "standby" },
  { id: "4", name: "General Hospital", type: "hospital", distance: 3.1, phone: "108", eta: "12 min", status: "busy" },
  { id: "5", name: "Tourist Embassy", type: "embassy", distance: 5.6, phone: "112", eta: "15 min", status: "available" },
];

const iconMap = {
  police: Shield,
  hospital: Stethoscope,
  fire: Flame,
  embassy: Building2,
};

const distanceColor = (d: number) => {
  if (d <= 1) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  if (d <= 3) return "bg-sky-500/15 text-sky-700 dark:text-cyan-400 border-sky-500/30 dark:border-cyan-500/30";
  return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
};

const NearbyEmergencyContactsWidget = () => {
  return (
    <Card className="bg-card border-border shadow-sm transition-all hover:shadow-md flex flex-col justify-between h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-sky-500 dark:text-cyan-400" />
            Operational Contacts
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Network Ready
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-full flex flex-col justify-between">
        <ScrollArea className="h-full px-6 pb-4 flex flex-col justify-between">
          <div className="space-y-3 pt-1">
            {CONTACTS.map((c) => {
              const Icon = iconMap[c.type];
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:border-sky-500/40 hover:bg-sky-50/50 dark:border-slate-700/50 dark:hover:bg-sky-900/20"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 dark:bg-cyan-500/10 relative">
                    <Icon className="h-4 w-4 text-sky-600 dark:text-cyan-400" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${c.status === 'available' ? 'bg-green-500' : c.status === 'busy' ? 'bg-red-500' : 'bg-amber-500'}`} title={`Status: ${c.status}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">{c.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${distanceColor(c.distance)}`}
                      >
                        {c.distance} km
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <span className="text-muted-foreground/60">ETA:</span> {c.eta}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-1.5 ml-2">
                    <a href={`tel:${c.phone}`} className="flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-10 w-10 sm:h-8 sm:w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-500/10" aria-label="Call">
                        <Phone className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    </a>
                    <a href={`sms:${c.phone}`} className="flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-10 w-10 sm:h-8 sm:w-8 text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:text-cyan-400 dark:hover:bg-cyan-500/10" aria-label="Message">
                        <MessageSquare className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NearbyEmergencyContactsWidget;
