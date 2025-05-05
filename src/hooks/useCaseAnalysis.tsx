
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";
import { generateLegalAnalysis } from "@/utils/openaiService";

export interface CaseAnalysisData {
  outcome: {
    defense: number;
    prosecution: number;
  };
  legalAnalysis: {
    relevantLaw: string;
    preliminaryAnalysis: string;
    potentialIssues: string;
    followUpQuestions: string[];
  };
  strengths: string[];
  weaknesses: string[];
  conversationSummary: string;
  timestamp: string;
}

export const useCaseAnalysis = (clientId?: string) => {
  const [analysisData, setAnalysisData] = useState<CaseAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientMessages, setClientMessages] = useState<ChatMessageProps[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      setError("No client ID provided");
      return;
    }

    const fetchAnalysisData = async () => {
      try {
        setIsLoading(true);

        // First, fetch client messages to use for conversation summary
        const { data: messages, error: messagesError } = await supabase
          .from("client_messages")
          .select("content, role, timestamp")
          .eq("client_id", clientId)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;
        
        // Store messages for conversation summary
        if (messages && messages.length > 0) {
          const formattedMessages = messages.map(msg => ({
            content: msg.content,
            role: msg.role as "attorney" | "client",
            timestamp: msg.timestamp
          }));
          setClientMessages(formattedMessages);
        }

        // Fetch analysis from the database
        const { data: existingAnalysis, error: fetchError } = await supabase
          .from("legal_analyses")
          .select("content")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        if (existingAnalysis && existingAnalysis.length > 0) {
          try {
            // Process the latest legal analysis and extract structured data
            const latestAnalysis = existingAnalysis[0].content;
            
            // Extract data from analysis content
            const strengthsAndWeaknesses = extractStrengthsWeaknesses(latestAnalysis);
            const predictionPercentages = calculatePredictionPercentages(latestAnalysis, strengthsAndWeaknesses);
            
            // Extract sections from the analysis
            const relevantLawMatch = latestAnalysis.match(/\*\*RELEVANT TEXAS LAW:\*\*([\s\S]*?)(?=\*\*PRELIMINARY ANALYSIS|\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
            const preliminaryAnalysisMatch = latestAnalysis.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
            const potentialIssuesMatch = latestAnalysis.match(/\*\*POTENTIAL LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*RECOMMENDED FOLLOW-UP|$)/);
            const followUpQuestionsMatch = latestAnalysis.match(/\*\*RECOMMENDED FOLLOW-UP QUESTIONS:\*\*([\s\S]*?)$/);
            
            // Extract follow-up questions
            const followUpQuestions = followUpQuestionsMatch 
              ? followUpQuestionsMatch[1].split('\n')
                .map(line => line.trim())
                .filter(line => line.match(/^\d+\.\s/))
                .map(line => line.replace(/^\d+\.\s/, ''))
              : [];
            
            // Create the summarized conversation text
            const conversationSummary = createConversationSummary(messages);
            
            const parsedData: CaseAnalysisData = {
              outcome: {
                defense: predictionPercentages.defense,
                prosecution: predictionPercentages.prosecution
              },
              legalAnalysis: {
                relevantLaw: relevantLawMatch ? relevantLawMatch[1].trim() : "No relevant law analysis available.",
                preliminaryAnalysis: preliminaryAnalysisMatch ? preliminaryAnalysisMatch[1].trim() : "No preliminary analysis available.",
                potentialIssues: potentialIssuesMatch ? potentialIssuesMatch[1].trim() : "No potential issues identified.",
                followUpQuestions: followUpQuestions
              },
              strengths: strengthsAndWeaknesses.strengths,
              weaknesses: strengthsAndWeaknesses.weaknesses,
              conversationSummary: conversationSummary,
              timestamp: new Date().toISOString()
            };
            
            setAnalysisData(parsedData);
          } catch (parseError) {
            console.error("Error parsing analysis data:", parseError);
            setError("Error parsing analysis data");
          }
        } else {
          // If no analysis exists, set a placeholder
          setAnalysisData(null);
          setError("No analysis data available for this client");
        }
      } catch (err: any) {
        console.error("Error fetching case analysis:", err);
        setError(err.message || "Failed to load case analysis");
        toast({
          title: "Error loading analysis",
          description: err.message || "There was a problem loading the case analysis.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisData();
  }, [clientId, toast]);

  // Helper function to extract strengths and weaknesses from analysis text
  const extractStrengthsWeaknesses = (analysisText: string) => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Find positive factors in the potential issues section
    const potentialIssuesMatch = analysisText.match(/\*\*POTENTIAL LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*RECOMMENDED FOLLOW-UP|$)/);
    if (potentialIssuesMatch) {
      const issues = potentialIssuesMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10); // Filter out short lines
      
      // Categorize issues as strengths or weaknesses based on keywords
      issues.forEach(issue => {
        const lowerIssue = issue.toLowerCase();
        
        // Check for positive indicators
        if (
          lowerIssue.includes("favorable") || 
          lowerIssue.includes("advantage") || 
          lowerIssue.includes("support") || 
          lowerIssue.includes("benefit") ||
          lowerIssue.includes("evidence in favor") ||
          lowerIssue.includes("strong argument")
        ) {
          strengths.push(issue.replace(/^[-•*]\s*/, '')); // Remove bullet points
        } 
        // Check for negative indicators
        else if (
          lowerIssue.includes("challenge") || 
          lowerIssue.includes("difficult") || 
          lowerIssue.includes("concern") || 
          lowerIssue.includes("problem") ||
          lowerIssue.includes("weak") ||
          lowerIssue.includes("against") ||
          lowerIssue.includes("risk")
        ) {
          weaknesses.push(issue.replace(/^[-•*]\s*/, '')); // Remove bullet points
        }
        // If unclear, default logic
        else if (strengths.length <= weaknesses.length) {
          strengths.push(issue.replace(/^[-•*]\s*/, ''));
        } else {
          weaknesses.push(issue.replace(/^[-•*]\s*/, ''));
        }
      });
    }
    
    // If we couldn't extract enough strengths/weaknesses, add generic ones based on the analysis
    if (strengths.length < 2) {
      const prelimAnalysisMatch = analysisText.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
      if (prelimAnalysisMatch) {
        const prelimText = prelimAnalysisMatch[1].toLowerCase();
        
        if (prelimText.includes("witness") && !strengths.some(s => s.toLowerCase().includes("witness"))) {
          strengths.push("Witness testimony may strengthen the case");
        }
        
        if (prelimText.includes("evidence") && !strengths.some(s => s.toLowerCase().includes("evidence"))) {
          strengths.push("Available evidence supports client's position");
        }
        
        if (prelimText.includes("precedent") && !strengths.some(s => s.toLowerCase().includes("precedent"))) {
          strengths.push("Legal precedent supports elements of our case");
        }
      }
    }
    
    if (weaknesses.length < 2) {
      const prelimAnalysisMatch = analysisText.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
      if (prelimAnalysisMatch) {
        const prelimText = prelimAnalysisMatch[1].toLowerCase();
        
        if (prelimText.includes("burden") && !weaknesses.some(w => w.toLowerCase().includes("burden"))) {
          weaknesses.push("Burden of proof challenges");
        }
        
        if (prelimText.includes("credibility") && !weaknesses.some(w => w.toLowerCase().includes("credibility"))) {
          weaknesses.push("Potential credibility challenges");
        }
        
        if (prelimText.includes("limitation") && !weaknesses.some(w => w.toLowerCase().includes("limitation"))) {
          weaknesses.push("Procedural or statutory limitations may apply");
        }
      }
    }
    
    // Ensure we have at least some strengths and weaknesses
    if (strengths.length === 0) {
      strengths.push(
        "Client's testimony appears consistent",
        "Documentation of incident is available",
        "Applicable law has favorable precedents"
      );
    }
    
    if (weaknesses.length === 0) {
      weaknesses.push(
        "Potential gaps in evidence chain",
        "Timeline inconsistencies may need resolution",
        "Opposing counsel likely to challenge key facts"
      );
    }
    
    // Ensure a reasonable number (2-4) of strengths and weaknesses
    return {
      strengths: strengths.slice(0, 4),
      weaknesses: weaknesses.slice(0, 4)
    };
  };
  
  // Helper function to calculate prediction percentages
  const calculatePredictionPercentages = (analysisText: string, strengthsWeaknesses: { strengths: string[], weaknesses: string[] }) => {
    // Base calculation on strengths vs weaknesses ratio
    const strengthsCount = strengthsWeaknesses.strengths.length;
    const weaknessesCount = strengthsWeaknesses.weaknesses.length;
    const total = strengthsCount + weaknessesCount;
    
    // Calculate a base percentage
    let defensePercentage = Math.round((strengthsCount / total) * 100);
    
    // Adjust based on keywords in analysis text
    const lowerAnalysis = analysisText.toLowerCase();
    
    // Factors that would increase defense percentage
    if (lowerAnalysis.includes("strong case") || lowerAnalysis.includes("likely to succeed")) {
      defensePercentage += 10;
    }
    
    if (lowerAnalysis.includes("precedent support") || lowerAnalysis.includes("favorable precedent")) {
      defensePercentage += 5;
    }
    
    // Factors that would decrease defense percentage
    if (lowerAnalysis.includes("difficult to prove") || lowerAnalysis.includes("challenging case")) {
      defensePercentage -= 10;
    }
    
    if (lowerAnalysis.includes("burden of proof") || lowerAnalysis.includes("high standard")) {
      defensePercentage -= 5;
    }
    
    // Ensure percentage is within reasonable bounds
    defensePercentage = Math.max(30, Math.min(defensePercentage, 80));
    
    return {
      defense: defensePercentage,
      prosecution: 100 - defensePercentage
    };
  };
  
  // Create a conversation summary from messages
  const createConversationSummary = (messages: any[]): string => {
    if (!messages || messages.length === 0) {
      return "No conversation data available.";
    }
    
    // Count the frequency of key terms to identify main topics
    const keyTerms: Record<string, number> = {};
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      // List of potential legal terms to track
      const legalTerms = [
        "injury", "accident", "witness", "evidence", "damages",
        "liability", "negligence", "compensation", "settlement",
        "police", "report", "insurance", "medical", "treatment",
        "property", "contract", "agreement", "document", "payment",
        "lawsuit", "claim", "court", "judge", "trial"
      ];
      
      legalTerms.forEach(term => {
        if (content.includes(term)) {
          keyTerms[term] = (keyTerms[term] || 0) + 1;
        }
      });
    });
    
    // Sort terms by frequency
    const sortedTerms = Object.entries(keyTerms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // Generate summary based on client-attorney conversation
    let summary = "This consultation addressed ";
    
    if (sortedTerms.length > 0) {
      summary += `${sortedTerms.slice(0, -1).join(", ")}`;
      if (sortedTerms.length > 1) {
        summary += ` and ${sortedTerms[sortedTerms.length - 1]}`;
      }
      summary += ". ";
    } else {
      summary += "various legal matters. ";
    }
    
    // Add info about the conversation length
    summary += `The conversation consisted of ${messages.length} exchanges between the attorney and client. `;
    
    // Determine if it was an initial consultation or follow-up
    const isInitial = messages.some(msg => 
      msg.content.toLowerCase().includes("first time") || 
      msg.content.toLowerCase().includes("initial consultation")
    );
    
    if (isInitial) {
      summary += "This appears to be an initial consultation to gather case information. ";
    } else {
      summary += "This appears to be a follow-up discussion to address specific case details. ";
    }
    
    // Add a concluding statement
    summary += "Key details from the conversation have been analyzed for the case evaluation.";
    
    return summary;
  };

  const generateNewAnalysis = async () => {
    setIsLoading(true);
    
    try {
      // First, fetch the client messages for this client
      const { data: messages, error: messagesError } = await supabase
        .from("client_messages")
        .select("content, role, timestamp")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      
      if (!messages || messages.length === 0) {
        throw new Error("No client conversation found to analyze");
      }
      
      // Format messages for the analysis
      const formattedMessages = messages.map(msg => ({
        content: msg.content,
        role: msg.role as "attorney" | "client",
        timestamp: msg.timestamp
      }));
      
      // Call the edge function to generate a new analysis
      const { analysis, error: analysisError } = await generateLegalAnalysis(
        clientId || "", 
        formattedMessages
      );
      
      if (analysisError) throw new Error(analysisError);
      
      if (analysis) {
        // Save the new analysis to the database
        const timestamp = new Date().toISOString();
        const { error: saveError } = await supabase
          .from("legal_analyses")
          .insert({
            client_id: clientId,
            content: analysis,
            timestamp,
            user_id: (await supabase.auth.getUser()).data.user?.id || "anonymous"
          });
          
        if (saveError) throw saveError;
        
        toast({
          title: "Analysis Generated",
          description: "A new case analysis has been generated successfully.",
        });
        
        // Refresh the data to show the new analysis
        await fetchAnalysisData();
      } else {
        throw new Error("Failed to generate analysis content");
      }
    } catch (err: any) {
      console.error("Error generating analysis:", err);
      setError(err.message || "Failed to generate analysis");
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate a new analysis.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchAnalysisData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch client messages again for updated data
      const { data: messages, error: messagesError } = await supabase
        .from("client_messages")
        .select("content, role, timestamp")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      
      if (messages) {
        const formattedMessages = messages.map(msg => ({
          content: msg.content,
          role: msg.role as "attorney" | "client",
          timestamp: msg.timestamp
        }));
        setClientMessages(formattedMessages);
      }
      
      // Fetch the latest analysis
      const { data: existingAnalysis, error: fetchError } = await supabase
        .from("legal_analyses")
        .select("content")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingAnalysis && existingAnalysis.length > 0) {
        const latestAnalysis = existingAnalysis[0].content;
        
        // Extract data from analysis content
        const strengthsAndWeaknesses = extractStrengthsWeaknesses(latestAnalysis);
        const predictionPercentages = calculatePredictionPercentages(latestAnalysis, strengthsAndWeaknesses);
        
        // Extract sections from the analysis
        const relevantLawMatch = latestAnalysis.match(/\*\*RELEVANT TEXAS LAW:\*\*([\s\S]*?)(?=\*\*PRELIMINARY ANALYSIS|\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
        const preliminaryAnalysisMatch = latestAnalysis.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
        const potentialIssuesMatch = latestAnalysis.match(/\*\*POTENTIAL LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*RECOMMENDED FOLLOW-UP|$)/);
        const followUpQuestionsMatch = latestAnalysis.match(/\*\*RECOMMENDED FOLLOW-UP QUESTIONS:\*\*([\s\S]*?)$/);
        
        // Extract follow-up questions
        const followUpQuestions = followUpQuestionsMatch 
          ? followUpQuestionsMatch[1].split('\n')
            .map(line => line.trim())
            .filter(line => line.match(/^\d+\.\s/))
            .map(line => line.replace(/^\d+\.\s/, ''))
          : [];
        
        // Create the summarized conversation text
        const conversationSummary = createConversationSummary(messages);
        
        const parsedData: CaseAnalysisData = {
          outcome: {
            defense: predictionPercentages.defense,
            prosecution: predictionPercentages.prosecution
          },
          legalAnalysis: {
            relevantLaw: relevantLawMatch ? relevantLawMatch[1].trim() : "No relevant law analysis available.",
            preliminaryAnalysis: preliminaryAnalysisMatch ? preliminaryAnalysisMatch[1].trim() : "No preliminary analysis available.",
            potentialIssues: potentialIssuesMatch ? potentialIssuesMatch[1].trim() : "No potential issues identified.",
            followUpQuestions: followUpQuestions
          },
          strengths: strengthsAndWeaknesses.strengths,
          weaknesses: strengthsAndWeaknesses.weaknesses,
          conversationSummary: conversationSummary,
          timestamp: new Date().toISOString()
        };
        
        setAnalysisData(parsedData);
        setError(null);
      } else {
        setAnalysisData(null);
        setError("No analysis data available for this client");
      }
    } catch (err: any) {
      console.error("Error fetching case analysis:", err);
      setError(err.message || "Failed to load case analysis");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analysisData,
    isLoading,
    error,
    generateNewAnalysis
  };
};
