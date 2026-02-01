import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useXP } from '@/hooks/useXP';
import { 
  BookOpen, 
  Zap, 
  CheckCircle, 
  ChevronRight, 
  ArrowLeft,
  Loader2,
  Lock
} from 'lucide-react';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  topic: string;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  xp_reward: number;
  order_index: number;
}

interface LessonProgress {
  lesson_id: string;
}

const Lessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { completeLesson } = useXP();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!user) return;

      try {
        // Fetch all lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('is_published', true)
          .order('topic')
          .order('order_index');

        if (lessonsError) throw lessonsError;
        setLessons(lessonsData || []);

        // Fetch user progress
        const { data: progressData } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id);

        if (progressData) {
          setCompletedLessons(new Set(progressData.map(p => p.lesson_id)));
        }
      } catch (error) {
        console.error('Error fetching lessons:', error);
        toast.error('Failed to load lessons');
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [user]);

  const handleCompleteLesson = async () => {
    if (!selectedLesson || !user) return;

    setCompleting(true);
    const success = await completeLesson(
      user.id,
      selectedLesson.id,
      selectedLesson.xp_reward,
      'learning'
    );

    if (success) {
      setCompletedLessons(prev => new Set([...prev, selectedLesson.id]));
    }
    setCompleting(false);
  };

  // Group lessons by topic
  const groupedLessons = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.topic]) {
      acc[lesson.topic] = [];
    }
    acc[lesson.topic].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const topicLabels: Record<string, string> = {
    'networking': '🌐 Networking',
    'cryptography': '🔐 Cryptography',
    'web-security': '🕸️ Web Security',
    'malware': '🦠 Malware Analysis'
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-500/20 text-green-400',
    intermediate: 'bg-amber-500/20 text-amber-400',
    advanced: 'bg-red-500/20 text-red-400'
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Lesson detail view
  if (selectedLesson) {
    const isCompleted = completedLessons.has(selectedLesson.id);

    return (
      <div className="min-h-screen bg-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        </div>

        <header className="sticky top-0 z-50 glass border-b border-border/50">
          <div className="container mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setSelectedLesson(null)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Lessons
            </Button>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-medium">{selectedLesson.xp_reward} XP</span>
            </div>
          </div>
        </header>

        <main className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
          <div className="mb-6">
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${difficultyColors[selectedLesson.difficulty]}`}>
              {selectedLesson.difficulty}
            </span>
            <h1 className="text-3xl font-bold mt-2 mb-2">{selectedLesson.title}</h1>
            <p className="text-muted-foreground">{selectedLesson.description}</p>
          </div>

          <div className="glass rounded-xl p-6 cyber-border mb-6">
            <div className="prose prose-invert max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedLesson.content}
              </p>
            </div>
          </div>

          {isCompleted ? (
            <div className="glass rounded-xl p-6 cyber-border bg-green-500/10 border-green-500/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-400">Lesson Completed!</p>
                  <p className="text-sm text-muted-foreground">You've earned {selectedLesson.xp_reward} XP for this lesson.</p>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={handleCompleteLesson} disabled={completing} size="lg" className="w-full">
              {completing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Mark as Complete (+{selectedLesson.xp_reward} XP)
            </Button>
          )}
        </main>
      </div>
    );
  }

  // Lessons list view
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
      </div>

      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-10 h-10" />
            <span className="text-lg font-bold text-foreground">Lessons</span>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Structured Lessons</h1>
          <p className="text-muted-foreground">
            Complete lessons to earn XP and build your cybersecurity knowledge.
          </p>
        </div>

        <div className="flex items-center gap-4 mb-6 p-4 glass rounded-xl cyber-border">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm">{completedLessons.size} / {lessons.length} completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm">
              {lessons.filter(l => completedLessons.has(l.id)).reduce((sum, l) => sum + l.xp_reward, 0)} XP earned
            </span>
          </div>
        </div>

        {Object.entries(groupedLessons).map(([topic, topicLessons]) => (
          <div key={topic} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{topicLabels[topic] || topic}</h2>
            <div className="space-y-3">
              {topicLessons.map((lesson, index) => {
                const isCompleted = completedLessons.has(lesson.id);
                const previousLesson = index > 0 ? topicLessons[index - 1] : null;
                const isLocked = previousLesson && !completedLessons.has(previousLesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => !isLocked && setSelectedLesson(lesson)}
                    disabled={isLocked}
                    className={`w-full glass rounded-xl p-4 cyber-border text-left transition-all duration-300 ${
                      isLocked 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                        {isLocked ? (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        ) : isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${difficultyColors[lesson.difficulty]}`}>
                            {lesson.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {lesson.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm text-primary">
                          <Zap className="w-4 h-4" />
                          {lesson.xp_reward}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default Lessons;
