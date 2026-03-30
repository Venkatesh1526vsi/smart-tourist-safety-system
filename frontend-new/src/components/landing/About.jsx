import { Shield, Globe, Zap } from "lucide-react";

const About = () => {
  const cards = [
    {
      icon: Shield,
      title: "Safety First",
      description:
        "Advanced algorithms analyze real-time data to keep you informed about potential risks before they become threats.",
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description:
        "From bustling cities to remote destinations, our safety network spans across countries and continents.",
    },
    {
      icon: Zap,
      title: "Instant Response",
      description:
        "One-tap emergency alerts connect you with local authorities and your emergency contacts within seconds.",
    },
  ];

  return (
    <section id="about" className="py-24 bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
            About <span className="text-emerald-600">SAFEYATRA</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto transition-colors duration-300">
            SAFEYATRA is a next-generation tourist safety platform that combines cutting-edge
            technology with local expertise to ensure your travels are secure and worry-free.
            We believe everyone deserves to explore the world with confidence.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="group p-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors duration-300">
                <card.icon className="h-7 w-7 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                {card.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
