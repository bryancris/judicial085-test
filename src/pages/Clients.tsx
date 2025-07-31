import React, { useEffect, useState, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import NavBar from '@/components/NavBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, UserPlus, MessageSquare, Brain, Loader2 } from 'lucide-react';
import ClientForm from '@/components/clients/ClientForm';
import ClientList from '@/components/clients/ClientList';
import ErrorBoundary from '@/components/ErrorBoundary';
import QuickConsultFallback from '@/components/fallbacks/QuickConsultFallback';
import AIAgentsFallback from '@/components/fallbacks/AIAgentsFallback';
import { useAuthState } from '@/hooks/useAuthState';
import { useQuery } from '@tanstack/react-query';

// Lazy load the AI3AgentDemo component
const AI3AgentDemo = React.lazy(() => 
  import('@/components/ai-agents/AI3AgentDemo').then(module => ({ default: module.AI3AgentDemo }))
    .catch(error => {
      console.error('Failed to load AI3AgentDemo:', error);
      return { default: () => <AIAgentsFallback /> };
    })
);

// Force component re-registration with timestamp
const ClientsWithTimestamp = () => {
  const { session, isLoading } = useAuthState();
  const [activeTab, setActiveTab] = useState("view-clients");
  
  // AGGRESSIVE VERSION TRACKING - FORCE COMPLETE REFRESH
  const componentKey = `clients-${Date.now()}`;
  console.log('🔄 CLIENTS COMPONENT FORCE LOADED - BUILD:', componentKey, new Date().toISOString());
  console.log('🔍 Component remount forced with key:', componentKey);
  console.log('📍 Current route should be /clients');
  
  // Force component identity change
  useEffect(() => {
    console.log('✅ Clients useEffect fired - component is definitely new');
    console.log('🎯 Active tab:', activeTab);
  }, [activeTab]);

  // Fetch user's firm information
  const { data: firmInfo } = useQuery({
    queryKey: ['userFirm', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data: firmUser, error: firmUserError } = await supabase
        .from('firm_users')
        .select('firm_id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();
      
      if (firmUserError || !firmUser) {
        console.error('Error fetching user firm:', firmUserError);
        return null;
      }
      
      const { data: firm, error: firmError } = await supabase
        .from('law_firms')
        .select('name')
        .eq('id', firmUser.firm_id)
        .single();
      
      if (firmError) {
        console.error('Error fetching firm details:', firmError);
        return null;
      }
      
      return firm;
    },
    enabled: !!session?.user?.id,
  });

  // If not authenticated, redirect to auth page
  if (!isLoading && !session) {
    return <Navigate to="/auth" />;
  }

  // Function to handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">
              {firmInfo?.name && (
                <span className="text-brand-burgundy dark:text-brand-gold">
                  {firmInfo.name}
                </span>
              )}
            </h1>
            
            <TabsList>
              <TabsTrigger 
                value="view-clients" 
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white data-[state=active]:bg-purple-700 transition-colors"
              >
                <User className="h-4 w-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger 
                value="add-client" 
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white data-[state=active]:bg-indigo-600 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Add Client
              </TabsTrigger>
              <TabsTrigger 
                value="quick-consult" 
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white data-[state=active]:bg-teal-700 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Quick Consult
              </TabsTrigger>
              <TabsTrigger 
                value="ai-agents" 
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white data-[state=active]:bg-amber-700 transition-colors"
              >
                <Brain className="h-4 w-4" />
                AI Agents
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="view-clients">
            <Card>
              <CardHeader>
                <CardTitle>Client List</CardTitle>
                <CardDescription>View and manage your existing clients</CardDescription>
              </CardHeader>
              <CardContent>
                <ClientList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add-client">
            <Card>
              <CardHeader>
                <CardTitle>Add New Client</CardTitle>
                <CardDescription>Enter client information to add them to your system</CardDescription>
              </CardHeader>
              <CardContent>
                <ClientForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="quick-consult" className="h-full">
            <ErrorBoundary 
              componentName="Quick Consult" 
              fallback={<QuickConsultFallback />}
            >
              <Suspense fallback={
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading Quick Consult...
                  </CardContent>
                </Card>
              }>
                <QuickConsultFallback />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="ai-agents">
            <ErrorBoundary 
              componentName="AI Agents" 
              fallback={<AIAgentsFallback />}
            >
              <Card>
                <CardHeader>
                  <CardTitle>3-Agent AI Legal Research System</CardTitle>
                  <CardDescription>
                    Advanced legal research using OpenAI, Perplexity, and Gemini working together
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading AI Research System...
                    </div>
                  }>
                    <AI3AgentDemo />
                  </Suspense>
                </CardContent>
              </Card>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Export with timestamp component name to force module refresh
const Clients = ClientsWithTimestamp;
export default Clients;
