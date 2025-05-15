
import React from 'react';
import { DiscoveryResponse } from '@/types/discovery';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import DiscoveryResponseEditor from '../DiscoveryResponseEditor';

interface DiscoveryResponsesTabProps {
  responses: DiscoveryResponse[];
  clientId: string;
  requestId: string;
  onCreateResponse: () => void;
}

const DiscoveryResponsesTab: React.FC<DiscoveryResponsesTabProps> = ({
  responses,
  clientId,
  requestId,
  onCreateResponse
}) => {
  if (responses.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No Responses Yet</h3>
        <p className="text-muted-foreground mt-2 mb-6">
          Generate a response using the Analyze & Respond tab.
        </p>
        <Button onClick={onCreateResponse}>
          Create Response
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {responses.map((response) => (
        <DiscoveryResponseEditor
          key={response.id}
          response={response}
          clientId={clientId}
          requestId={requestId}
        />
      ))}
    </div>
  );
};

export default DiscoveryResponsesTab;
