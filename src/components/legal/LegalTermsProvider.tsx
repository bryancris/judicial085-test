import React, { createContext, useContext, useState, useEffect } from 'react';
import { AttorneyVerificationDialog } from './AttorneyVerificationDialog';

interface LegalTermsContextType {
  hasAcceptedTerms: boolean;
  acceptTerms: () => void;
}

const LegalTermsContext = createContext<LegalTermsContextType | undefined>(undefined);

export const useLegalTerms = () => {
  const context = useContext(LegalTermsContext);
  if (!context) {
    throw new Error('useLegalTerms must be used within a LegalTermsProvider');
  }
  return context;
};

interface LegalTermsProviderProps {
  children: React.ReactNode;
}

export const LegalTermsProvider: React.FC<LegalTermsProviderProps> = ({ children }) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  useEffect(() => {
    // Check if user has already accepted terms
    const accepted = localStorage.getItem('judicial-junction-terms-accepted');
    if (accepted === 'true') {
      setHasAcceptedTerms(true);
    } else {
      // Show verification dialog after a short delay
      setTimeout(() => setShowVerificationDialog(true), 1000);
    }
  }, []);

  const acceptTerms = () => {
    localStorage.setItem('judicial-junction-terms-accepted', 'true');
    setHasAcceptedTerms(true);
    setShowVerificationDialog(false);
  };

  const declineTerms = () => {
    // Redirect to terms page or close application
    window.location.href = '/terms-of-service';
  };

  return (
    <LegalTermsContext.Provider value={{ hasAcceptedTerms, acceptTerms }}>
      {children}
      <AttorneyVerificationDialog
        isOpen={showVerificationDialog}
        onAccept={acceptTerms}
        onDecline={declineTerms}
      />
    </LegalTermsContext.Provider>
  );
};