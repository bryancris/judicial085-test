
import { validateDocumentTitle } from "@/utils/documentCleanupService";
import { useToast } from "@/hooks/use-toast";

export const useDocumentValidation = () => {
  const { toast } = useToast();

  const validateTitle = (title: string) => {
    const validation = validateDocumentTitle(title);
    if (!validation.valid) {
      toast({
        title: "Document creation blocked",
        description: validation.error,
        variant: "destructive",
      });
    }
    return validation;
  };

  return { validateTitle };
};
