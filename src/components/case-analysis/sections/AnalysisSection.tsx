
import React from "react";

interface AnalysisSectionProps {
  title: string;
  content: string;
  variant?: "standard" | "consumer";
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ 
  title, 
  content,
  variant = "standard"
}) => {
  // Apply special styling for consumer protection cases
  const isConsumerProtection = variant === "consumer";

  return (
    <div className="space-y-2">
      <h3 className={`text-lg font-medium ${isConsumerProtection ? "text-purple-700 dark:text-purple-400" : "text-gray-900 dark:text-gray-100"}`}>
        {title}
      </h3>
      
      <div className={`prose dark:prose-invert max-w-none ${
        isConsumerProtection ? "prose-purple" : ""
      }`}>
        {content.split('\n\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
};

export default AnalysisSection;
