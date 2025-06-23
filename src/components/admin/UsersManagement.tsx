
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Building2, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const UsersManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch profiles separately
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['adminProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch user roles separately
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['adminUserRoles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch firm users separately
  const { data: firmUsers, isLoading: firmUsersLoading } = useQuery({
    queryKey: ['adminFirmUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('firm_users')
        .select('user_id, firm_id, is_active')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch law firms for firm names
  const { data: lawFirms, isLoading: firmsLoading } = useQuery({
    queryKey: ['adminLawFirms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('law_firms')
        .select('id, name');
      
      if (error) throw error;
      return data;
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('firm_users')
        .update({ is_active: !isActive })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFirmUsers'] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const isLoading = profilesLoading || rolesLoading || firmUsersLoading || firmsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading users...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Merge data on the client side
  const mergedUsers = profiles?.map(profile => {
    const userRole = userRoles?.find(role => role.user_id === profile.id);
    const firmUser = firmUsers?.find(fu => fu.user_id === profile.id);
    const lawFirm = firmUser ? lawFirms?.find(firm => firm.id === firmUser.firm_id) : null;

    return {
      ...profile,
      role: userRole?.role || null,
      firm_association: firmUser || null,
      firm_name: lawFirm?.name || null
    };
  }) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mergedUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : 'Unnamed User'
                    }
                  </h3>
                  {user.role && (
                    <Badge 
                      variant={user.role === 'super_admin' ? "default" : "secondary"}
                      className="capitalize"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role.replace('_', ' ')}
                    </Badge>
                  )}
                  {user.firm_association && (
                    <Badge variant={user.firm_association.is_active ? "default" : "secondary"}>
                      {user.firm_association.is_active ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {user.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.firm_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{user.firm_name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {user.firm_association && user.role !== 'super_admin' && (
                  <Button
                    variant={user.firm_association.is_active ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleUserStatus.mutate({ 
                      userId: user.id, 
                      isActive: user.firm_association.is_active
                    })}
                    disabled={toggleUserStatus.isPending}
                  >
                    {user.firm_association.is_active ? "Deactivate" : "Activate"}
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {(!mergedUsers || mergedUsers.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersManagement;
