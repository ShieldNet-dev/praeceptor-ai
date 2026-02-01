import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const useStreakTracker = (user: User | null) => {
  useEffect(() => {
    const updateStreak = async () => {
      if (!user) return;

      try {
        // Get all user progress records
        const { data: progressRecords, error: fetchError } = await supabase
          .from('user_progress')
          .select('id, streak_days, last_activity_at')
          .eq('user_id', user.id);

        if (fetchError || !progressRecords || progressRecords.length === 0) {
          return;
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        for (const progress of progressRecords) {
          const lastActivity = new Date(progress.last_activity_at);
          const lastActivityDate = new Date(
            lastActivity.getFullYear(),
            lastActivity.getMonth(),
            lastActivity.getDate()
          );

          // Calculate days difference
          const diffTime = todayStart.getTime() - lastActivityDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          let newStreakDays = progress.streak_days;

          if (diffDays === 0) {
            // Same day - no update needed
            continue;
          } else if (diffDays === 1) {
            // Consecutive day - increment streak
            newStreakDays = progress.streak_days + 1;
          } else {
            // Streak broken - reset to 1
            newStreakDays = 1;
          }

          // Update the progress record
          await supabase
            .from('user_progress')
            .update({
              streak_days: newStreakDays,
              last_activity_at: now.toISOString()
            })
            .eq('id', progress.id);
        }
      } catch (error) {
        console.error('Error updating streak:', error);
      }
    };

    updateStreak();
  }, [user]);
};
