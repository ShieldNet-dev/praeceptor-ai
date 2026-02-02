import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Lock,
  CheckCircle2,
  PlayCircle,
  Clock,
  Award,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Trophy
} from "lucide-react";
import { useCourseDetails, useCourses } from "@/hooks/useCourses";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { course, modules, loading, refetch } = useCourseDetails(courseId || '');
  const { startCourse } = useCourses();
  const [starting, setStarting] = useState(false);

  const handleStartCourse = async () => {
    if (!courseId) return;
    setStarting(true);
    await startCourse(courseId);
    await refetch();
    setStarting(false);
  };

  const handleModuleClick = (moduleId: string, isLocked: boolean) => {
    if (isLocked) return;
    navigate(`/courses/${courseId}/modules/${moduleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 glass shadow-lg">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex items-center justify-between h-16">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-40" />
              <div className="w-20" />
            </div>
          </div>
        </div>
        <main className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
        </div>
      </div>
    );
  }

  const progressPercent = course.totalModules > 0 
    ? (course.completedModules / course.totalModules) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass shadow-lg">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Courses
            </Button>
            <span className="text-lg font-bold text-foreground truncate max-w-[200px] md:max-w-none">
              {course.title}
            </span>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
        {/* Course Header Card */}
        <div className={`relative p-8 rounded-2xl bg-gradient-to-br ${course.color} mb-8 overflow-hidden`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs px-3 py-1 rounded-full bg-white/20`}>
                {course.difficulty}
              </span>
              {course.progress?.is_completed && (
                <span className="text-xs px-3 py-1 rounded-full bg-white/20 flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Completed
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-white/80 mb-6 max-w-2xl">{course.description}</p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {course.estimated_hours} hours
              </span>
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                {course.total_xp} XP total
              </span>
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {course.totalModules} modules
              </span>
            </div>

            {course.progress && (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>{course.completedModules} of {course.totalModules} modules completed</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-3 bg-white/20" />
              </div>
            )}

            {!course.progress && (
              <Button 
                className="mt-6 bg-white text-gray-900 hover:bg-white/90"
                onClick={handleStartCourse}
                disabled={starting}
              >
                {starting ? 'Starting...' : 'Start Course'}
              </Button>
            )}
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Course Modules
          </h2>

          {modules.map((module, index) => (
            <div
              key={module.id}
              onClick={() => handleModuleClick(module.id, module.isLocked)}
              className={cn(
                "group relative p-6 rounded-xl glass transition-all duration-300",
                module.isLocked 
                  ? "opacity-60 cursor-not-allowed" 
                  : "cursor-pointer hover:scale-[1.01] cyber-border"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Module Number/Status */}
                <div className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                  module.isCompleted 
                    ? "bg-success/20 text-success" 
                    : module.isLocked 
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/20 text-primary"
                )}>
                  {module.isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : module.isLocked ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-lg font-semibold mb-1",
                    module.isLocked ? "text-muted-foreground" : "text-foreground group-hover:text-primary transition-colors"
                  )}>
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {module.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {module.estimated_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {module.xp_reward} XP
                    </span>
                    {module.progress?.assessment_score && (
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="w-4 h-4" />
                        Score: {module.progress.assessment_score}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  {module.isCompleted ? (
                    <div className="text-success">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : module.isLocked ? (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <div className="flex items-center gap-2 text-primary">
                      {module.progress?.content_read ? (
                        <>
                          <MessageSquare className="w-5 h-5" />
                          <span className="text-sm font-medium">Take Assessment</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Start</span>
                        </>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Course Completion */}
        {course.progress?.is_completed && (
          <div className="mt-8 p-6 rounded-xl glass cyber-border text-center">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Course Completed! 🎉</h3>
            <p className="text-muted-foreground mb-4">
              You've earned {course.progress.total_xp_earned} XP from this course.
            </p>
            <Button onClick={() => navigate('/courses')}>
              Explore More Courses
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseDetail;
