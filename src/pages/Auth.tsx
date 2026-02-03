import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Eye, EyeOff, Check, X, Mail, KeyRound } from 'lucide-react';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

type AuthMode = 'login' | 'signup' | 'forgot' | 'verify-otp';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const getPasswordStrength = (password: string): PasswordStrength => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive', checks };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500', checks };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500', checks };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-primary', checks };
  return { score, label: 'Very Strong', color: 'bg-green-500', checks };
};

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; fullName?: string }>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (user) {
      navigate('/onboarding');
    }
  }, [user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string; fullName?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    if (mode !== 'forgot' && mode !== 'verify-otp') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }
    
    if (mode === 'signup') {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.fullName = nameResult.error.errors[0].message;
      }
      
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Password reset email sent! Check your inbox.');
          setMode('login');
        }
      } else if (mode === 'login') {
        // For login, first sign in to validate credentials
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else if (error.message.includes('Email not confirmed')) {
            // User hasn't verified email yet
            toast.error('Please verify your email first.');
            // Send a new OTP
            await sendOtp();
            setMode('verify-otp');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/onboarding');
        }
      } else if (mode === 'signup') {
        // Sign up with email confirmation required
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
            },
          },
        });
        
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
            setMode('login');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Verification code sent to your email!');
          setResendCooldown(60);
          setMode('verify-otp');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Verification code sent to your email!');
        setResendCooldown(60);
      }
    } catch (error) {
      toast.error('Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });
      
      if (error) {
        toast.error(error.message);
        setOtpCode('');
      } else {
        toast.success('Email verified! Welcome to Praeceptor AI!');
        navigate('/onboarding');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setConfirmPassword('');
    setOtpCode('');
    if (newMode === 'forgot') {
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-8"
          onClick={() => {
            if (mode === 'forgot') {
              switchMode('login');
            } else if (mode === 'verify-otp') {
              switchMode('signup');
            } else {
              navigate('/');
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {mode === 'forgot' ? 'Back to sign in' : mode === 'verify-otp' ? 'Back' : 'Back to home'}
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-14 h-14" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Praeceptor AI</h1>
            <p className="text-sm text-muted-foreground">Your Cybersecurity Mentor</p>
          </div>
        </div>

        {/* Form card */}
        <div className="glass rounded-2xl p-8 cyber-border">
          {mode === 'verify-otp' ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-primary/10">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-center">Verify your email</h2>
              <p className="text-muted-foreground mb-6 text-center">
                We sent a 6-digit code to<br />
                <span className="text-foreground font-medium">{email}</span>
              </p>

              <div className="flex justify-center mb-6">
                <InputOTP 
                  maxLength={6} 
                  value={otpCode}
                  onChange={(value) => setOtpCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                className="w-full mb-4"
                variant="hero"
                onClick={handleVerifyOtp}
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Verify & Continue
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive the code?
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sendOtp}
                  disabled={loading || resendCooldown > 0}
                  className="text-primary"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">
                {mode === 'login' && 'Welcome back'}
                {mode === 'signup' && 'Create your account'}
                {mode === 'forgot' && 'Reset your password'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {mode === 'login' && 'Sign in to continue your learning journey'}
                {mode === 'signup' && 'Start your cybersecurity learning adventure'}
                {mode === 'forgot' && "Enter your email and we'll send you a reset link"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}

                    {/* Password Strength Indicator - only show for signup */}
                    {mode === 'signup' && password.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {/* Strength bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Password Strength</span>
                            <span className={`font-medium ${
                              passwordStrength.score <= 1 ? 'text-destructive' :
                              passwordStrength.score <= 2 ? 'text-orange-500' :
                              passwordStrength.score <= 3 ? 'text-yellow-500' :
                              passwordStrength.score <= 4 ? 'text-primary' : 'text-green-500'
                            }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Requirements checklist */}
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className={`flex items-center gap-1.5 ${passwordStrength.checks.length ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {passwordStrength.checks.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            8+ characters
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordStrength.checks.uppercase ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {passwordStrength.checks.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            Uppercase letter
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordStrength.checks.lowercase ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {passwordStrength.checks.lowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            Lowercase letter
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordStrength.checks.number ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {passwordStrength.checks.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            Number
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordStrength.checks.special ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {passwordStrength.checks.special ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            Special character
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                {/* Forgot Password Link - only show for login */}
                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => switchMode('forgot')}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  variant="hero"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === 'login' ? (
                    'Sign In'
                  ) : mode === 'signup' ? (
                    'Create Account'
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>

              {mode !== 'forgot' && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    >
                      {mode === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
