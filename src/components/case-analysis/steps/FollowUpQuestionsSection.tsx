import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, AlertCircle, Users, Microscope, RefreshCw, Loader2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { marked } from "marked";
import DOMPurify from "dompurify";

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
  followUpQuestionsRaw?: string | null; // Raw Step 8 content
  isLoading?: boolean;
  onRegenerateStep8?: () => void;
  isRegenerating?: boolean;
}

const FollowUpQuestionsSection: React.FC<FollowUpQuestionsSectionProps> = ({
  questionsData,
  followUpQuestions = [],
  followUpQuestionsRaw,
  isLoading = false,
  onRegenerateStep8,
  isRegenerating = false
}) => {
  // Function to safely render markdown content
  const renderMarkdown = (content: string) => {
    try {
      const html = marked.parse(content) as string;
      const sanitized = DOMPurify.sanitize(html);
      return { __html: sanitized };
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return { __html: content };
    }
  };
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

  // Check for Step 8 dedicated content first, then legacy data
  const hasStep8Data = followUpQuestionsRaw && followUpQuestionsRaw.trim().length > 0;
  const hasLegacyData = !questionsData && !hasStep8Data && followUpQuestions.length > 0;
  const hasNewData = questionsData && (
    questionsData.criticalInformationNeeded.length > 0 ||
    questionsData.additionalInvestigation.areas.length > 0 ||
    questionsData.additionalInvestigation.witnesses.length > 0 ||
    questionsData.additionalInvestigation.documents.length > 0 ||
    questionsData.expertConsultation.needed
  );

  if (!hasLegacyData && !hasNewData && !hasStep8Data) {
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
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No follow-up questions available yet.</p>
            <p className="text-sm mt-2">Questions will appear after the analysis is complete.</p>
            {onRegenerateStep8 && (
              <Button 
                onClick={onRegenerateStep8}
                disabled={isRegenerating}
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Follow-up Questions
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="step-card-title">
          <HelpCircle className="h-5 w-5" />
          <span className="step-number">Step 8:</span>
          Recommended Follow-up Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="step-content-unified">
        {/* Step 8 dedicated content */}
        {hasStep8Data && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Generated Follow-up Questions
            </h4>
            <div 
              className="prose prose-sm max-w-none p-4 rounded-md bg-card/50 
                text-card-foreground
                prose-headings:text-card-foreground prose-headings:font-semibold
                prose-h1:text-lg prose-h1:mb-4 prose-h1:border-b prose-h1:border-border prose-h1:pb-2
                prose-h2:text-base prose-h2:mb-3 prose-h2:text-muted-foreground
                prose-h3:text-sm prose-h3:mb-2 prose-h3:text-muted-foreground
                prose-p:text-card-foreground prose-p:leading-relaxed prose-p:mb-3
                prose-ul:text-card-foreground prose-ul:space-y-1
                prose-ol:text-card-foreground prose-ol:space-y-1 prose-ol:pl-2
                prose-li:text-card-foreground prose-li:leading-relaxed
                prose-strong:text-card-foreground prose-strong:font-semibold
                prose-a:text-primary prose-a:underline
                [&>ol]:pl-6 [&>ul]:pl-6
                [&>ol>li]:pl-2 [&>ul>li]:pl-2
                [&>ol>li]:marker:text-muted-foreground
                [&>ul>li]:marker:text-muted-foreground"
              dangerouslySetInnerHTML={renderMarkdown(followUpQuestionsRaw!)}
            />
          </div>
        )}

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
        
        {/* Regenerate Button for existing questions */}
        {(hasLegacyData || hasNewData || hasStep8Data) && onRegenerateStep8 && (
          <div className="flex justify-end mt-4 pt-4 border-t">
            <Button 
              onClick={onRegenerateStep8}
              disabled={isRegenerating}
              variant="outline" 
              size="sm"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Step 8 Questions
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowUpQuestionsSection;