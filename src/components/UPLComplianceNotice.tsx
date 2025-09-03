import React from 'react';
import { AlertTriangle, Scale } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export const UPLComplianceNotice: React.FC = () => {
  return (
    <div className="bg-amber-50 border-t-4 border-amber-400 p-6">
      <div className="container mx-auto px-4">
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="font-medium text-amber-800">
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block mb-2">TEXAS UPL COMPLIANCE NOTICE - ATTORNEY USE ONLY</strong>
                <p className="text-sm leading-relaxed">
                  This platform provides research assistance tools for licensed attorneys only. All AI outputs require attorney review, verification, and professional judgment. 
                  This tool does not provide legal advice, legal conclusions, or create an attorney-client relationship. 
                  Compliant with Texas Government Code §81.101 and Texas State Bar Ethics Opinion 705.
                </p>
                <p className="text-xs mt-2 italic">
                  By using this platform, attorneys acknowledge their duty to maintain competence under Texas Rule 1.01 
                  and to independently verify all AI-generated content.
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};