-- Add admin_feedback column to app_reviews table
ALTER TABLE public.app_reviews 
ADD COLUMN admin_feedback text,
ADD COLUMN admin_feedback_at timestamp with time zone;

-- Allow admins to update reviews (for adding feedback)
CREATE POLICY "Admins can update reviews to add feedback"
ON public.app_reviews
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));