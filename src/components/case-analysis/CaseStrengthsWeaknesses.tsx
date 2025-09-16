
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheckIcon, ShieldAlertIcon } from "lucide-react";

export interface CaseStrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
  isLoading?: boolean;
  caseType?: string;
}

const CaseStrengthsWeaknesses: React.FC<CaseStrengthsWeaknessesProps> = ({
  strengths,
  weaknesses,
  isLoading = false,
  caseType
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="step-card-title">
          <ShieldCheckIcon className="h-5 w-5" />
          <span className="step-number">Step 5:</span>
          Case Strengths & Weaknesses
        </CardTitle>
      </CardHeader>
      <CardContent className="step-content-unified">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Case Strengths */}
          <div className="step-section">
            <h3 className="step-section-header text-green-600">
              <ShieldCheckIcon className="h-5 w-5" />
              Case Strengths
            </h3>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span className="text-sm text-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Case Weaknesses */}
          <div className="step-section">
            <h3 className="step-section-header text-red-600">
              <ShieldAlertIcon className="h-5 w-5" />
              Case Weaknesses
            </h3>
            <ul className="space-y-2">
              {weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span className="text-sm text-foreground">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseStrengthsWeaknesses;
