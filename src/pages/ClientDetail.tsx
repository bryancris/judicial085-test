
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
import CaseAnalysisContainer from "@/components/case-analysis/CaseAnalysisContainer";
import { useToast } from "@/hooks/use-toast";

// Define tab color styles
const tabColors = {
  "client-intake": "bg-[#0EA5E9] text-white",
  "fact-pattern": "bg-[#F97316] text-white",
  "discovery": "bg-[#8B5CF6] text-white",
  "deposition": "bg-[#D946EF] text-white",
  "case-analysis": "bg-[#ea384c] text-white",
};

const tabHoverColors = {
  "client-intake": "hover:bg-[#0EA5E9]/90",
  "fact-pattern": "hover:bg-[#F97316]/90",
  "discovery": "hover:bg-[#8B5CF6]/90",
  "deposition": "hover:bg-[#D946EF]/90",
  "case-analysis": "hover:bg-[#ea384c]/90",
};

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { client, loading, error, session, refreshClient } = useClientDetail(id);
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
      description: "You can now edit the client information.",
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
            refreshClient={refreshClient}
          />
        </div>

        <Tabs defaultValue="client-intake" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-6">
            {["client-intake", "fact-pattern", "discovery", "deposition", "case-analysis"].map((tabValue) => (
              <TabsTrigger 
                key={tabValue}
                value={tabValue} 
                className={`flex items-center gap-2 ${tabColors[tabValue as keyof typeof tabColors]} ${tabHoverColors[tabValue as keyof typeof tabHoverColors]} data-[state=inactive]:opacity-70`}
              >
                {tabValue === "client-intake" && <FileText className="h-4 w-4" />}
                {tabValue === "fact-pattern" && <BookOpen className="h-4 w-4" />}
                {tabValue === "discovery" && <FileSearch className="h-4 w-4" />}
                {tabValue === "deposition" && <Video className="h-4 w-4" />}
                {tabValue === "case-analysis" && <FileChartLine className="h-4 w-4" />}
                {tabValue.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
              </TabsTrigger>
            ))}
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
                <CaseAnalysisContainer clientId={client.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClientDetail;
