import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Medal, 
  Flame, 
  Share2, 
  Crown,
  Loader2,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  max_streak: number;
  is_visible: boolean;
  rank: number;
}

export const Leaderboard = () => {
  const [weeklyData, setWeeklyData] = useState<LeaderboardEntry[]>([]);
  const [allTimeData, setAllTimeData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<{ weekly: number | null; allTime: number | null }>({ weekly: null, allTime: null });
  const [preferences, setPreferences] = useState<{ is_visible: boolean; display_name: string }>({
    is_visible: true,
    display_name: '',
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboardData();
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      // Fetch weekly leaderboard using raw query via RPC or direct table access
      const { data: weeklyRaw, error: weeklyError } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          xp_points,
          streak_days,
          last_activity_at
        `)
        .gte('last_activity_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('xp_points', { ascending: false })
        .limit(50);

      if (weeklyError) throw weeklyError;

      // Fetch all-time leaderboard
      const { data: allTimeRaw, error: allTimeError } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          xp_points,
          streak_days
        `)
        .order('xp_points', { ascending: false })
        .limit(50);

      if (allTimeError) throw allTimeError;

      // Aggregate and fetch profiles
      const aggregateData = async (data: any[]) => {
        // Group by user_id and sum XP
        const grouped = data.reduce((acc, item) => {
          if (!acc[item.user_id]) {
            acc[item.user_id] = { user_id: item.user_id, total_xp: 0, max_streak: 0 };
          }
          acc[item.user_id].total_xp += item.xp_points;
          acc[item.user_id].max_streak = Math.max(acc[item.user_id].max_streak, item.streak_days);
          return acc;
        }, {} as Record<string, any>);

        const userIds = Object.keys(grouped);
        
        // Fetch profiles and preferences
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const { data: prefs } = await supabase
          .from('leaderboard_preferences')
          .select('user_id, display_name, is_visible')
          .in('user_id', userIds);

        const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.user_id]: p }), {} as Record<string, any>);
        const prefMap = (prefs || []).reduce((acc, p) => ({ ...acc, [p.user_id]: p }), {} as Record<string, any>);

        return Object.values(grouped)
          .map((entry: any, index) => ({
            user_id: entry.user_id,
            display_name: prefMap[entry.user_id]?.display_name || profileMap[entry.user_id]?.full_name || 'Anonymous',
            avatar_url: profileMap[entry.user_id]?.avatar_url,
            total_xp: entry.total_xp,
            max_streak: entry.max_streak,
            is_visible: prefMap[entry.user_id]?.is_visible ?? true,
            rank: index + 1,
          }))
          .filter(entry => entry.is_visible)
          .sort((a, b) => b.total_xp - a.total_xp)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));
      };

      const weeklyProcessed = await aggregateData(weeklyRaw || []);
      const allTimeProcessed = await aggregateData(allTimeRaw || []);

      setWeeklyData(weeklyProcessed);
      setAllTimeData(allTimeProcessed);

      // Find user's rank
      if (user) {
        const weeklyRank = weeklyProcessed.findIndex(e => e.user_id === user.id);
        const allTimeRank = allTimeProcessed.findIndex(e => e.user_id === user.id);
        setUserRank({
          weekly: weeklyRank >= 0 ? weeklyRank + 1 : null,
          allTime: allTimeRank >= 0 ? allTimeRank + 1 : null,
        });
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPreferences = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('leaderboard_preferences')
      .select('is_visible, display_name')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setPreferences({ is_visible: data.is_visible, display_name: data.display_name || '' });
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('leaderboard_preferences')
        .upsert({
          user_id: user.id,
          is_visible: preferences.is_visible,
          display_name: preferences.display_name || null,
        });

      if (error) throw error;
      toast.success('Preferences saved!');
      setSettingsOpen(false);
      fetchLeaderboardData();
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleShareRank = (type: 'weekly' | 'allTime') => {
    const rank = type === 'weekly' ? userRank.weekly : userRank.allTime;
    const text = `I'm ranked #${rank} ${type === 'weekly' ? 'this week' : 'all-time'} on Praeceptor AI! 🔥 Training to master cybersecurity.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  const LeaderboardList = ({ data }: { data: LeaderboardEntry[] }) => (
    <ScrollArea className="h-[350px] sm:h-[400px]">
      <div className="space-y-2 pr-2 sm:pr-4">
        {data.map((entry) => {
          const isCurrentUser = user && entry.user_id === user.id;
          
          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors ${
                isCurrentUser 
                  ? 'bg-primary/10 border border-primary/30' 
                  : 'bg-secondary/30 hover:bg-secondary/50'
              }`}
            >
              <div className="w-6 sm:w-8 flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {entry.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm sm:text-base truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                  {entry.display_name} {isCurrentUser && '(You)'}
                </p>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {entry.max_streak}d
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="font-bold text-xs sm:text-sm">
                {entry.total_xp.toLocaleString()} XP
              </Badge>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No leaderboard data yet. Start learning to appear here!
          </div>
        )}
      </div>
    </ScrollArea>
  );

  if (loading) {
    return (
      <Card className="glass cyber-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass cyber-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Leaderboard
          </CardTitle>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leaderboard Privacy Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show on Leaderboard</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see you on the leaderboard
                    </p>
                  </div>
                  <Switch
                    checked={preferences.is_visible}
                    onCheckedChange={(checked) => setPreferences(p => ({ ...p, is_visible: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name (Optional)</Label>
                  <Input
                    id="display_name"
                    placeholder="Use a nickname instead of your real name"
                    value={preferences.display_name}
                    onChange={(e) => setPreferences(p => ({ ...p, display_name: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use your profile name
                  </p>
                </div>
                <Button onClick={savePreferences} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Preferences
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* User's rank highlight */}
        {userRank.weekly && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Your weekly rank</p>
              <p className="text-2xl font-bold text-primary">#{userRank.weekly}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleShareRank('weekly')}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        )}

        <Tabs defaultValue="weekly">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="weekly" className="flex-1">This Week</TabsTrigger>
            <TabsTrigger value="allTime" className="flex-1">All Time</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly">
            <LeaderboardList data={weeklyData} />
          </TabsContent>
          <TabsContent value="allTime">
            <LeaderboardList data={allTimeData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
