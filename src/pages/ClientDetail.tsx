
import React from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useClientDetail } from "@/hooks/useClientDetail";
import ClientDetailSkeleton from "@/components/clients/ClientDetailSkeleton";
import ClientInformationAccordion from "@/components/clients/ClientInformationAccordion";
import { useToast } from "@/hooks/use-toast";

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { client, loading, error, session } = useClientDetail(id);
  const { toast } = useToast();

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
      description: "Client editing functionality coming soon.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/clients">
            <Button variant="ghost" className="pl-0 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">
          {client.first_name} {client.last_name}
        </h1>

        <div className="mb-8">
          <ClientInformationAccordion 
            client={client} 
            onEditClick={handleEditClick} 
          />
        </div>
      </main>
    </div>
  );
};

export default ClientDetail;
