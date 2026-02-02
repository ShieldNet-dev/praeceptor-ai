import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Search,
  Clock,
  Award,
  BookOpen,
  ChevronRight,
  Cpu,
  Network,
  Shield,
  Code,
  Terminal,
  Brain,
  Cloud,
  Smartphone,
  Lock,
  Bug
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCourses } from "@/hooks/useCourses";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, React.ElementType> = {
  Cpu,
  Network,
  Shield,
  Code,
  Terminal,
  Brain,
  Cloud,
  Smartphone,
  Lock,
  Bug
};

const Courses = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { courses, loading, startCourse } = useCourses();

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCourseClick = async (courseId: string, hasProgress: boolean) => {
    if (!hasProgress) {
      await startCourse(courseId);
    }
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass shadow-lg">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">Courses</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-4 pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Master <span className="text-gradient">Cybersecurity</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive courses with structured modules, AI-powered assessments, and XP rewards. 
            Progress through each module to master the complete curriculum.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-xl glass cyber-border">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-2 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredCourses.map((course, index) => {
              const IconComponent = iconMap[course.icon] || Shield;
              const progressPercent = course.totalModules > 0 
                ? (course.completedModules / course.totalModules) * 100 
                : 0;
              const hasStarted = !!course.progress;

              return (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course.id, hasStarted)}
                  className="group relative p-6 rounded-xl glass cyber-border cursor-pointer hover:scale-[1.02] transition-all duration-300 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${0.05 * index}s`, animationFillMode: 'forwards' }}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${course.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${course.color} text-primary-foreground`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        course.difficulty === "Beginner" 
                          ? "bg-success/20 text-success" 
                          : course.difficulty === "Intermediate" 
                            ? "bg-yellow-500/20 text-yellow-400" 
                            : "bg-orange-500/20 text-orange-400"
                      }`}>
                        {course.difficulty}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Progress */}
                    {hasStarted && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{course.completedModules} of {course.totalModules} modules</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.estimated_hours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {course.total_xp} XP
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {course.totalModules} modules
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">Try adjusting your search query</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
