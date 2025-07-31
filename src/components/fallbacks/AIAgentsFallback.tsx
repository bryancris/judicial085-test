import React from 'react';
import { Brain, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AIAgentsFallback: React.FC = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          3-Agent AI Legal Research System
        </CardTitle>
        <CardDescription>
          Advanced legal research using OpenAI, Perplexity, and Gemini working together
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">AI system temporarily unavailable</span>
        </div>
        <p className="text-muted-foreground">
          The AI research system is currently being updated. Please try again in a few moments.
        </p>
        <Button onClick={handleRetry} variant="outline" size="sm">
          Retry
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIAgentsFallback;