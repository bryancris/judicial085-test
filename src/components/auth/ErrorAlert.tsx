
import React from 'react';
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ErrorAlertProps {
  error: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};
