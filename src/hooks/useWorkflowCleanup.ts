import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWorkflowCleanup = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const cleanupStuckWorkflows = async (clientId: string) => {
    if (!clientId) {
      toast.error("Client ID is required for cleanup");
      return;
    }

    setIsCleaningUp(true);
    
    try {
      console.log(`🧹 Starting cleanup for client ${clientId}`);
      
      const { data, error } = await supabase.functions.invoke('cleanup-workflows', {
        body: { clientId }
      });

      if (error) {
        console.error('❌ Cleanup error:', error);
        toast.error("Failed to clean up stuck workflows");
        return;
      }

      console.log('✅ Cleanup result:', data);
      
      if (data.cleaned > 0) {
        toast.success(`Cleaned up ${data.cleaned} stuck workflow${data.cleaned === 1 ? '' : 's'}`);
      } else {
        toast.info("No stuck workflows found to clean up");
      }

      // Refresh the page to clear any stale UI state
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ Cleanup error:', error);
      toast.error("An error occurred during cleanup");
    } finally {
      setIsCleaningUp(false);
    }
  };

  return {
    cleanupStuckWorkflows,
    isCleaningUp
  };
};