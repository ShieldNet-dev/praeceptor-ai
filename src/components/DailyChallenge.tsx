import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useXP } from '@/hooks/useXP';
import { Zap, CheckCircle, XCircle, Trophy, Loader2 } from 'lucide-react';

interface DailyChallenge {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: string;
  xp_reward: number;
}

export const DailyChallenge = () => {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const { user } = useAuth();
  const { completeDailyChallenge } = useXP();

  useEffect(() => {
    const fetchDailyChallenge = async () => {
      if (!user) return;

      try {
        // Get today's challenge
        const today = new Date().toISOString().split('T')[0];
        const { data: challengeData, error: challengeError } = await supabase
          .from('daily_challenges')
          .select('*')
          .eq('challenge_date', today)
          .single();

        if (challengeError || !challengeData) {
          setLoading(false);
          return;
        }

        // Parse options from JSONB
        const parsedChallenge: DailyChallenge = {
          ...challengeData,
          options: typeof challengeData.options === 'string' 
            ? JSON.parse(challengeData.options) 
            : challengeData.options
        };

        setChallenge(parsedChallenge);

        // Check if user already completed this challenge
        const { data: progress } = await supabase
          .from('user_daily_challenge_progress')
          .select('was_correct')
          .eq('user_id', user.id)
          .eq('challenge_id', challengeData.id)
          .single();

        if (progress) {
          setAlreadyCompleted(true);
          setHasAnswered(true);
          setWasCorrect(progress.was_correct);
        }
      } catch (error) {
        console.error('Error fetching daily challenge:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyChallenge();
  }, [user]);

  const handleSubmit = async () => {
    if (!challenge || selectedAnswer === null || !user) return;

    setSubmitting(true);
    const correct = selectedAnswer === challenge.correct_answer;
    setWasCorrect(correct);
    setHasAnswered(true);

    await completeDailyChallenge(
      user.id,
      challenge.id,
      correct,
      challenge.xp_reward
    );

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 cyber-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="glass rounded-xl p-6 cyber-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Daily Cyber Challenge</h3>
            <p className="text-sm text-muted-foreground">No challenge available today</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 cyber-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Daily Cyber Challenge</h3>
            <p className="text-sm text-muted-foreground">
              {alreadyCompleted ? 'Completed!' : 'Test your knowledge'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
          <Zap className="w-4 h-4" />
          +{challenge.xp_reward} XP
        </div>
      </div>

      <p className="text-foreground mb-4">{challenge.question}</p>

      <div className="space-y-2 mb-4">
        {challenge.options.map((option, index) => {
          let buttonClass = "w-full justify-start text-left h-auto py-3 px-4";
          
          if (hasAnswered) {
            if (index === challenge.correct_answer) {
              buttonClass += " bg-green-500/20 border-green-500/50 text-green-400";
            } else if (index === selectedAnswer && !wasCorrect) {
              buttonClass += " bg-red-500/20 border-red-500/50 text-red-400";
            }
          } else if (selectedAnswer === index) {
            buttonClass += " bg-primary/20 border-primary";
          }

          return (
            <Button
              key={index}
              variant="outline"
              className={buttonClass}
              onClick={() => !hasAnswered && setSelectedAnswer(index)}
              disabled={hasAnswered}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
                {hasAnswered && index === challenge.correct_answer && (
                  <CheckCircle className="w-4 h-4 ml-auto text-green-500" />
                )}
                {hasAnswered && index === selectedAnswer && !wasCorrect && (
                  <XCircle className="w-4 h-4 ml-auto text-red-500" />
                )}
              </span>
            </Button>
          );
        })}
      </div>

      {hasAnswered ? (
        <div className={`p-4 rounded-lg ${wasCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
          <p className={`text-sm ${wasCorrect ? 'text-green-400' : 'text-amber-400'}`}>
            {wasCorrect ? '🎉 Correct!' : '💡 Keep learning!'} {challenge.explanation}
          </p>
        </div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={selectedAnswer === null || submitting}
          className="w-full"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Submit Answer
        </Button>
      )}
    </div>
  );
};
