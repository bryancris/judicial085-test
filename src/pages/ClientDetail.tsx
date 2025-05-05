
import React from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useClientDetail } from "@/hooks/useClientDetail";
import ClientDetailSkeleton from "@/components/clients/ClientDetailSkeleton";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { client, loading, error, session } = useClientDetail(id);

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
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="client-info">
              <AccordionTrigger className="bg-background hover:bg-muted px-4 py-3 rounded-md border text-lg font-medium">
                Client Information
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                      <dl className="space-y-4">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                          <dd className="mt-1">{client.email}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                          <dd className="mt-1">{client.phone}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Address</h3>
                      <dl className="space-y-4">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Street Address</dt>
                          <dd className="mt-1">{client.address || "Not provided"}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">City</dt>
                          <dd className="mt-1">{client.city || "Not provided"}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">State</dt>
                          <dd className="mt-1">{client.state || "Not provided"}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">ZIP Code</dt>
                          <dd className="mt-1">{client.zip_code || "Not provided"}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
    </div>
  );
};

export default ClientDetail;
