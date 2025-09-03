import { useState, useCallback, useEffect } from "react";
import { QuickConsultMessage, sendQuickConsultMessage } from "@/utils/api/quickConsultService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useQuickConsult = (clientId?: string, sessionId?: string, createNewSession?: () => Promise<string | null>) => {
  const [messages, setMessages] = useState<QuickConsultMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const { toast } = useToast();

  // Load messages for current session
  useEffect(() => {
    const loadMessages = async () => {
      if (!sessionId) {
        setMessages([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('quick_consult_messages' as any)
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formattedMessages: QuickConsultMessage[] = ((data || []) as any).map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString(),
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      console.log("Quick Consult: Empty message, not sending");
      return;
    }

    console.log("Quick Consult: Starting to send message", { content: content.slice(0, 50), sessionId, hasCreateFunction: !!createNewSession });

    // If no session ID and we can create one, do so
    let currentSessionId = sessionId;
    if (!currentSessionId && createNewSession) {
      console.log("Quick Consult: No session ID, creating new session");
      setIsLoading(true);
      try {
        // Add timeout for session creation
        const sessionPromise = createNewSession();
        const timeoutPromise = new Promise<string | null>((_, reject) => 
          setTimeout(() => reject(new Error('Session creation timeout')), 10000)
        );
        
        currentSessionId = await Promise.race([sessionPromise, timeoutPromise]);
        console.log("Quick Consult: New session created", { sessionId: currentSessionId });
        if (!currentSessionId) {
          console.error("Quick Consult: Failed to create new session");
          toast({
            title: "Error",
            description: "Failed to create chat session. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Quick Consult: Error creating session:", error);
        toast({
          title: "Error",
          description: "Failed to create chat session. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    if (!currentSessionId) {
      console.error("Quick Consult: No session ID available and cannot create one");
      toast({
        title: "Error",
        description: "No chat session available. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: QuickConsultMessage = {
      role: "user",
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to database with timeout
    try {
      console.log("Quick Consult: Saving user message to database", { sessionId: currentSessionId });
      
      const savePromise = supabase
        .from('quick_consult_messages' as any)
        .insert({
          session_id: currentSessionId,
          role: 'user',
          content: content.trim(),
        } as any);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database save timeout')), 5000)
      );
      
      await Promise.race([savePromise, timeoutPromise]);
      console.log("Quick Consult: User message saved successfully");
    } catch (error) {
      console.error('Quick Consult: Error saving user message:', error);
      // Continue anyway - user can retry if needed
    }

  // AI service timeout and retry configuration
  const AI_SERVICE_TIMEOUT_MS = 65000; // 65 seconds to allow backend processing time
  let retryCount = 0;
  const maxRetries = 0; // Reduced retries since timeout is now longer
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`Quick Consult: Sending message to AI service (attempt ${retryCount + 1}/${maxRetries + 1}) with ${AI_SERVICE_TIMEOUT_MS}ms timeout`);
      const currentMessages = [...messages, userMessage];
      
      // Add timeout for AI service call with late arrival handling
      const aiPromise = sendQuickConsultMessage(currentMessages, clientId);
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => {
          console.log('Quick Consult: Timeout fired after', AI_SERVICE_TIMEOUT_MS, 'ms');
          reject(new Error('AI service timeout - please try again'));
        }, AI_SERVICE_TIMEOUT_MS)
      );
      
      let response;
      let didTimeout = false;
      
      try {
        response = await Promise.race([aiPromise, timeoutPromise]);
      } catch (error) {
        if (error.message.includes('timeout')) {
          didTimeout = true;
          console.log('Quick Consult: Setting up late arrival handler...');
          
          // Set up late arrival handler
          aiPromise.then((lateResponse) => {
            console.log('Quick Consult: Late arrival response received');
            if (lateResponse && lateResponse.text && lateResponse.text.trim()) {
              toast({
                title: "Response Received",
                description: "Your research response arrived after the timeout.",
                duration: 5000,
              });
              
              const assistantMessage: QuickConsultMessage = {
                role: "assistant",
                content: lateResponse.text,
                timestamp: new Date().toLocaleTimeString(),
              };

              setMessages(prev => [...prev, assistantMessage]);
              setLastResponse(lateResponse);
              
              // Save late arrival message to database (fire and forget)
              Promise.resolve(
                supabase
                  .from('quick_consult_messages' as any)
                  .insert({
                    session_id: currentSessionId,
                    role: 'assistant',
                    content: lateResponse.text,
                  } as any)
              ).then(() => {
                console.log('Quick Consult: Late arrival message saved');
              }).catch(err => {
                console.error('Quick Consult: Error saving late arrival message:', err);
              });
            }
          }).catch(err => console.log('Quick Consult: Late arrival also failed:', err));
        }
        throw error;
      }
        console.log("Quick Consult: Received AI response", { 
          hasResponse: !!response, 
          hasError: !!response?.error,
          hasText: !!response?.text,
          textLength: response?.text?.length || 0
        });

        if (response.error) {
          // Handle NO_RESULTS as a special case
          if (response.error === "NO_RESULTS") {
            const noResultsMessage = "I couldn't find any relevant information for your query. Please try rephrasing your question or being more specific.";
            
            const assistantMessage: QuickConsultMessage = {
              role: "assistant",
              content: noResultsMessage,
              timestamp: new Date().toLocaleTimeString(),
            };

            setMessages(prev => [...prev, assistantMessage]);
            
            // Save the "found nothing" message to database
            try {
              const savePromise = supabase
                .from('quick_consult_messages' as any)
                .insert({
                  session_id: currentSessionId,
                  role: 'assistant',
                  content: noResultsMessage,
                } as any);
              
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database save timeout')), 5000)
              );
              
              await Promise.race([savePromise, timeoutPromise]);
            } catch (saveError) {
              console.error('Quick Consult: Error saving no-results message:', saveError);
            }
            
            setLastResponse({
              text: noResultsMessage,
              citations: [],
              hasKnowledgeBase: false,
              documentsFound: 0,
              verifiedCases: 0,
              courtListenerCitations: 0
            });
            
            setIsLoading(false);
            return; // Exit early, don't throw error
          }
          
          throw new Error(response.error);
        }

        if (!response.text?.trim()) {
          throw new Error("AI service returned empty response");
        }

        // Store the full response for potential citation display
        setLastResponse(response);

        const assistantMessage: QuickConsultMessage = {
          role: "assistant",
          content: response.text,
          timestamp: new Date().toLocaleTimeString(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Save assistant message to database with timeout
        try {
          console.log("Quick Consult: Saving assistant message to database");
          
          const savePromise = supabase
            .from('quick_consult_messages' as any)
            .insert({
              session_id: currentSessionId,
              role: 'assistant',
              content: response.text,
            } as any);
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database save timeout')), 5000)
          );
          
          await Promise.race([savePromise, timeoutPromise]);
          console.log("Quick Consult: Assistant message saved successfully");
        } catch (error) {
          console.error('Quick Consult: Error saving assistant message:', error);
          // Continue anyway - message is already displayed
        }

        // Show knowledge base usage toast (if metadata is available)
        if ((response as any).hasKnowledgeBase && (response as any).documentsFound && (response as any).documentsFound > 0) {
          toast({
            title: "Knowledge Base Used",
            description: `Referenced ${(response as any).documentsFound} document(s) from the knowledge base`,
            variant: "default",
          });
        }

        // Show verification status for CourtListener cases (if metadata is available)
        if ((response as any).verifiedCases && (response as any).verifiedCases > 0) {
          toast({
            title: "Cases Verified",
            description: `Verified ${(response as any).verifiedCases} case citations with CourtListener for legal accuracy`,
            variant: "default",
          });
        }

        if ((response as any).courtListenerCitations && (response as any).courtListenerCitations > 0) {
          toast({
            title: "CourtListener Citations Added",
            description: `Added ${(response as any).courtListenerCitations} verified citations with direct links`,
            variant: "default",
          });
        } else if ((response as any).verifiedCases === 0) {
          toast({
            title: "⚠️ Citation Verification Needed",
            description: "CourtListener API requires setup for case verification",
            variant: "destructive",
          });
        }

        // Success - break out of retry loop
        break;

      } catch (error: any) {
        console.error(`Quick Consult: Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        if (retryCount <= maxRetries) {
          console.log(`Quick Consult: Retrying in ${retryCount * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
        } else {
          // All retries exhausted
          console.error("Quick Consult: All retry attempts failed");
          
          let errorMessage = "Failed to send message. Please try again.";
          if (error.message.includes('timeout')) {
            errorMessage = "Request timed out. Please check your connection and try again.";
          } else if (error.message.includes('AI service')) {
            errorMessage = "AI service is temporarily unavailable. Please try again in a moment.";
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Add a fallback message to help the user
          const fallbackMessage: QuickConsultMessage = {
            role: "assistant",
            content: "I'm having trouble responding right now. This could be due to:\n\n• Network connectivity issues\n• AI service temporarily unavailable\n• API configuration problems\n\nPlease try again in a moment. If the problem persists, please refresh the page.",
            timestamp: new Date().toLocaleTimeString(),
          };
          
          setMessages(prev => [...prev, fallbackMessage]);
        }
      }
    }
    
    setIsLoading(false);
  }, [messages, toast, clientId, sessionId, createNewSession]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastResponse(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    lastResponse,
  };
};