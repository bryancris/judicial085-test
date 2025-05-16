
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign } from "lucide-react";

interface RemediesSectionProps {
  remedies: string;
  isLoading?: boolean;
  caseType?: string;
}

const RemediesSection: React.FC<RemediesSectionProps> = ({
  remedies,
  isLoading = false,
  caseType
}) => {
  if (!remedies || remedies.trim() === "") {
    return null;
  }

  // Special styling for consumer protection cases
  const isConsumerProtection = caseType === "consumer-protection";

  return (
    <Card className={`mb-6 shadow-sm ${isConsumerProtection ? 'border-purple-200' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <CircleDollarSign className={`h-5 w-5 mr-2 ${isConsumerProtection ? 'text-purple-500' : 'text-emerald-500'}`} />
          Available Remedies
          {isLoading && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          )}
          {isConsumerProtection && (
            <span className="ml-2 text-xs font-medium bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full dark:bg-purple-900/30 dark:text-purple-200">
              DTPA
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">
          {/* Consumer protection cases get special highlighting for treble damages */}
          {isConsumerProtection && remedies.toLowerCase().includes("treble") ? (
            <div>
              <p>{remedies}</p>
              <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-800">
                <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 m-0">DTPA Treble Damages</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 m-0 mt-1">
                  Under Texas Business & Commerce Code § 17.50(b)(1), a consumer who prevails may receive up to three times 
                  the amount of economic damages if the conduct was committed "knowingly" or "intentionally".
                </p>
              </div>
            </div>
          ) : (
            <p>{remedies}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RemediesSection;
