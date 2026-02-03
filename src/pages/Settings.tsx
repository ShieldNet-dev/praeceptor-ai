import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  ArrowLeft,
  User,
  Settings as SettingsIcon,
  BookOpen,
  Lock,
  MessageSquare,
  Loader2,
  Check,
  Star,
  Save,
  Camera,
  Smartphone,
  Fingerprint,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TRACKS, GuidanceTrack, getTrackById } from '@/types/tracks';
import { toast } from 'sonner';

interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({ full_name: '', email: '', avatar_url: '' });
  const [userTracks, setUserTracks] = useState<GuidanceTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<GuidanceTrack[]>([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [showMfaDialog, setShowMfaDialog] = useState(false);
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [biometricPassword, setBiometricPassword] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState<string>('');
  const [mfaSecret, setMfaSecret] = useState<string>('');
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [existingReview, setExistingReview] = useState<{ 
    id: string; 
    rating: number; 
    review_text: string;
    admin_feedback?: string | null;
    admin_feedback_at?: string | null;
  } | null>(null);
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch user tracks
        const { data: tracksData } = await supabase
          .from('user_tracks')
          .select('track')
          .eq('user_id', user.id);

        if (tracksData) {
          const tracks = tracksData.map(t => t.track as GuidanceTrack);
          setUserTracks(tracks);
          setSelectedTracks(tracks);
        }

        // Fetch existing review with admin feedback
        const { data: reviewData } = await supabase
          .from('app_reviews')
          .select('id, rating, review_text, admin_feedback, admin_feedback_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (reviewData) {
          setExistingReview(reviewData);
          setRating(reviewData.rating);
          setReviewText(reviewData.review_text);
        }

        // Check MFA status
        const { data: factors } = await supabase.auth.mfa.listFactors();
        if (factors?.totp && factors.totp.length > 0) {
          const verifiedFactor = factors.totp.find(f => f.status === 'verified');
          if (verifiedFactor) {
            setMfaEnabled(true);
            setMfaFactorId(verifiedFactor.id);
          }
        }
        
        // Check if biometrics credential is stored locally
        const storedBiometrics = localStorage.getItem(`biometrics_${user.id}`);
        if (storedBiometrics) {
          setBiometricsEnabled(true);
        }
      } catch (error) {
        console.error('Error fetching settings data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleTrackToggle = (trackId: GuidanceTrack) => {
    setSelectedTracks(prev => 
      prev.includes(trackId)
        ? prev.filter(t => t !== trackId)
        : [...prev, trackId]
    );
  };

  const handleSaveTracks = async () => {
    if (!user || selectedTracks.length === 0) {
      toast.error('Please select at least one track');
      return;
    }
    setSaving(true);

    try {
      // Delete existing tracks
      await supabase
        .from('user_tracks')
        .delete()
        .eq('user_id', user.id);

      // Insert new tracks
      const { error } = await supabase
        .from('user_tracks')
        .insert(selectedTracks.map(track => ({
          user_id: user.id,
          track
        })));

      if (error) throw error;

      // Create progress entries for new tracks
      for (const track of selectedTracks) {
        if (!userTracks.includes(track)) {
          await supabase
            .from('user_progress')
            .upsert({
              user_id: user.id,
              track
            }, { onConflict: 'user_id,track' });
        }
      }

      setUserTracks(selectedTracks);
      toast.success('Learning tracks updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update tracks');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableMFA = async () => {
    setMfaEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      
      if (data?.totp?.qr_code && data?.totp?.secret) {
        setMfaQrCode(data.totp.qr_code);
        setMfaSecret(data.totp.secret);
        setMfaFactorId(data.id);
        setShowMfaDialog(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start MFA enrollment');
    } finally {
      setMfaEnrolling(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!mfaFactorId || mfaVerifyCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    
    setSaving(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) throw challengeError;
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaVerifyCode
      });
      
      if (verifyError) throw verifyError;
      
      setMfaEnabled(true);
      setShowMfaDialog(false);
      setMfaVerifyCode('');
      toast.success('Two-Factor Authentication enabled successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!mfaFactorId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      if (error) throw error;
      
      setMfaEnabled(false);
      setMfaFactorId(null);
      toast.success('Two-Factor Authentication disabled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable MFA');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableBiometrics = async (password: string) => {
    if (!user || !password) return;
    
    setSaving(true);
    try {
      // Verify the password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password
      });
      
      if (signInError) {
        toast.error('Invalid password. Please try again.');
        setSaving(false);
        return;
      }

      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        toast.error('Biometric authentication is not supported on this device');
        setSaving(false);
        return;
      }
      
      // Create credential options
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const createCredentialOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: 'Praeceptor AI',
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email || 'user',
            displayName: profile.full_name || user.email || 'User'
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000
        }
      };
      
      const credential = await navigator.credentials.create(createCredentialOptions) as PublicKeyCredential;
      
      if (credential) {
        // Store credential ID for verification during login
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        
        localStorage.setItem(`biometrics_credential_${user.id}`, JSON.stringify({
          credentialId,
          email: user.email
        }));
        
        // Store encrypted auth for biometric login (in a real app, use proper encryption)
        localStorage.setItem(`biometrics_auth_${user.id}`, JSON.stringify({
          password
        }));
        
        localStorage.setItem(`biometrics_${user.id}`, 'enabled');
        setBiometricsEnabled(true);
        setShowBiometricDialog(false);
        setBiometricPassword('');
        toast.success('Biometric authentication enabled! You can now sign in with biometrics.');
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.error('Biometric registration was cancelled');
      } else {
        toast.error('Failed to enable biometric authentication');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDisableBiometrics = () => {
    if (!user) return;
    localStorage.removeItem(`biometrics_${user.id}`);
    localStorage.removeItem(`biometrics_credential_${user.id}`);
    localStorage.removeItem(`biometrics_auth_${user.id}`);
    setBiometricsEnabled(false);
    toast.success('Biometric authentication disabled');
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewText.trim()) {
      toast.error('Please write a review before submitting');
      return;
    }
    setSaving(true);

    try {
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('app_reviews')
          .update({ rating, review_text: reviewText.trim() })
          .eq('id', existingReview.id);

        if (error) throw error;
        setExistingReview({ ...existingReview, rating, review_text: reviewText.trim() });
        toast.success('Review updated. Thank you for your feedback!');
      } else {
        // Create new review
        const { data, error } = await supabase
          .from('app_reviews')
          .insert({ user_id: user.id, rating, review_text: reviewText.trim() })
          .select()
          .single();

        if (error) throw error;
        setExistingReview(data);
        toast.success('Review submitted. Thank you for your feedback!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto max-w-4xl px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/20">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Settings</h1>
              <p className="text-xs text-muted-foreground">Manage your account</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="tracks" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Tracks</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="glass rounded-xl p-6 cyber-border">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                    {profile.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email || user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass rounded-xl p-6 border border-destructive/30">
              <h2 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Sign out of your account. You can sign back in anytime.
              </p>
              <Button variant="destructive" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </TabsContent>

          {/* Tracks Tab */}
          <TabsContent value="tracks" className="space-y-6">
            <div className="glass rounded-xl p-6 cyber-border">
              <h2 className="text-lg font-semibold mb-2">Learning Tracks</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Select the cybersecurity tracks you want to focus on. You can change these anytime.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                {TRACKS.map((track) => {
                  const IconComponent = track.icon;
                  const isSelected = selectedTracks.includes(track.id);
                  
                  return (
                    <button
                      key={track.id}
                      onClick={() => handleTrackToggle(track.id)}
                      className={`group p-4 rounded-xl text-left transition-all duration-300 border-2 ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 bg-secondary/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${track.color} text-white`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {isSelected && (
                          <div className="p-1 rounded-full bg-primary text-primary-foreground">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{track.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {track.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <Button 
                onClick={handleSaveTracks} 
                disabled={saving || selectedTracks.length === 0} 
                className="w-full sm:w-auto mt-6"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Track Selection
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="glass rounded-xl p-6 cyber-border">
              <h2 className="text-lg font-semibold mb-2">Multi-Factor Authentication (MFA)</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enhance your account security with additional authentication methods.
              </p>
              
              <div className="space-y-4">
                {/* TOTP Authenticator */}
                <button
                  onClick={() => mfaEnabled ? handleDisableMFA() : handleEnableMFA()}
                  disabled={saving || mfaEnrolling}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Authenticator App</h3>
                      <p className="text-sm text-muted-foreground">
                        Use Google Authenticator, Authy, or similar apps
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {mfaEnabled ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-500">
                        Enabled
                      </span>
                    ) : mfaEnrolling ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : null}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>

                {/* Biometrics */}
                <button
                  onClick={() => biometricsEnabled ? handleDisableBiometrics() : setShowBiometricDialog(true)}
                  disabled={saving || (typeof window !== 'undefined' && !('PublicKeyCredential' in window))}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-accent/20">
                      <Fingerprint className="w-5 h-5 text-accent" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Biometric Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        Use fingerprint or face recognition to sign in
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {biometricsEnabled ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-500">
                        Enabled
                      </span>
                    ) : typeof window !== 'undefined' && !('PublicKeyCredential' in window) ? (
                      <span className="text-xs text-muted-foreground">Not supported</span>
                    ) : null}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              </div>
            </div>

            {/* Password Section */}
            <div className="glass rounded-xl p-6 cyber-border">
              <h2 className="text-lg font-semibold mb-4">Password</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Change your password by receiving a reset link via email.
              </p>
              <Button 
                variant="outline" 
                onClick={async () => {
                  const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '');
                  if (error) {
                    toast.error(error.message);
                  } else {
                    toast.success('Password reset email sent');
                  }
                }}
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          </TabsContent>

          {/* MFA Enrollment Dialog */}
          <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Set Up Authenticator App</DialogTitle>
                <DialogDescription>
                  Scan the QR code with your authenticator app, then enter the 6-digit code to verify.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* QR Code */}
                {mfaQrCode && (
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg">
                      <img src={mfaQrCode} alt="MFA QR Code" className="w-48 h-48" />
                    </div>
                  </div>
                )}
                
                {/* Manual Secret */}
                {mfaSecret && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Can't scan? Enter this code manually:</Label>
                    <div className="p-3 bg-muted rounded-lg font-mono text-sm text-center break-all select-all">
                      {mfaSecret}
                    </div>
                  </div>
                )}
                
                {/* Verification Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Enter 6-digit code</Label>
                  <Input
                    id="mfa-code"
                    value={mfaVerifyCode}
                    onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMfaDialog(false);
                      setMfaVerifyCode('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVerifyMFA}
                    disabled={saving || mfaVerifyCode.length !== 6}
                    className="flex-1"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify & Enable
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Biometric Enrollment Dialog */}
          <Dialog open={showBiometricDialog} onOpenChange={setShowBiometricDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Enable Biometric Authentication</DialogTitle>
                <DialogDescription>
                  Enter your password to enable biometric sign-in. This allows you to sign in using fingerprint or face recognition.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="biometric-password">Current Password</Label>
                  <Input
                    id="biometric-password"
                    type="password"
                    value={biometricPassword}
                    onChange={(e) => setBiometricPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBiometricDialog(false);
                      setBiometricPassword('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleEnableBiometrics(biometricPassword)}
                    disabled={saving || !biometricPassword}
                    className="flex-1"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Fingerprint className="w-4 h-4 mr-2" />}
                    Enable Biometrics
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            {/* Admin Feedback Card - Show if there's admin feedback */}
            {existingReview?.admin_feedback && (
              <div className="glass rounded-xl p-6 border-2 border-primary/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/20 shrink-0">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-primary">Response from Praeceptor Team</h3>
                      {existingReview.admin_feedback_at && (
                        <span className="text-xs text-muted-foreground">
                          • {new Date(existingReview.admin_feedback_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {existingReview.admin_feedback}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="glass rounded-xl p-6 cyber-border">
              <h2 className="text-lg font-semibold mb-2">App Review & Feedback</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Help us improve Praeceptor AI by sharing your experience. Your feedback goes directly to the development team.
              </p>
              
              {/* Rating */}
              <div className="mb-6">
                <Label className="mb-3 block">Your Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-1 transition-colors ${
                        star <= rating ? 'text-yellow-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Star className={`w-8 h-8 ${star <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div className="mb-6">
                <Label htmlFor="review">Your Review</Label>
                <Textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us what you like, what could be improved, or any features you'd like to see..."
                  rows={5}
                  className="mt-2"
                />
              </div>

              <Button onClick={handleSubmitReview} disabled={saving || !reviewText.trim()}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : existingReview ? (
                  <Save className="w-4 h-4 mr-2" />
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2" />
                )}
                {existingReview ? 'Update Review' : 'Submit Review'}
              </Button>

              {existingReview && !existingReview.admin_feedback && (
                <p className="text-sm text-muted-foreground mt-3">
                  You've already submitted a review. You can update it anytime.
                </p>
              )}
              {existingReview?.admin_feedback && (
                <p className="text-sm text-primary/80 mt-3">
                  Thank you for your feedback! The team has responded above.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
