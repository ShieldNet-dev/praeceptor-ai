import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Send, Loader2, User, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

interface ReviewDetailDialogProps {
  review: Review | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedbackSent: (reviewId: string, feedback: string) => void;
}

const ReviewDetailDialog = ({ review, open, onOpenChange, onFeedbackSent }: ReviewDetailDialogProps) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!review || !feedbackText.trim()) {
      toast.error('Please enter feedback before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('app_reviews')
        .update({
          admin_feedback: feedbackText.trim(),
          admin_feedback_at: new Date().toISOString()
        })
        .eq('id', review.id);

      if (error) throw error;

      onFeedbackSent(review.id, feedbackText.trim());
      setFeedbackText('');
      toast.success('Feedback sent to user successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset feedback text when dialog opens with a new review
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && review) {
      setFeedbackText(review.admin_feedback || '');
    } else {
      setFeedbackText('');
    }
    onOpenChange(isOpen);
  };

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Review Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
            <div className="p-2 rounded-full bg-primary/20">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{review.user_email}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {format(new Date(review.created_at), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Rating</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= review.rating
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">({review.rating}/5)</span>
            </div>
          </div>

          {/* Full Review Text */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">User's Review</Label>
            <div className="mt-2 p-4 rounded-lg bg-secondary/30 border border-border/50">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.review_text}</p>
            </div>
          </div>

          {/* Existing Feedback Display */}
          {review.admin_feedback && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Previous Feedback
                {review.admin_feedback_at && (
                  <span className="ml-2 normal-case">
                    (sent {format(new Date(review.admin_feedback_at), 'MMM d, yyyy')})
                  </span>
                )}
              </Label>
              <div className="mt-2 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.admin_feedback}</p>
              </div>
            </div>
          )}

          {/* Feedback Input */}
          <div>
            <Label htmlFor="admin-feedback" className="text-xs text-muted-foreground uppercase tracking-wide">
              {review.admin_feedback ? 'Update Feedback' : 'Send Feedback to User'}
            </Label>
            <Textarea
              id="admin-feedback"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Write a response to this user's review..."
              className="mt-2 min-h-[120px]"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This feedback will be visible to the user in their Settings → Feedback section.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              Close
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={submitting || !feedbackText.trim()}
              className="flex-1"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {review.admin_feedback ? 'Update Feedback' : 'Send Feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDetailDialog;
