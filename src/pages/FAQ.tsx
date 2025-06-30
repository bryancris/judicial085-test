
import React from "react";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-lg">
            Get help with Judicial Junction's features and functionality
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Getting Started
                <Badge variant="secondary">Basics</Badge>
              </CardTitle>
              <CardDescription>
                Learn the fundamentals of using Judicial Junction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="what-is-judicial-junction">
                  <AccordionTrigger>What is Judicial Junction?</AccordionTrigger>
                  <AccordionContent>
                    Judicial Junction is a comprehensive legal practice management platform designed to streamline client intake, case analysis, document management, and legal research for law firms and attorneys.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="how-to-get-started">
                  <AccordionTrigger>How do I get started?</AccordionTrigger>
                  <AccordionContent>
                    Start by creating an account and logging in. Then you can begin by adding your first client through the Clients page, where you'll be guided through the client intake process.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Client Management
                <Badge variant="outline">Clients</Badge>
              </CardTitle>
              <CardDescription>
                Managing clients and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="add-client">
                  <AccordionTrigger>How do I add a new client?</AccordionTrigger>
                  <AccordionContent>
                    Navigate to the Clients page and click the "Add New Client" button. Fill out the comprehensive intake form with personal information, address details, and case information. The AI will help gather additional details through an interactive interview.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="client-intake">
                  <AccordionTrigger>What is the Client Intake feature?</AccordionTrigger>
                  <AccordionContent>
                    The Client Intake tab uses AI to conduct comprehensive interviews with clients, gathering detailed information about their legal situation, background, and case specifics through natural conversation.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="case-management">
                  <AccordionTrigger>How do I manage multiple cases for one client?</AccordionTrigger>
                  <AccordionContent>
                    Each client can have multiple cases. You can create new cases from the client detail page, and all case-specific documents and analysis will be organized separately while maintaining the client relationship.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Document Management
                <Badge variant="outline">Documents</Badge>
              </CardTitle>
              <CardDescription>
                Working with documents and files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="upload-documents">
                  <AccordionTrigger>How do I upload documents?</AccordionTrigger>
                  <AccordionContent>
                    You can upload documents in the Documents tab of any client. The system supports PDF and Word documents, which are automatically processed and made searchable for case analysis.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="knowledge-tab">
                  <AccordionTrigger>What is the Knowledge tab?</AccordionTrigger>
                  <AccordionContent>
                    The Knowledge tab provides a Google Docs-style editor for creating and editing legal documents directly within the platform. Documents are automatically saved and can be updated in real-time.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Legal Analysis
                <Badge variant="outline">Analysis</Badge>
              </CardTitle>
              <CardDescription>
                AI-powered legal research and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="case-analysis">
                  <AccordionTrigger>How does case analysis work?</AccordionTrigger>
                  <AccordionContent>
                    The system analyzes uploaded documents and client information to provide comprehensive legal analysis, including case strengths and weaknesses, relevant law references, and potential outcomes based on Texas law.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="contract-review">
                  <AccordionTrigger>What is Contract Review?</AccordionTrigger>
                  <AccordionContent>
                    The Contracts tab provides AI-powered contract analysis specifically focused on Texas law. You can upload existing contracts for review or create new contracts using guided templates.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="discovery">
                  <AccordionTrigger>How does the Discovery feature work?</AccordionTrigger>
                  <AccordionContent>
                    The Discovery tab helps manage discovery requests and responses. The AI analyzes requests and generates appropriate responses based on case documents and Texas civil procedure rules.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Advanced Features
                <Badge variant="secondary">Pro</Badge>
              </CardTitle>
              <CardDescription>
                Advanced functionality for power users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="knowledge-base">
                  <AccordionTrigger>What is the Knowledge Base?</AccordionTrigger>
                  <AccordionContent>
                    The Knowledge page (available to super admins) contains a comprehensive database of Texas legal documents, statutes, and case law that powers the AI analysis across the platform.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="admin-features">
                  <AccordionTrigger>What admin features are available?</AccordionTrigger>
                  <AccordionContent>
                    Super administrators can access the Admin page to manage users, law firms, and system-wide settings. This includes user role management and firm organization tools.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Troubleshooting
                <Badge variant="destructive">Help</Badge>
              </CardTitle>
              <CardDescription>
                Common issues and solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="document-processing">
                  <AccordionTrigger>My document won't upload or process</AccordionTrigger>
                  <AccordionContent>
                    Ensure your document is in PDF or Word format and under the size limit. Check your internet connection and try refreshing the page. If issues persist, the document may contain complex formatting that requires manual review.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="slow-analysis">
                  <AccordionTrigger>Why is the AI analysis taking so long?</AccordionTrigger>
                  <AccordionContent>
                    AI analysis time depends on the complexity and volume of documents being processed. Large cases with many documents may take several minutes to analyze thoroughly. The system will show progress indicators during processing.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="access-issues">
                  <AccordionTrigger>I can't access certain features</AccordionTrigger>
                  <AccordionContent>
                    Some features like the Knowledge base and Admin panel are restricted to users with appropriate permissions. Contact your system administrator if you believe you should have access to these features.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
