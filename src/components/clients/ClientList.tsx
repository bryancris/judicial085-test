
import React from "react";
import { useClients } from "@/hooks/useClients";
import ClientSearch from "./ClientSearch";
import ClientTable from "./ClientTable";
import ClientListSkeleton from "./ClientListSkeleton";
import EmptyClientList from "./EmptyClientList";

const ClientList = () => {
  const {
    filteredClients,
    searchTerm,
    setSearchTerm,
    loading,
    handleViewClient,
    clients
  } = useClients();

  if (loading) {
    return <ClientListSkeleton />;
  }

  if (clients.length === 0) {
    return <EmptyClientList />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <ClientSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>

      {filteredClients.length === 0 ? (
        <EmptyClientList isFiltered />
      ) : (
        <ClientTable 
          clients={filteredClients} 
          handleViewClient={handleViewClient} 
        />
      )}
    </div>
  );
};

export default ClientList;
