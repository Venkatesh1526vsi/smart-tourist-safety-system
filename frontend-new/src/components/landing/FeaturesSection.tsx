import { motion } from "framer-motion";
import { MapPin, Bell, Phone, Users, BarChart3, Radio } from "lucide-react";

const features = [
  { icon: MapPin, title: "Live Location Tracking", desc: "Real-time GPS tracking with intelligent route monitoring." },
  { icon: Bell, title: "Risk Zone Alerts", desc: "Automated warnings when entering high-risk or restricted areas." },
  { icon: Phone, title: "Emergency SOS", desc: "Instant one-tap emergency alert with location sharing." },
  { icon: Users, title: "Admin Monitoring", desc: "Dashboard for authorities to track and assist tourists." },
  { icon: BarChart3, title: "Incident Analytics", desc: "Data-driven insights for improving tourist safety measures." },
  { icon: Radio, title: "Broadcast Alerts", desc: "Mass notifications for weather, natural disaster, or civil alerts." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Key <span className="text-primary">Features</span>
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground text-lg">
            Everything you need for a safe and informed travel experience.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">{f.title}</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
