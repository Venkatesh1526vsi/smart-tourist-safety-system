import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Eye, EyeOff, Upload, X, Loader2, AlertCircle } from "lucide-react";
import { register as registerService } from "@/services/authService";

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

const Register = () => {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    emergency: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear specific error on change
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (pass.length === 0) return { label: "", color: "", bg: "bg-gray-200 dark:bg-gray-700", width: "0%" };
    if (score < 3) return { label: "Weak", color: "text-red-500", bg: "bg-red-500", width: "33%" };
    if (score < 5) return { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500", width: "66%" };
    return { label: "Strong", color: "text-emerald-500", bg: "bg-emerald-500", width: "100%" };
  };

  const strength = getPasswordStrength(formData.password);

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    return /^\+?[0-9]{10,15}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitMessage("");
    setErrors({});
    setIsSubmitting(true);

    let newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    }

    // Phone validation
    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Invalid format (10-15 digits).";
    }
    if (!validatePhone(formData.emergency)) {
      newErrors.emergency = "Invalid format (10-15 digits).";
    }

    // Email validation & Duplicate check
    const trimmedEmail = formData.email.trim();
    const emailValidation = validateProfessionalEmail(trimmedEmail);
    
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message;
    } else {
      const existingEmails = JSON.parse(localStorage.getItem('registered_emails') || '[]');
      if (existingEmails.includes(trimmedEmail.toLowerCase())) {
        newErrors.email = "An account with this email already exists.";
      }
    }

    // Password validation
    if (formData.password.length < 8 || 
        !/[A-Z]/.test(formData.password) || 
        !/[a-z]/.test(formData.password) || 
        !/[0-9]/.test(formData.password) || 
        !/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = "Password does not meet all requirements.";
    }

    // Confirm password
    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await registerService({
        name: formData.name,
        email: trimmedEmail,
        password: formData.password,
        role: "tourist"
      });
      
      const newToken = (response as any)?.token || (response as any)?.data?.token;
      const newUser = (response as any)?.user || (response as any)?.data?.user;

      if (!newToken) {
        console.error("❌ TOKEN NOT FOUND:", response);
        throw new Error("Invalid server response. Token missing.");
      }

      // Safe local tracking for duplicates
      const existingEmails = JSON.parse(localStorage.getItem('registered_emails') || '[]');
      const lowerEmail = trimmedEmail.toLowerCase();
      if (!existingEmails.includes(lowerEmail)) {
        localStorage.setItem('registered_emails', JSON.stringify([...existingEmails, lowerEmail]));
      }

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      if (newUser?.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md my-8"
      >
        <div className="glass-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4"><Logo size="lg" /></div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Join SAFEYATRA for safer travels</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                className={`bg-white dark:bg-gray-900 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                className={`bg-white dark:bg-gray-900 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Phone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="+91..." 
                  className={`bg-white dark:bg-gray-900 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
                {errors.phone && <p className="text-xs text-red-500 flex items-start gap-1"><AlertCircle className="w-3 h-3 shrink-0 mt-0.5"/><span>{errors.phone}</span></p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency" className="text-gray-700 dark:text-gray-300">Emergency Contact</Label>
                <Input 
                  id="emergency" 
                  type="tel" 
                  placeholder="+91..." 
                  className={`bg-white dark:bg-gray-900 ${errors.emergency ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  value={formData.emergency}
                  onChange={handleInputChange}
                  required
                />
                {errors.emergency && <p className="text-xs text-red-500 flex items-start gap-1"><AlertCircle className="w-3 h-3 shrink-0 mt-0.5"/><span>{errors.emergency}</span></p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPass ? "text" : "password"} 
                  placeholder="••••••••" 
                  className={`bg-white dark:bg-gray-900 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Strength:</span>
                    <span className={`font-medium ${strength.color}`}>{strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strength.bg} transition-all duration-300`} 
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}
              
              {/* Password Helper */}
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">
                Requires: 8+ chars, uppercase, lowercase, number, special char.
              </p>
              {errors.password && <p className="text-xs text-red-500 flex items-start gap-1"><AlertCircle className="w-3 h-3 shrink-0 mt-0.5"/><span>{errors.password}</span></p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">Confirm Password</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPass ? "text" : "password"} 
                  placeholder="••••••••" 
                  className={`bg-white dark:bg-gray-900 pr-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : (confirmPassword && confirmPassword === formData.password) ? 'border-emerald-500 focus-visible:ring-emerald-500' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors(prev => { const n = {...prev}; delete n.confirmPassword; return n; });
                    }
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.confirmPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Profile Photo</Label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-emerald-500/50 transition-all duration-300 bg-white dark:bg-gray-900">
                <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFile ? selectedFile.name : "Choose a file..."}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
              
              {/* Preview */}
              {previewUrl && (
                <div className="relative mt-3 inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location Permission</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enable GPS for real-time safety</p>
              </div>
              <Switch checked={locationEnabled} onCheckedChange={setLocationEnabled} />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            {submitMessage && (
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm text-center font-medium">
                {submitMessage}
              </div>
            )}

            <Button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
