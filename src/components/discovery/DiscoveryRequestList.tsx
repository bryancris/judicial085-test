
import React from 'react';
import { DiscoveryRequest } from '@/types/discovery';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DiscoveryRequestListProps {
  requests: DiscoveryRequest[];
  clientId: string;
  onRequestUpdated: () => void;
}

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

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'in_progress':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return null;
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const DiscoveryRequestList: React.FC<DiscoveryRequestListProps> = ({ 
  requests, 
  clientId,
  onRequestUpdated 
}) => {
  const navigate = useNavigate();

  const handleViewRequest = (requestId: string) => {
    navigate(`/clients/${clientId}/discovery/${requestId}`);
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No Discovery Requests</h3>
        <p className="text-muted-foreground mt-2">
          Add a new discovery request to get started.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-medium text-base">{request.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {request.content.substring(0, 150)}
                      {request.content.length > 150 ? '...' : ''}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Received: {formatDate(request.date_received)}
                      </div>
                      <div className="flex items-center gap-1">
                        <StatusIcon status={request.status} />
                        <StatusBadge status={request.status} />
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="ml-4"
                  onClick={() => handleViewRequest(request.id)}
                >
                  View <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default DiscoveryRequestList;
