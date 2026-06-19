import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, AlertOctagon, Radio, ShieldCheck, Navigation2, EyeOff, Activity, Phone, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const COUNTDOWN_SECONDS = 5;
const HOLD_DURATION_MS = 1500;

const EmergencySOSWidget = () => {
  const [sosState, setSosState] = useState<'idle' | 'countdown' | 'active'>('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isSilent, setIsSilent] = useState(false);
  const [escalationStage, setEscalationStage] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  
  const { user } = useAuth();
  const contacts = user?.emergencyContacts || [];
  const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];
  const numContacts = contacts.length;

  // Hold-to-activate state
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activateSOS = useCallback((silent: boolean) => {
    setIsSilent(silent);
    if (silent) {
      setSosState('active'); // Silent SOS skips countdown
    } else {
      setSosState('countdown');
      setCountdown(COUNTDOWN_SECONDS);
    }
  }, []);

  const cancelSOS = useCallback(() => {
    setSosState('idle');
    setIsSilent(false);
    setEscalationStage(0);
    setActiveTime(0);
    setHoldProgress(0);
    setIsHolding(false);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  // Hold mechanics
  const startHold = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to avoid selection/magnifier on mobile
    if (e.cancelable) e.preventDefault();
    
    setIsHolding(true);
    setHoldProgress(0);
    
    const intervalMs = 50;
    const step = 100 / (HOLD_DURATION_MS / intervalMs);
    
    progressIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 100;
        }
        return prev + step;
      });
    }, intervalMs);

    holdTimerRef.current = setTimeout(() => {
      activateSOS(false);
    }, HOLD_DURATION_MS);
  }, [activateSOS]);

  const stopHold = useCallback(() => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (sosState !== 'countdown' || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [sosState, countdown]);

  useEffect(() => {
    if (sosState === 'countdown' && countdown <= 0) {
      setSosState('active');
    }
  }, [countdown, sosState]);

  // Escalation simulation when active
  useEffect(() => {
    if (sosState !== 'active') return;
    setEscalationStage(0);
    setActiveTime(0);
    
    const t1 = setTimeout(() => setEscalationStage(1), 2500); // Signal transmitted
    const t2 = setTimeout(() => setEscalationStage(2), 5500); // Authorities notified
    const t3 = setTimeout(() => setEscalationStage(3), 9000); // Patrol assigned
    const t4 = setTimeout(() => setEscalationStage(4), 12000); // Primary Contact Notified / Warning
    const t5 = setTimeout(() => setEscalationStage(5), 15000); // Additional Contacts Notified
    const t6 = setTimeout(() => setEscalationStage(6), 18000); // Live Location Shared
    
    const timeInterval = setInterval(() => {
      setActiveTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearInterval(timeInterval);
    };
  }, [sosState]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getPhaseInfo = () => {
    if (escalationStage === 0) return { phase: 1, text: "SOS Activated" };
    if (escalationStage < 3) return { phase: 2, text: "Response Team Assigned" };
    if (escalationStage < 5 && numContacts > 0) return { phase: 3, text: "Notifying Contacts" };
    return { phase: numContacts > 0 ? 4 : 3, text: "Response In Progress" };
  };

  // SVG parameters for progress ring
  const circleRadius = 54;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

  return (
    <Card className="relative overflow-hidden bg-card border-border shadow-sm flex flex-col h-full">
      <CardHeader className="pb-2 flex-none">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          Emergency SOS
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center py-4">
        <AnimatePresence mode="wait">
          {sosState === 'idle' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center w-full"
            >
              <div 
                className="relative flex items-center justify-center w-32 h-32 select-none"
                onMouseDown={startHold}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={startHold}
                onTouchEnd={stopHold}
                onTouchCancel={stopHold}
              >
                {/* Background pulse when holding */}
                {isHolding && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
                )}
                
                {/* Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                  <circle
                    cx="64"
                    cy="64"
                    r={circleRadius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-red-500/10 dark:text-red-500/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={circleRadius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    className="text-red-500 transition-all duration-75 ease-linear"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>

                {/* Main Button */}
                <motion.div
                  animate={{ scale: isHolding ? 0.92 : 1 }}
                  className="relative z-10 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-500/25 cursor-pointer dark:bg-red-600 dark:shadow-red-900/40"
                >
                  <div className="flex flex-col items-center gap-1">
                    <AlertOctagon className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="text-lg sm:text-xl font-extrabold tracking-widest leading-none">SOS</span>
                  </div>
                </motion.div>
              </div>
              
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-4 font-medium h-4 transition-opacity duration-200" style={{ opacity: isHolding ? 1 : 0.6 }}>
                {isHolding ? "HOLD TO ACTIVATE" : "PRESS & HOLD"}
              </p>

              <button 
                onClick={() => activateSOS(true)} 
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-6 flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-full hover:bg-muted min-h-[44px] sm:min-h-0"
              >
                <EyeOff className="h-3.5 w-3.5 sm:h-3 sm:w-3" /> Silent SOS
              </button>
            </motion.div>
          ) : sosState === 'countdown' ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-red-500 bg-red-500/10 dark:border-red-500 dark:bg-red-500/20"
              >
                <span className="text-4xl font-extrabold text-red-600 dark:text-red-400">
                  {countdown}
                </span>
              </motion.div>
              <div className="text-center">
                <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Emergency Triggered</p>
                <p className="text-xs text-muted-foreground mt-1">Transmitting signal in {countdown}s</p>
              </div>
              <Button variant="outline" onClick={cancelSOS} className="w-full mt-2 border-red-500/30 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 min-h-[44px]">
                <X className="mr-1 h-4 w-4" /> Cancel Trigger
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col w-full h-full overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div className="flex flex-col">
                  <span className={`font-bold flex items-center gap-2 ${isSilent ? 'text-amber-500' : 'text-red-500'}`}>
                    <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${isSilent ? 'bg-amber-500' : 'bg-red-500'}`} />
                    {isSilent ? "SILENT MODE" : "SOS ACTIVE"}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider mt-0.5">
                    Emergency Channel Open
                  </span>
                </div>
                <div className="flex flex-col items-end text-right bg-muted/50 px-2.5 py-1.5 rounded min-w-[120px] border border-border shadow-sm shrink-0">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 tracking-wider">Phase {getPhaseInfo().phase}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">{getPhaseInfo().text}</span>
                  <span className="text-xs font-mono text-foreground font-semibold mt-0.5">Elapsed: {formatTime(activeTime)}</span>
                </div>
              </div>
              
              {/* Scrollable Status Area */}
              <div className="flex-1 overflow-y-auto min-h-0 space-y-3 py-3 pr-2 scrollbar-thin">
                <div className="flex items-center gap-3 text-sm">
                  <Radio className={`h-4 w-4 shrink-0 ${escalationStage >= 1 ? 'text-green-500' : 'text-slate-400 dark:text-slate-600'}`} />
                  <span className={escalationStage >= 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}>GPS Location Verified</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className={`h-4 w-4 shrink-0 ${escalationStage >= 2 ? 'text-green-500' : 'text-slate-400 dark:text-slate-600'}`} />
                  <span className={escalationStage >= 2 ? 'text-foreground font-medium' : 'text-muted-foreground'}>Emergency Control Center Alerted</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Navigation2 className={`h-4 w-4 shrink-0 ${escalationStage >= 3 ? 'text-amber-500 animate-pulse' : 'text-slate-400 dark:text-slate-600'}`} />
                  <span className={escalationStage >= 3 ? 'text-foreground font-bold' : 'text-muted-foreground'}>
                    {escalationStage >= 3 ? 'Nearest Patrol Unit Assigned' : 'Awaiting Assignment'}
                  </span>
                </div>
                {escalationStage >= 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Activity className="h-4 w-4 shrink-0 text-blue-500" />
                    <span className="text-foreground font-medium flex items-center gap-2">
                      Live Tracking Active
                      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping"></span>
                    </span>
                  </motion.div>
                )}
                {escalationStage >= 3 && numContacts === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <AlertOctagon className={`h-4 w-4 shrink-0 ${escalationStage >= 4 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-600'}`} />
                    <span className={escalationStage >= 4 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {escalationStage >= 4 ? '⚠ No Emergency Contacts Configured' : 'Checking Emergency Contacts...'}
                    </span>
                  </motion.div>
                )}
                {escalationStage >= 3 && numContacts > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Phone className={`h-4 w-4 shrink-0 ${escalationStage >= 4 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-600'}`} />
                    <span className={escalationStage >= 4 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {escalationStage >= 4 ? `✓ Primary Contact Notified (${primaryContact?.name})` : 'Notifying Primary Contact...'}
                    </span>
                  </motion.div>
                )}
                {escalationStage >= 4 && numContacts > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Users className={`h-4 w-4 shrink-0 ${escalationStage >= 5 ? 'text-green-500' : 'text-slate-400 dark:text-slate-600'}`} />
                    <span className={escalationStage >= 5 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {escalationStage >= 5 ? `✓ Additional Contacts Notified (${numContacts - 1})` : `Notifying Contacts...`}
                    </span>
                  </motion.div>
                )}
                {escalationStage >= (numContacts > 1 ? 5 : 4) && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Navigation2 className={`h-4 w-4 shrink-0 ${escalationStage >= 6 ? 'text-blue-500' : 'text-slate-400 dark:text-slate-600'}`} />
                    <span className={escalationStage >= 6 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {escalationStage >= 6 ? '✓ Live Location Shared' : 'Preparing Live Location Share...'}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Fixed Bottom Area */}
              <div className="shrink-0 pt-2 border-t border-border mt-auto">
                {escalationStage >= 3 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md mb-4 space-y-2 relative overflow-hidden shrink-0"
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wider">Nearest Patrol</span>
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-400">Distance: ~3.2 km</span>
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wider">Response ETA</span>
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-400">~{Math.max(1, 6 - Math.floor(activeTime / 60))} min</span>
                    </div>
                    <div className="flex justify-between items-center relative z-10 mt-1.5 pt-1.5 border-t border-amber-500/20">
                      <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Dispatch Active
                      </span>
                    </div>
                  </motion.div>
                )}

                <Button variant="outline" onClick={cancelSOS} className="w-full border-red-500/30 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors min-h-[44px]">
                  <X className="mr-2 h-4 w-4 shrink-0" /> Cancel Emergency
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default EmergencySOSWidget;
