import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { notifyError } from "@/utils/notify";
import { login as loginService } from "@/services/authService";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";

const validateProfessionalEmail = (email: string) => {
  const trimmed = email.trim();
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicRegex.test(trimmed) || trimmed.includes('..')) {
    return { isValid: false, message: "Please enter a valid professional email address." };
  }
  
  const parts = trimmed.split('@');
  if (parts.length !== 2) return { isValid: false, message: "Please enter a valid professional email address." };
  
  const domain = parts[1].toLowerCase();
  const fakeDomains = ['test.com', 'fake.com', 'demo.com', 'temp.com', 'example.com'];
  if (fakeDomains.includes(domain)) {
    return { isValid: false, message: "Temporary/demo email domains are not allowed." };
  }
  
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { isValid: false, message: "Please enter a valid professional email address." };
  }
  
  return { isValid: true, message: "" };
};

const Login = () => {
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState("tourist");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // Lightweight login protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutUntil(null);
          setLockoutCountdown(0);
          setFailedAttempts(0);
          setError("");
          clearInterval(interval);
        } else {
          setLockoutCountdown(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading || lockoutUntil) return;
    
    setError("");
    setEmailError("");
    setPasswordError("");
    
    const trimmedEmail = email.trim();
    const emailValidation = validateProfessionalEmail(trimmedEmail);
    let hasError = false;

    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message);
      hasError = true;
    }
    if (!password) {
      setPasswordError("Password is required.");
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      console.log('[Login] Starting login process...');
      const response = await loginService({ email: trimmedEmail, password });

      console.log("🔥 LOGIN RESPONSE RAW:", response);

      // 🔥 DIRECT EXTRACTION (NO CONTEXT DEPENDENCY)
      const newToken = (response as any)?.data?.token || (response as any)?.token;
      const newUser = (response as any)?.data?.user || (response as any)?.user;

      if (!newToken) {
        console.error("❌ TOKEN NOT FOUND:", response);
        throw new Error("Invalid server response. Token missing.");
      }

      // 🔥 STORE DIRECTLY HERE (CRITICAL FIX)
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // 🔥 VERIFY IMMEDIATELY
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        console.error("❌ TOKEN FAILED TO SAVE");
        throw new Error("Failed to save session securely.");
      }

      console.log("✅ TOKEN STORED:", storedToken);

      setFailedAttempts(0); // Reset on success

      // 🔥 NAVIGATION (SAFE NOW)
      if (newUser?.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (err) {
      console.error('[Login] Login error:', err);
      
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        const lockoutTime = Date.now() + 30 * 1000; // 30 seconds lockout
        setLockoutUntil(lockoutTime);
        setLockoutCountdown(30);
        setError("Too many failed attempts. Account temporarily locked for 30 seconds.");
        notifyError("Account temporarily locked");
      } else {
        setError(err instanceof Error ? err.message : "Login failed. Please try again.");
        notifyError("Invalid credentials or login failed");
      }
      
      // Keep email, only clear password for security
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4"><Logo size="lg" /></div>
            <h1 className="font-display text-2xl font-bold">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
                required
                disabled={!!lockoutUntil}
              />
              {emailError && <p className="text-xs text-red-500 font-medium">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPass ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  className={passwordError ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                  required
                  disabled={!!lockoutUntil}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPass(!showPass);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={!!lockoutUntil}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && <p className="text-xs text-red-500 font-medium">{passwordError}</p>}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full bg-background border border-input text-foreground font-semibold shadow-sm hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-primary/50 transition-colors">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border shadow-md">
                  <SelectItem value="tourist" className="font-medium cursor-pointer">Tourist</SelectItem>
                  <SelectItem value="admin" className="font-medium cursor-pointer">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-right">
              <button 
                type="button" 
                className="text-xs text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  setIsForgotModalOpen(true);
                }}
              >
                Forgot password?
              </button>
            </div>

            <Button 
              className="w-full transition-all duration-300" 
              size="lg"
              type="submit"
              disabled={isLoading || !!lockoutUntil}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : lockoutUntil ? (
                `Account Locked (${lockoutCountdown}s)`
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
          </p>
        </div>
      </motion.div>

      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
      />
    </div>
  );
};

export default Login;

