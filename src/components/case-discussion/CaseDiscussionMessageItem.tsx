
import React from "react";
import { CaseDiscussionMessage } from "@/utils/caseDiscussionService";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Bot, Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import ResearchFindingsButton from "./ResearchFindingsButton";

interface CaseDiscussionMessageItemProps {
  message: CaseDiscussionMessage;
  clientId?: string;
  clientDocuments?: any[];
  onFindingsAdded?: () => void;
}

const CaseDiscussionMessageItem: React.FC<CaseDiscussionMessageItemProps> = ({ 
  message, 
  clientId,
  clientDocuments = [],
  onFindingsAdded 
}) => {
  const isAttorney = message.role === "attorney";
  
  // Check if message contains research results (updated for new format)
  const hasResearchSection = message.content.includes("🔍 Legal Research Analysis") || message.content.includes("## 📚 Legal Research Results");
  const researchType = hasResearchSection ? 
    (message.content.includes("similar court cases") || message.content.includes("Find similar court cases") ? "similar-cases" : "legal-research") : null;
  
  // Helper function to format document references with clickable links
  const formatDocumentReferences = React.useCallback((text: string): string => {
    if (!clientDocuments || clientDocuments.length === 0) return text;

    let formattedText = text;

    // Create a map of document titles for easier matching
    const documentMap = new Map();
    clientDocuments.forEach(doc => {
      if (doc.title) {
        // Store both exact title and normalized version for matching
        documentMap.set(doc.title.toLowerCase(), doc);
        // Also try without .pdf extension if present
        const titleWithoutExt = doc.title.replace(/\.pdf$/i, '');
        if (titleWithoutExt !== doc.title) {
          documentMap.set(titleWithoutExt.toLowerCase(), doc);
        }
      }
    });

    // Pattern to match document references like "DocumentName.pdf", "DocumentName", quoted versions
    const docPattern = /(?:"([^"]+(?:\.pdf)?)"|\b([A-Za-z][A-Za-z0-9\s\-_]+(?:\.pdf)?)\b)/gi;

    formattedText = formattedText.replace(docPattern, (match, quotedDoc, unquotedDoc) => {
      const docName = (quotedDoc || unquotedDoc).trim();
      const normalizedName = docName.toLowerCase();
      
      // Check if this matches any of our documents
      const matchedDoc = documentMap.get(normalizedName);
      
      if (matchedDoc && matchedDoc.url) {
        return `<span class="document-link cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-semibold" data-document-url="${matchedDoc.url.replace(/"/g, '&quot;')}" data-document-title="${matchedDoc.title?.replace(/"/g, '&quot;') || ''}">${docName}</span>`;
      }
      
      return match; // No match found, return original text
    });

    return formattedText;
  }, [clientDocuments]);

  // Sanitize problematic Unicode and format document references
  const processedContent = React.useMemo(() => {
    let content = message.content;

    // First sanitize problematic Unicode
    content = content
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[\u061C\u200E\u200F\u202A-\u202E]/g, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

    // Then format document references if this is an AI message
    if (!isAttorney) {
      content = formatDocumentReferences(content);
    }

    return content;
  }, [message.content, isAttorney, formatDocumentReferences]);

  // Add click handler for document links
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (!contentRef.current) return;

    const handleDocumentClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const documentLink = target.closest('.document-link');
      
      if (documentLink) {
        event.preventDefault();
        const documentUrl = documentLink.getAttribute('data-document-url');
        const documentTitle = documentLink.getAttribute('data-document-title');
        
        if (documentUrl) {
          console.log('Opening document:', documentTitle, 'URL:', documentUrl);
          window.open(documentUrl, '_blank');
        }
      }
    };

    const contentElement = contentRef.current;
    contentElement.addEventListener('click', handleDocumentClick);

    return () => {
      contentElement.removeEventListener('click', handleDocumentClick);
    };
  }, [processedContent]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 group",
        isAttorney ? "flex-row-reverse" : "",
      )}
    >
      <Avatar className={cn("mt-1", isAttorney ? "bg-purple-100" : "bg-blue-100")}>
        <AvatarFallback className={cn(
          "text-sm",
          isAttorney ? "text-purple-700" : "text-blue-700"
        )}>
          {isAttorney ? <User size={20} /> : <Bot size={20} />}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        "flex flex-col",
        isAttorney ? "items-end" : "items-start",
        "max-w-[80%] md:max-w-[70%]"
      )}>
        {/* Research indicator badge */}
        {!isAttorney && hasResearchSection && (
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs">
              {researchType === "similar-cases" ? (
                <>
                  <BookOpen className="h-3 w-3 mr-1" />
                  Similar Cases Research
                </>
              ) : (
                <>
                  <Search className="h-3 w-3 mr-1" />
                  Legal Research
                </>
              )}
            </Badge>
          </div>
        )}
        
        <div className={cn(
          "px-4 py-2 rounded-lg relative",
          isAttorney ? "bg-purple-100 text-purple-900" : "bg-blue-100 text-blue-900"
        )}>
          <div
            ref={contentRef}
            className="cd-message-content text-sm max-w-none select-text"
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.5'
            }}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
          
          {/* Research Findings Button for all AI messages */}
          {!isAttorney && clientId && (
            <div className="mt-3 flex justify-end">
              <ResearchFindingsButton
                messageContent={message.content}
                clientId={clientId}
                onFindingsAdded={onFindingsAdded}
              />
            </div>
          )}
        </div>
        
        <span className="text-xs mt-1 text-muted-foreground">{message.timestamp}</span>
      </div>
    </div>
  );
};

export default CaseDiscussionMessageItem;
