
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LawReference {
  id: string;
  title: string | null;
  url: string | null;
  content?: string | null;
}

interface LawReferencesSectionProps {
  references: LawReference[];
  isLoading?: boolean;
}

const LawReferencesSection: React.FC<LawReferencesSectionProps> = ({
  references,
  isLoading = false
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {references.map((ref, index) => (
            <div key={index} className="border p-3 rounded-md">
              <h3 className="font-medium text-lg">{ref.title || "Texas Law Reference"}</h3>
              
              {ref.content && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>{ref.content}</p>
                </div>
              )}
              
              {ref.url && (
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open(ref.url!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Full Document
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LawReferencesSection;
