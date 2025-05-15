
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Case } from "@/types/case";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CaseContextType {
  currentCase: Case | null;
  setCurrentCase: (caseData: Case | null) => void;
  fetchCase: (caseId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCase = async (caseId: string) => {
    if (!caseId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .single();
      
      if (error) throw error;
      
      setCurrentCase(data);
    } catch (err: any) {
      console.error("Error fetching case:", err);
      setError(err.message || "Failed to load case details");
      toast({
        title: "Error",
        description: "Could not load case details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CaseContext.Provider
      value={{
        currentCase,
        setCurrentCase,
        fetchCase,
        isLoading,
        error
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCase = (): CaseContextType => {
  const context = useContext(CaseContext);
  if (context === undefined) {
    throw new Error("useCase must be used within a CaseProvider");
  }
  return context;
};
