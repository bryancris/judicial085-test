import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from "lucide-react";
import { processLawReferences, extractCitations, searchLawDocuments } from "@/utils/lawReferenceUtils";

interface DetailedLegalAnalysisProps {
  relevantLaw: string;
  preliminaryAnalysis: string;
  potentialIssues: string;
  followUpQuestions: string[];
  isLoading?: boolean;
}

const DetailedLegalAnalysis: React.FC<DetailedLegalAnalysisProps> = ({
  relevantLaw,
  preliminaryAnalysis,
  potentialIssues,
  followUpQuestions,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState({
    relevantLaw: true,
    preliminaryAnalysis: true,
    potentialIssues: true,
    followUpQuestions: true
  });
  const [processedRelevantLaw, setProcessedRelevantLaw] = useState(relevantLaw);
  const [lawCitations, setLawCitations] = useState<string[]>([]);

  // Process the relevant law section to add links
  useEffect(() => {
    // Extract citations for future use
    const citations = extractCitations(relevantLaw);
    setLawCitations(citations);
    
    // Process the text to add links
    const processed = processLawReferences(relevantLaw);
    setProcessedRelevantLaw(processed);
  }, [relevantLaw]);
  
  // Preemptively fetch some citations data when available
  useEffect(() => {
    const preloadCitations = async () => {
      if (lawCitations.length > 0) {
        // Take first 2 citations to avoid overloading
        const sampleCitations = lawCitations.slice(0, 2);
        
        for (const citation of sampleCitations) {
          // Fetch in background, this is just to warm up the cache
          await searchLawDocuments(citation);
        }
      }
    };
    
    preloadCitations();
  }, [lawCitations]);

  const handleToggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const highlightSearch = (text: string) => {
    if (!searchTerm) return text;
    
    // Simple split/join approach for highlighting
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200">{part}</mark> 
        : part
    );
  };

  // Convert markdown content to React elements with basic formatting
  const formatMarkdown = (content: string, processLinks = false) => {
    // Handle paragraphs and apply search highlighting
    let paragraphs = content.split('\n\n');
    
    // If we need to process links (for the Relevant Law section)
    if (processLinks) {
      // The content is already processed with links in processedRelevantLaw
      // But we need to split it into paragraphs
      paragraphs = processedRelevantLaw.split('\n\n');
    }
    
    return paragraphs.map((paragraph, idx) => {
      // For searchable content, we need to highlight matches
      if (!processLinks) {
        // Highlight search terms
        const highlightedText = highlightSearch(paragraph);
        return <p key={idx} className="mb-3">{highlightedText}</p>;
      } else {
        // For content with links, we use dangerouslySetInnerHTML
        // since the links are now HTML
        return (
          <p 
            key={idx} 
            className="mb-3" 
            dangerouslySetInnerHTML={{ 
              __html: searchTerm 
                ? highlightLawLinksWithSearch(paragraph, searchTerm) 
                : paragraph 
            }} 
          />
        );
      }
    });
  };
  
  // Special highlight function for text that contains HTML links
  const highlightLawLinksWithSearch = (htmlContent: string, term: string): string => {
    if (!term) return htmlContent;
    
    // This is complex because we need to avoid messing up the HTML tags
    // Split the content at HTML tags and then only highlight text content
    const tagSplit = htmlContent.split(/(<[^>]*>)/g);
    
    return tagSplit.map(part => {
      // If this is an HTML tag, leave it untouched
      if (part.startsWith('<') && part.endsWith('>')) {
        return part;
      }
      
      // Otherwise it's text content, highlight search term
      const regex = new RegExp(`(${term})`, 'gi');
      return part.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    }).join('');
  };

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center">
            Detailed Legal Analysis
            {isLoading && (
              <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            )}
          </CardTitle>
          <div className="relative w-64">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search analysis..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Relevant Law Section */}
        <Collapsible open={openSections.relevantLaw} className="border rounded-md">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex w-full justify-between p-4 font-semibold" 
              onClick={() => handleToggleSection('relevantLaw')}
            >
              <span>Relevant Texas Law</span>
              {openSections.relevantLaw ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            {formatMarkdown(relevantLaw, true)}
            <div className="mt-2 text-xs text-muted-foreground">
              <p>Click on law references to view the full text in the Knowledge database.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Preliminary Analysis Section */}
        <Collapsible open={openSections.preliminaryAnalysis} className="border rounded-md">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex w-full justify-between p-4 font-semibold" 
              onClick={() => handleToggleSection('preliminaryAnalysis')}
            >
              <span>Preliminary Analysis</span>
              {openSections.preliminaryAnalysis ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            {formatMarkdown(preliminaryAnalysis)}
          </CollapsibleContent>
        </Collapsible>

        {/* Potential Issues Section */}
        <Collapsible open={openSections.potentialIssues} className="border rounded-md">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex w-full justify-between p-4 font-semibold" 
              onClick={() => handleToggleSection('potentialIssues')}
            >
              <span>Potential Legal Issues</span>
              {openSections.potentialIssues ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            {formatMarkdown(potentialIssues)}
          </CollapsibleContent>
        </Collapsible>

        {/* Follow-up Questions Section */}
        <Collapsible open={openSections.followUpQuestions} className="border rounded-md">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex w-full justify-between p-4 font-semibold" 
              onClick={() => handleToggleSection('followUpQuestions')}
            >
              <span>Recommended Follow-up Questions</span>
              {openSections.followUpQuestions ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <ol className="list-decimal pl-5 space-y-2">
              {followUpQuestions.map((question, index) => (
                <li key={index}>{highlightSearch(question)}</li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default DetailedLegalAnalysis;
