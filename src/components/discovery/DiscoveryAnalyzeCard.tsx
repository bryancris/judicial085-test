
import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

interface DiscoveryAnalyzeCardProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const DiscoveryAnalyzeCard: React.FC<DiscoveryAnalyzeCardProps> = ({ 
  onAnalyze, 
  isAnalyzing 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Analyze Discovery Request</CardTitle>
        <CardDescription>
          AI will analyze the request and suggest appropriate responses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Using AI, we'll analyze the request to identify:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Request type and format</li>
          <li>Number of individual requests</li>
          <li>Potential issues requiring objections</li>
          <li>Suggested approach for responding</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze with AI
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DiscoveryAnalyzeCard;
