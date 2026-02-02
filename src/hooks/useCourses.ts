import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { 
  Course, 
  CourseModule, 
  UserCourseProgress, 
  UserModuleProgress,
  CourseWithProgress,
  ModuleWithProgress 
} from '@/types/courses';

export const useCourses = () => {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch all published courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('order_index');

      if (coursesError) throw coursesError;

      // Fetch all modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .order('order_index');

      if (modulesError) throw modulesError;

      // Fetch user's course progress
      const { data: courseProgress, error: progressError } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Fetch user's module progress
      const { data: moduleProgress, error: modProgressError } = await supabase
        .from('user_module_progress')
        .select('*')
        .eq('user_id', user.id);

      if (modProgressError) throw modProgressError;

      // Combine data
      const coursesWithProgress: CourseWithProgress[] = (coursesData as Course[]).map(course => {
        const courseModules = (modulesData as CourseModule[]).filter(m => m.course_id === course.id);
        const progress = (courseProgress as UserCourseProgress[])?.find(p => p.course_id === course.id);
        const modProgress = (moduleProgress as UserModuleProgress[])?.filter(p => p.course_id === course.id) || [];
        
        const completedModules = modProgress.filter(p => p.assessment_passed === true).length;

        return {
          ...course,
          modules: courseModules,
          progress,
          moduleProgress: modProgress,
          completedModules,
          totalModules: courseModules.length
        };
      });

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const startCourse = async (courseId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_course_progress')
        .insert({
          user_id: user.id,
          course_id: courseId,
          current_module_index: 0
        });

      if (error && error.code !== '23505') throw error; // Ignore duplicate key error
      
      await fetchCourses();
      return true;
    } catch (error) {
      console.error('Error starting course:', error);
      toast.error('Failed to start course');
      return false;
    }
  };

  const markModuleContentRead = async (moduleId: string, courseId: string) => {
    if (!user) return;

    try {
      // Check if progress exists
      const { data: existing } = await supabase
        .from('user_module_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .single();

      if (existing) {
        await supabase
          .from('user_module_progress')
          .update({ content_read: true })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_module_progress')
          .insert({
            user_id: user.id,
            module_id: moduleId,
            course_id: courseId,
            content_read: true
          });
      }

      await fetchCourses();
    } catch (error) {
      console.error('Error marking content read:', error);
    }
  };

  const completeModuleAssessment = async (
    moduleId: string, 
    courseId: string, 
    passed: boolean, 
    score: number,
    xpReward: number
  ) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('user_module_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .single();

      const xpEarned = passed ? xpReward : Math.floor(xpReward / 3);

      if (existing) {
        await supabase
          .from('user_module_progress')
          .update({ 
            assessment_passed: passed,
            assessment_score: score,
            completed_at: passed ? new Date().toISOString() : null,
            xp_earned: xpEarned
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_module_progress')
          .insert({
            user_id: user.id,
            module_id: moduleId,
            course_id: courseId,
            content_read: true,
            assessment_passed: passed,
            assessment_score: score,
            completed_at: passed ? new Date().toISOString() : null,
            xp_earned: xpEarned
          });
      }

      // Update user's overall XP
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('id, xp_points')
        .eq('user_id', user.id)
        .eq('track', 'learning')
        .single();

      if (progressData) {
        await supabase
          .from('user_progress')
          .update({ 
            xp_points: progressData.xp_points + xpEarned,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', progressData.id);
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            track: 'learning',
            xp_points: xpEarned
          });
      }

      if (passed) {
        toast.success(`+${xpEarned} XP earned!`, {
          description: 'Module assessment passed!'
        });
      } else {
        toast.info(`+${xpEarned} XP for trying!`, {
          description: 'Review the material and try again.'
        });
      }

      // Update course progress
      await updateCourseProgress(courseId);
      await fetchCourses();
      
      return true;
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast.error('Failed to save assessment result');
      return false;
    }
  };

  const updateCourseProgress = async (courseId: string) => {
    if (!user) return;

    try {
      // Get all modules for this course
      const { data: modules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!modules) return;

      // Get completed modules
      const { data: completedModules } = await supabase
        .from('user_module_progress')
        .select('id, xp_earned')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('assessment_passed', true);

      const totalXp = completedModules?.reduce((sum, m) => sum + (m.xp_earned || 0), 0) || 0;
      const allCompleted = completedModules?.length === modules.length;

      await supabase
        .from('user_course_progress')
        .update({
          current_module_index: completedModules?.length || 0,
          total_xp_earned: totalXp,
          is_completed: allCompleted,
          completed_at: allCompleted ? new Date().toISOString() : null
        })
        .eq('user_id', user.id)
        .eq('course_id', courseId);

    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  return {
    courses,
    loading,
    fetchCourses,
    startCourse,
    markModuleContentRead,
    completeModuleAssessment
  };
};

export const useCourseDetails = (courseId: string) => {
  const [course, setCourse] = useState<CourseWithProgress | null>(null);
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCourseDetails = async () => {
    if (!user || !courseId) return;

    setLoading(true);
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (modulesError) throw modulesError;

      // Fetch user's course progress
      const { data: courseProgress } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      // Fetch user's module progress
      const { data: moduleProgress } = await supabase
        .from('user_module_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      // Process modules with progress
      const modulesWithProgress: ModuleWithProgress[] = (modulesData as CourseModule[]).map((module, index) => {
        const progress = (moduleProgress as UserModuleProgress[])?.find(p => p.module_id === module.id);
        const isCompleted = progress?.assessment_passed === true;
        
        // Module is locked if previous module is not completed (except first module)
        let isLocked = false;
        if (index > 0) {
          const prevModule = modulesData[index - 1];
          const prevProgress = (moduleProgress as UserModuleProgress[])?.find(p => p.module_id === prevModule.id);
          isLocked = prevProgress?.assessment_passed !== true;
        }

        return {
          ...module,
          progress,
          isLocked,
          isCompleted
        };
      });

      const completedCount = modulesWithProgress.filter(m => m.isCompleted).length;

      setCourse({
        ...(courseData as Course),
        modules: modulesData as CourseModule[],
        progress: courseProgress as UserCourseProgress,
        moduleProgress: moduleProgress as UserModuleProgress[] || [],
        completedModules: completedCount,
        totalModules: modulesData.length
      });

      setModules(modulesWithProgress);
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [user, courseId]);

  return { course, modules, loading, refetch: fetchCourseDetails };
};
