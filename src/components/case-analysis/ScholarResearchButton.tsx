
import React from "react";
import { Button } from "@/components/ui/button";
import { Book, Search } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useScholarlyReferences } from "@/hooks/useScholarlyReferences";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ScholarResearchButtonProps {
  clientId: string;
  caseType?: string;
  queryText?: string;
}

const ScholarResearchButton: React.FC<ScholarResearchButtonProps> = ({ 
  clientId, 
  caseType,
  queryText = ""
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(queryText);
  const [activeTab, setActiveTab] = React.useState("relevant");
  
  const {
    references,
    isLoading,
    searchReferences,
    fetchReferences
  } = useScholarlyReferences(clientId, caseType);
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchReferences(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  React.useEffect(() => {
    if (isOpen) {
      // Load case-specific references when dialog opens
      fetchReferences();
    }
  }, [isOpen]);
  
  React.useEffect(() => {
    setSearchQuery(queryText);
  }, [queryText]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Book className="h-4 w-4" />
          Research
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Legal Research Assistant
            {caseType && caseType !== "general" && (
              <Badge variant="outline" className="ml-2">
                {caseType.replace("-", " ")}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Find scholarly articles and legal resources related to your case
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 mt-2">
          <Input
            placeholder="Enter search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={!searchQuery.trim() || isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mt-4"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="relevant">Case-Relevant</TabsTrigger>
            <TabsTrigger value="search">Search Results</TabsTrigger>
          </TabsList>
          
          <div className="overflow-y-auto h-[calc(80vh-200px)]">
            <TabsContent value="relevant" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((_, idx) => (
                    <div key={idx} className="border p-4 rounded-md space-y-2">
                      <Skeleton className="h-6 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : references.length > 0 ? (
                <div className="space-y-4">
                  {references.map((article, index) => (
                    <div key={index} className="border p-4 rounded-md hover:shadow-md transition-shadow">
                      <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-lg hover:text-blue-600 hover:underline"
                      >
                        {article.title}
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">{article.snippet}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                        {article.authors && (
                          <span>
                            <span className="font-medium">Authors:</span> {article.authors}
                          </span>
                        )}
                        {article.year && (
                          <span>
                            <span className="font-medium">Year:</span> {article.year}
                          </span>
                        )}
                        {article.citation_info > 0 && (
                          <span>
                            <span className="font-medium">Citations:</span> {article.citation_info}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Book className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">No relevant articles found</h3>
                  <p className="text-gray-500">Try searching for specific legal terms or case types</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="search" className="space-y-4">
              {searchQuery ? (
                isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, idx) => (
                      <div key={idx} className="border p-4 rounded-md space-y-2">
                        <Skeleton className="h-6 w-3/4 mb-1" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : references.length > 0 ? (
                  <div className="space-y-4">
                    {references.map((article, index) => (
                      <div key={index} className="border p-4 rounded-md hover:shadow-md transition-shadow">
                        <a 
                          href={article.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-lg hover:text-blue-600 hover:underline"
                        >
                          {article.title}
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">{article.snippet}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                          {article.authors && (
                            <span>
                              <span className="font-medium">Authors:</span> {article.authors}
                            </span>
                          )}
                          {article.year && (
                            <span>
                              <span className="font-medium">Year:</span> {article.year}
                            </span>
                          )}
                          {article.citation_info > 0 && (
                            <span>
                              <span className="font-medium">Citations:</span> {article.citation_info}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-600 mb-1">No results found</h3>
                    <p className="text-gray-500">Try different search terms</p>
                  </div>
                )
              ) : (
                <div className="text-center py-16">
                  <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-600">Enter search terms above</h3>
                  <p className="text-gray-500">Search for specific legal concepts or case law</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ScholarResearchButton;
