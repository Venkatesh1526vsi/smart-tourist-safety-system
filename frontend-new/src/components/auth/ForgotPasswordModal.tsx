import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { notifySuccess } from "@/utils/notify";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "email" | "otp" | "reset" | "success";

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
  
  return { isValid: true, message: "" };
};

const validatePassword = (password: string) => {
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(password)) return "Must contain an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Must contain a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Must contain a number.";
  if (!/[!@#$%^&*]/.test(password)) return "Must contain a special character (!@#$%^&*).";
  return "";
};

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>("email");
  const [isLoading, setIsLoading] = useState(false);
  
  // Data State
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Error State
  const [error, setError] = useState("");
  
  // Realism State
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("email");
        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");
        setGeneratedOtp(null);
        setResendCooldown(0);
      }, 300);
    }
  }, [isOpen]);

  // Cooldown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const emailValidation = validateProfessionalEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.message);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call and OTP generation
    setTimeout(() => {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("[SafeYatra Auth] OTP Generated (Frontend Only):", mockOtp);
      notifySuccess(`Verification code sent: ${mockOtp}`);
      setGeneratedOtp(mockOtp);
      setStep("otp");
      setResendCooldown(30);
      setIsLoading(false);
    }, 1500);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter a 6-digit verification code.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (otp === generatedOtp) {
        setStep("reset");
        setError("");
      } else {
        setError("Invalid verification code. Please try again.");
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    
    setTimeout(() => {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("[SafeYatra Auth] New OTP Generated (Frontend Only):", mockOtp);
      notifySuccess(`New verification code sent: ${mockOtp}`);
      setGeneratedOtp(mockOtp);
      setResendCooldown(30);
      setIsLoading(false);
    }, 1000);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const passError = validatePassword(newPassword);
    if (passError) {
      setError(passError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setStep("success");
      setIsLoading(false);
    }, 1500);
  };

  const renderStep = () => {
    switch (step) {
      case "email":
        return (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleEmailSubmit}
            className="space-y-4 mt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="reset-email">Registered Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading || !email}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send Verification Code
            </Button>
          </motion.form>
        );

      case "otp":
        return (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleOtpSubmit}
            className="space-y-4 mt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="otp">6-Digit Verification Code</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  className="pl-10 text-center tracking-widest text-lg font-mono"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">Code sent to {email}</p>
            </div>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Verify Code
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-xs" 
                onClick={handleResendOtp}
                disabled={isLoading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Code"}
              </Button>
            </div>
          </motion.form>
        );

      case "reset":
        return (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleResetSubmit}
            className="space-y-4 mt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className={newPassword.length >= 8 ? "text-green-500" : ""}>• At least 8 characters</li>
              <li className={/[A-Z]/.test(newPassword) ? "text-green-500" : ""}>• One uppercase letter</li>
              <li className={/[a-z]/.test(newPassword) ? "text-green-500" : ""}>• One lowercase letter</li>
              <li className={/[0-9]/.test(newPassword) ? "text-green-500" : ""}>• One number</li>
              <li className={/[!@#$%^&*]/.test(newPassword) ? "text-green-500" : ""}>• One special character</li>
            </ul>
            <Button type="submit" className="w-full" disabled={isLoading || !newPassword || !confirmPassword}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Update Password
            </Button>
          </motion.form>
        );

      case "success":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-6 text-center space-y-4"
          >
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Password Updated</h3>
              <p className="text-sm text-muted-foreground">
                Your password has been successfully reset. You can now log in with your new credentials.
              </p>
            </div>
            <Button onClick={onClose} className="w-full mt-4">
              Return to Login
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "email" && "Reset Password"}
            {step === "otp" && "Verify Email"}
            {step === "reset" && "Create New Password"}
            {step === "success" && "Success"}
          </DialogTitle>
          <DialogDescription>
            {step === "email" && "Enter your registered email address to receive a verification code."}
            {step === "otp" && "Enter the 6-digit code sent to your email."}
            {step === "reset" && "Create a strong, secure password for your account."}
            {step === "success" && "Your account is secure."}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-[200px]">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
