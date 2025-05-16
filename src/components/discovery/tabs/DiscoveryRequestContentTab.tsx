
import React from 'react';
import { DiscoveryRequest } from '@/types/discovery';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import { processMarkdown } from '@/utils/markdownProcessor';

interface DiscoveryRequestContentTabProps {
  request: DiscoveryRequest;
}

const DiscoveryRequestContentTab: React.FC<DiscoveryRequestContentTabProps> = ({ request }) => {
  // Process content with markdown if it contains markdown formatting
  const processedContent = React.useMemo(() => {
    if (request.content.includes('#') || request.content.includes('-') || request.content.includes('*')) {
      return processMarkdown(request.content);
    }
    return request.content;
  }, [request.content]);

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Discovery Request Content</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-450px)] pr-4">
          {processedContent.includes('<p>') || processedContent.includes('<h') ? (
            <div 
              className="prose prose-sm max-w-none" 
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          ) : (
            <div className="whitespace-pre-wrap font-mono text-sm">
              {request.content}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DiscoveryRequestContentTab;
