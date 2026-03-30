import {
  MapPin,
  AlertTriangle,
  Siren,
  BarChart3,
  Radio,
  ShieldCheck,
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Live Location Tracking",
      description:
        "Real-time GPS tracking keeps you connected with loved ones and emergency services at all times.",
    },
    {
      icon: AlertTriangle,
      title: "Risk Zone Alerts",
      description:
        "Get instant notifications when entering high-risk areas with safety recommendations.",
    },
    {
      icon: Siren,
      title: "Emergency SOS",
      description:
        "One-tap emergency alerts notify authorities and your contacts with your exact location.",
    },
    {
      icon: ShieldCheck,
      title: "Admin Monitoring",
      description:
        "24/7 monitoring by safety professionals who can dispatch help when needed.",
    },
    {
      icon: BarChart3,
      title: "Incident Analytics",
      description:
        "Data-driven insights help you make informed decisions about your travel routes.",
    },
    {
      icon: Radio,
      title: "Broadcast Alerts",
      description:
        "Receive critical safety alerts and advisories for your current location.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-slate-800 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
            Key <span className="text-emerald-600">Features</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto transition-colors duration-300">
            Comprehensive safety tools designed to protect you throughout your journey,
            from planning to return.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors duration-300">
                <feature.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed transition-colors duration-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
