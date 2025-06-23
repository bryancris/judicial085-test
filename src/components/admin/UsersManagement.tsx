
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

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role),
          firm_users(
            is_active,
            law_firms(name)
          )
        `)
        .order('created_at', { ascending: false });
      
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
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading users...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

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
          {users?.map((user) => {
            const userRole = user.user_roles?.[0]?.role;
            const firmAssociation = user.firm_users?.[0];
            const firmName = firmAssociation?.law_firms?.name;
            
            return (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : 'Unnamed User'
                      }
                    </h3>
                    {userRole && (
                      <Badge 
                        variant={userRole === 'super_admin' ? "default" : "secondary"}
                        className="capitalize"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {userRole.replace('_', ' ')}
                      </Badge>
                    )}
                    {firmAssociation && (
                      <Badge variant={firmAssociation.is_active ? "default" : "secondary"}>
                        {firmAssociation.is_active ? "Active" : "Inactive"}
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
                    {firmName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{firmName}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {firmAssociation && userRole !== 'super_admin' && (
                    <Button
                      variant={firmAssociation.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatus.mutate({ 
                        userId: user.id, 
                        isActive: firmAssociation.is_active 
                      })}
                      disabled={toggleUserStatus.isPending}
                    >
                      {firmAssociation.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          
          {(!users || users.length === 0) && (
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
