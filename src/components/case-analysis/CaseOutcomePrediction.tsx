
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface CaseOutcomePredictionProps {
  defense: number;
  prosecution: number;
  isLoading?: boolean;
  caseType?: string;
}

const CaseOutcomePrediction: React.FC<CaseOutcomePredictionProps> = ({
  defense,
  prosecution,
  isLoading = false,
  caseType
}) => {
  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          Case Outcome Prediction
          {isLoading && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <div className="font-medium flex items-center text-green-600">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="cursor-help">Client Win Likelihood</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Estimated probability that your client will prevail in this case</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-bold">{defense}%</span>
            </div>
            <Progress value={defense} className="h-2 bg-gray-200" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <div className="font-medium flex items-center text-red-600">
                <ArrowDownIcon className="h-4 w-4 mr-1" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="cursor-help">Case Loss Risk</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Estimated probability that your client will not succeed in this case</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-bold">{prosecution}%</span>
            </div>
            <Progress value={prosecution} className="h-2 bg-gray-200" />
          </div>
          
          <p className="text-xs text-muted-foreground pt-2">
            This prediction is based on analysis of case details, evidence strength, and similar case outcomes.
            The percentages represent the estimated likelihood of each outcome in this civil matter.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseOutcomePrediction;
