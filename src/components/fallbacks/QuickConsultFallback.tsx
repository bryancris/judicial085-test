import React from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const QuickConsultFallback: React.FC = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Quick Consult
        </CardTitle>
        <CardDescription>
          Quick legal consultation feature
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Service temporarily unavailable</span>
        </div>
        <p className="text-muted-foreground">
          The Quick Consult feature is currently being updated. Please try again in a few moments.
        </p>
        <Button onClick={handleRetry} variant="outline" size="sm">
          Retry
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickConsultFallback;