-- 1. Add DELETE policy for messages table
CREATE POLICY "Users can delete messages in their conversations" 
ON public.messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
  )
);

-- 2. Add admin SELECT policy for profiles table
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

-- 3. Update handle_new_user function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Extract and validate full_name with length limit
  v_full_name := TRIM(COALESCE(new.raw_user_meta_data ->> 'full_name', ''));
  
  -- Enforce reasonable length limit (200 characters max)
  IF LENGTH(v_full_name) > 200 THEN
    v_full_name := SUBSTRING(v_full_name, 1, 200);
  END IF;
  
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, NULLIF(v_full_name, ''));
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;