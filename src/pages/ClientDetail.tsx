import React from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft, FileText, BookOpen, FileSearch, Video, FileChartLine } from "lucide-react";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useClientDetail } from "@/hooks/useClientDetail";
import ClientDetailSkeleton from "@/components/clients/ClientDetailSkeleton";
import ClientInformationAccordion from "@/components/clients/ClientInformationAccordion";
import ClientIntakeChat from "@/components/clients/chat/ClientIntakeChat";
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {client.first_name} {client.last_name}
          </h1>
          <Link to="/clients">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <ClientInformationAccordion 
            client={client} 
            onEditClick={handleEditClick} 
          />
        </div>

        <Tabs defaultValue="client-intake" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-6">
            <TabsTrigger value="client-intake" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Client Intake
            </TabsTrigger>
            <TabsTrigger value="fact-pattern" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Fact Pattern
            </TabsTrigger>
            <TabsTrigger value="discovery" className="flex items-center gap-2">
              <FileSearch className="h-4 w-4" /> Discovery
            </TabsTrigger>
            <TabsTrigger value="deposition" className="flex items-center gap-2">
              <Video className="h-4 w-4" /> Deposition
            </TabsTrigger>
            <TabsTrigger value="case-analysis" className="flex items-center gap-2">
              <FileChartLine className="h-4 w-4" /> Case Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="client-intake" className="py-4">
            <Card>
              <CardContent className="pt-6">
                <ClientIntakeChat clientId={client.id} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="fact-pattern" className="py-4">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Fact Pattern</h2>
                <p className="text-muted-foreground">
                  Case fact pattern details will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="discovery" className="py-4">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Discovery</h2>
                <p className="text-muted-foreground">
                  Case discovery documents and information will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="deposition" className="py-4">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Deposition</h2>
                <p className="text-muted-foreground">
                  Deposition recordings and transcripts will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="case-analysis" className="py-4">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Case Analysis</h2>
                <p className="text-muted-foreground">
                  Comprehensive case analysis and legal strategy will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClientDetail;
