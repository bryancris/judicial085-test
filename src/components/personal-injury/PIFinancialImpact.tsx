import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingDown, TrendingUp, FileCheck } from "lucide-react";
import { PIFinancialData } from "@/types/personalInjury";

interface PIFinancialImpactProps {
  financial: PIFinancialData;
}

const PIFinancialImpact: React.FC<PIFinancialImpactProps> = ({ financial }) => {
  const totalDamages = financial.lostWages + financial.medicalCosts + financial.futureExpenses;
  
  const getDocumentationColor = (status: string) => {
    const percentage = parseInt(status.replace('%', ''));
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getDocumentationVariant = (status: string) => {
    const percentage = parseInt(status.replace('%', ''));
    if (percentage >= 90) return "default";
    if (percentage >= 70) return "secondary";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-2 bg-red-50 rounded border-l-2 border-red-200">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">Lost Wages</span>
            </div>
            <span className="text-sm font-bold text-red-600">
              ${financial.lostWages.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-blue-50 rounded border-l-2 border-blue-200">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">Medical Costs</span>
            </div>
            <span className="text-sm font-bold text-blue-600">
              ${financial.medicalCosts.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-orange-50 rounded border-l-2 border-orange-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-800">Future Expenses</span>
            </div>
            <span className="text-sm font-bold text-orange-600">
              ${financial.futureExpenses.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Economic Damages</span>
            <span className="text-lg font-bold text-primary">
              ${totalDamages.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Documentation Status:</span>
            <Badge variant={getDocumentationVariant(financial.documentationStatus)}>
              {financial.documentationStatus}
            </Badge>
          </div>
          <Progress 
            value={parseInt(financial.documentationStatus.replace('%', ''))} 
            className="h-2" 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PIFinancialImpact;