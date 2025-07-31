import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QuickConsultChat = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Consult</CardTitle>
        <CardDescription>
          Quick consultation feature is being updated to integrate with the new 3-Agent AI system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This feature is temporarily unavailable while we integrate OpenAI, Perplexity, and Gemini agents. 
          Please use the new AI Agents tab for advanced legal research.
        </p>
      </CardContent>
    </Card>
  );
};

export default QuickConsultChat;