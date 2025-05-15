
import React from 'react';
import { DiscoveryRequest } from '@/types/discovery';
import { Clock, User } from 'lucide-react';
import {
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import DiscoveryStatusBadge from './common/DiscoveryStatusBadge';
import { formatDate } from '@/utils/dateUtils';

interface DiscoveryRequestHeaderProps {
  request: DiscoveryRequest;
}

const DiscoveryRequestHeader: React.FC<DiscoveryRequestHeaderProps> = ({ request }) => {
  return (
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
          <DiscoveryStatusBadge status={request.status} />
        </CardDescription>
      </div>
    </div>
  );
};

export default DiscoveryRequestHeader;
