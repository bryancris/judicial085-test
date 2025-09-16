-- Create workflow tracking table
CREATE TABLE case_analysis_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  case_id UUID,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 9,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual step results table  
CREATE TABLE case_analysis_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES case_analysis_workflows(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  content TEXT,
  citations JSONB DEFAULT '[]',
  validation_score NUMERIC DEFAULT 0.0,
  execution_time_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE case_analysis_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_analysis_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflows
CREATE POLICY "Users can view their own workflows" 
ON case_analysis_workflows 
FOR SELECT 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can create workflows for their clients" 
ON case_analysis_workflows 
FOR INSERT 
WITH CHECK (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can update their own workflows" 
ON case_analysis_workflows 
FOR UPDATE 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

-- RLS policies for steps
CREATE POLICY "Users can view steps for their workflows" 
ON case_analysis_steps 
FOR SELECT 
USING (workflow_id IN (
  SELECT w.id FROM case_analysis_workflows w 
  JOIN clients c ON w.client_id = c.id 
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Users can create steps for their workflows" 
ON case_analysis_steps 
FOR INSERT 
WITH CHECK (workflow_id IN (
  SELECT w.id FROM case_analysis_workflows w 
  JOIN clients c ON w.client_id = c.id 
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Users can update steps for their workflows" 
ON case_analysis_steps 
FOR UPDATE 
USING (workflow_id IN (
  SELECT w.id FROM case_analysis_workflows w 
  JOIN clients c ON w.client_id = c.id 
  WHERE c.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_workflows_client_id ON case_analysis_workflows(client_id);
CREATE INDEX idx_workflows_status ON case_analysis_workflows(status);
CREATE INDEX idx_steps_workflow_id ON case_analysis_steps(workflow_id);
CREATE INDEX idx_steps_step_number ON case_analysis_steps(step_number);

-- Update timestamps trigger
CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON case_analysis_workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_steps_updated_at
BEFORE UPDATE ON case_analysis_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();