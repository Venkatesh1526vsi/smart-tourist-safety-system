import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-slate-900">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80")',
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">
          Travel Smart.{" "}
          <span className="text-emerald-400">Stay Safe.</span>
        </h1>

        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10">
          Your intelligent travel companion for real-time safety monitoring, risk zone alerts,
          and instant emergency response wherever you go.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login">
            <button className="px-8 py-3 rounded-lg border border-gray-400 text-white hover:bg-white hover:text-gray-900 transition-all duration-300 font-medium">
              Login
            </button>
          </Link>

          <Link to="/register">
            <button className="px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 font-medium flex items-center gap-2">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
