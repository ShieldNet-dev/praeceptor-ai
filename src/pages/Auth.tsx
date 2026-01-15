import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Eye, EyeOff, Check, X, Fingerprint } from 'lucide-react';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

type AuthMode = 'login' | 'signup' | 'forgot';

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

// Helper to check if biometrics are available for any user
const checkBiometricsAvailable = (): string | null => {
  if (typeof window === 'undefined' || !('PublicKeyCredential' in window)) {
    return null;
  }
  // Check all localStorage keys for biometric credentials
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('biometrics_credential_')) {
      return key.replace('biometrics_credential_', '');
    }
  }
  return null;
};

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; fullName?: string }>({});
  const [biometricUserId, setBiometricUserId] = useState<string | null>(null);
  
  const { signIn, signUp, signInWithGoogle, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (user) {
      navigate('/onboarding');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check if biometric login is available
    const userId = checkBiometricsAvailable();
    setBiometricUserId(userId);
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/onboarding');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string; fullName?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    if (mode !== 'forgot') {
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
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/onboarding');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
            setMode('login');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully!');
          navigate('/onboarding');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleBiometricSignIn = async () => {
    if (!biometricUserId) return;
    
    setBiometricLoading(true);
    try {
      // Get stored credential data
      const credentialData = localStorage.getItem(`biometrics_credential_${biometricUserId}`);
      if (!credentialData) {
        toast.error('No biometric credentials found. Please sign in with password.');
        setBiometricLoading(false);
        return;
      }

      const { credentialId, email: storedEmail } = JSON.parse(credentialData);
      
      // Create assertion challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const getCredentialOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials: [{
            id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: 'required',
          timeout: 60000
        }
      };
      
      const assertion = await navigator.credentials.get(getCredentialOptions);
      
      if (assertion) {
        // Get the stored password for this user (encrypted in localStorage)
        const storedAuth = localStorage.getItem(`biometrics_auth_${biometricUserId}`);
        if (!storedAuth) {
          toast.error('Biometric credentials expired. Please sign in with password and re-enable biometrics.');
          setBiometricLoading(false);
          return;
        }
        
        const { password: storedPassword } = JSON.parse(storedAuth);
        
        // Sign in with stored credentials
        const { error } = await signIn(storedEmail, storedPassword);
        
        if (error) {
          toast.error('Biometric authentication failed. Please sign in with password.');
        } else {
          toast.success('Welcome back!');
          navigate('/onboarding');
        }
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.error('Biometric authentication was cancelled');
      } else {
        toast.error('Biometric authentication failed. Please sign in with password.');
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setConfirmPassword('');
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
          onClick={() => mode === 'forgot' ? switchMode('login') : navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {mode === 'forgot' ? 'Back to sign in' : 'Back to home'}
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

          {/* Sign-in options - only show for login/signup */}
          {mode !== 'forgot' && (
            <>
              {/* Biometric Sign In - only show if available and in login mode */}
              {mode === 'login' && biometricUserId && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-3 gap-3 border-accent/50 hover:border-accent hover:bg-accent/10"
                  onClick={handleBiometricSignIn}
                  disabled={biometricLoading || loading || googleLoading}
                >
                  {biometricLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Fingerprint className="w-5 h-5 text-accent" />
                  )}
                  Sign in with Biometrics
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full mb-6 gap-3"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading || biometricLoading}
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
            </>
          )}

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
              disabled={loading || googleLoading}
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
        </div>
      </div>
    </div>
  );
};

export default Auth;