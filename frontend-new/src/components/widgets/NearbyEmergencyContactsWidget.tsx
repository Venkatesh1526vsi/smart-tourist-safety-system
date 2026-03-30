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
};

const CONTACTS: Contact[] = [
  { id: "1", name: "City Police Station", type: "police", distance: 0.8, phone: "100" },
  { id: "2", name: "Central Hospital", type: "hospital", distance: 1.2, phone: "108" },
  { id: "3", name: "Fire & Rescue", type: "fire", distance: 2.4, phone: "101" },
  { id: "4", name: "General Hospital", type: "hospital", distance: 3.1, phone: "108" },
  { id: "5", name: "Tourist Embassy", type: "embassy", distance: 5.6, phone: "112" },
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
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-sky-500 dark:text-cyan-400" />
          Nearby Emergency Contacts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px] px-6 pb-4">
          <div className="space-y-3 pt-1">
            {CONTACTS.map((c) => {
              const Icon = iconMap[c.type];
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-emerald-50/50 dark:border-slate-700/50 dark:hover:bg-slate-700/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 dark:bg-cyan-500/10">
                    <Icon className="h-4 w-4 text-sky-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <Badge
                      variant="outline"
                      className={`mt-1 text-[10px] px-1.5 py-0 ${distanceColor(c.distance)}`}
                    >
                      {c.distance} km away
                    </Badge>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-500/10" aria-label="Call">
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:text-cyan-400 dark:hover:bg-cyan-500/10" aria-label="Message">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
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
