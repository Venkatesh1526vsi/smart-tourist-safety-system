import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const reasons = [
  "Real-time GPS tracking and smart route monitoring",
  "Instant SOS with automatic location sharing",
  "AI-powered risk zone detection and alerts",
  "Admin dashboard for authorities and emergency services",
  "Cross-platform responsive design",
  "Privacy-first approach with encrypted data",
];

export function WhyChoose() {
  return (
    <section className="py-24">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Why Choose <span className="text-primary">SAFEYATRA</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Built with travelers' safety as the top priority, SAFEYATRA combines cutting-edge
              technology with intuitive design to keep you protected.
            </p>
            <ul className="space-y-4">
              {reasons.map((r, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{r}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-8 space-y-6"
          >
            <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="text-3xl font-display font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime guarantee for emergency services</div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/5 border border-secondary/10">
              <div className="text-3xl font-display font-bold text-secondary">{"<3s"}</div>
              <div className="text-sm text-muted-foreground">Average SOS response time</div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/5 border border-accent/10">
              <div className="text-3xl font-display font-bold text-accent">50K+</div>
              <div className="text-sm text-muted-foreground">Travelers protected worldwide</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
