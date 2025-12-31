import { BookOpen, Users, FileQuestion, FileText, GraduationCap, Briefcase, LucideIcon } from 'lucide-react';

export type GuidanceTrack = 'learning' | 'mentorship' | 'exam_prep' | 'siwes' | 'academic' | 'career';

export interface TrackInfo {
  id: GuidanceTrack;
  name: string;
  icon: LucideIcon;
  description: string;
  features: string[];
  color: string;
}

export const TRACKS: TrackInfo[] = [
  {
    id: 'learning',
    name: 'Learning Track',
    icon: BookOpen,
    description: 'Master cybersecurity from fundamentals to advanced concepts with structured lessons.',
    features: [
      'Structured curriculum from beginner to advanced',
      'Real-world examples and case studies',
      'Interactive practical exercises',
      'Progressive skill building'
    ],
    color: 'from-primary to-cyan-400'
  },
  {
    id: 'mentorship',
    name: 'Mentorship Track',
    icon: Users,
    description: 'Get personalized guidance, learning paths, and career advice tailored to you.',
    features: [
      'Personalized learning paths',
      'Career guidance and advice',
      'Skill gap analysis',
      'Goal setting and tracking'
    ],
    color: 'from-violet-500 to-purple-400'
  },
  {
    id: 'exam_prep',
    name: 'Exam Preparation',
    icon: FileQuestion,
    description: 'Prepare for certifications like CompTIA, CCNA, CCNP with practice and revision.',
    features: [
      'Practice questions with explanations',
      'Exam-specific revision plans',
      'Time-based mock exams',
      'Weak area identification'
    ],
    color: 'from-orange-500 to-amber-400'
  },
  {
    id: 'siwes',
    name: 'SIWES Track',
    icon: FileText,
    description: 'Complete your SIWES requirements with logbooks, reports, and defense prep.',
    features: [
      'Daily logbook entry assistance',
      'Report writing guidance',
      'Defense preparation',
      'Presentation slide support'
    ],
    color: 'from-emerald-500 to-green-400'
  },
  {
    id: 'academic',
    name: 'Academic Track',
    icon: GraduationCap,
    description: 'Undergraduate and final-year project support from topic selection to completion.',
    features: [
      'Project topic selection',
      'Development guidance',
      'Report writing support',
      'Supervisor-style feedback'
    ],
    color: 'from-blue-500 to-sky-400'
  },
  {
    id: 'career',
    name: 'Career Track',
    icon: Briefcase,
    description: 'Land your dream cybersecurity job with CV, interview, and growth guidance.',
    features: [
      'CV and resume optimization',
      'Interview preparation',
      'Career path planning',
      'Industry insights'
    ],
    color: 'from-rose-500 to-pink-400'
  }
];

export const getTrackById = (id: GuidanceTrack): TrackInfo | undefined => {
  return TRACKS.find(track => track.id === id);
};
