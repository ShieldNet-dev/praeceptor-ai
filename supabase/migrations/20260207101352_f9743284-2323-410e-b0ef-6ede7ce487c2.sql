-- Fix Security Definer View issues by recreating with SECURITY INVOKER

-- Drop existing views
DROP VIEW IF EXISTS public.weekly_xp_leaderboard;
DROP VIEW IF EXISTS public.alltime_xp_leaderboard;

-- Recreate WEEKLY XP LEADERBOARD VIEW with SECURITY INVOKER
CREATE VIEW public.weekly_xp_leaderboard 
WITH (security_invoker = true)
AS
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

-- Recreate ALL TIME LEADERBOARD VIEW with SECURITY INVOKER
CREATE VIEW public.alltime_xp_leaderboard 
WITH (security_invoker = true)
AS
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

-- Grant access to authenticated users for the views
GRANT SELECT ON public.weekly_xp_leaderboard TO authenticated;
GRANT SELECT ON public.alltime_xp_leaderboard TO authenticated;

-- Add RLS policy for leaderboard data - allow everyone to see visible profiles
CREATE POLICY "Anyone can view visible leaderboard entries"
  ON public.leaderboard_preferences FOR SELECT
  USING (is_visible = true);

-- Update profiles policy to allow viewing for leaderboard (public display names)
CREATE POLICY "Anyone can view basic profile info for leaderboard"
  ON public.profiles FOR SELECT
  USING (true);