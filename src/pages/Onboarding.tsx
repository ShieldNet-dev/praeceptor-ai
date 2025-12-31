import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TRACKS, GuidanceTrack } from '@/types/tracks';
import { toast } from 'sonner';

const Onboarding = () => {
  const [selectedTracks, setSelectedTracks] = useState<GuidanceTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingTracks, setCheckingTracks] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkExistingTracks = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_tracks')
        .select('track')
        .eq('user_id', user.id);
      
      if (!error && data && data.length > 0) {
        // User already has tracks, redirect to dashboard
        navigate('/dashboard');
      }
      setCheckingTracks(false);
    };

    if (user) {
      checkExistingTracks();
    }
  }, [user, navigate]);

  const toggleTrack = (trackId: GuidanceTrack) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId)
        ? prev.filter((t) => t !== trackId)
        : [...prev, trackId]
    );
  };

  const handleContinue = async () => {
    if (selectedTracks.length === 0) {
      toast.error('Please select at least one track to continue.');
      return;
    }

    if (!user) {
      toast.error('Please sign in to continue.');
      return;
    }

    setLoading(true);

    try {
      // Insert selected tracks
      const trackInserts = selectedTracks.map((track) => ({
        user_id: user.id,
        track,
      }));

      const { error: tracksError } = await supabase
        .from('user_tracks')
        .insert(trackInserts);

      if (tracksError) throw tracksError;

      // Initialize progress for each track
      const progressInserts = selectedTracks.map((track) => ({
        user_id: user.id,
        track,
      }));

      const { error: progressError } = await supabase
        .from('user_progress')
        .insert(progressInserts);

      if (progressError) throw progressError;

      toast.success('Tracks selected! Let\'s begin your journey.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save your selections.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingTracks) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">Praeceptor AI</span>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your <span className="text-gradient">Learning Path</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select one or more guidance tracks that match your goals. Praeceptor AI will adapt
            its teaching style based on your selections.
          </p>
        </div>

        {/* Track cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {TRACKS.map((track) => {
            const isSelected = selectedTracks.includes(track.id);
            const IconComponent = track.icon;
            
            return (
              <button
                key={track.id}
                onClick={() => toggleTrack(track.id)}
                className={`relative text-left p-6 rounded-xl transition-all duration-300 ${
                  isSelected
                    ? 'glass border-2 border-primary shadow-lg shadow-primary/20'
                    : 'glass border border-border/50 hover:border-primary/50'
                }`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`inline-flex p-3 rounded-lg mb-4 bg-gradient-to-br ${track.color} text-white`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {track.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {track.description}
                </p>

                {/* Features */}
                <ul className="space-y-1">
                  {track.features.slice(0, 2).map((feature) => (
                    <li
                      key={feature}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass rounded-xl p-6">
          <div>
            <p className="font-medium text-foreground">
              {selectedTracks.length === 0
                ? 'Select at least one track to continue'
                : `${selectedTracks.length} track${selectedTracks.length > 1 ? 's' : ''} selected`}
            </p>
            <p className="text-sm text-muted-foreground">
              You can change your tracks later in settings
            </p>
          </div>
          <Button
            variant="hero"
            size="lg"
            disabled={selectedTracks.length === 0 || loading}
            onClick={handleContinue}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
