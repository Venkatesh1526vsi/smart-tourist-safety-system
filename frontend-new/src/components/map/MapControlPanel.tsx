import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MapPin, AlertTriangle, Shield } from "lucide-react";
import { motion } from "framer-motion";

const MapControlPanel = () => {
  const [locationSharing, setLocationSharing] = useState(false);
  const [limitCrossingAlert, setLimitCrossingAlert] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-sm shadow-md dark:bg-secondary/50 dark:backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-emerald" />
            Map Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Location Sharing Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky" />
              <Label htmlFor="location-sharing" className="text-sm font-medium">
                Location Sharing
              </Label>
            </div>
            <Switch
              id="location-sharing"
              checked={locationSharing}
              onCheckedChange={setLocationSharing}
            />
          </div>

          {/* Limit Crossing Alert */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber" />
              <Label className="text-sm font-medium">Limit Crossing Alert</Label>
            </div>
            <div className="flex items-center gap-2">
              {limitCrossingAlert && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber" />
                </span>
              )}
              <Switch
                checked={limitCrossingAlert}
                onCheckedChange={setLimitCrossingAlert}
              />
            </div>
          </div>

          {/* Risk Zone Legend */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Risk Zone Legend
            </Label>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald text-emerald-foreground hover:bg-emerald/90 dark:bg-cyan dark:text-cyan-foreground dark:hover:bg-cyan/90">
                Safe Zone
              </Badge>
              <Badge className="bg-amber text-amber-foreground hover:bg-amber/90 dark:bg-cyan/70 dark:text-cyan-foreground dark:hover:bg-cyan/60">
                Caution
              </Badge>
              <Badge className="bg-critical text-critical-foreground hover:bg-critical/90 dark:bg-critical dark:text-critical-foreground">
                Critical
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MapControlPanel;
