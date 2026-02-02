import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  ChevronRight, 
  Award, 
  BookOpen,
  Trophy,
  Loader2,
  PlayCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CourseProgress {
  id: string;
  course_id: string;
  started_at: string;
  completed_at: string | null;
  current_module_index: number;
  total_xp_earned: number;
  is_completed: boolean;
  course: {
    id: string;
    title: string;
    color: string;
    total_xp: number;
    estimated_hours: number;
  };
  totalModules: number;
  completedModules: number;
}

export const CourseProgressCard = () => {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCourseXP, setTotalCourseXP] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourseProgress = async () => {
      if (!user) return;

      try {
        // Fetch user's course progress with course details
        const { data: progressData, error: progressError } = await supabase
          .from('user_course_progress')
          .select(`
            id,
            course_id,
            started_at,
            completed_at,
            current_module_index,
            total_xp_earned,
            is_completed,
            courses (
              id,
              title,
              color,
              total_xp,
              estimated_hours
            )
          `)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(4);

        if (progressError) throw progressError;

        // For each course, get module counts
        const coursesWithModules = await Promise.all(
          (progressData || []).map(async (progress) => {
            const { count: totalModules } = await supabase
              .from('course_modules')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', progress.course_id);

            const { count: completedModules } = await supabase
              .from('user_module_progress')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', progress.course_id)
              .eq('user_id', user.id)
              .not('completed_at', 'is', null);

            return {
              ...progress,
              course: progress.courses as CourseProgress['course'],
              totalModules: totalModules || 0,
              completedModules: completedModules || 0,
            };
          })
        );

        setCourses(coursesWithModules);
        setTotalCourseXP(coursesWithModules.reduce((acc, c) => acc + c.total_xp_earned, 0));
      } catch (error) {
        console.error('Error fetching course progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseProgress();
  }, [user]);

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 cyber-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="glass rounded-xl p-6 cyber-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Course Progress
          </h3>
        </div>
        <div className="text-center py-6">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No courses started yet</p>
          <Button onClick={() => navigate('/courses')}>
            Browse Courses
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 cyber-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          Course Progress
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <Award className="w-4 h-4 text-primary" />
          <span className="font-medium">{totalCourseXP} XP earned</span>
        </div>
      </div>

      <div className="space-y-4">
        {courses.map((courseProgress) => {
          const progressPercent = courseProgress.totalModules > 0 
            ? (courseProgress.completedModules / courseProgress.totalModules) * 100 
            : 0;

          return (
            <button
              key={courseProgress.id}
              onClick={() => navigate(`/courses/${courseProgress.course_id}`)}
              className="w-full text-left p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {courseProgress.is_completed ? (
                      <Trophy className="w-4 h-4 text-success flex-shrink-0" />
                    ) : (
                      <PlayCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                    <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {courseProgress.course.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{courseProgress.completedModules}/{courseProgress.totalModules} modules</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {courseProgress.total_xp_earned} XP
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progressPercent} className="h-2 flex-1" />
                <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Button 
        variant="outline" 
        className="w-full mt-4" 
        onClick={() => navigate('/courses')}
      >
        View All Courses
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
};
