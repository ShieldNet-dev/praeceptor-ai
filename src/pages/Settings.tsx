import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Camera
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
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [existingReview, setExistingReview] = useState<{ id: string; rating: number; review_text: string } | null>(null);
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

        // Fetch existing review
        const { data: reviewData } = await supabase
          .from('app_reviews')
          .select('id, rating, review_text')
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
          setMfaEnabled(factors.totp.some(f => f.status === 'verified'));
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
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;

      // In a real implementation, you'd show a QR code for the user to scan
      toast.info('MFA enrollment started. Please scan the QR code with your authenticator app.');
      console.log('TOTP setup:', data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to enable MFA');
    }
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
              <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
              
              <div className="space-y-6">
                {/* MFA Section */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication (2FA)</h3>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security with authenticator app
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {mfaEnabled ? (
                      <span className="text-sm text-emerald-500 font-medium">Enabled</span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleEnableMFA}>
                        Enable
                      </Button>
                    )}
                  </div>
                </div>

                {/* Biometrics Info */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-accent/20">
                      <Lock className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium">Biometric Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        Use fingerprint or face recognition (device dependent)
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {typeof window !== 'undefined' && 'PublicKeyCredential' in window 
                      ? 'Available' 
                      : 'Not supported'}
                  </span>
                </div>

                {/* Password Change Link */}
                <div className="pt-4 border-t border-border">
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
                    Change Password
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
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

              {existingReview && (
                <p className="text-sm text-muted-foreground mt-3">
                  You've already submitted a review. You can update it anytime.
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
