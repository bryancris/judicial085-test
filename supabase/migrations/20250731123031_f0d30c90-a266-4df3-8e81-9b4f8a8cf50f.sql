-- Create quick_consult_sessions table
CREATE TABLE public.quick_consult_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id TEXT,
  title TEXT NOT NULL DEFAULT 'Quick Consultation',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quick_consult_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for quick_consult_sessions
CREATE POLICY "Users can view their own quick consult sessions" 
ON public.quick_consult_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quick consult sessions" 
ON public.quick_consult_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick consult sessions" 
ON public.quick_consult_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick consult sessions" 
ON public.quick_consult_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create quick_consult_messages table
CREATE TABLE public.quick_consult_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.quick_consult_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  client_id TEXT,
  case_id UUID,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quick_consult_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for quick_consult_messages
CREATE POLICY "Users can view their own quick consult messages" 
ON public.quick_consult_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quick consult messages" 
ON public.quick_consult_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick consult messages" 
ON public.quick_consult_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick consult messages" 
ON public.quick_consult_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_quick_consult_sessions_user_id ON public.quick_consult_sessions(user_id);
CREATE INDEX idx_quick_consult_sessions_created_at ON public.quick_consult_sessions(created_at);
CREATE INDEX idx_quick_consult_messages_session_id ON public.quick_consult_messages(session_id);
CREATE INDEX idx_quick_consult_messages_user_id ON public.quick_consult_messages(user_id);
CREATE INDEX idx_quick_consult_messages_created_at ON public.quick_consult_messages(created_at);

-- Create trigger for automatic timestamp updates on quick_consult_sessions
CREATE TRIGGER update_quick_consult_sessions_updated_at
BEFORE UPDATE ON public.quick_consult_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on quick_consult_messages  
CREATE TRIGGER update_quick_consult_messages_updated_at
BEFORE UPDATE ON public.quick_consult_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();