import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, FileText, Book, Scale } from 'lucide-react';

interface CaseDiscussionCitation {
  id: string;
  title?: string;
  url?: string;
  source: string;
  type: 'external' | 'internal';
}

interface CaseDiscussionCitationsProps {
  citations: string[];
  researchType?: string | null;
  isCompact?: boolean;
}

const CaseDiscussionCitations: React.FC<CaseDiscussionCitationsProps> = ({ 
  citations, 
  researchType,
  isCompact = false 
}) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  // Convert citation strings to structured data
  const structuredCitations: CaseDiscussionCitation[] = citations.map((citation, index) => {
    const urlMatch = citation.match(/https?:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : null;
    
    // Remove URL from title if present
    const title = url ? citation.replace(url, '').trim() : citation;
    
    return {
      id: `citation-${index}`,
      title: title || `Source ${index + 1}`,
      url,
      source: url ? new URL(url).hostname : citation,
      type: 'external' as const
    };
  });

  const externalSources = structuredCitations.filter(c => c.type === 'external');
  const internalSources = structuredCitations.filter(c => c.type === 'internal');

  const getResearchIcon = () => {
    if (researchType === 'similar-cases') return <Scale className="h-4 w-4" />;
    return <Book className="h-4 w-4" />;
  };

  const getResearchTitle = () => {
    if (researchType === 'similar-cases') return 'Legal Case Citations';
    return 'Research Sources & Citations';
  };

  if (isCompact) {
    return (
      <div className="mt-3 p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
        <div className="flex items-center gap-2 mb-2">
          {getResearchIcon()}
          <span className="text-sm font-medium">{getResearchTitle()}</span>
          <Badge variant="outline" className="text-xs">
            {citations.length} source{citations.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="space-y-1">
          {externalSources.slice(0, 3).map((citation, index) => (
            <div key={citation.id} className="text-xs flex items-center gap-2">
              <Badge variant="outline" className="text-xs shrink-0 h-5">
                [{index + 1}]
              </Badge>
              <div className="flex-1 min-w-0">
                {citation.url ? (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors inline-flex items-center gap-1 truncate"
                  >
                    <span className="truncate">{citation.source}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-muted-foreground truncate">{citation.source}</span>
                )}
              </div>
            </div>
          ))}
          
          {citations.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{citations.length - 3} more source{citations.length - 3 !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {getResearchIcon()}
          {getResearchTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {externalSources.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
              <ExternalLink className="h-3 w-3" />
              External Sources
            </h4>
            <div className="space-y-2">
              {externalSources.map((citation, index) => (
                <div key={citation.id} className="text-sm border-l-2 border-border pl-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">
                      [{index + 1}]
                    </Badge>
                    <div className="flex-1">
                      {citation.title && citation.title !== citation.source && (
                        <div className="font-medium text-sm mb-1">{citation.title}</div>
                      )}
                      <div className="text-muted-foreground text-xs">
                        {citation.url ? (
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors inline-flex items-center gap-1"
                          >
                            {citation.source}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          citation.source
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {internalSources.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Internal Knowledge Base
            </h4>
            <div className="space-y-2">
              {internalSources.map((citation, index) => (
                <div key={citation.id} className="text-sm border-l-2 border-primary pl-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">
                      [KB-{index + 1}]
                    </Badge>
                    <div className="flex-1">
                      {citation.title && (
                        <div className="font-medium text-sm mb-1">{citation.title}</div>
                      )}
                      <div className="text-muted-foreground text-xs">
                        {citation.source}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {citations.length > 0 && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>
              This research incorporates information from {externalSources.length} external source(s)
              {internalSources.length > 0 && ` and ${internalSources.length} internal knowledge base document(s)`}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CaseDiscussionCitations;