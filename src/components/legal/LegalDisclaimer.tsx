import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LegalDisclaimerProps {
  variant?: 'default' | 'prominent' | 'inline';
  className?: string;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ 
  variant = 'default',
  className = '' 
}) => {
  const content = (
    <>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="font-medium">
        <strong>ATTORNEY RESEARCH ASSISTANT DISCLAIMER:</strong> This AI tool provides research assistance only. 
        All output requires attorney review and professional judgment. This tool does not provide legal advice, 
        legal conclusions, or create an attorney-client relationship. For attorney use only.
      </AlertDescription>
    </>
  );

  if (variant === 'prominent') {
    return (
      <Alert className={`border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 ${className}`}>
        {content}
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`text-xs text-muted-foreground italic ${className}`}>
        Research assistance only. All AI output requires attorney review and professional judgment.
      </div>
    );
  }

  return (
    <Alert className={`border-muted ${className}`}>
      {content}
    </Alert>
  );
};