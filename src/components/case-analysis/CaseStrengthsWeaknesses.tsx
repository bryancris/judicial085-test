
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheckIcon, ShieldAlertIcon } from "lucide-react";

interface CaseStrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
  isLoading?: boolean;
}

const CaseStrengthsWeaknesses: React.FC<CaseStrengthsWeaknessesProps> = ({
  strengths,
  weaknesses,
  isLoading = false
}) => {
  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          Case Strengths & Weaknesses
          {isLoading && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Case Strengths */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-3 flex items-center text-green-600">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Case Strengths
            </h3>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Case Weaknesses */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-3 flex items-center text-red-600">
              <ShieldAlertIcon className="h-5 w-5 mr-2" />
              Case Weaknesses
            </h3>
            <ul className="space-y-2">
              {weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>{weakness}</span>
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
