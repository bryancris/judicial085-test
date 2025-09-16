
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LawReference {
  id: string;
  title: string | null;
  url: string | null;
  content?: string | null;
}

export interface LawReferencesSectionProps {
  references: LawReference[];
  isLoading?: boolean;
  caseType?: string;
}

const LawReferencesSection: React.FC<LawReferencesSectionProps> = ({
  references,
  isLoading = false,
  caseType
}) => {
  // Show an empty state instead of returning null
  const hasReferences = references && references.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="step-card-title">
          <Scale className="h-5 w-5 text-[#0EA5E9]" />
          <span className="step-number">Step 9:</span>
          Relevant Texas Law References
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Legal documents relevant to this case analysis
        </p>
      </CardHeader>
      <CardContent className="step-content-unified">
        {!hasReferences ? (
          <div className="step-empty">
            <p>No law references found in the current analysis.</p>
            <p className="text-xs mt-2">Law references will appear here when they are extracted from the legal analysis content.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {references.map((ref, index) => (
            <div key={index} className="border p-4 rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-lg flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    {ref.title || "Texas Law Reference"}
                  </h3>
                  
                  {ref.content && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>{ref.content}</p>
                    </div>
                  )}
                </div>
                
                {ref.url && (
                  <div className="ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 bg-white hover:bg-blue-50"
                      onClick={() => window.open(ref.url!, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Document
                    </Button>
                  </div>
                )}
              </div>
              </div>
            ))}
          </div>
        )}
        
        {hasReferences && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              <strong>Note:</strong> These references are automatically extracted from the legal analysis and linked to relevant Texas law documents. Click "View Document" to open the full PDF document.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LawReferencesSection;
