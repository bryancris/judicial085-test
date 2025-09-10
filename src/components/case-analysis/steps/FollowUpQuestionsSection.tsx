import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, AlertCircle, Users, Microscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FollowUpQuestionsData {
  criticalInformationNeeded: string[];
  additionalInvestigation: {
    areas: string[];
    witnesses: string[];
    documents: string[];
  };
  expertConsultation: {
    needed: boolean;
    areas: string[];
  };
}

interface FollowUpQuestionsSectionProps {
  questionsData: FollowUpQuestionsData | null;
  followUpQuestions?: string[]; // Fallback for legacy data
  isLoading?: boolean;
}

const FollowUpQuestionsSection: React.FC<FollowUpQuestionsSectionProps> = ({
  questionsData,
  followUpQuestions = [],
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use legacy data if new format is not available
  const hasLegacyData = !questionsData && followUpQuestions.length > 0;
  const hasNewData = questionsData && (
    questionsData.criticalInformationNeeded.length > 0 ||
    questionsData.additionalInvestigation.areas.length > 0 ||
    questionsData.additionalInvestigation.witnesses.length > 0 ||
    questionsData.additionalInvestigation.documents.length > 0 ||
    questionsData.expertConsultation.needed
  );

  if (!hasLegacyData && !hasNewData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            <span className="text-muted-foreground">Step 8:</span>
            Recommended Follow-up Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No follow-up questions available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          <span className="text-muted-foreground">Step 8:</span>
          Recommended Follow-up Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Legacy format fallback */}
        {hasLegacyData && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Follow-up Questions
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {followUpQuestions.map((question, idx) => (
                <li key={idx} className="text-muted-foreground">{question}</li>
              ))}
            </ol>
          </div>
        )}

        {/* New structured format */}
        {hasNewData && (
          <>
            {/* Critical Information Needed */}
            {questionsData!.criticalInformationNeeded.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Critical Information Needed
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  {questionsData!.criticalInformationNeeded.map((question, idx) => (
                    <li key={idx} className="text-muted-foreground">{question}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Additional Investigation */}
            {(questionsData!.additionalInvestigation.areas.length > 0 ||
              questionsData!.additionalInvestigation.witnesses.length > 0 ||
              questionsData!.additionalInvestigation.documents.length > 0) && (
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Additional Investigation
                </h4>
                <div className="space-y-4">
                  {questionsData!.additionalInvestigation.areas.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium mb-2">Areas Requiring Further Development</h5>
                      <ul className="space-y-1 text-sm">
                        {questionsData!.additionalInvestigation.areas.map((area, idx) => (
                          <li key={idx}>• {area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {questionsData!.additionalInvestigation.witnesses.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium mb-2">Potential Witnesses to Interview</h5>
                      <ul className="space-y-1 text-sm">
                        {questionsData!.additionalInvestigation.witnesses.map((witness, idx) => (
                          <li key={idx}>• {witness}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {questionsData!.additionalInvestigation.documents.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium mb-2">Documents to Obtain</h5>
                      <ul className="space-y-1 text-sm">
                        {questionsData!.additionalInvestigation.documents.map((doc, idx) => (
                          <li key={idx}>• {doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expert Consultation */}
            {questionsData!.expertConsultation.needed && (
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Microscope className="h-4 w-4" />
                  Expert Consultation
                  <Badge variant="outline">Recommended</Badge>
                </h4>
                {questionsData!.expertConsultation.areas.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {questionsData!.expertConsultation.areas.map((area, idx) => (
                      <li key={idx}>• {area}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowUpQuestionsSection;