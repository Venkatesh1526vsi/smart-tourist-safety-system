import { motion } from "framer-motion";
import { Shield, Globe, Zap } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            About <span className="text-primary">SAFEYATRA</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            SAFEYATRA is a smart tourist safety and emergency assistance system designed to
            keep travelers informed, connected, and protected throughout their journey.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: "Safety First", desc: "Real-time risk zone alerts and safety advisories tailored to your location." },
            { icon: Globe, title: "Global Coverage", desc: "Works across regions with live location tracking and incident reporting." },
            { icon: Zap, title: "Instant Response", desc: "One-tap emergency SOS with automatic location sharing to authorities." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-card p-8 text-center glow-hover"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-5">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
