
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, ExternalLink, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScholarlyArticle } from "@/utils/api/scholarApiService";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export interface ScholarlyReferencesSectionProps {
  references: ScholarlyArticle[];
  isLoading?: boolean;
  caseType?: string;
  onSearch?: (query: string) => void;
}

const ScholarlyReferencesSection: React.FC<ScholarlyReferencesSectionProps> = ({
  references,
  isLoading = false,
  caseType,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"recent" | "cited">("recent");
  
  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      handleSearch();
    }
  };
  
  if (isLoading) {
    return (
      <Card className="mb-6 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center">
            <Book className="h-5 w-5 mr-2 text-blue-500" />
            Scholarly Legal References
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((_, idx) => (
              <div key={idx} className="border p-4 rounded-md space-y-2">
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between items-center mt-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-[100px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!references || references.length === 0) {
    return (
      <Card className="mb-6 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center">
            <Book className="h-5 w-5 mr-2 text-blue-500" />
            Scholarly Legal References
            {caseType && caseType !== "general" && (
              <Badge variant="outline" className="ml-2">
                {caseType.replace("-", " ")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">No scholarly references found</h3>
            <p className="text-gray-500 mb-4">Try searching for specific legal terms or case types</p>
            
            {onSearch && (
              <div className="flex max-w-md mx-auto">
                <Input 
                  type="text"
                  placeholder="Search legal scholarship..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="mr-2"
                />
                <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <div className="flex items-center">
            <Book className="h-5 w-5 mr-2 text-blue-500" />
            Scholarly Legal References
            {caseType && caseType !== "general" && (
              <Badge variant="outline" className="ml-2">
                {caseType.replace("-", " ")}
              </Badge>
            )}
          </div>
          
          {onSearch && (
            <div className="flex">
              <Input 
                type="text"
                placeholder="Search legal scholarship..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-64 mr-2"
              />
              <Button size="sm" onClick={handleSearch} disabled={!searchQuery.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "recent" | "cited")}>
          <TabsList className="mb-4">
            <TabsTrigger value="recent">Most Recent</TabsTrigger>
            <TabsTrigger value="cited">Most Cited</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="space-y-4">
            {references
              .sort((a, b) => (b.year || 0) - (a.year || 0))
              .map((reference, index) => (
                <ArticleCard key={index} article={reference} />
              ))}
          </TabsContent>
          
          <TabsContent value="cited" className="space-y-4">
            {references
              .sort((a, b) => b.citation_info - a.citation_info)
              .map((reference, index) => (
                <ArticleCard key={index} article={reference} />
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface ArticleCardProps {
  article: ScholarlyArticle;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <div className="border p-4 rounded-md hover:shadow-md transition-shadow">
      <h3 className="font-medium text-lg">{article.title}</h3>
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
      
      <div className="flex justify-between items-center mt-3">
        <div className="text-xs text-gray-500">{article.publication_info}</div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => window.open(article.link, "_blank")}
        >
          <ExternalLink className="h-3 w-3" />
          View Article
        </Button>
      </div>
    </div>
  );
};

export default ScholarlyReferencesSection;
