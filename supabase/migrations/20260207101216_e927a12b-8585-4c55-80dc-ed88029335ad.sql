-- =============================================
-- ACHIEVEMENT & VIRAL FEATURES DATABASE SCHEMA
-- =============================================

-- 1. USER ACHIEVEMENTS TABLE (for shareable achievement cards)
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('module_completion', 'assessment_pass', 'daily_challenge', 'course_completion', 'streak', 'referral')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT DEFAULT 'award',
  xp_earned INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- User can view their own achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- User can create their own achievements  
CREATE POLICY "Users can create their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view public achievements via share token (for sharing)
CREATE POLICY "Anyone can view achievements by share token"
  ON public.user_achievements FOR SELECT
  USING (share_token IS NOT NULL);

-- 2. LEADERBOARD PREFERENCES TABLE
CREATE TABLE public.leaderboard_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leaderboard_preferences ENABLE ROW LEVEL SECURITY;

-- User can view their own preferences
CREATE POLICY "Users can view their own leaderboard preferences"
  ON public.leaderboard_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- User can create their own preferences
CREATE POLICY "Users can create their own leaderboard preferences"
  ON public.leaderboard_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User can update their own preferences
CREATE POLICY "Users can update their own leaderboard preferences"
  ON public.leaderboard_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. CERTIFICATES TABLE
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('module', 'course', 'assessment')),
  title TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  course_name TEXT,
  module_name TEXT,
  completion_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verification_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- User can view their own certificates
CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = user_id);

-- User can create their own certificates
CREATE POLICY "Users can create their own certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view certificates by verification code
CREATE POLICY "Anyone can view certificates by verification code"
  ON public.certificates FOR SELECT
  USING (verification_code IS NOT NULL);

-- 4. REFERRALS TABLE
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID,
  referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'base64'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'completed_lesson', 'rewarded')),
  xp_bonus_given INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- User can view their own referrals (as referrer)
CREATE POLICY "Users can view their referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- User can create referral invites
CREATE POLICY "Users can create referral invites"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- System can update referrals (via service role, but allow users to see updates)
CREATE POLICY "Users can see referral updates"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referred_id OR auth.uid() = referrer_id);

-- Allow update for referred user claiming
CREATE POLICY "Allow referral claims"
  ON public.referrals FOR UPDATE
  USING (referred_id IS NULL OR auth.uid() = referrer_id);

-- 5. ADD REFERRAL CODE TO PROFILES (for unique user referral links)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'base64'),
ADD COLUMN IF NOT EXISTS referred_by UUID,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;

-- 6. WEEKLY XP TRACKING VIEW
CREATE OR REPLACE VIEW public.weekly_xp_leaderboard AS
SELECT 
  p.user_id,
  COALESCE(lp.display_name, pr.full_name, 'Anonymous') as display_name,
  pr.avatar_url,
  SUM(p.xp_points) as total_xp,
  MAX(p.streak_days) as max_streak,
  COALESCE(lp.is_visible, true) as is_visible,
  ROW_NUMBER() OVER (ORDER BY SUM(p.xp_points) DESC) as rank
FROM public.user_progress p
LEFT JOIN public.profiles pr ON p.user_id = pr.user_id
LEFT JOIN public.leaderboard_preferences lp ON p.user_id = lp.user_id
WHERE p.last_activity_at >= NOW() - INTERVAL '7 days'
GROUP BY p.user_id, lp.display_name, pr.full_name, pr.avatar_url, lp.is_visible;

-- 7. ALL TIME LEADERBOARD VIEW
CREATE OR REPLACE VIEW public.alltime_xp_leaderboard AS
SELECT 
  p.user_id,
  COALESCE(lp.display_name, pr.full_name, 'Anonymous') as display_name,
  pr.avatar_url,
  SUM(p.xp_points) as total_xp,
  MAX(p.streak_days) as max_streak,
  COALESCE(lp.is_visible, true) as is_visible,
  ROW_NUMBER() OVER (ORDER BY SUM(p.xp_points) DESC) as rank
FROM public.user_progress p
LEFT JOIN public.profiles pr ON p.user_id = pr.user_id
LEFT JOIN public.leaderboard_preferences lp ON p.user_id = lp.user_id
GROUP BY p.user_id, lp.display_name, pr.full_name, pr.avatar_url, lp.is_visible;

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_share_token ON public.user_achievements(share_token);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON public.certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);

-- 9. TRIGGER FOR UPDATED_AT ON LEADERBOARD PREFERENCES
CREATE OR REPLACE TRIGGER update_leaderboard_preferences_updated_at
BEFORE UPDATE ON public.leaderboard_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();