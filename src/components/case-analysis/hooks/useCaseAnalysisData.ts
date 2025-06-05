import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { ScholarlyArticle, searchGoogleScholar, getScholarlyReferences } from "@/utils/api/scholarApiService";
import { ProcessDocumentContentFunction } from "@/types/caseAnalysis";
import { extractLegalCitations, mapCitationsToKnowledgeBase, generateDirectPdfUrl } from "@/utils/lawReferences/knowledgeBaseMapping";
import { cleanupDuplicateAnalyses } from "@/utils/duplicateCleanupService";
import { useToast } from "@/hooks/use-toast";

export const useCaseAnalysisData = (clientId: string, caseId?: string) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hasUnincorporatedFindings, setHasUnincorporatedFindings] = useState(false);
  const { toast } = useToast();
  
  // Scholarly references state
  const [scholarlyReferences, setScholarlyReferences] = useState<ScholarlyArticle[]>([]);
  const [isScholarlyReferencesLoading, setIsScholarlyReferencesLoading] = useState(false);
  
  // Other state variables for conversation, notes, documents
  const [conversation, setConversation] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);

  // Auto-fetch scholarly references when analysis data is available
  const fetchScholarlyReferences = useCallback(async (caseType?: string) => {
    if (!clientId) return;
    
    setIsScholarlyReferencesLoading(true);
    
    try {
      console.log("Auto-fetching scholarly references for client:", clientId, "case type:", caseType);
      const { results, error } = await getScholarlyReferences(clientId, caseType);
      
      if (error) {
        console.error("Error fetching scholarly references:", error);
        if (error.includes("SerpAPI") || error.includes("not configured")) {
          toast({
            title: "Configuration Required",
            description: "Google Scholar search requires API configuration. Contact administrator.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to fetch scholarly references: ${error}`,
            variant: "destructive",
          });
        }
      } else {
        console.log("Successfully fetched scholarly references:", results.length);
        setScholarlyReferences(results);
        if (results.length === 0) {
          toast({
            title: "No Results",
            description: "No scholarly articles found for this case analysis.",
          });
        }
      }
    } catch (err: any) {
      console.error("Exception in fetchScholarlyReferences:", err);
      toast({
        title: "Error",
        description: "Failed to fetch scholarly references. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScholarlyReferencesLoading(false);
    }
  }, [clientId, toast]);

  // Handle manual scholarly search
  const handleScholarSearch = useCallback(async (query: string) => {
    setIsScholarlyReferencesLoading(true);
    
    try {
      console.log("Searching scholarly references with query:", query);
      const { results, error } = await searchGoogleScholar(query);
      
      if (error) {
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description: error,
          variant: "destructive",
        });
      } else {
        setScholarlyReferences(results);
        toast({
          title: "Search Results",
          description: `Found ${results.length} scholarly articles related to your query.`,
        });
      }
    } catch (err: any) {
      console.error("Error searching scholarly references:", err);
      toast({
        title: "Search Error",
        description: "Failed to search scholarly references. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScholarlyReferencesLoading(false);
    }
  }, [toast]);

  // Check for unincorporated findings from case discussions
  const checkForUnincorporatedFindings = useCallback(async () => {
    try {
      // Get the latest legal analysis timestamp
      const { data: latestAnalysis } = await supabase
        .from("legal_analyses")
        .select("updated_at")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!latestAnalysis || latestAnalysis.length === 0) {
        setHasUnincorporatedFindings(false);
        return;
      }

      const latestAnalysisTime = new Date(latestAnalysis[0].updated_at);

      // Check for case discussion messages after the latest analysis
      const { data: recentDiscussions } = await supabase
        .from("case_discussions")
        .select("created_at")
        .eq("client_id", clientId)
        .eq("role", "assistant")
        .gt("created_at", latestAnalysisTime.toISOString())
        .limit(1);

      setHasUnincorporatedFindings(recentDiscussions && recentDiscussions.length > 0);
    } catch (error) {
      console.error("Error checking for unincorporated findings:", error);
      setHasUnincorporatedFindings(false);
    }
  }, [clientId]);

  const fetchAnalysisData = useCallback(async () => {
    if (!clientId) return;
    
    setIsAnalysisLoading(true);
    setAnalysisError(null);
    
    try {
      // First, clean up any duplicate analyses for this client
      const cleanupResult = await cleanupDuplicateAnalyses(clientId);
      if (cleanupResult.duplicatesRemoved > 0) {
        console.log(`Cleaned up ${cleanupResult.duplicatesRemoved} duplicate analyses for client ${clientId}`);
      }

      // Fetch the latest legal analysis with proper case filtering
      let query = supabase
        .from("legal_analyses")
        .select("*")
        .eq("client_id", clientId);

      // Apply case filtering properly
      if (caseId) {
        query = query.eq("case_id", caseId);
      } else {
        query = query.is("case_id", null);
      }

      const { data: analyses, error: analysisError } = await query
        .order("created_at", { ascending: false })
        .limit(1);

      if (analysisError) {
        throw new Error(`Failed to fetch analysis: ${analysisError.message}`);
      }

      if (analyses && analyses.length > 0) {
        const analysis = analyses[0];
        
        // Extract legal citations from the analysis content and map to knowledge base
        const extractedCitations = extractLegalCitations(analysis.content);
        console.log("Extracted citations from analysis:", extractedCitations);
        
        const knowledgeBaseDocs = mapCitationsToKnowledgeBase(extractedCitations);
        console.log("Mapped knowledge base documents:", knowledgeBaseDocs);
        
        // Convert knowledge base docs to law references format with direct PDF URLs
        const lawReferences = knowledgeBaseDocs.map(doc => ({
          id: doc.id,
          title: doc.title,
          url: generateDirectPdfUrl(doc.filename),
          content: `Click to view the full ${doc.title} document.`
        }));
        
        // Transform the analysis into the expected format
        const transformedData: AnalysisData = {
          legalAnalysis: {
            relevantLaw: "",
            preliminaryAnalysis: "",
            potentialIssues: "",
            followUpQuestions: []
          },
          strengths: [],
          weaknesses: [],
          conversationSummary: "",
          outcome: {
            defense: 65,
            prosecution: 35
          },
          timestamp: analysis.timestamp || new Date().toLocaleTimeString(),
          lawReferences: lawReferences,
          caseType: analysis.case_type || "general",
          remedies: "",
          rawContent: analysis.content
        };

        setAnalysisData(transformedData);

        // Auto-fetch scholarly references based on the case type
        await fetchScholarlyReferences(analysis.case_type);
      } else {
        setAnalysisData(null);
        // Clear scholarly references if no analysis found
        setScholarlyReferences([]);
      }

      // Check for unincorporated findings after fetching analysis
      await checkForUnincorporatedFindings();
      
    } catch (err: any) {
      console.error("Error fetching analysis data:", err);
      setAnalysisError(err.message);
    } finally {
      setIsAnalysisLoading(false);
    }
  }, [clientId, caseId, checkForUnincorporatedFindings, fetchScholarlyReferences]);

  // Fetch conversation data
  const fetchConversation = useCallback(async () => {
    if (!clientId) return;
    
    setConversationLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_messages")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setConversation(data || []);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setConversationLoading(false);
    }
  }, [clientId]);

  // Fetch notes data
  const fetchNotes = useCallback(async () => {
    if (!clientId) return;
    
    setNotesLoading(true);
    try {
      const { data, error } = await supabase
        .from("case_analysis_notes")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setNotesLoading(false);
    }
  }, [clientId]);

  // Fetch documents data
  const fetchClientDocuments = useCallback(async () => {
    if (!clientId) return;
    
    setDocumentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("document_metadata")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  }, [clientId]);

  // Process document function
  const processDocument: ProcessDocumentContentFunction = async (title: string, content: string, metadata?: any) => {
    setIsProcessingDocument(true);
    try {
      // Implementation for processing documents
      console.log("Processing document:", title);
      // Add your document processing logic here
    } catch (error) {
      console.error("Error processing document:", error);
      throw error;
    } finally {
      setIsProcessingDocument(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchAnalysisData();
    fetchConversation();
    fetchNotes();
    fetchClientDocuments();
  }, [fetchAnalysisData, fetchConversation, fetchNotes, fetchClientDocuments]);

  // Set up real-time subscription for case discussions to detect new findings
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('case-discussions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_discussions',
          filter: `client_id=eq.${clientId}`
        },
        () => {
          // New case discussion message added, check for unincorporated findings
          checkForUnincorporatedFindings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, checkForUnincorporatedFindings]);

  return {
    analysisData,
    isAnalysisLoading,
    analysisError,
    hasUnincorporatedFindings,
    fetchAnalysisData,
    scholarlyReferences,
    isScholarlyReferencesLoading,
    handleScholarSearch,
    conversation,
    notes,
    conversationLoading,
    notesLoading,
    clientDocuments,
    documentsLoading,
    processDocument,
    isProcessingDocument
  };
};
