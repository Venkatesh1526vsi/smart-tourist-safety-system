import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const COUNTDOWN_SECONDS = 5;

const EmergencySOSWidget = () => {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const activate = useCallback(() => {
    setIsActive(true);
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  const cancel = useCallback(() => {
    setIsActive(false);
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  useEffect(() => {
    if (!isActive || countdown <= 0) return;

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isActive, countdown]);

  return (
    <Card className="relative overflow-hidden dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          Emergency SOS
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {!isActive ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative flex items-center justify-center"
            >
              {/* Pulse rings */}
              <span className="absolute h-32 w-32 animate-ping rounded-full bg-emerald-500/20 dark:bg-cyan-400/20" />
              <span className="absolute h-28 w-28 animate-pulse rounded-full bg-emerald-500/10 dark:bg-cyan-400/10" />
              <motion.button
                whileTap={{ scale: 0.92, rotate: [0, -2, 2, -2, 0] }}
                onClick={activate}
                className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-shadow hover:shadow-xl hover:shadow-emerald-500/30 dark:bg-cyan-500 dark:shadow-cyan-500/25 dark:hover:shadow-cyan-400/40"
              >
                <span className="text-2xl font-extrabold tracking-widest">SOS</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-500 bg-amber-500/10 dark:border-cyan-400 dark:bg-cyan-400/10"
              >
                <span className="text-3xl font-extrabold text-amber-600 dark:text-cyan-300">
                  {countdown > 0 ? countdown : "!"}
                </span>
              </motion.div>
              <p className="text-sm font-medium text-muted-foreground">
                {countdown > 0 ? "Sending alert in..." : "Emergency alert sent!"}
              </p>
              {countdown > 0 && (
                <Button variant="outline" size="sm" onClick={cancel} className="border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:border-cyan-500/30 dark:text-cyan-400 dark:hover:bg-cyan-500/10">
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default EmergencySOSWidget;
