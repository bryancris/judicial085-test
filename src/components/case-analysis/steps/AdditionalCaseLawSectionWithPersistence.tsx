import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisData } from "@/hooks/useAnalysisData";
import LawReferenceLink from "@/components/knowledge/LawReferenceLink";

interface CaseLawItem {
  id: string;
  title: string;
  citation: string;
  holding: string;
  relevance: string;
  type: 'favorable' | 'adverse' | 'neutral';
  url?: string;
}

interface AdditionalCaseLawSectionProps {
  analysisData: AnalysisData;
  clientId: string;
  caseType?: string;
}

const AdditionalCaseLawSectionWithPersistence: React.FC<AdditionalCaseLawSectionProps> = ({
  analysisData,
  clientId,
  caseType
}) => {
  const [caseLaw, setCaseLaw] = useState<CaseLawItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCaseLaw = async () => {
      setIsLoading(true);
      try {
        console.log("🔍 Fetching Additional Case Law for:", { clientId, analysisId: analysisData.id });
        
        // First try to find case law linked to current analysis
        let { data: caseLawData, error } = await supabase
          .from("additional_case_law")
          .select("id, case_name, citation, relevant_facts, outcome, url, created_at")
          .eq("legal_analysis_id", analysisData.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching case-specific case law:", error);
        }

        // If no case law found for this analysis, fall back to most recent for this client
        if (!caseLawData || caseLawData.length === 0) {
          console.log("🔄 No case law for analysis, falling back to client-level");
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("additional_case_law")
            .select("id, case_name, citation, relevant_facts, outcome, url, created_at")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false })
            .limit(10);

          if (fallbackError) {
            console.error("Error fetching fallback case law:", fallbackError);
          } else {
            caseLawData = fallbackData;
            console.log(`✅ Using fallback case law: ${caseLawData?.length || 0} items`);
          }
        } else {
          console.log(`✅ Found case law for analysis: ${caseLawData.length} items`);
        }

        // Transform the data to match the expected format
        const transformedCaseLaw = (caseLawData || []).map(item => ({
          id: item.id,
          title: item.case_name || "",
          citation: item.citation || "",
          holding: item.relevant_facts || "",
          relevance: item.outcome || "",
          type: 'neutral' as 'favorable' | 'adverse' | 'neutral', // Default to neutral since we don't have this field
          url: item.url || undefined
        }));

        setCaseLaw(transformedCaseLaw);
      } catch (err) {
        console.error("Unexpected error fetching case law:", err);
        setCaseLaw([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId && analysisData.id) {
      fetchCaseLaw();
    } else {
      setIsLoading(false);
    }
  }, [clientId, analysisData.id]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-44 bg-muted animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!caseLaw || caseLaw.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span className="text-muted-foreground">Step 4:</span>
            Additional Case Law (Precedent research)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No additional case law research available.</p>
        </CardContent>
      </Card>
    );
  }

  const favorableCases = caseLaw.filter(c => c.type === 'favorable');
  const adverseCases = caseLaw.filter(c => c.type === 'adverse');
  const neutralCases = caseLaw.filter(c => c.type === 'neutral');

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'favorable': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'adverse': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const renderCaseGroup = (cases: CaseLawItem[], title: string) => {
    if (cases.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h5 className="font-medium text-sm">
                {caseItem.url ? (
                  <LawReferenceLink citation={caseItem.title} url={caseItem.url}>
                    {caseItem.title}
                  </LawReferenceLink>
                ) : (
                  caseItem.title
                )}
              </h5>
              <Badge className={getTypeColor(caseItem.type)}>
                {caseItem.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{caseItem.citation}</p>
            <p className="text-sm"><strong>Holding:</strong> {caseItem.holding}</p>
            <p className="text-sm"><strong>Relevance:</strong> {caseItem.relevance}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <span className="text-muted-foreground">Step 4:</span>
          Additional Case Law (Precedent research)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderCaseGroup(favorableCases, "Favorable Precedents")}
        {renderCaseGroup(adverseCases, "Adverse Precedents")}
        {renderCaseGroup(neutralCases, "Additional Cases")}
      </CardContent>
    </Card>
  );
};

export default AdditionalCaseLawSectionWithPersistence;