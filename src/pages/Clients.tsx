
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import NavBar from '@/components/NavBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, UserPlus } from 'lucide-react';
import ClientForm from '@/components/clients/ClientForm';
import ClientList from '@/components/clients/ClientList';
import { useDocumentAuth } from '@/hooks/useDocumentAuth';

const Clients = () => {
  const { session, loading } = useDocumentAuth();

  // If not authenticated, redirect to auth page
  if (!loading && !session) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Clients</h1>
        <p className="text-lg mb-4">Manage your legal clients and cases here.</p>
        
        <Tabs defaultValue="view-clients" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="view-clients" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="add-client" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Client
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
        </Tabs>
      </main>
    </div>
  );
};

export default Clients;
