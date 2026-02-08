import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Zap, 
  Gift,
  Loader2,
  Share2,
  Twitter,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalXpEarned: number;
  referralCode: string;
}

const REFERRAL_REWARDS = [
  { milestone: 1, xp: 100, badge: 'Mentor Rank I', icon: '🌱' },
  { milestone: 5, xp: 500, badge: 'Mentor Rank II', icon: '🌿' },
  { milestone: 10, xp: 1000, badge: 'Mentor Rank III', icon: '🌳' },
  { milestone: 25, xp: 2500, badge: 'Community Leader', icon: '👑' },
];

export const ReferralSystem = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReferralStats();
    }
  }, [user]);

  const fetchReferralStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch user's referral code from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code, total_referrals')
        .eq('user_id', user.id)
        .single();

      // Fetch referral details
      const { data: referrals } = await supabase
        .from('referrals')
        .select('status, xp_bonus_given')
        .eq('referrer_id', user.id);

      const totalXpEarned = (referrals || []).reduce((sum, r) => sum + (r.xp_bonus_given || 0), 0);
      const pendingReferrals = (referrals || []).filter(r => r.status === 'pending' || r.status === 'signed_up').length;
      const completedReferrals = (referrals || []).filter(r => r.status === 'completed_lesson' || r.status === 'rewarded').length;

      setStats({
        totalReferrals: profile?.total_referrals || referrals?.length || 0,
        pendingReferrals,
        completedReferrals,
        totalXpEarned,
        referralCode: profile?.referral_code || '',
      });
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = stats?.referralCode 
    ? `${window.location.origin}/auth?ref=${stats.referralCode}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareTwitter = () => {
    const text = `Join me on Praeceptor AI and learn cybersecurity from an ex-blackhat turned ethical mentor! 🔐 Use my referral link:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! I'm learning cybersecurity on Praeceptor AI. It's an amazing platform with an AI mentor who teaches like an ex-blackhat turned ethical hacker. Join me: ${referralLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const getNextMilestone = () => {
    const current = stats?.completedReferrals || 0;
    return REFERRAL_REWARDS.find(r => r.milestone > current);
  };

  const getAchievedBadges = () => {
    const current = stats?.completedReferrals || 0;
    return REFERRAL_REWARDS.filter(r => r.milestone <= current);
  };

  if (loading) {
    return (
      <Card className="glass cyber-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const nextMilestone = getNextMilestone();
  const achievedBadges = getAchievedBadges();

  return (
    <Card className="glass cyber-border overflow-hidden">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Invite Friends & Earn Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 rounded-lg bg-secondary/30 text-center">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{stats?.totalReferrals || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Invited</p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-lg sm:text-2xl font-bold text-green-500">{stats?.completedReferrals || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-primary/10 text-center">
            <p className="text-lg sm:text-2xl font-bold text-primary">{stats?.totalXpEarned || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">XP</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs sm:text-sm font-medium">Your Referral Link</p>
          <div className="flex gap-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="flex-1 bg-secondary/30 text-xs sm:text-sm"
            />
            <Button onClick={handleCopyLink} variant="outline" size="sm" className="shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleShareTwitter} variant="outline" size="sm" className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm">
            <Twitter className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Twitter</span>
            <span className="sm:hidden">X</span>
          </Button>
          <Button onClick={handleShareWhatsApp} variant="outline" size="sm" className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm">
            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            WhatsApp
          </Button>
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Next Reward</span>
              <Badge variant="secondary">{nextMilestone.icon} {nextMilestone.badge}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gift className="w-4 h-4 text-primary" />
              <span>Invite {nextMilestone.milestone - (stats?.completedReferrals || 0)} more friends to unlock</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary mt-1">
              <Zap className="w-4 h-4" />
              <span>+{nextMilestone.xp} XP bonus</span>
            </div>
          </div>
        )}

        {/* Achieved Badges */}
        {achievedBadges.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Earned Badges</p>
            <div className="flex flex-wrap gap-2">
              {achievedBadges.map((badge) => (
                <Badge key={badge.milestone} variant="secondary" className="gap-1">
                  {badge.icon} {badge.badge}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">How it works</p>
          <ol className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
              Share your unique referral link with friends
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
              When they sign up and complete their first lesson, you both earn XP
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</span>
              Unlock special badges as you reach referral milestones
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralSystem;
