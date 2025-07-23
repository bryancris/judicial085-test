import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, FileText, Book } from 'lucide-react';
import { DiscoveryCitation } from '@/types/discovery';

interface DiscoveryCitationsProps {
  citations: DiscoveryCitation[];
}

const DiscoveryCitations: React.FC<DiscoveryCitationsProps> = ({ citations }) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  const externalSources = citations.filter(c => c.type === 'external');
  const internalSources = citations.filter(c => c.type === 'internal');

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Book className="h-4 w-4" />
          Sources & Citations
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
                      {citation.title && (
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
              This response incorporates information from {externalSources.length} external source(s) 
              and {internalSources.length} internal knowledge base document(s).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscoveryCitations;