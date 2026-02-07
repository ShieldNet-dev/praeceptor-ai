import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  achievement_type: 'module_completion' | 'assessment_pass' | 'daily_challenge' | 'course_completion' | 'streak' | 'referral';
  title: string;
  description: string;
  badge_name: string;
  badge_icon: string;
  xp_earned: number;
  share_token: string;
  created_at: string;
}

const BADGE_NAMES: Record<string, string[]> = {
  module_completion: ['Security Initiate', 'Protocol Master', 'Defense Scholar', 'Cyber Guardian'],
  assessment_pass: ['Quick Learner', 'Sharp Mind', 'Knowledge Keeper', 'Assessment Ace'],
  daily_challenge: ['Daily Defender', 'Challenge Champion', 'Streak Warrior', 'Quiz Master'],
  course_completion: ['Course Graduate', 'Certified Learner', 'Path Completer', 'Security Expert'],
  streak: ['Consistency King', 'Dedication Master', 'Streak Legend', 'Unstoppable'],
  referral: ['Community Builder', 'Mentor Rank I', 'Mentor Rank II', 'Community Leader'],
};

const BADGE_ICONS: Record<string, string> = {
  module_completion: 'shield',
  assessment_pass: 'target',
  daily_challenge: 'trophy',
  course_completion: 'award',
  streak: 'flame',
  referral: 'zap',
};

export const useAchievements = () => {
  const { user } = useAuth();
  const [latestAchievement, setLatestAchievement] = useState<Achievement | null>(null);
  const [showAchievementCard, setShowAchievementCard] = useState(false);

  const createAchievement = useCallback(async (
    type: Achievement['achievement_type'],
    title: string,
    description: string,
    xpEarned: number,
    badgeIndex: number = 0
  ) => {
    if (!user) return null;

    try {
      const badgeName = BADGE_NAMES[type]?.[Math.min(badgeIndex, BADGE_NAMES[type].length - 1)] || 'Achievement';
      const badgeIcon = BADGE_ICONS[type] || 'award';

      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_type: type,
          title,
          description,
          badge_name: badgeName,
          badge_icon: badgeIcon,
          xp_earned: xpEarned,
        })
        .select()
        .single();

      if (error) throw error;

      const achievement = data as Achievement;
      setLatestAchievement(achievement);
      setShowAchievementCard(true);
      
      return achievement;
    } catch (error) {
      console.error('Error creating achievement:', error);
      return null;
    }
  }, [user]);

  const closeAchievementCard = useCallback(() => {
    setShowAchievementCard(false);
  }, []);

  const fetchUserAchievements = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }, [user]);

  return {
    createAchievement,
    latestAchievement,
    showAchievementCard,
    closeAchievementCard,
    fetchUserAchievements,
  };
};
