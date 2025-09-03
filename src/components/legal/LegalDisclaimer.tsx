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
        <strong>IMPORTANT LEGAL DISCLAIMER:</strong> This software is NOT a substitute for attorney advice. 
        All AI-generated content must be reviewed by a licensed attorney. This tool is designed for attorney use only 
        and does not provide legal advice or create an attorney-client relationship.
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
        This software is not a substitute for attorney advice. All AI-generated content must be reviewed by a licensed attorney.
      </div>
    );
  }

  return (
    <Alert className={`border-muted ${className}`}>
      {content}
    </Alert>
  );
};