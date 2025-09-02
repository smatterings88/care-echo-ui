import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  const validateForm = () => {
    const errors = { email: "", password: "" };
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setFormErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login(formData);
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Enter a valid email to reset your password");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success("Password reset email sent");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reset email");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Care Echo Logo" 
            className="w-32 h-16 object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-neutral-900">Welcome Back</h1>
          <p className="text-neutral-600 mt-2">Sign in to your Care Echo account</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-900 font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 ${formErrors.email ? "border-error focus:border-error" : ""}`}
                  disabled={loading}
                />
              </div>
              {formErrors.email && (
                <p className="text-error text-sm">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-900 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`pl-10 pr-10 ${formErrors.password ? "border-error focus:border-error" : ""}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-error text-sm">{formErrors.password}</p>
              )}
              <div className="text-right">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-sm text-accent-teal hover:text-brand-red-600 transition-colors focus-ring"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            {/* Back to landing */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-accent-teal hover:text-brand-red-600 transition-colors focus-ring text-sm"
              >
                ← Back to landing page
              </button>
            </div>

            {/* Demo Accounts Info */}
            <div className="text-center">
              <p className="text-sm text-neutral-600">
                Need help? Contact your administrator
              </p>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-neutral-600">
            © {new Date().getFullYear()} Care Echo. Built with compassion for healthcare heroes by{" "}
            <a 
              href="https://zenwareai.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent-teal hover:text-brand-red-600 transition-colors focus-ring"
            >
              ZenwareAI
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
