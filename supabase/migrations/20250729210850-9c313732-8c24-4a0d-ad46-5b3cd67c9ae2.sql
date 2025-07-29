-- Fix RLS policies for quick_consult_messages table
-- The current INSERT policy might be causing issues

-- First drop the existing policies for quick_consult_messages
DROP POLICY IF EXISTS "Users can create messages in their sessions" ON public.quick_consult_messages;
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON public.quick_consult_messages;

-- Create improved RLS policies for quick_consult_messages
CREATE POLICY "Users can create messages in their sessions" 
ON public.quick_consult_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.quick_consult_sessions 
    WHERE quick_consult_sessions.id = quick_consult_messages.session_id 
    AND (
      quick_consult_sessions.user_id = auth.uid() 
      OR (
        quick_consult_sessions.firm_id IS NOT NULL 
        AND quick_consult_sessions.firm_id = get_user_firm_id(auth.uid())
      )
    )
  )
);

CREATE POLICY "Users can view messages from their sessions" 
ON public.quick_consult_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.quick_consult_sessions 
    WHERE quick_consult_sessions.id = quick_consult_messages.session_id 
    AND (
      quick_consult_sessions.user_id = auth.uid() 
      OR (
        quick_consult_sessions.firm_id IS NOT NULL 
        AND quick_consult_sessions.firm_id = get_user_firm_id(auth.uid())
      )
    )
  )
);