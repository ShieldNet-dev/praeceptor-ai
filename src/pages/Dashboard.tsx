import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  MessageSquare, 
  Flame, 
  Zap, 
  Clock, 
  Plus,
  Loader2,
  ChevronRight,
  Settings,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TRACKS, GuidanceTrack, getTrackById } from '@/types/tracks';
import { toast } from 'sonner';

interface UserProgress {
  track: GuidanceTrack;
  total_sessions: number;
  total_messages: number;
  streak_days: number;
  xp_points: number;
  last_activity_at: string;
}

interface Conversation {
  id: string;
  track: GuidanceTrack;
  title: string;
  updated_at: string;
}

const Dashboard = () => {
  const [userTracks, setUserTracks] = useState<GuidanceTrack[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Check if user is admin
        const { data: isAdminData } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });
        setIsAdmin(isAdminData === true);

        // Fetch user tracks
        const { data: tracksData, error: tracksError } = await supabase
          .from('user_tracks')
          .select('track')
          .eq('user_id', user.id);

        if (tracksError) throw tracksError;
        
        if (!tracksData || tracksData.length === 0) {
          navigate('/onboarding');
          return;
        }

        setUserTracks(tracksData.map((t) => t.track as GuidanceTrack));

        // Fetch progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) throw progressError;
        setProgress(progressData as UserProgress[]);

        // Fetch recent conversations
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5);

        if (convError) throw convError;
        setConversations(convData as Conversation[]);
      } catch (error: any) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, navigate]);

  const handleNewChat = (track: GuidanceTrack) => {
    navigate(`/chat?track=${track}`);
  };

  const handleContinueChat = (conversationId: string) => {
    navigate(`/chat?conversation=${conversationId}`);
  };

  const handleStartRename = (conv: Conversation) => {
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleCancelRename = () => {
    setEditingConvId(null);
    setEditingTitle('');
  };

  const handleSaveRename = async (convId: string) => {
    if (!editingTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: editingTitle.trim() })
        .eq('id', convId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: editingTitle.trim() } : c))
      );
      toast.success('Conversation renamed');
    } catch (error) {
      toast.error('Failed to rename conversation');
    } finally {
      setEditingConvId(null);
      setEditingTitle('');
    }
  };
  const totalXP = progress.reduce((acc, p) => acc + p.xp_points, 0);
  const totalSessions = progress.reduce((acc, p) => acc + p.total_sessions, 0);
  const maxStreak = Math.max(...progress.map((p) => p.streak_days), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground">Praeceptor AI</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/admin/reviews')}
                className="gap-2"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/settings')}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 relative z-10">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="text-gradient">{user?.user_metadata?.full_name || 'Learner'}</span>
          </h1>
          <p className="text-muted-foreground">
            Ready to continue your cybersecurity journey?
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-4 cyber-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="text-2xl font-bold">{totalXP}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total XP</p>
          </div>
          <div className="glass rounded-xl p-4 cyber-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-2xl font-bold">{maxStreak}</span>
            </div>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </div>
          <div className="glass rounded-xl p-4 cyber-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <MessageSquare className="w-4 h-4 text-violet-500" />
              </div>
              <span className="text-2xl font-bold">{totalSessions}</span>
            </div>
            <p className="text-sm text-muted-foreground">Sessions</p>
          </div>
          <div className="glass rounded-xl p-4 cyber-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-2xl font-bold">{userTracks.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Active Tracks</p>
          </div>
        </div>

        {/* Start new session */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Start a New Session</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTracks.map((trackId) => {
              const track = getTrackById(trackId);
              if (!track) return null;
              const IconComponent = track.icon;

              return (
                <button
                  key={track.id}
                  onClick={() => handleNewChat(track.id)}
                  className="group glass rounded-xl p-5 text-left hover:border-primary/50 transition-all duration-300 cyber-border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${track.color} text-white`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{track.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {track.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent conversations */}
        {conversations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Conversations</h2>
            <div className="glass rounded-xl divide-y divide-border/50 cyber-border overflow-hidden">
              {conversations.map((conv) => {
                const track = getTrackById(conv.track);
                if (!track) return null;
                const IconComponent = track.icon;
                const isEditing = editingConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${track.color} text-white flex-shrink-0`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv.id);
                              if (e.key === 'Escape') handleCancelRename();
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => handleSaveRename(conv.id)}
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={handleCancelRename}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleContinueChat(conv.id)}
                          className="text-left w-full"
                        >
                          <p className="font-medium text-foreground truncate">{conv.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {track.name} • {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </button>
                      )}
                    </div>
                    {!isEditing && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(conv);
                          }}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <button onClick={() => handleContinueChat(conv.id)}>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
