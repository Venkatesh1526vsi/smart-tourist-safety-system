import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
      <div className="section-container flex h-16 items-center justify-between">
        <Link to="/">
          <Logo />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {isLanding && (
            <>
              <a href="#about" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="#features" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            </>
          )}
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border/50 bg-background"
          >
            <div className="section-container flex flex-col gap-2 py-4">
              {isLanding && (
                <>
                  <a href="#about" onClick={() => setOpen(false)} className="py-2 text-muted-foreground">About</a>
                  <a href="#features" onClick={() => setOpen(false)} className="py-2 text-muted-foreground">Features</a>
                  <a href="#how-it-works" onClick={() => setOpen(false)} className="py-2 text-muted-foreground">How It Works</a>
                </>
              )}
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Login</Button>
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
