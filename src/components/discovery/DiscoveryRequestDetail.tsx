
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getDiscoveryRequest, getDiscoveryResponses, updateDiscoveryRequest } from '@/utils/discoveryService';
import { DiscoveryRequest, DiscoveryResponse } from '@/types/discovery';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { FileText, FileSearch, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import the refactored components
import DiscoveryResponseGenerator from './DiscoveryResponseGenerator';
import DiscoveryRequestActions from './DiscoveryRequestActions';
import DiscoveryRequestHeader from './DiscoveryRequestHeader';
import DiscoveryRequestContentTab from './tabs/DiscoveryRequestContentTab';
import DiscoveryResponsesTab from './tabs/DiscoveryResponsesTab';

const DiscoveryRequestDetail: React.FC = () => {
  const { clientId, requestId } = useParams<{ clientId: string; requestId: string }>();
  const [request, setRequest] = useState<DiscoveryRequest | null>(null);
  const [responses, setResponses] = useState<DiscoveryResponse[]>([]);
  const [activeTab, setActiveTab] = useState('request');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchRequestData = async () => {
    setIsLoading(true);
    try {
      if (!requestId) {
        toast({
          title: "Error",
          description: "Request ID is missing",
          variant: "destructive",
        });
        return;
      }

      // Fetch request details
      const { request: requestData, error: requestError } = await getDiscoveryRequest(requestId);
      if (requestError) {
        toast({
          title: "Error fetching request",
          description: requestError,
          variant: "destructive",
        });
        return;
      }
      
      setRequest(requestData);

      // Fetch responses
      const { responses: responseData, error: responsesError } = await getDiscoveryResponses(requestId);
      if (responsesError) {
        toast({
          title: "Error fetching responses",
          description: responsesError,
          variant: "destructive",
        });
      } else {
        setResponses(responseData);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to load discovery request details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestData();
  }, [requestId]);

  const handleResponseCreated = () => {
    fetchRequestData();
    toast({
      title: "Success",
      description: "Response created successfully",
    });
    // Switch to the responses tab
    setActiveTab('responses');
  };

  const handleUpdateStatus = async (status: 'pending' | 'in_progress' | 'completed') => {
    if (!request || !requestId) return;
    
    try {
      const { request: updatedRequest, error } = await updateDiscoveryRequest(requestId, { status });
      
      if (error) {
        toast({
          title: "Error updating status",
          description: error,
          variant: "destructive",
        });
        return;
      }
      
      setRequest(updatedRequest);
      toast({
        title: "Status updated",
        description: `Request is now marked as ${status.replace('_', ' ')}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>; // Replace with a proper skeleton
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-2">Request not found</h2>
        <p className="text-muted-foreground mb-6">
          The requested discovery request could not be found.
        </p>
        <button onClick={() => navigate(`/clients/${clientId}`)}>
          Return to Client
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DiscoveryRequestActions 
        clientId={clientId || ''}
        onUpdateStatus={handleUpdateStatus}
      />

      <Card>
        <CardHeader className="pb-3">
          <DiscoveryRequestHeader request={request} />
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="request" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Request
              </TabsTrigger>
              <TabsTrigger value="analyze" className="flex items-center gap-2">
                <FileSearch className="h-4 w-4" /> Analyze & Respond
              </TabsTrigger>
              <TabsTrigger value="responses" className="flex items-center gap-2">
                <Check className="h-4 w-4" /> Responses ({responses.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="request">
              <DiscoveryRequestContentTab request={request} />
            </TabsContent>
            
            <TabsContent value="analyze">
              <DiscoveryResponseGenerator 
                request={request} 
                onResponseCreated={handleResponseCreated} 
              />
            </TabsContent>
            
            <TabsContent value="responses">
              <DiscoveryResponsesTab 
                responses={responses}
                clientId={clientId || ''}
                requestId={requestId || ''}
                onCreateResponse={() => setActiveTab('analyze')}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscoveryRequestDetail;
