import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, ArrowLeft, Check, Loader2, User, Target, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TRACKS, GuidanceTrack } from '@/types/tracks';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type CareerGoal = 'learn_basics' | 'get_job' | 'advance_career' | 'certifications' | 'academic';
type Timeline = 'casual' | 'dedicated' | 'intensive';

interface OnboardingData {
  experienceLevel: ExperienceLevel | null;
  careerGoal: CareerGoal | null;
  timeline: Timeline | null;
  selectedTracks: GuidanceTrack[];
}

const EXPERIENCE_OPTIONS = [
  { id: 'beginner' as ExperienceLevel, label: 'Beginner', description: 'New to cybersecurity', icon: '🌱' },
  { id: 'intermediate' as ExperienceLevel, label: 'Intermediate', description: '1-3 years experience', icon: '🌿' },
  { id: 'advanced' as ExperienceLevel, label: 'Advanced', description: '3+ years experience', icon: '🌳' },
];

const GOAL_OPTIONS = [
  { id: 'learn_basics' as CareerGoal, label: 'Learn the Basics', description: 'Build foundational knowledge', icon: '📚' },
  { id: 'get_job' as CareerGoal, label: 'Get a Job in Cyber', description: 'Break into the industry', icon: '💼' },
  { id: 'advance_career' as CareerGoal, label: 'Advance My Career', description: 'Level up current role', icon: '🚀' },
  { id: 'certifications' as CareerGoal, label: 'Pass Certifications', description: 'Get certified', icon: '📜' },
  { id: 'academic' as CareerGoal, label: 'Academic Projects', description: 'SIWES, FYP, research', icon: '🎓' },
];

const TIMELINE_OPTIONS = [
  { id: 'casual' as Timeline, label: 'Casual', description: '2-3 hours/week', icon: '🐢' },
  { id: 'dedicated' as Timeline, label: 'Dedicated', description: '5-10 hours/week', icon: '🏃' },
  { id: 'intensive' as Timeline, label: 'Intensive', description: '15+ hours/week', icon: '🔥' },
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    experienceLevel: null,
    careerGoal: null,
    timeline: null,
    selectedTracks: [],
  });
  const [loading, setLoading] = useState(false);
  const [checkingTracks, setCheckingTracks] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const refreshSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !authLoading) {
        navigate('/auth');
      }
    };
    
    if (!authLoading && !user) {
      refreshSession();
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
        navigate('/dashboard');
      }
      setCheckingTracks(false);
    };

    if (user) {
      checkExistingTracks();
    }
  }, [user, navigate]);

  const toggleTrack = (trackId: GuidanceTrack) => {
    setData(prev => ({
      ...prev,
      selectedTracks: prev.selectedTracks.includes(trackId)
        ? prev.selectedTracks.filter((t) => t !== trackId)
        : [...prev.selectedTracks, trackId]
    }));
  };

  const getRecommendedTracks = (): GuidanceTrack[] => {
    const tracks: GuidanceTrack[] = ['learning']; // Always include learning
    
    if (data.careerGoal === 'get_job' || data.careerGoal === 'advance_career') {
      tracks.push('career');
    }
    if (data.careerGoal === 'certifications') {
      tracks.push('exam_prep');
    }
    if (data.careerGoal === 'academic') {
      tracks.push('academic', 'siwes');
    }
    if (data.experienceLevel === 'intermediate' || data.experienceLevel === 'advanced') {
      tracks.push('mentorship');
    }
    
    return [...new Set(tracks)];
  };

  const handleNext = () => {
    if (step === 3) {
      // Auto-select recommended tracks if none selected
      const recommended = getRecommendedTracks();
      setData(prev => ({
        ...prev,
        selectedTracks: recommended
      }));
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.experienceLevel !== null;
      case 2: return data.careerGoal !== null;
      case 3: return data.timeline !== null;
      case 4: return data.selectedTracks.length > 0;
      default: return false;
    }
  };

  const handleComplete = async () => {
    if (data.selectedTracks.length === 0) {
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
      const trackInserts = data.selectedTracks.map((track) => ({
        user_id: user.id,
        track,
      }));

      const { error: tracksError } = await supabase
        .from('user_tracks')
        .insert(trackInserts);

      if (tracksError) throw tracksError;

      // Initialize progress for each track
      const progressInserts = data.selectedTracks.map((track) => ({
        user_id: user.id,
        track,
      }));

      const { error: progressError } = await supabase
        .from('user_progress')
        .insert(progressInserts);

      if (progressError) throw progressError;

      toast.success('Welcome to Praeceptor AI! Let\'s begin your journey.');
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
    <div className="min-h-screen bg-background px-4 py-6 md:py-8">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-3xl relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">Praeceptor AI</span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Experience Level */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <User className="w-4 h-4" />
                Step 1 of 4
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">
                What's your <span className="text-gradient">experience level</span>?
              </h1>
              <p className="text-muted-foreground">
                This helps me adjust my teaching style to match where you are.
              </p>
            </div>

            <div className="grid gap-3 mb-8">
              {EXPERIENCE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setData(prev => ({ ...prev, experienceLevel: option.id }))}
                  className={`relative text-left p-5 rounded-xl transition-all duration-300 ${
                    data.experienceLevel === option.id
                      ? 'glass border-2 border-primary shadow-lg shadow-primary/20'
                      : 'glass border border-border/50 hover:border-primary/50'
                  }`}
                >
                  {data.experienceLevel === option.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{option.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{option.label}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Career Goal */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Target className="w-4 h-4" />
                Step 2 of 4
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">
                What's your <span className="text-gradient">main goal</span>?
              </h1>
              <p className="text-muted-foreground">
                I'll tailor my guidance to help you achieve it.
              </p>
            </div>

            <div className="grid gap-3 mb-8">
              {GOAL_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setData(prev => ({ ...prev, careerGoal: option.id }))}
                  className={`relative text-left p-5 rounded-xl transition-all duration-300 ${
                    data.careerGoal === option.id
                      ? 'glass border-2 border-primary shadow-lg shadow-primary/20'
                      : 'glass border border-border/50 hover:border-primary/50'
                  }`}
                >
                  {data.careerGoal === option.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{option.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{option.label}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Timeline */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Clock className="w-4 h-4" />
                Step 3 of 4
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">
                How much time can you <span className="text-gradient">dedicate</span>?
              </h1>
              <p className="text-muted-foreground">
                No judgment — consistency beats intensity.
              </p>
            </div>

            <div className="grid gap-3 mb-8">
              {TIMELINE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setData(prev => ({ ...prev, timeline: option.id }))}
                  className={`relative text-left p-5 rounded-xl transition-all duration-300 ${
                    data.timeline === option.id
                      ? 'glass border-2 border-primary shadow-lg shadow-primary/20'
                      : 'glass border border-border/50 hover:border-primary/50'
                  }`}
                >
                  {data.timeline === option.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{option.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{option.label}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Track Selection */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Step 4 of 4
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">
                Your <span className="text-gradient">recommended paths</span>
              </h1>
              <p className="text-muted-foreground">
                Based on your goals, here's what I recommend. You can customize these.
              </p>
            </div>

            {/* Recommended badge */}
            <Card className="glass cyber-border mb-4 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 inline mr-2 text-primary" />
                  I've pre-selected paths based on your {data.careerGoal?.replace('_', ' ')} goal. 
                  Adjust as needed!
                </p>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {TRACKS.map((track) => {
                const isSelected = data.selectedTracks.includes(track.id);
                const isRecommended = getRecommendedTracks().includes(track.id);
                const IconComponent = track.icon;
                
                return (
                  <button
                    key={track.id}
                    onClick={() => toggleTrack(track.id)}
                    className={`relative text-left p-4 rounded-xl transition-all duration-300 ${
                      isSelected
                        ? 'glass border-2 border-primary shadow-lg shadow-primary/20'
                        : 'glass border border-border/50 hover:border-primary/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    {isRecommended && !isSelected && (
                      <div className="absolute top-3 right-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          Recommended
                        </span>
                      </div>
                    )}

                    <div
                      className={`inline-flex p-2 rounded-lg mb-3 bg-gradient-to-br ${track.color} text-white`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <h3 className="font-semibold text-foreground mb-1">
                      {track.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {track.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 glass rounded-xl p-4">
          {step > 1 ? (
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {step < 4 ? (
                <>Select to continue</>
              ) : (
                <>{data.selectedTracks.length} path{data.selectedTracks.length !== 1 ? 's' : ''} selected</>
              )}
            </p>
          </div>

          {step < 4 ? (
            <Button
              variant="hero"
              disabled={!canProceed()}
              onClick={handleNext}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="hero"
              disabled={!canProceed() || loading}
              onClick={handleComplete}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Start Learning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
