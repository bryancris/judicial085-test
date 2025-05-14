
import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { Tabs } from "@/components/ui/tabs";
import { useClientDetail } from "@/hooks/useClientDetail";
import ClientDetailSkeleton from "@/components/clients/ClientDetailSkeleton";
import ClientInformationAccordion from "@/components/clients/ClientInformationAccordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ClientDetailHeader from "@/components/clients/ClientDetailHeader";
import ClientDetailTabsList from "@/components/clients/ClientDetailTabs/ClientDetailTabsList";
import ClientDetailTabContent from "@/components/clients/ClientDetailTabs/ClientDetailTabContent";
import DeleteClientDialog from "@/components/clients/DeleteClientDialog";
import { useToast } from "@/hooks/use-toast";

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { client, loading, error, session, refreshClient, deleteClient, isDeleting } = useClientDetail(id);
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // If not authenticated, redirect to auth page
  if (!session && !loading) {
    return <Navigate to="/auth" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <ClientDetailSkeleton />
        </main>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h2 className="text-2xl font-bold mb-2">Client not found</h2>
                <p className="text-muted-foreground mb-6">
                  {error || "The requested client could not be found."}
                </p>
                <Link to="/clients">
                  <Button>Return to Clients</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleEditClick = () => {
    toast({
      title: "Edit mode",
      description: "You can now edit the client information.",
    });
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteClient();
    setDeleteDialogOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ClientDetailHeader 
          client={client} 
          onDeleteClick={handleDeleteClick}
          isDeleting={isDeleting}
        />

        <div className="mb-8">
          <ClientInformationAccordion 
            client={client} 
            onEditClick={handleEditClick}
            refreshClient={refreshClient}
          />
        </div>

        <Tabs defaultValue="client-intake" className="w-full">
          <ClientDetailTabsList />
          <ClientDetailTabContent client={client} />
        </Tabs>
      </main>

      <DeleteClientDialog
        client={client}
        isOpen={deleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ClientDetail;
