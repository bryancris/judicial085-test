import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  Search, 
  Scale, 
  FileText, 
  Users, 
  Clock,
  Target,
  Lightbulb
} from "lucide-react";

interface QuickResearchActionsProps {
  onResearchQuery: (query: string, type: 'similar-cases' | 'legal-research') => void;
  isLoading?: boolean;
}

const QuickResearchActions: React.FC<QuickResearchActionsProps> = ({
  onResearchQuery,
  isLoading = false
}) => {
  const researchSuggestions = [
    {
      icon: <BookOpen className="h-4 w-4" />,
      title: "Similar Cases",
      description: "Find relevant precedents",
      query: "Find similar court cases and legal precedents for this matter",
      type: 'similar-cases' as const,
      color: "text-blue-600 hover:bg-blue-50"
    },
    {
      icon: <Scale className="h-4 w-4" />,
      title: "Legal Standards",
      description: "Research applicable law",
      query: "Research the legal standards and requirements for this type of case",
      type: 'legal-research' as const,
      color: "text-purple-600 hover:bg-purple-50"
    },
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Statutory Analysis",
      description: "Analyze relevant statutes",
      query: "Analyze relevant statutes and regulations applicable to this matter",
      type: 'legal-research' as const,
      color: "text-green-600 hover:bg-green-50"
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: "Jurisdictional Issues",
      description: "Examine jurisdiction",
      query: "Research jurisdictional issues and venue considerations for this case",
      type: 'legal-research' as const,
      color: "text-orange-600 hover:bg-orange-50"
    },
    {
      icon: <Clock className="h-4 w-4" />,
      title: "Limitation Periods",
      description: "Check time limits",
      query: "Research applicable limitation periods and procedural deadlines",
      type: 'legal-research' as const,
      color: "text-red-600 hover:bg-red-50"
    },
    {
      icon: <Target className="h-4 w-4" />,
      title: "Damages Analysis",
      description: "Assess potential damages",
      query: "Research damages calculation and compensation principles for this type of case",
      type: 'legal-research' as const,
      color: "text-indigo-600 hover:bg-indigo-50"
    }
  ];

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium">Quick Research</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {researchSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onResearchQuery(suggestion.query, suggestion.type)}
              disabled={isLoading}
              className={`h-auto p-3 flex flex-col items-start gap-1 ${suggestion.color}`}
            >
              <div className="flex items-center gap-2 w-full">
                {suggestion.icon}
                <span className="text-xs font-medium">{suggestion.title}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                {suggestion.description}
              </span>
            </Button>
          ))}
        </div>
        
        <div className="mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> Click any suggestion to automatically research that topic, or type your own specific question below.
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickResearchActions;