import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, AlertTriangle, MapPin, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Tip = {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  isWarning?: boolean;
};

const TIPS: Tip[] = [
  { id: 1, icon: MapPin, title: "Location Context", description: "Your current zone has active police patrols. Stay on main routes." },
  { id: 2, icon: AlertTriangle, title: "Night Travel Advisory", description: "It is currently evening. Stay on well-lit, populated streets and avoid shortcuts through dark alleys.", isWarning: true },
  { id: 3, icon: ShieldCheck, title: "Operational Readiness", description: "Keep copies of important documents separate from originals. Your emergency contacts are synced." },
  { id: 4, icon: Lightbulb, title: "Weather Protocol", description: "Optimal weather conditions detected. Standard travel safety protocols apply." },
];

const TravelSafetyTipsWidget = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % TIPS.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [paused, next]);

  const tip = TIPS[current];

  return (
    <Card
      className="bg-card border-border shadow-sm transition-all hover:shadow-md h-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Contextual Advisories
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Smart Sync
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[120px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={`rounded-lg border p-4 ${
                tip.isWarning
                  ? "border-amber-500/40 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/10 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]"
                  : "border-border bg-muted/30 "
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-background/50">
                  <tip.icon className={`h-5 w-5 sm:h-4 sm:w-4 ${tip.isWarning ? "text-amber-500" : "text-primary"}`} />
                </div>
                <div className="space-y-1 sm:space-y-1.5 pt-0.5">
                  <h4 className={`text-sm sm:text-base font-semibold leading-none ${tip.isWarning ? "text-amber-700 dark:text-amber-400" : ""}`}>
                    {tip.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation dots */}
        <div className="mt-4 flex justify-center gap-1.5">
          {TIPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2.5 sm:h-1.5 rounded-full transition-all duration-300 min-w-[20px] sm:min-w-0 ${
                idx === current
                  ? "w-8 sm:w-4 bg-primary"
                  : "w-2.5 sm:w-1.5 bg-primary/20 hover:bg-primary/40"
              }`}
              aria-label={`Go to tip ${idx + 1}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TravelSafetyTipsWidget;
