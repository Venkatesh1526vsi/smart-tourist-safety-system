import { motion } from "framer-motion";
import { UserPlus, MapPin, ShieldCheck } from "lucide-react";

const steps = [
  { icon: UserPlus, step: "01", title: "Register & Setup", desc: "Create your account, set emergency contacts, and enable location services." },
  { icon: MapPin, step: "02", title: "Travel with Confidence", desc: "Get live risk alerts, navigate safely, and stay connected with your safety network." },
  { icon: ShieldCheck, step: "03", title: "Stay Protected", desc: "Trigger SOS in emergencies, report incidents, and get instant assistance." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="relative text-center"
            >
              <div className="text-6xl font-display font-bold text-primary/50 mb-4">{s.step}</div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-5">
                <s.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">{s.title}</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
