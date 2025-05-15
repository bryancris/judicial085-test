
import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface DiscoveryResponseEditorCardProps {
  generatedResponse: string;
  onSaveResponse: (response: string) => void;
  isGenerating: boolean;
}

const DiscoveryResponseEditorCard: React.FC<DiscoveryResponseEditorCardProps> = ({
  generatedResponse,
  onSaveResponse,
  isGenerating,
}) => {
  const [editedResponse, setEditedResponse] = useState<string>(generatedResponse);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Generated Response</CardTitle>
        <CardDescription>
          Edit this AI-generated response before saving.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={editedResponse}
          onChange={(e) => setEditedResponse(e.target.value)}
          className="min-h-[400px] font-mono text-sm"
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setEditedResponse(generatedResponse)}
          disabled={isGenerating}
        >
          Reset to Original
        </Button>
        <Button
          onClick={() => onSaveResponse(editedResponse)}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Response
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DiscoveryResponseEditorCard;
