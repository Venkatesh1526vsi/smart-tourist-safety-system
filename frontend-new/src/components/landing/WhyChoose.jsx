import { Check, Clock, Users, Activity } from "lucide-react";

const WhyChoose = () => {
  const benefits = [
    "Real-time location tracking with GPS precision",
    "AI-powered risk assessment and predictions",
    "24/7 emergency response team",
    "Integration with local authorities worldwide",
    "End-to-end encrypted communications",
    "Multi-language support for global travelers",
  ];

  const stats = [
    {
      icon: Activity,
      value: "99.9%",
      label: "Uptime",
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500",
    },
    {
      icon: Clock,
      value: "<3s",
      label: "Response Time",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500",
    },
    {
      icon: Users,
      value: "50K+",
      label: "Travelers Protected",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-500",
    },
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-slate-800 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              Why Choose <span className="text-emerald-600">SAFEYATRA</span>?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 transition-colors duration-300">
              We combine cutting-edge technology with human expertise to deliver
              the most comprehensive travel safety solution available today.
            </p>

            {/* Checklist */}
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-300">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <span className="text-gray-900 dark:text-white transition-colors duration-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Stats */}
          <div className="space-y-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full ${stat.color} flex items-center justify-center transition-colors duration-300`}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      {stat.value}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
