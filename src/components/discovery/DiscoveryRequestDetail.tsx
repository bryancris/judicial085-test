
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getDiscoveryRequest, getDiscoveryResponses, updateDiscoveryRequest } from '@/utils/discoveryService';
import { DiscoveryRequest, DiscoveryResponse } from '@/types/discovery';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  FileText,
  Clock,
  User,
  Check,
  FileSearch,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import DiscoveryResponseGenerator from './DiscoveryResponseGenerator';
import DiscoveryResponseEditor from './DiscoveryResponseEditor';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    case 'in_progress':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

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
        <Button onClick={() => navigate(`/clients/${clientId}`)}>
          Return to Client
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(`/clients/${clientId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleUpdateStatus('pending')}>Mark as Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateStatus('in_progress')}>Mark In Progress</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateStatus('completed')}>Mark as Completed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{request.title}</CardTitle>
              <CardDescription className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Received: {formatDate(request.date_received)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">From: {request.requesting_party || 'Unknown'}</span>
                </div>
                <StatusBadge status={request.status} />
              </CardDescription>
            </div>
          </div>
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
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Discovery Request Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-450px)] pr-4">
                    <div className="whitespace-pre-wrap font-mono text-sm">
                      {request.content}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analyze">
              <DiscoveryResponseGenerator 
                request={request} 
                onResponseCreated={handleResponseCreated} 
              />
            </TabsContent>
            
            <TabsContent value="responses">
              {responses.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Responses Yet</h3>
                  <p className="text-muted-foreground mt-2 mb-6">
                    Generate a response using the Analyze & Respond tab.
                  </p>
                  <Button onClick={() => setActiveTab('analyze')}>
                    Create Response
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {responses.map((response) => (
                    <DiscoveryResponseEditor 
                      key={response.id} 
                      response={response} 
                      clientId={clientId || ''} 
                      requestId={requestId || ''} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscoveryRequestDetail;
