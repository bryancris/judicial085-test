
import React from 'react';
import { DiscoveryRequest } from '@/types/discovery';
import DiscoveryAnalyzeCard from './DiscoveryAnalyzeCard';
import DiscoveryAnalysisCard from './DiscoveryAnalysisCard';
import DiscoveryResponseEditorCard from './DiscoveryResponseEditorCard';
import { useDiscoveryResponseGenerator } from '@/hooks/useDiscoveryResponseGenerator';

interface DiscoveryResponseGeneratorProps {
  request: DiscoveryRequest;
  onResponseCreated: () => void;
}

const DiscoveryResponseGenerator: React.FC<DiscoveryResponseGeneratorProps> = ({ 
  request,
  onResponseCreated 
}) => {
  const {
    analysis,
    generatedResponse,
    isAnalyzing,
    isGenerating,
    analyzeRequest,
    saveResponse
  } = useDiscoveryResponseGenerator(request, onResponseCreated);

  return (
    <div className="space-y-6">
      {!analysis ? (
        <DiscoveryAnalyzeCard 
          onAnalyze={analyzeRequest}
          isAnalyzing={isAnalyzing}
        />
      ) : (
        <>
          <DiscoveryAnalysisCard analysis={analysis} />
          
          <DiscoveryResponseEditorCard
            generatedResponse={generatedResponse}
            onSaveResponse={saveResponse}
            isGenerating={isGenerating}
          />
        </>
      )}
    </div>
  );
};

export default DiscoveryResponseGenerator;
