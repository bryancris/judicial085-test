import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Calendar, List, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { parseStructuredCaseData, StructuredCaseData } from "@/utils/caseSummaryParser";

interface CaseSummarySectionProps {
  caseSummary: string;
  isLoading?: boolean;
  clientId?: string;
}

const CaseSummarySection: React.FC<CaseSummarySectionProps> = ({
  caseSummary,
  isLoading = false,
  clientId
}) => {
  const [structuredData, setStructuredData] = useState<StructuredCaseData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (caseSummary && clientId) {
      setDataLoading(true);
      parseStructuredCaseData(caseSummary, clientId)
        .then(setStructuredData)
        .finally(() => setDataLoading(false));
    }
  }, [caseSummary, clientId]);
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!caseSummary?.trim()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="text-muted-foreground">Step 1:</span>
            Case Summary (Organized Fact Pattern)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No case summary available.</p>
        </CardContent>
      </Card>
    );
  }

  const isDataLoading = isLoading || dataLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="text-muted-foreground">Step 1:</span>
          Case Summary (Organized Fact Pattern)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parties Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Parties</h4>
          </div>
          <div className="pl-6">
            {isDataLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-36"></div>
              </div>
            ) : structuredData?.parties && structuredData.parties.length > 0 ? (
              <div className="space-y-2">
                {structuredData.parties.map((party, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {party.role}
                    </Badge>
                    <span className="text-sm">{party.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No party information available</p>
            )}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Timeline</h4>
          </div>
          <div className="pl-6">
            {isDataLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
              </div>
            ) : structuredData?.timeline && structuredData.timeline.length > 0 ? (
              <div className="space-y-3">
                {structuredData.timeline.map((event, idx) => (
                  <div key={idx} className="border-l-2 border-muted pl-4">
                    <div className="font-medium text-sm text-primary">{event.date}</div>
                    <div className="text-sm text-muted-foreground">{event.event}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No timeline information available</p>
            )}
          </div>
        </div>

        {/* Core Facts Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Core Facts</h4>
          </div>
          <div className="pl-6">
            {isDataLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-4/5"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            ) : structuredData?.coreFacts && structuredData.coreFacts.length > 0 ? (
              <ul className="space-y-2">
                {structuredData.coreFacts.map((fact, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No core facts identified</p>
            )}
          </div>
        </div>

        {/* Key Documents Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <File className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Key Documents</h4>
          </div>
          <div className="pl-6">
            {isDataLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
              </div>
            ) : structuredData?.keyDocuments && structuredData.keyDocuments.length > 0 ? (
              <div className="space-y-2">
                {structuredData.keyDocuments.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Badge 
                      variant={doc.status === 'completed' ? 'default' : 
                              doc.status === 'pending' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {doc.status}
                    </Badge>
                    <span className="text-sm">{doc.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No documents uploaded for this case</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseSummarySection;