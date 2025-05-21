
import React from "react";
import CaseAnalysisHeader from "./CaseAnalysisHeader";

interface EmptyAnalysisStateProps {
  clientName: string;
  clientId: string;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

const EmptyAnalysisState: React.FC<EmptyAnalysisStateProps> = ({
  clientName,
  clientId,
  selectedTab,
  setSelectedTab,
  isGenerating,
  onGenerate,
}) => {
  return (
    <div className="container mx-auto py-8">
      <CaseAnalysisHeader
        title={`${clientName} - Case Analysis`}
        clientId={clientId}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isGenerating={isGenerating}
        onGenerate={onGenerate}
      />

      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">No Analysis Available</h2>
        <p className="text-gray-600 mb-6">
          There is no case analysis yet for this client. Generate one to get
          started.
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-brand-burgundy text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto"
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              Generating...
            </>
          ) : (
            <>Generate Analysis</>
          )}
        </button>
      </div>
    </div>
  );
};

export default EmptyAnalysisState;
