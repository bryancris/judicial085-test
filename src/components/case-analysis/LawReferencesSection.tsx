
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
  if (!references || references.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Scale className="h-5 w-5 mr-2 text-[#0EA5E9]" />
          Relevant Texas Law References
          {isLoading && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Legal documents relevant to this case analysis
        </p>
      </CardHeader>
      <CardContent>
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
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-md">
          <p className="text-sm text-blue-700 dark:text-blue-200">
            <strong>Note:</strong> These references are automatically extracted from the legal analysis and linked to relevant Texas law documents. Click "View Document" to open the full PDF document.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LawReferencesSection;
