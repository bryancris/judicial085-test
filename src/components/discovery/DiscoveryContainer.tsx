
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getDiscoveryRequests } from '@/utils/discoveryService';
import { DiscoveryRequest } from '@/types/discovery';
import { 
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent 
} from '@/components/ui/tabs';
import { 
  Card,
  CardContent 
} from '@/components/ui/card';
import DiscoveryRequestList from './DiscoveryRequestList';
import DiscoveryRequestForm from './DiscoveryRequestForm';
import DiscoveryLoadingSkeleton from './DiscoveryLoadingSkeleton';

interface DiscoveryContainerProps {
  clientId: string;
}

const DiscoveryContainer: React.FC<DiscoveryContainerProps> = ({ clientId }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'new-request'>('requests');
  const [requests, setRequests] = useState<DiscoveryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { requests, error } = await getDiscoveryRequests(clientId);
      
      if (error) {
        toast({
          title: "Error fetching discovery requests",
          description: error,
          variant: "destructive",
        });
      } else {
        setRequests(requests);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to load discovery requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [clientId]);

  const handleRequestCreated = () => {
    fetchRequests();
    setActiveTab('requests');
    toast({
      title: "Success",
      description: "Discovery request created successfully",
    });
  };

  if (isLoading) {
    return <DiscoveryLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'requests' | 'new-request')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="requests">Discovery Requests</TabsTrigger>
          <TabsTrigger value="new-request">Add New Request</TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests">
          <Card>
            <CardContent className="pt-6">
              <DiscoveryRequestList 
                requests={requests} 
                clientId={clientId} 
                onRequestUpdated={fetchRequests} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="new-request">
          <Card>
            <CardContent className="pt-6">
              <DiscoveryRequestForm 
                clientId={clientId} 
                onRequestCreated={handleRequestCreated} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiscoveryContainer;
