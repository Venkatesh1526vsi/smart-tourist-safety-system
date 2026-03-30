import { MapPin, AlertCircle, Shield } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: MapPin,
      title: "Set Your Location",
      description:
        "Enable location services and let SAFEYATRA track your position in real-time. Your safety dashboard updates automatically as you move.",
    },
    {
      number: "02",
      icon: AlertCircle,
      title: "Receive Alerts",
      description:
        "Get instant notifications about nearby risks, unsafe areas, and safety advisories tailored to your current location.",
    },
    {
      number: "03",
      icon: Shield,
      title: "Stay Protected",
      description:
        "In case of emergency, tap the SOS button. Our system immediately alerts authorities and your emergency contacts.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 bg-white dark:bg-slate-900 transition-colors duration-300"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
            How It <span className="text-emerald-600">Works</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto transition-colors duration-300">
            Getting started with SAFEYATRA is simple. Three easy steps to complete
            peace of mind during your travels.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Number */}
              <h2 className="
                text-6xl md:text-7xl
                font-extrabold
                text-emerald-600 dark:text-emerald-500
                mb-4
                transition-colors duration-300
              ">
                {step.number}
              </h2>

              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 transition-colors duration-300">
                <step.icon className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
