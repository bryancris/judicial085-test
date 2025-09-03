import React from 'react';
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
        
        <div className="mt-6 pt-4 border-t">
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