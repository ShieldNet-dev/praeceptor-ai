export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: string;
  estimated_hours: number;
  total_xp: number;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  learning_objectives: string[];
  order_index: number;
  xp_reward: number;
  estimated_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  started_at: string;
  completed_at: string | null;
  current_module_index: number;
  total_xp_earned: number;
  is_completed: boolean;
  final_assessment_passed: boolean | null;
}

export interface UserModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  course_id: string;
  started_at: string;
  completed_at: string | null;
  content_read: boolean;
  assessment_passed: boolean | null;
  assessment_score: number | null;
  xp_earned: number;
  ai_assessment_conversation_id: string | null;
}

export interface ModuleWithProgress extends CourseModule {
  progress?: UserModuleProgress;
  isLocked: boolean;
  isCompleted: boolean;
}

export interface CourseWithProgress extends Course {
  modules: CourseModule[];
  progress?: UserCourseProgress;
  moduleProgress: UserModuleProgress[];
  completedModules: number;
  totalModules: number;
}
