import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type GuidanceTrack = Database['public']['Enums']['guidance_track'];

export const useXP = () => {
  const awardXP = async (userId: string, track: GuidanceTrack, xpAmount: number) => {
    try {
      // Get current progress for this track
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('id, xp_points')
        .eq('user_id', userId)
        .eq('track', track)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProgress) {
        // Update existing progress
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            xp_points: existingProgress.xp_points + xpAmount,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (updateError) throw updateError;
      } else {
        // Create new progress entry
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert([{
            user_id: userId,
            track: track,
            xp_points: xpAmount,
            last_activity_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error awarding XP:', error);
      return false;
    }
  };

  const completeLesson = async (userId: string, lessonId: string, xpReward: number, track: GuidanceTrack) => {
    try {
      // Check if already completed
      const { data: existing } = await supabase
        .from('user_lesson_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      if (existing) {
        toast.info('You\'ve already completed this lesson!');
        return false;
      }

      // Record completion
      const { error: progressError } = await supabase
        .from('user_lesson_progress')
        .insert([{
          user_id: userId,
          lesson_id: lessonId,
          xp_earned: xpReward
        }]);

      if (progressError) throw progressError;

      // Award XP
      await awardXP(userId, track, xpReward);

      toast.success(`+${xpReward} XP earned!`, {
        description: 'Lesson completed successfully!'
      });

      return true;
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error('Failed to record progress');
      return false;
    }
  };

  const completeDailyChallenge = async (
    userId: string, 
    challengeId: string, 
    wasCorrect: boolean, 
    xpReward: number,
    track: GuidanceTrack = 'learning'
  ) => {
    try {
      // Check if already completed
      const { data: existing } = await supabase
        .from('user_daily_challenge_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .single();

      if (existing) {
        toast.info('You\'ve already answered today\'s challenge!');
        return false;
      }

      // Calculate XP (full for correct, partial for attempting)
      const earnedXP = wasCorrect ? xpReward : Math.floor(xpReward / 3);

      // Record completion
      const { error: progressError } = await supabase
        .from('user_daily_challenge_progress')
        .insert([{
          user_id: userId,
          challenge_id: challengeId,
          was_correct: wasCorrect,
          xp_earned: earnedXP
        }]);

      if (progressError) throw progressError;

      // Award XP
      await awardXP(userId, track, earnedXP);

      if (wasCorrect) {
        toast.success(`Correct! +${earnedXP} XP earned!`, {
          description: 'Great job on today\'s challenge!'
        });
      } else {
        toast.info(`+${earnedXP} XP for trying!`, {
          description: 'Keep learning and try again tomorrow!'
        });
      }

      return true;
    } catch (error) {
      console.error('Error completing daily challenge:', error);
      toast.error('Failed to record progress');
      return false;
    }
  };

  return {
    awardXP,
    completeLesson,
    completeDailyChallenge
  };
};
