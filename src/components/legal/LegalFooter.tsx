import React from 'react';
import { AlertTriangle, Scale } from 'lucide-react';
import { LegalDisclaimer } from './LegalDisclaimer';

export const LegalFooter: React.FC = () => {
  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Judicial Junction</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered research assistance for Texas attorneys
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Legal</h4>
            <div className="space-y-1">
              <a href="/terms-of-service" className="block text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </a>
              <a href="/privacy-policy" className="block text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </a>
              <a href="/faq" className="block text-sm text-muted-foreground hover:text-foreground">
                FAQ & Help
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Contact</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>support@judicialjunction.com</p>
              <p>Texas, USA</p>
            </div>
          </div>
        </div>
        
        {/* UPL Compliance Notice */}
        <div className="mt-6 pt-4 border-t">
          <div className="bg-muted/30 border border-muted-foreground/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Scale className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <strong className="block mb-1 text-foreground">TEXAS UPL COMPLIANCE NOTICE - ATTORNEY USE ONLY</strong>
                <p className="leading-relaxed mb-2">
                  This platform provides research assistance tools for licensed attorneys only. All AI outputs require attorney review, verification, and professional judgment. 
                  This tool does not provide legal advice, legal conclusions, or create an attorney-client relationship. 
                  Compliant with Texas Government Code §81.101 and Texas State Bar Ethics Opinion 705.
                </p>
                <p className="leading-relaxed mb-2">
                  Attorneys must comply with applicable court rules regarding AI disclosure when filing documents.
                </p>
                <p className="text-xs italic">
                  By using this platform, attorneys acknowledge their duty to maintain competence under Texas Rule 1.01 
                  and to independently verify all AI-generated content.
                </p>
              </div>
            </div>
          </div>
          
          <LegalDisclaimer variant="inline" className="mb-2" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Judicial Junction. All rights reserved. 
            Designed for licensed attorneys only.
          </p>
        </div>
      </div>
    </footer>
  );
};