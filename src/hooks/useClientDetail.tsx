
import { useClientFetch } from "@/hooks/useClientFetch";
import { useClientDelete } from "@/hooks/useClientDelete";

export const useClientDetail = (clientId?: string) => {
  const { client, loading, error, session, refreshClient } = useClientFetch(clientId);
  const { deleteClient, isDeleting } = useClientDelete(clientId, client);

  return { 
    client, 
    loading, 
    error, 
    session, 
    refreshClient, 
    deleteClient, 
    isDeleting 
  };
};
