import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Leaderboard as LeaderboardComponent } from '@/components/Leaderboard';
import { ReferralSystem } from '@/components/ReferralSystem';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';
import { Loader2 } from 'lucide-react';

const LeaderboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
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
        <div className="container mx-auto max-w-6xl px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
            <div className="min-w-0">
              <h1 className="font-semibold text-foreground text-sm sm:text-base truncate">Leaderboard & Referrals</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Compete and invite friends</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <LeaderboardComponent />
          <ReferralSystem />
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
