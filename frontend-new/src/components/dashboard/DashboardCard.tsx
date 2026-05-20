import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface DashboardCardProps {
  title: string;
  icon: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function DashboardCard({ title, icon, children, className = "" }: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass-card p-4 sm:p-6 glow-hover ${className}`}
    >
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10">
          {icon}
        </div>
        <h3 className="font-display font-semibold text-base sm:text-lg">{title}</h3>
      </div>
      <div className="text-muted-foreground text-sm">
        {children || <p>Content coming soon...</p>}
      </div>
    </motion.div>
  );
}
