import { Globe, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Login", href: "/login" },
    { label: "Register", href: "/register" },
    { label: "Dashboard", href: "/dashboard/user" },
  ];

  const contactInfo = [
    { icon: Mail, text: "support@safeyatra.com" },
    { icon: Phone, text: "+1 (555) 123-4567" },
    { icon: MapPin, text: "San Francisco, CA" },
  ];

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Logo & Description */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Globe className="h-6 w-6 text-emerald-600" />
              <span className="font-bold text-lg">
                <span className="text-gray-900 dark:text-white">SAFE</span>
                <span className="text-emerald-600">YATRA</span>
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed transition-colors duration-300">
              Your intelligent travel companion for real-time safety monitoring,
              risk zone alerts, and instant emergency response.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4 transition-colors duration-300">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4 transition-colors duration-300">Contact</h3>
            <ul className="space-y-3">
              {contactInfo.map((info, index) => (
                <li key={index} className="flex items-center gap-3">
                  <info.icon className="h-4 w-4 text-emerald-600" />
                  <span className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                    {info.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 transition-colors duration-300">
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center transition-colors duration-300">
            © 2026 SAFEYATRA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
