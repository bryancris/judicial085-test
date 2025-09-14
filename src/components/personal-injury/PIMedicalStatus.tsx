import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Stethoscope, Calendar, Activity, Code } from "lucide-react";
import { PIMedicalData } from "@/types/personalInjury";

interface PIMedicalStatusProps {
  medical: PIMedicalData;
}

const PIMedicalStatus: React.FC<PIMedicalStatusProps> = ({ medical }) => {
  const getPainLevelColor = (level: number) => {
    if (level >= 7) return "text-red-600";
    if (level >= 4) return "text-yellow-600";
    return "text-green-600";
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "ongoing": return "default";
      case "completed": return "secondary";
      case "pending": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Medical Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Primary Injuries:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {medical.primaryInjuries.map((injury, index) => (
              <Badge key={index} variant="outline">{injury}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Treatment Provider:</span>
            <span className="text-sm font-medium">{medical.treatmentProvider}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={getStatusVariant(medical.treatmentStatus)}>
              {medical.treatmentStatus}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current Pain Level:</span>
            <span className={`text-sm font-bold ${getPainLevelColor(medical.painLevel)}`}>
              {medical.painLevel}/10
            </span>
          </div>
          <Progress value={medical.painLevel * 10} className="h-2" />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">ICD-10 Codes:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {medical.icd10Codes.map((code, index) => (
              <Badge key={index} variant="secondary">{code}</Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Next Appointment:</span>
          <span className="text-sm font-medium">
            {new Date(medical.nextAppointment).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PIMedicalStatus;