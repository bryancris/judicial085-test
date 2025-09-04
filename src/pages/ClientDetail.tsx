
import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { useClientDetail } from "@/hooks/useClientDetail";
import ClientDetailSkeleton from "@/components/clients/ClientDetailSkeleton";
import ClientInformationAccordion from "@/components/clients/ClientInformationAccordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ClientDetailHeader from "@/components/clients/ClientDetailHeader";
import ClientDetailTabContent from "@/components/clients/ClientDetailTabs/ClientDetailTabContent";
import DeleteClientDialog from "@/components/clients/DeleteClientDialog";
import { useToast } from "@/components/ui/use-toast";
import { CaseProvider } from "@/contexts/CaseContext";
import CasesSection from "@/components/clients/cases/CasesSection";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import ClientDetailSidebar from "@/components/clients/ClientDetailSidebar";
import { Tabs } from "@/components/ui/tabs";

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { client, loading, error, session, refreshClient, deleteClient, isDeleting } = useClientDetail(id);
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("client-intake");
  console.log("ClientDetail render", { id, loading, hasSession: !!session, hasClient: !!client, error });

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
    try {
      await deleteClient();
      // We don't close the dialog here because we want to show the loading state
      // The navigation will happen automatically after successful deletion
    } catch (error) {
      // If there's an error, we close the dialog so the user can try again
      setDeleteDialogOpen(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <CaseProvider>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex flex-1">
          <SidebarProvider>
            <div className="flex w-full">
              <ClientDetailSidebar 
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
              <SidebarInset className="flex flex-col flex-1">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                  <SidebarTrigger className="-ml-1" />
                  <h1 className="text-2xl font-bold ml-4">
                    {client.first_name} {client.last_name}
                  </h1>
                </header>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1">
                  <main className="flex-1 container mx-auto px-4 py-8 overflow-auto">
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

                    <CasesSection clientId={client.id} />

                    <div className="mt-8">
                      <ClientDetailTabContent 
                        client={client} 
                        activeTab={activeTab}
                      />
                    </div>
                  </main>
                </Tabs>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </div>

        <DeleteClientDialog
          client={client}
          isOpen={deleteDialogOpen}
          setIsOpen={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      </div>
    </CaseProvider>
  );
};

export default ClientDetail;
