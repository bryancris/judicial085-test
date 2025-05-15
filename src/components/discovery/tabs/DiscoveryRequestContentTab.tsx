
import React from 'react';
import { DiscoveryRequest } from '@/types/discovery';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';

interface DiscoveryRequestContentTabProps {
  request: DiscoveryRequest;
}

const DiscoveryRequestContentTab: React.FC<DiscoveryRequestContentTabProps> = ({ request }) => {
  return (
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
  );
};

export default DiscoveryRequestContentTab;
