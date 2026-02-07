import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Zap, 
  Share2, 
  Twitter, 
  Linkedin, 
  Link as LinkIcon, 
  Check, 
  X,
  Trophy,
  Shield,
  Target,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Achievement {
  id: string;
  achievement_type: 'module_completion' | 'assessment_pass' | 'daily_challenge' | 'course_completion' | 'streak' | 'referral';
  title: string;
  description: string;
  badge_name: string;
  badge_icon: string;
  xp_earned: number;
  share_token: string;
  created_at: string;
}

interface ShareableAchievementCardProps {
  achievement: Achievement;
  onClose?: () => void;
  isOpen?: boolean;
}

const getBadgeIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    award: <Award className="w-8 h-8" />,
    trophy: <Trophy className="w-8 h-8" />,
    shield: <Shield className="w-8 h-8" />,
    target: <Target className="w-8 h-8" />,
    flame: <Flame className="w-8 h-8" />,
    zap: <Zap className="w-8 h-8" />,
  };
  return icons[iconName] || icons.award;
};

const getTypeColor = (type: Achievement['achievement_type']) => {
  const colors: Record<string, string> = {
    module_completion: 'from-blue-500 to-cyan-400',
    assessment_pass: 'from-green-500 to-emerald-400',
    daily_challenge: 'from-orange-500 to-amber-400',
    course_completion: 'from-purple-500 to-pink-400',
    streak: 'from-red-500 to-orange-400',
    referral: 'from-indigo-500 to-violet-400',
  };
  return colors[type] || 'from-primary to-accent';
};

const getShareText = (achievement: Achievement) => {
  const texts: Record<string, string> = {
    module_completion: `I just completed "${achievement.title}" on Praeceptor AI 💥 Training like an ethical hacker.`,
    assessment_pass: `I passed the ${achievement.title} assessment on Praeceptor AI 🎯 Leveling up my cybersecurity skills!`,
    daily_challenge: `I conquered today's Daily Cyber Challenge on Praeceptor AI 🧠 +${achievement.xp_earned} XP earned!`,
    course_completion: `I completed the ${achievement.title} course on Praeceptor AI 🏆 One step closer to mastering cybersecurity!`,
    streak: `${achievement.xp_earned} day streak on Praeceptor AI! 🔥 Consistency is key in cybersecurity.`,
    referral: `Just unlocked the ${achievement.badge_name} badge on Praeceptor AI! 🌟`,
  };
  return texts[achievement.achievement_type] || `Achievement unlocked: ${achievement.title}!`;
};

export const ShareableAchievementCard = ({ 
  achievement, 
  onClose, 
  isOpen = true 
}: ShareableAchievementCardProps) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}/achievement/${achievement.share_token}`;
  const shareText = getShareText(achievement);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const cardContent = (
    <div 
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-secondary/30 to-background border border-border"
    >
      {/* Background glow effect */}
      <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${getTypeColor(achievement.achievement_type)} opacity-20 blur-3xl`} />
      
      {/* Header with logo */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-8 h-8" />
          <span className="font-semibold text-sm text-muted-foreground">Praeceptor AI</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {new Date(achievement.created_at).toLocaleDateString()}
        </Badge>
      </div>

      {/* Badge icon */}
      <div className="flex justify-center mb-4 relative z-10">
        <div className={`p-6 rounded-full bg-gradient-to-br ${getTypeColor(achievement.achievement_type)} text-white shadow-lg`}>
          {getBadgeIcon(achievement.badge_icon)}
        </div>
      </div>

      {/* Badge name */}
      <div className="text-center mb-4 relative z-10">
        <h3 className="text-xl font-bold text-foreground mb-1">{achievement.badge_name}</h3>
        <p className="text-sm text-muted-foreground">{achievement.title}</p>
      </div>

      {/* XP earned */}
      <div className="flex justify-center mb-6 relative z-10">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-bold text-primary">+{achievement.xp_earned} XP</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-center text-sm text-muted-foreground mb-6 relative z-10">
        {achievement.description}
      </p>

      {/* Share buttons */}
      <div className="flex items-center justify-center gap-3 relative z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareTwitter}
          className="gap-2"
        >
          <Twitter className="w-4 h-4" />
          Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareLinkedIn}
          className="gap-2"
        >
          <Linkedin className="w-4 h-4" />
          Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );

  if (onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Achievement Unlocked</DialogTitle>
          </DialogHeader>
          {cardContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {cardContent}
      </CardContent>
    </Card>
  );
};

export default ShareableAchievementCard;
