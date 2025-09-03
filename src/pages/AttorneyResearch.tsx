import React, { useState } from 'react';
import { useAuthState } from "@/hooks/useAuthState";
import { Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, Users, Upload } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import AttorneyResearchChat from "@/components/clients/chat/AttorneyResearchChat";
import { useIsMobile } from "@/hooks/use-mobile";
import AttorneyResearchDocumentUploadDialog from "@/components/attorney-research/AttorneyResearchDocumentUploadDialog";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

const AttorneyResearch = () => {
  const { session, isLoading } = useAuthState();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Loading...
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!session) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Attorney Research Assistant</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(true)}
                className="text-muted-foreground hover:text-foreground"
                title="Chat History"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUploadDialog(true)}
              className="text-muted-foreground hover:text-foreground"
              title="Upload Documents"
            >
              <Upload className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/clients')}
              className="text-muted-foreground hover:text-foreground"
              title="View Clients"
            >
              <Users className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Legal Disclaimer */}
      <div className="border-b bg-amber-50 dark:bg-amber-950/20 px-4 py-2">
        <LegalDisclaimer variant="inline" className="text-center" />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 min-h-0">
          <AttorneyResearchChat 
            isMobile={isMobile}
            showSidebar={showSidebar}
            onCloseSidebar={() => setShowSidebar(false)}
          />
        </div>
      </main>

      {/* Upload Dialog */}
      <AttorneyResearchDocumentUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={() => {
          // Optionally refresh any document lists here
          console.log("Document uploaded successfully");
        }}
      />
    </div>
  );
};

export default AttorneyResearch;