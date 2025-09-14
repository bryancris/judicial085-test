import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Home, TrendingUp, AlertTriangle } from "lucide-react";
import { PIFunctionalData } from "@/types/personalInjury";

interface PIFunctionalImpactProps {
  functional: PIFunctionalData;
}

const PIFunctionalImpact: React.FC<PIFunctionalImpactProps> = ({ functional }) => {
  const getPrognosisVariant = (prognosis: string) => {
    if (prognosis.toLowerCase().includes("excellent")) return "default";
    if (prognosis.toLowerCase().includes("good")) return "secondary";
    if (prognosis.toLowerCase().includes("fair")) return "outline";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Functional Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Work Capacity</span>
              </div>
              <span className="text-sm font-medium">{functional.workCapacity}%</span>
            </div>
            <Progress value={functional.workCapacity} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Daily Activities</span>
              </div>
              <span className="text-sm font-medium">{functional.dailyActivities}%</span>
            </div>
            <Progress value={functional.dailyActivities} className="h-2" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Prognosis:</span>
          <Badge variant={getPrognosisVariant(functional.prognosis)}>
            {functional.prognosis}
          </Badge>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">Current Restrictions:</span>
          </div>
          <div className="space-y-1">
            {functional.restrictions.map((restriction, index) => (
              <div key={index} className="text-sm bg-orange-50 text-orange-800 px-2 py-1 rounded border-l-2 border-orange-200">
                {restriction}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PIFunctionalImpact;