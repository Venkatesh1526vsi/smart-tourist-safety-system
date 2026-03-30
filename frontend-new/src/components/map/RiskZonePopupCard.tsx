import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { motion } from "framer-motion";

export interface RiskZoneData {
  name: string;
  severity: "medium" | "critical";
  description: string;
  safetyInstructions: string[];
}

interface RiskZonePopupCardProps {
  zone: RiskZoneData;
}

const RiskZonePopupCard = ({ zone }: RiskZonePopupCardProps) => {
  const isCritical = zone.severity === "critical";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="w-full max-w-sm shadow-lg dark:bg-secondary/60 dark:backdrop-blur-sm dark:border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              {isCritical ? (
                <ShieldAlert className="h-4 w-4 text-critical" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber" />
              )}
              {zone.name}
            </CardTitle>
            <Badge
              className={
                isCritical
                  ? "bg-critical text-critical-foreground hover:bg-critical/90"
                  : "bg-amber text-amber-foreground hover:bg-amber/90"
              }
            >
              {isCritical ? "Critical" : "Medium"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{zone.description}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-sky" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Safety Instructions
              </span>
            </div>
            <ul className="space-y-1 pl-5">
              {zone.safetyInstructions.map((instruction, i) => (
                <li
                  key={i}
                  className="text-sm text-foreground/80 list-disc"
                >
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RiskZonePopupCard;
