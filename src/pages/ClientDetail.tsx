
import React from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft, Edit } from "lucide-react";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useClientDetail } from "@/hooks/useClientDetail";
import ClientDetailSkeleton from "@/components/clients/ClientDetailSkeleton";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

  // Create an array of case types for rendering the checkboxes
  const CASE_TYPES = [
    { id: "family", label: "Family Law" },
    { id: "criminal", label: "Criminal Defense" },
    { id: "immigration", label: "Immigration" },
    { id: "personal_injury", label: "Personal Injury" },
    { id: "estate", label: "Estate Planning" },
    { id: "business", label: "Business Law" },
    { id: "real_estate", label: "Real Estate" },
    { id: "intellectual_property", label: "Intellectual Property" },
    { id: "employment", label: "Employment" }
  ];

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
          <Accordion type="single" collapsible defaultValue="client-info" className="w-full">
            <AccordionItem value="client-info">
              <div className="flex justify-between items-center">
                <AccordionTrigger className="bg-background hover:bg-muted px-4 py-3 rounded-md border text-lg font-medium flex-grow">
                  Client Information
                </AccordionTrigger>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2 flex items-center gap-1"
                  onClick={handleEditClick}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
              <AccordionContent className="pt-6">
                <div className="space-y-8">
                  {/* Personal Information Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                              <div className="mt-1 p-2 border rounded-md">{client.first_name}</div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                              <div className="mt-1 p-2 border rounded-md">{client.last_name}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                              <div className="mt-1 p-2 border rounded-md">{client.email}</div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                              <div className="mt-1 p-2 border rounded-md">{client.phone}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                              <div className="mt-1 p-2 border rounded-md">{client.address || "Not provided"}</div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">City</Label>
                              <div className="mt-1 p-2 border rounded-md">{client.city || "Not provided"}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">State</Label>
                              <div className="mt-1 p-2 border rounded-md">{client.state || "Not provided"}</div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">ZIP Code</Label>
                              <div className="mt-1 p-2 border rounded-md">{client.zip_code || "Not provided"}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Case Information Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Case Information</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-6">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Case Number</Label>
                              <div className="mt-1 p-2 border rounded-md">{client.case_number || "Not provided"}</div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground block mb-3">Case Types</Label>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {CASE_TYPES.map((type) => (
                                  <div key={type.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={type.id} 
                                      checked={(client.case_types || []).includes(type.id)} 
                                      disabled
                                    />
                                    <Label 
                                      htmlFor={type.id} 
                                      className="font-normal cursor-default"
                                    >
                                      {type.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Referred By</Label>
                              <div className="mt-1 p-2 border rounded-md">{client.referred_by || "Not provided"}</div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Case Notes</Label>
                              <div className="mt-1 p-2 border rounded-md min-h-[100px] whitespace-pre-wrap">
                                {client.case_notes || "No notes provided"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
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
