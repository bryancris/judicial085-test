
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import NavBar from '@/components/NavBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, UserPlus, MessageSquare } from 'lucide-react';
import ClientForm from '@/components/clients/ClientForm';
import ClientList from '@/components/clients/ClientList';
import QuickConsultChat from '@/components/clients/chat/QuickConsultChat';
import { useDocumentAuth } from '@/hooks/useDocumentAuth';
import { useQuery } from '@tanstack/react-query';

const Clients = () => {
  const { session, loading } = useDocumentAuth();
  const [activeTab, setActiveTab] = useState("view-clients");

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
  if (!loading && !session) {
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
        <h1 className="text-3xl font-bold mb-6">
          {firmInfo?.name && (
            <span className="text-brand-burgundy dark:text-brand-gold mr-3">
              {firmInfo.name}
            </span>
          )}
          Clients
        </h1>
        
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4">
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
          </TabsList>
          
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
          
          <TabsContent value="quick-consult">
            <Card>
              <CardContent>
                <QuickConsultChat />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Clients;
