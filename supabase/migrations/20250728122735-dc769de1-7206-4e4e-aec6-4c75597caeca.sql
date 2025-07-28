-- Create quick consult sessions table
CREATE TABLE public.quick_consult_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  firm_id UUID,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Create quick consult messages table
CREATE TABLE public.quick_consult_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.quick_consult_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quick_consult_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_consult_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
CREATE POLICY "Users can view their own quick consult sessions"
ON public.quick_consult_sessions
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (firm_id IS NOT NULL AND firm_id = get_user_firm_id(auth.uid()))
);

CREATE POLICY "Users can create their own quick consult sessions"
ON public.quick_consult_sessions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (firm_id IS NULL OR firm_id = get_user_firm_id(auth.uid()))
);

CREATE POLICY "Users can update their own quick consult sessions"
ON public.quick_consult_sessions
FOR UPDATE
USING (
  auth.uid() = user_id
  OR (firm_id IS NOT NULL AND firm_id = get_user_firm_id(auth.uid()))
);

CREATE POLICY "Users can delete their own quick consult sessions"
ON public.quick_consult_sessions
FOR DELETE
USING (
  auth.uid() = user_id
  OR (firm_id IS NOT NULL AND firm_id = get_user_firm_id(auth.uid()))
);

-- Create policies for messages
CREATE POLICY "Users can view messages from their sessions"
ON public.quick_consult_messages
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.quick_consult_sessions
    WHERE auth.uid() = user_id
    OR (firm_id IS NOT NULL AND firm_id = get_user_firm_id(auth.uid()))
  )
);

CREATE POLICY "Users can create messages in their sessions"
ON public.quick_consult_messages
FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM public.quick_consult_sessions
    WHERE auth.uid() = user_id
    OR (firm_id IS NOT NULL AND firm_id = get_user_firm_id(auth.uid()))
  )
);

-- Create function to update session timestamp
CREATE OR REPLACE FUNCTION public.update_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.quick_consult_sessions
  SET updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update session timestamp when messages are added
CREATE TRIGGER update_session_on_message_insert
  AFTER INSERT ON public.quick_consult_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_quick_consult_sessions_user_id ON public.quick_consult_sessions(user_id);
CREATE INDEX idx_quick_consult_sessions_firm_id ON public.quick_consult_sessions(firm_id);
CREATE INDEX idx_quick_consult_sessions_updated_at ON public.quick_consult_sessions(updated_at DESC);
CREATE INDEX idx_quick_consult_messages_session_id ON public.quick_consult_messages(session_id);
CREATE INDEX idx_quick_consult_messages_created_at ON public.quick_consult_messages(created_at);