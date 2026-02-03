import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Loader2,
  Star,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  Eye,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';
import ReviewDetailDialog from '@/components/admin/ReviewDetailDialog';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  admin_feedback?: string | null;
  admin_feedback_at?: string | null;
}

const AdminReviews = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, ratingCounts: [0, 0, 0, 0, 0] });
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleReviewClick = (review: Review) => {
    setSelectedReview(review);
    setDialogOpen(true);
  };

  const handleFeedbackSent = (reviewId: string, feedback: string) => {
    setReviews(prev => prev.map(r => 
      r.id === reviewId 
        ? { ...r, admin_feedback: feedback, admin_feedback_at: new Date().toISOString() }
        : r
    ));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!user) return;

      try {
        // Check if user is admin using the has_role function
        const { data: isAdminData, error: roleError } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (roleError) {
          console.error('Error checking admin role:', roleError);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(isAdminData === true);

        if (isAdminData === true) {
          // Fetch all reviews
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('app_reviews')
            .select('*')
            .order('created_at', { ascending: false });

          if (reviewsError) throw reviewsError;

          // Get user emails from profiles
          const userIds = reviewsData?.map(r => r.user_id) || [];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, email')
            .in('user_id', userIds);

          const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);

          const reviewsWithEmail = reviewsData?.map(r => ({
            ...r,
            user_email: emailMap.get(r.user_id) || 'Unknown'
          })) || [];

          setReviews(reviewsWithEmail);

          // Calculate stats
          if (reviewsData && reviewsData.length > 0) {
            const total = reviewsData.length;
            const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0);
            const avgRating = sum / total;
            const ratingCounts = [0, 0, 0, 0, 0];
            reviewsData.forEach(r => {
              ratingCounts[r.rating - 1]++;
            });
            setStats({ total, avgRating, ratingCounts });
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkAdminAndFetch();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to view this page. This area is restricted to administrators only.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
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
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-10 h-10" />
            <div>
              <h1 className="font-semibold text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">App Reviews & Feedback</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-6 cyber-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 cyber-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)} / 5</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 cyber-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/20">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating Distribution</p>
                <div className="flex gap-1 mt-1">
                  {stats.ratingCounts.map((count, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center"
                      title={`${i + 1} star: ${count} reviews`}
                    >
                      <div 
                        className="w-4 bg-yellow-500/60 rounded-sm" 
                        style={{ height: `${Math.max(4, (count / (stats.total || 1)) * 40)}px` }}
                      />
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="glass rounded-xl cyber-border overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="text-lg font-semibold">All Reviews</h2>
          </div>
          
          {reviews.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="min-w-[200px]">Review</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow 
                      key={review.id}
                      className="cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => handleReviewClick(review)}
                    >
                      <TableCell className="font-medium">
                        {review.user_email}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="line-clamp-2 text-sm">{review.review_text}</p>
                      </TableCell>
                      <TableCell>
                        {review.admin_feedback ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-500">
                            <CheckCircle className="w-3 h-3" />
                            Responded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-500">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReviewClick(review);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Review Detail Dialog */}
        <ReviewDetailDialog
          review={selectedReview}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onFeedbackSent={handleFeedbackSent}
        />
      </main>
    </div>
  );
};

export default AdminReviews;
