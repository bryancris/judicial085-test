
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Phone, Mail, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import CreateFirmDialog from "./CreateFirmDialog";

const FirmsManagement = () => {
  const [createFirmOpen, setCreateFirmOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: firms, isLoading } = useQuery({
    queryKey: ['adminFirms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('law_firms')
        .select('*, firm_users(id)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const toggleFirmStatus = useMutation({
    mutationFn: async ({ firmId, isActive }: { firmId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('law_firms')
        .update({ is_active: !isActive })
        .eq('id', firmId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFirms'] });
      toast({
        title: "Success",
        description: "Firm status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update firm status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading firms...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Law Firms Management
          </CardTitle>
          <Button onClick={() => setCreateFirmOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Firm
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {firms?.map((firm) => (
              <div key={firm.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{firm.name}</h3>
                    <Badge variant={firm.is_active ? "default" : "secondary"}>
                      {firm.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      {firm.firm_users?.length || 0} Users
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {firm.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{firm.address}, {firm.city}, {firm.state} {firm.zip_code}</span>
                      </div>
                    )}
                    {firm.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{firm.phone}</span>
                      </div>
                    )}
                    {firm.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{firm.email}</span>
                      </div>
                    )}
                    {firm.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{firm.website}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={firm.is_active ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleFirmStatus.mutate({ 
                      firmId: firm.id, 
                      isActive: firm.is_active 
                    })}
                    disabled={toggleFirmStatus.isPending}
                  >
                    {firm.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
            
            {(!firms || firms.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No law firms found. Create your first firm to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateFirmDialog 
        open={createFirmOpen} 
        onOpenChange={setCreateFirmOpen}
      />
    </>
  );
};

export default FirmsManagement;
