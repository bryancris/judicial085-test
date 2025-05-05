
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface CaseOutcomePredictionProps {
  defense: number;
  prosecution: number;
  isLoading?: boolean;
}

const CaseOutcomePrediction: React.FC<CaseOutcomePredictionProps> = ({
  defense,
  prosecution,
  isLoading = false
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
                Defense Outcome
              </div>
              <span className="text-sm font-bold">{defense}%</span>
            </div>
            <Progress value={defense} className="h-2 bg-gray-200" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <div className="font-medium flex items-center text-red-600">
                <ArrowDownIcon className="h-4 w-4 mr-1" />
                Prosecution Risk
              </div>
              <span className="text-sm font-bold">{prosecution}%</span>
            </div>
            <Progress value={prosecution} className="h-2 bg-gray-200" />
          </div>
          
          <p className="text-xs text-muted-foreground pt-2">
            This prediction is based on analyzing similar case outcomes and the specific details of this case.
            The percentages represent the estimated likelihood of each outcome.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseOutcomePrediction;
