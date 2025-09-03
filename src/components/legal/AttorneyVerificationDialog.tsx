import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from 'lucide-react';

interface AttorneyVerificationDialogProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const AttorneyVerificationDialog: React.FC<AttorneyVerificationDialogProps> = ({
  isOpen,
  onAccept,
  onDecline
}) => {
  const [hasAgreed, setHasAgreed] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={() => onDecline()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Attorney Research Assistant - Verification Required
          </DialogTitle>
          <DialogDescription>
            This AI research assistant is designed exclusively for licensed attorneys and legal professionals.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
              IMPORTANT LEGAL DISCLAIMERS
            </h3>
            <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
              <li>• This AI provides research assistance only, NOT legal advice or conclusions</li>
              <li>• All AI-generated content requires attorney review and professional judgment</li>
              <li>• Attorney must verify all research and citations independently</li>
              <li>• Use of this tool does not create an attorney-client relationship</li>
              <li>• Attorney must ensure compliance with all applicable rules of professional conduct</li>
              <li>• All work product generated must be reviewed before client use</li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              By continuing, you confirm that you are:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• A licensed attorney in good standing</li>
              <li>• Using this tool to assist with your legal practice</li>
              <li>• Understanding that all output requires attorney review</li>
              <li>• Accepting responsibility for any work product generated</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="attorney-verification" 
              checked={hasAgreed}
              onCheckedChange={(checked) => setHasAgreed(checked === true)}
            />
            <label 
              htmlFor="attorney-verification" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I confirm I am a licensed attorney and understand these disclaimers
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDecline}>
            Decline
          </Button>
          <Button 
            onClick={onAccept}
            disabled={!hasAgreed}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Continue to Platform
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};