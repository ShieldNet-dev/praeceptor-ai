-- Create lessons table for structured cybersecurity topics
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  xp_reward INTEGER NOT NULL DEFAULT 50,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_lesson_progress to track completed lessons
CREATE TABLE public.user_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);

-- Create daily_challenges table for daily cyber questions
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer INTEGER NOT NULL, -- Index of correct option (0-based)
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  xp_reward INTEGER NOT NULL DEFAULT 15,
  challenge_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_daily_challenge_progress to track completed daily challenges
CREATE TABLE public.user_daily_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  was_correct BOOLEAN NOT NULL DEFAULT false,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS on all tables
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Lessons policies (anyone can view published lessons)
CREATE POLICY "Anyone can view published lessons" 
ON public.lessons 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage lessons" 
ON public.lessons 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- User lesson progress policies
CREATE POLICY "Users can view their own lesson progress" 
ON public.user_lesson_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson progress" 
ON public.user_lesson_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Daily challenges policies (anyone authenticated can view today's challenge)
CREATE POLICY "Authenticated users can view daily challenges" 
ON public.daily_challenges 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage daily challenges" 
ON public.daily_challenges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- User daily challenge progress policies
CREATE POLICY "Users can view their own challenge progress" 
ON public.user_daily_challenge_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own challenge progress" 
ON public.user_daily_challenge_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at on lessons
CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();