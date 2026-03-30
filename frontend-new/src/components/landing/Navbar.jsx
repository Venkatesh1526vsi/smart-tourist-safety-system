import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Globe, Sun, Moon } from "lucide-react";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("safeyatra-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("safeyatra-theme", "light");
    }
  }, [darkMode]);

  // Sync with external theme changes (from ThemeProvider)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setDarkMode(isDark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300
        ${scrolled
          ? "bg-white dark:bg-black shadow-md"
          : "bg-white/30 dark:bg-black/30 backdrop-blur-md"
        }`}
    >
      <div className="w-full px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          {/* Left - Logo - Perfectly aligned left */}
          <Link to="/" className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-emerald-600" />
            <span className="text-gray-900 dark:text-white font-bold text-lg">
              SAFE
            </span>
            <span className="text-emerald-600 font-bold text-lg">
              YATRA
            </span>
          </Link>

          {/* Right - Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("about")}
              className={`text-sm font-medium transition-all duration-300 hover:text-emerald-600 ${
                scrolled ? "text-gray-700 dark:text-gray-200" : "text-gray-800 dark:text-white/90"
              }`}
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className={`text-sm font-medium transition-all duration-300 hover:text-emerald-600 ${
                scrolled ? "text-gray-700 dark:text-gray-200" : "text-gray-800 dark:text-white/90"
              }`}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className={`text-sm font-medium transition-all duration-300 hover:text-emerald-600 ${
                scrolled ? "text-gray-700 dark:text-gray-200" : "text-gray-800 dark:text-white/90"
              }`}
            >
              How It Works
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="p-2 rounded-full transition-all duration-300 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Link to="/login">
              <button
                className="
                  px-5 py-2 rounded-lg border
                  border-gray-400 dark:border-gray-600
                  text-gray-900 dark:text-white
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-all duration-300
                "
              >
                Login
              </button>
            </Link>

            <Link to="/register">
              <button className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 text-sm font-medium shadow-lg shadow-emerald-600/20">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
