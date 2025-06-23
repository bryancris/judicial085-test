import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { useAuthState } from "@/hooks/useAuthState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, Shield, UserPlus } from "lucide-react";
import AdminDashboardSkeleton from "@/components/admin/AdminDashboardSkeleton";
import FirmsManagement from "@/components/admin/FirmsManagement";
import UsersManagement from "@/components/admin/UsersManagement";
import CreateUserDialog from "@/components/admin/CreateUserDialog";
import { Button } from "@/components/ui/button";

const Admin = () => {
  const { session, isLoading: authLoading } = useAuthState();
  const [createUserOpen, setCreateUserOpen] = useState(false);

  // Check if user is super admin
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['userRole', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'super_admin')
        .single();
      
      if (error) {
        console.error('Error checking user role:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Get dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const [firmsResponse, usersResponse, profilesResponse] = await Promise.all([
        supabase.from('law_firms').select('id', { count: 'exact' }),
        supabase.from('user_roles').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' })
      ]);

      return {
        firms: firmsResponse.count || 0,
        users: usersResponse.count || 0,
        profiles: profilesResponse.count || 0
      };
    },
    enabled: !!userRole,
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <AdminDashboardSkeleton />
        </main>
      </div>
    );
  }

  // If not authenticated or not super admin, redirect
  if (!session || !userRole) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage law firms, users, and system settings
            </p>
          </div>
          <Button onClick={() => setCreateUserOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Law Firms</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.firms || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active law firms in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.users || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Attorneys and paralegals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profiles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.profiles || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Complete user profiles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="firms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="firms">Law Firms</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="firms" className="space-y-6">
            <FirmsManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UsersManagement />
          </TabsContent>
        </Tabs>

        <CreateUserDialog 
          open={createUserOpen} 
          onOpenChange={setCreateUserOpen}
        />
      </main>
    </div>
  );
};

export default Admin;
