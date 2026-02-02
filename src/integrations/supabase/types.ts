export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_reviews: {
        Row: {
          admin_feedback: string | null
          admin_feedback_at: string | null
          created_at: string
          id: string
          rating: number
          review_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_feedback?: string | null
          admin_feedback_at?: string | null
          created_at?: string
          id?: string
          rating: number
          review_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_feedback?: string | null
          admin_feedback_at?: string | null
          created_at?: string
          id?: string
          rating?: number
          review_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          track: Database["public"]["Enums"]["guidance_track"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          track: Database["public"]["Enums"]["guidance_track"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          track?: Database["public"]["Enums"]["guidance_track"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          content: string
          course_id: string
          created_at: string
          description: string
          estimated_minutes: number
          id: string
          learning_objectives: Json
          order_index: number
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          description: string
          estimated_minutes?: number
          id?: string
          learning_objectives?: Json
          order_index?: number
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          description?: string
          estimated_minutes?: number
          id?: string
          learning_objectives?: Json
          order_index?: number
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          color: string
          created_at: string
          description: string
          difficulty: string
          estimated_hours: number
          icon: string
          id: string
          is_published: boolean
          order_index: number
          title: string
          total_xp: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description: string
          difficulty?: string
          estimated_hours?: number
          icon?: string
          id?: string
          is_published?: boolean
          order_index?: number
          title: string
          total_xp?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          difficulty?: string
          estimated_hours?: number
          icon?: string
          id?: string
          is_published?: boolean
          order_index?: number
          title?: string
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          correct_answer: number
          created_at: string
          difficulty: string
          explanation: string
          id: string
          options: Json
          question: string
          xp_reward: number
        }
        Insert: {
          challenge_date: string
          correct_answer: number
          created_at?: string
          difficulty?: string
          explanation: string
          id?: string
          options: Json
          question: string
          xp_reward?: number
        }
        Update: {
          challenge_date?: string
          correct_answer?: number
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          options?: Json
          question?: string
          xp_reward?: number
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_responded_at: string | null
          admin_response: string | null
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_responded_at?: string | null
          admin_response?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_responded_at?: string | null
          admin_response?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          current_module_index: number
          final_assessment_passed: boolean | null
          id: string
          is_completed: boolean
          started_at: string
          total_xp_earned: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          current_module_index?: number
          final_assessment_passed?: boolean | null
          id?: string
          is_completed?: boolean
          started_at?: string
          total_xp_earned?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          current_module_index?: number
          final_assessment_passed?: boolean | null
          id?: string
          is_completed?: boolean
          started_at?: string
          total_xp_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          user_id: string
          was_correct: boolean
          xp_earned: number
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          user_id: string
          was_correct?: boolean
          xp_earned?: number
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          user_id?: string
          was_correct?: boolean
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_progress: {
        Row: {
          ai_assessment_conversation_id: string | null
          assessment_passed: boolean | null
          assessment_score: number | null
          completed_at: string | null
          content_read: boolean
          course_id: string
          id: string
          module_id: string
          started_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          ai_assessment_conversation_id?: string | null
          assessment_passed?: boolean | null
          assessment_score?: number | null
          completed_at?: string | null
          content_read?: boolean
          course_id: string
          id?: string
          module_id: string
          started_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          ai_assessment_conversation_id?: string | null
          assessment_passed?: boolean | null
          assessment_score?: number | null
          completed_at?: string | null
          content_read?: boolean
          course_id?: string
          id?: string
          module_id?: string
          started_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string
          id: string
          last_activity_at: string
          lessons_completed: number
          streak_days: number
          total_messages: number
          total_sessions: number
          track: Database["public"]["Enums"]["guidance_track"]
          updated_at: string
          user_id: string
          xp_points: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_at?: string
          lessons_completed?: number
          streak_days?: number
          total_messages?: number
          total_sessions?: number
          track: Database["public"]["Enums"]["guidance_track"]
          updated_at?: string
          user_id: string
          xp_points?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_at?: string
          lessons_completed?: number
          streak_days?: number
          total_messages?: number
          total_sessions?: number
          track?: Database["public"]["Enums"]["guidance_track"]
          updated_at?: string
          user_id?: string
          xp_points?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tracks: {
        Row: {
          id: string
          selected_at: string
          track: Database["public"]["Enums"]["guidance_track"]
          user_id: string
        }
        Insert: {
          id?: string
          selected_at?: string
          track: Database["public"]["Enums"]["guidance_track"]
          user_id: string
        }
        Update: {
          id?: string
          selected_at?: string
          track?: Database["public"]["Enums"]["guidance_track"]
          user_id?: string
        }
        Relationships: []
      }
      user_uploads: {
        Row: {
          conversation_id: string | null
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          storage_path: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_uploads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      guidance_track:
        | "learning"
        | "mentorship"
        | "exam_prep"
        | "siwes"
        | "academic"
        | "career"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      guidance_track: [
        "learning",
        "mentorship",
        "exam_prep",
        "siwes",
        "academic",
        "career",
      ],
    },
  },
} as const
